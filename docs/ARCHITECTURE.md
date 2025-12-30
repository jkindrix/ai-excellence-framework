# Architecture

This document describes the architecture of the AI Excellence Framework, including component interactions, data flows, and design decisions.

## System Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         AI Excellence Framework                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────┐   ┌─────────────────┐   ┌─────────────────┐           │
│  │   CLAUDE.md     │   │  Slash Commands │   │   Subagents     │           │
│  │  (Context Hub)  │   │   (8 commands)  │   │  (3 agents)     │           │
│  └────────┬────────┘   └────────┬────────┘   └────────┬────────┘           │
│           │                     │                     │                      │
│           └─────────────────────┼─────────────────────┘                      │
│                                 │                                            │
│                                 ▼                                            │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                     AI Assistant (Claude)                            │    │
│  │                                                                      │    │
│  │  • Reads CLAUDE.md for project context                              │    │
│  │  • Executes slash commands on user request                          │    │
│  │  • Delegates to subagents for specialized tasks                     │    │
│  │  • Uses MCP server for persistent memory                            │    │
│  └────────────────────────────────┬────────────────────────────────────┘    │
│                                   │                                          │
│                                   ▼                                          │
│  ┌─────────────────┐   ┌─────────────────┐   ┌─────────────────┐           │
│  │   Hook Scripts  │   │   MCP Server    │   │  Metrics        │           │
│  │  (Pre-commit)   │   │  (Memory)       │   │  Collection     │           │
│  └─────────────────┘   └─────────────────┘   └─────────────────┘           │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Component Architecture

### 1. Context Layer (CLAUDE.md)

The foundation of the framework. CLAUDE.md serves as the persistent context file that AI assistants read at session start.

```
CLAUDE.md Structure
├── ## Overview           (Project purpose - REQUIRED)
├── ## Tech Stack         (Technologies used - REQUIRED)
├── ## Architecture       (System design - RECOMMENDED)
├── ## Conventions        (Coding standards - RECOMMENDED)
├── ## Common Commands    (Useful commands - RECOMMENDED)
├── ## Current State      (Work in progress - REQUIRED)
└── ## Session Instructions (AI guidelines - RECOMMENDED)
```

**Design Decisions:**
- Single file (not split) for simplicity
- Markdown for universal compatibility
- Required sections enforced by hooks
- Maximum 100KB to prevent context bloat

### 2. Command Layer

Eight slash commands that extend AI assistant capabilities:

```
Slash Commands
├── /plan             - Create implementation plan before coding
├── /verify           - Skeptically verify task completion
├── /handoff          - Generate session handoff summary
├── /assumptions      - Surface hidden assumptions
├── /review           - Multi-perspective code review
├── /security-review  - OWASP-aligned security review
├── /refactor         - Plan and execute refactoring
└── /test-coverage    - Analyze and improve test coverage
```

**Command Flow:**

```
User Request → Parse Command → Load Prompt Template → Execute → Return Result
                    │
                    ▼
            .claude/commands/{command}.md
```

### 3. Agent Layer

Three specialized subagents for complex tasks:

```
Subagents
├── explorer   - Codebase exploration and discovery
├── reviewer   - Code review from multiple perspectives
└── tester     - Test generation and verification
```

**Agent Invocation:**

```
Main Agent
    │
    ├── Detects need for specialized capability
    │
    ├── Spawns subagent with specific context
    │
    ├── Subagent executes specialized task
    │
    └── Results integrated into main conversation
```

### 4. Persistence Layer (MCP Server)

SQLite-backed memory server using Model Context Protocol:

