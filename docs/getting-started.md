# Getting Started

Get up and running with the AI Excellence Framework in under 5 minutes.

## Prerequisites

- **Node.js** 18.0.0 or higher
- **Git** (for version control features)
- **Claude Code** or compatible AI coding assistant (optional but recommended)

Check your setup:

```bash
node --version  # Should be v18.0.0 or higher
git --version   # Any recent version
```

## Quick Start

### 1. Install the Framework

Run this command in your project directory:

```bash
npx ai-excellence-framework init
```

### 2. Choose Your Preset

You'll be prompted to select a configuration preset:

| Preset | Best For | What's Included |
|--------|----------|-----------------|
| **Minimal** | Trying it out | CLAUDE.md + /plan + /verify |
| **Standard** | Individual developers | All commands + basic hooks |
| **Full** | Serious projects | Everything including MCP server |
| **Team** | Team collaboration | Full + team federation |

For most users, we recommend **Standard**:

```bash
npx ai-excellence-framework init --preset standard
```

### 3. Customize Your CLAUDE.md

The installer creates a `CLAUDE.md` file. Open it and fill in your project details:

```markdown
# Project: My Awesome App

## Overview

A web application for managing todo items with collaborative features.

## Tech Stack

- Frontend: React 18 with TypeScript
- Backend: Node.js with Express
- Database: PostgreSQL
- Hosting: Vercel + Supabase

## Architecture

### Directory Structure
```
src/
├── components/   # React components
├── api/          # API routes
├── hooks/        # Custom React hooks
└── utils/        # Helper functions
```

## Current State

### Phase
Alpha - Core features implemented

### Recent Decisions
- 2025-01-15: Chose React Query for data fetching
- 2025-01-10: Adopted Tailwind CSS for styling
```

### 4. Verify Installation

Run the doctor command to check everything is set up correctly:

```bash
npx ai-excellence-framework doctor
```

You should see all green checkmarks:

```
  Environment:
    ✓ Node.js version: v20.10.0
    ✓ Git available: 2.43.0

  Framework:
    ✓ Framework installed: Yes
    ✓ CLAUDE.md freshness: 0 days old

  Summary: 10/10 checks passed

  ✓ All systems operational!
```

## Your First AI Session

### Start with /plan

Before implementing anything significant, use the `/plan` command:

```
/plan Add user authentication with email/password login
```

This ensures you and the AI are aligned before writing code.

### Verify with /verify

After the AI completes work, verify it:

```
/verify Check the authentication implementation is complete
```

This catches incomplete work before you accept it.

### Generate Handoff Notes

At the end of your session:

```
/handoff
```

This creates a summary for your next session.

## What's Installed

After running `init`, your project contains:

```
your-project/
├── CLAUDE.md                    # Project context (edit this!)
├── .claude/
│   ├── commands/
│   │   ├── plan.md             # /plan command
│   │   ├── verify.md           # /verify command
│   │   ├── handoff.md          # /handoff command
│   │   ├── assumptions.md      # /assumptions command
│   │   ├── review.md           # /review command
│   │   └── security-review.md  # /security-review command
│   └── agents/
│       ├── explorer.md         # Codebase exploration agent
│       ├── reviewer.md         # Code review agent
│       └── tester.md           # Test generation agent
├── scripts/
│   └── hooks/                   # Git hooks (if enabled)
├── docs/
│   └── session-notes/          # Session handoff notes
└── .tmp/                        # Temporary working files
```

## Common Workflows

### Bug Fix

```bash
# 1. Understand the bug
/plan Fix the login button not responding on mobile

# 2. AI investigates and fixes

# 3. Verify the fix
/verify Check the mobile login fix

# 4. Commit
git add . && git commit -m "fix: mobile login button responsiveness"
```

### New Feature

```bash
# 1. Plan the feature
/plan Add dark mode toggle to settings page

# 2. AI implements

# 3. Security review (for user-facing features)
/security-review src/components/Settings.tsx

# 4. Verify
/verify Check dark mode implementation

# 5. Commit
git add . && git commit -m "feat: add dark mode toggle"
```

### Code Review

```bash
# Get a thorough review
/review src/api/auth.ts
```

### End of Day

```bash
# Generate handoff summary
/handoff

# The summary is saved to docs/session-notes/
# and shown in the terminal
```

## Configuration

### Enable Pre-commit Hooks

If you want security scanning on commits:

```bash
pip install pre-commit
pre-commit install
```

### Enable MCP Server (Full preset)

The MCP server persists decisions across sessions:

```bash
# Install MCP SDK
pip install mcp

# The server is at scripts/mcp/project-memory-server.py
# Configure in your Claude settings
```

### Validate Configuration

Check your setup anytime:

```bash
npx ai-excellence-framework validate
```

Fix issues automatically:

```bash
npx ai-excellence-framework validate --fix
```

## Troubleshooting

### "Command not found" errors

Make sure you're using `npx`:

```bash
npx ai-excellence-framework --help
```

Or install globally:

```bash
npm install -g ai-excellence-framework
ai-excellence --help
```

### Slash commands not working

1. Check the files exist: `ls .claude/commands/`
2. Verify frontmatter is valid YAML
3. Restart your Claude Code session

### CLAUDE.md not being read

1. File must be named exactly `CLAUDE.md` (case-sensitive)
2. Must be in project root
3. Must be valid markdown

See [Troubleshooting Guide](/TROUBLESHOOTING) for more solutions.

## Next Steps

1. **Customize CLAUDE.md** - Add your project's specific context
2. **Try /plan** - Plan your first feature
3. **Use /verify** - Verify AI-completed work
4. **Read [Quick Reference](/QUICK-REFERENCE)** - One-page command summary
5. **Explore [When AI Helps](/WHEN-AI-HELPS)** - Maximize AI effectiveness

## Getting Help

- **Documentation**: You're here! Browse the sidebar.
- **Quick Reference**: [One-page guide](/QUICK-REFERENCE)
- **Troubleshooting**: [Common issues](/TROUBLESHOOTING)
- **GitHub Issues**: [Report bugs](https://github.com/ai-excellence-framework/ai-excellence-framework/issues)
- **Discussions**: [Ask questions](https://github.com/ai-excellence-framework/ai-excellence-framework/discussions)

---

Ready to dive deeper? Check out [Core Concepts](/docs/concepts) to understand the framework's philosophy.
