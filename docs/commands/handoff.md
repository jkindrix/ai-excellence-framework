# /handoff Command

Generate structured notes for session continuity.

## Purpose

Create explicit documentation at session boundaries so the next session (or person) can continue effectively.

## Why It Matters

| Without /handoff | With /handoff |
|------------------|---------------|
| Context lost | Context preserved |
| Decisions forgotten | Decisions documented |
| Blockers rediscovered | Blockers known |
| Ramp-up time wasted | Quick continuation |

## Usage

```
/handoff
```

No arguments needed—generates based on session context.

## Output Format

```markdown
## Session Handoff: [Date]

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
- [Immediate next steps]
- [Questions to answer]
- [Resources needed]

### Files Modified
- `path/to/file.ts` - [what changed]

### Context to Preserve
[Any important context that might be lost]
```

## Best Practices

### 1. Run Before Ending Session

Don't wait until you're about to close—run it while context is fresh:

```
/handoff
# Review output
# Save to docs/session-notes/
# Then end session
```

### 2. Save the Output

Store handoffs for future reference:

```
docs/
└── session-notes/
    ├── 2024-12-30-auth-feature.md
    └── 2024-12-31-payment-integration.md
```

### 3. Be Specific About Blockers

```markdown
### Blockers Encountered

- ❌ **API key missing** — Need STRIPE_API_KEY from team lead
- ❌ **Test failing** — `payment.test.ts:47` flaky, needs investigation
```

### 4. Include Decision Rationale

Future you will forget why decisions were made:

```markdown
### Decisions Made

| Decision | Rationale |
|----------|-----------|
| Used Stripe over PayPal | Better documentation, team familiarity |
| Stored tokens in session | Simpler than separate token store for MVP |
```

## When to Use

| Situation | Use /handoff? |
|-----------|---------------|
| End of work day | Yes |
| Switching to different task | Yes |
| Before taking a break | Optional |
| Someone else continuing work | Yes |
| Personal project, same person | Optional |

## Practical Example

**Session:** Implementing user authentication

```markdown
## Session Handoff: 2024-12-30

### Completed
- OAuth2 flow with Google provider
- User model with OAuth fields
- Login/logout endpoints

### In Progress
- Refresh token handling (50% done)
- Session management

### Decisions Made
| Decision | Rationale |
|----------|-----------|
| OAuth2 over SAML | Simpler, adequate for current needs |
| Google only (initially) | Most users have Google accounts |

### Blockers Encountered
- Need to configure Google Cloud Console credentials

### For Next Session
- [ ] Get Google OAuth credentials from project owner
- [ ] Complete refresh token rotation
- [ ] Add session timeout handling
- [ ] Write tests for auth flow

### Files Modified
- `src/auth/oauth.ts` - OAuth flow implementation
- `src/models/user.ts` - Added OAuth fields
- `src/routes/auth.ts` - Login/logout routes

### Context to Preserve
The OAuth library requires specific callback URL format.
See `docs/oauth-setup.md` for configuration details.
```

## Integration with CLAUDE.md

Update CLAUDE.md's "Current State" section with handoff info:

```markdown
## Current State

### Active Work
Completing OAuth2 refresh token handling

### Recent Decisions
- Using Google OAuth only for MVP
- Tokens stored in session

### Blockers
- Awaiting Google Cloud credentials
```

## Evidence

| Source | Finding |
|--------|---------|
| [GitHub #11455](https://github.com/anthropics/claude-code/issues/11455) | Developers request session continuity |
| [RedMonk 2025](https://redmonk.com/kholterhoff/2025/12/22/10-things-developers-want-from-their-agentic-ides-in-2025/) | Session continuity top request |

## See Also

- [/plan](/commands/plan) — Start new task with plan
- [Session Notes](/docs/session-notes/) — Example handoffs
