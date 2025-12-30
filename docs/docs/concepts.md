# Core Concepts

## The Five Critical Friction Points

Understanding these friction points is essential to using this framework effectively.

### 1. Session Boundary Amnesia

**What it is**: AI assistants forget everything between sessions. All context, decisions, learned preferences—gone.

**Why it matters**: You spend time re-explaining context every session. Previous decisions get revisited. Understanding doesn't accumulate.

**Mitigation**: `CLAUDE.md` provides persistent context that loads automatically each session.

### 2. First-Framing Lock

**What it is**: The AI's initial interpretation of your request heavily constrains all subsequent work.

**Why it matters**: If the AI misunderstands in the first moment, it builds an elaborate, internally consistent response on that misunderstanding.

**Mitigation**: `/plan` forces explicit assumptions before implementation.

### 3. Coherence Illusion

**What it is**: AI responses read as unified reasoning, but earlier output constrains later output. The appearance of coherence can mask fundamental errors.

**Why it matters**: You see a coherent argument. What actually happened: sequential generation where early choices constrained later choices.

**Mitigation**: `/verify` with falsification attempts to prove work is NOT complete.

### 4. Hallucination Gradient

**What it is**: The farther from common patterns, the more likely the AI invents plausible-sounding but wrong solutions.

**Why it matters**: Confidence doesn't track accuracy. The AI can't reliably detect when it's hallucinating.

**Mitigation**: Pre-commit hooks validate dependencies exist; security review catches vulnerabilities.

### 5. Context Attention Decay

**What it is**: Information loses specificity as more context is loaded. Recent information dominates.

**Why it matters**: Constraints established early may be forgotten or contradicted by later context.

**Mitigation**: Keep CLAUDE.md focused (<300 lines); use session handoffs for continuity.

## Key Patterns

### CLAUDE.md Pattern

A project context file that loads automatically:

```markdown
# Project Name

## Tech Stack
- TypeScript 5.0
- Node.js 20

## Architecture
src/
  components/  # React components
  services/    # Business logic

## Commands
npm run build   # Build project
npm test        # Run tests
```

**Best practices** ([HumanLayer](https://www.humanlayer.dev/blog/writing-a-good-claude-md)):
- Keep under 300 lines (shorter is better)
- Use pointers, not copies (file references, not inline code)
- Focus on universally applicable instructions
- Include a "Do Not" section for restrictions

### Plan-Before-Code Pattern

```
/plan [task description]
```

Forces the AI to:
1. Restate understanding
2. List assumptions explicitly
3. Identify questions before coding
4. Define verification criteria

### Verify-Before-Complete Pattern

```
/verify [what was done]
```

The AI adopts a skeptical mindset:
1. Enumerate claims
2. Manually inspect files
3. Attempt falsification (try to prove it's NOT complete)
4. Report findings honestly

### Session Handoff Pattern

Before ending work:
```
/handoff
```

Creates structured notes for the next session covering:
- What was accomplished
- What's in progress
- Decisions made and why
- Blockers encountered

## Next Steps

- [Understanding Friction](/docs/friction/) - Deep dive into all 59 friction points
- [Getting Started](/getting-started) - Install the framework
