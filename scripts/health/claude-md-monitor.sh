#!/bin/bash
# CLAUDE.md Health Monitor
# Checks CLAUDE.md for common issues and provides recommendations
#
# Usage: ./claude-md-monitor.sh [--fix] [--json] [--quiet]
#
# Options:
#   --fix    Automatically fix simple issues
#   --json   Output results as JSON
#   --quiet  Only output errors

set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
CLAUDE_MD="${CLAUDE_MD:-CLAUDE.md}"
MAX_SIZE_KB="${MAX_SIZE_KB:-50}"
MAX_AGE_DAYS="${MAX_AGE_DAYS:-7}"
AUTO_FIX=false
JSON_OUTPUT=false
QUIET=false

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --fix)
            AUTO_FIX=true
            shift
            ;;
        --json)
            JSON_OUTPUT=true
            shift
            ;;
        --quiet)
            QUIET=true
            shift
            ;;
        *)
            shift
            ;;
    esac
done

# Check functions
declare -a ISSUES=()
declare -a WARNINGS=()
declare -a PASSES=()
declare -a FIXES=()

log() {
    if [[ "$QUIET" == "false" && "$JSON_OUTPUT" == "false" ]]; then
        echo -e "$1"
    fi
}

add_issue() {
    ISSUES+=("$1")
}

add_warning() {
    WARNINGS+=("$1")
}

add_pass() {
    PASSES+=("$1")
}

add_fix() {
    FIXES+=("$1")
}

# Check: File exists
check_exists() {
    if [[ -f "$CLAUDE_MD" ]]; then
        add_pass "CLAUDE.md exists"
        return 0
    else
        add_issue "CLAUDE.md not found"
        return 1
    fi
}

# Check: File size
check_size() {
    if [[ ! -f "$CLAUDE_MD" ]]; then
        return 1
    fi

    local size_kb
    size_kb=$(du -k "$CLAUDE_MD" | cut -f1)

    if [[ $size_kb -gt $MAX_SIZE_KB ]]; then
        add_warning "CLAUDE.md is ${size_kb}KB (recommended: <${MAX_SIZE_KB}KB)"
    else
        add_pass "File size OK (${size_kb}KB)"
    fi
}

# Check: File freshness
check_freshness() {
    if [[ ! -f "$CLAUDE_MD" ]]; then
        return 1
    fi

    local mod_time now_time age_days
    mod_time=$(stat -c %Y "$CLAUDE_MD" 2>/dev/null || stat -f %m "$CLAUDE_MD")
    now_time=$(date +%s)
    age_days=$(( (now_time - mod_time) / 86400 ))

    if [[ $age_days -gt $MAX_AGE_DAYS ]]; then
        add_warning "CLAUDE.md is ${age_days} days old (consider updating Current State)"
    else
        add_pass "Recently updated (${age_days} days ago)"
    fi
}

