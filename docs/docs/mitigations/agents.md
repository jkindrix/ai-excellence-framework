# Subagents

Subagents are specialized AI agents for specific tasks. They provide focused capabilities without polluting your main conversation context.

## Available Agents

| Agent | Purpose | Best For |
|-------|---------|----------|
| **Explorer** | Fast codebase navigation | Understanding structure |
| **Reviewer** | Independent code review | Quality assessment |
| **Tester** | Test generation | Coverage improvement |

## Explorer Agent

**Purpose:** Quick, focused codebase exploration without wasting context.

**When to use:**
- Understanding unfamiliar code
- Finding files matching patterns
- Answering structural questions

**Example:**
```
Explore: Find all API endpoint definitions and explain the routing pattern
```

**Tools available:** Glob, Grep, Read, LSP

**Why it helps:** Exploration consumes context. Delegating to an agent keeps your main conversation focused.

## Reviewer Agent

**Purpose:** Independent code review from a fresh perspective.

**When to use:**
- After completing a feature
- Before merging PRs
- When you want a second opinion

**Example:**
```
Review: Check the authentication module for security and maintainability issues
```

**Perspectives checked:**
- Architecture alignment
- Security concerns
- Performance implications
- Maintainability
- Consistency with codebase patterns

**Why it helps:** The main conversation has context bias from implementation. A fresh agent sees code without that bias.

## Tester Agent

**Purpose:** Generate test cases and identify coverage gaps.

**When to use:**
- After implementing features
- Before releases
- When coverage is unknown

**Example:**
```
Test: Generate tests for the payment processing module
```

**Output includes:**
- Identified test gaps
- Generated test cases
- Edge cases considered
- Integration test suggestions

**Why it helps:** Test generation benefits from focused attention on test patterns without implementation context.

## Installation

Agents live in `.claude/agents/`:

```
.claude/
└── agents/
    ├── explorer.md
    ├── reviewer.md
    └── tester.md
```

Install with the CLI:

```bash
npx ai-excellence-framework init --preset standard
```

## Agent Structure

Each agent uses YAML frontmatter:

```markdown
---
name: Explorer
description: Fast codebase exploration specialist
tools:
  - Glob
  - Grep
  - Read
  - LSP
---

# Explorer Agent

You are a codebase exploration specialist.

## Capabilities
- Find files by pattern
- Search for code patterns
- Answer structural questions

## Approach
1. Use Glob for file discovery
2. Use Grep for content search
3. Use Read for detailed inspection
4. Use LSP for navigation

## Guidelines
- Stay focused on the exploration task
- Report findings concisely
- Suggest relevant files for follow-up
```

## Custom Agents

Create project-specific agents:

```markdown
---
name: Database Expert
description: Specialist for database-related questions
tools:
  - Read
  - Grep
  - Bash
---

# Database Expert

You specialize in our database layer.

## Knowledge
- We use PostgreSQL 15
- Migrations in db/migrations/
- Models in src/models/

## Tasks
- Schema questions
- Query optimization
- Migration assistance
```

## Multi-Agent Patterns

### Review Pipeline

```
1. Implement feature (main conversation)
2. Review code (Reviewer agent)
3. Generate tests (Tester agent)
4. Address feedback (main conversation)
```

### Exploration + Implementation

```
1. Explore codebase (Explorer agent)
2. Receive summary
3. Implement with context (main conversation)
```

## Evidence

| Source | Finding |
|--------|---------|
| [Qodo 2025](https://www.qodo.ai/reports/state-of-ai-code-quality/) | 81% quality improvement with AI review |
| [VentureBeat](https://venturebeat.com/orchestration/research-shows-more-agents-isnt-a-reliable-path-to-better-enterprise-ai) | Multi-agent effective but adds overhead |

## Key Insight

Agents work best when:
1. Task is well-defined
2. Fresh perspective is valuable
3. Main context should stay clean

Don't use agents for tasks where implementation context is essential.
