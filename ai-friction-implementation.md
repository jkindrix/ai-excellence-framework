# Operationalizing AI-Assisted Development: Implementation Guide

_Concrete implementations for the strategies in "Mitigating AI-Assisted Development Friction"_

---

## TL;DR — Copy-Paste Implementations

**This document provides ready-to-use code.** If you want to skip reading and just deploy:

### Instant Setup (2 commands)

```bash
# Option 1: Use the CLI
npx ai-excellence-framework init

# Option 2: Manual copy
git clone https://github.com/your-username/ai-excellence-framework.git /tmp/aix
cp -r /tmp/aix/.claude /tmp/aix/CLAUDE.md /tmp/aix/scripts ./
rm -rf /tmp/aix
```

### What Gets Installed

| Component          | Files                                        | Purpose                                             |
| ------------------ | -------------------------------------------- | --------------------------------------------------- |
| **CLAUDE.md**      | `CLAUDE.md`                                  | Project context for every session                   |
| **Slash Commands** | `.claude/commands/*.md`                      | /plan, /verify, /handoff, /review, /security-review |
| **Subagents**      | `.claude/agents/*.md`                        | reviewer, explorer, tester                          |
| **Security Hooks** | `scripts/hooks/*`, `.pre-commit-config.yaml` | Pre-commit security scanning                        |
| **MCP Server**     | `scripts/mcp/project-memory-server.py`       | Persistent project memory                           |
| **Metrics**        | `scripts/metrics/collect-session-metrics.sh` | Session effectiveness tracking                      |

### Priority Order (if implementing incrementally)

1. **Week 1**: CLAUDE.md + /plan + /verify (immediate value)
2. **Week 2**: Pre-commit hooks + /security-review (security)
3. **Week 3**: /handoff + session notes (continuity)
4. **Week 4**: MCP server + metrics (persistence)

### Quick Links to Sections

- §1: Directory Structure and CLAUDE.md template
- §2: Slash command implementations
- §3: MCP server setup
- §4: Pre-commit security configuration
- §5: CI/CD integration
- §6: Team adoption patterns

---

## Overview

This document provides **actual implementations**—code, configurations, file structures, and automation scripts—that operationalize the friction mitigation strategies. Everything here is designed to be copy-pasted, adapted, and deployed.

**Organization:**

1. Project Infrastructure Setup
2. Claude Code Configuration
3. Custom MCP Servers
4. Slash Commands & Skills
5. Git Hooks & Automation
6. CI/CD Integration
7. Multi-Agent Orchestration
8. Templates & Checklists

---

## Part I: Project Infrastructure Setup

### 1.1 Directory Structure

Create this structure in your project root:

```
project-root/
├── .claude/
│   ├── commands/           # Custom slash commands
│   │   ├── plan.md
│   │   ├── review.md
│   │   ├── handoff.md
│   │   └── verify.md
│   ├── agents/             # Custom subagents
│   │   ├── reviewer.md
│   │   ├── tester.md
│   │   └── explorer.md
│   ├── settings.json       # Hooks and local settings
│   └── settings.local.json # Personal settings (gitignored)
├── CLAUDE.md               # Primary context file
├── CLAUDE.local.md         # Personal overrides (gitignored)
├── docs/
│   ├── architecture/       # Architecture decision records
│   ├── session-notes/      # Session handoff logs
│   └── decisions/          # Key decision documentation
├── .github/
│   └── workflows/
│       └── ai-review.yml   # AI code review workflow
├── scripts/
│   ├── hooks/              # Git hook scripts
│   └── mcp/                # MCP server scripts
└── .pre-commit-config.yaml # Pre-commit hook config
```

### 1.2 Base CLAUDE.md Template

Create `CLAUDE.md` in your project root:

```markdown
# Project: [PROJECT_NAME]

## Overview

[One paragraph describing what this project does and its purpose]

## Tech Stack

- Language: [e.g., TypeScript 5.3]
- Runtime: [e.g., Node.js 20.x]
- Framework: [e.g., Next.js 14]
- Database: [e.g., PostgreSQL 15]
- Key Dependencies: [list critical deps with versions]

## Architecture

### Directory Structure
```

src/
├── api/ # API routes and handlers
├── components/ # React components
├── lib/ # Shared utilities
├── services/ # Business logic
└── types/ # TypeScript types

````

### Key Entry Points
- API: `src/api/index.ts`
- Auth: `src/services/auth/`
- Database: `src/lib/db/`

### Data Flow
[Brief description of how data flows through the system]

## Conventions

### Code Style
- [Naming conventions]
- [File organization rules]
- [Import ordering]

### Commit Messages
- Use conventional commits: feat|fix|docs|refactor|test
- Include ticket number when applicable

### Testing
- Unit tests: `npm test`
- Integration: `npm run test:integration`
- Coverage threshold: 80%

