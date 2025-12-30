---
description: Security-focused code review using OWASP guidelines
---

# Security Review Protocol

Perform a security-focused review of code, checking against OWASP Top 10 and AI-specific vulnerabilities.

## Target: $ARGUMENTS

## Review Checklist

### 1. Injection Vulnerabilities (OWASP A03:2021)

Check for:
- [ ] SQL injection (parameterized queries used?)
- [ ] Command injection (shell escaping proper?)
- [ ] XSS (output encoding correct?)
- [ ] Template injection (user input in templates?)
- [ ] LDAP/XML/other injection vectors

**86% of AI-generated code fails XSS checks. Be thorough.**

### 2. Authentication & Session (OWASP A07:2021)

Check for:
- [ ] Hardcoded credentials or secrets
- [ ] Weak password policies
- [ ] Session token exposure
- [ ] Missing rate limiting
- [ ] Insecure "remember me" implementations

### 3. Sensitive Data Exposure (OWASP A02:2021)

Check for:
- [ ] Secrets in code or logs
- [ ] PII logged inappropriately
- [ ] Sensitive data in error messages
- [ ] Missing encryption at rest/transit
- [ ] Overly verbose error responses

### 4. Access Control (OWASP A01:2021)

Check for:
- [ ] Missing authorization checks
- [ ] Privilege escalation paths (322% more common in AI code)
- [ ] Insecure direct object references
- [ ] CORS misconfiguration
- [ ] Missing function-level access control

### 5. Security Misconfiguration (OWASP A05:2021)

Check for:
- [ ] Debug mode enabled in production
- [ ] Default credentials
- [ ] Unnecessary features enabled
- [ ] Missing security headers
- [ ] Exposed stack traces

### 6. AI-Specific Vulnerabilities

Check for:
- [ ] Log injection (88% of AI code vulnerable - CWE-117)
- [ ] Hallucinated package names (verify dependencies exist)
- [ ] Over-permissive configurations
- [ ] Missing input validation on AI-suggested paths
- [ ] Prompt injection vectors (if applicable)

### 7. Cryptographic Failures (OWASP A02:2021)

Check for:
- [ ] Weak algorithms (MD5, SHA1 for passwords)
- [ ] Hardcoded keys or IVs
- [ ] Insufficient key lengths
- [ ] Missing constant-time comparisons for secrets
- [ ] Insecure random number generation

### 8. Vulnerable Dependencies

Check for:
- [ ] Known CVEs in dependencies
- [ ] Outdated packages with security fixes
- [ ] Hallucinated package names (slopsquatting risk)
- [ ] Typosquatted package names

## Output Format

```markdown
## Security Review: [target]

### Summary
[One sentence assessment]

### Findings

#### 🔴 Critical (must fix before merge)
- [Finding]: [description]
  - **Location**: [file:line]
  - **Risk**: [what could go wrong]
  - **Fix**: [how to remediate]

#### 🟡 Warning (should address)
- [Finding]: [description]
  - **Location**: [file:line]
  - **Risk**: [what could go wrong]
  - **Fix**: [how to remediate]

#### 🟢 Note (consider)
- [Finding]: [description]

### Passed Checks
- [x] [Check that passed]

### Recommendations
1. [Priority recommendation]
2. [Secondary recommendation]

### Verdict
[ ] ✅ SECURE - No critical issues found
[ ] ⚠️ NEEDS WORK - Issues require attention before deploy
[ ] 🚫 INSECURE - Critical vulnerabilities present
```

## Additional Actions

If this code handles:
- **Authentication**: Run extra checks on password handling, session management
- **Payments**: Verify PCI-DSS relevant controls
- **User Data**: Check GDPR/privacy implications
- **File Uploads**: Verify content-type validation, size limits
- **External APIs**: Check for secret exposure, proper error handling

## References

- [OWASP Top 10 2021](https://owasp.org/Top10/)
- [OpenSSF AI Code Security Guide](https://best.openssf.org/Security-Focused-Guide-for-AI-Code-Assistant-Instructions)
- [CWE Top 25](https://cwe.mitre.org/top25/archive/2023/2023_top25_list.html)