```
┌──────────────────────────────────────────────────────────────────┐
│                     MCP Memory Server                             │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│   ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│   │  Decisions  │  │  Patterns   │  │  Context    │              │
│   │   Table     │  │   Table     │  │   Table     │              │
│   └──────┬──────┘  └──────┬──────┘  └──────┬──────┘              │
│          │                │                │                      │
│          └────────────────┴────────────────┘                      │
│                           │                                       │
│                           ▼                                       │
│                    ┌─────────────┐                                │
│                    │   SQLite    │                                │
│                    │ (WAL Mode)  │                                │
│                    └─────────────┘                                │
│                                                                   │
│   Features:                                                       │
│   • Connection pooling (5 connections)                           │
│   • Rate limiting (100 ops/minute)                               │
│   • Input sanitization                                           │
│   • Export/Import for backup                                     │
│   • Health check endpoint                                        │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘
```

**MCP Tools:**

| Tool | Purpose |
|------|---------|
| `remember_decision` | Store architectural decision |
| `recall_decisions` | Search past decisions |
| `store_pattern` | Save code pattern |
| `get_patterns` | Retrieve patterns |
| `set_context` | Store key-value context |
| `get_context` | Retrieve context |
| `memory_stats` | Database statistics |
| `export_memory` | Export all data |
| `import_memory` | Import from backup |
| `health_check` | Verify server health |
| `purge_memory` | Delete all data (careful!) |

### 5. Validation Layer (Hooks)

Pre-commit hooks that enforce quality:

```
Git Commit
    │
    ├── check-claude-md.sh
    │   ├── Verify required sections exist
    │   ├── Check for potential secrets
    │   └── Warn on stale content
    │
    ├── verify-deps.sh
    │   ├── Verify npm packages exist
    │   └── Prevent slopsquatting attacks
    │
    ├── check-todos.sh
    │   └── Warn on TODO/FIXME comments
    │
    └── post-edit.sh
        └── Context-aware validation
```

### 6. Installation Layer (CLI)

Node.js CLI for framework installation:

```
CLI Architecture
├── bin/cli.js           (Entry point)
├── src/commands/
│   ├── init.js          (Initialize framework)
│   ├── validate.js      (Validate installation)
│   ├── update.js        (Update framework)
│   └── doctor.js        (Diagnose issues)
├── src/schemas/
│   └── config.schema.json
└── templates/presets/
    ├── minimal/
    ├── standard/
    ├── full/
    └── team/
```

**Preset Comparison:**

| Component | Minimal | Standard | Full | Team |
|-----------|---------|----------|------|------|
| CLAUDE.md | ✓ | ✓ | ✓ | ✓ |
| /plan, /verify | ✓ | ✓ | ✓ | ✓ |
| Other commands | - | ✓ | ✓ | ✓ |
| Subagents | - | ✓ | ✓ | ✓ |
| Pre-commit hooks | - | ✓ | ✓ | ✓ |
| MCP server | - | - | ✓ | ✓ |
| Metrics | - | - | ✓ | ✓ |
| Team features | - | - | - | ✓ |

## Data Flow

### Session Start

```
1. User opens AI assistant
        │
        ▼
2. Assistant reads ~/.claude/CLAUDE.md (global)
        │
        ▼
3. Assistant reads ./CLAUDE.md (project)
        │
        ▼
4. MCP server loads project memory (if configured)
        │
        ▼
5. Assistant ready with full context
```

### Command Execution

```
1. User types: /plan implement auth
        │
        ▼
2. Load .claude/commands/plan.md template
        │
        ▼
3. Substitute user arguments into template
        │
        ▼
4. Execute expanded prompt
        │
        ▼
5. Store decisions in MCP (if significant)
        │
        ▼
6. Return results to user
```

### Commit Flow

```
1. Developer runs: git commit
        │
        ▼
2. Pre-commit hooks execute
        │
        ├── check-claude-md.sh → Pass/Warn/Fail
        ├── verify-deps.sh → Pass/Fail
        └── check-todos.sh → Pass/Warn
        │
        ▼
3. If all pass → Commit proceeds
   If any fail → Commit blocked with guidance
```

## Security Architecture

### Input Validation

