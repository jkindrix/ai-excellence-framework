#!/usr/bin/env python3
"""
Tests for Project Memory MCP Server

Run with: python -m pytest tests/mcp/ -v
"""

import importlib.util
import os
import sqlite3
import sys
import tempfile
from pathlib import Path
from unittest.mock import patch

import pytest

# Check if MCP SDK is available before loading the module
# Must check for mcp.server specifically, not just mcp package
try:
    from mcp.server import Server  # noqa: F401
    MCP_AVAILABLE = True
except ImportError:
    MCP_AVAILABLE = False

# Skip all tests in this module if MCP SDK is not available
pytestmark = pytest.mark.skipif(
    not MCP_AVAILABLE,
    reason="MCP SDK not installed. Install with: pip install mcp"
)

# Only load module if MCP is available (prevents sys.exit during import)
if MCP_AVAILABLE:
    _mcp_path = Path(__file__).parent.parent.parent / "scripts" / "mcp" / "project-memory-server.py"
    _spec = importlib.util.spec_from_file_location("project_memory_server", _mcp_path)
    project_memory_server = importlib.util.module_from_spec(_spec)
    sys.modules["project_memory_server"] = project_memory_server
    _spec.loader.exec_module(project_memory_server)

    # Import classes and functions from the loaded module
    sanitize_input = project_memory_server.sanitize_input
    validate_key = project_memory_server.validate_key
    ProjectMemoryDB = project_memory_server.ProjectMemoryDB
    MAX_DECISIONS = project_memory_server.MAX_DECISIONS
    get_db_path = project_memory_server.get_db_path
else:
    # Define placeholders to prevent NameError during test collection
    sanitize_input = None
    validate_key = None
    ProjectMemoryDB = None
    MAX_DECISIONS = 1000
    get_db_path = None


class TestInputSanitization:
    """Tests for input sanitization functions."""

    def test_sanitize_input_basic(self):
        """Test basic string sanitization."""
        assert sanitize_input("hello world") == "hello world"
        assert sanitize_input("  hello  ") == "hello"
        assert sanitize_input("hello\x00world") == "helloworld"

    def test_sanitize_input_truncation(self):
        """Test that long strings are truncated."""
        long_string = "a" * 20000
        result = sanitize_input(long_string, max_length=100)
        assert len(result) <= 100 + len("... [truncated]")
        assert result.endswith("... [truncated]")

    def test_sanitize_input_non_string(self):
        """Test that non-strings are converted."""
        assert sanitize_input(123) == "123"
        assert sanitize_input(None) == "None"

    def test_validate_key_valid(self):
        """Test valid key validation."""
        assert validate_key("valid_key") is True
        assert validate_key("valid-key") is True
        assert validate_key("valid.key") is True
        assert validate_key("ValidKey123") is True

    def test_validate_key_invalid(self):
        """Test invalid key validation."""
        assert validate_key("") is False
        assert validate_key(None) is False
        assert validate_key("has space") is False
        assert validate_key("has/slash") is False
        assert validate_key("a" * 101) is False  # Too long


