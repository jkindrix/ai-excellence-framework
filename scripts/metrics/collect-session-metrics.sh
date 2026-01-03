#!/bin/bash
#
# AI Excellence Framework - Session Metrics Collection
#
# Collects baseline and ongoing metrics for AI-assisted development effectiveness.
# Run at session end or via cron for aggregate tracking.
#
# Usage:
#   ./collect-session-metrics.sh                    # Interactive mode
#   ./collect-session-metrics.sh --auto             # Automated collection
#   ./collect-session-metrics.sh --report           # Generate report
#   ./collect-session-metrics.sh --baseline         # Establish baseline
#
# Output: .tmp/metrics/YYYY-MM-DD-session.json (gitignored)
#

set -euo pipefail

# Configuration
METRICS_DIR="${METRICS_DIR:-.tmp/metrics}"
HANDOFFS_DIR="${HANDOFFS_DIR:-docs/session-notes}"
DATE=$(date +%Y-%m-%d)
TIMESTAMP=$(date -Iseconds)

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Ensure metrics directory exists
mkdir -p "$METRICS_DIR"

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[OK]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1" >&2
}

# Collect automated metrics (no user input required)
collect_automated_metrics() {
    local output_file="$METRICS_DIR/${DATE}-auto.json"

    log_info "Collecting automated metrics..."

    # Count session handoffs in last 7 days
    local handoffs_7d=0
    if [ -d "$HANDOFFS_DIR" ]; then
        handoffs_7d=$(find "$HANDOFFS_DIR" -name "*.md" -mtime -7 2>/dev/null | wc -l | tr -d ' ')
    fi

    # Count commits in last 7 days
    local commits_7d=0
    if git rev-parse --git-dir > /dev/null 2>&1; then
        commits_7d=$(git log --oneline --since="1 week ago" 2>/dev/null | wc -l | tr -d ' ')
    fi

    # Count AI-related commits (rough heuristic)
    local ai_commits_7d=0
    if git rev-parse --git-dir > /dev/null 2>&1; then
        ai_commits_7d=$(git log --oneline --since="1 week ago" 2>/dev/null | grep -ciE '(claude|ai|copilot|assistant|generated)' || echo 0)
    fi

    # Count TODO items in codebase
    local todo_count=0
    todo_count=$(grep -rn "TODO\|FIXME\|HACK\|XXX" --include="*.ts" --include="*.js" --include="*.py" --include="*.go" . 2>/dev/null | wc -l | tr -d ' ' || echo 0)

    # Check CLAUDE.md freshness
    local claude_md_age_days=999
    if [ -f "CLAUDE.md" ]; then
        local last_modified
        last_modified=$(stat -c %Y "CLAUDE.md" 2>/dev/null || stat -f %m "CLAUDE.md" 2>/dev/null)
        local now
        now=$(date +%s)
        claude_md_age_days=$(( (now - last_modified) / 86400 ))
    fi

    # Count security-related commits
    local security_fixes_7d=0
    if git rev-parse --git-dir > /dev/null 2>&1; then
        security_fixes_7d=$(git log --oneline --since="1 week ago" 2>/dev/null | grep -ciE '(security|vuln|cve|fix.*auth|sanitize)' || echo 0)
    fi

    # Generate JSON output
    cat > "$output_file" << EOF
{
  "timestamp": "$TIMESTAMP",
  "date": "$DATE",
  "type": "automated",
  "metrics": {
    "handoffs_last_7_days": $handoffs_7d,
    "commits_last_7_days": $commits_7d,
    "ai_related_commits_7d": $ai_commits_7d,
    "security_fixes_7d": $security_fixes_7d,
    "outstanding_todos": $todo_count,
    "claude_md_age_days": $claude_md_age_days
  },
  "health_indicators": {
    "claude_md_fresh": $([ $claude_md_age_days -lt 7 ] && echo "true" || echo "false"),
    "handoffs_active": $([ $handoffs_7d -gt 0 ] && echo "true" || echo "false"),
    "security_attention": $([ $security_fixes_7d -gt 0 ] && echo "true" || echo "false")
  }
}
EOF

    log_success "Automated metrics saved to $output_file"
}

