# Changelog

All notable changes to the AI Excellence Framework will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Planned

- VitePress documentation site deployment
- Real-world team usage metrics dashboard
- Interactive setup wizard
- VS Code extension

## [1.0.0] - 2026-01-01

### Initial Release

The AI Excellence Framework is a comprehensive, universal framework for reducing friction in AI-assisted software development. This initial release includes support for 25 AI coding tools, a full CLI, MCP server, and extensive documentation.

### Added

#### CLI Tool

- **8 commands** for framework management:
  - `init` - Interactive project initialization with 4 presets (minimal, standard, full, team)
  - `validate` - Configuration validation with auto-fix support
  - `doctor` - Environment health diagnostics with MCP checks
  - `update` - Framework update checker
  - `generate` - Multi-tool configuration generator
  - `lint` - Configuration file linting
  - `uninstall` - Clean framework removal
  - `detect` - Scan for configured AI tools
- JSON output mode for all commands (scriptable)
- Structured error system with 40+ error codes
- Full TypeScript type definitions

#### AI Tool Support (25 tools)

Universal configuration generation for:

| Tool | Configuration |
|------|---------------|
| Claude Code | `CLAUDE.md`, `.claude/` |
| Cursor IDE | `.cursor/`, `.cursorrules` |
| GitHub Copilot | `.github/copilot-instructions.md` |
| Windsurf IDE | `.windsurf/`, `.windsurfrules` |
| Aider CLI | `.aider.conf.yml` |
| AGENTS.md (AAIF) | `AGENTS.md` |
| Google Gemini CLI | `GEMINI.md` |
| OpenAI Codex | `.codex/` |
| Zed Editor | `.zed/`, `.rules` |
| Sourcegraph Amp | `.amp/`, `amp.toml` |
| Roo Code | `.roo/rules/` |
| JetBrains Junie | `.junie/guidelines.md` |
| Cline AI | `.cline/`, `.clinerules` |
| Block Goose | `.goose/` |
| Kiro CLI | `.kiro/` |
| Continue.dev | `.continue/` |
| Augment Code | `.augment/` |
| Qodo AI | `qodo.toml` |
| OpenCode AI | `opencode.json`, `.opencode/` |
| Zencoder | `.zencoder/` |
| Tabnine | `.tabnine/guidelines/` |
| Amazon Q Developer | `.amazonq/rules/` |
| Agent Skills | `.github/skills/` |
| Claude Plugins | `.claude-plugin/` |

#### Slash Commands (8 total)

- `/plan` - Create implementation plans before coding
- `/verify` - Skeptical completion verification with falsification
- `/handoff` - Generate session continuity summaries
- `/assumptions` - Surface hidden assumptions before implementation
- `/review` - Multi-perspective code review
- `/security-review` - OWASP-aligned security audit for AI code
- `/refactor` - Safe refactoring protocol with validation
- `/test-coverage` - Test coverage analysis and improvement

#### Subagents (3 total)

- `explorer` - Fast codebase exploration using Haiku model
- `reviewer` - Independent code review with fresh perspective
- `tester` - Test generation specialist

#### MCP Server

- SQLite-backed persistent project memory
- Full-text search for decisions
- Memory size limits with automatic cleanup
- Input validation and sanitization
- Export/import for backup and portability
- Health check endpoint
- Connection pooling for team deployments
- Rate limiting protection
- Thread-safe operations with WAL mode

#### Security Features

- Pre-commit hooks for secrets detection
- Dependency verification (slopsquatting prevention)
- CLAUDE.md validation hook
- Critical TODO detection
- OWASP Top 10 aligned security review
- Language-specific security patterns (Python, Go, Rust, JavaScript)

#### Git Hooks

- `post-edit.sh` - Auto-format after file edits
- `verify-deps.sh` - Validate dependencies exist
- `check-todos.sh` - Detect blocking TODOs
- `check-claude-md.sh` - Validate CLAUDE.md structure
- `check-ai-security.sh` - AI code security scanning

#### Shell Completions

- Bash completion (`completions/ai-excellence.bash`)
- Zsh completion (`completions/ai-excellence.zsh`)
- Fish completion (`completions/ai-excellence.fish`)

#### Documentation

- **Core Guides**:
  - Getting Started
  - Quick Reference
  - Troubleshooting
  - API Documentation
  - Migration Guide

- **Integration Guides**:
  - IDE Integration (VS Code, Cursor, JetBrains, Neovim)
  - SAST Integration (Semgrep, CodeQL, Bandit)
  - Metrics Visualization (Grafana, terminal, HTML)

- **Advanced Topics**:
  - MCP Security
  - MCP OAuth
  - MCP Tasks
  - MCP Registry
  - Team Memory Federation
  - Model Selection
  - Claude Agent SDK
  - AAIF (Agentic AI Foundation)
  - Enterprise Deployment

- **Research**:
  - When AI Helps (productivity research)
  - Benchmarks
  - Research Citations

- **VitePress Site**: Full documentation site with search, navigation, and versioning

#### Testing Infrastructure

- Node.js native test runner
- Unit tests for CLI commands
- Integration tests for workflows
- E2E tests for real CLI invocation
- Edge case tests for boundary conditions
- MCP server tests (pytest)
- Shell script tests
- 70% Node.js / 60% Python coverage thresholds

#### CI/CD Pipeline

- Multi-Node.js version matrix (18.x, 20.x, 22.x)
- Multi-Python version matrix (3.9-3.12)
- ESLint and Prettier enforcement
- ShellCheck for shell scripts
- CodeQL security scanning
- Semgrep OWASP rules
- SBOM generation (CycloneDX)
- Vulnerability scanning (OSV-Scanner)
- npm audit integration
- VitePress documentation builds

#### Programmatic API

Full programmatic access via ES modules:

```javascript
import {
  initCommand,
  validateCommand,
  doctorCommand,
  generateCommand,
  lintCommand,
  uninstall,
  detectCommand,
  detectTools,
  VERSION,
  SUPPORTED_TOOLS,
  PRESETS,
  // ... and more
} from 'ai-excellence-framework';
```

### Research Validation

All statistics and claims verified against authoritative sources:

- Veracode 2025 GenAI Code Security Report
- METR AI Productivity Study (July 2025)
- OWASP Gen AI Security Project
- Slopsquatting research (University of Texas, Virginia Tech, Oklahoma)
- Anthropic Claude Code Best Practices
- 2025 DORA Report
- Agentic AI Foundation (AAIF) standards

---

## Version Guidelines

This project follows [Semantic Versioning](https://semver.org/):

- **MAJOR** version for incompatible changes to:
  - CLAUDE.md required sections
  - Slash command interfaces
  - MCP server API
  - CLI command signatures

- **MINOR** version for backwards-compatible additions:
  - New AI tool generators
  - New slash commands
  - New subagents
  - New hooks
  - Enhanced documentation

- **PATCH** version for backwards-compatible fixes:
  - Bug fixes
  - Documentation corrections
  - Security patches
  - Performance improvements

[Unreleased]: https://github.com/ai-excellence-framework/ai-excellence-framework/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/ai-excellence-framework/ai-excellence-framework/releases/tag/v1.0.0
