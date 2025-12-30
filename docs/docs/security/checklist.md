# Security Checklist

Use this checklist before deploying AI-assisted code.

## Pre-Commit Checks

- [ ] **Secrets scan passed** — No hardcoded credentials
- [ ] **Dependencies verified** — All packages exist in registry
- [ ] **TODOs reviewed** — No security-related TODOs left
- [ ] **Linting passed** — No security rule violations

## Code Review

### Input Validation
- [ ] All user input is validated
- [ ] Validation uses allowlists where possible
- [ ] File uploads are restricted by type and size
- [ ] JSON/XML parsing has depth limits

### Output Encoding
- [ ] HTML output is encoded
- [ ] URL parameters are encoded
- [ ] JavaScript strings are escaped
- [ ] SQL uses parameterized queries

### Authentication
- [ ] Passwords use secure hashing (bcrypt, argon2)
- [ ] Sessions have secure flags (httpOnly, secure, sameSite)
- [ ] Token comparison uses constant-time
- [ ] Failed attempts have rate limiting

### Authorization
- [ ] Every endpoint checks authorization
- [ ] Privilege checks happen server-side
- [ ] Object-level authorization verified
- [ ] Admin functions are protected

### Data Protection
- [ ] Sensitive data encrypted at rest
- [ ] TLS enforced for transmission
- [ ] PII handling follows regulations
- [ ] Logs don't contain sensitive data

## AI-Specific Checks

### Hallucination Prevention
- [ ] All dependencies verified in registry
- [ ] API endpoints verified to exist
- [ ] External service URLs confirmed
- [ ] Configuration values validated

### Security Command Output
- [ ] `/security-review` passed
- [ ] Identified issues addressed
- [ ] Mitigations documented

### CLAUDE.md Compliance
- [ ] Security section present
- [ ] Constraints followed
- [ ] No forbidden patterns used

## Dependency Security

- [ ] `npm audit` / `pip-audit` clean
- [ ] No known vulnerabilities in deps
- [ ] Dependencies are current
- [ ] License compliance checked

## Infrastructure

- [ ] CORS configured correctly
- [ ] CSP headers set
- [ ] Security headers present
- [ ] Error pages don't leak info

## Documentation

- [ ] Security decisions documented
- [ ] Threat model updated
- [ ] Incident response plan exists
- [ ] Contact info for security issues

## Post-Deployment

- [ ] Security monitoring enabled
- [ ] Log aggregation configured
- [ ] Alerting for anomalies
- [ ] Backup and recovery tested

## Quick Commands

```bash
# Run all security checks
npm audit && \
npx gitleaks detect && \
./scripts/hooks/verify-deps.sh && \
npm run lint

# Security review via Claude
/security-review [feature]

# Check CLAUDE.md
./scripts/hooks/check-claude-md.sh
```

## Severity Guide

| Severity | Action Required |
|----------|----------------|
| **Critical** | Fix before deploy, no exceptions |
| **High** | Fix before deploy, or document accept risk |
| **Medium** | Fix within sprint, track in backlog |
| **Low** | Track in backlog, fix when convenient |

## Resources

- [OWASP Top 10](https://owasp.org/Top10/)
- [OWASP Top 10 for LLMs](https://genai.owasp.org/)
- [CWE Top 25](https://cwe.mitre.org/top25/)
- [SAST Integration Guide](/SAST-INTEGRATION)
