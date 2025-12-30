# MCP Server Setup

The Model Context Protocol (MCP) server provides persistent project memory across sessions. It solves long-term context loss with durable storage.

## Quick Start

### 1. Prerequisites

- Python 3.10+
- pip or uv package manager

### 2. Install Dependencies

```bash
# Using pip
pip install mcp sqlite3

# Or using uv (recommended)
curl -LsSf https://astral.sh/uv/install.sh | sh
uv pip install mcp
```

### 3. Configure Claude Desktop

Add to `~/.config/claude-desktop/config.json` (Linux) or `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS):

```json
{
  "mcpServers": {
    "project-memory": {
      "command": "python",
      "args": ["/path/to/project/scripts/mcp/project-memory-server.py"],
      "env": {
        "PROJECT_MEMORY_DB": "/path/to/project/.claude/memory.db"
      }
    }
  }
}
```

### 4. Verify Connection

Restart Claude Desktop and check for the tools:
- `remember_decision`
- `recall_decisions`
- `store_pattern`
- `get_patterns`

## What It Does

The MCP server provides persistent storage for:

| Tool | Purpose |
|------|---------|
| `remember_decision` | Store architectural decisions |
| `recall_decisions` | Search decisions by keyword |
| `store_pattern` | Save code patterns |
| `get_patterns` | Retrieve saved patterns |
| `set_context` | Key-value storage |
| `get_context` | Retrieve stored values |
| `memory_stats` | Database statistics |

## Example Usage

### Storing a Decision

```
User: Let's use PostgreSQL for the database
Claude: [calls remember_decision]
  title: "Database Selection"
  decision: "Using PostgreSQL for primary database"
  rationale: "Better JSON support, team familiarity"
```

### Recalling Decisions

```
User: What did we decide about the database?
Claude: [calls recall_decisions with keyword "database"]
  Returns: "Using PostgreSQL - Better JSON support, team familiarity"
```

### Storing Patterns

```
User: This is our standard error handling pattern
Claude: [calls store_pattern]
  name: "error-handling"
  pattern: "try/catch with structured logging"
  context: "All API endpoints should use this pattern"
```

## Configuration Options

Environment variables:

| Variable | Default | Description |
|----------|---------|-------------|
| `PROJECT_MEMORY_DB` | `.claude/memory.db` | Database location |
| `PROJECT_MEMORY_MAX_DECISIONS` | 1000 | Decision limit |
| `PROJECT_MEMORY_MAX_PATTERNS` | 100 | Pattern limit |
| `PROJECT_MEMORY_POOL_SIZE` | 5 | Connection pool size |
| `PROJECT_MEMORY_RATE_LIMIT` | 100 | Ops per minute |

## Production Features

The included MCP server has production-quality features:

### Connection Pooling

Supports 5-20 concurrent connections for team use:

```python
POOL_SIZE = int(os.getenv('PROJECT_MEMORY_POOL_SIZE', '5'))
```

### Rate Limiting

Prevents abuse with configurable limits:

```python
RATE_LIMIT = int(os.getenv('PROJECT_MEMORY_RATE_LIMIT', '100'))
```

### WAL Mode

SQLite Write-Ahead Logging for concurrent access:

```python
conn.execute('PRAGMA journal_mode=WAL')
```

### Full-Text Search

Decisions are searchable:

```sql
SELECT * FROM decisions
WHERE title LIKE '%keyword%'
   OR decision LIKE '%keyword%'
```

### Export/Import

Backup and restore memory:

```bash
# Export
sqlite3 .claude/memory.db .dump > backup.sql

# Import
sqlite3 .claude/memory.db < backup.sql
```

## Security Considerations

See [MCP Security Guide](/MCP-SECURITY) for:

- File system isolation
- Input validation
- Access controls
- Audit logging

## Team Usage

For team deployment:

1. Use a shared database location:
   ```json
   "PROJECT_MEMORY_DB": "/shared/team/memory.db"
   ```

2. Increase pool size:
   ```json
   "PROJECT_MEMORY_POOL_SIZE": "20"
   ```

3. Enable federation for multiple teams (see [Team Memory Federation](/TEAM-MEMORY-FEDERATION))

## Troubleshooting

### Server Not Connecting

1. Check Python version: `python --version` (need 3.10+)
2. Verify path in config is absolute
3. Check Claude Desktop logs

### Database Locked

1. Ensure WAL mode is enabled
2. Increase pool size
3. Check for stale connections

### Memory Growing Large

1. Check `memory_stats` for counts
2. Use cleanup tools:
   ```python
   # In server: cleanup old decisions
   ```

## Alternatives

If MCP setup is too complex:

1. **Session notes** — Manual handoff documents
2. **CLAUDE.md** — Persistent context without server
3. **Git history** — Decision records in commits

MCP adds value when you need:
- Searchable decision history
- Team-shared memory
- Structured pattern storage

## Evidence

| Source | Finding |
|--------|---------|
| [Anthropic MCP](https://modelcontextprotocol.io/) | 97M+ monthly SDK downloads |
| [MCP Registry](https://github.com/modelcontextprotocol/servers) | 75+ available connectors |

## Next Steps

- [MCP Security](/MCP-SECURITY) — Hardening guide
- [Team Memory Federation](/TEAM-MEMORY-FEDERATION) — Multi-team patterns
