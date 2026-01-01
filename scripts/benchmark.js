#!/usr/bin/env node
/**
 * Performance Benchmark Script for AI Excellence Framework
 *
 * Measures performance of key operations to track regressions.
 *
 * Usage: node scripts/benchmark.js [--json] [--iterations N]
 */

import { execSync } from 'child_process';
import { mkdtempSync, rmSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { tmpdir } from 'os';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = join(__dirname, '..');

// Parse arguments
const args = process.argv.slice(2);
const jsonOutput = args.includes('--json');
const iterationsIdx = args.indexOf('--iterations');
const iterations = iterationsIdx !== -1 ? parseInt(args[iterationsIdx + 1], 10) : 3;

/**
 * Measure execution time of a function
 */
async function measure(name, fn) {
  const times = [];

  for (let i = 0; i < iterations; i++) {
    const start = performance.now();
    await fn();
    const end = performance.now();
    times.push(end - start);
  }

  const avg = times.reduce((a, b) => a + b, 0) / times.length;
  const min = Math.min(...times);
  const max = Math.max(...times);

  return {
    name,
    avg: Math.round(avg * 100) / 100,
    min: Math.round(min * 100) / 100,
    max: Math.round(max * 100) / 100,
    iterations,
    times: times.map(t => Math.round(t * 100) / 100)
  };
}

/**
 * Create a temporary test directory with CLAUDE.md
 */
function createTestDir() {
  const dir = mkdtempSync(join(tmpdir(), 'aix-benchmark-'));
  writeFileSync(
    join(dir, 'CLAUDE.md'),
    `# Benchmark Project

## Overview
Performance testing project.

## Tech Stack
- Language: JavaScript
- Runtime: Node.js

## Conventions
- Follow best practices
`
  );
  return dir;
}

/**
 * Run benchmark suite
 */
async function runBenchmarks() {
  const results = [];
  let testDir;

  if (!jsonOutput) {
    console.log('\n🏃 AI Excellence Framework Performance Benchmark\n');
    console.log(`Running ${iterations} iterations per test...\n`);
  }

  // Benchmark 1: CLI startup time
  results.push(
    await measure('CLI startup (--help)', () => {
      execSync(`node ${join(PROJECT_ROOT, 'bin', 'cli.js')} --help`, {
        encoding: 'utf-8',
        stdio: 'pipe'
      });
    })
  );

  // Benchmark 2: Validate command
  testDir = createTestDir();
  try {
    results.push(
      await measure('Validate command', () => {
        try {
          execSync(`node ${join(PROJECT_ROOT, 'bin', 'cli.js')} validate`, {
            cwd: testDir,
            encoding: 'utf-8',
            stdio: 'pipe'
          });
        } catch {
          // May exit non-zero, that's OK
        }
      })
    );
  } finally {
    rmSync(testDir, { recursive: true, force: true });
  }

  // Benchmark 3: Doctor command
  testDir = createTestDir();
  try {
    results.push(
      await measure('Doctor command', () => {
        execSync(`node ${join(PROJECT_ROOT, 'bin', 'cli.js')} doctor`, {
          cwd: testDir,
          encoding: 'utf-8',
          stdio: 'pipe'
        });
      })
    );
  } finally {
    rmSync(testDir, { recursive: true, force: true });
  }

  // Benchmark 4: Generate single tool
  testDir = createTestDir();
  try {
    results.push(
      await measure('Generate (agents only)', () => {
        execSync(`node ${join(PROJECT_ROOT, 'bin', 'cli.js')} generate --tools agents --force`, {
          cwd: testDir,
          encoding: 'utf-8',
          stdio: 'pipe'
        });
      })
    );
  } finally {
    rmSync(testDir, { recursive: true, force: true });
  }

  // Benchmark 5: Generate all tools
  testDir = createTestDir();
  try {
    results.push(
      await measure('Generate (all tools)', () => {
        execSync(`node ${join(PROJECT_ROOT, 'bin', 'cli.js')} generate --tools all --force`, {
          cwd: testDir,
          encoding: 'utf-8',
          stdio: 'pipe'
        });
      })
    );
  } finally {
    rmSync(testDir, { recursive: true, force: true });
  }

  // Benchmark 6: Init command (dry-run)
  testDir = createTestDir();
  try {
    results.push(
      await measure('Init (dry-run)', () => {
        execSync(
          `node ${join(PROJECT_ROOT, 'bin', 'cli.js')} init --preset minimal --dry-run --yes`,
          {
            cwd: testDir,
            encoding: 'utf-8',
            stdio: 'pipe'
          }
        );
      })
    );
  } finally {
    rmSync(testDir, { recursive: true, force: true });
  }

  // Benchmark 7: Lint command
  testDir = createTestDir();
  try {
    results.push(
      await measure('Lint command', () => {
        try {
          execSync(`node ${join(PROJECT_ROOT, 'bin', 'cli.js')} lint`, {
            cwd: testDir,
            encoding: 'utf-8',
            stdio: 'pipe'
          });
        } catch {
          // May exit non-zero
        }
      })
    );
  } finally {
    rmSync(testDir, { recursive: true, force: true });
  }

  return results;
}

/**
 * Print results in human-readable format
 */
function printResults(results) {
  console.log('Results:\n');
  console.log('┌─────────────────────────────┬──────────┬──────────┬──────────┐');
  console.log('│ Test                        │ Avg (ms) │ Min (ms) │ Max (ms) │');
  console.log('├─────────────────────────────┼──────────┼──────────┼──────────┤');

  for (const r of results) {
    const name = r.name.padEnd(27);
    const avg = r.avg.toFixed(2).padStart(8);
    const min = r.min.toFixed(2).padStart(8);
    const max = r.max.toFixed(2).padStart(8);
    console.log(`│ ${name} │ ${avg} │ ${min} │ ${max} │`);
  }

  console.log('└─────────────────────────────┴──────────┴──────────┴──────────┘');

  // Performance assessment
  console.log('\nPerformance Assessment:\n');

  const generateAll = results.find(r => r.name === 'Generate (all tools)');
  if (generateAll) {
    if (generateAll.avg < 500) {
      console.log('✅ Generate (all): Excellent (<500ms)');
    } else if (generateAll.avg < 1000) {
      console.log('✅ Generate (all): Good (<1s)');
    } else if (generateAll.avg < 2000) {
      console.log('⚠️  Generate (all): Acceptable (<2s)');
    } else {
      console.log('❌ Generate (all): Slow (>2s) - investigate');
    }
  }

  const cliStartup = results.find(r => r.name === 'CLI startup (--help)');
  if (cliStartup) {
    if (cliStartup.avg < 100) {
      console.log('✅ CLI startup: Excellent (<100ms)');
    } else if (cliStartup.avg < 200) {
      console.log('✅ CLI startup: Good (<200ms)');
    } else if (cliStartup.avg < 500) {
      console.log('⚠️  CLI startup: Acceptable (<500ms)');
    } else {
      console.log('❌ CLI startup: Slow (>500ms) - investigate');
    }
  }

  console.log('');
}

// Main execution
(async () => {
  try {
    const results = await runBenchmarks();

    if (jsonOutput) {
      console.log(
        JSON.stringify(
          {
            timestamp: new Date().toISOString(),
            iterations,
            benchmarks: results
          },
          null,
          2
        )
      );
    } else {
      printResults(results);
    }
  } catch (error) {
    console.error('Benchmark failed:', error.message);
    process.exit(1);
  }
})();
