# Understanding AI Friction

AI coding assistants have real architectural constraints—not bugs or limitations to be fixed, but fundamental characteristics of how large language models work.

## The Friction Taxonomy

We've documented **59 specific friction points** across 17 categories. Here are the key areas:

### Memory & Context (§1-8)

| Friction Point | Description |
|---------------|-------------|
| Session Boundary | Complete memory wipe between sessions |
| Attention Decay | Earlier context fades as more is added |
| Context Pollution | Failed attempts accumulate and mislead |
| Recency Bias | Recent information dominates older context |
| Coherence Illusion | Sequential generation appears as unified reasoning |

### Generation & Reasoning (§9-17)

| Friction Point | Description |
|---------------|-------------|
| First-Framing Lock | Initial interpretation constrains everything |
| Pattern-Matching Trap | Familiar patterns applied to different situations |
| Hallucination Gradient | Confidence doesn't track accuracy |
| Deferred Attention Decay | Mental notes don't persist reliably |

### Security Concerns (§18-25)

| Friction Point | Description |
|---------------|-------------|
| Vulnerability Blindness | 45% of AI code has security flaws |
| Package Hallucination | ~20% of suggested packages don't exist |
| Privilege Escalation | 322% more common in AI code |

## Empirical Evidence

| Friction Category | Measured Impact | Source |
|-------------------|-----------------|--------|
| Context loss | 65% cite as #1 AI issue | MIT Technology Review 2025 |
| Security vulnerabilities | 40%+ of generated code | Endor Labs Research 2025 |
| XSS vulnerabilities | 2.74× more likely | Apiiro Research 2025 |
| Package hallucination | ~20% of suggestions | BleepingComputer 2025 |
| Productivity (unstructured) | 19% slowdown | METR Study 2025 |
| Productivity (structured) | 21-26% improvement | Google/Microsoft RCTs |

## The Productivity Delta

**~40-45%** is the difference between disciplined and undisciplined AI use.

This isn't about AI being "good" or "bad"—it's about understanding constraints and working with them.

## Detailed Categories

- [Context Management](/docs/friction/context) - Memory, attention, session boundaries
- [Security Concerns](/docs/friction/security) - Vulnerabilities, hallucinations, trust
- [Quality Degradation](/docs/friction/quality) - Code quality, maintainability, technical debt
- [Research Findings](/docs/friction/research) - Latest studies and evidence

## What Helps

The framework provides mitigations for each friction category:

| Friction | Mitigation |
|----------|------------|
| Session boundary | CLAUDE.md |
| First-framing | /plan command |
| Overconfidence | /verify command |
| Security blindness | Pre-commit hooks |
| Context decay | Session handoffs |

Read the full [friction analysis](/ai-development-friction.md) for all 59 points.
