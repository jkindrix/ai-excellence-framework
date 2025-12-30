# AI-Specific Vulnerabilities

This page details vulnerabilities that are more common in AI-generated code than human-written code.

## Cross-Site Scripting (XSS) — 86% Failure Rate

AI-generated code often fails to encode output properly.

**Vulnerable pattern:**
```javascript
// AI might generate
element.innerHTML = userInput;
```

**Secure pattern:**
```javascript
// Should be
element.textContent = userInput;
// Or with encoding
element.innerHTML = DOMPurify.sanitize(userInput);
```

**Why AI fails:** Training data includes pre-framework code where manual escaping wasn't standard.

## Log Injection (CWE-117) — 88% Vulnerable

AI code often logs user input directly.

**Vulnerable pattern:**
```python
# AI might generate
logger.info(f"User searched for: {user_query}")
```

**Secure pattern:**
```python
# Should be
logger.info("User searched", extra={"query": sanitize(user_query)})
```

**Why AI fails:** Logging patterns in training data don't consistently sanitize.

## Privilege Escalation — 322% Increase

AI code often includes unnecessary permissions.

**Vulnerable pattern:**
```javascript
// AI might generate
const user = await User.findById(req.params.id);
return user; // No authorization check
```

**Secure pattern:**
```javascript
// Should be
const user = await User.findById(req.params.id);
if (user.id !== req.auth.userId && !req.auth.isAdmin) {
  throw new ForbiddenError();
}
return user;
```

**Why AI fails:** Authorization logic is context-dependent and often implicit.

## Package Hallucination (Slopsquatting)

AI suggests packages that don't exist.

**Vulnerable pattern:**
```javascript
// AI might suggest
import { formatDate } from 'date-format-utils';
// Package doesn't exist — attacker could register it
```

**Mitigation:**
```bash
# verify-deps.sh checks registry
npm view date-format-utils || exit 1
```

**Statistics:**
- Open-source LLMs: ~20% hallucination rate
- ChatGPT-4: ~5% hallucination rate
- 58% of hallucinations are repeatable

## SQL Injection

AI sometimes uses string concatenation.

**Vulnerable pattern:**
```python
# AI might generate
query = f"SELECT * FROM users WHERE id = {user_id}"
```

**Secure pattern:**
```python
# Should be
query = "SELECT * FROM users WHERE id = ?"
cursor.execute(query, (user_id,))
```

**Why AI fails:** Older training data includes pre-ORM patterns.

## Insecure Deserialization

AI may deserialize untrusted data.

**Vulnerable pattern:**
```python
# AI might generate
data = pickle.loads(request.data)
```

**Secure pattern:**
```python
# Should be
data = json.loads(request.data)  # Safe format
# Or with validation
data = validate_and_deserialize(request.data)
```

## Hardcoded Secrets

AI sometimes includes example credentials.

**Vulnerable pattern:**
```javascript
// AI might generate
const API_KEY = "sk_test_abc123...";
```

**Secure pattern:**
```javascript
// Should be
const API_KEY = process.env.API_KEY;
if (!API_KEY) throw new Error("API_KEY required");
```

**Detection:** Use gitleaks or detect-secrets in pre-commit.

## Missing Input Validation

AI often skips validation.

**Vulnerable pattern:**
```typescript
// AI might generate
function processOrder(quantity: number) {
  return quantity * PRICE;
}
```

**Secure pattern:**
```typescript
// Should be
function processOrder(quantity: number) {
  if (quantity <= 0 || quantity > MAX_QUANTITY) {
    throw new ValidationError("Invalid quantity");
  }
  return quantity * PRICE;
}
```

## Mitigations Summary

| Vulnerability | Mitigation |
|--------------|------------|
| XSS | Output encoding, CSP headers |
| Log Injection | Structured logging, sanitization |
| Privilege Escalation | Authorization checks, least privilege |
| Slopsquatting | verify-deps.sh hook |
| SQL Injection | Parameterized queries |
| Hardcoded Secrets | gitleaks, environment variables |
| Missing Validation | Input validation at boundaries |

## CLAUDE.md Security Template

```markdown
## Security Requirements

### Input Validation
- Validate all user input at system boundaries
- Use allowlists over denylists
- Reject invalid input, don't sanitize

### Output Encoding
- Encode output for context (HTML, URL, JS)
- Use framework escaping functions
- Set Content-Type headers explicitly

### Authentication/Authorization
- Check authorization on every request
- Use constant-time comparison for secrets
- Implement proper session management

### Data Protection
- Never log passwords, tokens, or PII
- Use environment variables for secrets
- Encrypt sensitive data at rest

### Dependencies
- Verify packages exist before installing
- Run npm audit / pip-audit regularly
- Pin dependency versions
```

## Evidence

| Source | Key Finding |
|--------|-------------|
| [Veracode 2025](https://www.veracode.com/blog/genai-code-security-report/) | 45% OWASP vulnerability rate |
| [Apiiro 2025](https://apiiro.com/blog/4x-velocity-10x-vulnerabilities-ai-coding-assistants-are-shipping-more-risks/) | 322% privilege escalation increase |
| [OWASP GenAI](https://genai.owasp.org/) | Updated Top 10 for LLM applications |
