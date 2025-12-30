# /assumptions Command

Surface and document hidden assumptions before implementation.

## Purpose

Make implicit assumptions explicit. AI (and humans) make many assumptions that stay hidden until they cause problems.

## Why It Matters

| Hidden Assumptions | Surfaced Assumptions |
|-------------------|---------------------|
| Compound silently | Caught early |
| Cause rework | Prevent rework |
| Misaligned expectations | Aligned expectations |
| "I thought you meant..." | Clear understanding |

## Usage

```
/assumptions [task or feature]
```

**Examples:**
```
/assumptions the user authentication feature
/assumptions our approach to caching
/assumptions the database migration strategy
```

## Output Format

```markdown
## Assumptions Analysis: [Topic]

### Technical Assumptions
- [ ] [Assumption about technology/architecture]

### Requirements Assumptions
- [ ] [Assumption about what's needed]

### Environmental Assumptions
- [ ] [Assumption about the environment]

### Implicit Constraints
- [ ] [Unstated constraint we're operating under]

### Questions to Validate
- [Question that would confirm/deny assumption]

### Risk Assessment
| Assumption | If Wrong | Likelihood |
|------------|----------|------------|
| [Assumption] | [Impact] | High/Med/Low |
```

## Categories of Assumptions

### Technical Assumptions

```markdown
### Technical Assumptions
- [ ] The database supports JSONB columns
- [ ] We have access to Redis for caching
- [ ] The API supports webhooks
- [ ] Node.js version is 18+
```

### Requirements Assumptions

```markdown
### Requirements Assumptions
- [ ] Users need to be authenticated for all operations
- [ ] We need to support multiple currencies
- [ ] Response time should be under 200ms
- [ ] Data retention is 7 years
```

### Environmental Assumptions

```markdown
### Environmental Assumptions
- [ ] Running in AWS environment
- [ ] Have access to secrets manager
- [ ] CI/CD pipeline is configured
- [ ] Staging environment mirrors production
```

### Implicit Constraints

```markdown
### Implicit Constraints
- [ ] Must maintain backward compatibility
- [ ] Cannot change the public API
- [ ] Budget for external services is limited
- [ ] Team has experience with chosen stack
```

## Best Practices

### 1. Be Thorough

Don't just list obvious assumptions:

```markdown
# Too obvious
- [ ] Users will have internet connection

# More useful
- [ ] Users will have stable 3G+ connection
- [ ] Mobile users may have intermittent connectivity
```

### 2. Validate High-Risk Assumptions

For assumptions with high impact if wrong:

```markdown
### Questions to Validate
- Is the database version 14+? (needed for JSONB)
- Do we have Redis access in production?
- What's the SLA for the external API?
```

### 3. Document in CLAUDE.md

Keep validated assumptions in project context:

```markdown
## Validated Assumptions
- Database: PostgreSQL 15 with JSONB support ✓
- Caching: Redis available in all environments ✓
- API: Stripe webhooks enabled ✓
```

### 4. Review When Things Break

When something unexpected happens, check assumptions:

```
This broke because I assumed X, but actually Y.
→ Document for future reference
```

## When to Use

| Situation | Use /assumptions? |
|-----------|-------------------|
| Starting new feature | Yes |
| Debugging unexpected behavior | Yes |
| Planning architecture | Yes |
| Code review | Sometimes |
| Minor changes | No |

## Example Analysis

```markdown
## Assumptions Analysis: Payment Integration

### Technical Assumptions
- [ ] Stripe SDK is compatible with Node 18
- [ ] We can use Stripe's hosted checkout
- [ ] Webhooks can be received at public URL

### Requirements Assumptions
- [ ] Only credit cards, no ACH initially
- [ ] Single currency (USD)
- [ ] Refunds handled manually for now

### Environmental Assumptions
- [ ] Stripe API keys in environment variables
- [ ] Webhook endpoint accessible from internet
- [ ] SSL certificate configured

### Implicit Constraints
- [ ] PCI compliance not required (Stripe handles)
- [ ] No recurring billing in initial scope
- [ ] Tax calculation not needed (handled separately)

### Questions to Validate
- Do we need to support Apple Pay / Google Pay?
- What's the refund policy?
- Who has access to Stripe dashboard?

### Risk Assessment
| Assumption | If Wrong | Likelihood |
|------------|----------|------------|
| Single currency | Major rework | Medium |
| No recurring billing | Feature delay | Low |
| Stripe hosted checkout | UI changes | Low |
```

## See Also

- [/plan](/commands/plan) — Includes assumptions in plan
- [/verify](/commands/verify) — Verify assumptions held true