## Common Commands
```bash
npm run dev      # Start development server
npm run build    # Production build
npm test         # Run tests
npm run lint     # Run linter
````

## Current State

### Active Work

- [Current feature/task being developed]

### Known Issues

- [List known bugs or technical debt]

### Recent Decisions

- [Date]: [Decision and rationale]

## Critical Constraints

<!-- These constraints should NOT be overridden -->

- [Security requirements]
- [Performance requirements]
- [Compatibility requirements]

## Session Instructions

### Before Starting

1. Read this file completely
2. Check `docs/session-notes/` for recent context
3. Run `npm test` to verify baseline

### During Work

- Use todo lists for multi-step tasks
- Verify before asserting
- Ask before assuming on architectural decisions

### Before Ending

- Run `/handoff` to generate session summary
- Commit any completed work
- Update "Current State" section if needed

````

### 1.3 Git Configuration

Add to `.gitignore`:

```gitignore
# Claude Code local files
CLAUDE.local.md
.claude/settings.local.json
docs/session-notes/*.local.md

# Session artifacts
.tmp/
````

---

## Part II: Claude Code Configuration

### 2.1 Hooks Configuration

Create `.claude/settings.json`:

```json
{
  "hooks": {
    "preToolUse": [
      {
        "matcher": "Write|Edit",
        "command": "echo '⚠️  File modification pending - will auto-lint after'"
      }
    ],
    "postToolUse": [
      {
        "matcher": "Write|Edit",
        "command": "./scripts/hooks/post-edit.sh \"$CLAUDE_FILE_PATH\""
      },
      {
        "matcher": "Bash",
        "command": "./scripts/hooks/post-bash.sh"
      }
    ],
    "notification": [
      {
        "matcher": "TaskComplete",
        "command": "./scripts/hooks/notify.sh 'Task completed'"
      }
    ]
  },
  "permissions": {
    "allowedTools": ["Read", "Write", "Edit", "Glob", "Grep", "Bash", "LSP"],
    "blockedCommands": ["rm -rf /", "sudo", "chmod 777"],
    "requireConfirmation": ["git push", "npm publish", "docker push"]
  }
}
```

### 2.2 Post-Edit Hook Script

Create `scripts/hooks/post-edit.sh`:

```bash
#!/bin/bash
# Auto-lint and format after file edits

FILE_PATH="$1"

if [ -z "$FILE_PATH" ]; then
    exit 0
fi

# Get file extension
EXT="${FILE_PATH##*.}"

case "$EXT" in
    ts|tsx|js|jsx)
        npx eslint --fix "$FILE_PATH" 2>/dev/null || true
        npx prettier --write "$FILE_PATH" 2>/dev/null || true
        ;;
    py)
        black "$FILE_PATH" 2>/dev/null || true
        ruff check --fix "$FILE_PATH" 2>/dev/null || true
        ;;
    go)
        gofmt -w "$FILE_PATH" 2>/dev/null || true
        ;;
    rs)
        rustfmt "$FILE_PATH" 2>/dev/null || true
        ;;
esac

echo "✓ Auto-formatted: $FILE_PATH"
```

Make executable: `chmod +x scripts/hooks/post-edit.sh`

---

## Part III: Custom Slash Commands

### 3.1 Plan Command

Create `.claude/commands/plan.md`:

````markdown
---
description: Create implementation plan before coding
---

# Plan Mode

Before implementing anything, create a structured plan.

## Instructions

1. **Clarify Understanding**
   - Restate what you understand the request to be
   - List any assumptions you're making
   - Identify questions that should be answered first

2. **Research Phase**
   - Search online if this involves unfamiliar technology
   - Read relevant existing code files
   - Identify patterns already used in this codebase

3. **Design Approach**
   - Outline the proposed solution
   - List files that will be created/modified
   - Identify potential risks or edge cases

4. **Verification Criteria**
   - Define what "done" looks like
   - List test cases that should pass
   - Specify how to verify the implementation works

## Output Format

```markdown
## Plan: [Brief Title]

### Understanding

[Your interpretation of the request]

### Assumptions

- [ ] [Assumption 1]
- [ ] [Assumption 2]

### Questions (if any)

- [Question needing clarification]

### Approach

1. [Step 1]
2. [Step 2]
3. [Step 3]

### Files to Modify

- `path/to/file.ts` - [what changes]

### Verification

- [ ] [Test case 1]
- [ ] [Test case 2]
```
````

**Do not proceed to implementation until plan is approved.**

User request: $ARGUMENTS

````

### 3.2 Review Command

Create `.claude/commands/review.md`:

```markdown
---
description: Multi-perspective code review
---

# Code Review

Perform a comprehensive code review from multiple perspectives.

## Review the following: $ARGUMENTS

### Perspective 1: Correctness
- Does the code do what it claims to do?
- Are there logic errors?
- Are edge cases handled?
- Could any inputs cause unexpected behavior?

### Perspective 2: Security
- Are there injection vulnerabilities (SQL, command, XSS)?
- Is sensitive data properly protected?
- Are authentication/authorization checks correct?
- Are there hardcoded secrets?

### Perspective 3: Performance
- Are there obvious inefficiencies?
- Could this cause N+1 queries?
- Are there unnecessary computations in loops?
- Is caching used appropriately?

### Perspective 4: Maintainability
- Is the code readable?
- Are naming conventions followed?
- Is there appropriate documentation?
- Would future developers understand this?

### Perspective 5: Testing
- Is the code testable?
- What test cases are missing?
- Are there assertions that could fail silently?

## Output Format

```markdown
## Code Review: [file/feature]

### Summary
[One sentence overall assessment]

### Critical Issues 🔴
- [Issue requiring immediate fix]

### Warnings 🟡
- [Issue that should be addressed]

### Suggestions 🟢
- [Nice-to-have improvements]

### What's Good ✓
- [Positive observations]
````

````

### 3.3 Handoff Command

Create `.claude/commands/handoff.md`:

```markdown
---
description: Generate session handoff summary
---

# Session Handoff

Generate a comprehensive handoff summary for the next session.

## Generate handoff for this session

### Required Sections

1. **Session Summary**
   - What was the main goal?
   - What was accomplished?
   - What approach was taken?

2. **Decisions Made**
   - List each significant decision
   - Include the rationale
   - Note any alternatives considered

3. **Files Changed**
   - List all files created/modified/deleted
   - Brief description of changes

4. **Current State**
   - What works now that didn't before?
   - What's partially complete?
   - What's blocked?

5. **Open Questions**
   - Unresolved decisions
   - Areas needing clarification
   - Technical uncertainties

6. **Recommended Next Steps**
   - Prioritized list of what to do next
   - Any time-sensitive items

7. **Gotchas & Warnings**
   - Things the next session should be careful about
   - Non-obvious dependencies
   - Potential pitfalls

## Output Format

Save to: `docs/session-notes/[DATE]-handoff.md`

```markdown
# Session Handoff: [DATE]

## Summary
[2-3 sentence summary]

## Accomplished
- [x] [Completed item]
- [ ] [Partially complete item]

## Decisions
| Decision | Rationale | Alternatives Considered |
|----------|-----------|------------------------|
| [decision] | [why] | [other options] |

## Files Changed
- `path/to/file.ts` - [what changed]

## Current State
[Description of where things stand]

## Blockers
- [Blocker and what's needed to resolve]

## Next Steps
1. [Priority 1]
2. [Priority 2]
3. [Priority 3]

## Warnings
⚠️ [Thing to be careful about]
````

````

### 3.4 Verify Command

Create `.claude/commands/verify.md`:

```markdown
---
description: Verify task completion with skeptical review
---

# Verification Protocol

Adopt the persona of a skeptical validator. Assume nothing is complete until proven.

## Verify: $ARGUMENTS

### Verification Steps

1. **Enumerate Claims**
   - List everything that was supposedly completed
   - Be specific: file paths, function names, behaviors

2. **Manual Inspection**
   - Read each file mentioned
   - Do not trust summaries—verify content

3. **Functional Testing**
   - Can you run the code?
   - Do tests pass?
   - Does it handle error cases?

4. **Edge Case Analysis**
   - What inputs weren't tested?
   - What states weren't considered?
   - What could break this?

5. **Integration Check**
   - Is everything wired up correctly?
   - Do imports resolve?
   - Are configurations updated?

6. **Documentation Check**
   - Is README updated if needed?
   - Are new configs documented?
   - Are complex sections commented?

### Falsification Attempt

Before confirming completion, actively try to prove it's NOT complete:
- What's missing?
- What doesn't work?
- What was forgotten?

## Output Format

```markdown
## Verification Report

### Claims Reviewed
| Claim | Status | Evidence |
|-------|--------|----------|
| [claim] | ✓/✗/⚠️ | [proof] |

### Issues Found
- 🔴 **Critical**: [must fix]
- 🟡 **Warning**: [should fix]

### Remaining Work
- [ ] [Task not complete]

### Verdict
[ ] ✓ COMPLETE - All claims verified
[ ] ⚠️ PARTIAL - Issues noted above
[ ] ✗ INCOMPLETE - Significant work remains
````

````

### 3.5 Assumptions Command

Create `.claude/commands/assumptions.md`:

```markdown
---
description: Surface and document assumptions before implementation
---

# Assumption Surfacing

Before proceeding with: $ARGUMENTS

## Required Analysis

### 1. Explicit Assumptions
List assumptions you're consciously making:
- Technical assumptions (APIs, libraries, patterns)
- Business assumptions (requirements, priorities)
- Environmental assumptions (runtime, dependencies)

### 2. Implicit Assumptions
Try to surface assumptions you might not realize you're making:
- What are you NOT questioning that you should?
- What seems "obvious" but might not be?
- What would change your approach if false?

### 3. Questions Not Asked
List questions you should probably ask but were going to skip:
- Clarifications about requirements
- Decisions that could go multiple ways
- Areas where you're guessing

### 4. Risk Assessment
For each major assumption:
- What happens if it's wrong?
- How would you detect if it's wrong?
- Is it reversible?

## Output Format

```markdown
## Assumptions for: [task]

### I'm Assuming...
| Assumption | Confidence | Impact if Wrong | Verify? |
|------------|------------|-----------------|---------|
| [assumption] | High/Med/Low | [impact] | Yes/No |

### Questions I Should Ask
1. [Question] - [why it matters]

### Risks
- **[Risk]**: [mitigation strategy]

### Proceed?
[ ] All assumptions are safe to proceed with
[ ] Need clarification on: [items]
````

````

---

## Part IV: Custom Subagents

### 4.1 Reviewer Subagent

Create `.claude/agents/reviewer.md`:

```markdown
---
name: reviewer
description: Independent code review agent with fresh perspective
model: sonnet
tools:
  - Read
  - Grep
  - Glob
  - LSP
---

# Code Reviewer Agent

You are an independent code reviewer. Your job is to find problems that the original author might have missed.

## Your Perspective

You have NOT seen the implementation process. You only see the final code. This gives you fresh eyes.

## Review Protocol

1. **Understand Intent**
   - Read any related documentation or comments
   - Understand what the code is supposed to do

2. **Review for Issues**
   - Logic errors
   - Security vulnerabilities
   - Performance problems
   - Missing error handling
   - Incomplete edge cases

3. **Check Consistency**
   - Does this follow codebase patterns?
   - Are naming conventions followed?
   - Is style consistent?

4. **Identify Missing Tests**
   - What test cases are absent?
   - What could break without failing tests?

## Output

Provide findings in this format:
- 🔴 **Critical**: [must fix before merge]
- 🟡 **Warning**: [should address]
- 🟢 **Suggestion**: [nice to have]
- ✓ **Good**: [positive observations]
````

### 4.2 Tester Subagent

Create `.claude/agents/tester.md`:

```markdown
---
name: tester
description: Test generation and verification agent
model: sonnet
tools:
  - Read
  - Write
  - Edit
  - Bash
  - Grep
  - Glob
---

# Testing Agent

You are a testing specialist. Your job is to ensure code is properly tested.

## Capabilities

1. **Generate Test Cases**
   - Unit tests for functions
   - Integration tests for workflows
   - Edge case coverage

2. **Identify Test Gaps**
   - What scenarios aren't covered?
   - What could break without failing tests?
   - What assertions are missing?

3. **Run and Verify**
   - Execute test suites
   - Analyze failures
   - Verify coverage

## Testing Philosophy

- Tests should verify BEHAVIOR, not implementation
- Test the contract, not the internals
- Include negative test cases (what should fail)
- Edge cases: null, empty, boundary values, large inputs

## Output

When generating tests:
```

## Test Plan for: [component]

### Happy Path Tests

- [test case]

### Error Cases

- [test case]

### Edge Cases

- [test case]

### Integration Tests

- [test case]

```

```

### 4.3 Explorer Subagent

Create `.claude/agents/explorer.md`:

```markdown
---
name: explorer
description: Codebase exploration and context gathering
model: haiku
tools:
  - Read
  - Grep
  - Glob
  - LSP
---

# Explorer Agent

You are a codebase explorer. Your job is to find relevant code and gather context efficiently.

## Use Cases

1. **Find Related Code**
   - Locate all files related to a feature
   - Find usage patterns
   - Identify dependencies

2. **Map Architecture**
   - Trace data flow
   - Identify entry points
   - Document component relationships

3. **Answer Questions**
   - Where is X implemented?
   - How does Y work?
   - What depends on Z?

## Exploration Strategy

1. Start with obvious search terms
2. Follow imports and references
3. Check test files for usage examples
4. Look for configuration files
5. Check documentation

## Output

Provide findings concisely:
```

## Exploration: [query]

### Key Files

- `path/to/main.ts` - [why relevant]

### Architecture

[Brief description of how it works]

### Entry Points

- [where to start]

### Dependencies

- [what this depends on]
- [what depends on this]

```

```

---

## Part V: Git Hooks & Pre-Commit

### 5.1 Pre-Commit Configuration

Create `.pre-commit-config.yaml`:

```yaml
# Pre-commit hooks for AI-assisted development
# Install: pip install pre-commit && pre-commit install

repos:
  # Standard formatters
  - repo: https://github.com/pre-commit/pre-commit-hooks
    rev: v5.0.0
    hooks:
      - id: trailing-whitespace
      - id: end-of-file-fixer
      - id: check-yaml
      - id: check-json
      - id: check-added-large-files
        args: ['--maxkb=1000']
      - id: detect-private-key
      - id: check-merge-conflict

  # TypeScript/JavaScript
  - repo: local
    hooks:
      - id: eslint
        name: ESLint
        entry: npx eslint --fix
        language: system
        files: \.(ts|tsx|js|jsx)$
        pass_filenames: true

      - id: prettier
        name: Prettier
        entry: npx prettier --write
        language: system
        files: \.(ts|tsx|js|jsx|json|md|yaml|yml)$
        pass_filenames: true

      - id: typecheck
        name: TypeScript Check
        entry: npx tsc --noEmit
        language: system
        files: \.(ts|tsx)$
        pass_filenames: false

  # Security scanning
  - repo: https://github.com/Yelp/detect-secrets
    rev: v1.4.0
    hooks:
      - id: detect-secrets
        args: ['--baseline', '.secrets.baseline']

  # AI-specific: Verify CLAUDE.md is updated
  - repo: local
    hooks:
      - id: claude-md-check
        name: Check CLAUDE.md updated
        entry: ./scripts/hooks/check-claude-md.sh
        language: script
        files: ^(src/|lib/|app/)
        pass_filenames: false

  # Custom verification
  - repo: local
    hooks:
      - id: todo-check
        name: Check for unfinished TODOs
        entry: ./scripts/hooks/check-todos.sh
        language: script
        pass_filenames: false
```

### 5.2 CLAUDE.md Update Check

Create `scripts/hooks/check-claude-md.sh`:

```bash
#!/bin/bash
# Remind to update CLAUDE.md when significant changes are made

# Count changed source files
CHANGED_FILES=$(git diff --cached --name-only | grep -E '\.(ts|tsx|js|jsx|py|go|rs)$' | wc -l)

# Check if CLAUDE.md was modified
CLAUDE_MODIFIED=$(git diff --cached --name-only | grep -c 'CLAUDE.md')

if [ "$CHANGED_FILES" -gt 5 ] && [ "$CLAUDE_MODIFIED" -eq 0 ]; then
    echo "⚠️  Warning: Significant code changes detected without CLAUDE.md update"
    echo "   Consider updating the 'Current State' section in CLAUDE.md"
    echo "   To skip this check: git commit --no-verify"
    echo ""
    # Warning only, don't block
    exit 0
fi

exit 0
```

### 5.3 TODO Check Hook

Create `scripts/hooks/check-todos.sh`:

```bash
#!/bin/bash
# Check for TODO/FIXME comments that might indicate incomplete work

# Look for high-priority markers in staged files
CRITICAL_TODOS=$(git diff --cached | grep -E '^\+.*\b(TODO|FIXME|HACK|XXX)\b.*(!|CRITICAL|URGENT|BLOCKING)' || true)

if [ -n "$CRITICAL_TODOS" ]; then
    echo "🔴 Critical TODOs found in staged changes:"
    echo "$CRITICAL_TODOS"
    echo ""
    echo "These should be resolved before committing."
    echo "To override: git commit --no-verify"
    exit 1
fi

# Count regular TODOs (warning only)
TODO_COUNT=$(git diff --cached | grep -cE '^\+.*\b(TODO|FIXME)\b' || true)

if [ "$TODO_COUNT" -gt 3 ]; then
    echo "⚠️  Warning: $TODO_COUNT new TODO/FIXME comments in this commit"
    echo "   Consider addressing these before committing"
fi

exit 0
```

---

## Part VI: CI/CD Integration

### 6.1 GitHub Actions: AI Code Review

Create `.github/workflows/ai-review.yml`:

```yaml
name: AI Code Review

on:
  pull_request:
    types: [opened, synchronize, reopened]
  workflow_dispatch:
    inputs:
      model:
        description: 'Claude model to use'
        required: false
        default: 'claude-sonnet-4-20250514'
        type: choice
        options:
          - claude-sonnet-4-20250514
          - claude-opus-4-20250514
          - claude-3-5-sonnet-20241022
      max_tokens:
        description: 'Maximum tokens for response'
        required: false
        default: '4096'
        type: string
      review_focus:
        description: 'Review focus areas'
        required: false
        default: 'security,bugs,performance,quality'
        type: string

# Configuration - set these as repository variables for easy updates
env:
  DEFAULT_MODEL: ${{ vars.AI_REVIEW_MODEL || 'claude-sonnet-4-20250514' }}
  DEFAULT_MAX_TOKENS: ${{ vars.AI_REVIEW_MAX_TOKENS || '4096' }}
  DIFF_MAX_SIZE: ${{ vars.AI_REVIEW_DIFF_SIZE || '50000' }}

permissions:
  contents: read
  pull-requests: write

jobs:
  ai-review:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Get changed files
        id: changed-files
        uses: tj-actions/changed-files@v44
        with:
          files: |
            **/*.ts
            **/*.tsx
            **/*.js
            **/*.jsx
            **/*.py
            **/*.go
            **/*.rs
            **/*.java
            **/*.rb

      - name: Determine model and parameters
        id: config
        run: |
          # Use workflow dispatch inputs if provided, otherwise defaults
          MODEL="${{ github.event.inputs.model || env.DEFAULT_MODEL }}"
          MAX_TOKENS="${{ github.event.inputs.max_tokens || env.DEFAULT_MAX_TOKENS }}"
          FOCUS="${{ github.event.inputs.review_focus || 'security,bugs,performance,quality' }}"

          echo "model=$MODEL" >> $GITHUB_OUTPUT
          echo "max_tokens=$MAX_TOKENS" >> $GITHUB_OUTPUT
          echo "focus=$FOCUS" >> $GITHUB_OUTPUT

          echo "Using model: $MODEL"
          echo "Max tokens: $MAX_TOKENS"
          echo "Focus areas: $FOCUS"

      - name: AI Code Review
        if: steps.changed-files.outputs.any_changed == 'true'
        uses: actions/github-script@v7
        env:
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
          MODEL: ${{ steps.config.outputs.model }}
          MAX_TOKENS: ${{ steps.config.outputs.max_tokens }}
          FOCUS: ${{ steps.config.outputs.focus }}
          DIFF_LIMIT: ${{ env.DIFF_MAX_SIZE }}
        with:
          script: |
            const { execSync } = require('child_process');

            // Get the diff
            let diff;
            try {
              diff = execSync('git diff origin/main...HEAD -- "*.ts" "*.tsx" "*.js" "*.jsx" "*.py" "*.go" "*.rs" "*.java" "*.rb"', {
                encoding: 'utf-8',
                maxBuffer: 1024 * 1024 * 10
              });
            } catch (error) {
              console.log('Error getting diff, trying alternative:', error.message);
              diff = execSync('git diff HEAD~1...HEAD', {
                encoding: 'utf-8',
                maxBuffer: 1024 * 1024 * 10
              });
            }

            if (!diff.trim()) {
              console.log('No relevant changes to review');
              return;
            }

            const diffLimit = parseInt(process.env.DIFF_LIMIT) || 50000;
            const truncatedDiff = diff.substring(0, diffLimit);
            const wasTruncated = diff.length > diffLimit;

            // Build focus areas from config
            const focusAreas = process.env.FOCUS.split(',').map(f => f.trim());
            const focusPrompt = focusAreas.map((area, i) => `${i+1}. ${area}`).join('\n');

            // Prepare review prompt
            const prompt = `Review this code diff for a pull request. Focus on:
            ${focusPrompt}

            Format your response as:
            ## Summary
            [One sentence summary]

            ## Issues Found
            - 🔴 **Critical**: [issue requiring immediate fix]
            - 🟡 **Warning**: [issue that should be addressed]
            - 🟢 **Suggestion**: [nice-to-have improvement]

            ## Security Checklist
            - [ ] No hardcoded secrets or credentials
            - [ ] Input validation present where needed
            - [ ] No SQL/command injection vulnerabilities
            - [ ] Proper error handling without info leakage

            ## Verdict
            [APPROVE/REQUEST_CHANGES/COMMENT]

            ${wasTruncated ? '**Note: Diff was truncated due to size. Review may be incomplete.**\n\n' : ''}
            Diff:
            \`\`\`diff
            ${truncatedDiff}
            \`\`\``;

            // Call Claude API with configurable model
            const response = await fetch('https://api.anthropic.com/v1/messages', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'x-api-key': process.env.ANTHROPIC_API_KEY,
                'anthropic-version': '2023-06-01'
              },
              body: JSON.stringify({
                model: process.env.MODEL,
                max_tokens: parseInt(process.env.MAX_TOKENS),
                messages: [{ role: 'user', content: prompt }]
              })
            });

            if (!response.ok) {
              const error = await response.text();
              core.setFailed(`API request failed: ${response.status} - ${error}`);
              return;
            }

            const result = await response.json();

            if (!result.content || !result.content[0]) {
              core.setFailed('Invalid API response structure');
              return;
            }

            const review = result.content[0].text;

            // Post review as PR comment
            await github.rest.issues.createComment({
              owner: context.repo.owner,
              repo: context.repo.repo,
              issue_number: context.issue.number,
              body: `## 🤖 AI Code Review\n\n${review}\n\n---\n*Automated review by Claude (${process.env.MODEL})*\n*Focus: ${process.env.FOCUS}*`
            });

      - name: Check for critical issues
        if: steps.changed-files.outputs.any_changed == 'true'
        run: |
          echo "Review complete"
          # To fail on critical issues, uncomment:
          # if grep -q "🔴 \*\*Critical\*\*" review_output.txt; then
          #   echo "Critical issues found!"
          #   exit 1
          # fi
