# CLAUDE.md Best Practices

CLAUDE.md is the single highest-impact intervention for AI-assisted development. It solves the #1 friction point: session boundary amnesia.

## What is CLAUDE.md?

A project context file that Claude automatically loads at the start of every session. It provides persistent knowledge that survives session boundaries.

## Why It Matters

| Without CLAUDE.md | With CLAUDE.md |
|-------------------|----------------|
| Re-explain context every session | Context loads automatically |
| Inconsistent conventions | Consistent patterns |
| Repeated questions | Prior answers persist |
| Lost architectural decisions | Decisions documented |

## Optimal Length

**Community consensus: <300 lines is best.** Shorter is even better.

| Team | CLAUDE.md Length | Note |
|------|------------------|------|
| HumanLayer | <60 lines | Minimal, focused |
| Recommended | 100-200 lines | Sweet spot |
| Maximum | 300 lines | Move details to subdirectories |

**Why shorter is better:**
- LLMs can follow ~150-200 instructions consistently
- More instructions = less attention to each
- Focused context outperforms comprehensive context

## Structure Template

```markdown
# Project Name

## Tech Stack
- Language/framework with versions
- Key dependencies

## Architecture
src/
  components/  # UI components
  services/    # Business logic
  utils/       # Shared utilities

## Commands
npm run build   # Build project
npm test        # Run tests
npm run lint    # Check code style

## Conventions
- Use async/await (never callbacks)
- Prefer composition over inheritance
- Maximum function length: 50 lines

## Do Not
- Do not edit files in src/legacy/
- Do not commit directly to main
- Do not use any/unknown types

## Current State
Phase: [current phase]
Active: [current work]
Recent: [recent decisions]
```

## Best Practices

### 1. Keep It Focused

Include only universally applicable instructions. If something applies only sometimes, it doesn't belong in the root CLAUDE.md.

### 2. Use Pointers, Not Copies

```markdown
# Bad - code will become outdated
## API Pattern
function handleRequest(req, res) {
  // 20 lines of code
}

# Good - reference stays current
## API Pattern
See `src/api/handler.ts:15` for the standard request handler pattern.
```

### 3. Progressive Disclosure

Use subdirectory CLAUDE.md files for localized context:

```
project/
├── CLAUDE.md           # Project-wide (short)
├── src/
│   └── CLAUDE.md       # Source-specific context
├── tests/
│   └── CLAUDE.md       # Testing conventions
└── docs/
    └── CLAUDE.md       # Documentation standards
```

### 4. Use CLAUDE.local.md for Personal Preferences

```
project/
├── CLAUDE.md           # Team (committed)
├── CLAUDE.local.md     # Personal (gitignored)
└── .gitignore          # Contains: CLAUDE.local.md
```

### 5. Include Explicit Restrictions

```markdown
## Do Not
- Do not modify files in vendor/
- Do not use deprecated API v1 endpoints
- Do not bypass the validation layer
```

### 6. File Imports

Reference external files with `@path/to/import`:

```markdown
# CLAUDE.md
For detailed API conventions, see @docs/api-conventions.md
```

Max import depth: 5 levels.

## Anti-Patterns

### Too Long
❌ CLAUDE.md with 500+ lines
✅ 100-200 lines with subdirectory files

### Inline Code
❌ Full function implementations
✅ File:line references

### Style Guidelines
❌ "Use 2-space indentation" (linter's job)
✅ "Run `npm run lint` before committing"

### Stale Information
❌ "We're using React 16" (actually on 18)
✅ Regular review schedule in Current State

## Evidence

| Source | Finding |
|--------|---------|
| [Anthropic](https://www.anthropic.com/engineering/claude-code-best-practices) | CLAUDE.md recommended for all projects |
| [HumanLayer](https://www.humanlayer.dev/blog/writing-a-good-claude-md) | <300 lines optimal, <60 at HumanLayer |
| [Research](https://arxiv.org/abs/2312.16171) | LLMs follow 150-200 instructions consistently |

## Quick Start

Create a minimal CLAUDE.md:

```bash
cat > CLAUDE.md << 'EOF'
# My Project

## Stack
- Node.js 20, TypeScript 5

## Commands
npm run build && npm test

## Conventions
- Use async/await
- Handle errors explicitly

## Current State
Active: [what you're working on]
EOF
```

Then iterate: add what you find yourself repeating to Claude.
