# Subagents Overview

Subagents are specialized AI agents for specific tasks. They provide focused capabilities without polluting your main conversation context.

## Available Agents

| Agent | Purpose | Tools |
|-------|---------|-------|
| [Explorer](/commands/agents/explorer) | Codebase navigation | Glob, Grep, Read, LSP |
| [Reviewer](/commands/agents/reviewer) | Code quality review | Read, Grep, LSP |
| [Tester](/commands/agents/tester) | Test generation | Read, Grep, Write |

## When to Use Agents

### Use Agents When:

- Task is well-defined and self-contained
- Fresh perspective is valuable
- Main conversation context should stay clean
- Specialized focus improves results

### Use Main Conversation When:

- Implementation context is essential
- Task requires back-and-forth
- Results need integration with ongoing work

## Agent Workflow

```
1. Main conversation: Implement feature
2. Reviewer agent: Independent code review
3. Main conversation: Address feedback
4. Tester agent: Generate tests
5. Main conversation: Integrate tests
```

## Installation

Agents live in `.claude/agents/`:

```
.claude/
└── agents/
    ├── explorer.md
    ├── reviewer.md
    └── tester.md
```

Install with CLI:

```bash
npx ai-excellence-framework init --preset standard
```

## Custom Agents

Create project-specific agents:

```markdown
---
name: Database Expert
description: Database specialist for this project
tools:
  - Read
  - Grep
  - Bash
---

# Database Expert

You specialize in our PostgreSQL database.

## Knowledge
- Schema in db/schema.sql
- Migrations in db/migrations/
- Models in src/models/

## Tasks
- Schema questions
- Query optimization
- Migration planning
```

## Best Practices

1. **Clear scope** — Define what the agent should and shouldn't do
2. **Relevant tools** — Only include tools the agent needs
3. **Context in agent file** — Provide domain knowledge
4. **Focused prompts** — Give specific tasks, not vague requests

## See Also

- [Explorer Agent](/commands/agents/explorer)
- [Reviewer Agent](/commands/agents/reviewer)
- [Tester Agent](/commands/agents/tester)
