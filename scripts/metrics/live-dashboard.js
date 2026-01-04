#!/usr/bin/env node
/**
 * AI Excellence Framework - Real-Time Metrics Dashboard
 *
 * A lightweight HTTP server that provides a live-updating web dashboard
 * for visualizing session metrics in real-time.
 *
 * Usage:
 *   node live-dashboard.js              # Start on default port 3456
 *   node live-dashboard.js --port 8080  # Custom port
 *   node live-dashboard.js --open       # Open browser automatically
 *
 * Features:
 *   - Real-time updates via Server-Sent Events (SSE)
 *   - Auto-refresh every 30 seconds
 *   - JSON API endpoint for programmatic access
 *   - Dark mode support
 *   - Mobile responsive
 */

import { createServer } from 'node:http';
import { readdir, readFile, stat } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { exec } from 'node:child_process';
import { fileURLToPath } from 'node:url';

// Configuration
const DEFAULT_PORT = 3456;
const METRICS_DIR = process.env.METRICS_DIR || '.tmp/metrics';
const REFRESH_INTERVAL = 30000; // 30 seconds

// Parse command line arguments
const args = process.argv.slice(2);
let port = DEFAULT_PORT;
let openBrowser = false;

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--port' && args[i + 1]) {
    port = parseInt(args[i + 1], 10);
    i++;
  } else if (args[i] === '--open') {
    openBrowser = true;
  } else if (args[i] === '--help' || args[i] === '-h') {
    console.log(`
AI Excellence Framework - Live Metrics Dashboard

Usage:
  node live-dashboard.js [options]

Options:
  --port PORT    Server port (default: ${DEFAULT_PORT})
  --open         Open browser automatically
  --help, -h     Show this help message

Environment:
  METRICS_DIR    Metrics directory (default: .tmp/metrics)
`);
    process.exit(0);
  }
}

/**
 * Collect metrics from session files
 */
