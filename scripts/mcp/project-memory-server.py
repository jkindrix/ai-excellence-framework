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
import random
import re
import sqlite3
import sys
import threading
import time
import uuid
from collections import deque
from contextlib import contextmanager
from datetime import datetime
from pathlib import Path
from queue import Queue, Empty
from typing import Any, Optional, Generator

# Structured logging configuration
# Set STRUCTURED_LOGGING=true for JSON output (useful for log aggregation)
STRUCTURED_LOGGING = os.environ.get("STRUCTURED_LOGGING", "false").lower() == "true"


class StructuredFormatter(logging.Formatter):
    """JSON formatter for structured logging output."""

    def format(self, record: logging.LogRecord) -> str:
        log_data = {
            "timestamp": datetime.now().isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
        }

        # Add extra fields if present
        if hasattr(record, 'extra_data') and record.extra_data:
            log_data.update(record.extra_data)

        # Add exception info if present
        if record.exc_info:
            log_data["exception"] = self.formatException(record.exc_info)

        return json.dumps(log_data)


class StructuredLoggerAdapter(logging.LoggerAdapter):
    """Logger adapter that supports structured extra fields."""

    def process(self, msg, kwargs):
        # Move 'extra' dict content to be accessible by formatter
        extra = kwargs.get('extra', {})
        kwargs['extra'] = {'extra_data': extra}
        return msg, kwargs


def get_logger(name: str) -> logging.Logger | StructuredLoggerAdapter:
    """Get a logger with optional structured logging support."""
    base_logger = logging.getLogger(name)

    if STRUCTURED_LOGGING:
        return StructuredLoggerAdapter(base_logger, {})
    return base_logger


# Configure logging
if STRUCTURED_LOGGING:
    handler = logging.StreamHandler(sys.stderr)
    handler.setFormatter(StructuredFormatter())
    logging.basicConfig(
        level=logging.INFO,
        handlers=[handler]
    )
else:
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
        handlers=[logging.StreamHandler(sys.stderr)]
    )

logger = get_logger("project-memory")

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


# ============================================================================
# Structured Error Response System
# ============================================================================
# All error responses follow a consistent format for easier debugging and
# integration. The format includes:
# - error_code: Machine-readable error identifier (e.g., "VALIDATION_ERROR")
# - message: Human-readable error description
# - request_id: Unique identifier for log correlation
# - details: Optional additional context
#
# Error Codes:
#   VALIDATION_ERROR  - Input validation failed (missing/invalid parameters)
#   RATE_LIMIT_ERROR  - Rate limit exceeded
#   SIZE_LIMIT_ERROR  - Payload or data size exceeded
#   NOT_FOUND_ERROR   - Requested resource not found
#   PARSE_ERROR       - JSON parsing or format error
#   INTERNAL_ERROR    - Unexpected server error
#   AUTH_ERROR        - Authentication/authorization error
#   UNKNOWN_TOOL      - Unknown tool name requested


def format_error(
    error_code: str,
    message: str,
    request_id: str,
    details: Optional[str] = None
) -> str:
    """
    Format an error response with consistent structure.

    Args:
        error_code: Machine-readable error identifier (e.g., "VALIDATION_ERROR")
        message: Human-readable error description
        request_id: Unique request identifier for log correlation
        details: Optional additional context or suggestions

    Returns:
        Formatted error string for TextContent

    Example:
        >>> format_error("VALIDATION_ERROR", "key is required", "abc-123", "Provide a non-empty key")
        "❌ Error [VALIDATION_ERROR]: key is required\\n   Request ID: abc-123\\n   Details: Provide a non-empty key"
    """
    error_str = f"❌ Error [{error_code}]: {message}\n   Request ID: {request_id}"
    if details:
        error_str += f"\n   Details: {details}"
    return error_str


# Import payload limits to prevent memory exhaustion attacks
# MAX_IMPORT_JSON_SIZE: Maximum size of import JSON string in bytes (default: 10MB)
#   - Checked BEFORE JSON parsing to prevent memory exhaustion from malicious payloads
#   - 10MB is generous for typical use cases (1000 decisions ~= 1-2MB)
# MAX_IMPORT_DECISIONS: Maximum decisions allowed in a single import (default: 10000)
# MAX_IMPORT_PATTERNS: Maximum patterns allowed in a single import (default: 1000)
# MAX_IMPORT_CONTEXT_KEYS: Maximum context keys allowed in a single import (default: 500)
MAX_IMPORT_JSON_SIZE = int(os.environ.get("PROJECT_MEMORY_MAX_IMPORT_JSON_SIZE", str(10 * 1024 * 1024)))  # 10MB
MAX_IMPORT_DECISIONS = int(os.environ.get("PROJECT_MEMORY_MAX_IMPORT_DECISIONS", "10000"))
MAX_IMPORT_PATTERNS = int(os.environ.get("PROJECT_MEMORY_MAX_IMPORT_PATTERNS", "1000"))
MAX_IMPORT_CONTEXT_KEYS = int(os.environ.get("PROJECT_MEMORY_MAX_IMPORT_CONTEXT_KEYS", "500"))

# Import data schema definition
# Validates structure of imported data to prevent malformed imports
IMPORT_SCHEMA = {
    "type": "object",
    "required": ["data"],
    "properties": {
        "version": {"type": "string"},
        "exported_at": {"type": "string"},
        "data": {
            "type": "object",
            "properties": {
                "decisions": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {
                            "timestamp": {"type": "string"},
                            "decision": {"type": "string"},
                            "rationale": {"type": "string"},
                            "context": {"type": "string"},
                            "alternatives": {"type": "string"}
                        }
                    }
                },
                "patterns": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {
                            "name": {"type": "string"},
                            "description": {"type": "string"},
                            "example": {"type": "string"},
                            "when_to_use": {"type": "string"}
                        }
                    }
                },
                "context": {
                    "type": "object",
                    "additionalProperties": {"type": "string"}
                }
            }
        },
        "stats": {"type": "object"}
    }
}


