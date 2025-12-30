# Project: [PROJECT_NAME]

## Overview
[One paragraph describing what this project does and its purpose]

**Team Size**: [X developers]
**AI Usage**: [Describe how the team uses AI assistants]

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
├── team-conventions/ # Team coding standards
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

## Team Conventions

### Code Review Requirements
- [ ] All AI-generated code must be human-reviewed
- [ ] Security checklist must be completed
- [ ] Tests must pass before merge

### AI Usage Guidelines
- Use `/plan` before any feature work
- Use `/security-review` before merging security-sensitive code
- Document AI-assisted decisions in commit messages

### Handoff Protocol
- Run `/handoff` when switching between developers
- Update session notes in `docs/session-notes/`
- Reference session notes when resuming work

## Common Commands
```bash
# Development
npm run dev          # Start development server
npm run build        # Production build
npm test             # Run tests
npm run lint         # Run linter

# Team Tools
npm run aix:validate # Validate framework setup
npm run aix:doctor   # Check environment health
```

## Current State

### Phase
[e.g., Phase 1: MVP Development]

### Active Work
- [Current feature/task being developed]
- **Assigned To**: [Developer name or AI session]

### Recent Decisions
- [DATE]: [Decision and rationale] - **Decided by**: [Name]

### Known Issues
- [ ] [List known bugs or technical debt]

## Critical Constraints

1. **Team Coordination**: All significant changes require team notification

2. **AI Code Review**: All AI-generated code must pass security review

3. **Documentation**: Major changes require documentation updates

## Session Instructions

### Before Starting
1. Read this file completely
2. Check `docs/session-notes/` for handoffs from other team members
3. Review assigned tasks and current sprint goals
4. Run tests to verify baseline: `npm test`

### During Work
- Use `/plan` before implementing anything significant
- Use `/assumptions` to surface hidden assumptions
- Use `/verify` before marking tasks complete
- Use `/security-review` for security-sensitive code
- Track assumptions explicitly using TodoWrite
- Search online before major architectural decisions
- **Notify team** of breaking changes or blockers

### Before Ending
- Run `/handoff` to capture session state
- Update "Current State" section above
- Save session notes to `docs/session-notes/[DATE]-[TOPIC].md`
- Commit work in progress
- **Update team** on progress and blockers

### Security Checklist (for AI-generated code)
Before committing, verify:
- [ ] No hardcoded secrets or credentials
- [ ] Input validation present where needed
- [ ] No SQL/command/XSS injection vulnerabilities
- [ ] Dependencies exist (not hallucinated names)
- [ ] Error handling doesn't expose internal details
- [ ] **Human reviewed** (for team projects)

## Team Activity Log

| Date | Developer | Action | Notes |
|------|-----------|--------|-------|
| [DATE] | [Name] | [Action] | [Notes] |

---

*AI Excellence Framework - Team Preset*