async function collectMetrics() {
  const metrics = {
    timestamp: new Date().toISOString(),
    sessions: {
      total: 0,
      thisWeek: 0,
      today: 0
    },
    time: {
      totalMinutes: 0,
      weekMinutes: 0,
      todayMinutes: 0
    },
    tasks: {
      attempted: 0,
      completed: 0,
      completionRate: 0
    },
    health: {
      claudeMdFresh: false,
      handoffsActive: false,
      outstandingTodos: 0
    },
    workflow: {
      planUsage: 0,
      verifyUsage: 0,
      handoffUsage: 0
    },
    recentSessions: [],
    dailyData: []
  };

  try {
    const metricsPath = resolve(process.cwd(), METRICS_DIR);
    const dirStat = await stat(metricsPath).catch(() => null);

    if (!dirStat?.isDirectory()) {
      return metrics;
    }

    const files = await readdir(metricsPath);
    const now = Date.now();
    const weekAgo = now - 7 * 24 * 60 * 60 * 1000;
    const todayStart = new Date().setHours(0, 0, 0, 0);

    // Daily aggregation map
    const dailyMap = new Map();

    for (const file of files) {
      if (!file.endsWith('.json')) continue;

      const filePath = join(metricsPath, file);
      const content = await readFile(filePath, 'utf-8').catch(() => null);
      if (!content) continue;

      try {
        const data = JSON.parse(content);

        // Parse date from filename
        const dateMatch = file.match(/^(\d{4}-\d{2}-\d{2})/);
        const fileDate = dateMatch ? new Date(dateMatch[1]).getTime() : 0;

        if (file.includes('-session-')) {
          metrics.sessions.total++;

          const duration = data.metrics?.session_duration_minutes || 0;
          const attempted = data.metrics?.tasks_attempted || 0;
          const completed = data.metrics?.tasks_completed || 0;

          metrics.time.totalMinutes += duration;
          metrics.tasks.attempted += attempted;
          metrics.tasks.completed += completed;

          if (data.workflow?.used_plan) metrics.workflow.planUsage++;
          if (data.workflow?.used_verify) metrics.workflow.verifyUsage++;
          if (data.workflow?.used_handoff) metrics.workflow.handoffUsage++;

          if (fileDate >= weekAgo) {
            metrics.sessions.thisWeek++;
            metrics.time.weekMinutes += duration;
          }

          if (fileDate >= todayStart) {
            metrics.sessions.today++;
            metrics.time.todayMinutes += duration;
          }

          // Daily aggregation
          if (dateMatch) {
            const dateKey = dateMatch[1];
            const existing = dailyMap.get(dateKey) || { completed: 0, duration: 0 };
            dailyMap.set(dateKey, {
              completed: existing.completed + completed,
              duration: existing.duration + duration
            });
          }

          // Recent sessions (last 5)
          if (metrics.recentSessions.length < 5) {
            metrics.recentSessions.push({
              date: dateMatch?.[1] || 'unknown',
              duration,
              tasksCompleted: completed,
              tasksAttempted: attempted
            });
          }
        } else if (file.includes('-auto.json')) {
          // Latest auto metrics for health indicators
          metrics.health.claudeMdFresh = data.health_indicators?.claude_md_fresh || false;
          metrics.health.handoffsActive = data.health_indicators?.handoffs_active || false;
          metrics.health.outstandingTodos = data.metrics?.outstanding_todos || 0;
        }
      } catch (parseError) {
        // Skip malformed files
      }
    }

    // Calculate rates
    if (metrics.tasks.attempted > 0) {
      metrics.tasks.completionRate = Math.round(
        (metrics.tasks.completed / metrics.tasks.attempted) * 100
      );
    }

    if (metrics.sessions.total > 0) {
      metrics.workflow.planUsage = Math.round(
        (metrics.workflow.planUsage / metrics.sessions.total) * 100
      );
      metrics.workflow.verifyUsage = Math.round(
        (metrics.workflow.verifyUsage / metrics.sessions.total) * 100
      );
      metrics.workflow.handoffUsage = Math.round(
        (metrics.workflow.handoffUsage / metrics.sessions.total) * 100
      );
    }

    // Sort and format daily data (last 7 days)
    metrics.dailyData = Array.from(dailyMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-7)
      .map(([date, data]) => ({
        date,
        completed: data.completed,
        duration: data.duration
      }));
  } catch (error) {
    console.error('Error collecting metrics:', error.message);
  }

  return metrics;
}

/**
 * Generate the HTML dashboard page
 */
