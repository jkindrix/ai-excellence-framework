# Why This Framework?

## The Productivity Paradox

AI coding assistants promise massive productivity gains, but research tells a more nuanced story:

| Study | Finding |
|-------|---------|
| [METR 2025](https://metr.org/blog/2025-07-10-early-2025-ai-experienced-os-dev-study/) | Experienced developers 19% **slower** with unstructured AI use |
| [MIT/NBER](https://arxiv.org/abs/2302.06590) | 21-26% **faster** with disciplined AI use |
| [Veracode 2025](https://www.veracode.com/blog/genai-code-security-report/) | 45% of AI-generated code has security vulnerabilities |

**The delta between "good" and "bad" AI use is ~40-45%.** This framework exists to help you capture the gains.

## Why Existing Tools Aren't Enough

Most AI coding tools focus on generation speed, not quality or sustainability:

1. **No context persistence** — Every session starts from zero
2. **No misframing detection** — Initial misinterpretation compounds
3. **No verification protocols** — "Looks good" isn't validation
4. **No security-specific checks** — AI-generated vulnerabilities slip through

## The Framework Approach

Instead of more AI, we add **structure**:

```
User Request
    ↓
/plan (catch misframing early)
    ↓
Implementation (with CLAUDE.md context)
    ↓
/verify (skeptical validation)
    ↓
Pre-commit hooks (security + deps)
    ↓
/handoff (session continuity)
```

## Evidence-Based Design

Every component addresses a specific, measurable friction point:

| Component | Friction Addressed | Evidence |
|-----------|-------------------|----------|
| CLAUDE.md | Session amnesia | 65% cite context loss as #1 issue |
| /plan | First-framing lock | Unplanned use = 19% slower |
| /verify | Overconfidence | Falsification catches hidden errors |
| Pre-commit hooks | Security blind spots | 45% vulnerability rate |
| MCP Server | Cross-session memory | Enables architectural continuity |

## Who Benefits Most

Research shows AI tools help most for:

- **Junior developers**: 27-39% productivity gain
- **Developers in unfamiliar codebases**: Faster onboarding
- **Boilerplate and repetitive tasks**: Reduced drudgery
- **Learning new technologies**: Accelerated ramp-up

This framework helps **everyone** by providing structure that works with AI capabilities, not against them.

## Next: Core Concepts

Learn the key patterns: [Core Concepts](/docs/concepts)
