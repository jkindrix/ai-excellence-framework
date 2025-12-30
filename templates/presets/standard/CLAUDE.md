# Project: [PROJECT_NAME]

## Overview

[One paragraph describing what this project does and its purpose]

## Tech Stack

- Language: [e.g., TypeScript 5.3]
- Runtime: [e.g., Node.js 20.x]
- Framework: [e.g., Next.js 14]
- Database: [e.g., PostgreSQL 15]
- Key Dependencies: [list critical deps with versions]

## Architecture

### Directory Structure

```
src/
├── api/          # API routes and handlers
├── components/   # UI components
├── lib/          # Shared utilities
├── services/     # Business logic
└── types/        # Type definitions
```

### Key Entry Points

- API: `src/api/index.ts`
- Main: `src/index.ts`

## Conventions

### Code Style

- [Naming conventions]
- [File organization rules]

### Commit Messages

- Use conventional commits: feat|fix|docs|refactor|test|chore

## Common Commands

```bash
npm run dev      # Start development server
npm run build    # Production build
npm test         # Run tests
npm run lint     # Run linter
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

## Critical Constraints

1. **[Constraint Name]**: [Description of constraint and why it matters]

## Session Instructions

### Before Starting

1. Read this file completely
2. Check recent git history for context
3. Run tests to verify baseline: `npm test`

### During Work

- Use `/plan` before implementing anything significant
- Use `/assumptions` to surface hidden assumptions
- Use `/verify` before marking tasks complete
- Use `/security-review` for security-sensitive code
- Search online before major architectural decisions

### Before Ending

- Run `/handoff` to capture session state
- Update "Current State" section above
- Commit work in progress

### Security Checklist (for AI-generated code)

Before committing, verify:

- [ ] No hardcoded secrets or credentials
- [ ] Input validation present where needed
- [ ] No SQL/command/XSS injection vulnerabilities
- [ ] Dependencies exist (not hallucinated names)
- [ ] Error handling doesn't expose internal details

---

_AI Excellence Framework - Standard Preset_
_Best practice: Keep CLAUDE.md under 300 lines. Move details to subdirectory CLAUDE.md files if needed._
