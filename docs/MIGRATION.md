# Migration Guide

Upgrade paths and breaking change documentation for AI Excellence Framework.

## Current Version: 1.0.0

This is the initial release of the AI Excellence Framework. Future versions will include migration guides here.

## Installing 1.0.0

```bash
# Install the framework
npm install ai-excellence-framework

# Initialize in your project
npx ai-excellence init --preset standard

# Verify installation
npx ai-excellence doctor
```

## Presets

Choose your configuration level:

| Preset | Use Case | Features |
|--------|----------|----------|
| `minimal` | Quick start | CLAUDE.md + /plan + /verify |
| `standard` | Individual devs | All commands + agents + hooks |
| `full` | Complete setup | + MCP server + metrics |
| `team` | Team collaboration | + memory federation |

```bash
# Examples
npx ai-excellence init --preset minimal
npx ai-excellence init --preset standard
npx ai-excellence init --preset full
npx ai-excellence init --preset team
```

## Generating Tool Configurations

Generate configurations for your AI coding tools:

```bash
# Generate for all 25 supported tools
npx ai-excellence generate --tools all

# Generate for specific tools
npx ai-excellence generate --tools cursor,copilot,windsurf

# Preview without writing files
npx ai-excellence generate --tools all --dry-run
```

## Validating Your Setup

```bash
# Check configuration
npx ai-excellence validate

# Auto-fix issues
npx ai-excellence validate --fix

# Detailed health check
npx ai-excellence doctor --verbose
```

---

## Future Migrations

When new versions are released, migration guides will be added here with:

- Breaking changes
- Step-by-step upgrade instructions
- Configuration format changes
- Deprecation notices

## Getting Help

- [Troubleshooting Guide](./TROUBLESHOOTING.md)
- [GitHub Issues](https://github.com/ai-excellence-framework/ai-excellence-framework/issues)
- [Documentation](https://ai-excellence-framework.github.io/)
