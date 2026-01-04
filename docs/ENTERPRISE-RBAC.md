# Enterprise RBAC Documentation

Role-Based Access Control (RBAC) patterns for enterprise deployments of the AI Excellence Framework.

---

## Overview

Enterprise teams need granular control over:

- Who can modify AI configurations
- What actions AI assistants can take
- How context is shared across teams
- Audit logging of AI interactions

This guide provides RBAC patterns for enterprise environments.

---

## Role Definitions

### Core Roles

| Role          | Description             | Permissions                        |
| ------------- | ----------------------- | ---------------------------------- |
| **Admin**     | Full system access      | All permissions                    |
| **Architect** | Configuration authority | Modify CLAUDE.md, agents, commands |
| **Developer** | Standard user           | Use AI tools, read configs         |
| **Reviewer**  | Code review focus       | Read-only AI access, review tools  |
| **Auditor**   | Compliance oversight    | Read logs, no AI interaction       |

### Permission Matrix

| Permission        | Admin | Architect | Developer | Reviewer | Auditor |
| ----------------- | ----- | --------- | --------- | -------- | ------- |
| Modify CLAUDE.md  | ✅    | ✅        | ❌        | ❌       | ❌      |
| Create commands   | ✅    | ✅        | ❌        | ❌       | ❌      |
| Create agents     | ✅    | ✅        | ❌        | ❌       | ❌      |
| Use AI assistants | ✅    | ✅        | ✅        | ✅       | ❌      |
| Execute commands  | ✅    | ✅        | ✅        | Limited  | ❌      |
| Modify MCP config | ✅    | ❌        | ❌        | ❌       | ❌      |
| View audit logs   | ✅    | ✅        | ❌        | ❌       | ✅      |
| Export data       | ✅    | ✅        | ❌        | ❌       | ✅      |

---

## Implementation Patterns

### Git-Based RBAC

Use CODEOWNERS for configuration files:

```text
# .github/CODEOWNERS

# AI configuration requires architect approval
CLAUDE.md @org/architects
.claude/ @org/architects
AGENTS.md @org/architects

# MCP server requires admin approval
scripts/mcp/ @org/admins

# Hooks require security team approval
scripts/hooks/ @org/security-team
```

### Branch Protection

```yaml
# .github/branch-protection.yml (via GitHub Actions or API)
protection_rules:
  main:
    required_approvals: 2
    required_reviews_from:
      - architects
    paths:
      - 'CLAUDE.md'
      - '.claude/**'
      - 'AGENTS.md'
```

### Environment-Based Roles

```bash
# Set role via environment variable
export AIX_USER_ROLE="developer"

# Role-aware hook execution
if [ "$AIX_USER_ROLE" != "architect" ] && [ "$AIX_USER_ROLE" != "admin" ]; then
    echo "⚠️  CLAUDE.md modification requires architect role"
    exit 1
fi
```

---

## MCP Server RBAC

### Role Configuration

Configure in `mcp-config.json`:

```json
{
  "rbac": {
    "enabled": true,
    "roles": {
      "admin": {
        "permissions": ["*"]
      },
      "architect": {
        "permissions": ["decisions:*", "patterns:*", "context:*"]
      },
      "developer": {
        "permissions": ["decisions:read", "patterns:read", "context:read", "context:write"]
      },
      "reviewer": {
        "permissions": ["decisions:read", "patterns:read"]
      }
    },
    "users": {
      "alice@example.com": "admin",
      "bob@example.com": "architect",
      "default": "developer"
    }
  }
}
```

### Permission Enforcement

```python
# In project-memory-server.py

def check_permission(user: str, action: str, resource: str) -> bool:
    """Check if user has permission for action on resource."""
    role = get_user_role(user)
    permissions = ROLE_PERMISSIONS.get(role, [])

    required = f"{resource}:{action}"

    return (
        "*" in permissions or
        required in permissions or
        f"{resource}:*" in permissions
    )

@server.tool("remember_decision")
async def remember_decision(arguments: dict) -> list:
    user = get_current_user()
    if not check_permission(user, "write", "decisions"):
        raise PermissionError("Insufficient permissions to write decisions")

    # ... proceed with operation
```

