# Metrics Collection & Dashboard

Tools for collecting, visualizing, and analyzing AI development session metrics.

---

## Quick Start

```bash
# Collect session metrics
./scripts/metrics/collect-session-metrics.sh

# View terminal dashboard
npm run dashboard:terminal

# Launch live web dashboard
npm run dashboard

# Generate HTML report
./scripts/metrics/generate-report.sh > report.html
```

---

## Available Tools

### Session Metrics Collection

**collect-session-metrics.sh**

Collects metrics at the end of each development session:

```bash
# Manual collection
./scripts/metrics/collect-session-metrics.sh

# Automatic collection (minimal prompts)
./scripts/metrics/collect-session-metrics.sh --auto
```

**Captured metrics:**

- Session duration
- Tasks attempted/completed
- Issues caught by verification
- AI errors observed
- Workflow tools used (/plan, /verify, /handoff)

### Team Metrics

**collect-team-metrics.sh**

Aggregate metrics across team members:

```bash
./scripts/metrics/collect-team-metrics.sh
```

### Friction Metrics

**friction-metrics.js**

Analyze friction patterns from session data:

```bash
node scripts/metrics/friction-metrics.js
```

---

## Dashboards

### Terminal Dashboard

ASCII-based dashboard for terminal environments:

```bash
# Static view
npm run dashboard:terminal

# Live updating (refreshes every 30 seconds)
./scripts/metrics/dashboard.sh --live

# Include activity charts
./scripts/metrics/dashboard.sh --charts
```

### Web Dashboard (Real-Time)

Modern web dashboard with live updates via Server-Sent Events:

```bash
# Start dashboard server (port 3456)
npm run dashboard

# Start and open browser automatically
npm run dashboard:open

# Custom port
node scripts/metrics/live-dashboard.js --port 8080
```

**Features:**

- Real-time updates (auto-refresh every 30 seconds)
- Interactive charts (Chart.js)
- Dark mode support
- Mobile responsive
- JSON API endpoint

**Endpoints:**

- `/` - Web dashboard
- `/api/metrics` - JSON API
- `/api/stream` - Server-Sent Events stream

---

## Reports

### HTML Reports

Generate static HTML reports with charts:

```bash
# Last 30 days (default)
./scripts/metrics/generate-report.sh > report.html

# Custom date range
./scripts/metrics/generate-report.sh --from 2025-01-01 --to 2025-01-31 > report.html

# JSON output instead of HTML
./scripts/metrics/generate-report.sh --format json
```

---

## Metrics Storage

Metrics are stored in `.tmp/metrics/` by default:

```
.tmp/metrics/
├── 2025-01-03-session-abc123.json    # Session metrics
├── 2025-01-03-auto.json              # Auto-collected metrics
└── ...
```

**Configure location:**

```bash
export METRICS_DIR=/path/to/metrics
```

---

## Data Schema

### Session Metrics

```json
{
  "timestamp": "2025-01-03T10:30:00Z",
  "metrics": {
    "session_duration_minutes": 120,
    "tasks_attempted": 5,
    "tasks_completed": 4,
    "issues_caught_by_verification": 2,
    "ai_errors_observed": 0
  },
  "workflow": {
    "used_plan": true,
    "used_verify": true,
    "used_handoff": false
  },
  "satisfaction": 4
}
```

### Auto Metrics

```json
{
  "timestamp": "2025-01-03T10:00:00Z",
  "health_indicators": {
    "claude_md_fresh": true,
    "handoffs_active": true
  },
  "metrics": {
    "outstanding_todos": 15
  }
}
```

---

## Integration

### CI/CD

Add metrics collection to your CI pipeline:

```yaml
# .github/workflows/metrics.yml
on:
  push:
    branches: [main]

jobs:
  collect:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: ./scripts/metrics/collect-session-metrics.sh --auto
      - uses: actions/upload-artifact@v4
        with:
          name: metrics
          path: .tmp/metrics/
```

### Git Hooks

Collect metrics on commit:

```bash
# .git/hooks/post-commit
#!/bin/bash
./scripts/metrics/collect-session-metrics.sh --auto &
```

---

## Requirements

- **jq**: Required for JSON parsing
  - Install: `apt install jq` (Debian/Ubuntu) or `brew install jq` (macOS)

- **Node.js**: Required for live dashboard and friction metrics
  - Version 18+ recommended

---

## Privacy

All metrics are stored locally and never transmitted. No telemetry is sent to external services.

---

_Part of the AI Excellence Framework_