```

**Configuration Variables** (set in repository settings > Variables):

- `AI_REVIEW_MODEL`: Default model (e.g., `claude-sonnet-4-20250514`)
- `AI_REVIEW_MAX_TOKENS`: Maximum response tokens (e.g., `4096`)
- `AI_REVIEW_DIFF_SIZE`: Maximum diff size to analyze (e.g., `50000`)

### 6.2 GitHub Actions: Session Context Preservation

Create `.github/workflows/session-context.yml`:

```yaml
name: Session Context Management

on:
  push:
    branches: [main, develop]
    paths:
      - 'src/**'
      - 'lib/**'
      - 'app/**'

jobs:
  update-context:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4
        with:
          fetch-depth: 10

      - name: Generate context update
        run: |
          # Get recent commit summaries
          echo "## Recent Changes" > .tmp-context.md
          echo "" >> .tmp-context.md
          git log --oneline -10 >> .tmp-context.md

          # Get changed files summary
          echo "" >> .tmp-context.md
          echo "## Files Changed (last 10 commits)" >> .tmp-context.md
          git diff --stat HEAD~10..HEAD >> .tmp-context.md 2>/dev/null || true

          # Store as artifact for next session
          mkdir -p docs/session-notes
          DATE=$(date +%Y-%m-%d)
          mv .tmp-context.md "docs/session-notes/${DATE}-auto-context.md"

      - name: Commit context update
        run: |
          git config user.name "GitHub Actions"
          git config user.email "actions@github.com"
          git add docs/session-notes/
          git diff --staged --quiet || git commit -m "docs: auto-update session context"
          git push || true