def validate_import_schema(data: dict) -> tuple[bool, str]:
    """
    Validate import data against the expected schema.

    This is a lightweight schema validation that doesn't require external dependencies.
    It validates structure, types, and constraints.

    Args:
        data: The data to validate

    Returns:
        Tuple of (is_valid, error_message)
    """
    if not isinstance(data, dict):
        return False, "Import data must be a dictionary"

    # Check required 'data' key
    if "data" not in data:
        return False, "Missing required 'data' key"

    inner_data = data["data"]
    if not isinstance(inner_data, dict):
        return False, "'data' must be a dictionary"

    # Validate decisions if present
    if "decisions" in inner_data:
        decisions = inner_data["decisions"]
        if not isinstance(decisions, list):
            return False, "'data.decisions' must be an array"

        # Check payload size limits to prevent memory exhaustion
        if len(decisions) > MAX_IMPORT_DECISIONS:
            return False, (
                f"Import exceeds maximum decisions limit: {len(decisions)} > {MAX_IMPORT_DECISIONS}. "
                f"Set PROJECT_MEMORY_MAX_IMPORT_DECISIONS to increase limit."
            )

        for i, decision in enumerate(decisions):
            if not isinstance(decision, dict):
                return False, f"Decision at index {i} must be an object"

            # Check all values are strings if present
            for key in ["timestamp", "decision", "rationale", "context", "alternatives"]:
                if key in decision and not isinstance(decision[key], str):
                    return False, f"Decision at index {i}: '{key}' must be a string"

    # Validate patterns if present
    if "patterns" in inner_data:
        patterns = inner_data["patterns"]
        if not isinstance(patterns, list):
            return False, "'data.patterns' must be an array"

        # Check payload size limits to prevent memory exhaustion
        if len(patterns) > MAX_IMPORT_PATTERNS:
            return False, (
                f"Import exceeds maximum patterns limit: {len(patterns)} > {MAX_IMPORT_PATTERNS}. "
                f"Set PROJECT_MEMORY_MAX_IMPORT_PATTERNS to increase limit."
            )

        for i, pattern in enumerate(patterns):
            if not isinstance(pattern, dict):
                return False, f"Pattern at index {i} must be an object"

            for key in ["name", "description", "example", "when_to_use"]:
                if key in pattern and not isinstance(pattern[key], str):
                    return False, f"Pattern at index {i}: '{key}' must be a string"

    # Validate context if present
    if "context" in inner_data:
        context = inner_data["context"]
        if not isinstance(context, dict):
            return False, "'data.context' must be a dictionary"

        # Check payload size limits to prevent memory exhaustion
        if len(context) > MAX_IMPORT_CONTEXT_KEYS:
            return False, (
                f"Import exceeds maximum context keys limit: {len(context)} > {MAX_IMPORT_CONTEXT_KEYS}. "
                f"Set PROJECT_MEMORY_MAX_IMPORT_CONTEXT_KEYS to increase limit."
            )

        for key, value in context.items():
            if not isinstance(key, str):
                return False, f"Context key must be a string, got {type(key).__name__}"
            if not isinstance(value, str):
                return False, f"Context value for key '{key}' must be a string"

    return True, ""

# Purge confirmation tokens (thread-safe)
# Token format: "PURGE-{random_hex}" with 60 second expiry
#
# Security Design Notes:
# ----------------------
# The two-step purge process provides protection against accidental data loss:
# 1. First call: Generates a unique token with 60-second TTL
# 2. Second call: Must provide the exact token to confirm deletion
#
# Timing Considerations:
# - There is a small window between token generation and validation where the
#   token could expire (if user waits >60 seconds between calls)
# - This is intentional: it forces deliberate action within a reasonable timeframe
# - The 60-second TTL balances security (preventing stale confirmations) with
#   usability (giving users time to review the warning and confirm)
# - If the token expires, the user simply needs to initiate a new purge request
#
# Thread Safety:
# - All token operations are protected by _purge_token_lock
# - validate_and_clear_purge_token() is atomic to prevent race conditions
#   between reading the expected token and clearing it
_purge_token_lock = threading.Lock()
_pending_purge_token: Optional[str] = None
_purge_token_expires: float = 0
PURGE_TOKEN_TTL = 60  # seconds


def generate_purge_token() -> str:
    """Generate a cryptographically secure purge confirmation token.

    Security: Uses 16 bytes (128 bits) of randomness from os.urandom via
    random.randbytes(), which is suitable for security-sensitive operations.
    The token format is "PURGE-" followed by 32 hex characters.

    The 128-bit entropy provides sufficient protection against:
    - Brute force attacks (2^128 possibilities)
    - Birthday attacks (2^64 attempts needed for 50% collision probability)

    @see https://docs.python.org/3/library/random.html#random.randbytes
    """
    return f"PURGE-{random.randbytes(16).hex().upper()}"


def get_pending_purge_token() -> Optional[tuple[str, float]]:
    """Get the current pending purge token if valid, or None if expired."""
    global _pending_purge_token, _purge_token_expires
    with _purge_token_lock:
        if _pending_purge_token and time.time() < _purge_token_expires:
            return (_pending_purge_token, _purge_token_expires - time.time())
        return None


def set_purge_token(token: str) -> float:
    """Set a new purge token and return its expiry time."""
    global _pending_purge_token, _purge_token_expires
    with _purge_token_lock:
        _pending_purge_token = token
        _purge_token_expires = time.time() + PURGE_TOKEN_TTL
        return PURGE_TOKEN_TTL


def validate_and_clear_purge_token(provided_token: str) -> tuple[bool, Optional[str], float]:
    """Validate the provided token and clear it if valid.

    Returns a tuple of (success, expected_token, remaining_seconds):
    - If validation succeeds: (True, None, 0)
    - If token doesn't match: (False, expected_token, remaining_seconds)
    - If no pending token or expired: (False, None, 0)

    This atomic operation prevents race conditions between validation
    and error message generation.
    """
    global _pending_purge_token, _purge_token_expires
    with _purge_token_lock:
        now = time.time()
        if _pending_purge_token and now < _purge_token_expires:
            if provided_token == _pending_purge_token:
                _pending_purge_token = None
                _purge_token_expires = 0
                return (True, None, 0)
            else:
                # Token doesn't match - return expected token for error message
                return (False, _pending_purge_token, _purge_token_expires - now)
        # No pending token or expired
        return (False, None, 0)


