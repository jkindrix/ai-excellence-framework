#!/usr/bin/env node
/**
 * AI Excellence Framework - Friction Metrics Collection
 *
 * Collects opt-in metrics about AI development friction reduction.
 * All data is stored locally and never transmitted without explicit consent.
 *
 * Usage:
 *   node friction-metrics.js record --event=session_start
 *   node friction-metrics.js report [--days=30]
 *   node friction-metrics.js export [--format=json|csv]
 *   node friction-metrics.js clear
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync, appendFileSync } from 'fs';
import { join, dirname } from 'path';
import { homedir } from 'os';

// Configuration
const METRICS_DIR = process.env.AIX_METRICS_DIR || join(homedir(), '.ai-excellence', 'metrics');
const METRICS_FILE = join(METRICS_DIR, 'friction-metrics.jsonl');
const CONFIG_FILE = join(METRICS_DIR, 'metrics-config.json');

// Event types
const EVENT_TYPES = {
  SESSION_START: 'session_start',
  SESSION_END: 'session_end',
  COMMAND_USED: 'command_used',
  VERIFICATION_RUN: 'verification_run',
  VERIFICATION_FAILED: 'verification_failed',
  CONTEXT_RESTORED: 'context_restored',
  CONTEXT_LOST: 'context_lost',
  SECURITY_ISSUE_FOUND: 'security_issue_found',
  SECURITY_ISSUE_FIXED: 'security_issue_fixed',
  HALLUCINATION_DETECTED: 'hallucination_detected',
  DECISION_RECORDED: 'decision_recorded',
  HANDOFF_GENERATED: 'handoff_generated',
  PLAN_CREATED: 'plan_created',
  TASK_COMPLETED: 'task_completed'
};

// Ensure metrics directory exists
function ensureMetricsDir() {
  if (!existsSync(METRICS_DIR)) {
    mkdirSync(METRICS_DIR, { recursive: true });
  }
}

// Load or create configuration
function loadConfig() {
  ensureMetricsDir();

  if (existsSync(CONFIG_FILE)) {
    return JSON.parse(readFileSync(CONFIG_FILE, 'utf-8'));
  }

  const defaultConfig = {
    enabled: false,
    anonymousId: generateAnonymousId(),
    createdAt: new Date().toISOString(),
    version: '1.0.0'
  };

  writeFileSync(CONFIG_FILE, JSON.stringify(defaultConfig, null, 2));
  return defaultConfig;
}

// Generate anonymous ID (no PII)
function generateAnonymousId() {
  return 'aix_' + Math.random().toString(36).substring(2, 15);
}

// Record an event
function recordEvent(eventType, metadata = {}) {
  const config = loadConfig();

  if (!config.enabled) {
    console.log('Metrics collection is disabled. Enable with: node friction-metrics.js enable');
    return false;
  }

  if (!Object.values(EVENT_TYPES).includes(eventType)) {
    console.error(`Unknown event type: ${eventType}`);
    console.error(`Valid types: ${Object.values(EVENT_TYPES).join(', ')}`);
    return false;
  }

  const event = {
    timestamp: new Date().toISOString(),
    type: eventType,
    anonymousId: config.anonymousId,
    metadata: sanitizeMetadata(metadata),
    version: config.version
  };

  ensureMetricsDir();
  appendFileSync(METRICS_FILE, JSON.stringify(event) + '\n');

  console.log(`Recorded: ${eventType}`);
  return true;
}

// Sanitize metadata to remove any potential PII
function sanitizeMetadata(metadata) {
  const sanitized = {};

  for (const [key, value] of Object.entries(metadata)) {
    // Skip anything that looks like PII
    const lowerKey = key.toLowerCase();
    if (
      lowerKey.includes('path') ||
      lowerKey.includes('user') ||
      lowerKey.includes('email') ||
      lowerKey.includes('name') ||
      lowerKey.includes('token') ||
      lowerKey.includes('key') ||
      lowerKey.includes('secret')
    ) {
      continue;
    }

    // Only include primitive values
    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

// Generate report
function generateReport(days = 30) {
  if (!existsSync(METRICS_FILE)) {
    console.log('No metrics data found.');
    return null;
  }

  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);

  const events = readFileSync(METRICS_FILE, 'utf-8')
    .split('\n')
    .filter(line => line.trim())
    .map(line => JSON.parse(line))
    .filter(event => new Date(event.timestamp) >= cutoffDate);

  if (events.length === 0) {
    console.log(`No events in the last ${days} days.`);
    return null;
  }

  // Calculate metrics
  const report = {
    period: {
      start: cutoffDate.toISOString(),
      end: new Date().toISOString(),
      days
    },
    summary: {
      totalEvents: events.length,
      sessionsStarted: events.filter(e => e.type === EVENT_TYPES.SESSION_START).length,
      sessionsEnded: events.filter(e => e.type === EVENT_TYPES.SESSION_END).length,
      commandsUsed: events.filter(e => e.type === EVENT_TYPES.COMMAND_USED).length,
      verificationsRun: events.filter(e => e.type === EVENT_TYPES.VERIFICATION_RUN).length,
      verificationsFailed: events.filter(e => e.type === EVENT_TYPES.VERIFICATION_FAILED).length,
      contextRestored: events.filter(e => e.type === EVENT_TYPES.CONTEXT_RESTORED).length,
      contextLost: events.filter(e => e.type === EVENT_TYPES.CONTEXT_LOST).length,
      securityIssuesFound: events.filter(e => e.type === EVENT_TYPES.SECURITY_ISSUE_FOUND).length,
      securityIssuesFixed: events.filter(e => e.type === EVENT_TYPES.SECURITY_ISSUE_FIXED).length,
      hallucinationsDetected: events.filter(e => e.type === EVENT_TYPES.HALLUCINATION_DETECTED)
        .length,
      decisionsRecorded: events.filter(e => e.type === EVENT_TYPES.DECISION_RECORDED).length,
      handoffsGenerated: events.filter(e => e.type === EVENT_TYPES.HANDOFF_GENERATED).length,
      plansCreated: events.filter(e => e.type === EVENT_TYPES.PLAN_CREATED).length,
      tasksCompleted: events.filter(e => e.type === EVENT_TYPES.TASK_COMPLETED).length
    },
    calculated: {}
  };

  // Calculate derived metrics
  const { summary } = report;

  if (summary.verificationsRun > 0) {
    report.calculated.verificationSuccessRate =
      (
        ((summary.verificationsRun - summary.verificationsFailed) / summary.verificationsRun) *
        100
      ).toFixed(1) + '%';
  }

  if (summary.contextRestored + summary.contextLost > 0) {
    report.calculated.contextPreservationRate =
      ((summary.contextRestored / (summary.contextRestored + summary.contextLost)) * 100).toFixed(
        1
      ) + '%';
  }

  if (summary.securityIssuesFound > 0) {
    report.calculated.securityFixRate =
      ((summary.securityIssuesFixed / summary.securityIssuesFound) * 100).toFixed(1) + '%';
  }

  if (summary.sessionsStarted > 0) {
    report.calculated.avgCommandsPerSession = (
      summary.commandsUsed / summary.sessionsStarted
    ).toFixed(1);
    report.calculated.avgTasksPerSession = (
      summary.tasksCompleted / summary.sessionsStarted
    ).toFixed(1);
  }

  return report;
}

// Print report
function printReport(report) {
  if (!report) return;

  console.log('\n📊 AI Excellence Framework - Friction Metrics Report');
  console.log('='.repeat(55));
  console.log(
    `Period: ${report.period.start.split('T')[0]} to ${report.period.end.split('T')[0]} (${report.period.days} days)`
  );
  console.log('');

  console.log('📈 Activity Summary:');
  console.log(`  Sessions started:      ${report.summary.sessionsStarted}`);
  console.log(`  Commands used:         ${report.summary.commandsUsed}`);
  console.log(`  Tasks completed:       ${report.summary.tasksCompleted}`);
  console.log(`  Plans created:         ${report.summary.plansCreated}`);
  console.log(`  Handoffs generated:    ${report.summary.handoffsGenerated}`);
  console.log('');

  console.log('✅ Quality Metrics:');
  console.log(`  Verifications run:     ${report.summary.verificationsRun}`);
  console.log(`  Verification failures: ${report.summary.verificationsFailed}`);
  if (report.calculated.verificationSuccessRate) {
    console.log(`  Success rate:          ${report.calculated.verificationSuccessRate}`);
  }
  console.log('');

  console.log('🔒 Security Metrics:');
  console.log(`  Issues found:          ${report.summary.securityIssuesFound}`);
  console.log(`  Issues fixed:          ${report.summary.securityIssuesFixed}`);
  if (report.calculated.securityFixRate) {
    console.log(`  Fix rate:              ${report.calculated.securityFixRate}`);
  }
  console.log('');

  console.log('🧠 Context Preservation:');
  console.log(`  Context restored:      ${report.summary.contextRestored}`);
  console.log(`  Context lost:          ${report.summary.contextLost}`);
  if (report.calculated.contextPreservationRate) {
    console.log(`  Preservation rate:     ${report.calculated.contextPreservationRate}`);
  }
  console.log('');

  console.log('⚠️  AI Quality:');
  console.log(`  Hallucinations caught: ${report.summary.hallucinationsDetected}`);
  console.log(`  Decisions recorded:    ${report.summary.decisionsRecorded}`);
  console.log('');

  if (report.calculated.avgCommandsPerSession) {
    console.log('📊 Per-Session Averages:');
    console.log(`  Commands per session:  ${report.calculated.avgCommandsPerSession}`);
    console.log(`  Tasks per session:     ${report.calculated.avgTasksPerSession}`);
    console.log('');
  }
}

// Export data
function exportData(format = 'json') {
  if (!existsSync(METRICS_FILE)) {
    console.log('No metrics data found.');
    return;
  }

  const events = readFileSync(METRICS_FILE, 'utf-8')
    .split('\n')
    .filter(line => line.trim())
    .map(line => JSON.parse(line));

  const timestamp = new Date().toISOString().split('T')[0];

  if (format === 'json') {
    const outputFile = `friction-metrics-export-${timestamp}.json`;
    writeFileSync(outputFile, JSON.stringify(events, null, 2));
    console.log(`Exported ${events.length} events to ${outputFile}`);
  } else if (format === 'csv') {
    const outputFile = `friction-metrics-export-${timestamp}.csv`;
    const headers = ['timestamp', 'type', 'anonymousId', 'version'];
    const rows = events.map(e => [e.timestamp, e.type, e.anonymousId, e.version].join(','));
    writeFileSync(outputFile, [headers.join(','), ...rows].join('\n'));
    console.log(`Exported ${events.length} events to ${outputFile}`);
  } else {
    console.error(`Unknown format: ${format}. Use 'json' or 'csv'.`);
  }
}

// Clear all data
function clearData() {
  if (existsSync(METRICS_FILE)) {
    writeFileSync(METRICS_FILE, '');
    console.log('Metrics data cleared.');
  } else {
    console.log('No metrics data to clear.');
  }
}

// Enable/disable metrics
function setEnabled(enabled) {
  const config = loadConfig();
  config.enabled = enabled;
  writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
  console.log(`Metrics collection ${enabled ? 'enabled' : 'disabled'}.`);

  if (enabled) {
    console.log('');
    console.log('Privacy notice:');
    console.log('- All data is stored locally in ~/.ai-excellence/metrics/');
    console.log('- No data is transmitted without explicit export');
    console.log('- No personally identifiable information is collected');
    console.log('- You can clear all data at any time with: node friction-metrics.js clear');
  }
}

// Main CLI handler
function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  switch (command) {
    case 'record': {
      const eventArg = args.find(a => a.startsWith('--event='));
      if (!eventArg) {
        console.error('Usage: node friction-metrics.js record --event=<event_type>');
        process.exit(1);
      }
      const eventType = eventArg.split('=')[1];
      recordEvent(eventType);
      break;
    }

    case 'report': {
      const daysArg = args.find(a => a.startsWith('--days='));
      const days = daysArg ? parseInt(daysArg.split('=')[1], 10) : 30;
      const report = generateReport(days);
      printReport(report);
      break;
    }

    case 'export': {
      const formatArg = args.find(a => a.startsWith('--format='));
      const format = formatArg ? formatArg.split('=')[1] : 'json';
      exportData(format);
      break;
    }

    case 'clear':
      clearData();
      break;

    case 'enable':
      setEnabled(true);
      break;

    case 'disable':
      setEnabled(false);
      break;

    case 'status': {
      const config = loadConfig();
      console.log(`Metrics collection: ${config.enabled ? 'enabled' : 'disabled'}`);
      console.log(`Anonymous ID: ${config.anonymousId}`);
      console.log(`Config version: ${config.version}`);
      break;
    }

    default:
      console.log('AI Excellence Framework - Friction Metrics');
      console.log('');
      console.log('Usage:');
      console.log('  node friction-metrics.js enable              Enable metrics collection');
      console.log('  node friction-metrics.js disable             Disable metrics collection');
      console.log('  node friction-metrics.js status              Show current status');
      console.log('  node friction-metrics.js record --event=X    Record an event');
      console.log('  node friction-metrics.js report [--days=30]  Generate report');
      console.log('  node friction-metrics.js export [--format=X] Export data (json/csv)');
      console.log('  node friction-metrics.js clear               Clear all data');
      console.log('');
      console.log('Event types:');
      Object.entries(EVENT_TYPES).forEach(([key, value]) => {
        console.log(`  ${value.padEnd(25)} (${key})`);
      });
      break;
  }
}

main();