```

---

## Part VII: Custom MCP Server

### 7.1 Project Memory MCP Server

Create `scripts/mcp/project-memory-server.py`:

````python
#!/usr/bin/env python3
"""
Project Memory MCP Server
Provides persistent memory specific to this project.
"""

import json
import os
from datetime import datetime
from pathlib import Path
from mcp.server import Server
from mcp.server.stdio import stdio_server
from mcp.types import Tool, TextContent

# Storage location
MEMORY_FILE = Path.home() / ".claude" / "project-memories" / f"{Path.cwd().name}.json"

def load_memory():
    """Load memory from disk."""
    if MEMORY_FILE.exists():
        with open(MEMORY_FILE) as f:
            return json.load(f)
    return {"decisions": [], "context": {}, "patterns": []}

def save_memory(memory):
    """Save memory to disk."""
    MEMORY_FILE.parent.mkdir(parents=True, exist_ok=True)
    with open(MEMORY_FILE, "w") as f:
        json.dump(memory, f, indent=2)

# Initialize server
server = Server("project-memory")

@server.list_tools()
async def list_tools():
    return [
        Tool(
            name="remember_decision",
            description="Store a decision and its rationale for future sessions",
            inputSchema={
                "type": "object",
                "properties": {
                    "decision": {"type": "string", "description": "The decision made"},
                    "rationale": {"type": "string", "description": "Why this decision was made"},
                    "context": {"type": "string", "description": "What problem this solved"},
                    "alternatives": {"type": "string", "description": "Other options considered"}
                },
                "required": ["decision", "rationale"]
            }
        ),
        Tool(
            name="recall_decisions",
            description="Retrieve past decisions, optionally filtered by keyword",
            inputSchema={
                "type": "object",
                "properties": {
                    "keyword": {"type": "string", "description": "Optional keyword to filter by"}
                }
            }
        ),
        Tool(
            name="store_pattern",
            description="Store a code pattern or convention for this project",
            inputSchema={
                "type": "object",
                "properties": {
                    "name": {"type": "string", "description": "Pattern name"},
                    "description": {"type": "string", "description": "What this pattern does"},
                    "example": {"type": "string", "description": "Code example"},
                    "when_to_use": {"type": "string", "description": "When to apply this pattern"}
                },
                "required": ["name", "description"]
            }
        ),
        Tool(
            name="get_patterns",
            description="Retrieve stored patterns for this project",
            inputSchema={
                "type": "object",
                "properties": {}
            }
        ),
        Tool(
            name="set_context",
            description="Store contextual information (key-value)",
            inputSchema={
                "type": "object",
                "properties": {
                    "key": {"type": "string"},
                    "value": {"type": "string"}
                },
                "required": ["key", "value"]
            }
        ),
        Tool(
            name="get_context",
            description="Retrieve all stored context",
            inputSchema={
                "type": "object",
                "properties": {}
            }
        )
    ]

@server.call_tool()
async def call_tool(name: str, arguments: dict):
    memory = load_memory()

    if name == "remember_decision":
        decision = {
            "timestamp": datetime.now().isoformat(),
            "decision": arguments["decision"],
            "rationale": arguments["rationale"],
            "context": arguments.get("context", ""),
            "alternatives": arguments.get("alternatives", "")
        }
        memory["decisions"].append(decision)
        save_memory(memory)
        return [TextContent(type="text", text=f"✓ Decision stored: {arguments['decision'][:50]}...")]

    elif name == "recall_decisions":
        decisions = memory["decisions"]
        keyword = arguments.get("keyword", "").lower()
        if keyword:
            decisions = [d for d in decisions if keyword in d["decision"].lower() or keyword in d["rationale"].lower()]

        if not decisions:
            return [TextContent(type="text", text="No matching decisions found.")]

        output = "## Stored Decisions\n\n"
        for d in decisions[-10:]:  # Last 10
            output += f"### {d['timestamp'][:10]}\n"
            output += f"**Decision**: {d['decision']}\n"
            output += f"**Rationale**: {d['rationale']}\n\n"

        return [TextContent(type="text", text=output)]

    elif name == "store_pattern":
        pattern = {
            "name": arguments["name"],
            "description": arguments["description"],
            "example": arguments.get("example", ""),
            "when_to_use": arguments.get("when_to_use", "")
        }
        # Update or add
        memory["patterns"] = [p for p in memory["patterns"] if p["name"] != pattern["name"]]
        memory["patterns"].append(pattern)
        save_memory(memory)
        return [TextContent(type="text", text=f"✓ Pattern stored: {arguments['name']}")]

    elif name == "get_patterns":
        if not memory["patterns"]:
            return [TextContent(type="text", text="No patterns stored yet.")]

        output = "## Project Patterns\n\n"
        for p in memory["patterns"]:
            output += f"### {p['name']}\n"
            output += f"{p['description']}\n"
            if p.get("example"):
                output += f"```\n{p['example']}\n```\n"
            output += "\n"

        return [TextContent(type="text", text=output)]

    elif name == "set_context":
        memory["context"][arguments["key"]] = arguments["value"]
        save_memory(memory)
        return [TextContent(type="text", text=f"✓ Context set: {arguments['key']}")]

    elif name == "get_context":
        if not memory["context"]:
            return [TextContent(type="text", text="No context stored yet.")]

        output = "## Project Context\n\n"
        for k, v in memory["context"].items():
            output += f"**{k}**: {v}\n"

        return [TextContent(type="text", text=output)]

    return [TextContent(type="text", text=f"Unknown tool: {name}")]

async def main():
    async with stdio_server() as (read_stream, write_stream):
        await server.run(read_stream, write_stream)

if __name__ == "__main__":
    import asyncio
    asyncio.run(main())
````

### 7.2 MCP Server Configuration

Add to Claude Code settings (`~/.claude/settings.json`):

```json
{
  "mcpServers": {
    "project-memory": {
      "command": "python3",
      "args": ["./scripts/mcp/project-memory-server.py"],
      "env": {}
    },
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "./"]
    },
    "memory": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-memory"]
    }
  }
}
```

---

## Part VIII: Multi-Agent Orchestration

### 8.1 Orchestrator Skill

Create `.claude/commands/orchestrate.md`:

```markdown
---
description: Multi-agent orchestration for complex tasks
---

