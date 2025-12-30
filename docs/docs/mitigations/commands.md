# Slash Commands

Slash commands are structured prompts that guide AI behavior for specific workflows. This framework includes 8 commands addressing common friction points.

## Available Commands

| Command | Purpose | Addresses |
|---------|---------|-----------|
| `/plan` | Structured planning before coding | First-framing lock |
| `/verify` | Skeptical completion validation | Overconfidence |
| `/handoff` | Session continuity notes | Session boundary |
| `/assumptions` | Surface hidden assumptions | Coherence illusion |
| `/review` | Multi-perspective code review | Quality degradation |
| `/security-review` | OWASP-aligned security audit | Security vulnerabilities |
| `/refactor` | Safe refactoring protocol | Technical debt |
| `/test-coverage` | Test gap analysis | Quality assurance |

## Core Commands

### /plan

**Purpose:** Catch misframing before implementation begins.

```
/plan add user authentication
```

**Output structure:**
1. Restates understanding
2. Lists assumptions explicitly
3. Identifies questions
4. Proposes approach
5. Defines verification criteria

**Why it works:** Forces early explicit communication before the AI commits to an approach.

### /verify

**Purpose:** Skeptical validation that attempts to prove work is NOT complete.

```
/verify the authentication feature
```

**Process:**
1. Enumerate all claims
2. Manually inspect files
3. Check functional tests
4. Analyze edge cases
5. Attempt falsification

**Why it works:** Reverses the default "looks good" bias with deliberate skepticism.

### /handoff

**Purpose:** Generate structured notes for session continuity.

```
/handoff
```

**Output includes:**
- What was accomplished
- What's in progress
- Decisions made and rationale
- Blockers encountered
- For next session

**Why it works:** Makes implicit session state explicit and persistent.

## Quality Commands

### /review

Multi-perspective code review covering:
- Architecture alignment
- Performance implications
- Maintainability
- Consistency with codebase

### /security-review

OWASP Top 10 aligned security audit:
- Input validation
- Output encoding
- Authentication/authorization
- AI-specific vulnerabilities

### /refactor

Safe refactoring with:
- Current structure analysis
- Improvement proposals
- Breaking change detection
- Test coverage verification

### /test-coverage

Test gap analysis:
- Uncovered code paths
- Edge cases
- Integration points
- Suggested test cases

## Installation

Commands live in `.claude/commands/`:

```
.claude/
└── commands/
    ├── plan.md
    ├── verify.md
    ├── handoff.md
    ├── assumptions.md
    ├── review.md
    ├── security-review.md
    ├── refactor.md
    └── test-coverage.md
```

Install with the CLI:

```bash
npx ai-excellence-framework init --preset standard
```

Or copy individual commands:

```bash
mkdir -p .claude/commands
curl -o .claude/commands/plan.md \
  https://raw.githubusercontent.com/ai-excellence-framework/ai-excellence-framework/main/.claude/commands/plan.md
```

## Command Structure

Each command uses YAML frontmatter:

```markdown
---
description: Create implementation plan before coding
---

# Plan Mode

Before implementing anything, create a structured plan.

## Instructions
1. Clarify understanding
2. Research phase
3. Design approach
4. Verification criteria

## Output Format
[structured template]

User request: $ARGUMENTS
```

## Custom Commands

Create project-specific commands in `.claude/commands/`:

```markdown
---
description: Run our specific deployment process
---

# Deploy Protocol

Follow these steps for deployment:

1. Run tests: `npm test`
2. Build: `npm run build`
3. Deploy: `npm run deploy:$ARGUMENTS`
4. Verify: Check health endpoint
```

Available as `/project:deploy production`.

## Personal Commands

Add to `~/.claude/commands/` for commands in all sessions:

```markdown
---
description: My personal code style preferences
---

# My Style

Apply these preferences:
- Prefer early returns
- Use descriptive variable names
- Add comments for complex logic
```

## Evidence

| Source | Finding |
|--------|---------|
| [METR Study](https://metr.org/blog/2025-07-10-early-2025-ai-experienced-os-dev-study/) | Unplanned AI use = 19% slower |
| [Veracode](https://www.veracode.com/blog/genai-code-security-report/) | 45% of AI code has vulnerabilities |
| [Anthropic](https://www.anthropic.com/engineering/claude-code-best-practices) | Plan mode recommended workflow |

## Next Steps

- See [individual command documentation](/commands/) for detailed usage
- Learn about [subagents](/docs/mitigations/agents) for specialized workflows
