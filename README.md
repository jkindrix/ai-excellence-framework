# AI Excellence Framework

A comprehensive framework for reducing friction in AI-assisted software development.

## The Problem

AI coding assistants are powerful but constrained. They forget everything between sessions. They can't tell when they're guessing. They lock into first interpretations. They generate fluently regardless of correctness.

These aren't bugs—they're architectural realities. But they create friction that slows development and causes errors.

## The Solution

This framework provides:

1. **Friction Taxonomy** — 59 documented friction points across 17 categories
2. **Mitigation Strategies** — 40+ evidence-based approaches with research citations
3. **Ready-to-Deploy Tools** — Slash commands, subagents, hooks, MCP server, and automation
4. **Security Focus** — AI-specific security scanning (OWASP, slopsquatting, secrets)
5. **Team Patterns** — Organizational adoption, shared memory, onboarding

## Quick Start

```bash
# Copy the framework to your project
cp -r .claude/ your-project/.claude/
cp CLAUDE.md your-project/

# Install pre-commit hooks
pip install pre-commit
pre-commit install

# Start using
claude  # In your project directory
/plan implement user authentication
```

## What's Included

```
.claude/
├── commands/               # Slash commands
│   ├── plan.md             # Plan before implementing
│   ├── verify.md           # Verify completion skeptically
│   ├── handoff.md          # Generate session summaries
│   ├── assumptions.md      # Surface hidden assumptions
│   ├── review.md           # Multi-perspective code review
│   └── security-review.md  # OWASP-aligned security review
├── agents/                 # Custom subagents
│   ├── reviewer.md         # Independent code reviewer
│   ├── explorer.md         # Codebase exploration
│   └── tester.md           # Test generation
scripts/
├── hooks/
│   ├── post-edit.sh        # Auto-format after edits (with timeout/error handling)
│   └── verify-deps.sh      # Slopsquatting prevention
├── mcp/
│   └── project-memory-server.py  # Production MCP server (SQLite)
├── metrics/
│   └── collect-session-metrics.sh  # Baseline & ongoing measurement
templates/
├── .pre-commit-config.yaml # Security + quality hooks
├── CLAUDE.md.template      # Project context template
└── .env.example            # Environment variables template
```

## Core Documents

| Document | Purpose |
|----------|---------|
| [ai-development-friction.md](ai-development-friction.md) | 59 friction points from the AI's perspective |
| [ai-friction-mitigations.md](ai-friction-mitigations.md) | 40+ evidence-based mitigation strategies |
| [ai-friction-implementation.md](ai-friction-implementation.md) | Implementation blueprints and code |
| [ai-friction-action-plan.md](ai-friction-action-plan.md) | Strategic roadmap for adoption |

## Key Commands

### `/plan` — Think Before Coding
Forces structured planning before implementation. Surfaces assumptions, identifies risks, defines completion criteria.

```
/plan add dark mode support
```

### `/verify` — Skeptical Completion Check
Adopts a validator mindset. Attempts to prove work is NOT complete before confirming.

```
/verify the authentication implementation
```

### `/handoff` — Session Continuity
Generates comprehensive session summary for the next session to pick up seamlessly.

```
/handoff
```

### `/assumptions` — Surface the Hidden
Explicitly documents assumptions before they become problems.

```
/assumptions migrating to PostgreSQL
```

### `/security-review` — AI-Specific Security Audit
OWASP-aligned security review specifically tuned for AI-generated code vulnerabilities.

```
/security-review src/auth/
```

Checks for:
- OWASP Top 10 vulnerabilities
- XSS (86% of AI code fails)
- Log injection (88% vulnerable)
- Privilege escalation (322% more common in AI code)
- Hallucinated dependencies (slopsquatting)

## The CLAUDE.md Pattern

The framework centers on `CLAUDE.md` — a persistent context file that loads automatically every session:

```markdown
# Project: MyApp

## Overview
[What this project does]

## Architecture
[Key patterns and structure]

## Conventions
[Coding standards and practices]

## Current State
[What's in progress, recent decisions]

## Session Instructions
[How to work effectively in this codebase]
```

This solves the #1 friction point: session boundary context loss.

## Dogfooding

This framework is developed using itself. Every pattern must prove useful during development of the framework, or it gets removed.

## Philosophy

1. **Friction is real, not excuses** — These constraints exist. Naming them helps navigate them.

2. **Evidence over theory** — Strategies are research-backed and validated through use.

3. **Simple over clever** — If a pattern isn't used, it's removed.

4. **Copy-paste ready** — Everything should work when literally copied into a project.

## Contributing

This framework improves through use. If you find:
- A friction point not documented
- A mitigation that works better
- A pattern that should be removed

Open an issue or PR.

## License

MIT

---

*Built by observing what actually helps in AI-assisted development, not what theoretically should.*
