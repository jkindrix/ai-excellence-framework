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

echo "🔒 AI Security Check"
echo "   Enforcement: $ENFORCE | Strict mode: $STRICT"
echo ""

# Check for eval() usage
if grep -rn 'eval\s*(' --include="*.js" --include="*.ts" --include="*.py" . 2>/dev/null | grep -v node_modules | grep -v ".git" | grep -v __pycache__; then
    echo "⚠️  Warning: eval() usage detected - potential code injection risk"
    ISSUES=$((ISSUES + 1))
fi

# Check for hardcoded credentials (basic patterns)
if grep -rniE "(password|secret|api_key|apikey|token)\s*=\s*['\"][^'\"]{8,}" --include="*.js" --include="*.ts" --include="*.py" --include="*.go" . 2>/dev/null | grep -v node_modules | grep -v ".git" | grep -v __pycache__ | grep -v "example" | grep -v "test" | grep -v ".md"; then
    echo "⚠️  Warning: Potential hardcoded credentials detected"
    ISSUES=$((ISSUES + 1))
fi

# Check for SQL string concatenation (SQL injection)
if grep -rniE "(SELECT|INSERT|UPDATE|DELETE).*\+.*\$|f['\"].*SELECT|format.*SELECT" --include="*.js" --include="*.ts" --include="*.py" . 2>/dev/null | grep -v node_modules | grep -v ".git" | grep -v __pycache__ | grep -v test; then
    echo "⚠️  Warning: Potential SQL injection - string concatenation in SQL"
    ISSUES=$((ISSUES + 1))
fi

# Check for shell command string concatenation (command injection)
if grep -rniE "exec\s*\(.*\+|subprocess.*shell\s*=\s*True|os\.system\s*\(" --include="*.js" --include="*.ts" --include="*.py" . 2>/dev/null | grep -v node_modules | grep -v ".git" | grep -v __pycache__ | grep -v test; then
    echo "⚠️  Warning: Potential command injection detected"
    ISSUES=$((ISSUES + 1))
fi

# Strict mode: Additional checks
if [ "$STRICT" = "true" ]; then
    echo ""
    echo "🔍 Running strict mode checks..."

    # Check for innerHTML usage (XSS risk)
    if grep -rn 'innerHTML\s*=' --include="*.js" --include="*.ts" --include="*.jsx" --include="*.tsx" . 2>/dev/null | grep -v node_modules | grep -v ".git"; then
        echo "⚠️  Warning: innerHTML assignment detected - potential XSS risk"
        WARNINGS=$((WARNINGS + 1))
    fi

    # Check for dangerouslySetInnerHTML (React XSS risk)
    if grep -rn 'dangerouslySetInnerHTML' --include="*.js" --include="*.ts" --include="*.jsx" --include="*.tsx" . 2>/dev/null | grep -v node_modules | grep -v ".git"; then
        echo "⚠️  Warning: dangerouslySetInnerHTML detected - review for XSS safety"
        WARNINGS=$((WARNINGS + 1))
    fi

    # Check for pickle usage (Python deserialization risk)
    if grep -rn 'pickle\.load' --include="*.py" . 2>/dev/null | grep -v node_modules | grep -v ".git" | grep -v __pycache__; then
        echo "⚠️  Warning: pickle.load detected - deserialization vulnerability risk"
        WARNINGS=$((WARNINGS + 1))
    fi

    # Check for yaml.load without safe_load (Python YAML injection)
    if grep -rn 'yaml\.load\s*(' --include="*.py" . 2>/dev/null | grep -v 'safe_load' | grep -v node_modules | grep -v ".git" | grep -v __pycache__; then
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
