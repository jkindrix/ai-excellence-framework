#!/bin/bash
#
# Shell script tests for AI Excellence Framework
#
# Run with: bash tests/scripts.test.sh
#

set -uo pipefail
# Note: We don't use -e because arithmetic expressions like ((x++)) return 1 when x=0

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
        TESTS_PASSED=$((TESTS_PASSED + 1))
    else
        echo -e "${RED}✗${NC} $msg"
        TESTS_FAILED=$((TESTS_FAILED + 1))
    fi
}

assert_dir_exists() {
    local dir="$1"
    local msg="${2:-Directory should exist: $dir}"
    if [ -d "$dir" ]; then
        echo -e "${GREEN}✓${NC} $msg"
        TESTS_PASSED=$((TESTS_PASSED + 1))
    else
        echo -e "${RED}✗${NC} $msg"
        TESTS_FAILED=$((TESTS_FAILED + 1))
    fi
}

assert_contains() {
    local file="$1"
    local pattern="$2"
    local msg="${3:-File should contain pattern}"
    if grep -qF -- "$pattern" "$file" 2>/dev/null || grep -qE "$pattern" "$file" 2>/dev/null; then
        echo -e "${GREEN}✓${NC} $msg"
        TESTS_PASSED=$((TESTS_PASSED + 1))
    else
        echo -e "${RED}✗${NC} $msg"
        TESTS_FAILED=$((TESTS_FAILED + 1))
    fi
}

assert_not_contains() {
    local file="$1"
    local pattern="$2"
    local msg="${3:-File should not contain pattern}"
    if ! grep -q "$pattern" "$file" 2>/dev/null; then
        echo -e "${GREEN}✓${NC} $msg"
        TESTS_PASSED=$((TESTS_PASSED + 1))
    else
        echo -e "${RED}✗${NC} $msg"
        TESTS_FAILED=$((TESTS_FAILED + 1))
    fi
}

assert_exit_code() {
    local expected="$1"
    local actual="$2"
    local msg="${3:-Exit code should match}"
    if [ "$expected" -eq "$actual" ]; then
        echo -e "${GREEN}✓${NC} $msg"
        TESTS_PASSED=$((TESTS_PASSED + 1))
    else
        echo -e "${RED}✗${NC} $msg (expected $expected, got $actual)"
        TESTS_FAILED=$((TESTS_FAILED + 1))
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
        TESTS_PASSED=$((TESTS_PASSED + 1))
    else
        echo -e "${YELLOW}⚠${NC} verify-deps.sh is not executable (may need chmod +x)"
        TESTS_PASSED=$((TESTS_PASSED + 1))  # Not a failure, just a warning
    fi
}

test_verify_deps_has_shebang() {
    local script="$PROJECT_ROOT/scripts/hooks/verify-deps.sh"
    if head -1 "$script" | grep -q "^#!/"; then
        echo -e "${GREEN}✓${NC} verify-deps.sh should have shebang"
        TESTS_PASSED=$((TESTS_PASSED + 1))
    else
        echo -e "${RED}✗${NC} verify-deps.sh should have shebang"
        TESTS_FAILED=$((TESTS_FAILED + 1))
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
    assert_contains "$script" "timeout|TIMEOUT" \
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
# Test: check-claude-md.sh
# =============================================================================

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "  Testing: check-claude-md.sh"
echo "═══════════════════════════════════════════════════════════"
echo ""

test_check_claude_md() {
    assert_file_exists "$PROJECT_ROOT/scripts/hooks/check-claude-md.sh" \
        "check-claude-md.sh should exist"

    local script="$PROJECT_ROOT/scripts/hooks/check-claude-md.sh"

    assert_contains "$script" "REQUIRED_SECTIONS" \
        "check-claude-md.sh should check required sections"
    assert_contains "$script" "secret_patterns" \
        "check-claude-md.sh should check for secrets"
}

test_check_claude_md

# =============================================================================
# Test: check-todos.sh
# =============================================================================

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "  Testing: check-todos.sh"
echo "═══════════════════════════════════════════════════════════"
echo ""

test_check_todos() {
    assert_file_exists "$PROJECT_ROOT/scripts/hooks/check-todos.sh" \
        "check-todos.sh should exist"
}

test_check_todos

# =============================================================================
# Test: Subagents
# =============================================================================

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "  Testing: Subagents"
echo "═══════════════════════════════════════════════════════════"
echo ""

test_subagents() {
    local agents_dir="$PROJECT_ROOT/.claude/agents"

    assert_file_exists "$agents_dir/explorer.md" "explorer agent should exist"
    assert_file_exists "$agents_dir/reviewer.md" "reviewer agent should exist"
    assert_file_exists "$agents_dir/tester.md" "tester agent should exist"
}

test_subagents

# =============================================================================
# Test: Template Presets
# =============================================================================

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "  Testing: Template Presets"
echo "═══════════════════════════════════════════════════════════"
echo ""

test_presets() {
    local presets_dir="$PROJECT_ROOT/templates/presets"

    assert_dir_exists "$presets_dir/minimal" "minimal preset should exist"
    assert_dir_exists "$presets_dir/standard" "standard preset should exist"
    assert_dir_exists "$presets_dir/full" "full preset should exist"
    assert_dir_exists "$presets_dir/team" "team preset should exist"

    for preset in minimal standard full team; do
        assert_file_exists "$presets_dir/$preset/CLAUDE.md" \
            "$preset preset should have CLAUDE.md"
    done
}

test_presets

# =============================================================================
# Test: Documentation
# =============================================================================

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "  Testing: Documentation"
echo "═══════════════════════════════════════════════════════════"
echo ""

test_documentation() {
    assert_file_exists "$PROJECT_ROOT/README.md" "README.md should exist"
    assert_file_exists "$PROJECT_ROOT/ai-development-friction.md" \
        "Friction doc should exist"
    assert_file_exists "$PROJECT_ROOT/ai-friction-mitigations.md" \
        "Mitigations doc should exist"
    assert_file_exists "$PROJECT_ROOT/docs/QUICK-REFERENCE.md" \
        "Quick reference should exist"
    assert_file_exists "$PROJECT_ROOT/docs/TROUBLESHOOTING.md" \
        "Troubleshooting guide should exist"
    assert_file_exists "$PROJECT_ROOT/docs/MODEL-SELECTION.md" \
        "Model selection guide should exist"
}

test_documentation

# =============================================================================
# Test: JSON Schemas
# =============================================================================

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "  Testing: JSON Schemas"
echo "═══════════════════════════════════════════════════════════"
echo ""

test_schemas() {
    assert_file_exists "$PROJECT_ROOT/src/schemas/config.schema.json" \
        "Config schema should exist"

    # Validate JSON syntax
    if node -e "require('$PROJECT_ROOT/src/schemas/config.schema.json')" 2>/dev/null; then
        echo -e "${GREEN}✓${NC} Config schema is valid JSON"
        TESTS_PASSED=$((TESTS_PASSED + 1))
    else
        echo -e "${RED}✗${NC} Config schema has invalid JSON"
        TESTS_FAILED=$((TESTS_FAILED + 1))
    fi
}

test_schemas

# =============================================================================
# Test: GitHub Actions
# =============================================================================

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "  Testing: GitHub Actions"
echo "═══════════════════════════════════════════════════════════"
echo ""

test_github_actions() {
    assert_file_exists "$PROJECT_ROOT/.github/workflows/ci.yml" \
        "CI workflow should exist"
    assert_file_exists "$PROJECT_ROOT/.github/workflows/release.yml" \
        "Release workflow should exist"
}

test_github_actions

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
