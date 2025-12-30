"""
Performance Tests for MCP Server

These tests measure performance characteristics:
- Connection pool efficiency
- Rate limiter behavior
- Concurrent operation handling
- Memory usage under load

Run with: pytest tests/mcp/test_performance.py -v
"""

import os
import sys
import time
import tempfile
import threading
import statistics
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor, as_completed

import pytest

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent.parent / "scripts" / "mcp"))

# Import after path setup
from project_memory_server import (
    ProjectMemoryDB,
    ConnectionPool,
    RateLimiter,
    sanitize_input,
    validate_key,
)


class TestConnectionPoolPerformance:
    """Test connection pool performance characteristics."""

    @pytest.fixture
    def temp_db(self):
        """Create a temporary database."""
        with tempfile.NamedTemporaryFile(suffix=".db", delete=False) as f:
            db_path = Path(f.name)
        yield db_path
        # Cleanup
        if db_path.exists():
            db_path.unlink()
        # Also cleanup WAL and SHM files
        for ext in ["-wal", "-shm"]:
            wal_path = Path(str(db_path) + ext)
            if wal_path.exists():
                wal_path.unlink()

    def test_pool_initialization_time(self, temp_db):
        """Pool initialization should complete quickly."""
        start = time.perf_counter()
        pool = ConnectionPool(temp_db, pool_size=5)
        pool.initialize()
        elapsed = time.perf_counter() - start

        assert elapsed < 1.0, f"Pool initialization took {elapsed:.2f}s (expected <1s)"
        pool.close_all()

    def test_connection_acquisition_time(self, temp_db):
        """Getting a connection should be fast."""
        pool = ConnectionPool(temp_db, pool_size=5)
        pool.initialize()

        times = []
        for _ in range(100):
            start = time.perf_counter()
            with pool.get_connection() as conn:
                conn.execute("SELECT 1")
            elapsed = time.perf_counter() - start
            times.append(elapsed)

        pool.close_all()

        avg_time = statistics.mean(times)
        max_time = max(times)

        assert avg_time < 0.01, f"Average acquisition time {avg_time:.4f}s (expected <0.01s)"
        assert max_time < 0.1, f"Max acquisition time {max_time:.4f}s (expected <0.1s)"

    def test_concurrent_connections(self, temp_db):
        """Pool should handle concurrent access efficiently."""
        pool = ConnectionPool(temp_db, pool_size=5)
        pool.initialize()

        results = []
        errors = []

        def worker(worker_id):
            try:
                for _ in range(20):
                    with pool.get_connection() as conn:
                        conn.execute("SELECT 1")
                        time.sleep(0.001)  # Simulate small work
                return worker_id
            except Exception as e:
                errors.append(str(e))
                return None

        start = time.perf_counter()

        with ThreadPoolExecutor(max_workers=10) as executor:
            futures = [executor.submit(worker, i) for i in range(10)]
            results = [f.result() for f in as_completed(futures)]

        elapsed = time.perf_counter() - start
        pool.close_all()

        assert len(errors) == 0, f"Errors occurred: {errors}"
        assert elapsed < 5.0, f"Concurrent test took {elapsed:.2f}s (expected <5s)"

    def test_pool_exhaustion_recovery(self, temp_db):
        """Pool should handle exhaustion gracefully."""
        pool = ConnectionPool(temp_db, pool_size=2)  # Small pool
        pool.initialize()

        held_connections = []
        errors = []

        def holder():
            """Hold a connection for a while."""
            try:
                with pool.get_connection() as conn:
                    conn.execute("SELECT 1")
                    time.sleep(0.5)
            except Exception as e:
                errors.append(str(e))

        def requester():
            """Request connection while pool might be exhausted."""
            try:
                with pool.get_connection() as conn:
                    conn.execute("SELECT 1")
            except Exception as e:
                errors.append(str(e))

        # Start holders
        threads = [threading.Thread(target=holder) for _ in range(3)]
        for t in threads:
            t.start()

        # Give holders time to acquire
        time.sleep(0.1)

        # Try to request while pool is exhausted
        requester()

        for t in threads:
            t.join()

        pool.close_all()

        # Should not have fatal errors (temporary connections are okay)
        assert len([e for e in errors if "fatal" in e.lower()]) == 0


