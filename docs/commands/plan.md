# /plan Command

Create a structured implementation plan before coding.

## Purpose

Catch misframing before implementation begins. The AI restates understanding, lists assumptions, and proposes an approach for approval.

## Why It Matters

| Without /plan | With /plan |
|---------------|------------|
| Misinterpretation compounds | Caught early |
| Assumptions stay hidden | Made explicit |
| Rework required | Aligned from start |
| 19% productivity loss | 21-26% productivity gain |

## Usage

```
/plan [task description]
```

**Examples:**
```
/plan add user authentication with OAuth
/plan refactor the payment module for better testability
/plan fix the race condition in order processing
```

## Output Format

```markdown
## Plan: [Brief Title]

### Understanding
[AI's interpretation of the request]

### Assumptions
- [ ] [Assumption 1]
- [ ] [Assumption 2]

### Questions (if any)
- [Question needing clarification]

### Approach
1. [Step 1]
2. [Step 2]
3. [Step 3]

### Files to Modify
- `path/to/file.ts` - [what changes]

### Verification
- [ ] [Test case 1]
- [ ] [Test case 2]
```

## Best Practices

### 1. Be Specific in Task Description

```
# Good
/plan add OAuth2 authentication using Google as the provider

# Less good
/plan add auth
```

### 2. Review Assumptions Carefully

The assumptions section often reveals misunderstandings:

```markdown
### Assumptions
- [ ] Using existing User model
- [ ] OAuth tokens stored in session
- [ ] No 2FA required initially
```

If any assumption is wrong, correct it before proceeding.

### 3. Ask Clarifying Questions

The questions section should be answered before coding:

```markdown
### Questions
- Should failed OAuth redirect to login or show error?
- What scopes are needed from Google?
```

### 4. Approve Before Implementation

After reviewing the plan:
- Correct any misunderstandings
- Answer questions
- Approve the approach

Then proceed to implementation.

## When to Use

| Task Type | Use /plan? |
|-----------|------------|
| New feature | Yes |
| Significant refactor | Yes |
| Bug fix (complex) | Yes |
| Bug fix (simple) | Optional |
| Configuration change | No |
| Documentation update | No |

## Evidence

| Source | Finding |
|--------|---------|
| [METR Study](https://metr.org/blog/2025-07-10-early-2025-ai-experienced-os-dev-study/) | Unplanned AI use = 19% slower |
| [Anthropic](https://www.anthropic.com/engineering/claude-code-best-practices) | Plan mode recommended workflow |

## Integration

Combine with other commands:

```
/plan [task]
# Review and approve
# Implement
/verify [implementation]
/handoff
```

## See Also

- [/verify](/commands/verify) — Verify completion
- [/assumptions](/commands/assumptions) — Deep assumption surfacing