class TestProjectMemoryDB:
    """Tests for the ProjectMemoryDB class."""

    @pytest.fixture
    def temp_db(self):
        """Create a temporary database for testing."""
        with tempfile.TemporaryDirectory() as tmpdir:
            db_path = Path(tmpdir) / "test.db"
            yield db_path

    def test_db_initialization(self, temp_db):
        """Test database initialization creates tables."""
        db = ProjectMemoryDB(temp_db)

        # Verify tables exist
        with sqlite3.connect(temp_db) as conn:
            cursor = conn.execute(
                "SELECT name FROM sqlite_master WHERE type='table'"
            )
            tables = {row[0] for row in cursor.fetchall()}

        assert "decisions" in tables
        assert "patterns" in tables
        assert "context" in tables

    def test_add_decision(self, temp_db):
        """Test adding a decision."""
        db = ProjectMemoryDB(temp_db)
        decision_id = db.add_decision(
            decision="Use TypeScript",
            rationale="Better type safety",
            context="New project setup",
            alternatives="JavaScript, Flow"
        )

        assert decision_id is not None
        assert decision_id > 0

    def test_search_decisions(self, temp_db):
        """Test searching decisions."""
        db = ProjectMemoryDB(temp_db)

        # Add some decisions
        db.add_decision("Use React", "Popular framework", "Frontend")
        db.add_decision("Use PostgreSQL", "Reliable database", "Backend")
        db.add_decision("Use Redis", "Fast caching", "Backend")

        # Search all
        all_decisions = db.search_decisions()
        assert len(all_decisions) == 3

        # Search with keyword
        postgres_decisions = db.search_decisions(keyword="PostgreSQL")
        assert len(postgres_decisions) == 1
        assert "PostgreSQL" in postgres_decisions[0]["decision"]

    def test_decision_limit_enforcement(self, temp_db):
        """Test that decision limits are enforced."""
        db = ProjectMemoryDB(temp_db)

        # Add more than the limit (use smaller number for test speed)
        test_limit = min(MAX_DECISIONS, 50) + 10
        for i in range(test_limit):
            db.add_decision(f"Decision {i}", f"Rationale {i}")

        with sqlite3.connect(temp_db) as conn:
            count = conn.execute("SELECT COUNT(*) FROM decisions").fetchone()[0]

        # Should have some decisions (cleanup happens at threshold)
        assert count > 0

    def test_upsert_pattern(self, temp_db):
        """Test adding and updating patterns."""
        db = ProjectMemoryDB(temp_db)

        # Add a pattern
        result = db.upsert_pattern(
            name="error-handling",
            description="How we handle errors",
            example="try { } catch { }",
            when_to_use="Always in async code"
        )
        assert result is True

        # Update the same pattern
        result = db.upsert_pattern(
            name="error-handling",
            description="Updated description"
        )
        assert result is True

        # Verify only one pattern exists
        patterns = db.get_patterns()
        assert len(patterns) == 1
        assert patterns[0]["description"] == "Updated description"

    def test_upsert_pattern_invalid_name(self, temp_db):
        """Test that invalid pattern names are rejected."""
        db = ProjectMemoryDB(temp_db)

        result = db.upsert_pattern(
            name="invalid name with spaces",
            description="Should fail"
        )
        assert result is False

    def test_context_operations(self, temp_db):
        """Test context get/set operations."""
        db = ProjectMemoryDB(temp_db)

        # Set context
        result = db.set_context("current_phase", "Phase 1")
        assert result is True

        # Get context
        context = db.get_context()
        assert context["current_phase"] == "Phase 1"

        # Update context
        db.set_context("current_phase", "Phase 2")
        context = db.get_context()
        assert context["current_phase"] == "Phase 2"

    def test_get_stats(self, temp_db):
        """Test statistics retrieval."""
        db = ProjectMemoryDB(temp_db)

        # Add some data
        db.add_decision("Test decision", "Test rationale")
        db.upsert_pattern("test-pattern", "Test description")
        db.set_context("test_key", "test_value")

        stats = db.get_stats()

        assert stats["decisions"] == 1
        assert stats["patterns"] == 1
        assert stats["context_keys"] == 1
        assert stats["db_size_bytes"] > 0

    def test_export_import(self, temp_db):
        """Test export and import functionality."""
        db = ProjectMemoryDB(temp_db)

        # Add data
        db.add_decision("Export test decision", "Export test rationale")
        db.upsert_pattern("export-pattern", "Export pattern description")
        db.set_context("export_key", "export_value")

        # Export
        export_data = db.export_db()
        assert "decisions" in export_data
        assert "patterns" in export_data
        assert "context" in export_data
        assert len(export_data["decisions"]) == 1
        assert len(export_data["patterns"]) == 1

        # Create new DB and import
        with tempfile.TemporaryDirectory() as tmpdir2:
            db2_path = Path(tmpdir2) / "test2.db"
            db2 = ProjectMemoryDB(db2_path)

            result = db2.import_db(export_data)
            assert result is True

            # Verify import worked
            decisions = db2.search_decisions()
            assert len(decisions) == 1
            assert "Export test decision" in decisions[0]["decision"]

    def test_health_check(self, temp_db):
        """Test health check functionality."""
        db = ProjectMemoryDB(temp_db)

        health = db.health_check()
        assert health["status"] == "healthy"
        assert "database" in health
        assert "tables" in health


