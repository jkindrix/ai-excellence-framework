#!/usr/bin/env bash
# AI Security Pattern Detection Hook
#
# Checks for common AI-generated security vulnerabilities:
# - eval() usage (code injection risk)
# - Hardcoded credentials
# - SQL injection patterns
# - Command injection patterns
#
# Configuration:
#   AIX_SECURITY_ENFORCE=true|false  - Block commits on issues (default: false)
#   AIX_SECURITY_STRICT=true|false   - Enable strict mode with more patterns (default: false)
#   --enforce                        - Command-line flag to block commits on issues
#   --strict                         - Command-line flag for strict mode
#
# Part of the AI Excellence Framework
# https://github.com/ai-excellence-framework/ai-excellence-framework

set -euo pipefail

# Parse command-line arguments
ENFORCE="${AIX_SECURITY_ENFORCE:-false}"
STRICT="${AIX_SECURITY_STRICT:-false}"

while [[ $# -gt 0 ]]; do
    case $1 in
        --enforce)
            ENFORCE="true"
            shift
            ;;
        --strict)
            STRICT="true"
            shift
            ;;
        *)
            shift
            ;;
    esac
done

ISSUES=0
WARNINGS=0

# Sanitize output to prevent terminal escape sequence injection
# Removes ANSI escape codes and control characters, truncates long lines
sanitize_output() {
    # Remove ANSI escape sequences, control chars except newline/tab, and truncate
    sed 's/\x1b\[[0-9;]*[a-zA-Z]//g; s/\x1b\][^\x07]*\x07//g' | \
        tr -d '\000-\010\013\014\016-\037' | \
        cut -c1-200 | \
        head -20
}

# Run a security pattern check and sanitize output
# Args: $1=pattern, $2=file_types, $3=warning_message
check_pattern() {
    local pattern="$1"
    local includes="$2"
    local message="$3"
    local is_critical="${4:-true}"

    local result
    result=$(eval "grep -rniE '$pattern' $includes . 2>/dev/null" | \
        grep -v node_modules | grep -v ".git" | grep -v __pycache__ || true)

    if [ -n "$result" ]; then
        echo "$result" | sanitize_output
        echo "$message"
        if [ "$is_critical" = "true" ]; then
            ISSUES=$((ISSUES + 1))
        else
            WARNINGS=$((WARNINGS + 1))
        fi
        return 0
    fi
    return 1
}

echo "🔒 AI Security Check"
echo "   Enforcement: $ENFORCE | Strict mode: $STRICT"
echo ""

# Define file type includes for different languages
JS_TS_FILES='--include="*.js" --include="*.ts"'
JS_TS_JSX_TSX_FILES='--include="*.js" --include="*.ts" --include="*.jsx" --include="*.tsx"'
PY_FILES='--include="*.py"'
ALL_CODE_FILES='--include="*.js" --include="*.ts" --include="*.py" --include="*.go"'

# Check for eval() usage (sanitized output)
result=$(grep -rn 'eval\s*(' --include="*.js" --include="*.ts" --include="*.py" . 2>/dev/null | \
    grep -v node_modules | grep -v ".git" | grep -v __pycache__ || true)
if [ -n "$result" ]; then
    echo "$result" | sanitize_output
    echo "⚠️  Warning: eval() usage detected - potential code injection risk"
    ISSUES=$((ISSUES + 1))
fi

# Check for hardcoded credentials (basic patterns)
# Fixed: exclude only dedicated test directories (tests/, __tests__/, test/), not files with "test" in name
# This prevents missing real secrets in files like "integration_test_config.py"
result=$(grep -rniE "(password|secret|api_key|apikey|token)\s*=\s*['\"][^'\"]{8,}" \
    --include="*.js" --include="*.ts" --include="*.py" --include="*.go" . 2>/dev/null | \
    grep -v node_modules | grep -v ".git" | grep -v __pycache__ | \
    grep -v "/tests/" | grep -v "/__tests__/" | grep -v "/test/" | \
    grep -v "\.example" | grep -v "\.sample" | grep -v "\.md" || true)
if [ -n "$result" ]; then
    echo "$result" | sanitize_output
    echo "⚠️  Warning: Potential hardcoded credentials detected"
    ISSUES=$((ISSUES + 1))
fi

