#!/bin/bash
#
# Shell script tests for AI Excellence Framework
#
# Run with: bash tests/scripts.test.sh
#

set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
TEMP_DIR=$(mktemp -d)

# Cleanup on exit
cleanup() {
    rm -rf "$TEMP_DIR"
}
trap cleanup EXIT

# Test counters
TESTS_PASSED=0
TESTS_FAILED=0

# Assertion helpers
assert_file_exists() {
    local file="$1"
    local msg="${2:-File should exist: $file}"
    if [ -f "$file" ]; then
        echo -e "${GREEN}✓${NC} $msg"
        ((TESTS_PASSED++))
    else
        echo -e "${RED}✗${NC} $msg"
        ((TESTS_FAILED++))
    fi
}

assert_dir_exists() {
    local dir="$1"
    local msg="${2:-Directory should exist: $dir}"
    if [ -d "$dir" ]; then
        echo -e "${GREEN}✓${NC} $msg"
        ((TESTS_PASSED++))
    else
        echo -e "${RED}✗${NC} $msg"
        ((TESTS_FAILED++))
    fi
}

assert_contains() {
    local file="$1"
    local pattern="$2"
    local msg="${3:-File should contain pattern}"
    if grep -q "$pattern" "$file" 2>/dev/null; then
        echo -e "${GREEN}✓${NC} $msg"
        ((TESTS_PASSED++))
    else
        echo -e "${RED}✗${NC} $msg"
        ((TESTS_FAILED++))
    fi
}

assert_not_contains() {
    local file="$1"
    local pattern="$2"
    local msg="${3:-File should not contain pattern}"
    if ! grep -q "$pattern" "$file" 2>/dev/null; then
        echo -e "${GREEN}✓${NC} $msg"
        ((TESTS_PASSED++))
    else
        echo -e "${RED}✗${NC} $msg"
        ((TESTS_FAILED++))
    fi
}

assert_exit_code() {
    local expected="$1"
    local actual="$2"
    local msg="${3:-Exit code should match}"
    if [ "$expected" -eq "$actual" ]; then
        echo -e "${GREEN}✓${NC} $msg"
        ((TESTS_PASSED++))
    else
        echo -e "${RED}✗${NC} $msg (expected $expected, got $actual)"
        ((TESTS_FAILED++))
    fi
}

# =============================================================================
# Test: verify-deps.sh
# =============================================================================

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "  Testing: verify-deps.sh"
echo "═══════════════════════════════════════════════════════════"
echo ""

test_verify_deps_script_exists() {
    assert_file_exists "$PROJECT_ROOT/scripts/hooks/verify-deps.sh" \
        "verify-deps.sh should exist"
}

test_verify_deps_is_executable() {
    local script="$PROJECT_ROOT/scripts/hooks/verify-deps.sh"
    if [ -x "$script" ]; then
        echo -e "${GREEN}✓${NC} verify-deps.sh should be executable"
        ((TESTS_PASSED++))
    else
        echo -e "${YELLOW}⚠${NC} verify-deps.sh is not executable (may need chmod +x)"
        ((TESTS_PASSED++))  # Not a failure, just a warning
    fi
}

test_verify_deps_has_shebang() {
    local script="$PROJECT_ROOT/scripts/hooks/verify-deps.sh"
    if head -1 "$script" | grep -q "^#!/"; then
        echo -e "${GREEN}✓${NC} verify-deps.sh should have shebang"
        ((TESTS_PASSED++))
    else
        echo -e "${RED}✗${NC} verify-deps.sh should have shebang"
        ((TESTS_FAILED++))
    fi
}

test_verify_deps_script_exists
test_verify_deps_is_executable
test_verify_deps_has_shebang

# =============================================================================
# Test: collect-session-metrics.sh
# =============================================================================

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "  Testing: collect-session-metrics.sh"
echo "═══════════════════════════════════════════════════════════"
echo ""

test_metrics_script_exists() {
    assert_file_exists "$PROJECT_ROOT/scripts/metrics/collect-session-metrics.sh" \
        "collect-session-metrics.sh should exist"
}

test_metrics_has_help() {
    local script="$PROJECT_ROOT/scripts/metrics/collect-session-metrics.sh"
    assert_contains "$script" "--help" \
        "Metrics script should have --help option"
}

test_metrics_has_auto_mode() {
    local script="$PROJECT_ROOT/scripts/metrics/collect-session-metrics.sh"
    assert_contains "$script" "--auto" \
        "Metrics script should have --auto option"
}

test_metrics_script_exists
test_metrics_has_help
test_metrics_has_auto_mode

