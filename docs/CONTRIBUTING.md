# Contributing to AI Excellence Framework

Thank you for your interest in contributing! This document provides guidelines for contributing to the project.

## Code of Conduct

Be respectful, constructive, and inclusive. We're all here to make AI-assisted development better.

## How to Contribute

### Reporting Issues

1. Check existing issues first
2. Use the issue template
3. Include reproduction steps
4. Provide environment details

### Suggesting Enhancements

1. Open an issue with the "enhancement" label
2. Describe the use case
3. Explain why this would help others
4. Consider implementation approach

### Pull Requests

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests
5. Submit PR

## Development Setup

```bash
# Clone
git clone https://github.com/ai-excellence-framework/ai-excellence-framework.git
cd ai-excellence-framework

# Install dependencies
npm install

# Run tests
npm test

# Run all tests
npm run test:all

# Lint
npm run lint

# Format
npm run format
```

## Project Structure

```
.
├── bin/              # CLI entry point
├── src/              # Source code
│   ├── commands/     # CLI commands
│   ├── schemas/      # JSON schemas
│   └── utils/        # Utilities
├── templates/        # Template files
├── scripts/          # Hook scripts, MCP server
├── tests/            # Test files
├── docs/             # Documentation
└── .claude/          # Slash commands and agents
```

## Coding Standards

### JavaScript/TypeScript

- ES modules (import/export)
- Async/await for asynchronous code
- Descriptive variable names
- JSDoc for public functions

### Python

- Python 3.10+
- Type hints
- Black formatting
- Ruff linting

### Markdown

- Markdownlint rules
- ATX-style headings
- Fenced code blocks with language

### Commits

Use conventional commits:

```
feat: add new command
fix: resolve validation issue
docs: update README
test: add integration tests
refactor: simplify error handling
```

## Testing

### Running Tests

```bash
# Unit tests
npm test

# Integration tests
npm run test:integration

# E2E tests
npm run test:e2e

# MCP server tests
npm run test:mcp

# All tests
npm run test:all
```

### Writing Tests

- Use Node.js native test runner
- Test edge cases
- Mock external dependencies
- Include both positive and negative tests

## Documentation

### Adding Documentation

1. Follow existing structure
2. Include examples
3. Link to related pages
4. Verify all links work

### Research Citations

When adding research claims:

1. Find primary source
2. Verify claim accuracy
3. Add to RESEARCH-CITATIONS.md
4. Include verification date

## Review Process

1. All PRs require review
2. Tests must pass
3. Lint must pass
4. Documentation must be updated

## Release Process

1. Update version in package.json
2. Update CHANGELOG.md
3. Create release PR
4. Tag after merge
5. npm publish

## Getting Help

- Open an issue for questions
- Check existing documentation
- Review closed issues for similar problems

## Recognition

Contributors are recognized in:
- Git history
- README contributors section
- Release notes

Thank you for contributing!
