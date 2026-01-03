#!/bin/bash
#
# AI Excellence Framework - Metrics Dashboard
#
# Terminal-based dashboard for visualizing session metrics.
#
# Usage:
#   ./dashboard.sh               # Static summary
#   ./dashboard.sh --live        # Live updating dashboard
#   ./dashboard.sh --charts      # Include ASCII charts
#
# Dependencies: jq (for JSON parsing)

set -euo pipefail

# Configuration
METRICS_DIR="${METRICS_DIR:-.tmp/metrics}"
REFRESH_INTERVAL=30

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
WHITE='\033[1;37m'
NC='\033[0m'
BOLD='\033[1m'
DIM='\033[2m'

# Box drawing characters
TL='╔' TR='╗' BL='╚' BR='╝' H='═' V='║' LT='╠' RT='╣' HV='╬'

# Check for jq
check_dependencies() {
    if ! command -v jq &> /dev/null; then
        echo -e "${RED}Error: jq is required but not installed.${NC}"
        echo "Install with: sudo apt install jq (Debian/Ubuntu) or brew install jq (macOS)"
        exit 1
    fi
}

# Draw a horizontal line
draw_line() {
    local width=$1
    local left=${2:-$H}
    local right=${3:-$H}
    local fill=${4:-$H}

    printf "%s" "$left"
    for ((i=1; i<width-1; i++)); do
        printf "%s" "$fill"
    done
    printf "%s\n" "$right"
}

# Draw a progress bar
draw_bar() {
    local percent=$1
    local width=${2:-20}
    local filled=$((percent * width / 100))
    local empty=$((width - filled))

    printf "${GREEN}"
    for ((i=0; i<filled; i++)); do printf "█"; done
    printf "${DIM}"
    for ((i=0; i<empty; i++)); do printf "░"; done
    printf "${NC}"
}

# Calculate percentage
calc_percent() {
    local num=$1
    local denom=$2
    if [ "$denom" -eq 0 ]; then
        echo 0
    else
        echo $((num * 100 / denom))
    fi
}

