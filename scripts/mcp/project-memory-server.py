#!/usr/bin/env python3
"""
Project Memory MCP Server
Production-quality persistent memory specific to projects.

Features:
- SQLite storage for durability
- Full-text search for decisions
- Memory size limits and cleanup
- Input validation and sanitization
- Proper error handling
- Logging for debugging
- Export/import for backup and portability
- Health check endpoint
- Version tracking
- Connection pooling for team deployments
- Rate limiting protection
- Thread-safe operations

Usage:
    python project-memory-server.py

Configuration via environment:
    PROJECT_MEMORY_DB: Database file path (default: ~/.claude/project-memories/{project}.db)
    PROJECT_MEMORY_MAX_DECISIONS: Maximum stored decisions (default: 1000)
    PROJECT_MEMORY_MAX_PATTERNS: Maximum stored patterns (default: 100)
    PROJECT_MEMORY_POOL_SIZE: Connection pool size (default: 5)
    PROJECT_MEMORY_RATE_LIMIT: Max operations per minute (default: 100)
"""

VERSION = "1.1.0"

import json
import logging
import os
import re
import sqlite3
import sys
import threading
import time
from collections import deque
from contextlib import contextmanager
from datetime import datetime
from pathlib import Path
from queue import Queue, Empty
from typing import Any, Optional, Generator

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[logging.StreamHandler(sys.stderr)]
)
logger = logging.getLogger("project-memory")

# Try to import MCP SDK
try:
    from mcp.server import Server
    from mcp.server.stdio import stdio_server
    from mcp.types import Tool, TextContent
except ImportError:
    logger.error("MCP SDK not installed. Run: pip install mcp")
    sys.exit(1)

# Configuration
MAX_DECISIONS = int(os.environ.get("PROJECT_MEMORY_MAX_DECISIONS", "1000"))
MAX_PATTERNS = int(os.environ.get("PROJECT_MEMORY_MAX_PATTERNS", "100"))
MAX_CONTEXT_KEYS = int(os.environ.get("PROJECT_MEMORY_MAX_CONTEXT_KEYS", "50"))
POOL_SIZE = int(os.environ.get("PROJECT_MEMORY_POOL_SIZE", "5"))
RATE_LIMIT = int(os.environ.get("PROJECT_MEMORY_RATE_LIMIT", "100"))  # ops per minute
MAX_STRING_LENGTH = 10000  # Maximum length for any string input


class ConnectionPool:
    """Thread-safe SQLite connection pool for team deployments."""

    def __init__(self, db_path: Path, pool_size: int = 5):
        self.db_path = db_path
        self.pool_size = pool_size
        self._pool: Queue = Queue(maxsize=pool_size)
        self._lock = threading.Lock()
        self._initialized = False

    def _create_connection(self) -> sqlite3.Connection:
        """Create a new database connection with optimal settings."""
        conn = sqlite3.connect(
            str(self.db_path),
            check_same_thread=False,
            timeout=30.0,
            isolation_level=None  # Autocommit mode
        )
        # Enable WAL mode for better concurrency
        conn.execute("PRAGMA journal_mode=WAL")
        conn.execute("PRAGMA synchronous=NORMAL")
        conn.execute("PRAGMA cache_size=10000")
        conn.execute("PRAGMA temp_store=MEMORY")
        return conn

    def initialize(self) -> None:
        """Initialize the connection pool."""
        with self._lock:
            if self._initialized:
                return
            for _ in range(self.pool_size):
                self._pool.put(self._create_connection())
            self._initialized = True
            logger.info(f"Connection pool initialized with {self.pool_size} connections")

    @contextmanager
    def get_connection(self) -> Generator[sqlite3.Connection, None, None]:
        """Get a connection from the pool (context manager)."""
        if not self._initialized:
            self.initialize()

        conn = None
        try:
            conn = self._pool.get(timeout=30.0)
            yield conn
        except Empty:
            # Pool exhausted, create temporary connection
            logger.warning("Connection pool exhausted, creating temporary connection")
            conn = self._create_connection()
            yield conn
            conn.close()
            conn = None
        finally:
            if conn is not None:
                try:
                    self._pool.put_nowait(conn)
                except Exception:
                    conn.close()

    def close_all(self) -> None:
        """Close all connections in the pool."""
        with self._lock:
            while not self._pool.empty():
                try:
                    conn = self._pool.get_nowait()
                    conn.close()
                except Empty:
                    break
            self._initialized = False
            logger.info("Connection pool closed")