# Collect interactive session metrics
collect_session_metrics() {
    local output_file="$METRICS_DIR/${DATE}-session-$(date +%H%M%S).json"

    echo ""
    echo "═══════════════════════════════════════════════════════════"
    echo "  AI Excellence Framework - Session Metrics Collection"
    echo "═══════════════════════════════════════════════════════════"
    echo ""

    # Session duration
    read -rp "Session duration (minutes, estimate): " session_duration
    session_duration=${session_duration:-0}

    # Context rebuild time
    read -rp "Time to become productive (minutes, 0 if continuing): " context_rebuild
    context_rebuild=${context_rebuild:-0}

    # Tasks attempted/completed
    read -rp "Tasks attempted this session: " tasks_attempted
    tasks_attempted=${tasks_attempted:-0}

    read -rp "Tasks completed this session: " tasks_completed
    tasks_completed=${tasks_completed:-0}

    # Plan usage
    read -rp "Did you use /plan before implementing? (y/n): " used_plan
    used_plan=$([ "$used_plan" = "y" ] && echo "true" || echo "false")

    # Verification usage
    read -rp "Did you use /verify before completing? (y/n): " used_verify
    used_verify=$([ "$used_verify" = "y" ] && echo "true" || echo "false")

    # Issues caught
    read -rp "Issues caught by verification (0 if none): " issues_caught
    issues_caught=${issues_caught:-0}

    # AI errors observed
    read -rp "AI errors/hallucinations observed (0 if none): " ai_errors
    ai_errors=${ai_errors:-0}

    # Handoff created
    read -rp "Did you create a session handoff? (y/n): " created_handoff
    created_handoff=$([ "$created_handoff" = "y" ] && echo "true" || echo "false")

    # Satisfaction score
    read -rp "Session effectiveness (1-5, where 5 is excellent): " satisfaction
    satisfaction=${satisfaction:-3}

    # Notes
    read -rp "Any notes for this session (optional): " notes
    notes=${notes:-""}

    # Generate JSON output
    cat > "$output_file" << EOF
{
  "timestamp": "$TIMESTAMP",
  "date": "$DATE",
  "type": "session",
  "metrics": {
    "session_duration_minutes": $session_duration,
    "context_rebuild_minutes": $context_rebuild,
    "tasks_attempted": $tasks_attempted,
    "tasks_completed": $tasks_completed,
    "issues_caught_by_verification": $issues_caught,
    "ai_errors_observed": $ai_errors
  },
  "workflow": {
    "used_plan": $used_plan,
    "used_verify": $used_verify,
    "created_handoff": $created_handoff
  },
  "satisfaction": $satisfaction,
  "notes": "$notes"
}
EOF

    log_success "Session metrics saved to $output_file"
    echo ""

    # Calculate and display derived metrics
    if [ "$tasks_attempted" -gt 0 ]; then
        local completion_rate
        completion_rate=$(echo "scale=0; $tasks_completed * 100 / $tasks_attempted" | bc)
        log_info "Task completion rate: ${completion_rate}%"
    fi

    if [ "$session_duration" -gt 0 ] && [ "$context_rebuild" -gt 0 ]; then
        local productive_pct
        productive_pct=$(echo "scale=0; ($session_duration - $context_rebuild) * 100 / $session_duration" | bc)
        log_info "Productive time: ${productive_pct}%"
    fi
}

