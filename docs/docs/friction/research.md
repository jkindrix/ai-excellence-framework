# Research Findings

This page summarizes key research on AI-assisted development from 2024-2025. All citations have been verified against primary sources.

## Productivity Studies

### METR Study (July 2025)

**Finding:** Experienced developers were 19% **slower** when using AI tools without structure.

- Developers expected 24% speedup
- Actual result: 19% slowdown
- AI suggestion acceptance rate: <44%

**Source:** [METR Blog](https://metr.org/blog/2025-07-10-early-2025-ai-experienced-os-dev-study/) | [arXiv](https://arxiv.org/abs/2507.09089)

### MIT/NBER/Microsoft Study (2024)

**Finding:** 21-26% productivity improvement with structured AI use.

- Junior developers: 27-39% gain
- Senior developers: 7-16% gain
- Short-tenure developers: 21-40% gain

**Source:** [IT Revolution Summary](https://itrevolution.com/articles/new-research-reveals-ai-coding-assistants-boost-developer-productivity-by-26-what-it-leaders-need-to-know/)

### GitHub/Accenture Study (2024)

**Finding:** 55.8% faster task completion in controlled experiment.

- 85% felt more confident in code quality
- 30% suggestion acceptance rate
- 90% committed AI-suggested code

**Source:** [GitHub Blog](https://github.blog/news-insights/research/research-quantifying-github-copilots-impact-in-the-enterprise-with-accenture/)

### Key Insight

The **~40-45% productivity delta** between structured and unstructured AI use is consistent across studies:
- Unstructured: -19% (METR)
- Structured: +21-26% (MIT/NBER)
- Delta: ~40-45%

## Security Research

### Veracode GenAI Report (2025)

**Finding:** 45% of AI-generated code contains OWASP Top 10 vulnerabilities.

| Language | Failure Rate |
|----------|--------------|
| Java | 72% |
| Python | 38-45% |
| JavaScript | 38-45% |
| C# | 38-45% |

**Specific vulnerabilities:**
- XSS (CWE-80): 86% failure rate
- Log Injection (CWE-117): 88% vulnerable

**Key quote:** "Models are getting better at coding accurately but are not improving at security."

**Source:** [Veracode Blog](https://www.veracode.com/blog/genai-code-security-report/)

### Apiiro Fortune 50 Study (2025)

**Finding:** AI-generated code has significantly more critical vulnerabilities.

| Issue Type | Increase |
|------------|----------|
| Privilege Escalation | 322% |
| Architectural Flaws | 153% |
| AI-generated code | 41% of new code |

**Source:** [Apiiro Blog](https://apiiro.com/blog/4x-velocity-10x-vulnerabilities-ai-coding-assistants-are-shipping-more-risks/)

### Slopsquatting Research (2025)

**Finding:** ~20% of AI package suggestions don't exist.

- 205,474 unique hallucinated package names
- 58% of hallucinations are repeatable
- ChatGPT-4: ~5% hallucination rate

**Source:** [BleepingComputer](https://www.bleepingcomputer.com/news/security/ai-hallucinated-code-dependencies-become-new-supply-chain-risk/)

## Developer Experience

### Stack Overflow 2025 Survey

| Metric | Value |
|--------|-------|
| Using AI tools | 84% |
| Using daily | 51% |
| Positive sentiment | 60% (down from 70%+ in 2023-2024) |
| Trust AI accuracy | 33% |
| Distrust AI accuracy | 46% |

**Source:** [Stack Overflow](https://survey.stackoverflow.co/2025/ai)

### JetBrains 2025 Survey

| Metric | Value |
|--------|-------|
| Using AI regularly | 85% |
| Using AI coding assistant | 62% |
| Time saved (typical) | 1+ hour/week |
| Time saved (power users) | 8+ hours/week |

**Source:** [JetBrains Blog](https://blog.jetbrains.com/research/2025/10/state-of-developer-ecosystem-2025/)

### Context as #1 Issue

| Finding | Source |
|---------|--------|
| 65% cite context loss as primary issue | MIT Technology Review 2025 |
| 44% attribute quality issues to context | Second Talent Statistics |
| 65% lose context during refactoring | Second Talent Statistics |

## Quality Research

### GitClear Code Quality (2025)

**Finding:** AI adoption correlates with maintainability concerns.

| Metric | Change (2021→2024) |
|--------|-------------------|
| Code cloning | 8.3% → 12.3% (4× growth) |
| Refactoring | 25% → <10% of changes |
| Code churn | Projected 2× increase |

**Source:** [GitClear](https://www.gitclear.com/ai_assistant_code_quality_2025_research)

## Implications for Practice

1. **Structure matters more than tool choice** — The productivity delta comes from how you use AI, not which AI
2. **Security requires explicit attention** — AI doesn't optimize for security unless constrained
3. **Context is the bottleneck** — Solving context loss is the highest-impact intervention
4. **Trust should be calibrated** — 46% distrust is rational given vulnerability rates

## Verification

All citations in this framework have been verified against primary sources. See [Research Citations](/RESEARCH-CITATIONS) for the full verification methodology.
