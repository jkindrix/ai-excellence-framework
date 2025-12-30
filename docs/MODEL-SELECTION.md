# Model Selection Guide

Choosing the right Claude model for different tasks maximizes quality while minimizing cost and latency.

## Quick Reference

| Task Type | Recommended Model | Why |
|-----------|------------------|-----|
| Daily coding, bug fixes | **Sonnet 4.5** | Best balance of speed/quality |
| Quick scaffolding, small fixes | **Haiku 4.5** | 3x faster, 90% of Sonnet quality |
| Complex architecture, deep review | **Opus 4.5** | Catches subtle issues others miss |
| High-volume batch processing | **Haiku 4.5** | 3x cost savings |
| Final review before merge | **Opus 4.5** | Thorough analysis worth the cost |

## Model Characteristics

### Haiku 4.5 — The Speed Demon

**Best for:**
- Quick iterations and rapid feedback
- UI scaffolding and boilerplate generation
- Simple bug fixes
- Chat assistants and worker agents
- High-frequency, low-complexity tasks

**Characteristics:**
- Fastest response time (~2x faster than Sonnet)
- 90% of Sonnet's coding capability
- 3x more cost-effective than Sonnet
- Ideal for multi-agent systems where speed matters

**When to use in this framework:**
- Running parallel exploration tasks
- Quick `/plan` iterations
- Simple validation checks
- Subagent worker tasks

**API Pricing:** $1/$5 per million tokens (input/output)

---

### Sonnet 4.5 — The All-Rounder

**Best for:**
- Daily coding tasks
- Writing and refactoring code
- Bug fixes and debugging
- Writing tests and documentation
- Code reviews and explanations
- Managing state and connecting APIs

**Characteristics:**
- Best balance of intelligence, speed, and cost
- "Best coding model in the world" per Anthropic
- Reliable and consistent
- Handles multiple files well
- Doesn't freeze on complex contexts

**When to use in this framework:**
- Default for most `/plan` and `/verify` operations
- Code generation and refactoring
- Most subagent tasks (reviewer, tester)
- Session work and implementation

**API Pricing:** $3/$15 per million tokens (input/output)

---

### Opus 4.5 — The Deep Thinker

**Best for:**
- Complex architectural decisions
- Large-scale refactoring across many files
- Final pre-merge reviews
- Catching async bugs, memory leaks, subtle logic errors
- Full codebase analysis
- Enterprise R&D and research tasks

**Characteristics:**
- Highest capability, most thorough
- Extended reasoning capability
- SWE-bench Verified leader
- Catches issues other models miss
- Slower but worth it for high-stakes work

**When to use in this framework:**
- `/security-review` on critical code
- Final `/verify` before major releases
- Complex `/refactor` operations
- Architecture design decisions

**API Pricing:** $15/$75 per million tokens (input/output)

---

## Recommended Workflows

### Standard Development Flow

```
1. Planning Phase → Sonnet 4.5
   - Understand requirements
   - Design architecture
   - Break down tasks

2. Implementation Phase → Sonnet 4.5 (default) or Haiku 4.5 (simple tasks)
   - Write code
   - Fix bugs
   - Run tests

3. Review Phase → Opus 4.5
   - Final deep review
   - Security analysis
   - Architecture validation
```

### High-Velocity Development

```
1. Parallel Implementation → Multiple Haiku 4.5 instances
   - One for frontend
   - One for backend
   - One for tests

2. Integration Review → Sonnet 4.5
   - Verify connections work
   - Check consistency

3. Final Check → Opus 4.5
   - Comprehensive review
```

### Cost-Optimized Workflow

```
Most tasks      → Haiku 4.5 (70% of work)
Complex logic   → Sonnet 4.5 (25% of work)
Critical review → Opus 4.5 (5% of work)

Result: ~60% cost savings vs all-Sonnet
```

## Configuring Models in Claude Code

### Setting Default Model

```bash
# In Claude Code, use /model to switch
/model sonnet  # or haiku, opus
```

### In Subagent Definitions

When defining subagents, specify model in the configuration:

```yaml
# .claude/agents/explorer.md
---
model: haiku  # Fast exploration
---
```

```yaml
# .claude/agents/reviewer.md
---
model: sonnet  # Balanced review
---
```

### Task Tool Model Selection

When spawning agents programmatically:

```javascript
// For quick tasks
Task({
  prompt: "Find all TypeScript files",
  subagent_type: "Explore",
  model: "haiku"  // Fast and cheap
});

// For critical reviews
Task({
  prompt: "Deep security analysis",
  subagent_type: "general-purpose",
  model: "opus"  // Thorough analysis
});
```

## Decision Matrix

| Factor | Haiku | Sonnet | Opus |
|--------|-------|--------|------|
| Speed | ⭐⭐⭐ | ⭐⭐ | ⭐ |
| Cost | ⭐⭐⭐ | ⭐⭐ | ⭐ |
| Code Quality | ⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ |
| Complex Reasoning | ⭐ | ⭐⭐ | ⭐⭐⭐ |
| Architecture | ⭐ | ⭐⭐ | ⭐⭐⭐ |
| Security Analysis | ⭐ | ⭐⭐ | ⭐⭐⭐ |

## Common Mistakes

### ❌ Using Opus for Everything
- Expensive (5x Sonnet, 15x Haiku)
- Slower responses
- Not necessary for most tasks

### ❌ Using Haiku for Complex Architecture
- May miss subtle issues
- Insufficient for large-scale reasoning
- Save time now, debug later

### ❌ Not Matching Model to Task
- Wasted cost on simple tasks
- Insufficient quality on complex tasks

### ✅ Right Approach
- Default to Sonnet for most work
- Use Haiku for speed/cost-sensitive tasks
- Reserve Opus for final reviews and complex decisions

## Sources

- [Anthropic Models Overview](https://platform.claude.com/docs/en/about-claude/models/overview)
- [Claude Code Model Configuration](https://support.claude.com/en/articles/11940350-claude-code-model-configuration)
- [Model Comparison Analysis](https://medium.com/@ayaanhaider.dev/sonnet-4-5-vs-haiku-4-5-vs-opus-4-1-which-claude-model-actually-works-best-in-real-projects-7183c0dc2249)
- [Anthropic Claude Models Guide](https://www.codegpt.co/blog/anthropic-claude-models-complete-guide)
