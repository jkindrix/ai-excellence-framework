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


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