# Orchestration Mode

For complex tasks, use multiple specialized agents.

## Task: $ARGUMENTS

## Orchestration Protocol

### Phase 1: Planning

Use the Plan subagent to:

1. Analyze the task requirements
2. Break into subtasks
3. Identify which specialists are needed

### Phase 2: Parallel Exploration

Launch exploration agents in parallel to:

- Map relevant codebase areas
- Identify patterns and conventions
- Gather necessary context

### Phase 3: Implementation

For each implementation subtask:

1. Implement in isolated context
2. Pass to reviewer agent
3. Address feedback
4. Verify completion

### Phase 4: Integration

1. Combine implemented pieces
2. Run integration tests
3. Verify end-to-end functionality

### Phase 5: Final Review

Use reviewer agent for final pass:

- Fresh perspective review
- Security check
- Performance review

## Agent Assignments
```

Orchestrator (Main)
├── Planner Agent → Requirements analysis, task breakdown
├── Explorer Agent(s) → Context gathering (parallel)
├── Implementer Agent(s) → Code implementation (parallel where possible)
├── Reviewer Agent → Code review (sequential after each implementation)
├── Tester Agent → Test generation and verification
└── Orchestrator → Integration and final assembly

```

## Rules

1. **Orchestrator stays meta-level** - coordinate, don't implement
2. **Each agent gets focused context** - only what they need
3. **Verification between phases** - don't proceed without confirmation
4. **Preserve original intent** - refer back to initial requirements
```

### 8.2 Parallel Implementation Pattern

Create `.claude/commands/parallel-implement.md`:

```markdown
---
description: Parallel implementation of independent components
---