class ConnectionPool:
    """Thread-safe SQLite connection pool for team deployments.

    Features:
    - Connection pooling with configurable size
    - Temporary connection overflow for burst traffic
    - Wait queue with timeout when pool is exhausted
    - Health tracking and Prometheus metrics
    """

    # Maximum temporary connections to prevent unbounded resource usage
    MAX_TEMP_CONNECTIONS = 10

    # Maximum time to wait for a connection when pool is exhausted (seconds)
    WAIT_QUEUE_TIMEOUT = 30.0

    # Maximum requests that can wait in queue (backpressure)
    MAX_WAIT_QUEUE_SIZE = 50

    def __init__(self, db_path: Path, pool_size: int = 5):
        self.db_path = db_path
        self.pool_size = pool_size
        self._pool: Queue = Queue(maxsize=pool_size)
        self._lock = threading.Lock()
        self._initialized = False
        # Pool health tracking
        self._exhaustion_count = 0
        self._last_exhaustion_warning = 0.0
        self._temp_connections_created = 0
        # Active temporary connection tracking
        self._active_temp_connections = 0
        self._temp_conn_lock = threading.Lock()
        # Wait queue tracking for backpressure
        self._waiting_count = 0
        self._waiting_lock = threading.Lock()
        self._pool_available = threading.Condition(self._waiting_lock)

    def _create_connection(self) -> sqlite3.Connection:
        """Create a new database connection with optimal settings.

        Configures the connection with:
        - 30 second connection timeout
        - 5 second busy timeout for lock contention
        - WAL mode for better concurrency
        - Optimized cache and temp storage settings

        Thread Safety Notes:
        - check_same_thread=False allows sharing connections across threads
        - WAL mode enables concurrent reads with a single writer
        - Busy timeout prevents immediate SQLITE_BUSY errors under contention
        - Each connection should only be used by one thread at a time (pool manages this)

        Concurrency Limitations:
        - SQLite allows multiple readers OR one writer (not both simultaneously)
        - Write operations may block briefly under heavy load
        - For high-concurrency team deployments, consider increasing POOL_SIZE
        - Monitor exhaustion_count in get_pool_stats() for capacity issues

        @see https://www.sqlite.org/wal.html for WAL mode details
        @see https://www.sqlite.org/threadsafe.html for threading documentation
        """
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
        # Set busy timeout to handle lock contention (5 seconds)
        # This prevents immediate failures when the database is locked
        conn.execute("PRAGMA busy_timeout=5000")
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

    def _return_connection(self, conn: sqlite3.Connection) -> None:
        """Return a connection to the pool and notify waiting threads."""
        try:
            self._pool.put_nowait(conn)
        except Exception:
            conn.close()
            return

        # Notify any waiting threads that a connection is available
        with self._pool_available:
            self._pool_available.notify()

    @contextmanager
    def get_connection(self) -> Generator[sqlite3.Connection, None, None]:
        """Get a connection from the pool (context manager).

        Strategy:
        1. Try to get from pool immediately
        2. If pool empty, try to create a temporary connection
        3. If temp connections maxed, wait in queue with timeout
        4. If timeout expires, raise RuntimeError

        The wait queue provides backpressure for burst traffic instead of
        immediately failing when resources are constrained.
        """
        if not self._initialized:
            self.initialize()

        conn = None
        is_temp_connection = False

        try:
            # First, try to get a connection immediately (non-blocking)
            try:
                conn = self._pool.get_nowait()
                yield conn
                return
            except Empty:
                pass

            # Pool is empty - try to create a temporary connection
            with self._temp_conn_lock:
                if self._active_temp_connections < self.MAX_TEMP_CONNECTIONS:
                    # We can create a temporary connection
                    self._exhaustion_count += 1
                    self._temp_connections_created += 1
                    self._active_temp_connections += 1
                    is_temp_connection = True

            if is_temp_connection:
                now = time.time()
                # Rate-limit exhaustion warnings with jitter to prevent timing attacks.
                # Base interval: 10-15 seconds (randomized to obscure pool state).
                # Security: Adding jitter prevents attackers from using log timing
                # to precisely determine pool exhaustion state.
                warning_interval = 10.0 + random.random() * 5.0  # 10-15 seconds
                if now - self._last_exhaustion_warning >= warning_interval:
                    self._last_exhaustion_warning = now
                    logger.warning(
                        f"⚠️ Connection pool exhausted! "
                        f"Total exhaustions: {self._exhaustion_count}, "
                        f"Active temp connections: {self._active_temp_connections}/{self.MAX_TEMP_CONNECTIONS}. "
                        f"Consider increasing PROJECT_MEMORY_POOL_SIZE (current: {self.pool_size})"
                    )

                # Create temporary connection with proper cleanup on failure
                try:
                    conn = self._create_connection()
                except Exception as e:
                    with self._temp_conn_lock:
                        self._active_temp_connections -= 1
                    logger.error(f"Failed to create temporary connection: {e}")
                    raise RuntimeError(
                        f"Failed to create temporary database connection: {e}"
                    ) from e

                try:
                    yield conn
                finally:
                    conn.close()
                    with self._temp_conn_lock:
                        self._active_temp_connections -= 1
                    conn = None
                return

            # Pool empty and temp connections maxed - enter wait queue
            with self._waiting_lock:
                if self._waiting_count >= self.MAX_WAIT_QUEUE_SIZE:
                    logger.error(
                        f"Connection pool exhausted, temp connections maxed ({self.MAX_TEMP_CONNECTIONS}), "
                        f"and wait queue full ({self.MAX_WAIT_QUEUE_SIZE}). Rejecting request."
                    )
                    raise RuntimeError(
                        f"Database connection pool exhausted. "
                        f"Max temporary connections ({self.MAX_TEMP_CONNECTIONS}) and "
                        f"max wait queue ({self.MAX_WAIT_QUEUE_SIZE}) reached. "
                        f"Please retry later or increase PROJECT_MEMORY_POOL_SIZE."
                    )

                self._waiting_count += 1
                logger.debug(f"Request entering wait queue (waiting: {self._waiting_count})")

            try:
                # Wait for a connection to become available
                start_time = time.time()
                remaining_timeout = self.WAIT_QUEUE_TIMEOUT

                while remaining_timeout > 0:
                    # Try to get a connection
                    try:
                        conn = self._pool.get(timeout=min(remaining_timeout, 1.0))
                        yield conn
                        return
                    except Empty:
                        # Check if we can now create a temp connection
                        with self._temp_conn_lock:
                            if self._active_temp_connections < self.MAX_TEMP_CONNECTIONS:
                                self._exhaustion_count += 1
                                self._temp_connections_created += 1
                                self._active_temp_connections += 1
                                is_temp_connection = True

                        if is_temp_connection:
                            try:
                                conn = self._create_connection()
                            except Exception as e:
                                with self._temp_conn_lock:
                                    self._active_temp_connections -= 1
                                raise RuntimeError(f"Failed to create temp connection: {e}") from e

                            try:
                                yield conn
                            finally:
                                conn.close()
                                with self._temp_conn_lock:
                                    self._active_temp_connections -= 1
                                conn = None
                            return

                        # Update remaining timeout
                        elapsed = time.time() - start_time
                        remaining_timeout = self.WAIT_QUEUE_TIMEOUT - elapsed

                # Timeout expired
                logger.error(
                    f"Connection wait timeout ({self.WAIT_QUEUE_TIMEOUT}s) expired. "
                    f"Pool size: {self.pool_size}, temp connections: {self._active_temp_connections}"
                )
                raise RuntimeError(
                    f"Timed out waiting for database connection after {self.WAIT_QUEUE_TIMEOUT}s. "
                    f"Please retry later or increase PROJECT_MEMORY_POOL_SIZE."
                )
            finally:
                with self._waiting_lock:
                    self._waiting_count -= 1

        finally:
            if conn is not None and not is_temp_connection:
                self._return_connection(conn)

    def get_pool_stats(self) -> dict:
        """Get connection pool statistics for monitoring.

        Security Considerations:
        -------------------------
        These statistics are intended for operational monitoring and debugging.
        In standard MCP deployments, they are only accessible to authenticated
        clients (Claude). However, in security-sensitive environments, consider:

        1. **exhaustion_count**: Reveals aggregate load patterns. An attacker
           monitoring this value over time could infer usage patterns. For
           high-security deployments, consider:
           - Omitting this field when serving external metrics
           - Using rate limiting on metrics endpoints
           - Restricting metrics access to internal networks

        2. **available connections**: Real-time availability could be used for
           timing attacks to determine optimal attack windows. The jitter on
           warning intervals (see get_connection) mitigates some timing vectors.

        3. **temp_connections_created**: Cumulative count - less sensitive than
           real-time values but still reveals historical load patterns.

        For most deployments (single-user, internal team), these metrics pose
        minimal risk and provide valuable operational insight.

        Returns:
            dict: Pool statistics with keys:
                - pool_size: Configured pool size
                - available: Currently available connections
                - exhaustion_count: Times pool was exhausted (security note above)
                - temp_connections_created: Total temp connections created
                - active_temp_connections: Currently active temp connections
                - max_temp_connections: Maximum allowed temp connections
                - initialized: Whether pool is initialized
        """
        return {
            "pool_size": self.pool_size,
            "available": self._pool.qsize() if self._initialized else 0,
            "exhaustion_count": self._exhaustion_count,
            "temp_connections_created": self._temp_connections_created,
            "active_temp_connections": self._active_temp_connections,
            "max_temp_connections": self.MAX_TEMP_CONNECTIONS,
            "initialized": self._initialized
        }

    def get_prometheus_metrics(self) -> str:
        """Get connection pool metrics in Prometheus/OpenMetrics format.

        Returns metrics in the standard Prometheus exposition format for easy
        integration with monitoring systems like Prometheus, Grafana, etc.

        Security Note:
        --------------
        If exposing these metrics externally (e.g., via /metrics endpoint),
        ensure proper authentication and access controls. The exhaustion
        counter and availability gauges could reveal operational patterns.
        See get_pool_stats() docstring for detailed security considerations.

        For security-sensitive deployments, consider:
        - Serving metrics only on internal/localhost interfaces
        - Adding authentication to metrics endpoints
        - Sampling or aggregating metrics to reduce timing precision

        @see https://prometheus.io/docs/instrumenting/exposition_formats/
        @see https://github.com/prometheus/OpenMetrics/blob/main/specification/OpenMetrics.md

        Returns:
            str: Metrics in Prometheus exposition format
        """
        stats = self.get_pool_stats()
        timestamp_ms = int(time.time() * 1000)

        lines = [
            "# HELP mcp_pool_size_total Configured size of the connection pool",
            "# TYPE mcp_pool_size_total gauge",
            f"mcp_pool_size_total {stats['pool_size']}",
            "",
            "# HELP mcp_pool_available_connections Number of available connections in pool",
            "# TYPE mcp_pool_available_connections gauge",
            f"mcp_pool_available_connections {stats['available']}",
            "",
            "# HELP mcp_pool_exhaustion_total Total number of times pool was exhausted",
            "# TYPE mcp_pool_exhaustion_total counter",
            f"mcp_pool_exhaustion_total {stats['exhaustion_count']}",
            "",
            "# HELP mcp_pool_temp_connections_created_total Total temporary connections created",
            "# TYPE mcp_pool_temp_connections_created_total counter",
            f"mcp_pool_temp_connections_created_total {stats['temp_connections_created']}",
            "",
            "# HELP mcp_pool_active_temp_connections Currently active temporary connections",
            "# TYPE mcp_pool_active_temp_connections gauge",
            f"mcp_pool_active_temp_connections {stats['active_temp_connections']}",
            "",
            "# HELP mcp_pool_max_temp_connections Maximum allowed temporary connections",
            "# TYPE mcp_pool_max_temp_connections gauge",
            f"mcp_pool_max_temp_connections {stats['max_temp_connections']}",
            "",
            "# HELP mcp_pool_initialized Connection pool initialization state (1=initialized)",
            "# TYPE mcp_pool_initialized gauge",
            f"mcp_pool_initialized {1 if stats['initialized'] else 0}",
            "",
            "# HELP mcp_pool_utilization_ratio Current pool utilization (1 - available/size)",
            "# TYPE mcp_pool_utilization_ratio gauge",
            f"mcp_pool_utilization_ratio {1 - (stats['available'] / stats['pool_size']) if stats['pool_size'] > 0 else 0:.4f}",
            "",
            f"# EOF (timestamp: {timestamp_ms})",
        ]

        return "\n".join(lines)

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

    def configure(self, max_ops: Optional[int] = None, window_seconds: Optional[int] = None) -> dict:
        """Reconfigure rate limiter at runtime. Returns new configuration."""
        with self._lock:
            if max_ops is not None:
                if max_ops < 1:
                    raise ValueError("max_ops must be at least 1")
                self.max_ops = max_ops
            if window_seconds is not None:
                if window_seconds < 1:
                    raise ValueError("window_seconds must be at least 1")
                self.window_seconds = window_seconds

            logger.info(f"Rate limiter reconfigured: {self.max_ops} ops/{self.window_seconds}s")
            return self.get_config()

    def get_config(self) -> dict:
        """Get current rate limiter configuration."""
        return {
            "max_ops": self.max_ops,
            "window_seconds": self.window_seconds,
            "current_usage": len(self._operations),
            "remaining": self.remaining()
        }

    def get_prometheus_metrics(self) -> str:
        """Get rate limiter metrics in Prometheus/OpenMetrics format.

        Returns metrics for monitoring rate limiting behavior:
        - mcp_rate_limit_max_ops: Configured maximum operations per window
        - mcp_rate_limit_window_seconds: Window size in seconds
        - mcp_rate_limit_current_usage: Current operations in window
        - mcp_rate_limit_remaining: Remaining operations in window
        - mcp_rate_limit_utilization_ratio: Current usage as fraction of max

        @see https://prometheus.io/docs/instrumenting/exposition_formats/

        Returns:
            str: Metrics in Prometheus exposition format
        """
        config = self.get_config()
        utilization = config['current_usage'] / config['max_ops'] if config['max_ops'] > 0 else 0

        lines = [
            "# HELP mcp_rate_limit_max_ops Maximum operations allowed per window",
            "# TYPE mcp_rate_limit_max_ops gauge",
            f"mcp_rate_limit_max_ops {config['max_ops']}",
            "",
            "# HELP mcp_rate_limit_window_seconds Rate limit window size in seconds",
            "# TYPE mcp_rate_limit_window_seconds gauge",
            f"mcp_rate_limit_window_seconds {config['window_seconds']}",
            "",
            "# HELP mcp_rate_limit_current_usage Current operations in window",
            "# TYPE mcp_rate_limit_current_usage gauge",
            f"mcp_rate_limit_current_usage {config['current_usage']}",
            "",
            "# HELP mcp_rate_limit_remaining Remaining operations in window",
            "# TYPE mcp_rate_limit_remaining gauge",
            f"mcp_rate_limit_remaining {config['remaining']}",
            "",
            "# HELP mcp_rate_limit_utilization_ratio Current usage as fraction of max",
            "# TYPE mcp_rate_limit_utilization_ratio gauge",
            f"mcp_rate_limit_utilization_ratio {utilization:.4f}",
        ]

        return "\n".join(lines)

    def reset(self) -> None:
        """Reset the rate limiter, clearing all tracked operations."""
        with self._lock:
            self._operations.clear()
            logger.info("Rate limiter reset")


