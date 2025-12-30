# /security-review Command

OWASP-aligned security audit for AI-generated code.

## Purpose

Systematic security review focusing on vulnerabilities common in AI-generated code.

## Why It's Essential

| AI Code Security | Rate |
|-----------------|------|
| OWASP Top 10 vulnerabilities | 45% |
| XSS failures | 86% |
| Log injection | 88% |
| Privilege escalation | 322% increase |

## Usage

```
/security-review [file, feature, or scope]
```

**Examples:**
```
/security-review src/auth/
/security-review the payment integration
/security-review user input handling
```

## Output Format

```markdown
## Security Review: [Target]

### OWASP Top 10 Check

| Category | Status | Notes |
|----------|--------|-------|
| A01: Broken Access Control | ✓/⚠️/✗ | [Notes] |
| A02: Cryptographic Failures | ✓/⚠️/✗ | [Notes] |
| A03: Injection | ✓/⚠️/✗ | [Notes] |
| A04: Insecure Design | ✓/⚠️/✗ | [Notes] |
| A05: Security Misconfiguration | ✓/⚠️/✗ | [Notes] |
| A06: Vulnerable Components | ✓/⚠️/✗ | [Notes] |
| A07: Auth Failures | ✓/⚠️/✗ | [Notes] |
| A08: Data Integrity Failures | ✓/⚠️/✗ | [Notes] |
| A09: Logging Failures | ✓/⚠️/✗ | [Notes] |
| A10: SSRF | ✓/⚠️/✗ | [Notes] |

### AI-Specific Checks

| Check | Status | Notes |
|-------|--------|-------|
| Hardcoded secrets | ✓/⚠️/✗ | [Notes] |
| Hallucinated packages | ✓/⚠️/✗ | [Notes] |
| Input validation | ✓/⚠️/✗ | [Notes] |
| Output encoding | ✓/⚠️/✗ | [Notes] |
| Authorization checks | ✓/⚠️/✗ | [Notes] |

### Vulnerabilities Found

- 🔴 **Critical**: [Immediate fix required]
- 🟠 **High**: [Fix before deploy]
- 🟡 **Medium**: [Fix soon]
- 🔵 **Low**: [Track and fix]

### Recommendations
1. [Specific fix with code example]
2. [Specific fix with code example]

### Verification Steps
- [ ] [How to verify fix]
```

## Security Checks

### Input Validation

```markdown
#### Input Validation
- [ ] All user input validated
- [ ] Allowlists preferred over denylists
- [ ] Type checking enforced
- [ ] Length limits applied
- [ ] Special characters handled
```

### Output Encoding

```markdown
#### Output Encoding
- [ ] HTML output encoded
- [ ] URL parameters encoded
- [ ] JavaScript strings escaped
- [ ] SQL uses parameterized queries
- [ ] Shell commands escaped
```

### Authentication

```markdown
#### Authentication
- [ ] Passwords hashed (bcrypt/argon2)
- [ ] Session management secure
- [ ] Token expiration implemented
- [ ] Rate limiting on auth endpoints
- [ ] Account lockout logic
```

### Authorization

```markdown
#### Authorization
- [ ] Every endpoint checks authorization
- [ ] Object-level authorization verified
- [ ] Privilege escalation prevented
- [ ] Admin functions protected
```

### Data Protection

```markdown
#### Data Protection
- [ ] Sensitive data encrypted
- [ ] PII handling compliant
- [ ] Logs don't contain secrets
- [ ] Error messages don't leak info
```

## Best Practices

### 1. Review Before Merge

Run security review before any merge to main:

```
/security-review [feature branch]
```

### 2. Address All Critical/High Issues

Don't merge with unresolved critical or high issues.

### 3. Document Accepted Risks

If a medium/low issue is intentionally not fixed:

```markdown
### Accepted Risks
- [Risk]: [Reason for acceptance] - Owner: [Name]
```

### 4. Combine with Pre-commit Hooks

Security review catches what hooks might miss:

- Hooks: Automated pattern matching
- Review: Contextual security analysis

## Evidence

| Source | Finding |
|--------|---------|
| [Veracode 2025](https://www.veracode.com/blog/genai-code-security-report/) | 45% OWASP vulnerability rate |
| [OWASP GenAI](https://genai.owasp.org/) | AI-specific security guidance |
| [Apiiro 2025](https://apiiro.com/blog/4x-velocity-10x-vulnerabilities-ai-coding-assistants-are-shipping-more-risks/) | 322% privilege escalation increase |

## See Also

- [AI-Specific Vulnerabilities](/docs/security/ai-vulns) — Detailed vulnerability types
- [Security Checklist](/docs/security/checklist) — Pre-deploy verification
- [/review](/commands/review) — General code review
