#!/bin/bash
#
# AI Excellence Framework - Team Metrics Aggregator
#
# Aggregates metrics from multiple team members using the MCP server
# or shared file storage.
#
# Usage:
#   ./collect-team-metrics.sh --team my-team
#   ./collect-team-metrics.sh --team my-team --period weekly
#   ./collect-team-metrics.sh --export > team-metrics.json
#
# Dependencies: jq, curl (for MCP server), or access to shared storage

set -euo pipefail

# Configuration
TEAM_NAME="${TEAM_NAME:-default}"
PERIOD="${PERIOD:-weekly}"
MCP_SERVER_URL="${MCP_SERVER_URL:-}"
SHARED_METRICS_DIR="${SHARED_METRICS_DIR:-}"
LOCAL_METRICS_DIR="${METRICS_DIR:-.tmp/metrics}"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[OK]${NC} $1"; }
log_warning() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1" >&2; }

# Parse arguments
EXPORT_MODE=false
while [[ $# -gt 0 ]]; do
    case $1 in
        --team)
            TEAM_NAME="$2"
            shift 2
            ;;
        --period)
            PERIOD="$2"
            shift 2
            ;;
        --export)
            EXPORT_MODE=true
            shift
            ;;
        --mcp-server)
            MCP_SERVER_URL="$2"
            shift 2
            ;;
        --shared-dir)
            SHARED_METRICS_DIR="$2"
            shift 2
            ;;
        --help|-h)
            echo "Usage: $0 [options]"
            echo ""
            echo "Options:"
            echo "  --team NAME        Team name for identification"
            echo "  --period PERIOD    Aggregation period: daily, weekly, monthly (default: weekly)"
            echo "  --export           Output aggregated metrics as JSON"
            echo "  --mcp-server URL   MCP server URL for centralized storage"
            echo "  --shared-dir DIR   Shared directory for team metrics"
            echo "  --help             Show this help message"
            echo ""
            echo "Environment variables:"
            echo "  TEAM_NAME          Default team name"
            echo "  MCP_SERVER_URL     MCP server URL"
            echo "  SHARED_METRICS_DIR Shared metrics directory"
            exit 0
            ;;
        *)
            shift
            ;;
    esac
done

# Check for jq
if ! command -v jq &> /dev/null; then
    log_error "jq is required but not installed."
    exit 1
fi

# Calculate date range based on period
get_date_range() {
    local end_date=$(date +%Y-%m-%d)
    local start_date

    case $PERIOD in
        daily)
            start_date=$end_date
            ;;
        weekly)
            start_date=$(date -d "7 days ago" +%Y-%m-%d 2>/dev/null || date -v-7d +%Y-%m-%d 2>/dev/null || echo "$end_date")
            ;;
        monthly)
            start_date=$(date -d "30 days ago" +%Y-%m-%d 2>/dev/null || date -v-30d +%Y-%m-%d 2>/dev/null || echo "$end_date")
            ;;
        *)
            start_date=$(date -d "7 days ago" +%Y-%m-%d 2>/dev/null || date -v-7d +%Y-%m-%d 2>/dev/null || echo "$end_date")
            ;;
    esac

    echo "$start_date|$end_date"
}