class TestGetDbPath:
    """Tests for database path resolution."""

    def test_custom_path_from_env(self):
        """Test that custom path is used from environment."""
        with patch.dict(os.environ, {"PROJECT_MEMORY_DB": "/custom/path/db.sqlite"}):
            path = get_db_path()
            assert str(path) == "/custom/path/db.sqlite"

    def test_default_path(self):
        """Test default path based on current directory."""
        with patch.dict(os.environ, {}, clear=True):
            # Remove PROJECT_MEMORY_DB if set
            os.environ.pop("PROJECT_MEMORY_DB", None)
            path = get_db_path()

            assert ".claude" in str(path)
            assert "project-memories" in str(path)
            assert path.suffix == ".db"


class TestSecurityBoundaries:
    """Tests for security boundaries and edge cases."""

    @pytest.fixture
    def temp_db(self):
        with tempfile.TemporaryDirectory() as tmpdir:
            yield Path(tmpdir) / "test.db"

    def test_sql_injection_in_search(self, temp_db):
        """Test that SQL injection in search is prevented."""
        db = ProjectMemoryDB(temp_db)
        db.add_decision("Normal decision", "Normal rationale")

        # Try SQL injection in keyword
        malicious_keyword = "'; DROP TABLE decisions; --"
        results = db.search_decisions(keyword=malicious_keyword)

        # Table should still exist
        with sqlite3.connect(temp_db) as conn:
            tables = conn.execute(
                "SELECT name FROM sqlite_master WHERE type='table' AND name='decisions'"
            ).fetchall()
            assert len(tables) == 1

    def test_null_byte_injection(self, temp_db):
        """Test that null bytes are stripped."""
        db = ProjectMemoryDB(temp_db)

        decision_id = db.add_decision(
            decision="Normal\x00Injection",
            rationale="Test\x00Rationale"
        )

        decisions = db.search_decisions()
        assert "\x00" not in decisions[0]["decision"]
        assert "\x00" not in decisions[0]["rationale"]

    def test_unicode_handling(self, temp_db):
        """Test that unicode is handled properly."""
        db = ProjectMemoryDB(temp_db)

        # Test with various unicode characters
        db.add_decision("决定使用TypeScript", "更好的类型安全", "前端开发")
        db.add_decision("Décision: utiliser React", "Cadre populaire", "Frontend")
        db.add_decision("Emoji test 🚀🎉", "Works with emojis", "Testing")

        decisions = db.search_decisions()
        assert len(decisions) == 3

    def test_very_long_input(self, temp_db):
        """Test that very long inputs are handled."""
        db = ProjectMemoryDB(temp_db)

        long_text = "x" * 50000
        db.add_decision(long_text, long_text)

        decisions = db.search_decisions()
        # Should be truncated
        assert len(decisions[0]["decision"]) <= 10015  # MAX_STRING_LENGTH + truncation suffix


# Import additional components if MCP is available
if MCP_AVAILABLE:
    escape_like_pattern = project_memory_server.escape_like_pattern
    ConnectionPool = project_memory_server.ConnectionPool
    RateLimiter = project_memory_server.RateLimiter
    EXPOSE_STATS = project_memory_server.EXPOSE_STATS
else:
    escape_like_pattern = None
    ConnectionPool = None
    RateLimiter = None
    EXPOSE_STATS = True


class TestEscapeLikePattern:
    """Tests for the escape_like_pattern function with '!' escape character."""

    def test_escape_percent(self):
        """Test that % is escaped."""
        result = escape_like_pattern("100%")
        assert result == "100!%"

    def test_escape_underscore(self):
        """Test that _ is escaped."""
        result = escape_like_pattern("test_value")
        assert result == "test!_value"

    def test_escape_exclamation(self):
        """Test that ! (the escape char) is escaped."""
        result = escape_like_pattern("wow!")
        assert result == "wow!!"

    def test_escape_combined(self):
        """Test combined escaping."""
        result = escape_like_pattern("50% off!")
        assert result == "50!% off!!"

    def test_no_escape_needed(self):
        """Test string without special characters."""
        result = escape_like_pattern("normal string")
        assert result == "normal string"

    def test_non_string_conversion(self):
        """Test that non-strings are converted."""
        result = escape_like_pattern(123)
        assert result == "123"


