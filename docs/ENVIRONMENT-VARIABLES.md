# Environment Variables Reference

This document provides a comprehensive reference for all environment variables used by the AI Excellence Framework.

## CLI Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `AIX_TIMEOUT` | `300000` | Command timeout in milliseconds (5 minutes default) |
| `AIX_DEBUG` | `false` | Enable debug output (`true` to enable) |
| `AIX_STRUCTURED_LOGGING` | `false` | Enable JSON log output for CI/CD integration |
| `NO_COLOR` | (unset) | Disable colored output (any value enables) |
| `VERBOSE` | `false` | Show verbose error output with stack traces |

### Example Usage

```bash
# Increase timeout to 10 minutes
AIX_TIMEOUT=600000 ai-excellence init

# Enable debug logging
AIX_DEBUG=true ai-excellence validate

# Enable structured JSON logging for CI pipelines
AIX_STRUCTURED_LOGGING=true ai-excellence doctor

# Disable colors in output
NO_COLOR=1 ai-excellence lint
```

## MCP Server Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PROJECT_MEMORY_DB` | Auto | SQLite database path (auto-detected from project name) |
| `PROJECT_MEMORY_MAX_DECISIONS` | `1000` | Maximum stored decisions |
| `PROJECT_MEMORY_MAX_PATTERNS` | `100` | Maximum stored patterns |
| `PROJECT_MEMORY_MAX_CONTEXT_KEYS` | `50` | Maximum context key-value pairs |
| `PROJECT_MEMORY_POOL_SIZE` | `5` | Connection pool size for team deployments |
| `PROJECT_MEMORY_RATE_LIMIT` | `100` | Maximum operations per minute |
| `PROJECT_MEMORY_PERSIST_RATE_LIMIT` | `false` | Persist rate limit state to database |
| `STRUCTURED_LOGGING` | `false` | Enable JSON log output for MCP server |

### Database Path Resolution

When `PROJECT_MEMORY_DB` is not set, the database path is determined automatically:

1. For git repositories: Uses the remote origin URL or directory name
2. For non-git directories: Uses the directory name
3. Default location: `~/.claude/project-memories/{project-name}.db`

### Example MCP Configuration

```bash
# Custom database location
PROJECT_MEMORY_DB=/var/data/project.db

# Increase pool size for team use
PROJECT_MEMORY_POOL_SIZE=10

# Enable rate limit persistence
PROJECT_MEMORY_PERSIST_RATE_LIMIT=true

# Reduce rate limit for shared environments
PROJECT_MEMORY_RATE_LIMIT=50

# Enable structured logging for log aggregation
STRUCTURED_LOGGING=true
```

## PostgreSQL Deployment Variables

For team deployments using PostgreSQL instead of SQLite:

| Variable | Default | Description |
|----------|---------|-------------|
| `PROJECT_MEMORY_DB_HOST` | `localhost` | PostgreSQL host |
| `PROJECT_MEMORY_DB_PORT` | `5432` | PostgreSQL port |
| `PROJECT_MEMORY_DB_NAME` | `project_memory` | Database name |
| `PROJECT_MEMORY_DB_USER` | `mcp_server` | Database user |
| `PROJECT_MEMORY_DB_PASSWORD` | (none) | Database password (required) |

See [PostgreSQL Deployment Guide](./POSTGRESQL-DEPLOYMENT.md) for full setup instructions.

## Security Hook Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `AIX_SECURITY_ENFORCE` | `false` | Block commits on security issues |
| `AIX_SECURITY_STRICT` | `false` | Enable additional strict security checks |

### Example Usage

```bash
# Enable security enforcement (blocks commits with issues)
export AIX_SECURITY_ENFORCE=true

# Enable strict mode with additional checks
export AIX_SECURITY_STRICT=true

# Run security check manually
./scripts/hooks/check-ai-security.sh --enforce --strict
```

## Metrics Collection Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `AIX_METRICS_DIR` | `~/.ai-excellence/metrics` | Directory for storing friction metrics |

## CI/CD Integration

For CI/CD pipelines, we recommend setting:

```yaml
# GitHub Actions example
env:
  AIX_STRUCTURED_LOGGING: "true"  # JSON output for log parsing
  AIX_TIMEOUT: "600000"           # Longer timeout for CI
  NO_COLOR: "1"                   # Disable colors in logs
  AIX_SECURITY_ENFORCE: "true"    # Block on security issues
```

## Quick Reference Table

| Category | Variable | Purpose |
|----------|----------|---------|
| **CLI** | `AIX_TIMEOUT` | Command timeout |
| **CLI** | `AIX_DEBUG` | Debug logging |
| **CLI** | `AIX_STRUCTURED_LOGGING` | JSON output |
| **CLI** | `NO_COLOR` | Disable colors |
| **MCP** | `PROJECT_MEMORY_DB` | Database path |
| **MCP** | `PROJECT_MEMORY_POOL_SIZE` | Connection pool |
| **MCP** | `PROJECT_MEMORY_RATE_LIMIT` | Rate limiting |
| **MCP** | `STRUCTURED_LOGGING` | JSON output |
| **Security** | `AIX_SECURITY_ENFORCE` | Block on issues |
| **Security** | `AIX_SECURITY_STRICT` | Strict checks |
| **Metrics** | `AIX_METRICS_DIR` | Metrics storage |

## See Also

- [Getting Started](./getting-started.md)
- [MCP Security](./MCP-SECURITY.md)
- [PostgreSQL Deployment](./POSTGRESQL-DEPLOYMENT.md)
- [DORA Integration](./DORA-INTEGRATION.md)
