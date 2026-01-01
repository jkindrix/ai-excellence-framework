# Contributing to AI Excellence Framework

Thank you for your interest in contributing to the AI Excellence Framework! This document provides guidelines and instructions for contributing.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [How to Contribute](#how-to-contribute)
- [Pull Request Process](#pull-request-process)
- [Coding Standards](#coding-standards)
- [Testing Guidelines](#testing-guidelines)
- [Documentation Guidelines](#documentation-guidelines)
- [Security Guidelines](#security-guidelines)
- [Release Process](#release-process)

## Code of Conduct

This project adheres to a Code of Conduct that all contributors are expected to follow. By participating, you agree to:

- **Be respectful**: Treat everyone with respect and consideration
- **Be constructive**: Provide helpful feedback and suggestions
- **Be inclusive**: Welcome contributors of all backgrounds and experience levels
- **Be patient**: Remember that maintainers are often volunteers

## Getting Started

### Prerequisites

- Node.js >= 18.0.0
- Python >= 3.9 (for MCP server development)
- Git
- npm or yarn

### Fork and Clone

1. Fork the repository on GitHub
2. Clone your fork locally:

```bash
git clone https://github.com/YOUR-USERNAME/ai-excellence-framework.git
cd ai-excellence-framework
```

3. Add the upstream remote:

```bash
git remote add upstream https://github.com/ai-excellence-framework/ai-excellence-framework.git
```

## Development Setup

### Install Dependencies

```bash
# Install Node.js dependencies
npm install

# Install Python dependencies for MCP server
pip install -r tests/mcp/requirements.txt

# Install pre-commit hooks
pip install pre-commit
pre-commit install
```

### Verify Setup

```bash
# Run all tests
npm run test:all

# Run linting
npm run lint

# Check formatting
npm run format:check

# Run the doctor command
node bin/cli.js doctor
```

## How to Contribute

### Types of Contributions

We welcome many types of contributions:

| Type                 | Description                    | Label           |
| -------------------- | ------------------------------ | --------------- |
| **Bug Reports**      | Report issues you've found     | `bug`           |
| **Feature Requests** | Suggest new features           | `enhancement`   |
| **Documentation**    | Improve or add documentation   | `documentation` |
| **Code**             | Fix bugs or implement features | `code`          |
| **Tests**            | Add or improve test coverage   | `testing`       |
| **Security**         | Report or fix security issues  | `security`      |

### Reporting Bugs

Before reporting a bug:

1. Search existing issues to avoid duplicates
2. Verify the bug with the latest version
3. Prepare a minimal reproduction

When reporting, include:

- Framework version (`npm list ai-excellence-framework`)
- Node.js version (`node --version`)
- Operating system
- Steps to reproduce
- Expected vs actual behavior
- Relevant logs or screenshots

### Suggesting Features

Feature requests should include:

- Clear description of the problem being solved
- Proposed solution
- Alternatives considered
- Impact on existing users

### Contributing Code

1. **Check existing issues** for similar work
2. **Open an issue first** for significant changes
3. **Follow the coding standards** below
4. **Add tests** for new functionality
5. **Update documentation** as needed

## Pull Request Process

### Before Submitting

- [ ] Code follows project style guidelines
- [ ] All tests pass (`npm run test:all`)
- [ ] Linting passes (`npm run lint`)
- [ ] Formatting is correct (`npm run format:check`)
- [ ] Documentation is updated
- [ ] CHANGELOG.md is updated (for user-facing changes)
- [ ] Commit messages follow conventional commits

### Submitting a PR

1. Create a feature branch:

```bash
git checkout -b feat/your-feature-name
```

2. Make your changes with clear commits:

```bash
git commit -m "feat: add new feature description"
```

3. Push to your fork:

```bash
git push origin feat/your-feature-name
```

4. Open a Pull Request with:
   - Clear title using conventional commit format
   - Description of changes
   - Link to related issue(s)
   - Screenshots if applicable

### PR Review Process

1. Automated checks run (CI, linting, tests)
2. Maintainer reviews code
3. Address feedback if needed
4. Maintainer approves and merges

### Commit Message Format

We use [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <description>

[optional body]

[optional footer(s)]
```

**Types:**

| Type       | Description                |
| ---------- | -------------------------- |
| `feat`     | New feature                |
| `fix`      | Bug fix                    |
| `docs`     | Documentation only         |
| `style`    | Formatting, no code change |
| `refactor` | Code restructuring         |
| `test`     | Adding/updating tests      |
| `chore`    | Maintenance tasks          |
| `perf`     | Performance improvement    |
| `ci`       | CI/CD changes              |
| `security` | Security improvements      |

**Examples:**

```
feat(cli): add --verbose flag to init command
fix(mcp): handle connection timeout gracefully
docs: add architecture diagram to README
test(cli): add E2E tests for validate command
```

## Coding Standards

### JavaScript/Node.js

- ESM modules (not CommonJS)
- ES2022+ features
- Strict mode implicit in ESM
- No `any` in JSDoc type annotations

**Style:**

```javascript
// Good: Named exports, async/await, clear naming
export async function initCommand(options) {
  const config = await loadConfig(options.preset);
  return processConfig(config);
}

// Avoid: Default exports, callbacks, unclear names
export default function (opts, cb) {
  loadCfg(opts.p, c => cb(null, proc(c)));
}
```

### Python

- Python 3.9+ features
- Type hints required
- PEP 8 style
- Docstrings for public functions

**Style:**

```python
# Good: Type hints, docstrings, context managers
def add_decision(
    self,
    decision: str,
    rationale: str,
    context: str = ""
) -> int:
    """Add a new decision to the database.

    Args:
        decision: The decision made
        rationale: Why this decision was made
        context: Optional context

    Returns:
        The ID of the new decision
    """
    with self._get_conn() as conn:
        cursor = conn.execute(...)
        return cursor.lastrowid
```

### Shell Scripts

- Bash with `#!/bin/bash` shebang
- `set -euo pipefail` at the top
- ShellCheck compliant
- Functions for reusable logic

**Style:**

```bash
#!/bin/bash
set -euo pipefail

# Description of script purpose
# Usage: ./script.sh [options]

main() {
    local arg="${1:-default}"
    validate_input "$arg"
    process "$arg"
}

validate_input() {
    local input="$1"
    [[ -n "$input" ]] || { echo "Error: empty input" >&2; exit 1; }
}

main "$@"
```

### Markdown

- One sentence per line (for better diffs)
- ATX-style headers (`#`, not underlines)
- Fenced code blocks with language tags
- Tables for structured data

## Testing Guidelines

### Test Structure

```
tests/
├── cli.test.js           # Unit tests for CLI
├── commands.test.js      # Command-specific tests
├── integration.test.js   # Cross-component tests
├── edge-cases.test.js    # Boundary conditions
├── e2e.test.js           # End-to-end tests
├── scripts.test.sh       # Shell script tests
└── mcp/
    ├── test_project_memory_server.py  # MCP unit tests
    └── test_performance.py            # Load tests
```

### Writing Tests

**Node.js (using native test runner):**

```javascript
import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';

describe('Feature', () => {
  beforeEach(() => {
    // Setup
  });

  afterEach(() => {
    // Cleanup
  });

  it('should do expected behavior', () => {
    const result = featureFunction();
    assert.strictEqual(result, expected);
  });
});
```

**Python (using pytest):**

```python
import pytest

class TestFeature:
    @pytest.fixture
    def setup(self):
        # Setup code
        yield
        # Cleanup code

    def test_expected_behavior(self, setup):
        result = feature_function()
        assert result == expected
```

### Test Coverage

- Aim for >80% coverage on new code
- Critical paths must have 100% coverage
- Include positive and negative test cases
- Test edge cases and error conditions

### Running Tests

```bash
# All tests
npm run test:all

# Specific test suites
npm test                    # CLI unit tests
npm run test:integration    # Integration tests
npm run test:e2e            # End-to-end tests
npm run test:mcp            # MCP server tests
npm run test:scripts        # Shell script tests

# With coverage
npm run test:coverage
```

## Documentation Guidelines

### Structure

```
docs/
├── index.md              # Main documentation page
├── QUICK-REFERENCE.md    # One-page quick start
├── ARCHITECTURE.md       # System architecture
├── TROUBLESHOOTING.md    # Common issues
└── guides/
    ├── getting-started.md
    └── advanced-usage.md
```

### Writing Style

- Use second person ("you" not "we")
- Active voice preferred
- Include code examples
- Provide context before instructions
- Add TL;DR for long documents

### Updating Documentation

When your PR includes:

- **New feature**: Add usage documentation
- **API change**: Update API reference
- **Bug fix**: Check if docs need correction
- **Breaking change**: Add migration guide

## Security Guidelines

### Reporting Security Issues

**Do NOT open public issues for security vulnerabilities.**

Instead:

1. Email security concerns to the maintainers
2. Include detailed reproduction steps
3. Allow 90 days for fix before disclosure

### Security Requirements for Contributions

All contributions must:

- [ ] Not introduce hardcoded secrets
- [ ] Validate and sanitize user input
- [ ] Use parameterized queries (no string concatenation)
- [ ] Handle errors without exposing internals
- [ ] Pass security linting (detect-secrets, etc.)

### Dependency Guidelines

- Prefer well-maintained packages
- Check for known vulnerabilities before adding
- Document why each dependency is needed
- Keep dependencies updated

## Release Process

Releases are managed by maintainers following semantic versioning:

- **MAJOR** (x.0.0): Breaking changes
- **MINOR** (0.x.0): New features, backward compatible
- **PATCH** (0.0.x): Bug fixes, backward compatible

### Changelog

Update `CHANGELOG.md` for user-facing changes:

```markdown
## [X.Y.Z] - YYYY-MM-DD

### Added

- New feature description (#123)

### Fixed

- Bug fix description (#124)

### Changed

- Improved error messages for validation failures
```

## Questions?

- **General questions**: Open a Discussion on GitHub
- **Bug reports**: Open an Issue
- **Security issues**: Email maintainers directly

Thank you for contributing to the AI Excellence Framework!
