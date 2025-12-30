# Changelog

All notable changes to the AI Excellence Framework will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Planned

- Real-world team usage metrics
- Additional language-specific security rules
- AI model version recommendations

## [1.3.0] - 2024-12-30

### Added

#### Documentation

- **CONTRIBUTING.md** - Comprehensive contribution guidelines
  - Code of conduct, development setup, PR process
  - Coding standards for JavaScript, Python, and Shell
  - Testing and documentation guidelines
  - Security and release process documentation
- **Architecture Documentation** (`docs/ARCHITECTURE.md`)
  - System overview with ASCII diagrams
  - Component architecture (Context, Command, Agent, Persistence layers)
  - Data flow diagrams (session start, command execution, commit flow)
  - Security architecture with input validation chain
  - Extension points and performance considerations
- **Session Notes Examples** (`docs/session-notes/`)
  - Example session handoff document
  - Session notes README with templates
- **MCP Authentication Documentation** - Enhanced security guide
  - API key authentication with client configuration
  - Multi-user authentication options (shared key, reverse proxy, OAuth2)
  - Role-based access control (RBAC) future roadmap
  - IP allowlist configuration

#### Testing

- **E2E Tests** (`tests/e2e.test.js`) - Real CLI invocation tests
  - CLI binary invocation (version, help, command-specific help)
  - Init command with all presets
  - Validate command with fix mode
  - Doctor command diagnostics
  - Configuration file validation
  - File permissions verification
  - Error handling edge cases
  - Programmatic API exports
- **Input Validation Utilities** (`src/utils/validation.js`)
  - Path validation with traversal prevention
  - Preset and project name validation
  - Configuration object validation
  - String sanitization with HTML escaping
  - Secret detection patterns

#### CI/CD Enhancements

- **SBOM Generation** - CycloneDX format for supply chain transparency
- **Vulnerability Scanning** - OSV-Scanner and npm audit integration
- **ShellCheck Strict Mode** - Enforced shell script linting
- **CVE Detection** - Automatic detection of critical vulnerabilities

#### Programmatic API

- **Extended exports in `src/index.js`**
  - `checkInstallation()` - Check framework installation status
  - `listInstalledCommands()` - Get installed slash commands
  - `listInstalledAgents()` - Get installed agents
  - `readClaudeMd()` / `parseClaudeMd()` - Parse CLAUDE.md files
  - `detectSecrets()` - Check content for secrets
  - `validateClaudeMdStructure()` - Validate CLAUDE.md structure
  - `getPackageRoot()` / `getPresetPath()` - Get framework paths

### Fixed

- **CLI Exit Codes** - Fixed `--version` and `--help` returning non-zero exit codes
- **E2E Test ESM Compatibility** - Replaced `require()` with ESM imports

### Changed

- **VitePress Navigation** - Added Architecture and Contributing sections
- **CI Pipeline** - Added SBOM and vulnerability-scan jobs to final status check

## [1.2.0] - 2024-12-30

### Added

#### Documentation

- **When AI Helps Guide** (`docs/WHEN-AI-HELPS.md`) - Balanced perspective on when AI coding assistants provide value
  - Research-backed guidance: junior devs see 27-39% gains, senior devs 7-16%
  - Decision matrix for when to use vs. skip AI assistance
  - Integration with METR study and MIT/NBER research
- **Research Citations Enhancement** - Added 10+ new verified statistics from 2025 sources
  - Apiiro Fortune 50 study (322% privilege escalation, 153% design flaws)
  - JetBrains State of Developer Ecosystem 2025
  - Accenture/GitHub Copilot enterprise study
  - MIT/NBER productivity research
- **OWASP LLM Top 10 2025 Alignment** - Added to MCP-SECURITY.md
  - Mapped framework mitigations to all 10 risks
  - Added Agentic AI security considerations

#### Testing

- **Edge Case Tests** (`tests/edge-cases.test.js`) - Comprehensive boundary testing
  - Malformed input handling (whitespace, binary, long lines, unicode)
  - Path edge cases (spaces, unicode, deep nesting, symlinks)
  - Security pattern detection (15+ secret patterns)
  - Package name validation (npm naming rules)
  - YAML frontmatter parsing
  - Semver validation
  - Error code format validation
  - Concurrent file access
  - File encoding handling (BOM, mixed line endings)

#### CI/CD

- **Enhanced Release Workflow** - Complete npm publishing automation
  - Pre-release test job with full test suite
  - Version tag validation against package.json
  - npm provenance for supply chain security
  - Dry-run support for testing releases
  - Automated changelog generation for releases

### Changed

- **Version bump** to 1.2.0
- **Research Citations** - Corrected 322% privilege escalation source to Apiiro (was incorrectly attributed to Veracode)
- **Security Review Command** - Updated citation for privilege escalation statistic
- **VitePress Navigation** - Added "When AI Helps" to guides dropdown and sidebar

### Fixed

- Citation accuracy for privilege escalation statistic (Apiiro, not Veracode)
- Java AI code failure rate corrected to 72% (was 70%+)

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
   import {
     createError,
     FrameworkError,
     EXIT_CODES,
   } from "ai-excellence-framework";
   ```

2. **TypeScript Support**: Full type definitions available:

   ```typescript
   import type { InitOptions, ValidateResult } from "ai-excellence-framework";
   ```

3. **CI Updates**: Consider adding the new security scanning workflows from `docs/SAST-INTEGRATION.md`

4. **IDE Configuration**: See `docs/IDE-INTEGRATION.md` for recommended workspace settings

### Upgrading from 0.x to 1.0

1. **CLAUDE.md Changes**: The required sections have been standardized. Run `npx ai-excellence-framework validate` to check compliance.

2. **Command Updates**: All slash commands now use the standardized output format. Existing custom commands will continue to work.

3. **MCP Server**: If you were using a custom memory server, the new server is backwards-compatible but adds new features.

[Unreleased]: https://github.com/ai-excellence-framework/ai-excellence-framework/compare/v1.2.0...HEAD
[1.2.0]: https://github.com/ai-excellence-framework/ai-excellence-framework/compare/v1.1.0...v1.2.0
[1.1.0]: https://github.com/ai-excellence-framework/ai-excellence-framework/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/ai-excellence-framework/ai-excellence-framework/compare/v0.1.0...v1.0.0
[0.1.0]: https://github.com/ai-excellence-framework/ai-excellence-framework/releases/tag/v0.1.0
