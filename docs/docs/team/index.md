# Team Adoption

This section covers adopting the AI Excellence Framework across teams.

## Adoption Paths

### Individual Developer

**Time:** 15 minutes

```bash
npx ai-excellence-framework init --preset minimal
```

Includes:
- CLAUDE.md
- /plan and /verify commands

### Team (Standard)

**Time:** 1 hour

```bash
npx ai-excellence-framework init --preset standard
```

Includes:
- CLAUDE.md with team conventions
- All 8 slash commands
- 3 subagents
- Pre-commit hooks

### Organization (Full)

**Time:** 2-4 hours

```bash
npx ai-excellence-framework init --preset full
```

Includes:
- Everything in standard
- MCP server for persistent memory
- Metrics collection
- Advanced configuration

### Enterprise (Team)

**Time:** Half day

```bash
npx ai-excellence-framework init --preset team
```

Includes:
- Everything in full
- Team memory federation
- Multi-project context sharing
- Organizational metrics

## Team Onboarding

### 1. Establish Shared CLAUDE.md

Create a team template:

```markdown
# [Team Name] Project Template

## Stack
[Your standard stack]

## Conventions
[Your coding standards]

## Commands
[Your build/test/deploy commands]

## Security
[Your security requirements]
```

### 2. Install Pre-commit Hooks

Ensure all team members have hooks:

```bash
# Add to README or onboarding
pip install pre-commit
pre-commit install
```

### 3. Share Slash Commands

Commit commands to the repository:

```
.claude/
├── commands/
│   ├── plan.md
│   ├── verify.md
│   └── [team-specific].md
└── agents/
    └── [team-specific].md
```

### 4. Train the Team

Key concepts to cover:
- CLAUDE.md purpose and maintenance
- When to use /plan
- When to use /verify
- Security review workflow

## Convention Enforcement

See [Convention Enforcement](/docs/team/conventions) for:
- Automated style checking
- Consistent patterns across AI-generated code
- Team-wide quality standards

## Memory Federation

For teams sharing context:

1. Configure shared MCP server
2. Set up decision syncing
3. Establish pattern libraries

See [Team Memory Federation](/TEAM-MEMORY-FEDERATION) for details.

## Metrics

Track AI effectiveness:

- Task completion rates
- Rework frequency
- Security issue detection
- Developer satisfaction

See [Metrics Dashboard](/METRICS-VISUALIZATION) for setup.

## Common Challenges

### Inconsistent CLAUDE.md Usage

**Solution:** Make CLAUDE.md part of PR review checklist

### Skipped Pre-commit Hooks

**Solution:** CI enforces same checks as hooks

### No /plan for Complex Tasks

**Solution:** Team norm: "If it's not trivial, /plan first"

### Stale CLAUDE.md

**Solution:** Monthly review in team retros

## Success Metrics

| Metric | Target |
|--------|--------|
| CLAUDE.md freshness | Updated within 30 days |
| Hook bypass rate | <5% of commits |
| /plan usage for complex tasks | >80% |
| Security issues caught | Before merge |

## Resources

- [Convention Enforcement](/docs/team/conventions)
- [Team Memory Federation](/TEAM-MEMORY-FEDERATION)
- [Metrics Visualization](/METRICS-VISUALIZATION)
- [Enterprise Guide](/guides/enterprise)
