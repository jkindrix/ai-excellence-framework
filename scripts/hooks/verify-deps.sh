#!/bin/bash
#
# AI Excellence Framework - Dependency Verification
#
# Verifies that dependencies exist before installation.
# Prevents slopsquatting attacks from hallucinated package names.
#
# Usage:
#   ./verify-deps.sh                    # Check package.json
#   ./verify-deps.sh requirements.txt   # Check Python requirements
#
# Background:
#   AI assistants sometimes hallucinate plausible package names.
#   Attackers register these names (slopsquatting) to inject malware.
#   This script verifies packages exist before they're installed.
#

set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_error() {
    echo -e "${RED}[ERROR]${NC} $1" >&2
}

log_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[OK]${NC} $1"
}

log_info() {
    echo "[INFO] $1"
}

# Verify npm package exists
verify_npm_package() {
    local package="$1"
    local version="${2:-}"

    # Skip scoped packages that start with @ (they're usually valid)
    if [[ "$package" == @* ]]; then
        # But still verify official scoped packages exist
        if npm view "$package" name >/dev/null 2>&1; then
            return 0
        else
            return 1
        fi
    fi

    # Check if package exists on npm
    if npm view "$package" name >/dev/null 2>&1; then
        return 0
    else
        return 1
    fi
}

# Verify Python package exists
verify_pypi_package() {
    local package="$1"

    # Check if package exists on PyPI
    if pip index versions "$package" >/dev/null 2>&1; then
        return 0
    else
        # Fallback: try with pip show if installed
        if pip show "$package" >/dev/null 2>&1; then
            return 0
        fi
        return 1
    fi
}

# Extract packages from package.json
check_npm_packages() {
    local file="${1:-package.json}"

    if [ ! -f "$file" ]; then
        log_info "No $file found, skipping npm check"
        return 0
    fi

    if ! command -v npm >/dev/null 2>&1; then
        log_warning "npm not found, skipping npm package verification"
        return 0
    fi

    if ! command -v jq >/dev/null 2>&1; then
        log_warning "jq not found, cannot parse package.json properly"
        return 0
    fi

    log_info "Verifying npm packages in $file..."

    local issues=0

    # Check dependencies and devDependencies
    for dep_type in "dependencies" "devDependencies"; do
        local packages
        packages=$(jq -r ".$dep_type // {} | keys[]" "$file" 2>/dev/null)

        for package in $packages; do
            if ! verify_npm_package "$package"; then
                log_error "Package '$package' not found on npm registry!"
                log_warning "This could be a hallucinated package name (slopsquatting risk)"
                issues=$((issues + 1))
            fi
        done
    done

    if [ $issues -eq 0 ]; then
        log_success "All npm packages verified"
        return 0
    else
        log_error "Found $issues suspicious packages. Review before installing."
        return 1
    fi
}

# Extract packages from requirements.txt
check_python_packages() {
    local file="${1:-requirements.txt}"

    if [ ! -f "$file" ]; then
        log_info "No $file found, skipping Python check"
        return 0
    fi

    if ! command -v pip >/dev/null 2>&1; then
        log_warning "pip not found, skipping Python package verification"
        return 0
    fi

    log_info "Verifying Python packages in $file..."

    local issues=0

    # Read packages (skip comments, empty lines, and options)
    while IFS= read -r line || [ -n "$line" ]; do
        # Skip empty lines, comments, and pip options
        [[ -z "$line" || "$line" =~ ^[[:space:]]*# || "$line" =~ ^- ]] && continue

        # Extract package name (before any version specifier)
        local package
        package=$(echo "$line" | sed -E 's/([a-zA-Z0-9_-]+).*/\1/' | tr -d '[:space:]')

        [ -z "$package" ] && continue

        if ! verify_pypi_package "$package"; then
            log_error "Package '$package' not found on PyPI!"
            log_warning "This could be a hallucinated package name (slopsquatting risk)"
            issues=$((issues + 1))
        fi
    done < "$file"

    if [ $issues -eq 0 ]; then
        log_success "All Python packages verified"
        return 0
    else
        log_error "Found $issues suspicious packages. Review before installing."
        return 1
    fi
}

# Main
main() {
    local target="${1:-auto}"
    local exit_code=0

    echo "═══════════════════════════════════════════════════════════"
    echo "  AI Excellence Framework - Dependency Verification"
    echo "═══════════════════════════════════════════════════════════"
    echo ""

    case "$target" in
        auto)
            # Auto-detect and check all dependency files
            if [ -f "package.json" ]; then
                check_npm_packages "package.json" || exit_code=1
            fi
            if [ -f "requirements.txt" ]; then
                check_python_packages "requirements.txt" || exit_code=1
            fi
            if [ -f "Pipfile" ]; then
                log_warning "Pipfile detected - manual verification recommended"
            fi
            if [ -f "pyproject.toml" ]; then
                log_warning "pyproject.toml detected - manual verification recommended"
            fi
            ;;
        *.json)
            check_npm_packages "$target" || exit_code=1
            ;;
        *.txt)
            check_python_packages "$target" || exit_code=1
            ;;
        *)
            log_error "Unknown file type: $target"
            echo "Usage: $0 [package.json|requirements.txt|auto]"
            exit 1
            ;;
    esac

    echo ""
    if [ $exit_code -eq 0 ]; then
        log_success "All dependency checks passed"
    else
        log_error "Some dependency checks failed. Review above for details."
    fi

    exit $exit_code
}

main "$@"
