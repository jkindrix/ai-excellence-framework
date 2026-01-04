# Multi-Model Support Guide

This guide explains how to use the AI Excellence Framework with different AI coding assistants beyond Claude.

**Last Updated**: January 2026

---

## Overview

While this framework was originally designed for Claude, the principles and patterns apply universally. In December 2025, the [Agentic AI Foundation (AAIF)](https://www.linuxfoundation.org/press/linux-foundation-announces-the-formation-of-the-agentic-ai-foundation) was formed under the Linux Foundation, unifying standards from Anthropic, OpenAI, and others.

### Supported Standards

| Standard                 | Provider    | Adoption                                   | Framework Support   |
| ------------------------ | ----------- | ------------------------------------------ | ------------------- |
| **CLAUDE.md**            | Anthropic   | Claude Code, Claude Desktop                | Native              |
| **AGENTS.md**            | OpenAI/AAIF | 60,000+ repos, Cursor, Copilot, Gemini CLI | Generator available |
| **Cursor Rules**         | Cursor      | Cursor IDE                                 | Generator available |
| **Copilot Instructions** | GitHub      | GitHub Copilot                             | Generator available |
| **Windsurf Rules**       | Codeium     | Windsurf IDE                               | Generator available |

---

## AGENTS.md (OpenAI/AAIF Standard)

AGENTS.md is a [universal standard](https://agents.md/) for guiding AI coding agents, adopted by 60,000+ open-source projects since its August 2025 release.

### Generating AGENTS.md

```bash
# Generate AGENTS.md from your CLAUDE.md
npx ai-excellence-framework generate --tool agents

# Or during initialization
npx ai-excellence-framework init --generate agents
```

### AGENTS.md Structure

````markdown
# AGENTS.md

## Project Overview

Brief description of what this project does.

## Development Setup

```bash
npm install
npm run dev
```
````

## Testing

```bash
npm test
npm run test:coverage
```

## Code Style

- Use TypeScript strict mode
- Follow ESLint configuration
- Prefer functional patterns

## Architecture

Key architectural decisions and patterns.

## Common Tasks

### Adding a new feature

1. Create feature branch
2. Implement in src/
3. Add tests
4. Submit PR

## Constraints

- No eval() or dynamic code execution
- All API calls must be authenticated
- Follow OWASP security guidelines

```

### Hierarchical AGENTS.md

Like CLAUDE.md, AGENTS.md supports hierarchical placement:

```

repo/
├── AGENTS.md # Root-level defaults
├── packages/
│ ├── api/
│ │ └── AGENTS.md # API-specific instructions
│ └── web/
│ └── AGENTS.md # Web-specific instructions

````

Agents read the nearest file in the directory tree, with closer files taking precedence.

---

## Claude (Anthropic)

Claude uses CLAUDE.md files, which this framework natively supports.

### Best Practices for Claude

From [Anthropic's official guidance](https://www.anthropic.com/engineering/claude-code-best-practices):

1. **Keep CLAUDE.md under 200 lines** - Move details to subfolder files
2. **Use `/clear` often** - Prevents context drift
3. **Trigger extended thinking** with phrases like:
   - "think" → basic thinking
   - "think hard" → more computation
   - "think harder" → extensive analysis
   - "ultrathink" → maximum thinking budget

### Claude-Specific Features

```markdown
# CLAUDE.md

## Slash Commands
- `/plan` - Plan before implementing
- `/verify` - Skeptical verification
- `/review` - Multi-perspective code review

## Subagents
Use subagents for complex tasks to preserve context.
````

---

## Cursor IDE

Cursor uses `.cursorrules` or `.cursor/rules` for project-specific instructions.

### Generating Cursor Rules

```bash
npx ai-excellence-framework generate --tool cursor
```

### Cursor Rules Format

```markdown
# .cursorrules

You are an expert developer working on [project name].

## Tech Stack

- TypeScript with strict mode
- React 18 with hooks
- Node.js 20+

## Conventions

- Use functional components
- Prefer named exports
- Write tests for all new code

## Forbidden Patterns

- No `any` types
- No `eval()` or `Function()`
- No inline styles
```

### Cursor-Specific Tips

1. **Model Selection**: Claude is the default; consider it for complex tasks
2. **Composer Mode**: Use for multi-file changes
3. **Context Pinning**: Pin important files to maintain context

---

## GitHub Copilot

Copilot uses `.github/copilot-instructions.md` for repository-wide instructions.

### Generating Copilot Instructions

```bash
npx ai-excellence-framework generate --tool copilot
```

### Copilot Instructions Format

```markdown
# Copilot Instructions

## Project Context

This is a [description] built with [tech stack].

## Coding Standards

- Follow TypeScript strict mode
- Use ESLint and Prettier
- Write comprehensive tests

## Security Requirements

- Validate all user inputs
- Use parameterized queries
- Never log sensitive data

## Preferred Patterns

- Prefer `const` over `let`
- Use async/await over callbacks
- Favor composition over inheritance
```

---

## Gemini (Google)

Gemini CLI and Google AI Studio support project context files.

### Gemini-Specific Considerations

From [research on model quirks](https://eval.16x.engineer/blog/quirks-sota-models-claude-gemini-gpt4):

1. **Verbose by default**: Add "Be concise." as a standalone line
2. **Best value**: Excellent performance-to-cost ratio for coding tasks
3. **Context handling**: Good at multi-file understanding

### Gemini Prompt Tips

```markdown
Be concise.

## Project Context

[Your CLAUDE.md content adapted for Gemini]

## Instructions

- Minimize prose
- Show only changed code when editing
- Explain only when asked
```

---

## Windsurf IDE

Windsurf uses `.windsurfrules` for project instructions.

### Generating Windsurf Rules

```bash
npx ai-excellence-framework generate --tool windsurf
```

### Windsurf Rules Format

Similar to Cursor, Windsurf supports markdown-based rules:

```markdown
# .windsurfrules

## Project

[Project description]

## Stack

[Technologies]

## Guidelines

[Coding standards]
```

---

## Cross-Platform Configuration

### Generate All Formats

```bash
# Generate configurations for all supported tools
npx ai-excellence-framework generate --tool all

# This creates:
# - CLAUDE.md
# - AGENTS.md
# - .cursorrules
# - .github/copilot-instructions.md
# - .windsurfrules
```

### Keeping Files in Sync

Use a single source of truth (CLAUDE.md) and regenerate:

```bash
# After updating CLAUDE.md
npx ai-excellence-framework generate --tool all --force
```

Or add to your CI pipeline:

```yaml
# .github/workflows/sync-ai-configs.yml
name: Sync AI Configurations
on:
  push:
    paths:
      - 'CLAUDE.md'
jobs:
  sync:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npx ai-excellence-framework generate --tool all
      - uses: stefanzweifel/git-auto-commit-action@v5
        with:
          commit_message: 'chore: sync AI configuration files'
```

---

## Model-Specific Best Practices

### When to Use Each Model

| Task Type              | Best Model         | Reason                                |
| ---------------------- | ------------------ | ------------------------------------- |
| Complex refactoring    | Claude             | Best at understanding large codebases |
| Quick completions      | Copilot            | Fast, inline suggestions              |
| Cost-sensitive         | Gemini             | Best performance-to-cost ratio        |
| IDE integration        | Cursor/Claude      | Tight integration, context management |
| Open source compliance | Any with AGENTS.md | Universal standard                    |

### Model Behavior Quirks

| Model      | Quirk                | Mitigation                                |
| ---------- | -------------------- | ----------------------------------------- |
| Claude 4.x | Outputs entire files | Request only changes explicitly           |
| Gemini 2.5 | Very verbose         | Add "Be concise." on its own line         |
| GPT-4.x    | May miss context     | Pin important files, summarize context    |
| Copilot    | Eager completions    | Review carefully, disable when not coding |

---

## Universal Principles

These principles work across all AI coding assistants:

### 1. Provide Clear Context

All models benefit from:

- Project structure overview
- Tech stack information
- Coding conventions
- Current task context

### 2. Be Explicit About Constraints

```markdown
## NEVER

- Use eval() or Function()
- Hardcode credentials
- Skip input validation

## ALWAYS

- Write tests for new code
- Follow existing patterns
- Update documentation
```

### 3. Use Hierarchical Files

All major standards support directory-level overrides:

```
repo/
├── CLAUDE.md (or AGENTS.md)
├── packages/
│   ├── api/
│   │   └── CLAUDE.md     # API-specific
│   └── web/
│       └── CLAUDE.md     # Web-specific
```

### 4. Keep Instructions Concise

- **Recommended**: 100-200 lines for root file
- **Maximum**: 500 lines before splitting
- **Rule**: If you can't fit it, split it

### 5. Update After Decisions

Whenever you make an architectural decision:

1. Document it in your context file
2. Regenerate other formats if using sync

---

## Migration Guide

### From AGENTS.md to CLAUDE.md

```bash
# Read existing AGENTS.md and adapt
npx ai-excellence-framework init --from-agents
```

### From Cursor Rules to CLAUDE.md

```bash
# Import from .cursorrules
npx ai-excellence-framework init --from-cursor
```

### From CLAUDE.md to AGENTS.md

```bash
# Export to AGENTS.md format
npx ai-excellence-framework generate --tool agents
```

---

## Resources

### Standards & Specifications

- [AGENTS.md Specification](https://agents.md/)
- [AAIF (Agentic AI Foundation)](https://aaif.io/)
- [Anthropic Claude Best Practices](https://www.anthropic.com/engineering/claude-code-best-practices)

### Research & Comparisons

- [Model Quirks: Claude, Gemini, GPT-4](https://eval.16x.engineer/blog/quirks-sota-models-claude-gemini-gpt4)
- [AI Coding Tools Comparison 2025](https://morethanmonkeys.medium.com/best-ai-coding-assistants-in-2025-gpt-5-claude-4-gemini-and-more-compared-ee3b8e36c435)

### Tool Documentation

- [Cursor Documentation](https://cursor.sh/docs)
- [GitHub Copilot Documentation](https://docs.github.com/en/copilot)
- [Windsurf Documentation](https://codeium.com/windsurf)
- [Claude Code Documentation](https://docs.anthropic.com/claude-code)

---

## FAQ

### Q: Should I use CLAUDE.md or AGENTS.md?

**A:** Use CLAUDE.md if you primarily use Claude. Use AGENTS.md for maximum compatibility across tools. You can generate both from the same source.

### Q: Do instructions files affect model performance?

**A:** Yes. Clear, concise instructions improve output quality. The 65% context loss statistic applies across all models—good context files help all AI assistants.

### Q: How do I handle team members using different tools?

**A:** Generate all formats and commit them to your repository. Use CI/CD to keep them in sync.

### Q: Can I use different instructions for different branches?

**A:** Yes. Context files are version-controlled, so branch-specific instructions work naturally.

---

_Part of the AI Excellence Framework_
