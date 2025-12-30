# Changelog

All notable changes to the AI Excellence Framework will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Planned
- Real-world team usage metrics
- Additional language-specific security rules
- AI model version recommendations

## [1.1.0] - 2024-12-30

### Added

#### Documentation
- **IDE Integration Guide** (`docs/IDE-INTEGRATION.md`) - Complete setup for VS Code, Cursor, JetBrains, Neovim, Emacs
- **SAST Integration Guide** (`docs/SAST-INTEGRATION.md`) - Semgrep, CodeQL, Bandit setup with custom AI-code rules
- **Metrics Visualization Guide** (`docs/METRICS-VISUALIZATION.md`) - Dashboard setup for Grafana, terminal, HTML reports
- **Team Memory Federation Guide** (`docs/TEAM-MEMORY-FEDERATION.md`) - Multi-developer memory sharing patterns

#### CLI Enhancements
- **Structured Error System** (`src/errors.js`) - 40+ error codes with categories, suggestions, and documentation links
- **TypeScript Definitions** (`types/index.d.ts`) - Full type definitions for programmatic usage
- Error codes follow pattern `AIX-{CATEGORY}-{NUMBER}` for easy tracking
- Exit codes aligned with Unix conventions and sysexits.h

#### CI/CD Improvements
- **CodeQL Analysis** - Security scanning with extended queries
- **Semgrep Integration** - OWASP Top 10 and secrets detection
- **Coverage Thresholds** - 70% Node.js, 60% Python minimum coverage enforcement
- **Documentation Build** - Automated VitePress builds with artifact upload
- **Shellcheck** - Linting for all shell scripts
- **Package Verification** - Slopsquatting detection in CI

#### Configuration
- Updated VitePress configuration with all new documentation pages
- Sitemap generation for SEO
- Enhanced meta tags for social sharing

### Changed
- **Version bump** to 1.1.0
- **Package exports** now include error system and types
- **src/index.js** exports `COMMANDS`, `AGENTS`, `PRESET_CONFIGS`, and utility functions
- Enhanced preset configurations with metrics and federation options
- VitePress navigation updated with Guides dropdown

### Fixed
- CI pipeline now fails on critical validation errors (was continue-on-error)
- Proper exit codes for CLI commands based on error type

## [1.0.0] - 2024-12-30

### Added

#### Core Documentation
- `ai-development-friction.md` - 59 friction points across 17 categories, written from AI perspective
- `ai-friction-mitigations.md` - 40+ evidence-based mitigation strategies with research citations
- `ai-friction-implementation.md` - Complete implementation blueprints with copy-paste code
- `ai-friction-action-plan.md` - Strategic roadmap for framework adoption

#### CLI Tool
- `npx ai-excellence-framework init` - Interactive project initialization
- `npx ai-excellence-framework validate` - Configuration validation against schemas
- `npx ai-excellence-framework doctor` - Environment health diagnostics
- `npx ai-excellence-framework update` - Framework update checker
- Four configuration presets: minimal, standard, full, team

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
- Pre-commit hooks for secrets detection (Yelp detect-secrets)
- Dependency verification to prevent slopsquatting
- CLAUDE.md validation hook
- Critical TODO detection
- OWASP Top 10 aligned security review
- MCP Security documentation

#### Git Hooks
- `post-edit.sh` - Auto-format after file edits
- `verify-deps.sh` - Validate dependencies exist (slopsquatting prevention)
- `check-todos.sh` - Detect blocking TODOs
- `check-claude-md.sh` - Validate CLAUDE.md structure

#### Templates & Presets
- Minimal preset - CLAUDE.md + plan + verify only
- Standard preset - Recommended for individual developers
- Full preset - Complete feature set with MCP and metrics
- Team preset - Collaboration features and shared memory

#### Testing
- CLI unit tests using Node.js native test runner
- Integration tests for complete workflows
- Command tests for CLI functionality
- MCP server tests using pytest
- Performance benchmarks for MCP server
- Shell script validation tests
- Security pattern detection tests

#### CI/CD
- GitHub Actions workflow for testing
- Multi-Node.js version matrix (18.x, 20.x, 22.x)
- Multi-Python version matrix (3.9-3.12)
- Pre-commit hook validation
- Release automation workflow
- VitePress documentation site configuration

### Research Validation
All statistics and claims verified against authoritative sources:
- Veracode 2025 GenAI Code Security Report
- METR AI Productivity Study (July 2025)
- OWASP Gen AI Security Project
- Slopsquatting research (University of Texas, Virginia Tech, Oklahoma)
- Anthropic Claude Code Best Practices

## [0.1.0] - 2024-12-29

### Added
- Initial project structure
- Core documentation drafts
- Basic CLAUDE.md template

---

## Version Guidelines

This project follows [Semantic Versioning](https://semver.org/):

- **MAJOR** version for incompatible changes to:
  - CLAUDE.md required sections
  - Slash command interfaces
  - MCP server API
  - CLI command signatures

- **MINOR** version for backwards-compatible additions:
  - New slash commands
  - New subagents
  - New hooks
  - New presets
  - Enhanced documentation
  - New utility exports

- **PATCH** version for backwards-compatible fixes:
  - Bug fixes
  - Documentation corrections
  - Security patches
  - Performance improvements

## Migration Guides

### Upgrading from 1.0 to 1.1

1. **New Exports Available**: The framework now exports error handling utilities:
   ```javascript
   import { createError, FrameworkError, EXIT_CODES } from 'ai-excellence-framework';
   ```

2. **TypeScript Support**: Full type definitions available:
   ```typescript
   import type { InitOptions, ValidateResult } from 'ai-excellence-framework';
   ```

3. **CI Updates**: Consider adding the new security scanning workflows from `docs/SAST-INTEGRATION.md`

4. **IDE Configuration**: See `docs/IDE-INTEGRATION.md` for recommended workspace settings

### Upgrading from 0.x to 1.0

1. **CLAUDE.md Changes**: The required sections have been standardized. Run `npx ai-excellence-framework validate` to check compliance.

2. **Command Updates**: All slash commands now use the standardized output format. Existing custom commands will continue to work.

3. **MCP Server**: If you were using a custom memory server, the new server is backwards-compatible but adds new features.

[Unreleased]: https://github.com/ai-excellence-framework/ai-excellence-framework/compare/v1.1.0...HEAD
[1.1.0]: https://github.com/ai-excellence-framework/ai-excellence-framework/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/ai-excellence-framework/ai-excellence-framework/compare/v0.1.0...v1.0.0
[0.1.0]: https://github.com/ai-excellence-framework/ai-excellence-framework/releases/tag/v0.1.0
