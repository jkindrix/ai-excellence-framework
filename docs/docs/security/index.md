# Security Overview

AI-generated code has measurably higher vulnerability rates. This section covers AI-specific security concerns and mitigations.

## The Security Gap

| Metric | Value | Source |
|--------|-------|--------|
| OWASP Top 10 vulnerabilities | 45% | [Veracode 2025](https://www.veracode.com/blog/genai-code-security-report/) |
| XSS vulnerability rate | 86% | Veracode 2025 |
| Log injection rate | 88% | Veracode 2025 |
| Privilege escalation increase | 322% | [Apiiro 2025](https://apiiro.com/blog/4x-velocity-10x-vulnerabilities-ai-coding-assistants-are-shipping-more-risks/) |
| Package hallucination | ~20% | [BleepingComputer 2025](https://www.bleepingcomputer.com/news/security/ai-hallucinated-code-dependencies-become-new-supply-chain-risk/) |

## Why AI Code is Less Secure

1. **Training data includes vulnerabilities** — Historical code has historical flaws
2. **No security optimization** — Models optimize for "likely," not "secure"
3. **Vibe coding** — Developers don't specify security requirements
4. **Confidence doesn't track security** — Vulnerabilities delivered confidently

## Framework Security Features

### Pre-commit Hooks

```yaml
repos:
  - repo: local
    hooks:
      - id: verify-deps        # Slopsquatting prevention
      - id: check-todos        # Incomplete work detection

  - repo: https://github.com/gitleaks/gitleaks
    hooks:
      - id: gitleaks          # Secret detection
```

### /security-review Command

OWASP-aligned security audit:

```
/security-review [file or feature]
```

Checks:
- Input validation
- Output encoding
- Authentication/authorization
- Injection vulnerabilities
- AI-specific issues

### CLAUDE.md Security Section

```markdown
## Security Requirements
- Validate all user input
- Use parameterized queries
- Encode output for context
- Never log sensitive data
- Use constant-time comparison for secrets
```

## Security Resources

- [AI-Specific Vulnerabilities](/docs/security/ai-vulns) — Detailed vulnerability types
- [MCP Security](/MCP-SECURITY) — MCP server hardening
- [SAST Integration](/SAST-INTEGRATION) — Static analysis setup
- [Security Checklist](/docs/security/checklist) — Pre-deploy verification

## OWASP References

| Standard | Version | URL |
|----------|---------|-----|
| OWASP Top 10 | 2021 | [owasp.org/Top10](https://owasp.org/Top10/) |
| OWASP Top 10 for LLMs | 2025 | [genai.owasp.org](https://genai.owasp.org/) |
| CWE Top 25 | 2023 | [cwe.mitre.org](https://cwe.mitre.org/top25/) |

## Key Recommendations

1. **Always use pre-commit hooks** — Automated security gates
2. **Run /security-review before merge** — Manual verification
3. **Include security in CLAUDE.md** — Explicit constraints
4. **Validate dependencies** — Prevent slopsquatting
5. **Scan for secrets** — Before every commit
