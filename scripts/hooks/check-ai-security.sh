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
# Pattern Customization:
#   See templates/security-patterns.json for pattern definitions.
#   To customize patterns for your project, copy the file to your project root
#   and modify as needed. This hook uses hardcoded patterns for performance,
#   but the JSON file serves as documentation and can be used by custom tooling.
#
# Part of the AI Excellence Framework
# https://github.com/ai-excellence-framework/ai-excellence-framework

set -euo pipefail

# Parse command-line arguments
ENFORCE="${AIX_SECURITY_ENFORCE:-false}"
STRICT="${AIX_SECURITY_STRICT:-false}"
STRUCTURED_LOGGING="${AIX_STRUCTURED_LOGGING:-false}"

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
        --json)
            STRUCTURED_LOGGING="true"
            shift
            ;;
        *)
            shift
            ;;
    esac
done

ISSUES=0
WARNINGS=0

# JSON output accumulator for structured logging
declare -a JSON_FINDINGS=()

# Sanitize output to prevent terminal escape sequence injection
# Removes ANSI escape codes and control characters, truncates long lines
sanitize_output() {
    # Remove ANSI escape sequences, control chars except newline/tab, and truncate
    sed 's/\x1b\[[0-9;]*[a-zA-Z]//g; s/\x1b\][^\x07]*\x07//g' | \
        tr -d '\000-\010\013\014\016-\037' | \
        cut -c1-200 | \
        head -20
}

# Log function that respects structured logging mode
# Args: $1=level (info|warn|error), $2=message, $3=optional_category
log_message() {
    local level="$1"
    local message="$2"
    local category="${3:-}"
    local timestamp
    timestamp=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

    if [ "$STRUCTURED_LOGGING" = "true" ]; then
        local json_entry
        json_entry=$(printf '{"timestamp":"%s","level":"%s","message":"%s"' "$timestamp" "$level" "$message")
        if [ -n "$category" ]; then
            json_entry=$(printf '%s,"category":"%s"' "$json_entry" "$category")
        fi
        json_entry=$(printf '%s}' "$json_entry")
        JSON_FINDINGS+=("$json_entry")
    else
        case $level in
            error)
                echo "❌ $message"
                ;;
            warn)
                echo "⚠️  $message"
                ;;
            info)
                echo "$message"
                ;;
        esac
    fi
}

# Output final JSON if in structured logging mode
output_json_results() {
    local findings_json="["
    local first=true
    for finding in "${JSON_FINDINGS[@]}"; do
        if [ "$first" = true ]; then
            first=false
        else
            findings_json="$findings_json,"
        fi
        findings_json="$findings_json$finding"
    done
    findings_json="$findings_json]"

    printf '{"tool":"check-ai-security","version":"1.0.0","issues":%d,"warnings":%d,"enforce":%s,"strict":%s,"findings":%s}\n' \
        "$ISSUES" "$WARNINGS" "$ENFORCE" "$STRICT" "$findings_json"
}

if [ "$STRUCTURED_LOGGING" != "true" ]; then
    echo "🔒 AI Security Check"
    echo "   Enforcement: $ENFORCE | Strict mode: $STRICT"
    echo ""
fi

# Check for eval() usage (sanitized output)
result=$(grep -rn 'eval\s*(' --include="*.js" --include="*.ts" --include="*.py" . 2>/dev/null | \
    grep -v node_modules | grep -v ".git" | grep -v __pycache__ || true)
if [ -n "$result" ]; then
    if [ "$STRUCTURED_LOGGING" != "true" ]; then
        echo "$result" | sanitize_output
    fi
    log_message "warn" "eval() usage detected - potential code injection risk" "eval_usage"
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
    if [ "$STRUCTURED_LOGGING" != "true" ]; then
        echo "$result" | sanitize_output
    fi
    log_message "warn" "Potential hardcoded credentials detected" "hardcoded_credentials"
    ISSUES=$((ISSUES + 1))
fi

# Check for SQL string concatenation (SQL injection)
# Fixed: exclude only dedicated test directories
result=$(grep -rniE "(SELECT|INSERT|UPDATE|DELETE).*\+.*\$|f['\"].*SELECT|format.*SELECT" \
    --include="*.js" --include="*.ts" --include="*.py" . 2>/dev/null | \
    grep -v node_modules | grep -v ".git" | grep -v __pycache__ | \
    grep -v "/tests/" | grep -v "/__tests__/" | grep -v "/test/" || true)
