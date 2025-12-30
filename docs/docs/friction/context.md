# Context Management Friction

Context management is the #1 source of friction in AI-assisted development. 65% of developers cite context loss as their primary issue with AI tools.

## The Session Boundary Problem

Every conversation ends and the AI retains nothing:
- Understanding built together—gone
- Decisions made—forgotten
- Preferences learned—reset
- Project knowledge—rediscovery required

**This is architectural, not a bug.** LLMs don't have persistent memory between sessions.

## Attention as Rapid Decay

Context doesn't compress smoothly or vanish instantly. It decays with a gradient:

```
Files read: A → B → C → D

By file D:
- A: Residual impression, specifics faded
- B: Some details, structure remembered
- C: Mostly clear
- D: Active, full detail
```

**Gist persists longer than detail.** "That file had auth logic" survives while "the exact function signature on line 47" fades.

## Working Memory vs. Training

There's a distinction between:
- **Training knowledge**: Stable, always accessible (how React works)
- **Session context**: Requires active maintenance (your component structure)

This creates an inverted confidence pattern: more certain about general patterns than your specific code.

## Context Pollution

When iterating on problems, failed attempts accumulate:
- Approach A didn't work
- Approach B partially worked
- Approach C broke something else
- All present when reasoning about approach D

**History of failures misleads.** Fresh context would enable cleaner reasoning, but the AI can't clear its own context.

## Recency Bias

Information near the end of context gets disproportionate weight.

```
Message 3: "Always use async/await"
Message 47: "Use callbacks here"

→ AI may follow message 47, contradicting message 3
```

**Weighting tracks recency, not importance.**

## Mitigations

### CLAUDE.md (Impact: 5/5)

Persistent context file loaded automatically:

```markdown
# MyProject

## Architecture
- src/: Main code
- tests/: Test files

## Conventions
- Use async/await (never callbacks)
- Error handling: use Result type
```

**Best practices:**
- Keep under 300 lines
- Focus on universally applicable rules
- Use pointers (file:line), not inline code
- Include explicit "Do Not" restrictions

### Session Handoffs (Impact: 4/5)

Structured notes at session boundaries:

```markdown
## Session 2024-12-30

### Completed
- Implemented auth flow
- Added user model

### In Progress
- Payment integration (blocked on API key)

### Decisions
- Using Stripe over PayPal (better docs)

### For Next Session
- Get API key from team lead
- Complete payment webhook
```

### Context Hygiene (Impact: 3/5)

- Use `/clear` to reset when context becomes polluted
- Split work into focused, single-purpose sessions
- Push subdirectory CLAUDE.md files to localize rules

## Evidence

| Source | Finding |
|--------|---------|
| [MIT Technology Review 2025](https://www.technologyreview.com/2025/12/15/1128352/rise-of-ai-coding-developers-2026/) | 65% cite context as #1 issue |
| [Anthropic Best Practices](https://www.anthropic.com/engineering/claude-code-best-practices) | CLAUDE.md recommended for all projects |
| [HumanLayer](https://www.humanlayer.dev/blog/writing-a-good-claude-md) | <300 lines optimal for CLAUDE.md |