# Parallel Implementation

Implement independent components in parallel using subagents.

## Components to implement: $ARGUMENTS

## Protocol

### 1. Dependency Analysis

First, analyze which components can be implemented in parallel:

- Components with no dependencies on each other → PARALLEL
- Components that depend on others → SEQUENTIAL

### 2. Interface Definition

Before parallel implementation:

- Define interfaces between components
- Establish data contracts
- Document expected behaviors

### 3. Parallel Execution

Launch implementation agents in parallel:
```

Component A ──┐
Component B ──┼──► Integration
Component C ──┘

```

Each agent receives:
- Component specification
- Interface contracts
- Relevant patterns from codebase
- Isolated context

### 4. Integration
After parallel implementation:
- Combine components
- Verify interface contracts are met
- Run integration tests

### 5. Verification
- Each component reviewed independently
- Integration reviewed as whole
- End-to-end testing

## Output

Track progress:
```

## Parallel Implementation Status

### Components

| Component | Agent  | Status         | Notes        |
| --------- | ------ | -------------- | ------------ |
| A         | impl-1 | ✓ Complete     |              |
| B         | impl-2 | 🔄 In Progress |              |
| C         | impl-3 | ⏳ Pending     | Blocked by B |

### Integration

[ ] Interfaces verified
[ ] Components combined
[ ] Integration tests pass

```