class PersistentRateLimiter(RateLimiter):
    """Rate limiter with SQLite persistence for surviving server restarts.

    Stores operation timestamps in a SQLite table, loading on startup
    and persisting on each operation. Useful for team deployments where
    rate limits should survive restarts.

    Enable via: PROJECT_MEMORY_PERSIST_RATE_LIMIT=true
    """

    def __init__(self, db_path: Path, max_ops: int = 100, window_seconds: int = 60):
        super().__init__(max_ops, window_seconds)
        self.db_path = db_path
        # Time-based cleanup scheduling (every 5 minutes by default)
        # This replaces the previous random 1% chance approach for deterministic cleanup
        self._cleanup_interval_seconds = int(os.environ.get(
            "PROJECT_MEMORY_RATE_LIMIT_CLEANUP_INTERVAL",
            "300"  # 5 minutes
        ))
        self._last_cleanup_time = time.time()
        self._init_db()
        self._load_from_db()

    def _init_db(self) -> None:
        """Initialize the rate limit persistence table."""
        try:
            with sqlite3.connect(str(self.db_path), timeout=5.0) as conn:
                conn.execute("""
                    CREATE TABLE IF NOT EXISTS rate_limit_ops (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        timestamp REAL NOT NULL
                    )
                """)
                conn.execute("""
                    CREATE INDEX IF NOT EXISTS idx_rate_limit_timestamp
                    ON rate_limit_ops(timestamp)
                """)
                conn.commit()
        except Exception as e:
            logger.warning(f"Failed to initialize rate limit persistence: {e}")

    def _load_from_db(self) -> None:
        """Load existing rate limit operations from database."""
        now = time.time()
        cutoff = now - self.window_seconds

        try:
            with sqlite3.connect(str(self.db_path), timeout=5.0) as conn:
                # Clean up old entries first
                conn.execute("DELETE FROM rate_limit_ops WHERE timestamp < ?", (cutoff,))
                conn.commit()

                # Load valid entries
                cursor = conn.execute(
                    "SELECT timestamp FROM rate_limit_ops WHERE timestamp >= ? ORDER BY timestamp",
                    (cutoff,)
                )
                with self._lock:
                    self._operations.clear()
                    for (ts,) in cursor:
                        self._operations.append(ts)

                logger.info(f"Loaded {len(self._operations)} rate limit operations from persistence")
        except Exception as e:
            logger.warning(f"Failed to load rate limit state: {e}")

    def _persist_operation(self, timestamp: float) -> None:
        """Persist a single operation timestamp to the database."""
        try:
            with sqlite3.connect(str(self.db_path), timeout=5.0) as conn:
                conn.execute("INSERT INTO rate_limit_ops (timestamp) VALUES (?)", (timestamp,))
                conn.commit()
        except Exception as e:
            logger.warning(f"Failed to persist rate limit operation: {e}")

    def _cleanup_db(self, cutoff: float) -> None:
        """Remove old entries from the database."""
        try:
            with sqlite3.connect(str(self.db_path), timeout=5.0) as conn:
                conn.execute("DELETE FROM rate_limit_ops WHERE timestamp < ?", (cutoff,))
                conn.commit()
        except Exception as e:
            logger.warning(f"Failed to cleanup old rate limit entries: {e}")

    def check(self) -> bool:
        """Check if operation is allowed and persist if so."""
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

        # Persist outside the lock to avoid blocking
        self._persist_operation(now)

        # Periodic DB cleanup using time-based scheduling
        # Clean up every 5 minutes (300 seconds) instead of random 1% chance
        # This is deterministic and ensures cleanup happens at regular intervals
        if now - self._last_cleanup_time >= self._cleanup_interval_seconds:
            self._last_cleanup_time = now
            self._cleanup_db(cutoff)

        return True

    def reset(self) -> None:
        """Reset the rate limiter, clearing all tracked operations and persistence."""
        with self._lock:
            self._operations.clear()
        try:
            with sqlite3.connect(str(self.db_path), timeout=5.0) as conn:
                conn.execute("DELETE FROM rate_limit_ops")
                conn.commit()
        except Exception as e:
            logger.warning(f"Failed to clear rate limit persistence: {e}")
        logger.info("Rate limiter reset (including persistence)")


