#!/bin/bash
#
# CLAUDE.md Validation Hook
#
# Validates CLAUDE.md structure and content quality.
# Warns when significant code changes occur without CLAUDE.md updates.
#
# Usage: Called as git pre-commit hook
#
# Exit codes:
#   0 - Success or warning only
#   1 - Error (blocks commit)
#

set -euo pipefail

# Colors for output
RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
GRAY='\033[0;90m'
NC='\033[0m' # No Color

# Configuration
CLAUDE_MD="CLAUDE.md"
REQUIRED_SECTIONS=(
    "## Overview"
    "## Tech Stack"
    "## Current State"
)
RECOMMENDED_SECTIONS=(
    "## Architecture"
    "## Conventions"
    "## Common Commands"
    "## Session Instructions"
)
MAX_SIZE_KB=100  # Warn if larger than 100KB

warnings=0
errors=0

# Helper functions
warn() {
    echo -e "${YELLOW}⚠️  Warning: $1${NC}"
    warnings=$((warnings + 1))
}

error() {
    echo -e "${RED}✗ Error: $1${NC}"
    errors=$((errors + 1))
}

success() {
    echo -e "${GREEN}✓ $1${NC}"
}

info() {
    echo -e "${GRAY}ℹ️  $1${NC}"
}

# Check if CLAUDE.md exists
if [ ! -f "$CLAUDE_MD" ]; then
    warn "CLAUDE.md not found in project root"
    info "Create with: npx ai-excellence init"
    exit 0
fi

# Check file size
file_size=$(stat -f%z "$CLAUDE_MD" 2>/dev/null || stat -c%s "$CLAUDE_MD" 2>/dev/null || echo "0")
file_size_kb=$((file_size / 1024))

if [ "$file_size_kb" -gt "$MAX_SIZE_KB" ]; then
    warn "CLAUDE.md is ${file_size_kb}KB (recommended: <${MAX_SIZE_KB}KB)"
    info "Large files may cause context issues. Consider splitting into separate docs."
fi

# Read file content
content=$(cat "$CLAUDE_MD")

# Check required sections
for section in "${REQUIRED_SECTIONS[@]}"; do
    if ! echo "$content" | grep -qi "^$section"; then
        warn "Missing required section: $section"
    fi
done

# Check recommended sections (info only)
missing_recommended=()
for section in "${RECOMMENDED_SECTIONS[@]}"; do
    if ! echo "$content" | grep -qi "^$section"; then
        missing_recommended+=("$section")
    fi
done

if [ ${#missing_recommended[@]} -gt 0 ]; then
    info "Consider adding: ${missing_recommended[*]}"
fi

# Check for potential secrets
secret_patterns=(
    'password\s*[:=]\s*["'"'"'][^"'"'"']{8,}["'"'"']'
    'api[_-]?key\s*[:=]\s*["'"'"'][^"'"'"']{16,}["'"'"']'
    'secret\s*[:=]\s*["'"'"'][^"'"'"']{8,}["'"'"']'
    'sk-[a-zA-Z0-9]{32,}'
    'ghp_[a-zA-Z0-9]{36}'
    'gho_[a-zA-Z0-9]{36}'
    'glpat-[a-zA-Z0-9\-]{20}'
    'AKIA[0-9A-Z]{16}'
    '-----BEGIN (RSA |EC |DSA )?PRIVATE KEY-----'
)

for pattern in "${secret_patterns[@]}"; do
    if echo "$content" | grep -qiE "$pattern"; then
        error "Potential secret detected in CLAUDE.md!"
        info "Move secrets to environment variables or secret manager"
    fi
done

# Check for placeholder text that should be filled in
placeholders=(
    '\[Brief description'
    '\[specify\]'
    '\[Add decisions here\]'
    '\[Date\]: \[Decision'
)

placeholder_count=0
for pattern in "${placeholders[@]}"; do
    if echo "$content" | grep -qiE "$pattern"; then
        placeholder_count=$((placeholder_count + 1))
    fi
done

if [ "$placeholder_count" -gt 2 ]; then
    warn "Multiple placeholder texts found - consider filling them in"
fi

# Check for stale "Current State" section
if echo "$content" | grep -qi "## Current State"; then
    # Look for common staleness indicators
    if echo "$content" | grep -qiE "(initial setup|todo|placeholder|coming soon)" | grep -i "current state" -A5; then
        info "Consider updating the 'Current State' section with actual status"
    fi
fi

# Check if significant code changes were made without updating CLAUDE.md
if git rev-parse --git-dir > /dev/null 2>&1; then
    # In a git repository, check staged changes
    CHANGED_FILES=$(git diff --cached --name-only 2>/dev/null | grep -E '\.(ts|tsx|js|jsx|py|go|rs|rb|java|kt|swift|c|cpp|h)$' | wc -l || echo "0")
    CLAUDE_MODIFIED=$(git diff --cached --name-only 2>/dev/null | grep -c 'CLAUDE.md' || echo "0")

    if [ "$CHANGED_FILES" -gt 5 ] && [ "$CLAUDE_MODIFIED" -eq 0 ]; then
        warn "Significant code changes ($CHANGED_FILES files) without CLAUDE.md update"
        info "Consider updating the 'Current State' section"
    fi

    # Check for new files in important directories
    NEW_FILES=$(git diff --cached --name-only --diff-filter=A 2>/dev/null | wc -l || echo "0")
    if [ "$NEW_FILES" -gt 3 ] && [ "$CLAUDE_MODIFIED" -eq 0 ]; then
        info "Multiple new files added - consider documenting in CLAUDE.md"
    fi
fi

# Summary
echo ""
if [ "$errors" -gt 0 ]; then
    echo -e "${RED}CLAUDE.md validation failed with $errors error(s)${NC}"
    echo "To skip this check: git commit --no-verify"
    exit 1
elif [ "$warnings" -gt 0 ]; then
    echo -e "${YELLOW}CLAUDE.md validation passed with $warnings warning(s)${NC}"
    exit 0
else
    success "CLAUDE.md validation passed"
    exit 0
fi
