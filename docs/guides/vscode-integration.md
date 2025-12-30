# VS Code Integration Guide

This guide explains how to integrate the AI Excellence Framework with VS Code and VS Code-based editors like Cursor.

## Table of Contents

- [Quick Setup](#quick-setup)
- [Recommended Extensions](#recommended-extensions)
- [Settings Configuration](#settings-configuration)
- [Keyboard Shortcuts](#keyboard-shortcuts)
- [Snippets](#snippets)
- [Tasks](#tasks)
- [Workspace Settings](#workspace-settings)
- [Cursor-Specific Configuration](#cursor-specific-configuration)
- [Troubleshooting](#troubleshooting)

## Quick Setup

### 1. Create Workspace Settings

Create `.vscode/settings.json` in your project root:

```json
{
  "files.associations": {
    "CLAUDE.md": "markdown",
    ".claude/commands/*.md": "markdown",
    ".claude/agents/*.md": "markdown"
  },
  "editor.quickSuggestions": {
    "comments": "on",
    "strings": "on"
  },
  "markdown.validate.enabled": true,
  "files.exclude": {
    ".tmp": true,
    ".secrets.baseline": true
  }
}
```

### 2. Install Recommended Extensions

Create `.vscode/extensions.json`:

```json
{
  "recommendations": [
    "davidanson.vscode-markdownlint",
    "esbenp.prettier-vscode",
    "streetsidesoftware.code-spell-checker",
    "ms-python.python",
    "dbaeumer.vscode-eslint",
    "editorconfig.editorconfig"
  ]
}
```

## Recommended Extensions

### Essential

| Extension | Purpose |
|-----------|---------|
| [markdownlint](https://marketplace.visualstudio.com/items?itemName=DavidAnson.vscode-markdownlint) | Lint CLAUDE.md and command files |
| [Prettier](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode) | Format Markdown, JSON, JavaScript |
| [EditorConfig](https://marketplace.visualstudio.com/items?itemName=EditorConfig.EditorConfig) | Consistent editor settings |

### Recommended

| Extension | Purpose |
|-----------|---------|
| [Code Spell Checker](https://marketplace.visualstudio.com/items?itemName=streetsidesoftware.code-spell-checker) | Catch typos in documentation |
| [YAML](https://marketplace.visualstudio.com/items?itemName=redhat.vscode-yaml) | Validate slash command frontmatter |
| [GitLens](https://marketplace.visualstudio.com/items?itemName=eamodio.gitlens) | Enhanced Git integration |
| [Python](https://marketplace.visualstudio.com/items?itemName=ms-python.python) | MCP server development |

## Settings Configuration

### CLAUDE.md Quick Access

Add to your `settings.json` for quick CLAUDE.md navigation:

```json
{
  "workbench.editor.pinnedTabsOnSeparateRow": true,
  "files.watcherExclude": {
    "**/.tmp/**": true
  }
}
```

### Markdown Preview Settings

```json
{
  "markdown.preview.fontSize": 14,
  "markdown.preview.lineHeight": 1.6,
  "[markdown]": {
    "editor.wordWrap": "on",
    "editor.quickSuggestions": {
      "comments": "off",
      "strings": "off",
      "other": "off"
    }
  }
}
```

## Keyboard Shortcuts

Add these to your `keybindings.json`:

```json
[
  {
    "key": "ctrl+shift+c",
    "command": "workbench.action.quickOpen",
    "args": "CLAUDE.md",
    "when": "!inQuickOpen"
  },
  {
    "key": "ctrl+shift+p",
    "command": "workbench.action.tasks.runTask",
    "args": "AI Excellence: Validate"
  }
]
```

## Snippets

Create `.vscode/markdown.code-snippets`:

```json
{
  "AI Excellence Decision": {
    "prefix": "aix-decision",
    "body": [
      "### Decision: ${1:Title}",
      "",
      "**Date:** ${CURRENT_YEAR}-${CURRENT_MONTH}-${CURRENT_DATE}",
      "",
      "**Context:** ${2:What prompted this decision}",
      "",
      "**Decision:** ${3:What we decided}",
      "",
      "**Rationale:** ${4:Why we decided this}",
      "",
      "**Alternatives Considered:**",
      "- ${5:Alternative 1}",
      "",
      "**Consequences:**",
      "- ${6:Expected outcome}"
    ],
    "description": "Document an architectural decision"
  },
  "AI Excellence Session Note": {
    "prefix": "aix-session",
    "body": [
      "# Session Notes - ${CURRENT_YEAR}-${CURRENT_MONTH}-${CURRENT_DATE}",
      "",
      "## Summary",
      "",
      "${1:Brief summary of what was accomplished}",
      "",
      "## Changes Made",
      "",
      "- ${2:Change 1}",
      "",
      "## Decisions",
      "",
      "- ${3:Key decision made}",
      "",
      "## Next Steps",
      "",
      "- [ ] ${4:Next action item}",
      "",
      "## Context for Next Session",
      "",
      "${5:Important context to preserve}"
    ],
    "description": "Create a session handoff note"
  },
  "CLAUDE.md Section": {
    "prefix": "aix-section",
    "body": [
      "## ${1:Section Name}",
      "",
      "${2:Section content}",
      ""
    ],
    "description": "Add a new CLAUDE.md section"
  }
}
```

## Tasks

Create `.vscode/tasks.json`:

```json
{
  "version": "2.0.0",
  "tasks": [
    {
      "label": "AI Excellence: Validate",
      "type": "shell",
      "command": "npx ai-excellence-framework validate",
      "group": "build",
      "presentation": {
        "reveal": "always",
        "panel": "new"
      },
      "problemMatcher": []
    },
    {
      "label": "AI Excellence: Doctor",
      "type": "shell",
      "command": "npx ai-excellence-framework doctor --verbose",
      "group": "build",
      "presentation": {
        "reveal": "always",
        "panel": "new"
      },
      "problemMatcher": []
    },
    {
      "label": "AI Excellence: Fix Issues",
      "type": "shell",
      "command": "npx ai-excellence-framework validate --fix",
      "group": "build",
      "presentation": {
        "reveal": "always",
        "panel": "new"
      },
      "problemMatcher": []
    },
    {
      "label": "MCP Server: Start",
      "type": "shell",
      "command": "python3 scripts/mcp/project-memory-server.py",
      "group": "none",
      "isBackground": true,
      "presentation": {
        "reveal": "always",
        "panel": "dedicated"
      },
      "problemMatcher": []
    },
    {
      "label": "Collect Session Metrics",
      "type": "shell",
      "command": "./scripts/metrics/collect-session-metrics.sh --auto",
      "group": "none",
      "presentation": {
        "reveal": "silent"
      },
      "problemMatcher": []
    }
  ]
}
```

## Workspace Settings

For team consistency, create a `.vscode/settings.json`:

```json
{
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "explicit"
  },
  "files.trimTrailingWhitespace": true,
  "files.insertFinalNewline": true,
  "files.trimFinalNewlines": true,
  "search.exclude": {
    "**/node_modules": true,
    "**/.tmp": true,
    "**/dist": true
  },
  "markdownlint.config": {
    "MD013": false,
    "MD033": false,
    "MD041": false
  },
  "[markdown]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "[json]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  }
}
```

## Cursor-Specific Configuration

[Cursor](https://cursor.sh/) is a VS Code fork with AI capabilities built-in.

### Enable CLAUDE.md Recognition

Cursor automatically reads files named `CLAUDE.md` or `.cursorrules`. The framework's CLAUDE.md is compatible with Cursor's context system.

### Cursor Rules Integration

Create `.cursorrules` that references CLAUDE.md:

```
# Project Rules

See CLAUDE.md for full project context and conventions.

## Quick Reference
- Use /plan before implementing significant features
- Use /verify before marking tasks complete
- Follow conventional commits
```

### Cursor Settings

Add to Cursor settings for optimal experience:

```json
{
  "cursor.chat.alwaysInclude": [
    "CLAUDE.md"
  ],
  "cursor.composer.defaultFiles": [
    "CLAUDE.md"
  ]
}
```

## Troubleshooting

### CLAUDE.md Not Recognized

**Problem:** Markdown features not working in CLAUDE.md.

**Solution:** Add file association:

```json
{
  "files.associations": {
    "CLAUDE.md": "markdown"
  }
}
```

### Extensions Not Installing

**Problem:** Recommended extensions not appearing.

**Solution:** Ensure `.vscode/extensions.json` is correctly formatted and run "Extensions: Show Recommended Extensions" from Command Palette.

### Tasks Not Running

**Problem:** VS Code tasks fail to execute.

**Solution:**

1. Ensure Node.js is in PATH
2. Check that `npx` is available
3. Run `npm install -g ai-excellence-framework` if npx fails

### Snippets Not Appearing

**Problem:** Snippets don't show in autocomplete.

**Solution:**

1. Ensure the file type is "Markdown"
2. Start typing the snippet prefix (e.g., "aix-")
3. Press Ctrl+Space to force suggestions

## Complete Setup Script

Run this to create all VS Code configuration files:

```bash
#!/bin/bash
mkdir -p .vscode

# Create settings.json
cat > .vscode/settings.json << 'EOF'
{
  "files.associations": {
    "CLAUDE.md": "markdown"
  },
  "editor.formatOnSave": true,
  "files.trimTrailingWhitespace": true,
  "markdownlint.config": {
    "MD013": false,
    "MD033": false
  }
}
EOF

# Create extensions.json
cat > .vscode/extensions.json << 'EOF'
{
  "recommendations": [
    "davidanson.vscode-markdownlint",
    "esbenp.prettier-vscode"
  ]
}
EOF

echo "VS Code configuration created!"
```

## Next Steps

1. Install the [recommended extensions](#recommended-extensions)
2. Set up [keyboard shortcuts](#keyboard-shortcuts)
3. Configure [tasks](#tasks) for quick validation
4. Customize [snippets](#snippets) for your workflow

For more information, see the [main documentation](../index.md).
