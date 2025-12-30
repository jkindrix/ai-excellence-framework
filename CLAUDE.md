# AI Excellence Framework

## Overview

A comprehensive framework for reducing friction in AI-assisted software development. This project dogfoods itself—we use the framework to build the framework.

**Meta-nature**: Every improvement to this framework should be validated by using the framework during development. If a pattern doesn't help us build this project, it won't help others.

## Project Purpose

Transform documented friction points, mitigation strategies, and implementation blueprints into a distributable, installable framework that developers can adopt in minutes.

## Tech Stack

- **Primary**: Shell scripts, Markdown
- **CLI Tool**: Node.js (implemented)
- **MCP Server**: Python (implemented)
- **Documentation**: Markdown
- **Testing**: Node.js native test runner, pytest, bash

## Architecture

### Document Hierarchy
```
Core Documents (source of truth)
├── ai-development-friction.md      # Problem definition (with TL;DR)
├── ai-friction-mitigations.md      # Strategy library (with TL;DR)
├── ai-friction-implementation.md   # Implementation blueprints (with TL;DR)
└── ai-friction-action-plan.md      # Strategic roadmap

Deployable Assets
├── .claude/commands/               # 8 slash commands
├── .claude/agents/                 # 3 custom subagents
├── scripts/hooks/                  # 4 hook scripts
├── scripts/mcp/                    # MCP server (production-ready)
└── scripts/metrics/                # Metrics collection

CLI & Infrastructure
├── bin/cli.js                      # CLI entry point
├── src/commands/                   # CLI command implementations
├── src/schemas/                    # JSON validation schemas
├── templates/presets/              # 4 preset configurations
└── tests/                          # Automated test suites
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
# Initialize framework in a project
npx ai-excellence-framework init

# Validate framework installation
npx ai-excellence-framework validate

# Check environment health
npx ai-excellence-framework doctor

# Run tests
npm test

# Validate markdown formatting
npx markdownlint-cli2 "**/*.md"

# Collect session metrics
./scripts/metrics/collect-session-metrics.sh --auto
```

## Current State

### Phase
Phase 3: 5-Star Production Ready — All features complete, tested, documented

### Active Work
- Framework complete with comprehensive test coverage
- Ready for npm publishing and external adoption
- VitePress documentation site configured

### Recent Decisions
- 2024-12-30: Created dedicated project folder at ~/ai-excellence-framework
- 2024-12-30: Decided to dogfood immediately rather than building first
- 2024-12-30: Comprehensive review and enhancement pass completed
- 2024-12-30: Added CLI installer, automated tests, degit templates, and configuration schemas
- 2024-12-30: Enhanced MCP server with connection pooling, rate limiting, thread safety
- 2024-12-30: Added VitePress documentation site configuration
- 2024-12-30: All research citations verified against authoritative sources
- 2024-12-30: Added comprehensive integration, E2E, and performance tests

### Completed Work
- [x] CLI tool implemented (init, validate, doctor, update commands)
- [x] MCP server with connection pooling, rate limiting, WAL mode
- [x] Comprehensive test suites (unit, integration, E2E, performance)
- [x] All 8 slash commands implemented
- [x] All 3 subagents implemented
- [x] 4 preset templates (minimal, standard, full, team)
- [x] Configuration validation schemas
- [x] TL;DR summaries added to verbose documents
- [x] Quick reference documentation
- [x] CHANGELOG.md with semantic versioning
- [x] VitePress documentation site configuration
- [x] MCP security documentation
- [x] Research citations verification document
- [x] CI/CD pipeline with comprehensive checks
- [x] npm publishing preparation complete

### Known Gaps
- [ ] npm package not yet published (ready for publishing)
- [ ] VitePress site not deployed (configured, needs hosting)
- [ ] Real-world team usage data pending

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
| CLAUDE.md | Yes | Yes | Essential for context across sessions |
| /plan command | Yes | Yes | Used for framework development planning |
| /verify command | Yes | Yes | Used to verify implementation completeness |
| /handoff command | Pending | TBD | Session continuity support ready |
| /assumptions command | Pending | TBD | Available for complex decisions |
| /security-review command | Yes | Yes | Guided security considerations in CLI/MCP |
| /refactor command | Yes | Yes | Used during enhancement pass |
| /test-coverage command | Yes | Yes | Guided test additions |
| Session notes | Pending | TBD | Infrastructure ready |
| Pre-commit hooks | Yes | Yes | Template comprehensive and tested |
| MCP memory | Yes | Yes | Production server with export/import |
| Metrics collection | Yes | TBD | Script implemented, awaiting data |
| TodoWrite tracking | Yes | Yes | Critical for complex multi-step tasks |
| Online research | Yes | Yes | Validated all claims against sources |
| CLI installer | Yes | Yes | Used to structure project |
| Configuration schemas | Yes | Yes | Provides validation structure |
| Degit templates | Yes | Yes | 4 presets for different use cases |

### Dogfooding Observations

**What's Working:**
- CLAUDE.md provides essential project context across sessions
- TodoWrite helps maintain focus during complex 12+ step tasks
- Online research before recommendations prevents architectural mistakes
- Comprehensive testing catches issues before they become problems
- TL;DR summaries make verbose documents accessible
- Configuration schemas provide clear structure
- Multiple preset templates cover different use cases
- Connection pooling in MCP server improves team deployment readiness
- Rate limiting prevents abuse in shared environments
- VitePress provides modern documentation experience
- Research citations document ensures claims are verifiable

**What Needs Improvement:**
- [x] ~~Need to actually use /verify before completing tasks~~ (Done)
- [x] ~~MCP server needed connection pooling for team use~~ (Done)
- [x] ~~Research citations needed verification~~ (Done - 100% verified)
- [ ] Session handoffs not yet practiced in multi-session workflow
- [ ] Metrics collection script ready but needs real usage data

**Friction Observed During Development:**
- File creation requires reading first (Write tool constraint) - worked around
- Large context conversations benefit from session summaries
- Multiple verification passes valuable but need bounded scope (Two-Pass Rule)
- Parallel tool execution significantly speeds up multi-file operations
- Web search validation critical for ensuring accuracy of claims
