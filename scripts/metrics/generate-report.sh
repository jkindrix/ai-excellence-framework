#!/bin/bash
#
# AI Excellence Framework - HTML Report Generator
#
# Generates a static HTML report from collected metrics.
#
# Usage:
#   ./generate-report.sh                          # Generate report to stdout
#   ./generate-report.sh > report.html            # Save to file
#   ./generate-report.sh --from 2025-01-01        # Custom date range
#   ./generate-report.sh --from 2025-01-01 --to 2025-01-31
#   ./generate-report.sh --format json            # Output JSON instead of HTML
#
# Dependencies: jq (for JSON parsing)

set -euo pipefail

# Configuration
METRICS_DIR="${METRICS_DIR:-.tmp/metrics}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TEMPLATE_FILE="${SCRIPT_DIR}/report-template.html"

# Default date range (last 30 days)
FROM_DATE=$(date -d "30 days ago" +%Y-%m-%d 2>/dev/null || date -v-30d +%Y-%m-%d 2>/dev/null || echo "1970-01-01")
TO_DATE=$(date +%Y-%m-%d)
OUTPUT_FORMAT="html"

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --from)
            FROM_DATE="$2"
            shift 2
            ;;
        --to)
            TO_DATE="$2"
            shift 2
            ;;
        --format)
            OUTPUT_FORMAT="$2"
            shift 2
            ;;
        --help|-h)
            echo "Usage: $0 [options]"
            echo ""
            echo "Options:"
            echo "  --from DATE    Start date (YYYY-MM-DD), default: 30 days ago"
            echo "  --to DATE      End date (YYYY-MM-DD), default: today"
            echo "  --format FMT   Output format: html (default) or json"
            echo "  --help         Show this help message"
            exit 0
            ;;
        *)
            shift
            ;;
    esac
done

# Check for jq
if ! command -v jq &> /dev/null; then
    echo "Error: jq is required but not installed." >&2
    echo "Install with: sudo apt install jq (Debian/Ubuntu) or brew install jq (macOS)" >&2
    exit 1
fi

# Convert date to epoch for comparison
date_to_epoch() {
    date -d "$1" +%s 2>/dev/null || date -jf "%Y-%m-%d" "$1" +%s 2>/dev/null || echo 0
}

FROM_EPOCH=$(date_to_epoch "$FROM_DATE")
TO_EPOCH=$(date_to_epoch "$TO_DATE")

