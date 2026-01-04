# VS Code Extension Integration Guide

This guide explains how to integrate the AI Excellence Framework with Visual Studio Code and its AI extensions.

---

## Overview

VS Code offers multiple AI integration points:

1. **GitHub Copilot** - Built-in AI code completion
2. **Continue.dev** - Open-source AI coding assistant
3. **Claude Dev (Cline)** - Claude-powered extension
4. **Cursor-like Features** - Via various extensions
5. **Custom Extensions** - Build your own

---

## GitHub Copilot Integration

### Copilot Instructions File

Create `.github/copilot-instructions.md`:

```markdown
# Copilot Instructions

## Project Context

This project uses the AI Excellence Framework.

## Code Style

- TypeScript strict mode
- ESLint + Prettier formatting
- Conventional commits

## Security Requirements

- Never use eval()
- Validate all user inputs
- Use parameterized queries

## Testing

- Write tests for all new code
- Minimum 80% coverage
- Use describe/it pattern

## Framework Integration

Run /verify before completing any task.
Reference CLAUDE.md for full project context.
```

### Generate from CLAUDE.md

```bash
npx ai-excellence-framework generate --tool copilot
```

### VS Code Settings

Add to `.vscode/settings.json`:

```json
{
  "github.copilot.enable": {
    "*": true,
    "yaml": true,
    "plaintext": false,
    "markdown": true
  },
  "github.copilot.advanced": {
    "inlineSuggest.enable": true,
    "listCount": 3
  }
}
```

---

## Continue.dev Integration

