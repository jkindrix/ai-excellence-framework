# Security Friction

AI-generated code has measurably higher vulnerability rates than human-written code. This isn't theoretical—it's documented in multiple 2024-2025 studies.

## The Security Gap

| Vulnerability Type | AI Code Rate | Source |
|-------------------|--------------|--------|
| Any OWASP Top 10 | 45% | [Veracode 2025](https://www.veracode.com/blog/genai-code-security-report/) |
| XSS (CWE-80) | 86% failure | [Veracode 2025](https://www.helpnetsecurity.com/2025/08/07/create-ai-code-security-risks/) |
| Log Injection (CWE-117) | 88% vulnerable | Veracode 2025 |
| Privilege Escalation | 322% increase | [Apiiro 2025](https://apiiro.com/blog/4x-velocity-10x-vulnerabilities-ai-coding-assistants-are-shipping-more-risks/) |
| Architectural Flaws | 153% increase | Apiiro 2025 |

**Key finding:** Larger models don't perform significantly better than smaller models on security. This is a systemic issue, not a scaling problem.

## Package Hallucination (Slopsquatting)

AI models suggest packages that don't exist:

| Model Type | Hallucination Rate |
|------------|-------------------|
| Open-source LLMs | ~20% |
| ChatGPT-4 | ~5% |
| Repeated hallucinations | 58% consistent |

**Attack vector:** Attackers register malicious packages with hallucinated names. Developers run `npm install [hallucinated-package]` and execute malware.

This attack is called "slopsquatting" ([BleepingComputer 2025](https://www.bleepingcomputer.com/news/security/ai-hallucinated-code-dependencies-become-new-supply-chain-risk/)).

## Why AI Code is Less Secure

1. **Training on vulnerable code** — Historical code includes historical vulnerabilities
2. **Pattern completion over security** — AI optimizes for "likely next token," not "secure token"
3. **No security requirements in prompts** — "Vibe coding" doesn't specify constraints
4. **Confidence doesn't track security** — Vulnerabilities delivered with same confidence as secure code

## OWASP Top 10 for LLM Applications (2025)

The updated OWASP list includes AI-specific risks:

1. **Prompt Injection** — Direct manipulation via input
2. **Sensitive Data Disclosure** — Training data leakage
3. **Supply Chain Vulnerabilities** — Poisoned models and data
4. **Insecure Output Handling** — XSS, injection via AI output
5. **Excessive Agency** — AI with too many permissions

## Mitigations

### Pre-commit Security Hooks (Impact: 5/5)

```yaml
# .pre-commit-config.yaml
repos:
  - repo: local
    hooks:
      - id: verify-deps
        name: Verify dependencies exist
        entry: scripts/hooks/verify-deps.sh
        language: script

  - repo: https://github.com/gitleaks/gitleaks
    hooks:
      - id: gitleaks
        name: Detect secrets
```

### /security-review Command (Impact: 4/5)

OWASP-aligned security audit:

```
/security-review [file or feature]
```

Checks for:
- OWASP Top 10 vulnerabilities
- AI-specific security issues
- Input validation gaps
- Output encoding issues

### Dependency Validation (Impact: 5/5)

The `verify-deps.sh` hook:
1. Extracts package names from package.json
2. Checks npm registry for existence
3. Blocks commit if packages don't exist

Prevents slopsquatting attacks automatically.

### Explicit Security Constraints (Impact: 4/5)

In CLAUDE.md:

```markdown
## Security Requirements
- Validate all user input
- Use parameterized queries (never string concatenation for SQL)
- Encode output for context (HTML, URL, JS)
- Never log sensitive data (passwords, tokens, PII)
```

## Evidence

| Source | Key Finding |
|--------|-------------|
| [Veracode 2025](https://www.veracode.com/blog/genai-code-security-report/) | 45% of AI code has OWASP vulnerabilities |
| [OWASP GenAI](https://genai.owasp.org/) | Updated Top 10 for LLM applications |
| [Apiiro 2025](https://apiiro.com/blog/4x-velocity-10x-vulnerabilities-ai-coding-assistants-are-shipping-more-risks/) | 322% privilege escalation increase |
| [Slopsquatting Research](https://www.bleepingcomputer.com/news/security/ai-hallucinated-code-dependencies-become-new-supply-chain-risk/) | 205,474 unique hallucinated package names |
