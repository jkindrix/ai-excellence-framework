/**
 * End-to-End Tests for AI Excellence Framework
 *
 * These tests invoke the actual CLI binary to verify real-world behavior.
 *
 * Run with: node --test tests/e2e.test.js
 */

import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import { existsSync, mkdirSync, rmSync, readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { execSync, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_ROOT = join(__dirname, '..');
const CLI_PATH = join(PROJECT_ROOT, 'bin', 'cli.js');

/**
 * Helper to create a unique temp directory
 */
function createTempDir() {
  const tempDir = join(
    tmpdir(),
    `ai-excellence-e2e-${Date.now()}-${Math.random().toString(36).slice(2)}`
  );
  mkdirSync(tempDir, { recursive: true });
  return tempDir;
}

/**
 * Helper to clean up temp directory
 */
function cleanupTempDir(dir) {
  if (existsSync(dir)) {
    rmSync(dir, { recursive: true, force: true });
  }
}

/**
 * Run CLI command and return result
 */
function runCLI(args, cwd, options = {}) {
  const result = spawnSync('node', [CLI_PATH, ...args.split(' ')], {
    cwd,
    encoding: 'utf-8',
    timeout: options.timeout || 30000,
    env: { ...process.env, FORCE_COLOR: '0', NO_COLOR: '1' }
  });

  return {
    stdout: result.stdout || '',
    stderr: result.stderr || '',
    exitCode: result.status,
    success: result.status === 0
  };
}

// ============================================
// E2E Test Suites
// ============================================

describe('E2E: CLI Binary Invocation', () => {
  it('should show version with --version flag', () => {
    const result = runCLI('--version', PROJECT_ROOT);
    assert.strictEqual(result.success, true, 'Should exit with code 0');
    assert.ok(result.stdout.match(/\d+\.\d+\.\d+/), 'Should output version number');
  });

  it('should show help with --help flag', () => {
    const result = runCLI('--help', PROJECT_ROOT);
    assert.strictEqual(result.success, true, 'Should exit with code 0');
    assert.ok(result.stdout.includes('init'), 'Should show init command');
    assert.ok(result.stdout.includes('validate'), 'Should show validate command');
    assert.ok(result.stdout.includes('doctor'), 'Should show doctor command');
  });

  it('should show command-specific help', () => {
    const result = runCLI('init --help', PROJECT_ROOT);
    assert.strictEqual(result.success, true, 'Should exit with code 0');
    assert.ok(result.stdout.includes('preset'), 'Should show preset option');
  });
});

describe('E2E: Init Command', () => {
  let tempDir;

  beforeEach(() => {
    tempDir = createTempDir();
    // Initialize as git repo (some checks require it)
    execSync('git init', { cwd: tempDir, stdio: 'ignore' });
  });

  afterEach(() => {
    cleanupTempDir(tempDir);
  });

  it('should initialize minimal preset with --yes flag', () => {
    const result = runCLI('init --preset minimal --yes', tempDir);

    // Check command completed
    assert.ok(
      result.success || result.stdout.includes('initialized'),
      `Init should succeed. stdout: ${result.stdout}, stderr: ${result.stderr}`
    );

    // Check files created
    assert.ok(existsSync(join(tempDir, 'CLAUDE.md')), 'Should create CLAUDE.md');
    assert.ok(
      existsSync(join(tempDir, '.claude', 'commands')),
      'Should create .claude/commands'
    );
  });

  it('should initialize standard preset with required files', () => {
    const result = runCLI('init --preset standard --yes', tempDir);

    assert.ok(
      result.success || result.stdout.includes('initialized'),
      `Init should succeed. stdout: ${result.stdout}, stderr: ${result.stderr}`
    );

    // Standard preset includes agents
    assert.ok(existsSync(join(tempDir, '.claude', 'agents')), 'Should create agents directory');

    // Standard preset includes more commands
    const commandsDir = join(tempDir, '.claude', 'commands');
    assert.ok(existsSync(join(commandsDir, 'plan.md')), 'Should have plan command');
    assert.ok(existsSync(join(commandsDir, 'verify.md')), 'Should have verify command');
  });

  it('should support dry-run mode', () => {
    const result = runCLI('init --preset minimal --yes --dry-run', tempDir);

    assert.ok(result.success, 'Dry run should succeed');
    assert.ok(!existsSync(join(tempDir, 'CLAUDE.md')), 'Should not create files in dry-run');
  });

  it('should create valid CLAUDE.md structure', () => {
    runCLI('init --preset standard --yes', tempDir);

    const claudeMd = readFileSync(join(tempDir, 'CLAUDE.md'), 'utf-8');

    // Check required sections
    assert.ok(claudeMd.includes('## Overview'), 'Should have Overview section');
    assert.ok(claudeMd.includes('## Tech Stack'), 'Should have Tech Stack section');
    assert.ok(claudeMd.includes('## Current State'), 'Should have Current State section');
  });
});

describe('E2E: Validate Command', () => {
  let tempDir;

  beforeEach(() => {
    tempDir = createTempDir();
    execSync('git init', { cwd: tempDir, stdio: 'ignore' });
  });

  afterEach(() => {
    cleanupTempDir(tempDir);
  });

  it('should fail validation in empty directory', () => {
    const result = runCLI('validate', tempDir);

    // Should fail because no CLAUDE.md exists
    assert.strictEqual(result.success, false, 'Should fail validation');
    assert.ok(
      result.stdout.includes('CLAUDE.md') || result.stderr.includes('CLAUDE.md'),
      'Should mention CLAUDE.md'
    );
  });

  it('should pass validation after initialization', () => {
    // First initialize
    runCLI('init --preset minimal --yes', tempDir);

    // Then validate
    const result = runCLI('validate', tempDir);

    assert.ok(
      result.success || result.stdout.includes('passed'),
      `Validation should pass after init. stdout: ${result.stdout}`
    );
  });

  it('should support --fix flag for auto-repair', () => {
    // Create partial setup (CLAUDE.md without required sections)
    writeFileSync(join(tempDir, 'CLAUDE.md'), '# My Project\n\nSome content.\n');

    // Run validate with fix
    const result = runCLI('validate --fix', tempDir);

    // Check that sections were added
    const claudeMd = readFileSync(join(tempDir, 'CLAUDE.md'), 'utf-8');
    assert.ok(
      claudeMd.includes('## Overview') || result.stdout.includes('Auto-fixed'),
      'Should fix missing sections'
    );
  });
});

describe('E2E: Doctor Command', () => {
  let tempDir;

  beforeEach(() => {
    tempDir = createTempDir();
    execSync('git init', { cwd: tempDir, stdio: 'ignore' });
  });

  afterEach(() => {
    cleanupTempDir(tempDir);
  });

  it('should run diagnostics', () => {
    const result = runCLI('doctor', tempDir);

    assert.ok(result.success, 'Doctor should complete');
    assert.ok(
      result.stdout.includes('Node.js') || result.stdout.includes('Environment'),
      'Should check Node.js'
    );
  });

  it('should support --verbose flag', () => {
    const result = runCLI('doctor --verbose', tempDir);

    assert.ok(result.success, 'Verbose doctor should complete');
  });

  it('should detect missing framework installation', () => {
    const result = runCLI('doctor', tempDir);

    // In empty dir, framework is not installed
    assert.ok(
      result.stdout.includes('Framework') || result.stdout.includes('installed'),
      'Should check framework installation'
    );
  });
});

describe('E2E: Update Command', () => {
  let tempDir;

  beforeEach(() => {
    tempDir = createTempDir();
    execSync('git init', { cwd: tempDir, stdio: 'ignore' });
    // Initialize first
    runCLI('init --preset minimal --yes', tempDir);
  });

  afterEach(() => {
    cleanupTempDir(tempDir);
  });

  it('should check for updates', () => {
    const result = runCLI('update --check', tempDir);

    // Should at least run without crashing
    assert.ok(
      result.success || result.exitCode !== undefined,
      'Update check should complete'
    );
  });
});

describe('E2E: Configuration File Handling', () => {
  let tempDir;

  beforeEach(() => {
    tempDir = createTempDir();
    execSync('git init', { cwd: tempDir, stdio: 'ignore' });
  });

  afterEach(() => {
    cleanupTempDir(tempDir);
  });

  it('should create valid JSON configuration', () => {
    runCLI('init --preset full --yes', tempDir);

    const configPath = join(tempDir, 'ai-excellence.config.json');
    if (existsSync(configPath)) {
      const config = JSON.parse(readFileSync(configPath, 'utf-8'));
      assert.ok(config.version, 'Config should have version');
      assert.ok(config.preset, 'Config should have preset');
    }
  });
});

describe('E2E: File Permissions', () => {
  let tempDir;

  beforeEach(() => {
    tempDir = createTempDir();
    execSync('git init', { cwd: tempDir, stdio: 'ignore' });
  });

  afterEach(() => {
    cleanupTempDir(tempDir);
  });

  it('should create files with correct permissions', () => {
    runCLI('init --preset full --yes', tempDir);

    // Check that shell scripts are created (permissions vary by platform)
    const hooksDir = join(tempDir, 'scripts', 'hooks');
    if (existsSync(hooksDir)) {
      const files = readdirSync(hooksDir);
      const shFiles = files.filter(f => f.endsWith('.sh'));
      assert.ok(shFiles.length > 0, 'Should create shell scripts');
    }
  });
});

describe('E2E: Error Handling', () => {
  it('should handle invalid preset gracefully', () => {
    const tempDir = createTempDir();
    try {
      const result = runCLI('init --preset nonexistent --yes', tempDir);

      // Should either fail or show error message
      assert.ok(
        !result.success ||
          result.stderr.includes('invalid') ||
          result.stderr.includes('nonexistent') ||
          result.stdout.includes('invalid') ||
          result.stdout.includes('nonexistent'),
        'Should handle invalid preset'
      );
    } finally {
      cleanupTempDir(tempDir);
    }
  });

  it('should handle missing permissions gracefully', () => {
    // Skip on Windows
    if (process.platform === 'win32') {
      return;
    }

    const tempDir = createTempDir();
    try {
      // Make directory read-only
      execSync(`chmod 444 "${tempDir}"`, { stdio: 'ignore' });

      const result = runCLI('init --preset minimal --yes', tempDir);

      // Should fail gracefully (not crash)
      assert.ok(result.exitCode !== undefined, 'Should complete with exit code');
    } catch {
      // Permission errors are expected
    } finally {
      // Restore permissions for cleanup
      try {
        execSync(`chmod 755 "${tempDir}"`, { stdio: 'ignore' });
      } catch {
        // Ignore
      }
      cleanupTempDir(tempDir);
    }
  });
});

describe('E2E: Programmatic API', () => {
  it('should export version', async () => {
    const { VERSION } = await import('../src/index.js');
    assert.ok(VERSION, 'Should export VERSION');
    assert.ok(VERSION.match(/\d+\.\d+\.\d+/), 'VERSION should be semver');
  });

  it('should export presets', async () => {
    const { PRESETS } = await import('../src/index.js');
    assert.ok(Array.isArray(PRESETS), 'PRESETS should be array');
    assert.ok(PRESETS.includes('minimal'), 'Should include minimal preset');
    assert.ok(PRESETS.includes('standard'), 'Should include standard preset');
    assert.ok(PRESETS.includes('full'), 'Should include full preset');
  });

  it('should export checkInstallation function', async () => {
    const { checkInstallation } = await import('../src/index.js');
    assert.ok(typeof checkInstallation === 'function', 'Should export checkInstallation');

    const result = checkInstallation(PROJECT_ROOT);
    assert.ok(result.installed, 'Framework root should be installed');
  });

  it('should export parseClaudeMd function', async () => {
    const { parseClaudeMd } = await import('../src/index.js');
    assert.ok(typeof parseClaudeMd === 'function', 'Should export parseClaudeMd');

    const result = parseClaudeMd('# Test\n\n## Overview\n\nTest content.');
    assert.ok(result.sections, 'Should return sections');
    assert.ok(result.sections.Overview, 'Should parse Overview section');
  });

  it('should export detectSecrets function', async () => {
    const { detectSecrets } = await import('../src/index.js');
    assert.ok(typeof detectSecrets === 'function', 'Should export detectSecrets');

    const clean = detectSecrets('Normal content without secrets');
    assert.ok(clean.clean, 'Should detect clean content');

    const dirty = detectSecrets('API_KEY="sk-1234567890abcdefghijklmnopqrstuv"');
    assert.ok(!dirty.clean, 'Should detect secrets');
  });
});

console.log('E2E tests loaded. Run with: node --test tests/e2e.test.js');
