# Mitigation Strategies Overview

This framework provides 40+ evidence-based mitigations organized by implementation type.

## Quick Impact Matrix

| Mitigation | Effort | Impact | Addresses |
|------------|--------|--------|-----------|
| **CLAUDE.md** | Low | 5/5 | Session boundary, context loss |
| **`/plan` before coding** | Low | 5/5 | First-framing lock, misinterpretation |
| **`/verify` before completing** | Low | 4/5 | Overconfidence, hallucination |
| **Pre-commit security hooks** | Medium | 5/5 | 45% vulnerability rate |
| **Session handoffs** | Low | 4/5 | Cross-session continuity |
| **MCP project memory** | Medium | 4/5 | Long-term context persistence |

## The 15-Minute Setup

Get immediate value with minimal effort:

```bash
# 1. Create CLAUDE.md in your project root (5 min)
# 2. Copy /plan and /verify commands (2 min)
mkdir -p .claude/commands
# Copy plan.md and verify.md

# 3. Install pre-commit hooks (5 min)
pip install pre-commit
pre-commit install

# 4. Create session notes directory (1 min)
mkdir -p docs/session-notes

# 5. Start using (2 min)
claude
/plan [your first task]
```

## Categories

### User-Side Mitigations

Actions you can take immediately with no infrastructure:

- [CLAUDE.md Best Practices](/docs/mitigations/claude-md) — Persistent context
- [Slash Commands](/docs/mitigations/commands) — Structured workflows
- Session handoffs — Continuity protocols

### System-Side Mitigations

Tool configurations and infrastructure:

- [MCP Server](/docs/mitigations/mcp) — Project memory persistence
- [Git Hooks](/docs/mitigations/hooks) — Automated quality gates
- SAST integration — Security scanning

### Team-Level Mitigations

Coordination patterns for teams:

- [Subagents](/docs/mitigations/agents) — Specialized AI workflows
- Team memory federation — Shared context
- Convention enforcement — Consistency patterns

## Evidence-Based Approach

Every mitigation is rated using evidence from:

| Rating | Meaning | Evidence Required |
|--------|---------|-------------------|
| **5** | Critical/Transformative | Multiple studies show >30% improvement |
| **4** | High Impact | Studies show 10-30% improvement |
| **3** | Moderate Impact | Practitioner reports show improvement |
| **2** | Low Impact | Theoretical benefit, limited evidence |
| **1** | Minimal Impact | Marginal benefit |

## Key Evidence

| Strategy | Key Research | Measured Impact |
|----------|--------------|-----------------|
| CLAUDE.md | [Anthropic](https://www.anthropic.com/engineering/claude-code-best-practices) | 65% cite missing context as #1 issue |
| Plan-First | [METR Study](https://metr.org/blog/2025-07-10-early-2025-ai-experienced-os-dev-study/) | Unplanned use = 19% slower |
| Verification | [Veracode 2025](https://www.veracode.com/blog/genai-code-security-report/) | 45% vulnerability rate |
| Multi-Agent | [Qodo 2025](https://www.qodo.ai/reports/state-of-ai-code-quality/) | 81% quality improvement |

## The 80/20 Rule

**CLAUDE.md + /plan + /verify address 80% of friction with 20% of effort.**

Start here before adding more sophisticated mitigations.
