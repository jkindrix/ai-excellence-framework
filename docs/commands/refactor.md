# /refactor Command

Safe refactoring with verification and rollback awareness.

## Purpose

Guide refactoring with analysis, planning, and verification to prevent breaking changes.

## Usage

```
/refactor [target]
```

**Examples:**
```
/refactor src/services/user.ts for better testability
/refactor the authentication module to use dependency injection
/refactor duplicate code in controllers
```

## Output Format

```markdown
## Refactoring Plan: [Target]

### Current State Analysis
[Description of current structure and issues]

### Issues Identified
- [Issue 1]
- [Issue 2]

### Proposed Changes
| Change | Reason | Risk |
|--------|--------|------|
| [Change] | [Why] | Low/Med/High |

### Breaking Changes
- [ ] [Potential breaking change]

### Implementation Steps
1. [Step 1]
2. [Step 2]
3. [Step 3]

### Test Strategy
- [ ] Existing tests pass before refactor
- [ ] [New test for change]
- [ ] Existing tests pass after refactor

### Rollback Plan
[How to revert if issues found]
```

## Refactoring Types

### Extract Function/Class

```markdown
### Proposed Changes
| Change | Reason | Risk |
|--------|--------|------|
| Extract validation logic | Reduce function size | Low |
| Create ValidationService | Reusable validation | Low |
```

### Dependency Injection

```markdown
### Proposed Changes
| Change | Reason | Risk |
|--------|--------|------|
| Add constructor injection | Improve testability | Medium |
| Create interfaces | Decouple dependencies | Low |
```

### Pattern Migration

```markdown
### Proposed Changes
| Change | Reason | Risk |
|--------|--------|------|
| Migrate to repository pattern | Standardize data access | Medium |
| Add unit of work | Transaction management | Medium |
```

## Best Practices

### 1. Run Tests First

Ensure tests pass before starting:

```bash
npm test
# All tests pass
/refactor [target]
```

### 2. Small Incremental Changes

Prefer multiple small refactors over one large one:

```
/refactor extract validation to separate function
/refactor add interface for service
/refactor inject dependency
```

### 3. Verify After Each Step

```
/refactor [step 1]
# Run tests
/verify the refactoring
/refactor [step 2]
```

### 4. Document Breaking Changes

If the refactor affects public API:

```markdown
### Breaking Changes
- [ ] `getUserById()` now requires options object
- [ ] `UserService` constructor takes `IUserRepository`
```

## When to Use

| Situation | Use /refactor? |
|-----------|----------------|
| Improving code structure | Yes |
| Reducing duplication | Yes |
| Preparing for feature | Yes |
| Quick fix during feature work | Be careful |
| "While I'm here" cleanup | Usually no |

## Risk Levels

| Risk | When | Approach |
|------|------|----------|
| **Low** | Renaming, extracting, formatting | Can batch changes |
| **Medium** | Pattern changes, interface changes | Step by step |
| **High** | Architecture changes, public API | Extensive testing |

## Evidence

| Source | Finding |
|--------|---------|
| [GitClear](https://www.gitclear.com/ai_assistant_code_quality_2025_research) | Refactoring down from 25% to <10% |

Refactoring has decreased with AI adoption—this command helps maintain refactoring discipline.

## See Also

- [/verify](/commands/verify) — Verify refactoring completion
- [/test-coverage](/commands/test-coverage) — Ensure test coverage
- [/review](/commands/review) — Review refactored code