# Collect local metrics
collect_local_metrics() {
    local developer
    developer=$(whoami)

    local total_sessions=0
    local total_duration=0
    local total_tasks_completed=0
    local total_tasks_attempted=0
    local verification_count=0
    local security_fixes=0

    IFS='|' read -r start_date end_date <<< "$(get_date_range)"
    local start_epoch=$(date -d "$start_date" +%s 2>/dev/null || date -jf "%Y-%m-%d" "$start_date" +%s 2>/dev/null || echo 0)
    local end_epoch=$(date -d "$end_date" +%s 2>/dev/null || date -jf "%Y-%m-%d" "$end_date" +%s 2>/dev/null || echo 0)

    if [ -d "$LOCAL_METRICS_DIR" ]; then
        for file in "$LOCAL_METRICS_DIR"/*-session-*.json; do
            [ -f "$file" ] || continue

            local file_date
            file_date=$(basename "$file" | grep -oE '^[0-9]{4}-[0-9]{2}-[0-9]{2}' || echo "1970-01-01")
            local file_epoch
            file_epoch=$(date -d "$file_date" +%s 2>/dev/null || date -jf "%Y-%m-%d" "$file_date" +%s 2>/dev/null || echo 0)

            if [ "$file_epoch" -ge "$start_epoch" ] && [ "$file_epoch" -le "$end_epoch" ]; then
                total_sessions=$((total_sessions + 1))
                total_duration=$((total_duration + $(jq -r '.metrics.session_duration_minutes // 0' "$file")))
                total_tasks_completed=$((total_tasks_completed + $(jq -r '.metrics.tasks_completed // 0' "$file")))
                total_tasks_attempted=$((total_tasks_attempted + $(jq -r '.metrics.tasks_attempted // 0' "$file")))

                local used_verify
                used_verify=$(jq -r '.workflow.used_verify // false' "$file")
                [ "$used_verify" = "true" ] && verification_count=$((verification_count + 1))
            fi
        done

        # Get security fixes from auto metrics
        for file in "$LOCAL_METRICS_DIR"/*-auto.json; do
            [ -f "$file" ] || continue

            local file_date
            file_date=$(basename "$file" | grep -oE '^[0-9]{4}-[0-9]{2}-[0-9]{2}' || echo "1970-01-01")
            local file_epoch
            file_epoch=$(date -d "$file_date" +%s 2>/dev/null || date -jf "%Y-%m-%d" "$file_date" +%s 2>/dev/null || echo 0)

            if [ "$file_epoch" -ge "$start_epoch" ] && [ "$file_epoch" -le "$end_epoch" ]; then
                security_fixes=$((security_fixes + $(jq -r '.metrics.security_fixes_7d // 0' "$file")))
            fi
        done
    fi

    # Calculate rates
    local completion_rate=0
    local verify_rate=0

    if [ "$total_tasks_attempted" -gt 0 ]; then
        completion_rate=$((total_tasks_completed * 100 / total_tasks_attempted))
    fi

    if [ "$total_sessions" -gt 0 ]; then
        verify_rate=$((verification_count * 100 / total_sessions))
    fi

    cat << EOF
{
    "developer": "$developer",
    "team": "$TEAM_NAME",
    "period": {
        "type": "$PERIOD",
        "start": "$start_date",
        "end": "$end_date"
    },
    "metrics": {
        "sessions": $total_sessions,
        "total_duration_minutes": $total_duration,
        "tasks_completed": $total_tasks_completed,
        "tasks_attempted": $total_tasks_attempted,
        "completion_rate": $completion_rate,
        "verification_count": $verification_count,
        "verify_rate": $verify_rate,
        "security_fixes": $security_fixes
    },
    "collected_at": "$(date -Iseconds)"
}
EOF
}

# Push metrics to MCP server
push_to_mcp() {
    local metrics="$1"

    if [ -z "$MCP_SERVER_URL" ]; then
        log_warning "MCP server URL not configured. Use --mcp-server or set MCP_SERVER_URL"
        return 1
    fi

    if ! command -v curl &> /dev/null; then
        log_error "curl is required for MCP server integration"
        return 1
    fi

    log_info "Pushing metrics to MCP server: $MCP_SERVER_URL"

    local response
    response=$(curl -s -X POST \
        -H "Content-Type: application/json" \
        -d "$metrics" \
        "${MCP_SERVER_URL}/team-metrics" 2>&1)

    if echo "$response" | jq -e '.success' > /dev/null 2>&1; then
        log_success "Metrics pushed successfully"
        return 0
    else
        log_error "Failed to push metrics: $response"
        return 1
    fi
}

# Save to shared directory
save_to_shared() {
    local metrics="$1"

    if [ -z "$SHARED_METRICS_DIR" ]; then
        log_warning "Shared directory not configured. Use --shared-dir or set SHARED_METRICS_DIR"
        return 1
    fi

    if [ ! -d "$SHARED_METRICS_DIR" ]; then
        log_error "Shared directory does not exist: $SHARED_METRICS_DIR"
        return 1
    fi

    local developer
    developer=$(whoami)
    local timestamp
    timestamp=$(date +%Y%m%d-%H%M%S)
    local output_file="$SHARED_METRICS_DIR/${TEAM_NAME}-${developer}-${timestamp}.json"

    echo "$metrics" > "$output_file"
    log_success "Metrics saved to: $output_file"
}

# Aggregate team metrics from shared directory
aggregate_team_metrics() {
    if [ -z "$SHARED_METRICS_DIR" ] || [ ! -d "$SHARED_METRICS_DIR" ]; then
        log_error "Shared directory not configured or doesn't exist"
        return 1
    fi

    local total_sessions=0
    local total_duration=0
    local total_tasks_completed=0
    local total_tasks_attempted=0
    local total_verify_count=0
    local developers="[]"

    IFS='|' read -r start_date end_date <<< "$(get_date_range)"

    for file in "$SHARED_METRICS_DIR"/${TEAM_NAME}-*.json; do
        [ -f "$file" ] || continue

        local collected_at
        collected_at=$(jq -r '.collected_at // ""' "$file")
        local file_date
        file_date=$(echo "$collected_at" | cut -d'T' -f1)

        # Simple date check (could be more precise)
        local dev_name
        dev_name=$(jq -r '.developer // "unknown"' "$file")
        local dev_sessions
        dev_sessions=$(jq -r '.metrics.sessions // 0' "$file")
        local dev_tasks
        dev_tasks=$(jq -r '.metrics.tasks_completed // 0' "$file")

        total_sessions=$((total_sessions + dev_sessions))
        total_duration=$((total_duration + $(jq -r '.metrics.total_duration_minutes // 0' "$file")))
        total_tasks_completed=$((total_tasks_completed + dev_tasks))
        total_tasks_attempted=$((total_tasks_attempted + $(jq -r '.metrics.tasks_attempted // 0' "$file")))
        total_verify_count=$((total_verify_count + $(jq -r '.metrics.verification_count // 0' "$file")))

        # Add to developers list
        developers=$(echo "$developers" | jq --arg name "$dev_name" --argjson sessions "$dev_sessions" --argjson tasks "$dev_tasks" \
            '. + [{"name": $name, "sessions": $sessions, "tasks_completed": $tasks}]')
    done

    local team_completion_rate=0
    local team_verify_rate=0

    if [ "$total_tasks_attempted" -gt 0 ]; then
        team_completion_rate=$((total_tasks_completed * 100 / total_tasks_attempted))
    fi

    if [ "$total_sessions" -gt 0 ]; then
        team_verify_rate=$((total_verify_count * 100 / total_sessions))
    fi

    cat << EOF
{
    "team": "$TEAM_NAME",
    "period": {
        "type": "$PERIOD",
        "start": "$start_date",
        "end": "$end_date"
    },
    "aggregate": {
        "total_sessions": $total_sessions,
        "total_duration_hours": $((total_duration / 60)),
        "total_tasks_completed": $total_tasks_completed,
        "completion_rate": $team_completion_rate,
        "verify_rate": $team_verify_rate
    },
    "developers": $developers,
    "aggregated_at": "$(date -Iseconds)"
}
EOF
}

# Main
main() {
    log_info "Collecting team metrics for: $TEAM_NAME ($PERIOD)"

    local metrics
    metrics=$(collect_local_metrics)

    if [ "$EXPORT_MODE" = "true" ]; then
        # If shared dir exists, aggregate team data
        if [ -n "$SHARED_METRICS_DIR" ] && [ -d "$SHARED_METRICS_DIR" ]; then
            aggregate_team_metrics
        else
            echo "$metrics"
        fi
    else
        # Interactive mode - show summary and optionally push/save
        echo "$metrics" | jq '.'

        echo ""
        log_info "Options for sharing:"

        if [ -n "$MCP_SERVER_URL" ]; then
            echo "  - Push to MCP server: Use --mcp-server option"
            push_to_mcp "$metrics" || true
        fi

        if [ -n "$SHARED_METRICS_DIR" ]; then
            echo "  - Save to shared directory: $SHARED_METRICS_DIR"
            save_to_shared "$metrics" || true
        fi

        if [ -z "$MCP_SERVER_URL" ] && [ -z "$SHARED_METRICS_DIR" ]; then
            log_warning "No sharing method configured."
            echo ""
            echo "Configure team sharing with:"
            echo "  --mcp-server URL     Push to MCP server"
            echo "  --shared-dir DIR     Save to shared directory"
            echo ""
            echo "Or use --export to output JSON for manual sharing."
        fi
    fi
}

main
