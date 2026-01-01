# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-01-01

### Initial Release

The AI Excellence Framework is a comprehensive, universal framework for reducing friction in AI-assisted software development.

### Highlights

- **25 AI Tool Support**: Generate configurations for Claude, Cursor, Copilot, Windsurf, Aider, and 20 more tools
- **8 Slash Commands**: /plan, /verify, /handoff, /assumptions, /review, /security-review, /refactor, /test-coverage
- **3 Subagents**: Explorer, Reviewer, Tester
- **MCP Server**: SQLite-backed persistent project memory with full-text search
- **CLI Tool**: 8 commands for framework management (init, validate, doctor, update, generate, lint, uninstall, detect)
- **Security Features**: Pre-commit hooks, slopsquatting prevention, OWASP-aligned reviews
- **Shell Completions**: Bash, Zsh, Fish
- **TypeScript Types**: Full type definitions for programmatic API

### Multi-Tool Support

| Tool | Configuration |
|------|---------------|
| Claude Code | `CLAUDE.md`, `.claude/` |
| Cursor IDE | `.cursor/`, `.cursorrules` |
| GitHub Copilot | `.github/copilot-instructions.md` |
| Windsurf IDE | `.windsurf/`, `.windsurfrules` |
| Aider CLI | `.aider.conf.yml` |
| AGENTS.md (AAIF) | `AGENTS.md` |
| And 19 more... | See documentation |

### Getting Started

```bash
# Install
npm install ai-excellence-framework

# Initialize
npx ai-excellence init --preset standard

# Generate tool configs
npx ai-excellence generate --tools all
```

### Documentation

- [Getting Started Guide](/getting-started)
- [Quick Reference](/QUICK-REFERENCE)
- [API Documentation](/API)

---

For the complete changelog with technical details, see [CHANGELOG.md](https://github.com/ai-excellence-framework/ai-excellence-framework/blob/main/CHANGELOG.md).