# Generate metrics report
generate_report() {
    echo ""
    echo "═══════════════════════════════════════════════════════════"
    echo "  AI Excellence Framework - Metrics Report"
    echo "═══════════════════════════════════════════════════════════"
    echo ""

    if [ ! -d "$METRICS_DIR" ] || [ -z "$(ls -A "$METRICS_DIR" 2>/dev/null)" ]; then
        log_warning "No metrics collected yet. Run with --auto or interactively first."
        return 1
    fi

    # Aggregate session metrics
    local total_sessions=0
    local total_duration=0
    local total_rebuild=0
    local total_tasks_completed=0
    local total_issues_caught=0
    local total_ai_errors=0
    local used_plan_count=0
    local used_verify_count=0

    for file in "$METRICS_DIR"/*-session-*.json; do
        [ -f "$file" ] || continue
        total_sessions=$((total_sessions + 1))

        # Parse JSON with jq if available, otherwise grep
        if command -v jq &> /dev/null; then
            total_duration=$((total_duration + $(jq -r '.metrics.session_duration_minutes // 0' "$file")))
            total_rebuild=$((total_rebuild + $(jq -r '.metrics.context_rebuild_minutes // 0' "$file")))
            total_tasks_completed=$((total_tasks_completed + $(jq -r '.metrics.tasks_completed // 0' "$file")))
            total_issues_caught=$((total_issues_caught + $(jq -r '.metrics.issues_caught_by_verification // 0' "$file")))
            total_ai_errors=$((total_ai_errors + $(jq -r '.metrics.ai_errors_observed // 0' "$file")))

            if [ "$(jq -r '.workflow.used_plan' "$file")" = "true" ]; then
                used_plan_count=$((used_plan_count + 1))
            fi
            if [ "$(jq -r '.workflow.used_verify' "$file")" = "true" ]; then
                used_verify_count=$((used_verify_count + 1))
            fi
        fi
    done

    echo "📊 Aggregate Metrics (${total_sessions} sessions)"
    echo "────────────────────────────────────────────────────────────"
    echo ""

    if [ "$total_sessions" -gt 0 ]; then
        local avg_duration=$((total_duration / total_sessions))
        local avg_rebuild=$((total_rebuild / total_sessions))
        local plan_rate=$((used_plan_count * 100 / total_sessions))
        local verify_rate=$((used_verify_count * 100 / total_sessions))

        echo "⏱️  Average session duration: ${avg_duration} minutes"
        echo "🔄 Average context rebuild time: ${avg_rebuild} minutes"
        echo "✅ Total tasks completed: ${total_tasks_completed}"
        echo "🔍 Issues caught by verification: ${total_issues_caught}"
        echo "⚠️  AI errors observed: ${total_ai_errors}"
        echo ""
        echo "📋 Workflow adoption:"
        echo "   /plan usage: ${plan_rate}% of sessions"
        echo "   /verify usage: ${verify_rate}% of sessions"

        if [ "$avg_rebuild" -gt 0 ] && [ "$avg_duration" -gt 0 ]; then
            local productivity_loss=$((avg_rebuild * 100 / avg_duration))
            echo ""
            echo "💡 Context rebuild consumes ${productivity_loss}% of session time"
        fi
    fi

    echo ""
}

# Establish baseline measurements
establish_baseline() {
    echo ""
    echo "═══════════════════════════════════════════════════════════"
    echo "  AI Excellence Framework - Baseline Establishment"
    echo "═══════════════════════════════════════════════════════════"
    echo ""
    log_info "Establishing baseline before framework adoption..."
    echo ""

    read -rp "Average time to become productive in a new session (minutes): " baseline_rebuild
    read -rp "Average tasks completed per session: " baseline_tasks
    read -rp "Estimated percentage of AI errors requiring rework: " baseline_error_rate
    read -rp "Current satisfaction with AI workflow (1-5): " baseline_satisfaction

    cat > "$METRICS_DIR/baseline.json" << EOF
{
  "timestamp": "$TIMESTAMP",
  "type": "baseline",
  "baseline": {
    "context_rebuild_minutes": ${baseline_rebuild:-10},
    "tasks_per_session": ${baseline_tasks:-3},
    "error_rework_rate_percent": ${baseline_error_rate:-30},
    "satisfaction": ${baseline_satisfaction:-3}
  },
  "notes": "Baseline established before AI Excellence Framework adoption"
}
EOF

    log_success "Baseline saved to $METRICS_DIR/baseline.json"
    echo ""
    log_info "After using the framework, run with --report to compare against baseline."
}

# Main
case "${1:-}" in
    --auto)
        collect_automated_metrics
        ;;
    --report)
        generate_report
        ;;
    --baseline)
        establish_baseline
        ;;
    --help|-h)
        echo "Usage: $0 [option]"
        echo ""
        echo "Options:"
        echo "  (none)      Interactive session metrics collection"
        echo "  --auto      Automated metrics collection (no prompts)"
        echo "  --report    Generate aggregate metrics report"
        echo "  --baseline  Establish baseline measurements"
        echo "  --help      Show this help message"
        ;;
    *)
        collect_session_metrics
        ;;
esac