# Configuration for rate limiter persistence
PERSIST_RATE_LIMIT = os.environ.get("PROJECT_MEMORY_PERSIST_RATE_LIMIT", "false").lower() == "true"


def create_rate_limiter() -> RateLimiter:
    """Create the appropriate rate limiter based on configuration.

    Falls back to in-memory rate limiter if persistent limiter fails to initialize.
    This ensures the server can always start, even with configuration issues.
    """
    if PERSIST_RATE_LIMIT:
        try:
            db_path = get_db_path()
            logger.info(f"Using persistent rate limiter with database: {db_path}")
            return PersistentRateLimiter(db_path, max_ops=RATE_LIMIT, window_seconds=60)
        except Exception as e:
            # Fall back to in-memory rate limiter if persistent fails
            logger.warning(
                f"Failed to initialize persistent rate limiter: {e}. "
                f"Falling back to in-memory rate limiter. "
                f"Rate limits will reset on server restart."
            )
            return RateLimiter(max_ops=RATE_LIMIT, window_seconds=60)
    else:
        return RateLimiter(max_ops=RATE_LIMIT, window_seconds=60)


# Global rate limiter (lazily initialized to ensure db_path is available)
# Thread-safe initialization with lock to prevent race conditions
_rate_limiter_lock = threading.Lock()
rate_limiter: Optional[RateLimiter] = None


