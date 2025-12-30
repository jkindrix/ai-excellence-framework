# Convention Enforcement

Ensure AI-generated code follows team conventions consistently.

## The Problem

AI code often drifts from team standards:

| Issue | Frequency |
|-------|-----------|
| Inconsistency with team standards | 40% |
| Style variations across files | Common |
| Architectural violations | Moderate |
| Naming convention mismatches | Common |

## Solution Layers

### 1. CLAUDE.md Conventions

Define standards in CLAUDE.md:

```markdown
## Conventions

### Architecture
- Use repository pattern for data access
- Services contain business logic only
- Controllers are thin (validation + delegation)

### Naming
- Files: kebab-case (user-service.ts)
- Classes: PascalCase (UserService)
- Functions: camelCase (getUserById)
- Constants: SCREAMING_SNAKE (MAX_RETRIES)

### Code Style
- Prefer async/await over .then()
- Use early returns to reduce nesting
- Maximum function length: 50 lines

### Do Not
- Do not use any/unknown types
- Do not bypass the service layer
- Do not use string concatenation for SQL
```

### 2. Linting Configuration

Enforce programmatically:

```javascript
// eslint.config.js
export default [
  {
    rules: {
      'no-explicit-any': 'error',
      'max-lines-per-function': ['error', 50],
      'prefer-await': 'error',
    }
  }
];
```

### 3. Pre-commit Hooks

Automate enforcement:

```yaml
repos:
  - repo: local
    hooks:
      - id: lint
        name: Run linter
        entry: npm run lint
        language: system

      - id: format
        name: Check formatting
        entry: npm run format:check
        language: system
```

### 4. CI Validation

Final gate in CI:

```yaml
# .github/workflows/ci.yml
jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm ci
      - run: npm run lint
      - run: npm run format:check
```

## Pattern Libraries

Define reusable patterns for AI:

### API Endpoint Pattern

```markdown
## API Pattern

All endpoints follow this structure:

1. Validate input
2. Check authorization
3. Call service
4. Return response

Example: See `src/controllers/user.ts:getUser`
```

### Error Handling Pattern

```markdown
## Error Handling

Use the Result type for recoverable errors:

```typescript
type Result<T, E = Error> =
  | { ok: true; value: T }
  | { ok: false; error: E };
```

Example: See `src/services/payment.ts`
```

### Database Pattern

```markdown
## Database Access

Use repositories for all database operations:

```typescript
// Good
const user = await userRepository.findById(id);

// Bad
const user = await db.query('SELECT * FROM users WHERE id = ?', [id]);
```

## Custom Commands

Create team-specific commands:

```markdown
---
description: Create a new API endpoint following team patterns
---

# New Endpoint

Create an endpoint following our conventions:

1. Add route in `src/routes/`
2. Add controller in `src/controllers/`
3. Add service in `src/services/`
4. Add repository if needed in `src/repositories/`
5. Add tests in `tests/`

Use existing endpoints as reference:
- Simple CRUD: `src/controllers/user.ts`
- Complex logic: `src/controllers/order.ts`

Endpoint to create: $ARGUMENTS
```

## Review Checklist

For PRs with AI-generated code:

- [ ] Follows naming conventions
- [ ] Uses approved patterns
- [ ] Matches existing architecture
- [ ] No style violations
- [ ] Appropriate abstraction level
- [ ] Consistent with adjacent code

## Metrics

Track convention adherence:

```bash
# Lint violations per commit
git log --oneline -10 | while read sha msg; do
  echo "$sha: $(git show $sha --stat | grep -c '.*')"
done
```

## Common Issues

### Issue: AI ignores Do Not rules

**Solution:** Make rules specific and positioned prominently:

```markdown
## Do Not (Critical)
⛔ Never use `any` type
⛔ Never bypass service layer
⛔ Never use string SQL
```

### Issue: Style drifts over time

**Solution:** Periodic convention review:

```markdown
## Current State

### Convention Review
Last review: 2024-12-30
Next review: 2025-01-30
Owner: [Team Lead]
```

### Issue: New patterns not adopted

**Solution:** Reference file pattern:

```markdown
## Patterns
For the canonical implementation of each pattern, see:
- API endpoints: `src/controllers/user.ts`
- Services: `src/services/payment.ts`
- Repositories: `src/repositories/order.ts`
```

## Evidence

| Source | Finding |
|--------|---------|
| [Second Talent](https://www.secondtalent.com/resources/ai-coding-assistant-statistics/) | 40% inconsistency with team standards |
| [GitClear](https://www.gitclear.com/ai_assistant_code_quality_2025_research) | Refactoring down from 25% to <10% |