```

---

## Part IX: Templates & Checklists

### 9.1 Session Start Checklist

Create `docs/checklists/session-start.md`:

```markdown
# Session Start Checklist

## Before Starting Work

### 1. Context Loading

- [ ] Read CLAUDE.md completely
- [ ] Check `docs/session-notes/` for recent handoffs
- [ ] Review any open PRs or issues

### 2. Environment Verification

- [ ] Run `npm install` (or equivalent)
- [ ] Run `npm test` - baseline should pass
- [ ] Run `npm run build` - should succeed

### 3. Goal Clarification

- [ ] What is the primary objective?
- [ ] What does "done" look like?
- [ ] What are the constraints?

### 4. Context Statement

Provide to Claude:
```

Session context:

- Continuing from: [previous session summary or "fresh start"]
- Primary goal: [objective]
- Constraints: [any limitations]
- Time sensitivity: [urgent/normal/exploration]
- Autonomy level: [proceed freely / check before X / ask for everything]

```

### 5. Tool Verification
- [ ] MCP servers connected (if applicable)
- [ ] Hooks configured
- [ ] Test commands work
```

### 9.2 Task Completion Checklist

Create `docs/checklists/task-complete.md`:

```markdown
# Task Completion Checklist

## Before Declaring a Task Complete

### Functionality

