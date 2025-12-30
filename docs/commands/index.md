# Slash Commands

The AI Excellence Framework includes 8 slash commands for structured AI workflows.

## Command Overview

| Command | Purpose | When to Use |
|---------|---------|-------------|
| `/plan` | Create implementation plan | Before starting any non-trivial task |
| `/verify` | Skeptical completion check | Before marking work complete |
| `/handoff` | Session continuity notes | At end of work session |
| `/assumptions` | Surface hidden assumptions | When requirements are ambiguous |
| `/review` | Multi-perspective code review | After implementing features |
| `/security-review` | OWASP-aligned security audit | Before merging security-sensitive code |
| `/refactor` | Safe refactoring protocol | When improving existing code |
| `/test-coverage` | Test gap analysis | After implementing features |

## Quick Start

```bash
# Install commands
npx ai-excellence-framework init --preset standard

# Use in Claude
/plan add user authentication
/verify the auth implementation
/handoff
```

## Command Categories

### Planning & Verification

| Command | Impact | Effort |
|---------|--------|--------|
| [/plan](/commands/plan) | 5/5 | Low |
| [/verify](/commands/verify) | 4/5 | Low |
| [/assumptions](/commands/assumptions) | 4/5 | Low |

### Quality Assurance

| Command | Impact | Effort |
|---------|--------|--------|
| [/review](/commands/review) | 4/5 | Medium |
| [/security-review](/commands/security-review) | 5/5 | Medium |
| [/test-coverage](/commands/test-coverage) | 4/5 | Medium |

### Maintenance

| Command | Impact | Effort |
|---------|--------|--------|
| [/refactor](/commands/refactor) | 4/5 | Medium |
| [/handoff](/commands/handoff) | 4/5 | Low |

## Custom Commands

Create project-specific commands in `.claude/commands/`:

```markdown
---
description: Deploy to staging environment
---

# Deploy to Staging

1. Run tests: `npm test`
2. Build: `npm run build`
3. Deploy: `npm run deploy:staging`
4. Verify: Check health endpoint

Environment: $ARGUMENTS
```

Available as `/project:deploy-staging production`.

## Personal Commands

Add to `~/.claude/commands/` for commands available in all projects:

```markdown
---
description: My preferred code style
---

# My Style Preferences

When writing code:
- Use early returns
- Prefer const over let
- Add JSDoc for public functions
```

## Subagents

See [Subagents](/commands/agents/) for specialized agents:
- [Explorer](/commands/agents/explorer) — Codebase navigation
- [Reviewer](/commands/agents/reviewer) — Code review
- [Tester](/commands/agents/tester) — Test generation