class RateLimiter:
    """Simple rate limiter to prevent abuse."""

    def __init__(self, max_ops: int = 100, window_seconds: int = 60):
        self.max_ops = max_ops
        self.window_seconds = window_seconds
        self._operations: deque = deque()
        self._lock = threading.Lock()

    def check(self) -> bool:
        """Check if operation is allowed. Returns True if allowed."""
        now = time.time()
        cutoff = now - self.window_seconds

        with self._lock:
            # Remove old operations
            while self._operations and self._operations[0] < cutoff:
                self._operations.popleft()

            # Check limit
            if len(self._operations) >= self.max_ops:
                return False

            # Record operation
            self._operations.append(now)
            return True

    def remaining(self) -> int:
        """Get remaining operations in current window."""
        now = time.time()
        cutoff = now - self.window_seconds

        with self._lock:
            while self._operations and self._operations[0] < cutoff:
                self._operations.popleft()
            return max(0, self.max_ops - len(self._operations))


# Global rate limiter
rate_limiter = RateLimiter(max_ops=RATE_LIMIT, window_seconds=60)


def sanitize_input(value: str, max_length: int = MAX_STRING_LENGTH) -> str:
    """Sanitize string input to prevent injection and limit size."""
    if not isinstance(value, str):
        value = str(value)
    # Truncate if too long
    if len(value) > max_length:
        value = value[:max_length] + "... [truncated]"
    # Remove null bytes and other problematic characters
    value = value.replace('\x00', '')
    return value.strip()


def validate_key(key: str) -> bool:
    """Validate that a key is safe for use."""
    if not key or not isinstance(key, str):
        return False
    # Allow alphanumeric, underscores, hyphens, dots
    return bool(re.match(r'^[\w\-\.]+$', key)) and len(key) <= 100