[Continue.dev](https://continue.dev/) is an open-source AI coding assistant.

### Installation

1. Install from VS Code Marketplace: "Continue"
2. Configure in `~/.continue/config.json`:

```json
{
  "models": [
    {
      "title": "Claude 4.5",
      "provider": "anthropic",
      "model": "claude-opus-4-5-20251101",
      "apiKey": "YOUR_API_KEY"
    }
  ],
  "customCommands": [
    {
      "name": "plan",
      "description": "Plan implementation before coding",
      "prompt": "Read the CLAUDE.md file and help me plan: {{{ input }}}"
    },
    {
      "name": "verify",
      "description": "Verify work completion",
      "prompt": "Verify this work is complete with skeptical review: {{{ input }}}"
    }
  ],
  "contextProviders": [
    {
      "name": "file",
      "params": {
        "file": "CLAUDE.md"
      }
    }
  ]
}
```

### Custom Slash Commands

Add framework commands to Continue:

```json
{
  "customCommands": [
    {
      "name": "security-review",
      "description": "OWASP-focused security review",
      "prompt": "Perform a security review following OWASP guidelines on: {{{ input }}}"
    },
    {
      "name": "assumptions",
      "description": "Surface hidden assumptions",
      "prompt": "List all assumptions in this implementation: {{{ input }}}"
    }
  ]
}
```

---

## Claude Dev (Cline) Integration

[Cline](https://github.com/cline/cline) brings Claude to VS Code.

### Installation

1. Install from VS Code Marketplace: "Cline"
2. Configure API key in settings

### Framework Integration

Cline automatically reads CLAUDE.md from your project root.

Add to your CLAUDE.md:

```markdown
## VS Code Integration

When working in Cline:

- Use the built-in terminal for commands
- Reference file paths using workspace-relative paths
- Use @-mentions to include files in context
```

### Custom Instructions

Configure in VS Code settings:

```json
{
  "cline.customInstructions": "Follow the AI Excellence Framework patterns. Read CLAUDE.md for project context. Use /plan before implementing and /verify before completing."
}
```

---

## VS Code Tasks Integration

### tasks.json

Create `.vscode/tasks.json`:

```json
{
  "version": "2.0.0",
  "tasks": [
    {
      "label": "AI: Validate Framework",
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
      "label": "AI: Doctor Check",
      "type": "shell",
      "command": "npx ai-excellence-framework doctor",
      "group": "test",
      "presentation": {
        "reveal": "always"
      }
    },
    {
      "label": "AI: Security Scan",
      "type": "shell",
      "command": "bash scripts/hooks/check-ai-security.sh --strict",
      "windows": {
        "command": "powershell -File scripts/hooks/powershell/Check-AISecurity.ps1 -Strict"
      },
      "group": "test"
    },
    {
      "label": "AI: Verify Dependencies",
      "type": "shell",
      "command": "bash scripts/hooks/verify-deps.sh",
      "windows": {
        "command": "powershell -File scripts/hooks/powershell/Verify-Dependencies.ps1"
      }
    },
    {
      "label": "AI: Collect Metrics",
      "type": "shell",
      "command": "bash scripts/metrics/collect-session-metrics.sh --auto",
      "group": "none"
    }
  ]
}
```

### Keyboard Shortcuts

Add to `keybindings.json`:

```json
[
  {
    "key": "ctrl+shift+a v",
    "command": "workbench.action.tasks.runTask",
    "args": "AI: Validate Framework"
  },
  {
    "key": "ctrl+shift+a d",
    "command": "workbench.action.tasks.runTask",
    "args": "AI: Doctor Check"
  },
  {
    "key": "ctrl+shift+a s",
    "command": "workbench.action.tasks.runTask",
    "args": "AI: Security Scan"
  }
]
```

---

## Extension Recommendations

### extensions.json

Create `.vscode/extensions.json`:

```json
{
  "recommendations": [
    "github.copilot",
    "github.copilot-chat",
    "continue.continue",
    "saoudrizwan.claude-dev",
    "esbenp.prettier-vscode",
    "dbaeumer.vscode-eslint",
    "bradlc.vscode-tailwindcss",
    "ms-python.python",
    "ms-python.vscode-pylance"
  ],
  "unwantedRecommendations": []
}
```

---

## Workspace Settings

### Complete .vscode/settings.json

```json
{
  // Editor
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "explicit"
  },

  // Files
  "files.exclude": {
    "**/.git": true,
    "**/node_modules": true,
    "**/__pycache__": true
  },

  // TypeScript
  "[typescript]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "[typescriptreact]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },

  // Python
  "[python]": {
    "editor.defaultFormatter": "ms-python.black-formatter"
  },

  // Markdown
  "[markdown]": {
    "editor.wordWrap": "on",
    "editor.quickSuggestions": {
      "other": true,
      "comments": true,
      "strings": true
    }
  },

  // AI Excellence Framework
  "files.associations": {
    "CLAUDE.md": "markdown",
    "AGENTS.md": "markdown",
    ".cursorrules": "markdown"
  },

  // Copilot
  "github.copilot.enable": {
    "*": true,
    "yaml": true,
    "markdown": true
  },

  // Search
  "search.exclude": {
    "**/node_modules": true,
    "**/dist": true,
    "**/build": true,
    "**/.vitepress/cache": true
  }
}
```

---

## Snippets for AI Development

### Create `.vscode/ai-excellence.code-snippets`:

```json
{
  "AI Plan Header": {
    "scope": "markdown",
    "prefix": "aiplan",
    "body": [
      "## Plan: ${1:Task Description}",
      "",
      "### Understanding",
      "- ${2:Current state}",
      "",
      "### Assumptions",
      "- ${3:Key assumptions}",
      "",
      "### Approach",
      "1. ${4:First step}",
      "",
      "### Verification",
      "- [ ] ${5:Verification criteria}",
      ""
    ]
  },
  "AI Session Handoff": {
    "scope": "markdown",
    "prefix": "aihandoff",
    "body": [
      "# Session Handoff - ${CURRENT_DATE}",
      "",
      "## Accomplished",
      "- ${1:What was completed}",
      "",
      "## Decisions Made",
      "- ${2:Key decisions}",
      "",
      "## Open Questions",
      "- ${3:Unresolved items}",
      "",
      "## Next Steps",
      "- [ ] ${4:Recommended actions}",
      "",
      "## Files Modified",
      "- ${5:List of files}",
      ""
    ]
  },
  "Security Review Comment": {
    "scope": "javascript,typescript,python",
    "prefix": "aisecurity",
    "body": [
      "// SECURITY: ${1:Consideration}",
      "// Reviewed: ${CURRENT_DATE}",
      "// Status: ${2|verified,needs-review,approved|}"
    ]
  }
}
```

---

## Debugging AI-Generated Code

### launch.json

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Debug CLI",
      "program": "${workspaceFolder}/bin/cli.js",
      "args": ["${input:command}", "${input:args}"],
      "console": "integratedTerminal"
    },
    {
      "type": "node",
      "request": "launch",
      "name": "Debug Tests",
      "program": "${workspaceFolder}/node_modules/.bin/node",
      "args": ["--test", "${file}"],
      "console": "integratedTerminal"
    },
    {
      "type": "python",
      "request": "launch",
      "name": "Debug MCP Server",
      "program": "${workspaceFolder}/scripts/mcp/project-memory-server.py",
      "console": "integratedTerminal"
    }
  ],
  "inputs": [
    {
      "id": "command",
      "type": "pickString",
      "description": "CLI command",
      "options": ["init", "validate", "doctor", "generate", "lint"]
    },
    {
      "id": "args",
      "type": "promptString",
      "description": "Additional arguments"
    }
  ]
}
```

---

## Problem Matchers

For custom output parsing, add to tasks.json:

```json
{
  "problemMatcher": {
    "owner": "ai-security",
    "fileLocation": ["relative", "${workspaceFolder}"],
    "pattern": {
      "regexp": "^(.*):(\\d+):\\s*(.*)$",
      "file": 1,
      "line": 2,
      "message": 3
    }
  }
}
```

---

## Tips for AI-Assisted VS Code Development

### 1. Pin Important Files

In Copilot Chat or Continue, reference key files:

- `CLAUDE.md` - Project context
- `package.json` - Dependencies
- Current working file

### 2. Use Workspace Symbols

Enable workspace symbol search for better AI context:

```json
{
  "typescript.workspaceSymbols.scope": "allOpenProjects"
}
```

### 3. Configure AI Context

For better suggestions, keep related files open in editor tabs.

### 4. Leverage Terminal Integration

Run framework commands directly:

```bash
# In VS Code terminal
npx ai-excellence-framework doctor
```

### 5. Use Multi-Root Workspaces

For monorepos, configure each folder with its own CLAUDE.md:

```json
{
  "folders": [{ "path": "packages/api" }, { "path": "packages/web" }]
}
```

---

## Resources

- [VS Code Documentation](https://code.visualstudio.com/docs)
- [GitHub Copilot Guide](https://docs.github.com/en/copilot)
- [Continue.dev Documentation](https://continue.dev/docs)
- [Cline Documentation](https://github.com/cline/cline)

---

_Part of the AI Excellence Framework_