function generateDashboard() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AI Excellence - Live Dashboard</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <style>
        :root {
            --primary: #3b82f6;
            --primary-dark: #2563eb;
            --success: #10b981;
            --warning: #f59e0b;
            --danger: #ef4444;
            --bg: #f8fafc;
            --bg-card: #ffffff;
            --text: #1e293b;
            --text-muted: #64748b;
            --border: #e2e8f0;
        }

        @media (prefers-color-scheme: dark) {
            :root {
                --bg: #0f172a;
                --bg-card: #1e293b;
                --text: #f1f5f9;
                --text-muted: #94a3b8;
                --border: #334155;
            }
        }

        * { box-sizing: border-box; margin: 0; padding: 0; }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: var(--bg);
            color: var(--text);
            min-height: 100vh;
            padding: 20px;
        }

        .container {
            max-width: 1400px;
            margin: 0 auto;
        }

        header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 30px;
            flex-wrap: wrap;
            gap: 15px;
        }

        .logo {
            display: flex;
            align-items: center;
            gap: 12px;
        }

        .logo-icon {
            width: 40px;
            height: 40px;
            background: linear-gradient(135deg, var(--primary), var(--primary-dark));
            border-radius: 10px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: bold;
            font-size: 18px;
        }

        h1 {
            font-size: 1.5em;
            font-weight: 600;
        }

        .status {
            display: flex;
            align-items: center;
            gap: 8px;
            color: var(--text-muted);
            font-size: 0.9em;
        }

        .status-dot {
            width: 8px;
            height: 8px;
            background: var(--success);
            border-radius: 50%;
            animation: pulse 2s infinite;
        }

        @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
        }

        .grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }

        .card {
            background: var(--bg-card);
            border-radius: 16px;
            padding: 24px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
            border: 1px solid var(--border);
        }

        .card-title {
            font-size: 0.85em;
            color: var(--text-muted);
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 8px;
        }

        .metric {
            font-size: 2.5em;
            font-weight: 700;
            background: linear-gradient(135deg, var(--primary), var(--primary-dark));
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }

        .metric-sub {
            font-size: 0.85em;
            color: var(--text-muted);
            margin-top: 4px;
        }

        .chart-container {
            position: relative;
            height: 200px;
            margin-top: 15px;
        }

        .health-list {
            list-style: none;
        }

        .health-item {
            display: flex;
            align-items: center;
            gap: 10px;
            padding: 12px 0;
            border-bottom: 1px solid var(--border);
        }

        .health-item:last-child {
            border-bottom: none;
        }

        .health-icon {
            width: 24px;
            height: 24px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 12px;
        }

        .health-icon.ok {
            background: rgba(16, 185, 129, 0.1);
            color: var(--success);
        }

        .health-icon.warn {
            background: rgba(245, 158, 11, 0.1);
            color: var(--warning);
        }

        .progress-bar {
            height: 8px;
            background: var(--border);
            border-radius: 4px;
            overflow: hidden;
            margin-top: 10px;
        }

        .progress-fill {
            height: 100%;
            background: linear-gradient(90deg, var(--primary), var(--success));
            border-radius: 4px;
            transition: width 0.5s ease;
        }

        .workflow-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 15px;
            text-align: center;
        }

        .workflow-stat {
            padding: 15px;
            background: var(--bg);
            border-radius: 10px;
        }

        .workflow-value {
            font-size: 1.5em;
            font-weight: 600;
            color: var(--primary);
        }

        .workflow-label {
            font-size: 0.8em;
            color: var(--text-muted);
            margin-top: 4px;
        }

        .full-width {
            grid-column: 1 / -1;
        }

        .chart-card {
            grid-column: span 2;
        }

        @media (max-width: 768px) {
            .chart-card {
                grid-column: span 1;
            }
        }

        footer {
            text-align: center;
            color: var(--text-muted);
            font-size: 0.85em;
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid var(--border);
        }

        footer a {
            color: var(--primary);
            text-decoration: none;
        }

        footer a:hover {
            text-decoration: underline;
        }

        #last-update {
            font-size: 0.9em;
        }
    </style>
