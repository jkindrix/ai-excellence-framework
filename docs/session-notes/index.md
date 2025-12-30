# Session Notes

This directory contains session handoff notes for development continuity.

## Purpose

Session notes capture context at the end of work sessions so future sessions can continue effectively.

## Structure

```
session-notes/
├── index.md                     # This file
├── EXAMPLE-SESSION.md           # Template/example
└── YYYY-MM-DD-description.md    # Actual session notes
```

## Creating Session Notes

At the end of a work session:

```
/handoff
```

Then save the output as `YYYY-MM-DD-description.md`.

## Session Note Template

```markdown
## Session Handoff: YYYY-MM-DD

### Focus
[What this session was about]

### Completed
- [What was finished]

### In Progress
- [What was started but not finished]

### Decisions Made
| Decision | Rationale |
|----------|-----------|
| [Choice] | [Why] |

### Blockers Encountered
- [What blocked progress]

### For Next Session
- [ ] [Immediate next steps]

### Files Modified
- `path/to/file` - [what changed]

### Context to Preserve
[Important context that might be lost]
```

## Best Practices

1. **Create immediately** — Don't wait until you've lost context
2. **Be specific** — Future you won't remember vague notes
3. **Include decisions** — Record why, not just what
4. **List blockers** — So they're not rediscovered
5. **Name descriptively** — `2024-12-30-auth-feature.md` not `session.md`

## See Also

- [/handoff command](/commands/handoff) — Generate handoff notes
- [Example session](/docs/session-notes/EXAMPLE-SESSION) — Sample handoff
