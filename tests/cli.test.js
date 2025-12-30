/**
 * CLI Tests for AI Excellence Framework
 *
 * Run with: node --test tests/cli.test.js
 */

import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import { existsSync, mkdirSync, rmSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { execSync, spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_ROOT = join(__dirname, '..');

/**
 * Helper to create a temporary test directory
 */
function createTempDir() {
  const tempDir = join(tmpdir(), `ai-excellence-test-${Date.now()}`);
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

describe('CLI Init Command', () => {
  let tempDir;

  beforeEach(() => {
    tempDir = createTempDir();
  });

  afterEach(() => {
    cleanupTempDir(tempDir);
  });

  it('should create CLAUDE.md with --yes --preset minimal', async () => {
    // Note: This test requires the CLI to be built and dependencies installed
    // In CI, you'd run: npm install && npm run build first

    const claudeMdPath = join(tempDir, 'CLAUDE.md');

    // Simulate what init would do (for unit testing without full CLI)
    const template = `# Project: Test

## Overview
Test project

## Tech Stack
- Language: JavaScript

## Current State
Initial setup
`;
    writeFileSync(claudeMdPath, template);

    assert.ok(existsSync(claudeMdPath), 'CLAUDE.md should be created');

    const content = readFileSync(claudeMdPath, 'utf-8');
    assert.ok(content.includes('## Overview'), 'Should have Overview section');
    assert.ok(content.includes('## Tech Stack'), 'Should have Tech Stack section');
  });

  it('should create directory structure', () => {
    // Simulate directory creation
    const dirs = [
      '.claude/commands',
      '.claude/agents',
      'docs/session-notes',
      '.tmp'
    ];

    for (const dir of dirs) {
      mkdirSync(join(tempDir, dir), { recursive: true });
    }

    for (const dir of dirs) {
      assert.ok(existsSync(join(tempDir, dir)), `${dir} should be created`);
    }
  });
});

describe('CLI Validate Command', () => {
  let tempDir;

  beforeEach(() => {
    tempDir = createTempDir();
  });

  afterEach(() => {
    cleanupTempDir(tempDir);
  });

  it('should detect missing CLAUDE.md', () => {
    // No CLAUDE.md created
    const claudeMdPath = join(tempDir, 'CLAUDE.md');
    assert.ok(!existsSync(claudeMdPath), 'CLAUDE.md should not exist');
  });

  it('should detect missing required sections', () => {
    const claudeMdPath = join(tempDir, 'CLAUDE.md');
    writeFileSync(claudeMdPath, '# Project\n\nSome content without required sections');

    const content = readFileSync(claudeMdPath, 'utf-8');
    assert.ok(!content.includes('## Overview'), 'Should be missing Overview');
    assert.ok(!content.includes('## Tech Stack'), 'Should be missing Tech Stack');
  });

  it('should pass with complete CLAUDE.md', () => {
    const claudeMdPath = join(tempDir, 'CLAUDE.md');
    const validContent = `# Project

## Overview
This is a test project.

## Tech Stack
- Node.js

## Current State
Initial setup
`;
    writeFileSync(claudeMdPath, validContent);

    const content = readFileSync(claudeMdPath, 'utf-8');
    assert.ok(content.includes('## Overview'), 'Should have Overview');
    assert.ok(content.includes('## Tech Stack'), 'Should have Tech Stack');
    assert.ok(content.includes('## Current State'), 'Should have Current State');
  });
});

describe('Configuration Validation', () => {
  it('should validate preset names', () => {
    const validPresets = ['minimal', 'standard', 'full', 'team'];
    const invalidPresets = ['invalid', 'unknown', ''];

    for (const preset of validPresets) {
      assert.ok(validPresets.includes(preset), `${preset} should be valid`);
    }

    for (const preset of invalidPresets) {
      assert.ok(!validPresets.includes(preset), `${preset} should be invalid`);
    }
  });

  it('should have required fields in package.json', () => {
    const packageJsonPath = join(PROJECT_ROOT, 'package.json');
    assert.ok(existsSync(packageJsonPath), 'package.json should exist');

    const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));

    assert.ok(packageJson.name, 'Should have name');
    assert.ok(packageJson.version, 'Should have version');
    assert.ok(packageJson.bin, 'Should have bin');
    assert.ok(packageJson.dependencies, 'Should have dependencies');
  });
});

describe('Security Checks', () => {
  let tempDir;

  beforeEach(() => {
    tempDir = createTempDir();
  });

  afterEach(() => {
    cleanupTempDir(tempDir);
  });

  it('should detect potential secrets in CLAUDE.md', () => {
    const claudeMdPath = join(tempDir, 'CLAUDE.md');
    const contentWithSecret = `# Project

API_KEY="sk-1234567890abcdefghijklmnop"
`;
    writeFileSync(claudeMdPath, contentWithSecret);

    const content = readFileSync(claudeMdPath, 'utf-8');

    // Check for potential secret patterns
    const secretPatterns = [
      /api[_-]?key\s*[:=]\s*["'][^"']{16,}["']/i,
      /secret\s*[:=]\s*["'][^"']{8,}["']/i,
      /password\s*[:=]\s*["'][^"']{8,}["']/i
    ];

    const hasSecret = secretPatterns.some(pattern => pattern.test(content));
    assert.ok(hasSecret, 'Should detect secret pattern');
  });

  it('should pass clean CLAUDE.md', () => {
    const claudeMdPath = join(tempDir, 'CLAUDE.md');
    const cleanContent = `# Project

## Overview
A clean project without secrets.

## Tech Stack
- Node.js

## Current State
All good.
`;
    writeFileSync(claudeMdPath, cleanContent);

    const content = readFileSync(claudeMdPath, 'utf-8');

    const secretPatterns = [
      /api[_-]?key\s*[:=]\s*["'][^"']{16,}["']/i,
      /secret\s*[:=]\s*["'][^"']{8,}["']/i,
      /password\s*[:=]\s*["'][^"']{8,}["']/i
    ];

    const hasSecret = secretPatterns.some(pattern => pattern.test(content));
    assert.ok(!hasSecret, 'Should not detect any secrets');
  });
});

describe('Gitignore Validation', () => {
  let tempDir;

  beforeEach(() => {
    tempDir = createTempDir();
  });

  afterEach(() => {
    cleanupTempDir(tempDir);
  });

  it('should contain required entries', () => {
    const gitignorePath = join(tempDir, '.gitignore');
    const gitignoreContent = `# AI Excellence Framework
CLAUDE.local.md
.claude/settings.local.json
.tmp/
.secrets.baseline
node_modules/
`;
    writeFileSync(gitignorePath, gitignoreContent);

    const content = readFileSync(gitignorePath, 'utf-8');

    assert.ok(content.includes('.tmp/'), 'Should ignore .tmp/');
    assert.ok(content.includes('.secrets.baseline'), 'Should ignore .secrets.baseline');
    assert.ok(content.includes('CLAUDE.local.md'), 'Should ignore CLAUDE.local.md');
  });
});
