# Git Hooks

Pre-commit hooks provide automated quality gates for AI-generated code. They catch issues before code enters the repository.

## Why Hooks for AI Code?

AI-generated code has specific risks that hooks address:

| Risk | Hook Solution |
|------|---------------|
| Hallucinated packages | `verify-deps.sh` |
| Security vulnerabilities | `gitleaks`, security scanners |
| Incomplete work | `check-todos.sh` |
| CLAUDE.md drift | `check-claude-md.sh` |
| Formatting inconsistency | `post-edit.sh` |

## Quick Setup

### 1. Install pre-commit

```bash
pip install pre-commit
```

### 2. Create Configuration

Create `.pre-commit-config.yaml`:

```yaml
repos:
  # Framework hooks
  - repo: local
    hooks:
      - id: verify-deps
        name: Verify dependencies exist
        entry: scripts/hooks/verify-deps.sh
        language: script
        files: package\.json$

      - id: check-todos
        name: Check for critical TODOs
        entry: scripts/hooks/check-todos.sh
        language: script

      - id: check-claude-md
        name: Validate CLAUDE.md
        entry: scripts/hooks/check-claude-md.sh
        language: script
        files: CLAUDE\.md$

  # Security scanning
  - repo: https://github.com/gitleaks/gitleaks
    rev: v8.18.0
    hooks:
      - id: gitleaks

  # Standard checks
  - repo: https://github.com/pre-commit/pre-commit-hooks
    rev: v4.5.0
    hooks:
      - id: trailing-whitespace
      - id: end-of-file-fixer
      - id: check-yaml
      - id: check-json
      - id: check-added-large-files
```

### 3. Install Hooks

```bash
pre-commit install
```

## Framework Hooks

### verify-deps.sh

**Purpose:** Prevent slopsquatting by validating packages exist.

**What it does:**
1. Extracts package names from package.json
2. Checks npm registry for existence
3. Blocks commit if any package doesn't exist

**Why it matters:** ~20% of AI package suggestions don't exist. Attackers register malicious packages with hallucinated names.

### check-todos.sh

**Purpose:** Detect incomplete work before commit.

**What it does:**
1. Scans staged files for TODO/FIXME
2. Warns if >3 new TODOs added
3. Blocks commit for critical TODOs

**Configuration:**
```bash
# In script or environment
TODO_THRESHOLD=3
CRITICAL_PATTERNS="TODO:CRITICAL|FIXME:BLOCKING"
```

### check-claude-md.sh

**Purpose:** Keep CLAUDE.md healthy.

**What it does:**
1. Validates required sections exist
2. Detects placeholder text
3. Warns on hardcoded secrets
4. Checks file length

**Checks:**
- Has Tech Stack section
- Has Architecture section
- No `[placeholder]` text
- No API keys or secrets
- Under 300 lines (warning)

### post-edit.sh

**Purpose:** Auto-format after edits.

**What it does:**
1. Runs Prettier on JS/JSON/MD
2. Runs Black/Ruff on Python
3. Applies consistent style

## Security Hooks

### Gitleaks

Detects secrets and credentials:

```yaml
- repo: https://github.com/gitleaks/gitleaks
  rev: v8.18.0
  hooks:
    - id: gitleaks
```

### detect-secrets

Alternative secret detection:

```yaml
- repo: https://github.com/Yelp/detect-secrets
  rev: v1.4.0
  hooks:
    - id: detect-secrets
```

### npm audit

Check for vulnerable dependencies:

```yaml
- repo: local
  hooks:
    - id: npm-audit
      name: Check npm vulnerabilities
      entry: npm audit --audit-level=high
      language: system
      pass_filenames: false
```

## Quality Hooks

### ESLint

```yaml
- repo: local
  hooks:
    - id: eslint
      name: ESLint
      entry: npx eslint --fix
      language: system
      types: [javascript, typescript]
```

### TypeScript

```yaml
- repo: local
  hooks:
    - id: tsc
      name: TypeScript check
      entry: npx tsc --noEmit
      language: system
      pass_filenames: false
```

### Tests

```yaml
- repo: local
  hooks:
    - id: test
      name: Run tests
      entry: npm test
      language: system
      pass_filenames: false
      stages: [push]  # Only on push, not every commit
```

## Custom Hooks

Create project-specific hooks:

```bash
#!/bin/bash
# scripts/hooks/check-migrations.sh

# Ensure migrations are sequential
MIGRATIONS=$(ls db/migrations/*.sql | sort)
EXPECTED=1

for file in $MIGRATIONS; do
  NUM=$(basename "$file" | cut -d'_' -f1)
  if [ "$NUM" != "$EXPECTED" ]; then
    echo "Migration gap: expected $EXPECTED, found $NUM"
    exit 1
  fi
  EXPECTED=$((EXPECTED + 1))
done
```

Add to config:

```yaml
- repo: local
  hooks:
    - id: check-migrations
      name: Check migration sequence
      entry: scripts/hooks/check-migrations.sh
      language: script
      files: db/migrations/.*\.sql$
```

## Bypass (When Needed)

```bash
# Skip all hooks (use sparingly)
git commit --no-verify -m "Emergency fix"

# Skip specific hook
SKIP=verify-deps git commit -m "Known new package"
```

## Evidence

| Source | Finding |
|--------|---------|
| [Veracode](https://www.veracode.com/blog/genai-code-security-report/) | 45% of AI code has vulnerabilities |
| [Slopsquatting](https://www.bleepingcomputer.com/news/security/ai-hallucinated-code-dependencies-become-new-supply-chain-risk/) | 20% package hallucination rate |
| [OWASP](https://genai.owasp.org/) | Pre-commit scanning recommended |

## Best Practices

1. **Start small** — Begin with security hooks, add quality hooks gradually
2. **Fast hooks first** — Slow hooks frustrate developers
3. **Push-only for slow checks** — Tests on push, linting on commit
4. **Document bypasses** — When and why hooks can be skipped
5. **Team agreement** — Everyone uses the same hooks