- [ ] All specified requirements implemented
- [ ] Code runs without errors
- [ ] Happy path works end-to-end
- [ ] Error cases handled appropriately
- [ ] Edge cases considered

### Testing

- [ ] Unit tests written for new code
- [ ] Existing tests still pass
- [ ] Integration tested if applicable
- [ ] Manual testing performed

### Quality

- [ ] Code follows project conventions
- [ ] No linter errors
- [ ] No TypeScript errors
- [ ] No console.logs or debug code
- [ ] Comments for complex logic

### Documentation

- [ ] README updated if needed
- [ ] API docs updated if applicable
- [ ] CLAUDE.md "Current State" updated
- [ ] Complex decisions documented

### Integration

- [ ] All imports resolve
- [ ] Configuration updated
- [ ] Environment variables documented
- [ ] Dependencies added to package.json

### Verification

- [ ] Ran `/verify` command
- [ ] Two-pass rule: second pass found only cosmetic issues
- [ ] Would I be confident merging this?

## Final Step

- [ ] Commit with descriptive message
- [ ] Update task tracking
```

### 9.3 Assumption Documentation Template

Create `docs/templates/assumptions.md`:

```markdown
# Assumptions Document

## Feature/Task: [NAME]

## Date: [DATE]

## Explicit Assumptions

| #   | Assumption | Confidence   | Impact if Wrong | Verified? |
| --- | ---------- | ------------ | --------------- | --------- |
| 1   |            | High/Med/Low |                 | [ ]       |
| 2   |            |              |                 | [ ]       |

## Implicit Assumptions (surfaced)

| #   | Assumption | Why I Almost Missed It |
| --- | ---------- | ---------------------- |
| 1   |            |                        |

## Questions I Chose Not to Ask

| Question | Why I Skipped It | Should I Have Asked? |
| -------- | ---------------- | -------------------- |
|          |                  |                      |

## Decision Points

| Decision | Options Considered | Choice Made | Rationale |
| -------- | ------------------ | ----------- | --------- |
|          |                    |             |           |

## Risks Identified

| Risk | Likelihood | Impact | Mitigation |
| ---- | ---------- | ------ | ---------- |
|      |            |        |            |

## Review

- [ ] Assumptions reviewed with stakeholder
- [ ] High-impact assumptions verified
- [ ] Risks accepted or mitigated
```

---

## Part X: Quick Start Guide

### Minimum Viable Setup (15 minutes)

```bash
# 1. Create directory structure
mkdir -p .claude/commands .claude/agents docs/session-notes scripts/hooks

# 2. Create CLAUDE.md (use template from section 1.2)
touch CLAUDE.md

# 3. Create essential slash commands
# Copy plan.md, verify.md, handoff.md from Part III

# 4. Install pre-commit
pip install pre-commit
# Copy .pre-commit-config.yaml from section 5.1
pre-commit install

# 5. Make hook scripts executable
chmod +x scripts/hooks/*.sh

# 6. Test setup
claude  # Start Claude Code
/plan test the setup is working
```

### Full Setup (1 hour)

1. Complete Minimum Viable Setup
2. Add all slash commands from Part III
3. Add all subagents from Part IV
4. Configure hooks from Part II
5. Set up CI/CD from Part VI
6. (Optional) Deploy MCP server from Part VII

### Team Adoption

1. Check `.claude/` directory into version control
2. Add `CLAUDE.local.md` and `.claude/settings.local.json` to `.gitignore`
3. Document team conventions in CLAUDE.md
4. Share session handoff notes via `docs/session-notes/`
5. Use consistent slash commands across team

---

## Maintenance

### Weekly

- [ ] Review and clean `docs/session-notes/`
- [ ] Update CLAUDE.md "Current State"
- [ ] Check for new slash command needs

### Monthly

- [ ] Audit MCP server memory
- [ ] Review which commands are actually used
- [ ] Update templates based on learnings

### Per Major Release

- [ ] Full CLAUDE.md review and update
- [ ] Architecture documentation refresh
- [ ] Pattern library update

---

_Last updated: December 2025_
_Companion to: "Mitigating AI-Assisted Development Friction"_

## Sources

- [Claude Code Slash Commands](https://code.claude.com/docs/en/slash-commands)
- [Claude Code Subagents](https://code.claude.com/docs/en/sub-agents)
- [Building MCP Servers](https://modelcontextprotocol.io/docs/develop/build-server)
- [GitHub Blog: Building MCP Servers](https://github.blog/ai-and-ml/github-copilot/building-your-first-mcp-server-how-to-extend-ai-tools-with-custom-capabilities/)
- [Pre-commit Framework](https://pre-commit.com/)
- [GitHub Actions AI Review](https://github.com/marketplace/actions/ai-code-review-action)
- [Multi-Agent Orchestration](https://dev.to/bredmond1019/multi-agent-orchestration-running-10-claude-instances-in-parallel-part-3-29da)
- [Claude Code Orchestration Guide](https://www.augmentedswe.com/p/claude-code-orchestration)
- [Claude Skill Factory](https://github.com/alirezarezvani/claude-code-skill-factory)
- [Session Management APIs](https://aws.amazon.com/blogs/machine-learning/amazon-bedrock-launches-session-management-apis-for-generative-ai-applications-preview/)