---

## Audit Logging

### Log Format

```json
{
  "timestamp": "2026-01-03T10:30:00Z",
  "event_type": "ai_interaction",
  "user": "developer@example.com",
  "role": "developer",
  "action": "execute_command",
  "resource": "/plan",
  "context": {
    "project": "frontend",
    "branch": "feature/auth"
  },
  "result": "success",
  "duration_ms": 1523
}
```

### Audit Hook Script

```bash
#!/bin/bash
# scripts/hooks/audit-log.sh

LOG_FILE="${AIX_AUDIT_LOG:-/var/log/aix-audit.log}"

log_event() {
    local event_type="$1"
    local action="$2"
    local result="$3"

    jq -n \
        --arg ts "$(date -u +"%Y-%m-%dT%H:%M:%SZ")" \
        --arg type "$event_type" \
        --arg user "${USER:-unknown}" \
        --arg role "${AIX_USER_ROLE:-developer}" \
        --arg action "$action" \
        --arg result "$result" \
        '{
            timestamp: $ts,
            event_type: $type,
            user: $user,
            role: $role,
            action: $action,
            result: $result
        }' >> "$LOG_FILE"
}

# Log AI command execution
log_event "ai_interaction" "$1" "${2:-success}"
```

### PowerShell Audit Hook

```powershell
# scripts/hooks/powershell/Write-AuditLog.ps1

function Write-AuditLog {
    param(
        [string]$EventType,
        [string]$Action,
        [string]$Result = "success"
    )

    $logPath = $env:AIX_AUDIT_LOG ?? "/var/log/aix-audit.log"

    $entry = @{
        timestamp = (Get-Date -Format "yyyy-MM-ddTHH:mm:ssZ")
        event_type = $EventType
        user = $env:USER ?? "unknown"
        role = $env:AIX_USER_ROLE ?? "developer"
        action = $Action
        result = $Result
    } | ConvertTo-Json -Compress

    Add-Content -Path $logPath -Value $entry
}
```

---

## CI/CD Integration

### Role Verification in Pipeline

```yaml
# .github/workflows/verify-config-changes.yml
name: Verify Configuration Changes

on:
  pull_request:
    paths:
      - 'CLAUDE.md'
      - '.claude/**'
      - 'AGENTS.md'

jobs:
  verify-permissions:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Check author role
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        run: |
          AUTHOR="${{ github.event.pull_request.user.login }}"

          # Check if author is in architects team
          TEAMS=$(gh api /orgs/${{ github.repository_owner }}/teams/architects/members --jq '.[].login')

          if ! echo "$TEAMS" | grep -q "^${AUTHOR}$"; then
            echo "❌ Author $AUTHOR is not an architect"
            echo "AI configuration changes require architect role"
            exit 1
          fi

          echo "✅ Author $AUTHOR has architect role"

      - name: Validate changes
        run: |
          npx ai-excellence-framework validate
          npx ai-excellence-framework lint
```

### Deployment Gate

```yaml
# .github/workflows/deploy.yml
jobs:
  deploy:
    runs-on: ubuntu-latest
    environment:
      name: production
      url: https://example.com

    steps:
      - name: Verify deployer role
        run: |
          # Require admin role for production deployments
          if [ "${{ github.actor }}" != "deployment-bot" ]; then
            echo "Production deployments require admin approval"
            exit 1
          fi
```

---

## SSO/Identity Integration

### OAuth2/OIDC Configuration

```json
{
  "auth": {
    "provider": "oidc",
    "issuer": "https://auth.example.com",
    "client_id": "aix-framework",
    "scopes": ["openid", "profile", "groups"],
    "role_claim": "groups",
    "role_mapping": {
      "ai-admins": "admin",
      "ai-architects": "architect",
      "developers": "developer",
      "reviewers": "reviewer"
    }
  }
}
```

### LDAP Integration