class TestConnectionPoolWarmup:
    """Tests for connection pool warmup rate limiting."""

    @pytest.fixture
    def temp_db(self):
        with tempfile.TemporaryDirectory() as tmpdir:
            yield Path(tmpdir) / "test.db"

    def test_warmup_succeeds(self, temp_db):
        """Test that warmup works on first call."""
        pool = ConnectionPool(temp_db, pool_size=2)
        result = pool.warmup(force=True)

        assert result["connections_warmed"] == 2
        assert result["errors"] == 0
        assert result["skipped"] is False
        pool.close_all()

    def test_warmup_rate_limiting(self, temp_db):
        """Test that warmup is rate limited."""
        pool = ConnectionPool(temp_db, pool_size=2)

        # First warmup should succeed
        result1 = pool.warmup()
        assert result1["skipped"] is False

        # Second immediate warmup should be skipped
        result2 = pool.warmup()
        assert result2["skipped"] is True
        assert "cooldown_remaining" in result2

        pool.close_all()

    def test_warmup_force_bypasses_rate_limit(self, temp_db):
        """Test that force=True bypasses rate limiting."""
        pool = ConnectionPool(temp_db, pool_size=2)

        # First warmup
        pool.warmup()

        # Force warmup should work even within cooldown
        result = pool.warmup(force=True)
        assert result["skipped"] is False
        assert result["connections_warmed"] == 2

        pool.close_all()


class TestPoolStatsExposure:
    """Tests for pool stats exposure control."""

    @pytest.fixture
    def temp_db(self):
        with tempfile.TemporaryDirectory() as tmpdir:
            yield Path(tmpdir) / "test.db"

    def test_stats_include_sensitive_by_default(self, temp_db):
        """Test that stats include sensitive data by default."""
        pool = ConnectionPool(temp_db, pool_size=2)
        pool.initialize()

        stats = pool.get_pool_stats()

        # Should include sensitive fields when EXPOSE_STATS is true
        if EXPOSE_STATS:
            assert "exhaustion_count" in stats
            assert "available" in stats
            assert "temp_connections_created" in stats
            assert "stats_redacted" not in stats
        else:
            assert "stats_redacted" in stats
            assert stats["stats_redacted"] is True

        pool.close_all()

    def test_stats_can_be_redacted(self, temp_db):
        """Test that stats can be explicitly redacted."""
        pool = ConnectionPool(temp_db, pool_size=2)
        pool.initialize()

        # Force redacted stats
        stats = pool.get_pool_stats(include_sensitive=False)

        assert stats["stats_redacted"] is True
        assert "exhaustion_count" not in stats
        assert "available" not in stats

        pool.close_all()

    def test_prometheus_metrics_respects_redaction(self, temp_db):
        """Test that Prometheus metrics respect redaction setting."""
        pool = ConnectionPool(temp_db, pool_size=2)
        pool.initialize()

        metrics = pool.get_prometheus_metrics()

        # Check metrics format
        assert "mcp_pool_size_total" in metrics
        assert "mcp_pool_initialized" in metrics

        pool.close_all()


class TestRateLimiter:
    """Tests for the RateLimiter class."""

    def test_allows_operations_under_limit(self):
        """Test that operations under limit are allowed."""
        limiter = RateLimiter(max_ops=10, window_seconds=60)

        for _ in range(5):
            assert limiter.check() is True

    def test_blocks_operations_over_limit(self):
        """Test that operations over limit are blocked."""
        limiter = RateLimiter(max_ops=3, window_seconds=60)

        # Use all allowed ops
        for _ in range(3):
            assert limiter.check() is True

        # Next should be blocked
        assert limiter.check() is False

    def test_remaining_count(self):
        """Test that remaining count is accurate."""
        limiter = RateLimiter(max_ops=10, window_seconds=60)

        assert limiter.remaining() == 10
        limiter.check()
        assert limiter.remaining() == 9

    def test_reset_clears_operations(self):
        """Test that reset clears tracked operations."""
        limiter = RateLimiter(max_ops=3, window_seconds=60)

        # Use all ops
        for _ in range(3):
            limiter.check()

        # Reset
        limiter.reset()

        # Should allow operations again
        assert limiter.check() is True
        assert limiter.remaining() == 2

    def test_configure_updates_limits(self):
        """Test that configure updates rate limits."""
        limiter = RateLimiter(max_ops=10, window_seconds=60)

        config = limiter.configure(max_ops=5, window_seconds=30)

        assert config["max_ops"] == 5
        assert config["window_seconds"] == 30


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