def get_rate_limiter() -> RateLimiter:
    """Get or create the global rate limiter (thread-safe)."""
    global rate_limiter
    if rate_limiter is None:
        with _rate_limiter_lock:
            # Double-check pattern to avoid creating multiple rate limiters
            if rate_limiter is None:
                rate_limiter = create_rate_limiter()
    return rate_limiter


def get_all_prometheus_metrics(pool: Optional['ConnectionPool'] = None) -> str:
    """Get all Prometheus metrics combining pool and rate limiter.

    Provides a complete metrics export suitable for Prometheus scraping.
    Includes connection pool metrics (if available) and rate limiter metrics.

    Args:
        pool: Optional ConnectionPool instance. If None, only rate limiter metrics are included.

    Returns:
        str: Combined metrics in Prometheus exposition format

    Example:
        >>> metrics = get_all_prometheus_metrics(database._pool)
        >>> print(metrics)  # Send to /metrics endpoint
    """
    timestamp_ms = int(time.time() * 1000)
    sections = []

    # Pool metrics
    if pool:
        sections.append(pool.get_prometheus_metrics().rstrip("# EOF"))

    # Rate limiter metrics
    try:
        limiter = get_rate_limiter()
        sections.append(limiter.get_prometheus_metrics())
    except Exception as e:
        sections.append(f"# Rate limiter metrics unavailable: {e}")

    # Footer
    sections.append(f"# EOF (timestamp: {timestamp_ms})")

    return "\n\n".join(sections)


def with_retry(
    max_attempts: int = 3,
    base_delay: float = 0.1,
    max_delay: float = 2.0,
    exponential_base: float = 2.0,
    retryable_exceptions: tuple = (sqlite3.OperationalError, sqlite3.DatabaseError)
):
    """Decorator for retrying database operations with exponential backoff.

    Args:
        max_attempts: Maximum number of attempts (including initial try)
        base_delay: Initial delay between retries in seconds
        max_delay: Maximum delay between retries in seconds
        exponential_base: Base for exponential backoff calculation
        retryable_exceptions: Tuple of exception types to retry on

    Returns:
        Decorated function with retry logic
    """
    def decorator(func):
        def wrapper(*args, **kwargs):
            last_exception = None
            for attempt in range(max_attempts):
                try:
                    return func(*args, **kwargs)
                except retryable_exceptions as e:
                    last_exception = e
                    if attempt < max_attempts - 1:
                        # Calculate delay with exponential backoff
                        delay = min(base_delay * (exponential_base ** attempt), max_delay)
                        # Add jitter (±25%)
                        jitter = delay * 0.25 * (2 * random.random() - 1)
                        actual_delay = delay + jitter

                        logger.warning(
                            f"Transient failure in {func.__name__}: {e}. "
                            f"Retrying in {actual_delay:.2f}s (attempt {attempt + 1}/{max_attempts})"
                        )
                        time.sleep(actual_delay)
                    else:
                        logger.error(
                            f"Max retries ({max_attempts}) exhausted for {func.__name__}: {e}"
                        )
            raise last_exception
        return wrapper
    return decorator


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