```
┌────────────────────────────────────────────────────────────────┐
│                      Input Validation Chain                     │
├────────────────────────────────────────────────────────────────┤
│                                                                 │
│  User Input                                                     │
│      │                                                          │
│      ▼                                                          │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ sanitize_input()                                         │   │
│  │ • Truncate to max length (10,000 chars)                 │   │
│  │ • Remove null bytes                                      │   │
│  │ • Strip whitespace                                       │   │
│  └─────────────────────────────────────────────────────────┘   │
│      │                                                          │
│      ▼                                                          │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ validate_key() (for key-value storage)                   │   │
│  │ • Alphanumeric, underscores, hyphens, dots only         │   │
│  │ • Max 100 characters                                     │   │
│  └─────────────────────────────────────────────────────────┘   │
│      │                                                          │
│      ▼                                                          │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Parameterized SQL Queries                                │   │
│  │ • No string concatenation                                │   │
│  │ • SQLite placeholders only                               │   │
│  └─────────────────────────────────────────────────────────┘   │
│      │                                                          │
│      ▼                                                          │
│  Database (safe)                                                │
│                                                                 │
└────────────────────────────────────────────────────────────────┘
```

### Secret Detection

```
Patterns Detected by check-claude-md.sh:
• API keys (sk-*, AKIA*, etc.)
• GitHub tokens (ghp_*, gho_*, glpat-*)
• Generic secrets (password=, secret=)
• Private keys (-----BEGIN PRIVATE KEY-----)
```

### Rate Limiting

```
MCP Server Rate Limiter
• 100 operations per minute (configurable)
• Sliding window algorithm
• Graceful rejection with remaining count
```

## Directory Structure

```
ai-excellence-framework/
├── .claude/
│   ├── commands/          # Slash command definitions
│   │   ├── plan.md
│   │   ├── verify.md
│   │   └── ...
│   └── agents/            # Subagent definitions
│       ├── explorer.md
│       ├── reviewer.md
│       └── tester.md
├── bin/
│   └── cli.js             # CLI entry point
├── src/
│   ├── commands/          # CLI command implementations
│   └── schemas/           # JSON validation schemas
├── scripts/
│   ├── hooks/             # Git hook scripts
│   ├── mcp/               # MCP server
│   └── metrics/           # Metrics collection
├── templates/
│   └── presets/           # Installation presets
├── tests/
│   ├── cli.test.js
│   ├── integration.test.js
│   └── mcp/
├── docs/
│   ├── ARCHITECTURE.md    # This document
│   ├── QUICK-REFERENCE.md
│   └── ...
├── CLAUDE.md              # Project context
├── package.json
└── README.md
```

## Extension Points

### Adding a New Slash Command

1. Create `.claude/commands/{command}.md`
2. Use frontmatter for description:
   ```yaml
   ---
   description: Short description for help text
   ---
   ```
3. Add command to presets in `src/commands/init.js`
4. Add tests in `tests/commands.test.js`

### Adding a New Subagent

1. Create `.claude/agents/{agent}.md`
2. Define agent capabilities and constraints
3. Add to preset configurations
4. Document usage in agent file

### Adding a New Hook

1. Create `scripts/hooks/{hook}.sh`
2. Add to `.pre-commit-config.yaml`
3. Add tests in `tests/scripts.test.sh`
4. Document in CONTRIBUTING.md

## Performance Considerations

### MCP Server

- **Connection pooling**: Reuses database connections
- **WAL mode**: Allows concurrent reads during writes
- **Prepared statements**: Compiled once, executed many times
- **Index coverage**: All common queries use indexes

### CLI

- **Lazy loading**: Commands loaded only when needed
- **Parallel operations**: Multiple files copied concurrently
- **Minimal dependencies**: Core functionality uses few packages

### Context Size

- **CLAUDE.md limit**: 100KB warning threshold
- **Memory limits**: Configurable per table
- **Automatic cleanup**: Old entries removed when limits reached

## Related Documentation

- [Quick Reference](./QUICK-REFERENCE.md) - One-page usage guide
- [MCP Security](./MCP-SECURITY.md) - Security considerations
- [Troubleshooting](./TROUBLESHOOTING.md) - Common issues
- [Research Citations](./RESEARCH-CITATIONS.md) - Evidence backing