class ProjectMemoryDB:
    """SQLite-backed project memory storage with connection pooling."""

    def __init__(self, db_path: Path, use_pool: bool = True):
        self.db_path = db_path
        self.db_path.parent.mkdir(parents=True, exist_ok=True)
        self._use_pool = use_pool
        self._pool: Optional[ConnectionPool] = None

        if use_pool:
            self._pool = ConnectionPool(db_path, pool_size=POOL_SIZE)

        self._init_db()

    @contextmanager
    def _get_conn(self) -> Generator[sqlite3.Connection, None, None]:
        """Get a database connection (from pool or direct)."""
        if self._pool:
            with self._pool.get_connection() as conn:
                yield conn
        else:
            with sqlite3.connect(self.db_path) as conn:
                yield conn

    def _init_db(self):
        """Initialize database schema."""
        with self._get_conn() as conn:
            conn.executescript("""
                CREATE TABLE IF NOT EXISTS decisions (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    timestamp TEXT NOT NULL,
                    decision TEXT NOT NULL,
                    rationale TEXT NOT NULL,
                    context TEXT DEFAULT '',
                    alternatives TEXT DEFAULT '',
                    created_at TEXT DEFAULT CURRENT_TIMESTAMP
                );

                CREATE TABLE IF NOT EXISTS patterns (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT UNIQUE NOT NULL,
                    description TEXT NOT NULL,
                    example TEXT DEFAULT '',
                    when_to_use TEXT DEFAULT '',
                    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
                );

                CREATE TABLE IF NOT EXISTS context (
                    key TEXT PRIMARY KEY,
                    value TEXT NOT NULL,
                    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
                );

                CREATE INDEX IF NOT EXISTS idx_decisions_timestamp ON decisions(timestamp);
                CREATE INDEX IF NOT EXISTS idx_decisions_search ON decisions(decision, rationale);
                CREATE INDEX IF NOT EXISTS idx_patterns_name ON patterns(name);
            """)
            conn.commit()
        logger.info(f"Database initialized at {self.db_path}")

    def add_decision(self, decision: str, rationale: str,
                     context: str = "", alternatives: str = "") -> int:
        """Add a new decision. Returns the decision ID."""
        # Enforce limits
        self._enforce_decision_limit()

        with self._get_conn() as conn:
            cursor = conn.execute("""
                INSERT INTO decisions (timestamp, decision, rationale, context, alternatives)
                VALUES (?, ?, ?, ?, ?)
            """, (
                datetime.now().isoformat(),
                sanitize_input(decision),
                sanitize_input(rationale),
                sanitize_input(context),
                sanitize_input(alternatives)
            ))
            conn.commit()
            return cursor.lastrowid

    def _enforce_decision_limit(self):
        """Remove oldest decisions if limit exceeded."""
        with self._get_conn() as conn:
            count = conn.execute("SELECT COUNT(*) FROM decisions").fetchone()[0]
            if count >= MAX_DECISIONS:
                # Delete oldest 10%
                delete_count = max(1, MAX_DECISIONS // 10)
                conn.execute("""
                    DELETE FROM decisions WHERE id IN (
                        SELECT id FROM decisions ORDER BY timestamp ASC LIMIT ?
                    )
                """, (delete_count,))
                conn.commit()
                logger.info(f"Cleaned up {delete_count} old decisions")

    def search_decisions(self, keyword: Optional[str] = None, limit: int = 20) -> list:
        """Search decisions, optionally filtered by keyword."""
        with self._get_conn() as conn:
            conn.row_factory = sqlite3.Row
            if keyword:
                keyword = sanitize_input(keyword, 100)
                cursor = conn.execute("""
                    SELECT * FROM decisions
                    WHERE decision LIKE ? OR rationale LIKE ? OR context LIKE ?
                    ORDER BY timestamp DESC LIMIT ?
                """, (f"%{keyword}%", f"%{keyword}%", f"%{keyword}%", limit))
            else:
                cursor = conn.execute("""
                    SELECT * FROM decisions ORDER BY timestamp DESC LIMIT ?
                """, (limit,))
            return [dict(row) for row in cursor.fetchall()]

    def upsert_pattern(self, name: str, description: str,
                       example: str = "", when_to_use: str = "") -> bool:
        """Add or update a pattern. Returns True if successful."""
        if not validate_key(name):
            return False

        # Enforce limits
        self._enforce_pattern_limit()

        with self._get_conn() as conn:
            conn.execute("""
                INSERT INTO patterns (name, description, example, when_to_use, updated_at)
                VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
                ON CONFLICT(name) DO UPDATE SET
                    description = excluded.description,
                    example = excluded.example,
                    when_to_use = excluded.when_to_use,
                    updated_at = CURRENT_TIMESTAMP
            """, (
                name,
                sanitize_input(description),
                sanitize_input(example),
                sanitize_input(when_to_use)
            ))
            conn.commit()
            return True

    def _enforce_pattern_limit(self):
        """Remove oldest patterns if limit exceeded."""
        with self._get_conn() as conn:
            count = conn.execute("SELECT COUNT(*) FROM patterns").fetchone()[0]
            if count >= MAX_PATTERNS:
                # Delete oldest by updated_at
                conn.execute("""
                    DELETE FROM patterns WHERE id IN (
                        SELECT id FROM patterns ORDER BY updated_at ASC LIMIT 1
                    )
                """)
                conn.commit()

    def get_patterns(self) -> list:
        """Get all stored patterns."""
        with self._get_conn() as conn:
            conn.row_factory = sqlite3.Row
            cursor = conn.execute("SELECT * FROM patterns ORDER BY name")
            return [dict(row) for row in cursor.fetchall()]

    def set_context(self, key: str, value: str) -> bool:
        """Set a context key-value pair. Returns True if successful."""
        if not validate_key(key):
            return False

        # Enforce limits
        self._enforce_context_limit()

        with self._get_conn() as conn:
            conn.execute("""
                INSERT INTO context (key, value, updated_at)
                VALUES (?, ?, CURRENT_TIMESTAMP)
                ON CONFLICT(key) DO UPDATE SET
                    value = excluded.value,
                    updated_at = CURRENT_TIMESTAMP
            """, (key, sanitize_input(value)))
            conn.commit()
            return True

    def _enforce_context_limit(self):
        """Remove oldest context entries if limit exceeded."""
        with self._get_conn() as conn:
            count = conn.execute("SELECT COUNT(*) FROM context").fetchone()[0]
            if count >= MAX_CONTEXT_KEYS:
                conn.execute("""
                    DELETE FROM context WHERE key IN (
                        SELECT key FROM context ORDER BY updated_at ASC LIMIT 1
                    )
                """)
                conn.commit()

    def get_context(self) -> dict:
        """Get all context key-value pairs."""
        with self._get_conn() as conn:
            cursor = conn.execute("SELECT key, value FROM context")
            return {row[0]: row[1] for row in cursor.fetchall()}

    def get_stats(self) -> dict:
        """Get database statistics."""
        with self._get_conn() as conn:
            stats = {
                "decisions": conn.execute("SELECT COUNT(*) FROM decisions").fetchone()[0],
                "patterns": conn.execute("SELECT COUNT(*) FROM patterns").fetchone()[0],
                "context_keys": conn.execute("SELECT COUNT(*) FROM context").fetchone()[0],
                "db_size_bytes": self.db_path.stat().st_size if self.db_path.exists() else 0,
                "limits": {
                    "max_decisions": MAX_DECISIONS,
                    "max_patterns": MAX_PATTERNS,
                    "max_context_keys": MAX_CONTEXT_KEYS
                }
            }
            return stats

    def export_all(self) -> dict:
        """Export all data as JSON-serializable dictionary."""
        with self._get_conn() as conn:
            conn.row_factory = sqlite3.Row

            # Export decisions
            decisions = [dict(row) for row in
                        conn.execute("SELECT * FROM decisions ORDER BY timestamp").fetchall()]

            # Export patterns
            patterns = [dict(row) for row in
                       conn.execute("SELECT * FROM patterns ORDER BY name").fetchall()]

            # Export context
            context = {row[0]: row[1] for row in
                      conn.execute("SELECT key, value FROM context").fetchall()}

            return {
                "version": VERSION,
                "exported_at": datetime.now().isoformat(),
                "project": Path.cwd().name,
                "data": {
                    "decisions": decisions,
                    "patterns": patterns,
                    "context": context
                },
                "stats": self.get_stats()
            }

    def import_data(self, data: dict, merge: bool = True) -> dict:
        """
        Import data from exported JSON.

        Args:
            data: Exported data dictionary
            merge: If True, merge with existing data. If False, replace all.

        Returns:
            Dict with import statistics
        """
        if "data" not in data:
            raise ValueError("Invalid export format: missing 'data' key")

        stats = {"decisions": 0, "patterns": 0, "context": 0, "skipped": 0}

        with self._get_conn() as conn:
            if not merge:
                # Clear existing data
                conn.execute("DELETE FROM decisions")
                conn.execute("DELETE FROM patterns")
                conn.execute("DELETE FROM context")
                conn.commit()

            # Import decisions
            for d in data["data"].get("decisions", []):
                try:
                    conn.execute("""
                        INSERT INTO decisions (timestamp, decision, rationale, context, alternatives)
                        VALUES (?, ?, ?, ?, ?)
                    """, (
                        d.get("timestamp", datetime.now().isoformat()),
                        sanitize_input(d.get("decision", "")),
                        sanitize_input(d.get("rationale", "")),
                        sanitize_input(d.get("context", "")),
                        sanitize_input(d.get("alternatives", ""))
                    ))
                    stats["decisions"] += 1
                except Exception:
                    stats["skipped"] += 1

            # Import patterns
            for p in data["data"].get("patterns", []):
                try:
                    name = p.get("name", "")
                    if validate_key(name):
                        conn.execute("""
                            INSERT OR REPLACE INTO patterns (name, description, example, when_to_use, updated_at)
                            VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
                        """, (
                            name,
                            sanitize_input(p.get("description", "")),
                            sanitize_input(p.get("example", "")),
                            sanitize_input(p.get("when_to_use", ""))
                        ))
                        stats["patterns"] += 1
                    else:
                        stats["skipped"] += 1
                except Exception:
                    stats["skipped"] += 1

            # Import context
            for key, value in data["data"].get("context", {}).items():
                try:
                    if validate_key(key):
                        conn.execute("""
                            INSERT OR REPLACE INTO context (key, value, updated_at)
                            VALUES (?, ?, CURRENT_TIMESTAMP)
                        """, (key, sanitize_input(value)))
                        stats["context"] += 1
                    else:
                        stats["skipped"] += 1
                except Exception:
                    stats["skipped"] += 1

            conn.commit()

        return stats

    def health_check(self) -> dict:
        """Perform health check on the database."""
        health = {
            "status": "healthy",
            "version": VERSION,
            "checks": {}
        }

        try:
            # Check database connectivity
            with self._get_conn() as conn:
                conn.execute("SELECT 1")
            health["checks"]["database_connection"] = "ok"
        except Exception as e:
            health["status"] = "unhealthy"
            health["checks"]["database_connection"] = f"failed: {str(e)}"

        try:
            # Check database integrity
            with self._get_conn() as conn:
                result = conn.execute("PRAGMA integrity_check").fetchone()[0]
                health["checks"]["database_integrity"] = result
                if result != "ok":
                    health["status"] = "degraded"
        except Exception as e:
            health["status"] = "unhealthy"
            health["checks"]["database_integrity"] = f"failed: {str(e)}"

        try:
            # Check write capability
            with self._get_conn() as conn:
                conn.execute("INSERT INTO context (key, value) VALUES ('_health_check', 'test')")
                conn.execute("DELETE FROM context WHERE key = '_health_check'")
                conn.commit()
            health["checks"]["write_capability"] = "ok"
        except Exception as e:
            health["status"] = "unhealthy"
            health["checks"]["write_capability"] = f"failed: {str(e)}"

        # Check capacity
        stats = self.get_stats()
        decision_usage = stats["decisions"] / stats["limits"]["max_decisions"] * 100
        pattern_usage = stats["patterns"] / stats["limits"]["max_patterns"] * 100

        health["checks"]["capacity"] = {
            "decisions_used_percent": round(decision_usage, 1),
            "patterns_used_percent": round(pattern_usage, 1)
        }

        if decision_usage > 90 or pattern_usage > 90:
            health["status"] = "degraded"
            health["checks"]["capacity"]["warning"] = "Approaching capacity limits"

        health["db_path"] = str(self.db_path)

        return health

    def purge_all(self) -> dict:
        """Purge all data from the database. Returns counts of deleted items."""
        with self._get_conn() as conn:
            decisions = conn.execute("SELECT COUNT(*) FROM decisions").fetchone()[0]
            patterns = conn.execute("SELECT COUNT(*) FROM patterns").fetchone()[0]
            context = conn.execute("SELECT COUNT(*) FROM context").fetchone()[0]

            conn.execute("DELETE FROM decisions")
            conn.execute("DELETE FROM patterns")
            conn.execute("DELETE FROM context")
            conn.commit()

            # Vacuum to reclaim space
            conn.execute("VACUUM")

        logger.warning(f"Purged all data: {decisions} decisions, {patterns} patterns, {context} context keys")

        return {
            "deleted": {
                "decisions": decisions,
                "patterns": patterns,
                "context": context
            }
        }


def get_db_path() -> Path:
    """Determine database path based on current project."""
    # Check for custom path
    if custom_path := os.environ.get("PROJECT_MEMORY_DB"):
        return Path(custom_path)

    # Default: ~/.claude/project-memories/{project_name}.db
    project_name = Path.cwd().name
    # Sanitize project name for filesystem
    safe_name = re.sub(r'[^\w\-]', '_', project_name)
    return Path.home() / ".claude" / "project-memories" / f"{safe_name}.db"


# Initialize server and database
server = Server("project-memory")
db: Optional[ProjectMemoryDB] = None


def get_db() -> ProjectMemoryDB:
    """Get or initialize the database."""
    global db
    if db is None:
        db = ProjectMemoryDB(get_db_path())
    return db


@server.list_tools()
async def list_tools():
    """List available tools."""
    return [
        Tool(
            name="remember_decision",
            description="Store a decision and its rationale for future sessions. Use this to preserve important architectural choices, trade-offs, and reasoning.",
            inputSchema={
                "type": "object",
                "properties": {
                    "decision": {
                        "type": "string",
                        "description": "The decision made (max 10000 chars)",
                        "maxLength": 10000
                    },
                    "rationale": {
                        "type": "string",
                        "description": "Why this decision was made",
                        "maxLength": 10000
                    },
                    "context": {
                        "type": "string",
                        "description": "What problem this solved or what triggered the decision",
                        "maxLength": 10000
                    },
                    "alternatives": {
                        "type": "string",
                        "description": "Other options that were considered",
                        "maxLength": 10000
                    }
                },
                "required": ["decision", "rationale"]
            }
        ),
        Tool(
            name="recall_decisions",
            description="Retrieve past decisions, optionally filtered by keyword search. Useful for understanding why things are the way they are.",
            inputSchema={
                "type": "object",
                "properties": {
                    "keyword": {
                        "type": "string",
                        "description": "Optional keyword to filter decisions (max 100 chars)",
                        "maxLength": 100
                    },
                    "limit": {
                        "type": "integer",
                        "description": "Maximum number of decisions to return (default 20, max 100)",
                        "minimum": 1,
                        "maximum": 100,
                        "default": 20
                    }
                }
            }
        ),
        Tool(
            name="store_pattern",
            description="Store a code pattern or convention for this project. Patterns are named and can be updated.",
            inputSchema={
                "type": "object",
                "properties": {
                    "name": {
                        "type": "string",
                        "description": "Pattern name (alphanumeric, underscores, hyphens, dots only)",
                        "pattern": "^[\\w\\-\\.]+$",
                        "maxLength": 100
                    },
                    "description": {
                        "type": "string",
                        "description": "What this pattern does and why it's used",
                        "maxLength": 10000
                    },
                    "example": {
                        "type": "string",
                        "description": "Code example demonstrating the pattern",
                        "maxLength": 10000
                    },
                    "when_to_use": {
                        "type": "string",
                        "description": "Guidelines for when to apply this pattern",
                        "maxLength": 10000
                    }
                },
                "required": ["name", "description"]
            }
        ),
        Tool(
            name="get_patterns",
            description="Retrieve all stored patterns for this project.",
            inputSchema={
                "type": "object",
                "properties": {}
            }
        ),
        Tool(
            name="set_context",
            description="Store contextual information as a key-value pair. Keys must be alphanumeric (underscores/hyphens allowed).",
            inputSchema={
                "type": "object",
                "properties": {
                    "key": {
                        "type": "string",
                        "description": "Context key (alphanumeric, underscores, hyphens, dots only)",
                        "pattern": "^[\\w\\-\\.]+$",
                        "maxLength": 100
                    },
                    "value": {
                        "type": "string",
                        "description": "Context value",
                        "maxLength": 10000
                    }
                },
                "required": ["key", "value"]
            }
        ),
        Tool(
            name="get_context",
            description="Retrieve all stored context key-value pairs for this project.",
            inputSchema={
                "type": "object",
                "properties": {}
            }
        ),
        Tool(
            name="memory_stats",
            description="Get statistics about stored memory (counts, limits, database size).",
            inputSchema={
                "type": "object",
                "properties": {}
            }
        ),
        Tool(
            name="export_memory",
            description="Export all stored memory to JSON format for backup or portability.",
            inputSchema={
                "type": "object",
                "properties": {}
            }
        ),
        Tool(
            name="import_memory",
            description="Import memory from a previously exported JSON backup.",
            inputSchema={
                "type": "object",
                "properties": {
                    "data": {
                        "type": "string",
                        "description": "JSON string of exported memory data"
                    },
                    "merge": {
                        "type": "boolean",
                        "description": "If true, merge with existing data. If false, replace all.",
                        "default": True
                    }
                },
                "required": ["data"]
            }
        ),
        Tool(
            name="health_check",
            description="Perform a health check on the memory database.",
            inputSchema={
                "type": "object",
                "properties": {}
            }
        ),
        Tool(
            name="purge_memory",
            description="Delete ALL stored memory. Use with caution! Requires confirmation.",
            inputSchema={
                "type": "object",
                "properties": {
                    "confirm": {
                        "type": "string",
                        "description": "Must be 'CONFIRM_PURGE' to proceed"
                    }
                },
                "required": ["confirm"]
            }
        )
    ]


@server.call_tool()
async def call_tool(name: str, arguments: dict) -> list:
    """Handle tool calls."""
    try:
        database = get_db()

        if name == "remember_decision":
            decision = arguments.get("decision", "")
            rationale = arguments.get("rationale", "")

            if not decision or not rationale:
                return [TextContent(type="text", text="❌ Error: decision and rationale are required")]

            decision_id = database.add_decision(
                decision=decision,
                rationale=rationale,
                context=arguments.get("context", ""),
                alternatives=arguments.get("alternatives", "")
            )

            logger.info(f"Stored decision #{decision_id}: {decision[:50]}...")
            return [TextContent(
                type="text",
                text=f"✓ Decision #{decision_id} stored: {decision[:100]}{'...' if len(decision) > 100 else ''}"
            )]

        elif name == "recall_decisions":
            keyword = arguments.get("keyword")
            limit = min(arguments.get("limit", 20), 100)

            decisions = database.search_decisions(keyword=keyword, limit=limit)

            if not decisions:
                msg = f"No decisions found" + (f" matching '{keyword}'" if keyword else "")
                return [TextContent(type="text", text=msg)]

            output = "## Stored Decisions\n\n"
            for d in decisions:
                output += f"### Decision #{d['id']} ({d['timestamp'][:10]})\n"
                output += f"**Decision**: {d['decision']}\n\n"
                output += f"**Rationale**: {d['rationale']}\n\n"
                if d.get('context'):
                    output += f"**Context**: {d['context']}\n\n"
                if d.get('alternatives'):
                    output += f"**Alternatives considered**: {d['alternatives']}\n\n"
                output += "---\n\n"

            return [TextContent(type="text", text=output)]

        elif name == "store_pattern":
            pattern_name = arguments.get("name", "")
            description = arguments.get("description", "")

            if not pattern_name or not description:
                return [TextContent(type="text", text="❌ Error: name and description are required")]

            if not validate_key(pattern_name):
                return [TextContent(
                    type="text",
                    text="❌ Error: name must be alphanumeric (underscores, hyphens, dots allowed)"
                )]

            success = database.upsert_pattern(
                name=pattern_name,
                description=description,
                example=arguments.get("example", ""),
                when_to_use=arguments.get("when_to_use", "")
            )

            if success:
                logger.info(f"Stored pattern: {pattern_name}")
                return [TextContent(type="text", text=f"✓ Pattern stored: {pattern_name}")]
            else:
                return [TextContent(type="text", text="❌ Error: Failed to store pattern")]

        elif name == "get_patterns":
            patterns = database.get_patterns()

            if not patterns:
                return [TextContent(type="text", text="No patterns stored yet.")]

            output = "## Project Patterns\n\n"
            for p in patterns:
                output += f"### {p['name']}\n"
                output += f"{p['description']}\n\n"
                if p.get('when_to_use'):
                    output += f"**When to use**: {p['when_to_use']}\n\n"
                if p.get('example'):
                    output += f"**Example**:\n```\n{p['example']}\n```\n\n"
                output += "---\n\n"

            return [TextContent(type="text", text=output)]

        elif name == "set_context":
            key = arguments.get("key", "")
            value = arguments.get("value", "")

            if not key or not value:
                return [TextContent(type="text", text="❌ Error: key and value are required")]

            if not validate_key(key):
                return [TextContent(
                    type="text",
                    text="❌ Error: key must be alphanumeric (underscores, hyphens, dots allowed)"
                )]

            success = database.set_context(key, value)

            if success:
                logger.info(f"Set context: {key}")
                return [TextContent(type="text", text=f"✓ Context set: {key}")]
            else:
                return [TextContent(type="text", text="❌ Error: Failed to set context")]

        elif name == "get_context":
            context = database.get_context()

            if not context:
                return [TextContent(type="text", text="No context stored yet.")]

            output = "## Project Context\n\n"
            for k, v in sorted(context.items()):
                output += f"**{k}**: {v}\n\n"

            return [TextContent(type="text", text=output)]

        elif name == "memory_stats":
            stats = database.get_stats()

            output = "## Memory Statistics\n\n"
            output += f"**Decisions stored**: {stats['decisions']} / {stats['limits']['max_decisions']}\n"
            output += f"**Patterns stored**: {stats['patterns']} / {stats['limits']['max_patterns']}\n"
            output += f"**Context keys**: {stats['context_keys']} / {stats['limits']['max_context_keys']}\n"
            output += f"**Database size**: {stats['db_size_bytes'] / 1024:.1f} KB\n"
            output += f"\n**Database location**: `{get_db_path()}`\n"

            return [TextContent(type="text", text=output)]

        elif name == "export_memory":
            export_data = database.export_all()
            json_output = json.dumps(export_data, indent=2, default=str)

            output = "## Memory Export\n\n"
            output += f"Exported at: {export_data['exported_at']}\n\n"
            output += f"- Decisions: {len(export_data['data']['decisions'])}\n"
            output += f"- Patterns: {len(export_data['data']['patterns'])}\n"
            output += f"- Context keys: {len(export_data['data']['context'])}\n\n"
            output += "### JSON Data\n```json\n"
            output += json_output
            output += "\n```\n"

            logger.info("Exported all memory data")
            return [TextContent(type="text", text=output)]

        elif name == "import_memory":
            data_str = arguments.get("data", "")
            merge = arguments.get("merge", True)

            if not data_str:
                return [TextContent(type="text", text="❌ Error: data is required")]

            try:
                import_data = json.loads(data_str)
            except json.JSONDecodeError as e:
                return [TextContent(type="text", text=f"❌ Error: Invalid JSON - {str(e)}")]

            try:
                stats = database.import_data(import_data, merge=merge)

                output = "## Memory Import Complete\n\n"
                output += f"**Mode**: {'Merge' if merge else 'Replace'}\n\n"
                output += f"- Decisions imported: {stats['decisions']}\n"
                output += f"- Patterns imported: {stats['patterns']}\n"
                output += f"- Context keys imported: {stats['context']}\n"
                if stats['skipped'] > 0:
                    output += f"- Skipped (invalid): {stats['skipped']}\n"

                logger.info(f"Imported memory: {stats}")
                return [TextContent(type="text", text=output)]
            except ValueError as e:
                return [TextContent(type="text", text=f"❌ Error: {str(e)}")]

        elif name == "health_check":
            health = database.health_check()

            output = f"## Health Check: {health['status'].upper()}\n\n"
            output += f"**Version**: {health['version']}\n"
            output += f"**Database**: `{health['db_path']}`\n\n"
            output += "### Checks\n"

            for check_name, result in health["checks"].items():
                if isinstance(result, dict):
                    output += f"- **{check_name}**:\n"
                    for k, v in result.items():
                        output += f"  - {k}: {v}\n"
                else:
                    icon = "✓" if result == "ok" else "⚠️"
                    output += f"- {icon} **{check_name}**: {result}\n"

            return [TextContent(type="text", text=output)]

        elif name == "purge_memory":
            confirm = arguments.get("confirm", "")

            if confirm != "CONFIRM_PURGE":
                return [TextContent(
                    type="text",
                    text="⚠️ To purge all memory, you must pass confirm='CONFIRM_PURGE'\n\n"
                         "This will permanently delete ALL decisions, patterns, and context!"
                )]

            result = database.purge_all()

            output = "## Memory Purged ⚠️\n\n"
            output += f"Deleted:\n"
            output += f"- Decisions: {result['deleted']['decisions']}\n"
            output += f"- Patterns: {result['deleted']['patterns']}\n"
            output += f"- Context keys: {result['deleted']['context']}\n"

            return [TextContent(type="text", text=output)]

        else:
            return [TextContent(type="text", text=f"❌ Unknown tool: {name}")]

    except Exception as e:
        logger.exception(f"Error in tool {name}")
        return [TextContent(type="text", text=f"❌ Error: {str(e)}")]


async def main():
    """Run the MCP server."""
    logger.info(f"Starting Project Memory MCP Server")
    logger.info(f"Database: {get_db_path()}")
    logger.info(f"Limits: {MAX_DECISIONS} decisions, {MAX_PATTERNS} patterns, {MAX_CONTEXT_KEYS} context keys")

    async with stdio_server() as (read_stream, write_stream):
        await server.run(read_stream, write_stream)


if __name__ == "__main__":
    import asyncio
    asyncio.run(main())