if [ -n "$result" ]; then
    if [ "$STRUCTURED_LOGGING" != "true" ]; then
        echo "$result" | sanitize_output
    fi
    log_message "warn" "Potential SQL injection - string concatenation in SQL" "sql_injection"
    ISSUES=$((ISSUES + 1))
fi

# Check for shell command string concatenation (command injection)
# Fixed: exclude only dedicated test directories
result=$(grep -rniE "exec\s*\(.*\+|subprocess.*shell\s*=\s*True|os\.system\s*\(" \
    --include="*.js" --include="*.ts" --include="*.py" . 2>/dev/null | \
    grep -v node_modules | grep -v ".git" | grep -v __pycache__ | \
    grep -v "/tests/" | grep -v "/__tests__/" | grep -v "/test/" || true)
if [ -n "$result" ]; then
    if [ "$STRUCTURED_LOGGING" != "true" ]; then
        echo "$result" | sanitize_output
    fi
    log_message "warn" "Potential command injection detected" "command_injection"
    ISSUES=$((ISSUES + 1))
fi

# Strict mode: Additional checks (all with sanitized output)
if [ "$STRICT" = "true" ]; then
    if [ "$STRUCTURED_LOGGING" != "true" ]; then
        echo ""
        echo "🔍 Running strict mode checks..."
    fi

    # Check for innerHTML usage (XSS risk)
    result=$(grep -rn 'innerHTML\s*=' --include="*.js" --include="*.ts" --include="*.jsx" --include="*.tsx" . 2>/dev/null | \
        grep -v node_modules | grep -v ".git" || true)
    if [ -n "$result" ]; then
        if [ "$STRUCTURED_LOGGING" != "true" ]; then
            echo "$result" | sanitize_output
        fi
        log_message "warn" "innerHTML assignment detected - potential XSS risk" "innerHTML_xss"
        WARNINGS=$((WARNINGS + 1))
    fi

    # Check for dangerouslySetInnerHTML (React XSS risk)
    result=$(grep -rn 'dangerouslySetInnerHTML' --include="*.js" --include="*.ts" --include="*.jsx" --include="*.tsx" . 2>/dev/null | \
        grep -v node_modules | grep -v ".git" || true)
    if [ -n "$result" ]; then
        if [ "$STRUCTURED_LOGGING" != "true" ]; then
            echo "$result" | sanitize_output
        fi
        log_message "warn" "dangerouslySetInnerHTML detected - review for XSS safety" "dangerously_set_innerHTML"
        WARNINGS=$((WARNINGS + 1))
    fi

    # Check for pickle usage (Python deserialization risk)
    result=$(grep -rn 'pickle\.load' --include="*.py" . 2>/dev/null | \
        grep -v node_modules | grep -v ".git" | grep -v __pycache__ || true)
    if [ -n "$result" ]; then
        if [ "$STRUCTURED_LOGGING" != "true" ]; then
            echo "$result" | sanitize_output
        fi
        log_message "warn" "pickle.load detected - deserialization vulnerability risk" "pickle_deserialization"
        WARNINGS=$((WARNINGS + 1))
    fi

    # Check for yaml.load without safe_load (Python YAML injection)
    result=$(grep -rn 'yaml\.load\s*(' --include="*.py" . 2>/dev/null | \
        grep -v 'safe_load' | grep -v node_modules | grep -v ".git" | grep -v __pycache__ || true)
    if [ -n "$result" ]; then
        if [ "$STRUCTURED_LOGGING" != "true" ]; then
            echo "$result" | sanitize_output
        fi
        log_message "warn" "yaml.load without Loader detected - use yaml.safe_load instead" "yaml_load_unsafe"
        WARNINGS=$((WARNINGS + 1))
    fi
fi

# Summary and output
if [ "$STRUCTURED_LOGGING" = "true" ]; then
    # Output JSON result
    output_json_results

    # Exit with error if enforcement is enabled and there are critical issues
    if [ "$ENFORCE" = "true" ] && [ $ISSUES -gt 0 ]; then
        exit 1
    fi
else
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
        echo "  export AIX_STRUCTURED_LOGGING=true # Enable JSON output"
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
fi

exit 0
