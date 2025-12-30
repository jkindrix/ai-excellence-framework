# Reviewer Agent

Independent code review from a fresh perspective.

## Purpose

Review code without the context bias from implementation. Provides objective assessment of quality, architecture, and issues.

## Tools Available

| Tool | Purpose |
|------|---------|
| Read | Read file contents |
| Grep | Search for patterns |
| LSP | Navigate code structure |

## Usage

```
Review: [file or scope]
```

**Examples:**
```
Review: src/services/payment.ts
Review: the authentication module
Review: changes in this PR
```

## When to Use

| Situation | Use Reviewer? |
|-----------|---------------|
| After implementing feature | Yes |
| Before merging PR | Yes |
| Getting second opinion | Yes |
| During implementation | Usually no |
| For security review | Use /security-review instead |

## Output Format

```markdown
## Code Review: [Target]

### Summary
[Overall assessment: 1-2 sentences]

### Strengths
- [What's done well]

### Issues

#### Critical
- 🔴 [Must fix before merge]

#### Warnings
- 🟡 [Should fix]

#### Suggestions
- 🔵 [Nice to have]

### Architecture Assessment
[How well does this fit the codebase architecture?]

### Recommendations
1. [Specific actionable recommendation]
2. [Specific actionable recommendation]
```

## Review Dimensions

### Architecture

- Separation of concerns
- Dependency direction
- Appropriate abstraction
- Pattern compliance

### Quality

- Code readability
- Function complexity
- Error handling
- Edge cases

### Maintainability

- Test coverage
- Documentation
- Future extensibility
- Technical debt

### Consistency

- Naming conventions
- Code style
- Pattern usage
- Similar code comparison

## Best Practices

### 1. Review Complete Units

```
# Good - complete module
Review: src/services/payment.ts

# Less good - partial file
Review: lines 10-50 of payment.ts
```

### 2. Provide Context if Needed

```
Review: src/services/payment.ts
Context: This was refactored from the old checkout system
```

### 3. Act on Findings

After review, address issues in the main conversation.

## Why Fresh Perspective Matters

The main conversation has implementation bias:
- You know why decisions were made
- You see what you intended, not what's there
- Context can mask issues

A fresh reviewer agent:
- Sees code as-is, not as-intended
- No bias from implementation decisions
- Can spot inconsistencies

## See Also

- [/review](/commands/review) — Review command in main conversation
- [/security-review](/commands/security-review) — Security-focused review
- [Explorer Agent](/commands/agents/explorer) — Codebase exploration