def escape_like_pattern(value: str) -> str:
    """Escape SQL LIKE wildcard characters to prevent pattern injection.

    SQLite LIKE patterns use % and _ as wildcards. This function escapes
    these characters so user input is treated literally when used with
    the ESCAPE '\\' clause.

    The escape order is critical:
    1. Escape backslashes first (\ -> \\) so existing backslashes don't
       interfere with subsequent escape sequences
    2. Then escape wildcards (% -> \%, _ -> \_)

    Examples:
        Input: "100%"    -> Output: "100\\%"   (matches literal "100%")
        Input: "C:\\path" -> Output: "C:\\\\path" (matches literal "C:\\path")
        Input: "\\%"     -> Output: "\\\\\\%"  (matches literal "\\%")
        Input: "test_1"  -> Output: "test\\_1" (matches literal "test_1")

    Args:
        value: The string to escape for use in LIKE patterns

    Returns:
        The escaped string safe for LIKE pattern matching

    Note:
        Must be used with SQL ESCAPE '\\' clause, e.g.:
        WHERE column LIKE ? ESCAPE '\\\\'
    """
    if not isinstance(value, str):
        value = str(value)

    # Escape the escape character first, then the wildcards
    # Order matters: backslash must be escaped before wildcards
    value = value.replace('\\', '\\\\')
    value = value.replace('%', '\\%')
    value = value.replace('_', '\\_')
    return value


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
                # Escape LIKE wildcards to prevent pattern injection
                escaped_keyword = escape_like_pattern(keyword)
                pattern = f"%{escaped_keyword}%"
                cursor = conn.execute("""
                    SELECT * FROM decisions
                    WHERE decision LIKE ? ESCAPE '\\'
                       OR rationale LIKE ? ESCAPE '\\'
                       OR context LIKE ? ESCAPE '\\'
                    ORDER BY timestamp DESC LIMIT ?
                """, (pattern, pattern, pattern, limit))
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

        Raises:
            ValueError: If the data fails schema validation
        """
        # Validate import data schema
        is_valid, error_msg = validate_import_schema(data)
        if not is_valid:
            raise ValueError(f"Invalid import data: {error_msg}")

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

        # Check connection pool health
        if self._pool:
            pool_stats = self._pool.get_pool_stats()
            health["checks"]["connection_pool"] = pool_stats
            if pool_stats["exhaustion_count"] > 0:
                health["checks"]["connection_pool"]["warning"] = (
                    f"Pool exhausted {pool_stats['exhaustion_count']} times - "
                    "consider increasing PROJECT_MEMORY_POOL_SIZE"
                )
                if health["status"] == "healthy":
                    health["status"] = "degraded"

        # Check rate limiter status
        try:
            limiter = get_rate_limiter()
            rate_config = limiter.get_config()
            health["checks"]["rate_limiter"] = rate_config
            utilization = rate_config["current_usage"] / rate_config["max_ops"] if rate_config["max_ops"] > 0 else 0
            if utilization > 0.8:
                health["checks"]["rate_limiter"]["warning"] = (
                    f"Rate limit {utilization:.0%} utilized - "
                    "consider increasing PROJECT_MEMORY_RATE_LIMIT"
                )
                if health["status"] == "healthy":
                    health["status"] = "degraded"
        except Exception as e:
            health["checks"]["rate_limiter"] = f"unavailable: {str(e)}"

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
# Use RLock to allow recursive calls (e.g., if get_db is called during initialization)
_db_lock = threading.RLock()  # Reentrant lock for thread-safe db access
_db_init_failed = False  # Track initialization failure to avoid retry loops
_db_init_error: Optional[Exception] = None  # Store initialization error


def get_db() -> ProjectMemoryDB:
    """Get or initialize the database (thread-safe).

    Uses double-checked locking pattern (DCLP) with proper exception handling.

    Thread Safety Notes:
        - This implementation relies on Python's Global Interpreter Lock (GIL)
          for atomic reads of `db` and `_db_init_failed` outside the lock.
        - The GIL ensures that reading a single variable is atomic in CPython.
        - The second check inside the lock ensures correctness even if the GIL
          behavior changes or this code is ported to a non-GIL Python.
        - We use RLock instead of Lock to safely handle recursive calls.

    The pattern ensures:
        1. Thread-safe lazy initialization (only one thread initializes)
        2. Fast path for already-initialized case (no lock acquisition)
        3. Proper cleanup on initialization failure
        4. Clear error reporting if initialization fails

    Raises:
        RuntimeError: If database initialization previously failed
        Exception: If database initialization fails on this attempt

    Returns:
        ProjectMemoryDB: The initialized database instance
    """
    global db, _db_init_failed, _db_init_error

    # Fast path: already initialized (atomic read due to GIL)
    # This avoids lock acquisition overhead for the common case
    if db is not None:
        return db

    # Check for previous initialization failure (atomic read due to GIL)
    if _db_init_failed:
        raise RuntimeError(
            f"Database initialization previously failed: {_db_init_error}. "
            "Restart the server to retry."
        )

    with _db_lock:
        # Double-check after acquiring lock to handle race conditions
        # Another thread may have initialized while we were waiting
        if db is not None:
            return db

        if _db_init_failed:
            raise RuntimeError(
                f"Database initialization previously failed: {_db_init_error}. "
                "Restart the server to retry."
            )

        # Attempt initialization with proper exception handling
        try:
            new_db = ProjectMemoryDB(get_db_path())
            # Assignment to global happens last - ensures db is fully initialized
            # before other threads can see it (atomic assignment due to GIL)
            db = new_db
            logger.info("Database initialized successfully")
            return db
        except Exception as e:
            # Mark as failed to prevent retry loops
            _db_init_failed = True
            _db_init_error = e
            logger.error(f"Database initialization failed: {e}")
            raise


def reset_db_state() -> None:
    """Reset database state to allow re-initialization (for testing/recovery).

    This should only be called after close_db() or in test scenarios.
    """
    global db, _db_init_failed, _db_init_error
    with _db_lock:
        db = None
        _db_init_failed = False
        _db_init_error = None
        logger.info("Database state reset")


def close_db() -> None:
    """Close the database connection pool (thread-safe)."""
    global db
    with _db_lock:
        if db is not None and db._pool is not None:
            try:
                db._pool.close_all()
                logger.info("Connection pool closed successfully")
            except Exception as e:
                logger.error(f"Error closing connection pool: {e}")


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
            description="Delete ALL stored memory. Two-step process: first call returns a unique token, second call with that token confirms deletion.",
            inputSchema={
                "type": "object",
                "properties": {
                    "confirm": {
                        "type": "string",
                        "description": "Confirmation token from the first call. Omit to initiate purge and receive token."
                    }
                }
            }
        )
    ]


# Operations exempt from rate limiting (administrative/bulk operations)
RATE_LIMIT_EXEMPT_OPERATIONS = frozenset({
    'import_memory',   # Bulk operation that would hit limits unfairly
    'export_memory',   # Read-only bulk operation
    'health_check',    # Monitoring should not be rate limited
    'memory_stats',    # Monitoring should not be rate limited
    'purge_memory',    # Requires confirmation, infrequent
})


@server.call_tool()
async def call_tool(name: str, arguments: dict) -> list:
    """Handle tool calls."""
    # Generate a unique request ID for tracing (short UUID for readability)
    request_id = str(uuid.uuid4())[:8]

    # Check rate limit before processing (unless exempt)
    limiter = get_rate_limiter()
    if name not in RATE_LIMIT_EXEMPT_OPERATIONS:
        if not limiter.check():
            remaining = limiter.remaining()
            timestamp = datetime.now().isoformat()
            logger.warning(
                f"Rate limit exceeded for tool {name}. "
                f"Request ID: {request_id}, Remaining: {remaining}"
            )
            return [TextContent(
                type="text",
                text=f"❌ Rate limit exceeded. Please wait before making more requests.\n"
                     f"   Limit: {RATE_LIMIT} operations per minute.\n"
                     f"   Request ID: {request_id}\n"
                     f"   Timestamp: {timestamp}"
            )]

    try:
        database = get_db()

        if name == "remember_decision":
            decision = arguments.get("decision", "")
            rationale = arguments.get("rationale", "")

            if not decision or not rationale:
                return [TextContent(type="text", text=format_error(
                    "VALIDATION_ERROR",
                    "decision and rationale are required",
                    request_id,
                    "Both 'decision' and 'rationale' parameters must be non-empty strings"
                ))]

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
            # Clamp limit to valid range [1, 100] to prevent:
            # - Negative values causing unexpected SQL behavior
            # - Zero values returning no results
            # - Excessive values causing memory issues
            limit = max(1, min(arguments.get("limit", 20), 100))

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
                return [TextContent(type="text", text=format_error(
                    "VALIDATION_ERROR",
                    "name and description are required",
                    request_id,
                    "Both 'name' and 'description' parameters must be non-empty strings"
                ))]

            if not validate_key(pattern_name):
                return [TextContent(type="text", text=format_error(
                    "VALIDATION_ERROR",
                    "invalid pattern name format",
                    request_id,
                    "Name must be alphanumeric (underscores, hyphens, dots allowed)"
                ))]

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
                return [TextContent(type="text", text=format_error(
                    "INTERNAL_ERROR",
                    "failed to store pattern",
                    request_id,
                    "Database operation failed. Check server logs for details."
                ))]

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
                return [TextContent(type="text", text=format_error(
                    "VALIDATION_ERROR",
                    "key and value are required",
                    request_id,
                    "Both 'key' and 'value' parameters must be non-empty strings"
                ))]

            if not validate_key(key):
                return [TextContent(type="text", text=format_error(
                    "VALIDATION_ERROR",
                    "invalid key format",
                    request_id,
                    "Key must be alphanumeric (underscores, hyphens, dots allowed)"
                ))]

            success = database.set_context(key, value)

            if success:
                logger.info(f"Set context: {key}")
                return [TextContent(type="text", text=f"✓ Context set: {key}")]
            else:
                return [TextContent(type="text", text=format_error(
                    "INTERNAL_ERROR",
                    "failed to set context",
                    request_id,
                    "Database operation failed. Check server logs for details."
                ))]

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
                return [TextContent(type="text", text=format_error(
                    "VALIDATION_ERROR",
                    "data parameter is required",
                    request_id,
                    "Provide JSON data from a previous export_memory call"
                ))]

            # Check JSON size BEFORE parsing to prevent memory exhaustion attacks
            # This catches maliciously large payloads before they consume memory
            data_size = len(data_str.encode('utf-8'))
            if data_size > MAX_IMPORT_JSON_SIZE:
                size_mb = data_size / (1024 * 1024)
                limit_mb = MAX_IMPORT_JSON_SIZE / (1024 * 1024)
                logger.warning(
                    f"Import rejected: payload too large ({size_mb:.2f}MB > {limit_mb:.2f}MB limit). "
                    f"Request ID: {request_id}"
                )
                return [TextContent(type="text", text=format_error(
                    "SIZE_LIMIT_ERROR",
                    f"import data too large ({size_mb:.1f}MB exceeds {limit_mb:.0f}MB limit)",
                    request_id,
                    "Set PROJECT_MEMORY_MAX_IMPORT_JSON_SIZE environment variable to increase limit"
                ))]

            try:
                import_data = json.loads(data_str)
            except json.JSONDecodeError as e:
                return [TextContent(type="text", text=format_error(
                    "PARSE_ERROR",
                    f"invalid JSON: {str(e)}",
                    request_id,
                    "Ensure the data parameter contains valid JSON from export_memory"
                ))]

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
                return [TextContent(type="text", text=format_error(
                    "VALIDATION_ERROR",
                    str(e),
                    request_id,
                    "Check import data structure matches expected schema"
                ))]

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

            # Two-step confirmation: first call generates token, second verifies it
            if not confirm:
                # Step 1: Generate a new purge token
                token = generate_purge_token()
                ttl = set_purge_token(token)
                return [TextContent(
                    type="text",
                    text=f"⚠️ **DANGER: Memory Purge Requested**\n\n"
                         f"This will permanently delete ALL:\n"
                         f"- Decisions\n"
                         f"- Patterns\n"
                         f"- Context keys\n\n"
                         f"To confirm, call purge_memory with:\n"
                         f"```\nconfirm='{token}'\n```\n\n"
                         f"⏱️ Token expires in {int(ttl)} seconds."
                )]

            # Step 2: Validate the provided token (atomic operation to prevent race conditions)
            success, expected_token, remaining = validate_and_clear_purge_token(confirm)
            if not success:
                if expected_token:
                    # Token doesn't match - show expected token from atomic lookup
                    return [TextContent(
                        type="text",
                        text=f"❌ Invalid confirmation token.\n\n"
                             f"Expected: `{expected_token}`\n"
                             f"Received: `{confirm}`\n\n"
                             f"⏱️ Token expires in {int(remaining)} seconds."
                    )]
                else:
                    # No pending token or expired
                    return [TextContent(
                        type="text",
                        text="❌ No pending purge request or token expired.\n\n"
                             "Please call purge_memory without confirm parameter first "
                             "to initiate a new purge request."
                    )]

            # Token validated - proceed with purge
            result = database.purge_all()

            output = "## Memory Purged ⚠️\n\n"
            output += f"Deleted:\n"
            output += f"- Decisions: {result['deleted']['decisions']}\n"
            output += f"- Patterns: {result['deleted']['patterns']}\n"
            output += f"- Context keys: {result['deleted']['context']}\n"

            return [TextContent(type="text", text=output)]

        else:
            return [TextContent(type="text", text=format_error(
                "UNKNOWN_TOOL",
                f"unknown tool: {name}",
                request_id,
                "Available tools: remember_decision, recall_decisions, store_pattern, get_patterns, set_context, get_context, memory_stats, export_memory, import_memory, health_check, purge_memory"
            ))]

    except Exception as e:
        logger.exception(f"Error in tool {name}. Request ID: {request_id}")
        return [TextContent(type="text", text=format_error(
            "INTERNAL_ERROR",
            str(e),
            request_id,
            "An unexpected error occurred. Check server logs for details."
        ))]


async def main():
    """Run the MCP server."""
    logger.info(f"Starting Project Memory MCP Server v{VERSION}")
    logger.info(f"Database: {get_db_path()}")
    logger.info(f"Limits: {MAX_DECISIONS} decisions, {MAX_PATTERNS} patterns, {MAX_CONTEXT_KEYS} context keys")
    logger.info(f"Import limits: {MAX_IMPORT_JSON_SIZE // (1024*1024)}MB max JSON, {MAX_IMPORT_DECISIONS} decisions, {MAX_IMPORT_PATTERNS} patterns")
    persist_str = "persistent" if PERSIST_RATE_LIMIT else "in-memory"
    cleanup_interval = int(os.environ.get("PROJECT_MEMORY_RATE_LIMIT_CLEANUP_INTERVAL", "300"))
    logger.info(f"Rate limit: {RATE_LIMIT} ops/min ({persist_str}), Pool size: {POOL_SIZE}")
    if PERSIST_RATE_LIMIT:
        logger.info(f"Rate limit DB cleanup interval: {cleanup_interval}s")

    # Set up graceful shutdown
    import signal

    def handle_shutdown(signum, frame):
        """Handle shutdown signals gracefully."""
        sig_name = signal.Signals(signum).name
        logger.info(f"Received {sig_name}, initiating graceful shutdown...")

        # Close connection pool using thread-safe function
        close_db()

        logger.info("Shutdown complete")
        sys.exit(0)

    # Register signal handlers for graceful shutdown
    signal.signal(signal.SIGTERM, handle_shutdown)
    signal.signal(signal.SIGINT, handle_shutdown)

    try:
        async with stdio_server() as (read_stream, write_stream):
            await server.run(read_stream, write_stream)
    finally:
        # Ensure cleanup on normal exit using thread-safe function
        close_db()
        logger.info("Server shutdown complete")


if __name__ == "__main__":
    import asyncio
    asyncio.run(main())