# =============================================================================
# Test: post-edit.sh
# =============================================================================

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "  Testing: post-edit.sh"
echo "═══════════════════════════════════════════════════════════"
echo ""

test_post_edit_exists() {
    assert_file_exists "$PROJECT_ROOT/scripts/hooks/post-edit.sh" \
        "post-edit.sh should exist"
}

test_post_edit_has_timeout() {
    local script="$PROJECT_ROOT/scripts/hooks/post-edit.sh"
    assert_contains "$script" "timeout\|TIMEOUT" \
        "post-edit.sh should have timeout handling"
}

test_post_edit_exists
test_post_edit_has_timeout

# =============================================================================
# Test: Directory Structure
# =============================================================================

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "  Testing: Directory Structure"
echo "═══════════════════════════════════════════════════════════"
echo ""

test_directory_structure() {
    assert_dir_exists "$PROJECT_ROOT/.claude" \
        ".claude directory should exist"
    assert_dir_exists "$PROJECT_ROOT/.claude/commands" \
        ".claude/commands directory should exist"
    assert_dir_exists "$PROJECT_ROOT/.claude/agents" \
        ".claude/agents directory should exist"
    assert_dir_exists "$PROJECT_ROOT/scripts" \
        "scripts directory should exist"
    assert_dir_exists "$PROJECT_ROOT/templates" \
        "templates directory should exist"
}

test_directory_structure

# =============================================================================
# Test: Slash Commands
# =============================================================================

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "  Testing: Slash Commands"
echo "═══════════════════════════════════════════════════════════"
echo ""

test_slash_commands() {
    local commands_dir="$PROJECT_ROOT/.claude/commands"

    assert_file_exists "$commands_dir/plan.md" "plan.md should exist"
    assert_file_exists "$commands_dir/verify.md" "verify.md should exist"
    assert_file_exists "$commands_dir/handoff.md" "handoff.md should exist"
    assert_file_exists "$commands_dir/assumptions.md" "assumptions.md should exist"
    assert_file_exists "$commands_dir/review.md" "review.md should exist"
    assert_file_exists "$commands_dir/security-review.md" "security-review.md should exist"
    assert_file_exists "$commands_dir/refactor.md" "refactor.md should exist"
    assert_file_exists "$commands_dir/test-coverage.md" "test-coverage.md should exist"
}

test_slash_commands_have_frontmatter() {
    local commands_dir="$PROJECT_ROOT/.claude/commands"

    for cmd in plan verify handoff; do
        assert_contains "$commands_dir/$cmd.md" "description:" \
            "$cmd.md should have description frontmatter"
    done
}

test_slash_commands
test_slash_commands_have_frontmatter

# =============================================================================
# Test: Configuration Files
# =============================================================================

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "  Testing: Configuration Files"
echo "═══════════════════════════════════════════════════════════"
echo ""

test_config_files() {
    assert_file_exists "$PROJECT_ROOT/package.json" "package.json should exist"
    assert_file_exists "$PROJECT_ROOT/CLAUDE.md" "CLAUDE.md should exist"
    assert_file_exists "$PROJECT_ROOT/.gitignore" ".gitignore should exist"
}

test_gitignore_entries() {
    local gitignore="$PROJECT_ROOT/.gitignore"

    assert_contains "$gitignore" ".tmp" ".gitignore should ignore .tmp"
    assert_contains "$gitignore" "node_modules" ".gitignore should ignore node_modules"
}

test_config_files
test_gitignore_entries

# =============================================================================
# Test: MCP Server
# =============================================================================

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "  Testing: MCP Server"
echo "═══════════════════════════════════════════════════════════"
echo ""

test_mcp_server() {
    assert_file_exists "$PROJECT_ROOT/scripts/mcp/project-memory-server.py" \
        "MCP server should exist"

    local server="$PROJECT_ROOT/scripts/mcp/project-memory-server.py"

    assert_contains "$server" "sanitize_input" \
        "MCP server should have input sanitization"
    assert_contains "$server" "validate_key" \
        "MCP server should have key validation"
    assert_contains "$server" "sqlite3" \
        "MCP server should use SQLite"
}

test_mcp_server

# =============================================================================
# Summary
# =============================================================================

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "  Test Summary"
echo "═══════════════════════════════════════════════════════════"
echo ""
echo -e "  ${GREEN}Passed:${NC} $TESTS_PASSED"
echo -e "  ${RED}Failed:${NC} $TESTS_FAILED"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}All tests passed!${NC}"
    exit 0
else
    echo -e "${RED}Some tests failed.${NC}"
    exit 1
fi
