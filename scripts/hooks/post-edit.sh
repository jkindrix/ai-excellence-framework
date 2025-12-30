#!/bin/bash
#
# AI Excellence Framework - Post-Edit Hook
#
# Auto-lint and format files after Claude Code edits them.
# Runs appropriate formatters based on file extension.
#
# Usage:
#   Called automatically by Claude Code hooks, or manually:
#   ./post-edit.sh <file-path>
#
# Environment:
#   AI_EXCELLENCE_QUIET=1    Suppress output
#   AI_EXCELLENCE_DRY_RUN=1  Show what would be done without doing it
#

set -euo pipefail

# Configuration
QUIET="${AI_EXCELLENCE_QUIET:-0}"
DRY_RUN="${AI_EXCELLENCE_DRY_RUN:-0}"
TIMEOUT_SECONDS=30

# Logging
log() {
    [ "$QUIET" = "1" ] || echo "$1"
}

log_error() {
    echo "[ERROR] $1" >&2
}

log_debug() {
    [ "${AI_EXCELLENCE_DEBUG:-0}" = "1" ] && echo "[DEBUG] $1" >&2 || true
}

# Check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Run a formatter with timeout and error handling
run_formatter() {
    local cmd="$1"
    local display_name="$2"
    shift 2

    if [ "$DRY_RUN" = "1" ]; then
        log "[DRY RUN] Would run: $cmd $*"
        return 0
    fi

    if command_exists "$cmd"; then
        log_debug "Running $display_name..."
        if timeout "$TIMEOUT_SECONDS" "$cmd" "$@" 2>/dev/null; then
            log_debug "$display_name succeeded"
            return 0
        else
            local exit_code=$?
            if [ $exit_code -eq 124 ]; then
                log_error "$display_name timed out after ${TIMEOUT_SECONDS}s"
            else
                log_debug "$display_name exited with code $exit_code (continuing)"
            fi
            return 0  # Don't fail the hook on formatter errors
        fi
    else
        log_debug "$cmd not found, skipping $display_name"
        return 0
    fi
}

# Run npx-based formatter
run_npx_formatter() {
    local package="$1"
    local display_name="$2"
    shift 2

    if [ "$DRY_RUN" = "1" ]; then
        log "[DRY RUN] Would run: npx $package $*"
        return 0
    fi

    if command_exists npx; then
        log_debug "Running $display_name via npx..."
        if timeout "$TIMEOUT_SECONDS" npx "$package" "$@" 2>/dev/null; then
            log_debug "$display_name succeeded"
        else
            log_debug "$display_name failed or not installed (continuing)"
        fi
    else
        log_debug "npx not found, skipping $display_name"
    fi
    return 0
}

# Validate input
FILE_PATH="${1:-}"

if [ -z "$FILE_PATH" ]; then
    log_debug "No file path provided, exiting"
    exit 0
fi

if [ ! -f "$FILE_PATH" ]; then
    log_error "File not found: $FILE_PATH"
    exit 0  # Don't fail the hook, file might have been deleted
fi

# Resolve to absolute path for safety
if command_exists realpath; then
    FILE_PATH=$(realpath "$FILE_PATH" 2>/dev/null) || true
fi

# Get file extension (lowercase for matching)
EXT="${FILE_PATH##*.}"
EXT=$(echo "$EXT" | tr '[:upper:]' '[:lower:]')

log_debug "Processing file: $FILE_PATH (extension: $EXT)"

# Format based on extension
case "$EXT" in
    ts|tsx)
        run_npx_formatter "eslint" "ESLint" --fix "$FILE_PATH"
        run_npx_formatter "prettier" "Prettier" --write "$FILE_PATH"
        ;;
    js|jsx|mjs|cjs)
        run_npx_formatter "eslint" "ESLint" --fix "$FILE_PATH"
        run_npx_formatter "prettier" "Prettier" --write "$FILE_PATH"
        ;;
    py)
        run_formatter "black" "Black" "$FILE_PATH"
        run_formatter "ruff" "Ruff" check --fix "$FILE_PATH"
        # Alternative: isort for import sorting
        run_formatter "isort" "isort" "$FILE_PATH"
        ;;
    go)
        run_formatter "gofmt" "gofmt" -w "$FILE_PATH"
        run_formatter "goimports" "goimports" -w "$FILE_PATH"
        ;;
    rs)
        run_formatter "rustfmt" "rustfmt" "$FILE_PATH"
        ;;
    md|mdx)
        run_npx_formatter "prettier" "Prettier" --write "$FILE_PATH"
        ;;
    json)
        run_npx_formatter "prettier" "Prettier" --write "$FILE_PATH"
        ;;
    yaml|yml)
        run_npx_formatter "prettier" "Prettier" --write "$FILE_PATH"
        ;;
    css|scss|less)
        run_npx_formatter "prettier" "Prettier" --write "$FILE_PATH"
        ;;
    html|htm)
        run_npx_formatter "prettier" "Prettier" --write "$FILE_PATH"
        ;;
    rb)
        run_formatter "rubocop" "RuboCop" -a "$FILE_PATH"
        ;;
    java)
        run_formatter "google-java-format" "google-java-format" -i "$FILE_PATH"
        ;;
    sh|bash)
        run_formatter "shfmt" "shfmt" -w "$FILE_PATH"
        ;;
    *)
        log_debug "No formatter configured for extension: $EXT"
        ;;
esac

log "✓ Formatted: $(basename "$FILE_PATH")"
