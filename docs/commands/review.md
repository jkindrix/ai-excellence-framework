# /review Command

Multi-perspective code review for quality assessment.

## Purpose

Review code from multiple perspectives: architecture, performance, maintainability, and consistency.

## Usage

```
/review [file, feature, or PR]
```

**Examples:**
```
/review src/services/payment.ts
/review the authentication module
/review PR #123
```

## Output Format

```markdown
## Code Review: [Target]

### Summary
[Brief overall assessment]

### Architecture
| Aspect | Status | Notes |
|--------|--------|-------|
| Separation of concerns | ✓/⚠️/✗ | [Notes] |
| Dependency direction | ✓/⚠️/✗ | [Notes] |
| Pattern compliance | ✓/⚠️/✗ | [Notes] |

### Performance
| Aspect | Status | Notes |
|--------|--------|-------|
| Algorithm complexity | ✓/⚠️/✗ | [Notes] |
| Resource usage | ✓/⚠️/✗ | [Notes] |
| Caching opportunities | ✓/⚠️/✗ | [Notes] |

### Maintainability
| Aspect | Status | Notes |
|--------|--------|-------|
| Readability | ✓/⚠️/✗ | [Notes] |
| Testability | ✓/⚠️/✗ | [Notes] |
| Documentation | ✓/⚠️/✗ | [Notes] |

### Consistency
| Aspect | Status | Notes |
|--------|--------|-------|
| Naming conventions | ✓/⚠️/✗ | [Notes] |
| Error handling | ✓/⚠️/✗ | [Notes] |
| Code style | ✓/⚠️/✗ | [Notes] |

### Issues Found
- 🔴 **Critical**: [Must fix]
- 🟡 **Warning**: [Should fix]
- 🔵 **Suggestion**: [Nice to have]

### Recommendations
1. [Specific recommendation]
2. [Specific recommendation]
```

## Review Perspectives

### Architecture Review

Checks:
- Separation of concerns
- Dependency direction (inward)
- Appropriate abstraction levels
- Pattern compliance
- Module boundaries

### Performance Review

Checks:
- Algorithm complexity (O notation)
- Database query efficiency
- Memory usage patterns
- Caching opportunities
- Async/await usage

### Maintainability Review

Checks:
- Code readability
- Function/class size
- Cognitive complexity
- Test coverage
- Documentation quality

### Consistency Review

Checks:
- Naming conventions
- Error handling patterns
- Logging consistency
- Code style
- Pattern usage

## Best Practices

### 1. Review Focused Scope

```
# Good
/review src/services/payment.ts

# Too broad
/review the entire codebase
```

### 2. Act on Critical Issues

Critical issues should be addressed before merge.

### 3. Consider Context

Not all warnings are problems—some are intentional tradeoffs.

### 4. Iterate if Needed

```
/review [target]
# Address issues
/review [target] again
```

## When to Use

| Situation | Use /review? |
|-----------|--------------|
| Before PR merge | Yes |
| After completing feature | Yes |
| Periodic codebase health | Yes |
| During implementation | Sometimes |
| Quick bug fix | Usually no |

## Evidence

| Source | Finding |
|--------|---------|
| [Qodo 2025](https://www.qodo.ai/reports/state-of-ai-code-quality/) | 81% quality improvement with AI review |

## See Also

- [/security-review](/commands/security-review) — Security-focused review
- [/test-coverage](/commands/test-coverage) — Test gap analysis
- [Reviewer Agent](/commands/agents/reviewer) — Independent review agent
