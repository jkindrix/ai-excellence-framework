# Explorer Agent

Fast codebase navigation without consuming main conversation context.

## Purpose

Explore codebases quickly to understand structure, find patterns, and answer questions about code organization.

## Tools Available

| Tool | Purpose |
|------|---------|
| Glob | Find files by pattern |
| Grep | Search for code patterns |
| Read | Read file contents |
| LSP | Navigate definitions and references |

## Usage

```
Explore: [your question or task]
```

**Examples:**
```
Explore: Find all API endpoint definitions
Explore: How is authentication handled?
Explore: What patterns are used for error handling?
Explore: Find all files related to payments
```

## When to Use

| Situation | Use Explorer? |
|-----------|---------------|
| Understanding unfamiliar code | Yes |
| Finding specific patterns | Yes |
| Answering structural questions | Yes |
| Implementing features | No (use main conversation) |
| Making code changes | No |

## Output Format

```markdown
## Exploration: [Topic]

### Files Found
- `path/to/file.ts` — [description]

### Patterns Identified
- [Pattern 1]: [description]

### Summary
[Concise answer to the question]

### Relevant Locations
| File | Line | Purpose |
|------|------|---------|
| `file.ts` | 45 | [What's there] |
```

## Best Practices

### 1. Be Specific

```
# Good
Explore: Find where user authentication tokens are validated

# Less good
Explore: Find auth stuff
```

### 2. Ask Focused Questions

```
# Good
Explore: What middleware runs before API routes?

# Too broad
Explore: Explain the entire codebase
```

### 3. Use for Discovery

Explorer is best for questions like:
- "Where is X implemented?"
- "How does Y work?"
- "What patterns are used for Z?"

## Example Session

**Request:**
```
Explore: How are database transactions handled in this codebase?
```

**Response:**
```markdown
## Exploration: Database Transactions

### Files Found
- `src/db/transaction.ts` — Transaction wrapper utility
- `src/services/order.ts` — Uses transactions for orders
- `src/services/payment.ts` — Uses transactions for payments

### Patterns Identified
- **Unit of Work**: `TransactionManager` class handles all DB transactions
- **Decorator**: `@Transactional` decorator for service methods

### Summary
Transactions are managed via `TransactionManager` in `src/db/transaction.ts`.
Services use either the `@Transactional` decorator or explicit
`transactionManager.run()` calls.

### Relevant Locations
| File | Line | Purpose |
|------|------|---------|
| `src/db/transaction.ts` | 15 | TransactionManager class |
| `src/db/transaction.ts` | 45 | @Transactional decorator |
| `src/services/order.ts` | 23 | Transaction usage example |
```

## See Also

- [Reviewer Agent](/commands/agents/reviewer) — Code review
- [Tester Agent](/commands/agents/tester) — Test generation
