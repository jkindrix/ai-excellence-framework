# Session Notes

This directory contains session handoff notes for maintaining context between AI-assisted development sessions.

## Purpose

Session notes help:
- **Preserve context** between conversations
- **Track decisions** made during development
- **Document blockers** and their resolutions
- **Enable continuity** when resuming work

## Creating Session Notes

Use the `/handoff` command at the end of a session to automatically generate session notes:

```
/handoff
```

The command will:
1. Summarize work completed
2. List files modified
3. Document decisions made
4. Identify pending work
5. Note any blockers or issues

## File Naming Convention

```
YYYY-MM-DD-<brief-description>.md
```

Examples:
- `2025-01-15-auth-implementation.md`
- `2025-01-16-api-refactor.md`
- `2025-01-17-performance-optimization.md`

## Template

```markdown
# Session Notes: [Brief Description]

**Date**: YYYY-MM-DD
**Duration**: ~X hours
**Focus**: [Main objective]

## Session Summary
[One paragraph overview]

## Work Completed
- [x] Task 1
- [x] Task 2

## Decisions Made
| Decision | Rationale | Alternatives |
|----------|-----------|--------------|
| ... | ... | ... |

## Blockers Encountered
1. [Blocker] - [Resolution]

## Context for Next Session

### Files Modified
- `path/to/file.js` (new/updated/deleted)

### Pending Work
- [ ] Next task 1
- [ ] Next task 2

### Known Issues
- Issue description

## Notes for Future Sessions
- Important context that might be forgotten
```

## Best Practices

1. **Write notes at session end** - Context is freshest
2. **Be specific about files** - List exact paths
3. **Explain decisions** - Future you will thank you
4. **Note blockers** - Even resolved ones help future debugging
5. **Keep notes focused** - One session = one note file

## Privacy

- Files ending in `.local.md` are gitignored
- Use `.local.md` suffix for sensitive session notes
- Never commit credentials or secrets

## See Also

- [CLAUDE.md](../../CLAUDE.md) - Project context file
- [/handoff command](../../.claude/commands/handoff.md) - Session handoff command
