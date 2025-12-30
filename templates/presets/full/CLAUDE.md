# Project: [PROJECT_NAME]

## Overview

[One paragraph describing what this project does and its purpose]

**Meta-nature**: [If this project dogfoods itself or has a self-referential quality, describe it here]

## Project Purpose

[Detailed explanation of the project's goals and target audience]

## Tech Stack

- **Primary**: [Main language, version]
- **Runtime**: [e.g., Node.js 20.x]
- **Framework**: [e.g., Next.js 14]
- **Database**: [e.g., PostgreSQL 15]
- **Key Dependencies**: [list critical deps with versions]

## Architecture

### Document Hierarchy

```
docs/
├── architecture/     # Architecture decision records
├── session-notes/    # Session handoff notes
└── api/              # API documentation

src/
├── api/              # API routes and handlers
├── components/       # UI components
├── lib/              # Shared utilities
├── services/         # Business logic
└── types/            # Type definitions
```

### Key Entry Points

- API: `src/api/index.ts`
- Main: `src/index.ts`

### Key Relationships

- [Document important patterns and how components interact]

## Conventions

### File Naming

- [Convention]: `example.ts`

### Code Style

- [Naming conventions]
- [File organization rules]
- [Import ordering]

### Documentation Style

- [Describe documentation conventions]

### Commit Messages

- `feat:` new capabilities
- `fix:` corrections
- `docs:` documentation improvements
- `refactor:` restructuring without functional change
- `test:` test additions/changes

## Common Commands

```bash
# Development
npm run dev          # Start development server
npm run build        # Production build
npm test             # Run tests
npm run lint         # Run linter

# Framework Tools
npm run aix:validate # Validate framework setup
npm run aix:doctor   # Check environment health
```

## Current State

### Phase

[e.g., Phase 1: MVP Development]

### Active Work

- [Current feature/task being developed]

### Recent Decisions

- [DATE]: [Decision and rationale]

### Known Issues

- [ ] [List known bugs or technical debt]

### Known Gaps

- [ ] [Features not yet implemented]

## Critical Constraints

1. **[Constraint Name]**: [Description of constraint and why it matters]

2. **Simplicity First**: Remove complexity that isn't earning its keep.

3. **Evidence-Based**: Changes should be motivated by observed friction or measured improvement.

## Session Instructions

### Before Starting

1. Read this file completely
2. Check `docs/session-notes/` for recent context
3. Review recent git history
4. Run tests to verify baseline: `npm test`
5. Note the current dogfooding status below

### During Work

- Use `/plan` before implementing anything significant
- Use `/assumptions` to surface hidden assumptions
- Use `/verify` before marking tasks complete
- Use `/security-review` for security-sensitive code
- Use `/refactor` before major restructuring
- Use `/test-coverage` to analyze test gaps
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

| Pattern                  | Used?   | Effective? | Notes     |
| ------------------------ | ------- | ---------- | --------- |
| CLAUDE.md                | Yes     | TBD        | This file |
| /plan command            | Pending | TBD        |           |
| /verify command          | Pending | TBD        |           |
| /handoff command         | Pending | TBD        |           |
| /assumptions command     | Pending | TBD        |           |
| /security-review command | Pending | TBD        |           |
| /refactor command        | Pending | TBD        |           |
| /test-coverage command   | Pending | TBD        |           |
| Session notes            | Pending | TBD        |           |
| Pre-commit hooks         | Pending | TBD        |           |
| MCP memory               | Pending | TBD        |           |
| Metrics collection       | Pending | TBD        |           |
| TodoWrite tracking       | Yes     | TBD        |           |
| Online research          | Pending | TBD        |           |

### Dogfooding Observations

**What's Working:**

- [Add observations here]

**What Needs Improvement:**

- [ ] [Add observations here]

**Friction Observed During Development:**

- [Add observations here as work continues]

---

_AI Excellence Framework - Full Preset_
_Best practice: Keep CLAUDE.md under 300 lines. This template is ~200 lines._
_Move detailed conventions to subdirectory CLAUDE.md files as the project grows._