class TestRateLimiterPerformance:
    """Test rate limiter performance characteristics."""

    def test_rate_limiter_accuracy(self):
        """Rate limiter should accurately count operations."""
        limiter = RateLimiter(max_ops=100, window_seconds=60)

        # Do 50 operations
        for _ in range(50):
            assert limiter.check() is True

        assert limiter.remaining() == 50

        # Do 50 more
        for _ in range(50):
            assert limiter.check() is True

        # Should be at limit
        assert limiter.remaining() == 0
        assert limiter.check() is False

    def test_rate_limiter_window_expiry(self):
        """Rate limiter should reset after window expires."""
        limiter = RateLimiter(max_ops=10, window_seconds=0.1)  # 100ms window

        # Use up limit
        for _ in range(10):
            limiter.check()

        assert limiter.check() is False

        # Wait for window to expire
        time.sleep(0.15)

        # Should be allowed again
        assert limiter.check() is True

    def test_rate_limiter_check_speed(self):
        """Rate limit checks should be very fast."""
        limiter = RateLimiter(max_ops=10000, window_seconds=60)

        times = []
        for _ in range(1000):
            start = time.perf_counter()
            limiter.check()
            elapsed = time.perf_counter() - start
            times.append(elapsed)

        avg_time = statistics.mean(times)
        assert avg_time < 0.0001, f"Average check time {avg_time:.6f}s (expected <0.0001s)"

    def test_rate_limiter_thread_safety(self):
        """Rate limiter should be thread-safe."""
        limiter = RateLimiter(max_ops=100, window_seconds=60)
        successful = []
        lock = threading.Lock()

        def worker():
            count = 0
            for _ in range(20):
                if limiter.check():
                    count += 1
            with lock:
                successful.append(count)

        threads = [threading.Thread(target=worker) for _ in range(10)]
        for t in threads:
            t.start()
        for t in threads:
            t.join()

        # Total successful should not exceed limit
        total = sum(successful)
        assert total <= 100, f"Rate limiter allowed {total} operations (limit: 100)"


class TestDatabasePerformance:
    """Test database operation performance."""

    @pytest.fixture
    def db(self):
        """Create a temporary database."""
        with tempfile.NamedTemporaryFile(suffix=".db", delete=False) as f:
            db_path = Path(f.name)
        database = ProjectMemoryDB(db_path, use_pool=True)
        yield database
        # Cleanup
        if db_path.exists():
            db_path.unlink()
        for ext in ["-wal", "-shm"]:
            wal_path = Path(str(db_path) + ext)
            if wal_path.exists():
                wal_path.unlink()

    def test_decision_insert_speed(self, db):
        """Decision inserts should be fast."""
        times = []
        for i in range(100):
            start = time.perf_counter()
            db.add_decision(
                decision=f"Decision {i}",
                rationale=f"Rationale for decision {i}",
                context="Performance testing"
            )
            elapsed = time.perf_counter() - start
            times.append(elapsed)

        avg_time = statistics.mean(times)
        p99_time = sorted(times)[98]

        assert avg_time < 0.05, f"Average insert time {avg_time:.4f}s (expected <0.05s)"
        assert p99_time < 0.1, f"P99 insert time {p99_time:.4f}s (expected <0.1s)"

    def test_decision_search_speed(self, db):
        """Decision searches should be fast."""
        # Insert test data
        for i in range(500):
            db.add_decision(
                decision=f"Decision {i} about {'security' if i % 5 == 0 else 'performance'}",
                rationale=f"Rationale {i}"
            )

        # Search performance
        times = []
        for _ in range(50):
            start = time.perf_counter()
            results = db.search_decisions(keyword="security", limit=20)
            elapsed = time.perf_counter() - start
            times.append(elapsed)

        avg_time = statistics.mean(times)
        assert avg_time < 0.1, f"Average search time {avg_time:.4f}s (expected <0.1s)"

    def test_pattern_upsert_speed(self, db):
        """Pattern upserts should be fast."""
        times = []
        for i in range(50):
            start = time.perf_counter()
            db.upsert_pattern(
                name=f"pattern_{i}",
                description=f"Description for pattern {i}",
                example=f"Example code {i}"
            )
            elapsed = time.perf_counter() - start
            times.append(elapsed)

        avg_time = statistics.mean(times)
        assert avg_time < 0.05, f"Average upsert time {avg_time:.4f}s (expected <0.05s)"

    def test_export_speed(self, db):
        """Exports should complete in reasonable time."""
        # Insert test data
        for i in range(200):
            db.add_decision(decision=f"Decision {i}", rationale=f"Rationale {i}")
            if i < 50:
                db.upsert_pattern(name=f"pattern_{i}", description=f"Desc {i}")
            if i < 30:
                db.set_context(f"key_{i}", f"value_{i}")

        start = time.perf_counter()
        export = db.export_all()
        elapsed = time.perf_counter() - start

        assert elapsed < 1.0, f"Export took {elapsed:.2f}s (expected <1s)"
        assert len(export["data"]["decisions"]) == 200

    def test_health_check_speed(self, db):
        """Health checks should be fast."""
        times = []
        for _ in range(20):
            start = time.perf_counter()
            health = db.health_check()
            elapsed = time.perf_counter() - start
            times.append(elapsed)

        avg_time = statistics.mean(times)
        assert avg_time < 0.1, f"Average health check time {avg_time:.4f}s (expected <0.1s)"
        assert health["status"] == "healthy"