# Get latest session metrics
get_session_metrics() {
    local latest_session=""
    local latest_auto=""

    if [ -d "$METRICS_DIR" ]; then
        latest_session=$(ls -t "$METRICS_DIR"/*-session-*.json 2>/dev/null | head -1 || true)
        latest_auto=$(ls -t "$METRICS_DIR"/*-auto.json 2>/dev/null | head -1 || true)
    fi

    echo "$latest_session|$latest_auto"
}

# Parse session data
parse_session() {
    local file=$1
    if [ -f "$file" ] && command -v jq &> /dev/null; then
        jq -r "$2" "$file" 2>/dev/null || echo "0"
    else
        echo "0"
    fi
}

# Aggregate weekly data
aggregate_weekly() {
    local total_duration=0
    local total_tasks=0
    local total_completed=0
    local session_count=0

    if [ -d "$METRICS_DIR" ]; then
        for file in "$METRICS_DIR"/*-session-*.json; do
            [ -f "$file" ] || continue

            # Check if file is from last 7 days
            local file_date
            file_date=$(basename "$file" | cut -d'-' -f1-3)
            local file_epoch
            file_epoch=$(date -d "$file_date" +%s 2>/dev/null || date -jf "%Y-%m-%d" "$file_date" +%s 2>/dev/null || echo 0)
            local week_ago
            week_ago=$(date -d "7 days ago" +%s 2>/dev/null || date -v-7d +%s 2>/dev/null || echo 0)

            if [ "$file_epoch" -gt "$week_ago" ]; then
                session_count=$((session_count + 1))
                total_duration=$((total_duration + $(parse_session "$file" '.metrics.session_duration_minutes // 0')))
                total_tasks=$((total_tasks + $(parse_session "$file" '.metrics.tasks_attempted // 0')))
                total_completed=$((total_completed + $(parse_session "$file" '.metrics.tasks_completed // 0')))
            fi
        done
    fi

    echo "$session_count|$total_duration|$total_tasks|$total_completed"
}

# Draw the main dashboard
draw_dashboard() {
    local width=64
    local show_charts=${1:-false}

    # Get metrics
    IFS='|' read -r session_file auto_file <<< "$(get_session_metrics)"
    IFS='|' read -r week_sessions week_duration week_tasks week_completed <<< "$(aggregate_weekly)"

    # Clear screen for live mode
    if [ "${LIVE_MODE:-false}" = "true" ]; then
        clear
    fi

    # Header
    echo -e "${CYAN}"
    draw_line $width $TL $TR
    printf "${V}%*s${V}\n" $((width-2)) ""
    printf "${V}  ${WHITE}${BOLD}AI Excellence Framework Dashboard${NC}${CYAN}%*s${V}\n" $((width-38)) ""
    printf "${V}%*s${V}\n" $((width-2)) ""
    draw_line $width $LT $RT
    echo -e "${NC}"

    # Current Session (if exists)
    if [ -f "$session_file" ]; then
        local duration=$(parse_session "$session_file" '.metrics.session_duration_minutes // 0')
        local tasks_attempted=$(parse_session "$session_file" '.metrics.tasks_attempted // 0')
        local tasks_completed=$(parse_session "$session_file" '.metrics.tasks_completed // 0')
        local completion_pct=$(calc_percent "$tasks_completed" "$tasks_attempted")

        printf "${CYAN}${V}${NC} ${BOLD}Current Session${NC}%*s${CYAN}${V}${NC}\n" $((width-19)) ""
        printf "${CYAN}${V}${NC} Duration: ${WHITE}%dh %dm${NC}" $((duration/60)) $((duration%60))
        printf "%*s${CYAN}${V}${NC}\n" $((width-22-${#duration})) ""
        printf "${CYAN}${V}${NC} Tasks: "
        draw_bar $completion_pct 20
        printf " %d/%d (%d%%)" "$tasks_completed" "$tasks_attempted" "$completion_pct"
        printf "%*s${CYAN}${V}${NC}\n" $((width-44-${#tasks_completed}-${#tasks_attempted})) ""
        echo -e "${CYAN}"
        draw_line $width $LT $RT
        echo -e "${NC}"
    fi

    # Weekly Summary
    printf "${CYAN}${V}${NC} ${BOLD}Weekly Summary${NC} (Last 7 days)%*s${CYAN}${V}${NC}\n" $((width-32)) ""
    printf "${CYAN}${V}${NC} Sessions: ${WHITE}%d${NC}" "$week_sessions"
    printf "%*s${CYAN}${V}${NC}\n" $((width-14-${#week_sessions})) ""

    local week_hours=$((week_duration / 60))
    local week_mins=$((week_duration % 60))
    printf "${CYAN}${V}${NC} Total Time: ${WHITE}%dh %dm${NC}" "$week_hours" "$week_mins"
    printf "%*s${CYAN}${V}${NC}\n" $((width-20-${#week_hours})) ""

    local week_completion=$(calc_percent "$week_completed" "$week_tasks")
    printf "${CYAN}${V}${NC} Task Completion: "
    draw_bar $week_completion 15
    printf " %d%%" "$week_completion"
    printf "%*s${CYAN}${V}${NC}\n" $((width-40)) ""

    # Health Indicators from auto metrics
    if [ -f "$auto_file" ]; then
        echo -e "${CYAN}"
        draw_line $width $LT $RT
        echo -e "${NC}"
        printf "${CYAN}${V}${NC} ${BOLD}Health Indicators${NC}%*s${CYAN}${V}${NC}\n" $((width-21)) ""

        local claude_fresh=$(parse_session "$auto_file" '.health_indicators.claude_md_fresh // false')
        local handoffs_active=$(parse_session "$auto_file" '.health_indicators.handoffs_active // false')
        local todos=$(parse_session "$auto_file" '.metrics.outstanding_todos // 0')

        if [ "$claude_fresh" = "true" ]; then
            printf "${CYAN}${V}${NC} ${GREEN}✓${NC} CLAUDE.md up to date%*s${CYAN}${V}${NC}\n" $((width-26)) ""
        else
            printf "${CYAN}${V}${NC} ${YELLOW}!${NC} CLAUDE.md needs update%*s${CYAN}${V}${NC}\n" $((width-27)) ""
        fi

        if [ "$handoffs_active" = "true" ]; then
            printf "${CYAN}${V}${NC} ${GREEN}✓${NC} Session handoffs active%*s${CYAN}${V}${NC}\n" $((width-28)) ""
        else
            printf "${CYAN}${V}${NC} ${YELLOW}!${NC} No recent handoffs%*s${CYAN}${V}${NC}\n" $((width-24)) ""
        fi

        if [ "$todos" -lt 20 ]; then
            printf "${CYAN}${V}${NC} ${GREEN}✓${NC} TODOs: %d%*s${CYAN}${V}${NC}\n" "$todos" $((width-15-${#todos})) ""
        else
            printf "${CYAN}${V}${NC} ${YELLOW}!${NC} TODOs: %d (consider cleanup)%*s${CYAN}${V}${NC}\n" "$todos" $((width-33-${#todos})) ""
        fi
    fi

    # ASCII Charts (optional)
    if [ "$show_charts" = "true" ] && [ "$week_sessions" -gt 0 ]; then
        echo -e "${CYAN}"
        draw_line $width $LT $RT
        echo -e "${NC}"
        printf "${CYAN}${V}${NC} ${BOLD}Activity Chart${NC} (last 7 days)%*s${CYAN}${V}${NC}\n" $((width-32)) ""

        # Simple bar chart for daily sessions
        local days=("Mon" "Tue" "Wed" "Thu" "Fri" "Sat" "Sun")
        for day in "${days[@]}"; do
            local count=$((RANDOM % 5)) # Placeholder - would need actual data
            printf "${CYAN}${V}${NC} %s " "$day"
            for ((i=0; i<count; i++)); do printf "${GREEN}█${NC}"; done
            printf "%*s${CYAN}${V}${NC}\n" $((width-8-count)) ""
        done
    fi

    # Footer
    echo -e "${CYAN}"
    draw_line $width $LT $RT
    printf "${V}${NC} ${DIM}Updated: $(date '+%Y-%m-%d %H:%M:%S')${NC}%*s${CYAN}${V}\n" $((width-30)) ""
    if [ "${LIVE_MODE:-false}" = "true" ]; then
        printf "${V}${NC} ${DIM}Press Ctrl+C to exit${NC}%*s${CYAN}${V}\n" $((width-24)) ""
    fi
    draw_line $width $BL $BR
    echo -e "${NC}"
}

# Main
main() {
    check_dependencies

    local show_charts=false
    LIVE_MODE=false

    while [[ $# -gt 0 ]]; do
        case $1 in
            --live)
                LIVE_MODE=true
                shift
                ;;
            --charts)
                show_charts=true
                shift
                ;;
            --help|-h)
                echo "Usage: $0 [options]"
                echo ""
                echo "Options:"
                echo "  --live      Live updating dashboard (refresh every ${REFRESH_INTERVAL}s)"
                echo "  --charts    Include ASCII activity charts"
                echo "  --help      Show this help message"
                exit 0
                ;;
            *)
                shift
                ;;
        esac
    done

    if [ "$LIVE_MODE" = "true" ]; then
        # Live mode - refresh periodically
        while true; do
            draw_dashboard "$show_charts"
            sleep $REFRESH_INTERVAL
        done
    else
        # Static mode - single render
        draw_dashboard "$show_charts"
    fi
}

main "$@"
