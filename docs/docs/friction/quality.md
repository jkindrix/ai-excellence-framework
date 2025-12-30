# Quality Degradation Friction

AI-generated code can degrade codebase quality over time. This isn't about individual snippets being bad—it's about cumulative effects.

## The Quality Problem

| Issue | Trend | Source |
|-------|-------|--------|
| Code cloning | 4× increase (2021→2024) | [GitClear](https://www.gitclear.com/ai_assistant_code_quality_2025_research) |
| Refactoring | Down from 25% to <10% | GitClear |
| Bug rate with AI | 41% increase | [GitHub Copilot Statistics](https://www.secondtalent.com/resources/github-copilot-statistics/) |
| Code churn | Projected 2× by 2024 | GitClear |

## Why Quality Degrades

### 1. Copy-Paste Culture

AI makes it easy to generate code, reducing incentive to understand or refactor existing code:
- Easier to generate new than modify old
- Duplication increases (8.3% → 12.3% of lines)
- Technical debt accumulates faster

### 2. Inconsistency with Codebase

AI doesn't inherently understand your team's patterns:
- 40% of developers report inconsistency with team standards
- Style drift across files
- Architectural violations

### 3. Superficial Understanding

AI optimizes for "correct output" not "deep understanding":
- Solutions that work but don't fit the system
- Missing edge cases that experience would catch
- Brittle code that breaks under real-world conditions

### 4. Reduced Learning

When AI generates code, developers may learn less:
- Pattern recognition without comprehension
- Debugging skills atrophy
- Architectural intuition doesn't develop

## The Maintainability Cost

Code quality issues compound:

```
Year 1: AI generates fast, working code
Year 2: Modifications are difficult, context lost
Year 3: Major refactoring needed
Year 4: Rewrite considered
```

Research shows code churn (adding then removing code) has increased significantly with AI adoption.

## Mitigations

### Team Conventions in CLAUDE.md (Impact: 4/5)

```markdown
## Code Conventions

### Architecture
- Use repository pattern for data access
- Services contain business logic only
- Controllers are thin (validation + delegation)

### Style
- Prefer composition over inheritance
- Maximum function length: 50 lines
- Maximum file length: 300 lines

### Do Not
- Do not use any/unknown types
- Do not duplicate existing utilities
- Do not bypass the service layer
```

### /review Command (Impact: 4/5)

Multi-perspective code review:

```
/review [file or PR]
```

Checks for:
- Architecture alignment
- Code duplication
- Maintainability issues
- Consistency with codebase patterns

### /refactor Command (Impact: 4/5)

Safe refactoring protocol:

```
/refactor [target]
```

1. Analyze current structure
2. Propose improvements
3. Check for breaking changes
4. Execute with tests

### Pre-commit Quality Hooks (Impact: 3/5)

```yaml
repos:
  - repo: https://github.com/pre-commit/pre-commit-hooks
    hooks:
      - id: check-added-large-files
      - id: check-merge-conflict

  - repo: local
    hooks:
      - id: lint
        name: Run linter
        entry: npm run lint
        language: system
```

### /test-coverage Command (Impact: 4/5)

Identifies untested code paths:

```
/test-coverage [module]
```

Ensures AI-generated code has test coverage before merge.

## Evidence

| Source | Key Finding |
|--------|-------------|
| [GitClear](https://www.gitclear.com/ai_assistant_code_quality_2025_research) | 4× increase in code cloning with AI |
| [Uplevel Data Labs](https://visualstudiomagazine.com/articles/2024/09/17/another-report-weighs-in-on-github-copilot-dev-productivity.aspx) | Higher bug rate with Copilot access |
| [Second Talent](https://www.secondtalent.com/resources/ai-coding-assistant-statistics/) | 40% inconsistency with team standards |

## Key Insight

Quality degradation isn't about AI being "bad" at coding. It's about:
1. Reduced friction for generating code
2. Increased friction for maintaining code
3. Cumulative effects over time

The framework addresses this by adding lightweight quality gates without slowing down generation.
