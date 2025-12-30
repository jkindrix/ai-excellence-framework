# AI Excellence Framework Templates

Quick-start templates for different project needs. Use degit or direct copy.

## Quick Start with degit

```bash
# Install degit globally (one time)
npm install -g degit

# Clone a preset directly into your project
degit ai-excellence-framework/templates/presets/standard .

# Or use npx without global install
npx degit ai-excellence-framework/templates/presets/standard .
```

## Available Presets

### Minimal
Best for: Personal projects, quick experiments, learning

```bash
npx degit ai-excellence-framework/templates/presets/minimal .
```

**Includes:**
- Basic CLAUDE.md template
- Minimal configuration
- No hooks or security scanning

**Size:** ~2 files

---

### Standard (Recommended)
Best for: Most projects, solo developers, small teams

```bash
npx degit ai-excellence-framework/templates/presets/standard .
```

**Includes:**
- Comprehensive CLAUDE.md template
- All core slash commands
- Pre-commit hooks for security
- Dependency verification

**Size:** ~15 files

---

### Full
Best for: Production projects, security-conscious teams

```bash
npx degit ai-excellence-framework/templates/presets/full .
```

**Includes:**
- Everything in Standard
- MCP memory server
- Metrics collection
- Full dogfooding log
- All optional commands

**Size:** ~30 files

---

### Team
Best for: Multi-developer projects, enterprise environments

```bash
npx degit ai-excellence-framework/templates/presets/team .
```

**Includes:**
- Everything in Full
- Team coordination features
- Shared MCP memory
- Handoff protocols
- Team activity logging

**Size:** ~35 files

## Manual Installation

If you prefer not to use degit:

```bash
# Clone the entire repository
git clone https://github.com/ai-excellence-framework/ai-excellence-framework.git

# Copy the preset you want
cp -r ai-excellence-framework/templates/presets/standard/* your-project/

# Clean up
rm -rf ai-excellence-framework
```

## After Installation

1. **Update CLAUDE.md** - Replace all `[PLACEHOLDER]` values with your project info
2. **Configure hooks** - Run `pre-commit install` if using pre-commit
3. **Validate setup** - Run `npx ai-excellence validate` to check configuration

## Preset Comparison

| Feature | Minimal | Standard | Full | Team |
|---------|---------|----------|------|------|
| CLAUDE.md | Basic | Full | Full+ | Full+ |
| Slash Commands | 2 | 6 | 8 | 8 |
| Pre-commit Hooks | No | Yes | Yes | Yes |
| Security Scanning | No | Yes | Yes | Yes |
| MCP Memory | No | No | Yes | Yes |
| Metrics | No | No | Yes | Yes |
| Team Features | No | No | No | Yes |
| Dogfooding Log | No | No | Yes | Yes |

## Customization

After installation, modify `ai-excellence.config.json` to enable/disable features:

```json
{
  "commands": {
    "enabled": ["plan", "verify", "security-review"]
  },
  "hooks": {
    "enabled": true
  },
  "security": {
    "aiPatternChecks": true
  }
}
```

See the [Configuration Schema](../src/schemas/config.schema.json) for all options.
