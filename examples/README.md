# Examples

Ready-to-use CLAUDE.md examples for different project sizes.

## Available Examples

| Example | Description | Use Case |
|---------|-------------|----------|
| [minimal/](./minimal/) | Basic setup | Side projects, small apps |
| [standard/](./standard/) | Recommended setup | Production applications |
| [full/](./full/) | Complete with MCP | Enterprise, compliance needs |

## Usage

### Copy an Example

```bash
# Copy minimal example
cp examples/minimal/CLAUDE.md ./CLAUDE.md

# Or copy standard example
cp examples/standard/CLAUDE.md ./CLAUDE.md
```

### Via CLI

```bash
# Initialize with examples as reference
npx ai-excellence-framework init --preset standard
```

## Customization

After copying, customize:

1. **Overview**: Describe your actual project
2. **Tech Stack**: List your real technologies
3. **Architecture**: Document your structure
4. **Conventions**: Your team's standards
5. **Current State**: Actual progress
6. **Session Instructions**: Your workflow

## Best Practices

1. **Keep it updated** - Stale CLAUDE.md is worse than none
2. **Be specific** - Generic advice doesn't help AI assistants
3. **Include examples** - Show, don't just tell
4. **Document decisions** - Why, not just what
5. **Track state** - What's done, what's in progress
