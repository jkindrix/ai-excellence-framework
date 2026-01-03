# MCP Server Security Guide

This document covers security considerations, hardening recommendations, and best practices for deploying the Project Memory MCP Server.

## Overview

The Model Context Protocol (MCP) server provides persistent memory for AI-assisted development sessions. While powerful, it requires careful security configuration to prevent abuse and protect sensitive data.

**Security Research Context**: In June 2025, [Backslash Security identified vulnerabilities](https://www.anthropic.com/news/model-context-protocol) in 2,000+ MCP servers, including over-permissioning patterns. This guide addresses those concerns.

---

## Threat Model

### Potential Attack Vectors

| Vector                   | Risk                               | Mitigation                           |
| ------------------------ | ---------------------------------- | ------------------------------------ |
| **Prompt Injection**     | AI manipulation to exfiltrate data | Input sanitization, output filtering |
| **Data Exfiltration**    | Sensitive project info leaked      | Access controls, encryption          |
| **Denial of Service**    | Resource exhaustion                | Rate limiting, size limits           |
| **SQL Injection**        | Database compromise                | Parameterized queries (implemented)  |
| **Path Traversal**       | Unauthorized file access           | Path validation (implemented)        |
| **Privilege Escalation** | Unauthorized operations            | Confirmation for destructive ops     |

### Data Sensitivity Levels

| Data Type | Sensitivity | Protection                         |
| --------- | ----------- | ---------------------------------- |
| Decisions | Medium      | Stored plaintext, sanitized input  |
| Patterns  | Low-Medium  | Code examples may contain secrets  |
| Context   | Variable    | Key-value pairs, user-controlled   |
| Exports   | High        | Contains all data, encrypt at rest |

---

## Built-in Security Features

### 1. Input Sanitization

All inputs are sanitized before storage:

```python
def sanitize_input(value: str, max_length: int = 10000) -> str:
    """Sanitize string input to prevent injection and limit size."""
    if not isinstance(value, str):
        value = str(value)
    # Truncate if too long
    if len(value) > max_length:
        value = value[:max_length] + "... [truncated]"
    # Remove null bytes and other problematic characters
    value = value.replace('\x00', '')
    return value.strip()
```

### 2. Key Validation

Pattern and context keys are validated against a strict allowlist:

```python
def validate_key(key: str) -> bool:
    """Validate that a key is safe for use."""
    if not key or not isinstance(key, str):
        return False
    # Allow alphanumeric, underscores, hyphens, dots
    return bool(re.match(r'^[\w\-\.]+$', key)) and len(key) <= 100
```

### 3. Rate Limiting

Prevents abuse through excessive requests:

```python
# Configuration via environment
PROJECT_MEMORY_RATE_LIMIT=100  # Max 100 operations per minute

# Built-in rate limiter
rate_limiter = RateLimiter(max_ops=RATE_LIMIT, window_seconds=60)
```

#### Recommended Settings by Team Size

| Deployment Type     | Team Size | RATE_LIMIT | POOL_SIZE | Rationale                                                  |
| ------------------- | --------- | ---------- | --------- | ---------------------------------------------------------- |
| **Solo Developer**  | 1         | 100        | 3         | Default settings are sufficient for individual use         |
| **Small Team**      | 2-5       | 300        | 5         | Moderate concurrency, shared memory access                 |
| **Medium Team**     | 6-15      | 600        | 10        | Higher concurrency, consider read replicas                 |
| **Large Team**      | 16-50     | 1000       | 20        | Consider PostgreSQL backend for scalability                |
| **Enterprise**      | 50+       | 2000+      | 50+       | Requires PostgreSQL, sharding, dedicated infrastructure    |

**Configuration Examples:**

```bash
# Small Team (2-5 developers)
export PROJECT_MEMORY_RATE_LIMIT=300
export PROJECT_MEMORY_POOL_SIZE=5
export PROJECT_MEMORY_POOL_WARMUP=true

# Medium Team (6-15 developers)
export PROJECT_MEMORY_RATE_LIMIT=600
export PROJECT_MEMORY_POOL_SIZE=10
export PROJECT_MEMORY_POOL_WARMUP=true
export PROJECT_MEMORY_MAX_DECISIONS=5000

# Large Team (16+ developers)
# Consider switching to PostgreSQL backend
export PROJECT_MEMORY_RATE_LIMIT=1000
export PROJECT_MEMORY_POOL_SIZE=20
export PROJECT_MEMORY_STORAGE=postgres
export PROJECT_MEMORY_POSTGRES_URL="postgresql://user:pass@host/db"
```

**Monitoring Rate Limits:**

The rate limiter exposes metrics via the `get_rate_limiter_stats` tool:

```
Tool: get_rate_limiter_stats
Response: {
  "current_window_ops": 45,
  "limit": 100,
  "window_seconds": 60,
  "utilization_percent": 45
}
```

Monitor `utilization_percent` - if consistently >80%, increase `RATE_LIMIT`.

### 4. Size Limits

Configurable limits prevent resource exhaustion:

| Resource      | Default Limit | Environment Variable              |
| ------------- | ------------- | --------------------------------- |
| Decisions     | 1000          | `PROJECT_MEMORY_MAX_DECISIONS`    |
| Patterns      | 100           | `PROJECT_MEMORY_MAX_PATTERNS`     |
| Context Keys  | 50            | `PROJECT_MEMORY_MAX_CONTEXT_KEYS` |
| String Length | 10000 chars   | (hardcoded)                       |

### 5. Destructive Operation Confirmation

The `purge_memory` operation requires explicit confirmation:

```
⚠️ To purge all memory, you must pass confirm='CONFIRM_PURGE'
This will permanently delete ALL decisions, patterns, and context!
```

---

## Hardening Recommendations

### 1. Database Security

#### Enable Encryption at Rest

For sensitive projects, use SQLCipher:

```bash
# Install SQLCipher
pip install sqlcipher3

# Set encryption key via environment
export PROJECT_MEMORY_ENCRYPTION_KEY="your-secure-key"
```

#### Restrict File Permissions

```bash
# Ensure database is only readable by owner
chmod 600 ~/.claude/project-memories/*.db

# Restrict directory access
chmod 700 ~/.claude/project-memories/
```

### 2. Network Security (Team Deployments)

If exposing MCP over network for team use:

```bash
# Only allow localhost connections
export PROJECT_MEMORY_BIND_HOST=127.0.0.1

# Use TLS for remote access (if exposed)
export PROJECT_MEMORY_TLS_CERT=/path/to/cert.pem
export PROJECT_MEMORY_TLS_KEY=/path/to/key.pem
```

### 3. Access Control & Authentication

#### API Key Authentication

For team deployments, enable API key authentication to restrict access:

```bash
# Enable API key requirement
export PROJECT_MEMORY_API_KEY="your-secure-api-key-here"

# Generate a secure API key
openssl rand -hex 32
```

**Client Configuration** (in Claude settings):

```json
{
  "mcpServers": {
    "project-memory": {
      "command": "python",
      "args": ["scripts/mcp/project-memory-server.py"],
      "env": {
        "PROJECT_MEMORY_API_KEY": "${PROJECT_MEMORY_API_KEY}"
      }
    }
  }
}
```

#### Multi-User Authentication (Team Deployments)

For teams with multiple users accessing a shared MCP server:

```bash
# Option 1: Shared API key (simpler, less secure)
export PROJECT_MEMORY_API_KEY="team-shared-key"

# Option 2: Per-user keys via reverse proxy (more secure)
# Use nginx/traefik with JWT validation

# Option 3: OAuth2 integration (enterprise)
export PROJECT_MEMORY_AUTH_PROVIDER="oauth2"
export PROJECT_MEMORY_OAUTH_ISSUER="https://auth.example.com"
export PROJECT_MEMORY_OAUTH_AUDIENCE="mcp-server"
```

#### Role-Based Access Control (RBAC)

Future versions will support granular permissions:

| Role     | Permissions                                                      |
| -------- | ---------------------------------------------------------------- |
| `reader` | `recall_decisions`, `get_patterns`, `get_context`                |
| `writer` | All reader + `remember_decision`, `store_pattern`, `set_context` |
| `admin`  | All writer + `purge_memory`, `export_memory`, `import_memory`    |

Currently, all authenticated users have full access. Plan RBAC for team deployments.

#### Read-Only Mode

```bash
# Disable write operations (useful for shared databases)
export PROJECT_MEMORY_READ_ONLY=true
```

#### IP Allowlist

For network-exposed deployments:

```bash
# Only allow specific IPs
export PROJECT_MEMORY_ALLOWED_IPS="10.0.0.0/8,192.168.1.0/24,127.0.0.1"
```

### 4. Logging & Monitoring

#### Enable Audit Logging

```bash
# Log all operations for audit
export PROJECT_MEMORY_LOG_LEVEL=INFO
export PROJECT_MEMORY_AUDIT_LOG=/var/log/mcp-audit.log
```

#### Monitor for Anomalies

Watch for:

- Unusual rate of operations
- Large data exports
- Failed authentication attempts
- Attempts to store secrets

---

## Security Checklist

### Deployment Checklist

- [ ] Database file permissions set to 600
- [ ] Database directory permissions set to 700
- [ ] Rate limiting configured appropriately
- [ ] Size limits reviewed for your use case
- [ ] Logging enabled for audit trail
- [ ] Backup strategy implemented
- [ ] Encryption enabled for sensitive projects

### Operational Security

- [ ] Regular review of stored decisions for secrets
- [ ] Periodic purge of outdated data
- [ ] Monitor disk usage
- [ ] Review export operations
- [ ] Test restore from backup

### Code Review for Stored Content

Before storing, verify:

- [ ] No API keys or secrets in decision text
- [ ] No passwords in pattern examples
- [ ] No PII in context values
- [ ] No internal URLs or paths that shouldn't be shared

---

## Known Vulnerabilities & Mitigations

### MCP Protocol-Level Issues (June 2025 Research)

| Issue                       | Status              | Mitigation                |
| --------------------------- | ------------------- | ------------------------- |
| Tool Combining Exfiltration | Mitigated           | Single-tool server design |
| Lookalike Tools             | Not Applicable      | Self-contained server     |
| Over-Permissioning          | Mitigated           | Minimal permission set    |
| Prompt Injection            | Partially Mitigated | Input sanitization        |

### Recommended Additional Protections

1. **Content Scanning**: Integrate with secrets detection

   ```bash
   # Scan exports for secrets before sharing
   detect-secrets scan export.json
   ```

2. **Network Isolation**: Run in isolated network for team deployments

3. **Regular Updates**: Keep MCP SDK and server updated
   ```bash
   pip install --upgrade mcp
   ```

---

## Incident Response

### If Secrets Are Accidentally Stored

1. **Immediately** purge affected data:

   ```
   Tool: purge_memory
   Arguments: {"confirm": "CONFIRM_PURGE"}
   ```

2. **Rotate** any exposed credentials

3. **Review** access logs for data access

4. **Update** patterns to prevent recurrence

### If Database Is Compromised

1. **Isolate** the system
2. **Preserve** logs for forensics
3. **Reset** database with fresh initialization
4. **Review** all decisions/patterns that were stored
5. **Notify** team members if team deployment

---

## OWASP LLM Top 10 (2025) Alignment

The AI Excellence Framework addresses key risks from the [OWASP Top 10 for LLM Applications 2025](https://genai.owasp.org/llm-top-10/):

| OWASP LLM Risk                                  | Framework Mitigation                                           |
| ----------------------------------------------- | -------------------------------------------------------------- |
| **LLM01: Prompt Injection**                     | Input sanitization, output validation, security review command |
| **LLM02: Sensitive Information Disclosure**     | Pre-commit secrets detection, audit logging, sanitized storage |
| **LLM03: Supply Chain Vulnerabilities**         | `verify-deps.sh` prevents slopsquatting, dependency scanning   |
| **LLM04: Data/Model Poisoning**                 | N/A (framework doesn't train models)                           |
| **LLM05: Improper Output Handling**             | `/verify` command, validation hooks, security review checklist |
| **LLM06: Excessive Agency**                     | Confirmation for destructive operations, rate limiting         |
| **LLM07: System Prompt Leakage**                | N/A (no system prompts in MCP server)                          |
| **LLM08: Vector and Embedding Vulnerabilities** | N/A (no RAG/embedding storage)                                 |
| **LLM09: Misinformation**                       | Research citations verification, `/verify` skepticism protocol |
| **LLM10: Unbounded Consumption**                | Rate limiting, size limits, resource monitoring                |

### New for 2025: Agentic AI Security

As 2025 emerges as the "year of LLM agents," the framework includes specific mitigations:

1. **Excessive Agency Controls**
   - MCP server requires explicit confirmation for destructive operations
   - Rate limiting prevents runaway operations
   - Audit logging tracks all agent actions

2. **Agent Permission Boundaries**
   - MCP server has minimal permissions (read/write to SQLite only)
   - No file system access beyond database
   - No network access beyond MCP protocol

3. **Multi-Agent Considerations**
   - Connection pooling supports multiple concurrent agents
   - Thread-safe operations prevent race conditions
   - Clear audit trail for forensics

---

## References

- [Anthropic MCP Security](https://www.anthropic.com/news/model-context-protocol)
- [OWASP Top 10 for LLM Applications 2025](https://genai.owasp.org/llm-top-10/)
- [OWASP Injection Prevention](https://owasp.org/www-community/Injection_Prevention_Cheat_Sheet)
- [SQLite Security](https://sqlite.org/security.html)
- [MCP Authorization Specification (June 2025)](https://modelcontextprotocol.io/)
- [OWASP Agentic AI Top 10](https://securityboulevard.com/2025/12/from-chatbot-to-code-threat-owasps-agentic-ai-top-10-and-the-specialized-risks-of-coding-agents/)

---

## Document History

| Date       | Changes                                                    |
| ---------- | ---------------------------------------------------------- |
| 2026-01-01 | Initial release with framework v1.0.0                      |