# Check for SQL string concatenation (SQL injection)
# Fixed: exclude only dedicated test directories
result=$(grep -rniE "(SELECT|INSERT|UPDATE|DELETE).*\+.*\$|f['\"].*SELECT|format.*SELECT" \
    --include="*.js" --include="*.ts" --include="*.py" . 2>/dev/null | \
    grep -v node_modules | grep -v ".git" | grep -v __pycache__ | \
    grep -v "/tests/" | grep -v "/__tests__/" | grep -v "/test/" || true)
if [ -n "$result" ]; then
    echo "$result" | sanitize_output
    echo "⚠️  Warning: Potential SQL injection - string concatenation in SQL"
    ISSUES=$((ISSUES + 1))
fi

# Check for shell command string concatenation (command injection)
# Fixed: exclude only dedicated test directories
result=$(grep -rniE "exec\s*\(.*\+|subprocess.*shell\s*=\s*True|os\.system\s*\(" \
    --include="*.js" --include="*.ts" --include="*.py" . 2>/dev/null | \
    grep -v node_modules | grep -v ".git" | grep -v __pycache__ | \
    grep -v "/tests/" | grep -v "/__tests__/" | grep -v "/test/" || true)
if [ -n "$result" ]; then
    echo "$result" | sanitize_output
    echo "⚠️  Warning: Potential command injection detected"
    ISSUES=$((ISSUES + 1))
fi

# Strict mode: Additional checks (all with sanitized output)
if [ "$STRICT" = "true" ]; then
    echo ""
    echo "🔍 Running strict mode checks..."

    # Check for innerHTML usage (XSS risk)
    result=$(grep -rn 'innerHTML\s*=' --include="*.js" --include="*.ts" --include="*.jsx" --include="*.tsx" . 2>/dev/null | \
        grep -v node_modules | grep -v ".git" || true)
    if [ -n "$result" ]; then
        echo "$result" | sanitize_output
        echo "⚠️  Warning: innerHTML assignment detected - potential XSS risk"
        WARNINGS=$((WARNINGS + 1))
    fi

    # Check for dangerouslySetInnerHTML (React XSS risk)
    result=$(grep -rn 'dangerouslySetInnerHTML' --include="*.js" --include="*.ts" --include="*.jsx" --include="*.tsx" . 2>/dev/null | \
        grep -v node_modules | grep -v ".git" || true)
    if [ -n "$result" ]; then
        echo "$result" | sanitize_output
        echo "⚠️  Warning: dangerouslySetInnerHTML detected - review for XSS safety"
        WARNINGS=$((WARNINGS + 1))
    fi

    # Check for pickle usage (Python deserialization risk)
    result=$(grep -rn 'pickle\.load' --include="*.py" . 2>/dev/null | \
        grep -v node_modules | grep -v ".git" | grep -v __pycache__ || true)
    if [ -n "$result" ]; then
        echo "$result" | sanitize_output
        echo "⚠️  Warning: pickle.load detected - deserialization vulnerability risk"
        WARNINGS=$((WARNINGS + 1))
    fi

    # Check for yaml.load without safe_load (Python YAML injection)
    result=$(grep -rn 'yaml\.load\s*(' --include="*.py" . 2>/dev/null | \
        grep -v 'safe_load' | grep -v node_modules | grep -v ".git" | grep -v __pycache__ || true)
    if [ -n "$result" ]; then
        echo "$result" | sanitize_output
        echo "⚠️  Warning: yaml.load without Loader detected - use yaml.safe_load instead"
        WARNINGS=$((WARNINGS + 1))
    fi
fi

# Summary
echo ""
if [ $ISSUES -gt 0 ] || [ $WARNINGS -gt 0 ]; then
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "Found $ISSUES critical issues and $WARNINGS warnings."
    echo "Review these patterns before committing."
    echo "See: https://owasp.org/www-project-top-ten/"
    echo ""
    echo "To configure enforcement:"
    echo "  export AIX_SECURITY_ENFORCE=true  # Block commits on issues"
    echo "  export AIX_SECURITY_STRICT=true   # Enable strict mode"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

    # Block commit if enforcement is enabled and there are critical issues
    if [ "$ENFORCE" = "true" ] && [ $ISSUES -gt 0 ]; then
        echo ""
        echo "❌ Commit blocked due to security issues."
        echo "   Fix the issues above or set AIX_SECURITY_ENFORCE=false to skip."
        exit 1
    fi
else
    echo "✅ No security issues detected."
fi

exit 0