# Collect metrics data
collect_metrics() {
    local total_sessions=0
    local total_duration=0
    local total_tasks_attempted=0
    local total_tasks_completed=0
    local total_issues_caught=0
    local total_ai_errors=0
    local used_plan_count=0
    local used_verify_count=0
    local satisfaction_sum=0

    local date_labels="[]"
    local tasks_data="[]"
    local friction_context=0
    local friction_hallucination=0
    local friction_other=0

    if [ -d "$METRICS_DIR" ]; then
        for file in "$METRICS_DIR"/*-session-*.json; do
            [ -f "$file" ] || continue

            # Extract date from filename
            local file_date
            file_date=$(basename "$file" | grep -oE '^[0-9]{4}-[0-9]{2}-[0-9]{2}' || echo "1970-01-01")
            local file_epoch
            file_epoch=$(date_to_epoch "$file_date")

            # Check date range
            if [ "$file_epoch" -ge "$FROM_EPOCH" ] && [ "$file_epoch" -le "$TO_EPOCH" ]; then
                total_sessions=$((total_sessions + 1))

                # Parse metrics
                local duration=$(jq -r '.metrics.session_duration_minutes // 0' "$file")
                local tasks_attempted=$(jq -r '.metrics.tasks_attempted // 0' "$file")
                local tasks_completed=$(jq -r '.metrics.tasks_completed // 0' "$file")
                local issues=$(jq -r '.metrics.issues_caught_by_verification // 0' "$file")
                local ai_errors=$(jq -r '.metrics.ai_errors_observed // 0' "$file")
                local satisfaction=$(jq -r '.satisfaction // 3' "$file")
                local plan=$(jq -r '.workflow.used_plan // false' "$file")
                local verify=$(jq -r '.workflow.used_verify // false' "$file")

                total_duration=$((total_duration + duration))
                total_tasks_attempted=$((total_tasks_attempted + tasks_attempted))
                total_tasks_completed=$((total_tasks_completed + tasks_completed))
                total_issues_caught=$((total_issues_caught + issues))
                total_ai_errors=$((total_ai_errors + ai_errors))
                satisfaction_sum=$((satisfaction_sum + satisfaction))

                [ "$plan" = "true" ] && used_plan_count=$((used_plan_count + 1))
                [ "$verify" = "true" ] && used_verify_count=$((used_verify_count + 1))

                # Build date/tasks arrays
                date_labels=$(echo "$date_labels" | jq --arg d "$file_date" '. + [$d]')
                tasks_data=$(echo "$tasks_data" | jq --argjson t "$tasks_completed" '. + [$t]')
            fi
        done

        # Count friction types from auto metrics
        for file in "$METRICS_DIR"/*-auto.json; do
            [ -f "$file" ] || continue

            local file_date
            file_date=$(basename "$file" | grep -oE '^[0-9]{4}-[0-9]{2}-[0-9]{2}' || echo "1970-01-01")
            local file_epoch
            file_epoch=$(date_to_epoch "$file_date")

            if [ "$file_epoch" -ge "$FROM_EPOCH" ] && [ "$file_epoch" -le "$TO_EPOCH" ]; then
                # Estimate friction from auto metrics
                local claude_fresh=$(jq -r '.health_indicators.claude_md_fresh // true' "$file")
                [ "$claude_fresh" = "false" ] && friction_context=$((friction_context + 1))
            fi
        done
    fi

    # Calculate derived metrics
    local total_hours=0
    local completion_rate=0
    local avg_satisfaction=3
    local plan_rate=0
    local verify_rate=0
    local friction_mitigation=75  # Estimated baseline

    if [ "$total_sessions" -gt 0 ]; then
        total_hours=$((total_duration / 60))
        avg_satisfaction=$((satisfaction_sum / total_sessions))
        plan_rate=$((used_plan_count * 100 / total_sessions))
        verify_rate=$((used_verify_count * 100 / total_sessions))
    fi

    if [ "$total_tasks_attempted" -gt 0 ]; then
        completion_rate=$((total_tasks_completed * 100 / total_tasks_attempted))
    fi

    # Estimate friction mitigation from verify usage
    if [ "$total_issues_caught" -gt 0 ]; then
        friction_mitigation=$((80 + verify_rate / 10))
        [ "$friction_mitigation" -gt 100 ] && friction_mitigation=100
    fi

    # Friction data (estimated distribution)
    friction_hallucination=$total_ai_errors
    friction_other=$((total_sessions / 5))

    # Output as JSON
    cat << EOF
{
  "period": {
    "from": "$FROM_DATE",
    "to": "$TO_DATE"
  },
  "summary": {
    "total_sessions": $total_sessions,
    "total_hours": $total_hours,
    "total_duration_minutes": $total_duration,
    "completion_rate": $completion_rate,
    "friction_mitigation_rate": $friction_mitigation,
    "avg_satisfaction": $avg_satisfaction
  },
  "tasks": {
    "attempted": $total_tasks_attempted,
    "completed": $total_tasks_completed,
    "issues_caught": $total_issues_caught
  },
  "ai_quality": {
    "errors_observed": $total_ai_errors
  },
  "workflow": {
    "plan_usage_rate": $plan_rate,
    "verify_usage_rate": $verify_rate
  },
  "friction": {
    "context_loss": $friction_context,
    "hallucination": $friction_hallucination,
    "outdated_knowledge": $friction_other,
    "other": $friction_other
  },
  "charts": {
    "date_labels": $date_labels,
    "tasks_data": $tasks_data
  },
  "generated_at": "$(date -Iseconds)"
}
EOF
}

# Generate HTML report
generate_html() {
    local metrics
    metrics=$(collect_metrics)

    # Extract values for template
    local total_sessions=$(echo "$metrics" | jq -r '.summary.total_sessions')
    local total_hours=$(echo "$metrics" | jq -r '.summary.total_hours')
    local completion_rate=$(echo "$metrics" | jq -r '.summary.completion_rate')
    local friction_mitigation=$(echo "$metrics" | jq -r '.summary.friction_mitigation_rate')
    local date_labels=$(echo "$metrics" | jq -c '.charts.date_labels')
    local tasks_data=$(echo "$metrics" | jq -c '.charts.tasks_data')
    local generated_at=$(echo "$metrics" | jq -r '.generated_at')

    # Friction data for pie chart
    local friction_labels='["Context Loss", "Hallucination", "Outdated Knowledge", "Other"]'
    local f_context=$(echo "$metrics" | jq -r '.friction.context_loss')
    local f_hall=$(echo "$metrics" | jq -r '.friction.hallucination')
    local f_outdated=$(echo "$metrics" | jq -r '.friction.outdated_knowledge')
    local f_other=$(echo "$metrics" | jq -r '.friction.other')
    local friction_data="[$f_context, $f_hall, $f_outdated, $f_other]"

    # If no template exists, use embedded template
    if [ -f "$TEMPLATE_FILE" ]; then
        # Replace placeholders in template
        sed \
            -e "s/{{generated_at}}/$generated_at/g" \
            -e "s/{{total_sessions}}/$total_sessions/g" \
            -e "s/{{total_hours}}/$total_hours/g" \
            -e "s/{{completion_rate}}/$completion_rate/g" \
            -e "s/{{friction_mitigation_rate}}/$friction_mitigation/g" \
            -e "s/{{date_labels}}/$date_labels/g" \
            -e "s/{{tasks_data}}/$tasks_data/g" \
            -e "s/{{friction_labels}}/$friction_labels/g" \
            -e "s/{{friction_data}}/$friction_data/g" \
            "$TEMPLATE_FILE"
    else
        # Embedded minimal template
        cat << EOF
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AI Excellence Metrics Report</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <style>
        :root { --primary: #2563eb; --success: #10b981; --warning: #f59e0b; --danger: #ef4444; }
        body { font-family: system-ui, -apple-system, sans-serif; max-width: 1200px; margin: 0 auto; padding: 20px; background: #f9fafb; }
        .card { background: white; border-radius: 12px; padding: 24px; margin: 20px 0; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
        h1 { color: #1f2937; border-bottom: 2px solid var(--primary); padding-bottom: 10px; }
        h2 { color: #374151; margin-top: 0; }
        .metrics { display: flex; flex-wrap: wrap; gap: 20px; }
        .metric { flex: 1; min-width: 150px; text-align: center; padding: 20px; background: #f3f4f6; border-radius: 8px; }
        .metric-value { font-size: 2.5em; font-weight: bold; color: var(--primary); }
        .metric-label { color: #6b7280; margin-top: 5px; }
        .chart-container { position: relative; height: 300px; }
        .period { color: #6b7280; font-size: 0.9em; }
        .footer { text-align: center; color: #9ca3af; margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; }
    </style>
</head>
<body>
    <h1>AI Excellence Framework Metrics</h1>
    <p class="period">Report Period: $FROM_DATE to $TO_DATE</p>

    <div class="card">
        <h2>Summary</h2>
        <div class="metrics">
            <div class="metric">
                <div class="metric-value">$total_sessions</div>
                <div class="metric-label">Sessions</div>
            </div>
            <div class="metric">
                <div class="metric-value">${total_hours}h</div>
                <div class="metric-label">Total Time</div>
            </div>
            <div class="metric">
                <div class="metric-value">$completion_rate%</div>
                <div class="metric-label">Completion Rate</div>
            </div>
            <div class="metric">
                <div class="metric-value">$friction_mitigation%</div>
                <div class="metric-label">Friction Mitigated</div>
            </div>
        </div>
    </div>

    <div class="card">
        <h2>Tasks Completed Over Time</h2>
        <div class="chart-container">
            <canvas id="productivityChart"></canvas>
        </div>
    </div>

    <div class="card">
        <h2>Friction Points Distribution</h2>
        <div class="chart-container" style="max-width: 400px; margin: 0 auto;">
            <canvas id="frictionChart"></canvas>
        </div>
    </div>

    <div class="footer">
        <p>Generated by AI Excellence Framework on $generated_at</p>
        <p><a href="https://ai-excellence-framework.github.io/">Documentation</a></p>
    </div>

    <script>
        // Productivity chart
        new Chart(document.getElementById('productivityChart'), {
            type: 'line',
            data: {
                labels: $date_labels,
                datasets: [{
                    label: 'Tasks Completed',
                    data: $tasks_data,
                    borderColor: '#2563eb',
                    backgroundColor: 'rgba(37, 99, 235, 0.1)',
                    tension: 0.3,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: { y: { beginAtZero: true } }
            }
        });

        // Friction chart
        new Chart(document.getElementById('frictionChart'), {
            type: 'doughnut',
            data: {
                labels: $friction_labels,
                datasets: [{
                    data: $friction_data,
                    backgroundColor: ['#ef4444', '#f59e0b', '#10b981', '#6366f1']
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false
            }
        });
    </script>
</body>
</html>
EOF
    fi
}

# Main
case $OUTPUT_FORMAT in
    json)
        collect_metrics
        ;;
    html|*)
        generate_html
        ;;
esac