```json
{
  "auth": {
    "provider": "ldap",
    "server": "ldap://ldap.example.com",
    "base_dn": "dc=example,dc=com",
    "user_dn": "ou=users",
    "group_dn": "ou=groups",
    "role_mapping": {
      "cn=ai-admins": "admin",
      "cn=ai-architects": "architect",
      "cn=developers": "developer"
    }
  }
}
```

---

## Data Classification

### Sensitivity Levels

| Level            | Description      | Handling              |
| ---------------- | ---------------- | --------------------- |
| **Public**       | Open information | No restrictions       |
| **Internal**     | Company-wide     | Team access only      |
| **Confidential** | Team-specific    | Named individuals     |
| **Restricted**   | Highly sensitive | Admin-only, encrypted |

### Classification in CLAUDE.md

```markdown
## Data Classification

### Public

- Open source code patterns
- General architectural decisions
- Public API documentation

### Internal

- Team conventions
- Internal tool configurations
- Non-sensitive business logic

### Confidential

- Customer-specific implementations
- Proprietary algorithms
- Internal security measures

### Restricted (NOT FOR AI CONTEXT)

- API keys and secrets
- Customer PII
- Security vulnerabilities
```

### Enforcement

```bash
# scripts/hooks/check-data-classification.sh

# Check for restricted data in AI context files
RESTRICTED_PATTERNS=(
    'API_KEY'
    'SECRET'
    'PASSWORD'
    'customer.*id'
    'ssn|social.security'
    'credit.card'
)

for pattern in "${RESTRICTED_PATTERNS[@]}"; do
    if grep -riE "$pattern" CLAUDE.md .claude/ 2>/dev/null; then
        echo "❌ Restricted data pattern found: $pattern"
        exit 1
    fi
done
```

---

## Compliance Considerations

### SOC 2 Type II

- [ ] Access controls documented
- [ ] Audit logging enabled
- [ ] Change management process
- [ ] Regular access reviews

### GDPR

- [ ] Data processing inventory
- [ ] Consent management
- [ ] Data subject rights support
- [ ] Cross-border transfer controls

### HIPAA

- [ ] PHI access controls
- [ ] Audit trails
- [ ] Encryption requirements
- [ ] BAA considerations for AI providers

---

## Best Practices

### 1. Principle of Least Privilege

Grant minimum permissions needed:

```json
{
  "developer": {
    "permissions": ["context:read", "patterns:read", "decisions:read"]
  }
}
```

### 2. Regular Access Reviews

```yaml
# .github/workflows/access-review.yml
name: Quarterly Access Review
on:
  schedule:
    - cron: '0 0 1 */3 *' # First day of each quarter

jobs:
  generate-report:
    runs-on: ubuntu-latest
    steps:
      - name: Generate access report
        run: |
          # List all users with elevated permissions
          gh api /orgs/${{ github.repository_owner }}/teams --jq '
            .[] | select(.slug | test("architect|admin")) |
            .slug + ": " + (.members_count | tostring) + " members"
          '
```

### 3. Separation of Duties

- Architects define configurations
- Security team reviews hooks
- Admins manage infrastructure
- Auditors review logs

### 4. Emergency Access

```json
{
  "emergency_access": {
    "enabled": true,
    "break_glass_group": "security-oncall",
    "requires_justification": true,
    "auto_revoke_hours": 4,
    "notify": ["security@example.com"]
  }
}
```

---

## Troubleshooting

### Permission Denied

1. Check user role: `echo $AIX_USER_ROLE`
2. Verify group membership
3. Check CODEOWNERS file
4. Review audit logs

### Configuration Not Applied

1. Verify config file location
2. Check file permissions
3. Restart MCP server
4. Validate JSON syntax

### Audit Log Issues

1. Check log file permissions
2. Verify disk space
3. Check log rotation config
4. Test write permissions

---

## Resources

- [NIST RBAC Model](https://csrc.nist.gov/projects/role-based-access-control)
- [OWASP Access Control](https://owasp.org/www-community/Access_Control)
- [GitHub CODEOWNERS](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/about-code-owners)

---

_Part of the AI Excellence Framework_
