# Security Policy

## Supported Versions

We release patches for security vulnerabilities in the following versions:

| Version | Supported          |
| ------- | ------------------ |
| 1.5.x   | :white_check_mark: |
| 1.4.x   | :white_check_mark: |
| < 1.4   | :x:                |

## Reporting a Vulnerability

**Please do not report security vulnerabilities through public GitHub issues.**

Instead, please report them through one of these channels:

### Option 1: GitHub Security Advisories (Preferred)

1. Go to the [Security tab](https://github.com/ai-excellence-framework/ai-excellence-framework/security) of this repository
2. Click "Report a vulnerability"
3. Fill out the form with details

### Option 2: Email

Send an email to the maintainers with:

- A description of the vulnerability
- Steps to reproduce the issue
- Affected versions
- Any potential impact assessment

## What to Include

When reporting a vulnerability, please include:

1. **Type of vulnerability** (e.g., XSS, injection, privilege escalation)
2. **Location** of the affected source code (file, line number, function)
3. **Proof of concept** or exploit code (if available)
4. **Impact assessment** - what an attacker could accomplish
5. **Suggested remediation** (if you have recommendations)

## Response Timeline

- **Initial Response**: Within 48 hours of receipt
- **Triage Completed**: Within 7 days
- **Fix Development**: Depends on severity (critical: 7 days, high: 14 days, medium: 30 days)
- **Public Disclosure**: After fix is released (coordinated with reporter)

## Security Update Process

1. Security issue received and acknowledged
2. Issue triaged and severity assessed
3. Fix developed and tested
4. Security advisory drafted
5. Fix released with advisory
6. CVE requested (if applicable)

## Vulnerability Disclosure Policy

We follow a coordinated disclosure policy:

- We will work with you to understand and validate the issue
- We will develop and test a fix
- We will publicly disclose the vulnerability after a fix is available
- We will credit the reporter (unless anonymity is requested)

### Disclosure Timeline

- **90 days** maximum from report to public disclosure
- Earlier disclosure if a fix is released
- Extensions possible for complex issues (with mutual agreement)

## Security Best Practices for Users

When using the AI Excellence Framework:

### 1. Keep Updated

```bash
npm update ai-excellence-framework
```

### 2. Use Pre-commit Hooks

```bash
pip install pre-commit
pre-commit install
```

The hooks include:
- `detect-secrets` for credential scanning
- Dependency vulnerability checking
- AI-specific pattern detection

### 3. Validate AI-Generated Code

Always run `/security-review` on AI-generated code, especially:

- Authentication and authorization code
- Input handling and validation
- Database queries
- External API integrations
- File system operations

### 4. Check Dependencies

The framework includes slopsquatting prevention:

```bash
# Verify dependencies before installing
./scripts/hooks/verify-deps.sh
```

### 5. Use the Doctor Command

```bash
npx ai-excellence-framework doctor
```

This checks for:
- Outdated dependencies
- Missing security configurations
- Known vulnerability patterns

## Security Features

The framework includes security features to help protect your codebase:

| Feature | Purpose |
| --- | --- |
| `/security-review` command | OWASP-aligned security audit |
| Pre-commit hooks | Automated security scanning |
| `verify-deps.sh` | Slopsquatting detection |
| MCP server security | Rate limiting, input validation |
| Template security | No hardcoded credentials in templates |

## Known Security Considerations

### AI-Specific Risks

The framework is designed to mitigate AI-specific security risks:

| Risk | Prevalence | Mitigation |
| --- | --- | --- |
| XSS in AI code | 86% | `/security-review` command |
| Log injection | 88% | Pattern detection in hooks |
| Hallucinated packages | 20% | `verify-deps.sh` hook |
| Privilege escalation | 322% higher | Access control reviews |

### MCP Server

The MCP server includes security measures:

- **Input validation**: All inputs sanitized
- **Rate limiting**: Prevents abuse
- **No code execution**: Read-only memory operations
- **Local-only**: No network exposure by default

## Security Acknowledgments

We thank the following for their contributions to the security of this project:

- [Contributors listed here]

## Additional Resources

- [OWASP LLM Top 10 2025](https://owasp.org/www-project-top-10-for-large-language-model-applications/)
- [OpenSSF AI Security Guide](https://github.com/ossf/ai-ml-security)
- [Framework Security Documentation](docs/MCP-SECURITY.md)