</head>
<body>
    <div class="container">
        <header>
            <div class="logo">
                <div class="logo-icon">AI</div>
                <div>
                    <h1>AI Excellence Dashboard</h1>
                    <span class="status">
                        <span class="status-dot"></span>
                        <span id="last-update">Connecting...</span>
                    </span>
                </div>
            </div>
        </header>

        <div class="grid">
            <div class="card">
                <div class="card-title">Total Sessions</div>
                <div class="metric" id="total-sessions">--</div>
                <div class="metric-sub"><span id="week-sessions">--</span> this week</div>
            </div>

            <div class="card">
                <div class="card-title">Development Time</div>
                <div class="metric" id="total-time">--</div>
                <div class="metric-sub"><span id="week-time">--</span> this week</div>
            </div>

            <div class="card">
                <div class="card-title">Task Completion</div>
                <div class="metric" id="completion-rate">--%</div>
                <div class="progress-bar">
                    <div class="progress-fill" id="completion-bar" style="width: 0%"></div>
                </div>
                <div class="metric-sub"><span id="tasks-completed">--</span> / <span id="tasks-attempted">--</span> tasks</div>
            </div>

            <div class="card">
                <div class="card-title">Health Indicators</div>
                <ul class="health-list">
                    <li class="health-item">
                        <span class="health-icon" id="claude-health">●</span>
                        <span>CLAUDE.md Status</span>
                    </li>
                    <li class="health-item">
                        <span class="health-icon" id="handoff-health">●</span>
                        <span>Session Handoffs</span>
                    </li>
                    <li class="health-item">
                        <span class="health-icon" id="todo-health">●</span>
                        <span>Outstanding TODOs: <span id="todo-count">--</span></span>
                    </li>
                </ul>
            </div>

            <div class="card chart-card">
                <div class="card-title">Tasks Completed (Last 7 Days)</div>
                <div class="chart-container">
                    <canvas id="tasksChart"></canvas>
                </div>
            </div>

            <div class="card">
                <div class="card-title">Workflow Adoption</div>
                <div class="workflow-grid">
                    <div class="workflow-stat">
                        <div class="workflow-value" id="plan-usage">--%</div>
                        <div class="workflow-label">/plan</div>
                    </div>
                    <div class="workflow-stat">
                        <div class="workflow-value" id="verify-usage">--%</div>
                        <div class="workflow-label">/verify</div>
                    </div>
                    <div class="workflow-stat">
                        <div class="workflow-value" id="handoff-usage">--%</div>
                        <div class="workflow-label">/handoff</div>
                    </div>
                </div>
            </div>
        </div>

        <footer>
            <p>AI Excellence Framework - Real-Time Dashboard</p>
            <p>Auto-refreshing every 30 seconds. <a href="/api/metrics">View JSON API</a></p>
        </footer>
    </div>

    <script>
        let tasksChart = null;

        function formatDuration(minutes) {
            const hours = Math.floor(minutes / 60);
            const mins = minutes % 60;
            if (hours > 0) {
                return hours + 'h ' + mins + 'm';
            }
            return mins + 'm';
        }

        function formatTime(isoString) {
            const date = new Date(isoString);
            return date.toLocaleTimeString();
        }

        function updateDashboard(data) {
            // Sessions
            document.getElementById('total-sessions').textContent = data.sessions.total;
            document.getElementById('week-sessions').textContent = data.sessions.thisWeek;

            // Time
            document.getElementById('total-time').textContent = formatDuration(data.time.totalMinutes);
            document.getElementById('week-time').textContent = formatDuration(data.time.weekMinutes);

            // Tasks
            document.getElementById('completion-rate').textContent = data.tasks.completionRate + '%';
            document.getElementById('completion-bar').style.width = data.tasks.completionRate + '%';
            document.getElementById('tasks-completed').textContent = data.tasks.completed;
            document.getElementById('tasks-attempted').textContent = data.tasks.attempted;

            // Health
            const claudeHealth = document.getElementById('claude-health');
            claudeHealth.className = 'health-icon ' + (data.health.claudeMdFresh ? 'ok' : 'warn');
            claudeHealth.textContent = data.health.claudeMdFresh ? '✓' : '!';

            const handoffHealth = document.getElementById('handoff-health');
            handoffHealth.className = 'health-icon ' + (data.health.handoffsActive ? 'ok' : 'warn');
            handoffHealth.textContent = data.health.handoffsActive ? '✓' : '!';

            const todoHealth = document.getElementById('todo-health');
            const todoCount = data.health.outstandingTodos;
            todoHealth.className = 'health-icon ' + (todoCount < 20 ? 'ok' : 'warn');
            todoHealth.textContent = todoCount < 20 ? '✓' : '!';
            document.getElementById('todo-count').textContent = todoCount;

            // Workflow
            document.getElementById('plan-usage').textContent = data.workflow.planUsage + '%';
            document.getElementById('verify-usage').textContent = data.workflow.verifyUsage + '%';
            document.getElementById('handoff-usage').textContent = data.workflow.handoffUsage + '%';

            // Chart
            updateChart(data.dailyData);

            // Update timestamp
            document.getElementById('last-update').textContent = 'Updated ' + formatTime(data.timestamp);
        }

        function updateChart(dailyData) {
            const ctx = document.getElementById('tasksChart');

            const labels = dailyData.map(d => {
                const date = new Date(d.date);
                return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
            });
            const values = dailyData.map(d => d.completed);

            if (tasksChart) {
                tasksChart.data.labels = labels;
                tasksChart.data.datasets[0].data = values;
                tasksChart.update('none');
            } else {
                tasksChart = new Chart(ctx, {
                    type: 'bar',
                    data: {
                        labels: labels,
                        datasets: [{
                            label: 'Tasks Completed',
                            data: values,
                            backgroundColor: 'rgba(59, 130, 246, 0.8)',
                            borderColor: 'rgba(59, 130, 246, 1)',
                            borderWidth: 1,
                            borderRadius: 6,
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: { display: false }
                        },
                        scales: {
                            y: {
                                beginAtZero: true,
                                ticks: { stepSize: 1 }
                            }
                        }
                    }
                });
            }
        }

        // Server-Sent Events for real-time updates
        const evtSource = new EventSource('/api/stream');

        evtSource.onmessage = function(event) {
            const data = JSON.parse(event.data);
            updateDashboard(data);
        };

        evtSource.onerror = function() {
            document.getElementById('last-update').textContent = 'Connection lost. Reconnecting...';
        };

        // Initial fetch
        fetch('/api/metrics')
            .then(res => res.json())
            .then(updateDashboard)
            .catch(err => console.error('Initial fetch failed:', err));
    </script>
</body>
</html>`;
}

// Keep track of SSE clients
const clients = new Set();

/**
 * Broadcast metrics to all connected SSE clients
 */
async function broadcastMetrics() {
  const metrics = await collectMetrics();
  const data = `data: ${JSON.stringify(metrics)}\n\n`;

  for (const client of clients) {
    try {
      client.write(data);
    } catch (err) {
      clients.delete(client);
    }
  }
}

// Start periodic broadcasts
setInterval(broadcastMetrics, REFRESH_INTERVAL);

/**
 * Create and start the HTTP server
 */
const server = createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${port}`);

  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');

  if (url.pathname === '/' || url.pathname === '/dashboard') {
    // Serve the dashboard HTML
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(generateDashboard());
  } else if (url.pathname === '/api/metrics') {
    // JSON API endpoint
    const metrics = await collectMetrics();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(metrics, null, 2));
  } else if (url.pathname === '/api/stream') {
    // Server-Sent Events endpoint
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive'
    });

    // Send initial data
    const metrics = await collectMetrics();
    res.write(`data: ${JSON.stringify(metrics)}\n\n`);

    // Add to clients set
    clients.add(res);

    // Remove on close
    req.on('close', () => {
      clients.delete(res);
    });
  } else {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found');
  }
});

// Start server
server.listen(port, () => {
  const url = `http://localhost:${port}`;
  console.log(`
╔════════════════════════════════════════════════════════╗
║  AI Excellence Framework - Live Metrics Dashboard      ║
╠════════════════════════════════════════════════════════╣
║                                                        ║
║  Dashboard: ${url.padEnd(41)}║
║  API:       ${(url + '/api/metrics').padEnd(41)}║
║  Stream:    ${(url + '/api/stream').padEnd(41)}║
║                                                        ║
║  Press Ctrl+C to stop                                  ║
╚════════════════════════════════════════════════════════╝
`);

  // Open browser if requested
  if (openBrowser) {
    const cmd =
      process.platform === 'darwin' ? 'open' : process.platform === 'win32' ? 'start' : 'xdg-open';
    exec(`${cmd} ${url}`);
  }
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\nShutting down...');
  server.close();
  process.exit(0);
});