# Check: Required sections
check_required_sections() {
    if [[ ! -f "$CLAUDE_MD" ]]; then
        return 1
    fi

    local content
    content=$(cat "$CLAUDE_MD")

    local required_sections=("## Overview" "## Tech Stack" "## Current State")
    local missing=()

    for section in "${required_sections[@]}"; do
        if ! grep -qi "$section" "$CLAUDE_MD"; then
            missing+=("$section")
        fi
    done

    if [[ ${#missing[@]} -eq 0 ]]; then
        add_pass "All required sections present"
    else
        for m in "${missing[@]}"; do
            add_issue "Missing required section: $m"
        done
    fi
}

# Check: Recommended sections
check_recommended_sections() {
    if [[ ! -f "$CLAUDE_MD" ]]; then
        return 1
    fi

    local recommended_sections=("## Architecture" "## Conventions" "## Common Commands" "## Session Instructions")
    local missing=()

    for section in "${recommended_sections[@]}"; do
        if ! grep -qi "$section" "$CLAUDE_MD"; then
            missing+=("$section")
        fi
    done

    if [[ ${#missing[@]} -eq 0 ]]; then
        add_pass "All recommended sections present"
    else
        for m in "${missing[@]}"; do
            add_warning "Consider adding: $m"
        done
    fi
}

# Check: No hardcoded secrets
check_secrets() {
    if [[ ! -f "$CLAUDE_MD" ]]; then
        return 1
    fi

    local patterns=(
        'password\s*[:=]\s*["\x27][^"\x27]{8,}["\x27]'
        'api[_-]?key\s*[:=]\s*["\x27][^"\x27]{16,}["\x27]'
        'secret\s*[:=]\s*["\x27][^"\x27]{8,}["\x27]'
        'sk-[a-zA-Z0-9]{32,}'
        'ghp_[a-zA-Z0-9]{36}'
        '-----BEGIN.*PRIVATE KEY-----'
    )

    local found_secret=false
    for pattern in "${patterns[@]}"; do
        if grep -qiE "$pattern" "$CLAUDE_MD" 2>/dev/null; then
            found_secret=true
            break
        fi
    done

    if [[ "$found_secret" == "true" ]]; then
        add_issue "Potential hardcoded secret detected"
    else
        add_pass "No obvious secrets detected"
    fi
}

# Check: Trailing whitespace
check_trailing_whitespace() {
    if [[ ! -f "$CLAUDE_MD" ]]; then
        return 1
    fi

    if grep -q '[[:space:]]$' "$CLAUDE_MD"; then
        if [[ "$AUTO_FIX" == "true" ]]; then
            sed -i 's/[[:space:]]*$//' "$CLAUDE_MD"
            add_fix "Removed trailing whitespace"
        else
            add_warning "Trailing whitespace found (run with --fix to remove)"
        fi
    else
        add_pass "No trailing whitespace"
    fi
}

# Check: Final newline
check_final_newline() {
    if [[ ! -f "$CLAUDE_MD" ]]; then
        return 1
    fi

    if [[ -n "$(tail -c 1 "$CLAUDE_MD")" ]]; then
        if [[ "$AUTO_FIX" == "true" ]]; then
            echo "" >> "$CLAUDE_MD"
            add_fix "Added final newline"
        else
            add_warning "Missing final newline (run with --fix to add)"
        fi
    else
        add_pass "Has final newline"
    fi
}

# Check: TODO items
check_todos() {
    if [[ ! -f "$CLAUDE_MD" ]]; then
        return 1
    fi

    local todo_count
    todo_count=$(grep -ciE '\btodo\b|\bfixme\b|\bhack\b' "$CLAUDE_MD" || echo 0)

    if [[ $todo_count -gt 0 ]]; then
        add_warning "${todo_count} TODO/FIXME items found"
    else
        add_pass "No unresolved TODOs"
    fi
}

# Check: Placeholder text
check_placeholders() {
    if [[ ! -f "$CLAUDE_MD" ]]; then
        return 1
    fi

    local placeholders=(
        '\[your'
        '\[insert'
        '\[add'
        '\[specify'
        '\[describe'
        'lorem ipsum'
        'example\.com'
    )

    local found=false
    for pattern in "${placeholders[@]}"; do
        if grep -qiE "$pattern" "$CLAUDE_MD" 2>/dev/null; then
            found=true
            break
        fi
    done

    if [[ "$found" == "true" ]]; then
        add_warning "Placeholder text found - consider replacing with actual content"
    else
        add_pass "No placeholder text found"
    fi
}

# Output results
output_results() {
    if [[ "$JSON_OUTPUT" == "true" ]]; then
        echo "{"
        echo "  \"file\": \"$CLAUDE_MD\","
        echo "  \"timestamp\": \"$(date -Iseconds)\","
        echo "  \"passes\": $(printf '%s\n' "${PASSES[@]}" | jq -R . | jq -s .),"
        echo "  \"warnings\": $(printf '%s\n' "${WARNINGS[@]}" | jq -R . | jq -s .),"
        echo "  \"issues\": $(printf '%s\n' "${ISSUES[@]}" | jq -R . | jq -s .),"
        echo "  \"fixes\": $(printf '%s\n' "${FIXES[@]}" | jq -R . | jq -s .),"
        echo "  \"healthy\": ${#ISSUES[@]} == 0"
        echo "}"
        return
    fi

    log ""
    log "${BLUE}CLAUDE.md Health Check${NC}"
    log "========================"
    log ""

    if [[ ${#PASSES[@]} -gt 0 ]]; then
        log "${GREEN}Passed:${NC}"
        for p in "${PASSES[@]}"; do
            log "  ${GREEN}✓${NC} $p"
        done
        log ""
    fi

    if [[ ${#WARNINGS[@]} -gt 0 ]]; then
        log "${YELLOW}Warnings:${NC}"
        for w in "${WARNINGS[@]}"; do
            log "  ${YELLOW}⚠${NC} $w"
        done
        log ""
    fi

    if [[ ${#ISSUES[@]} -gt 0 ]]; then
        log "${RED}Issues:${NC}"
        for i in "${ISSUES[@]}"; do
            log "  ${RED}✗${NC} $i"
        done
        log ""
    fi

    if [[ ${#FIXES[@]} -gt 0 ]]; then
        log "${GREEN}Auto-fixed:${NC}"
        for f in "${FIXES[@]}"; do
            log "  ${GREEN}🔧${NC} $f"
        done
        log ""
    fi

    # Summary
    local total=$((${#PASSES[@]} + ${#WARNINGS[@]} + ${#ISSUES[@]}))
    log "Summary: ${#PASSES[@]}/${total} checks passed"

    if [[ ${#ISSUES[@]} -eq 0 ]]; then
        log "${GREEN}✓ CLAUDE.md is healthy!${NC}"
    elif [[ ${#ISSUES[@]} -gt 0 ]]; then
        log "${RED}✗ CLAUDE.md has issues that need attention${NC}"
    else
        log "${YELLOW}⚠ CLAUDE.md has warnings to review${NC}"
    fi
    log ""
}

# Main
main() {
    check_exists || exit 1
    check_size
    check_freshness
    check_required_sections
    check_recommended_sections
    check_secrets
    check_trailing_whitespace
    check_final_newline
    check_todos
    check_placeholders

    output_results

    # Exit code
    if [[ ${#ISSUES[@]} -gt 0 ]]; then
        exit 1
    else
        exit 0
    fi
}

main