class TestInputSanitizationPerformance:
    """Test input sanitization performance."""

    def test_sanitize_short_strings(self):
        """Sanitizing short strings should be very fast."""
        short = "Hello, world!" * 10

        times = []
        for _ in range(10000):
            start = time.perf_counter()
            sanitize_input(short)
            elapsed = time.perf_counter() - start
            times.append(elapsed)

        avg_time = statistics.mean(times)
        assert avg_time < 0.00001, f"Average sanitize time {avg_time:.8f}s"

    def test_sanitize_long_strings(self):
        """Sanitizing long strings (with truncation) should be fast."""
        long_string = "A" * 50000  # Will be truncated

        times = []
        for _ in range(1000):
            start = time.perf_counter()
            result = sanitize_input(long_string)
            elapsed = time.perf_counter() - start
            times.append(elapsed)

        avg_time = statistics.mean(times)
        assert avg_time < 0.001, f"Average sanitize time {avg_time:.6f}s"
        assert len(result) <= 10015  # Max + truncation message

    def test_validate_key_speed(self):
        """Key validation should be very fast."""
        keys = ["valid_key", "also-valid", "with.dots", "invalid key!", "a" * 200]

        times = []
        for key in keys:
            for _ in range(2000):
                start = time.perf_counter()
                validate_key(key)
                elapsed = time.perf_counter() - start
                times.append(elapsed)

        avg_time = statistics.mean(times)
        assert avg_time < 0.00001, f"Average validation time {avg_time:.8f}s"


class TestMemoryUsage:
    """Test memory usage characteristics."""

    @pytest.fixture
    def db(self):
        """Create a temporary database."""
        with tempfile.NamedTemporaryFile(suffix=".db", delete=False) as f:
            db_path = Path(f.name)
        database = ProjectMemoryDB(db_path, use_pool=True)
        yield database
        # Cleanup
        if db_path.exists():
            db_path.unlink()
        for ext in ["-wal", "-shm"]:
            wal_path = Path(str(db_path) + ext)
            if wal_path.exists():
                wal_path.unlink()

    def test_large_decision_storage(self, db):
        """Should handle large decisions efficiently."""
        large_decision = "A" * 9000
        large_rationale = "B" * 9000

        db.add_decision(decision=large_decision, rationale=large_rationale)

        results = db.search_decisions(limit=1)
        assert len(results) == 1
        assert len(results[0]["decision"]) == 9000

    def test_many_decisions_limit_enforcement(self, db):
        """Should enforce decision limits and cleanup old entries."""
        # Temporarily lower limit for testing
        import project_memory_server
        original_limit = project_memory_server.MAX_DECISIONS
        project_memory_server.MAX_DECISIONS = 100

        try:
            # Insert more than limit
            for i in range(150):
                db.add_decision(decision=f"Decision {i}", rationale=f"Rationale {i}")

            stats = db.get_stats()
            # Should have cleaned up oldest 10%
            assert stats["decisions"] <= 100
        finally:
            project_memory_server.MAX_DECISIONS = original_limit


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
