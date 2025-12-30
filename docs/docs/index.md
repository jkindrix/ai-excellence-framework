# What is AI Excellence Framework?

AI Excellence Framework is a comprehensive toolkit for reducing friction in AI-assisted software development. It addresses the fundamental architectural constraints of AI coding assistants with evidence-based solutions.

## The Problem

AI coding assistants have real limitations—not excuses, but architectural constraints:

| Friction | Impact | Solution |
|----------|--------|----------|
| **Session Amnesia** | 65% cite as #1 issue | CLAUDE.md context files |
| **First-Framing Lock** | Compounds early errors | /plan command |
| **Security Vulnerabilities** | 45% of AI code affected | Pre-commit hooks, /security-review |
| **Overconfidence** | Masks fundamental errors | /verify command |
| **Context Decay** | Information loses specificity | Session handoffs |

## The Evidence

Research from 2024-2025 shows:

- **19% slower**: Experienced developers using AI without structure ([METR Study](https://metr.org/blog/2025-07-10-early-2025-ai-experienced-os-dev-study/))
- **21-26% faster**: Developers using AI with discipline ([MIT/NBER](https://arxiv.org/abs/2302.06590))
- **~40-45%**: The productivity delta between disciplined and undisciplined AI use

## Quick Start

```bash
# Install
npx ai-excellence-framework init

# Start using
claude
/plan [your task]
```

## What's Included

- **8 Slash Commands**: /plan, /verify, /handoff, /assumptions, /review, /security-review, /refactor, /test-coverage
- **3 Custom Agents**: Explorer, Reviewer, Tester
- **4 Preset Templates**: Minimal, Standard, Full, Team
- **MCP Server**: Persistent project memory with SQLite
- **Pre-commit Hooks**: Security scanning, dependency validation

## Next Steps

- [Why This Framework?](/docs/why) - Understand the philosophy
- [Core Concepts](/docs/concepts) - Learn key patterns
- [Getting Started](/getting-started) - 5-minute setup guide
