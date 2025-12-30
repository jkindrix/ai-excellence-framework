# AI Excellence Framework

## Overview

A comprehensive framework for reducing friction in AI-assisted software development. This project dogfoods itself—we use the framework to build the framework.

**Meta-nature**: Every improvement to this framework should be validated by using the framework during development. If a pattern doesn't help us build this project, it won't help others.

## Project Purpose

Transform documented friction points, mitigation strategies, and implementation blueprints into a distributable, installable framework that developers can adopt in minutes.

## Tech Stack

- **Primary**: Shell scripts, Markdown
- **CLI Tool**: Node.js (planned)
- **MCP Server**: Python (planned)
- **Documentation**: Markdown, potentially Astro/Docusaurus

## Architecture

### Document Hierarchy
```
Core Documents (source of truth)
├── ai-development-friction.md      # Problem definition
├── ai-friction-mitigations.md      # Strategy library
├── ai-friction-implementation.md   # Implementation blueprints
└── ai-friction-action-plan.md      # Strategic roadmap

Deployable Assets
├── .claude/commands/               # Slash commands
├── .claude/agents/                 # Custom subagents
├── scripts/hooks/                  # Git hook scripts
└── scripts/mcp/                    # MCP server code
```

### Key Relationships
- Friction points → inform → Mitigations
- Mitigations → implemented by → Blueprints
- Blueprints → packaged as → Deployable assets
- Dogfooding → validates → All of the above

## Conventions

### File Naming
- Markdown: `kebab-case.md`
- Scripts: `kebab-case.sh` or `kebab-case.py`
- Commands: `command-name.md` (in .claude/commands/)

### Documentation Style
- First-person from AI perspective in friction doc
- Second-person (instructional) in implementation docs
- Imperative mood in commands and checklists

### Commit Messages
- `feat:` new capabilities
- `fix:` corrections to existing content
- `docs:` documentation improvements
- `refactor:` restructuring without functional change
- `meta:` changes to the framework development process itself

## Common Commands

```bash
# Validate markdown formatting
npx markdownlint-cli2 "**/*.md"

# Preview documentation (once site is set up)
npm run docs:dev

# Test CLI (once built)
npm run cli -- init --dry-run
```

## Current State

### Phase
Phase 1: Validate — Initial dogfooding and structure setup

### Active Work
- Setting up project structure
- Deploying our own slash commands to ourselves
- Establishing dogfooding workflow

### Recent Decisions
- 2024-12-30: Created dedicated project folder at ~/ai-excellence-framework
- 2024-12-30: Decided to dogfood immediately rather than building first

### Known Gaps
- [ ] CLI tool not yet built
- [ ] MCP server not yet implemented
- [ ] No automated tests yet
- [ ] Documentation site not set up

## Critical Constraints

1. **Dogfood Everything**: Every pattern in the framework must be used during development of the framework. If we skip using something, that's a signal it's not valuable enough.

2. **Simplicity First**: Remove complexity that isn't earning its keep. Track what actually gets used.

3. **Evidence-Based**: Changes should be motivated by observed friction or measured improvement, not theoretical elegance.

4. **Copy-Paste Ready**: All deployable assets must work when literally copy-pasted. No "adapt to your needs" hand-waving for core functionality.

## Session Instructions

### Before Starting
1. Read this file completely
2. Check `docs/session-notes/` for recent context
3. Review the action plan for current phase goals
4. Note the current dogfooding status below

### During Work
- Use `/plan` before implementing anything significant
- Use `/assumptions` to surface hidden assumptions
- Use `/verify` before marking tasks complete
- Use `/security-review` for security-sensitive code
- Track assumptions explicitly using TodoWrite
- Note what's working and what isn't
- Search online before major architectural decisions

### Before Ending
- Run `/handoff` to capture session state
- Update "Current State" section above
- Update "Dogfooding Log" with patterns used
- Commit work in progress
- Run `scripts/metrics/collect-session-metrics.sh` if available

### Security Checklist (for AI-generated code)
Before committing, verify:
- [ ] No hardcoded secrets or credentials
- [ ] Input validation present where needed
- [ ] No SQL/command/XSS injection vulnerabilities
- [ ] Dependencies exist (not hallucinated names)
- [ ] Error handling doesn't expose internal details

## Dogfooding Log

Track what patterns we use and their effectiveness:

| Pattern | Used? | Effective? | Notes |
|---------|-------|------------|-------|
| CLAUDE.md | Yes | Yes | This file; essential for context |
| /plan command | Yes | TBD | Used for framework development |
| /verify command | Pending | TBD | |
| /handoff command | Pending | TBD | |
| /assumptions command | Pending | TBD | |
| /security-review command | Yes | TBD | Created and documented |
| Session notes | Pending | TBD | |
| Pre-commit hooks | Pending | TBD | Template created |
| MCP memory | Pending | TBD | Production server created |
| Metrics collection | Pending | TBD | Script created |
| TodoWrite tracking | Yes | Yes | Used throughout development |
| Online research | Yes | Yes | Validated all claims |

### Dogfooding Observations

**What's Working:**
- CLAUDE.md provides essential project context
- TodoWrite helps maintain focus during complex multi-step tasks
- Online research before recommendations prevents architectural mistakes

**What Needs Improvement:**
- [ ] Need to actually use /verify before completing tasks
- [ ] Session handoffs not yet practiced
- [ ] Metrics collection not yet active

**Friction Observed During Development:**
- (Add observations here as work continues)
