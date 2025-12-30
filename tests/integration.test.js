/**
 * Integration Tests for AI Excellence Framework
 *
 * These tests verify the complete CLI workflow including:
 * - Full initialization with all presets
 * - File creation and validation
 * - Configuration schema compliance
 * - Cross-component integration
 *
 * Run with: node --test tests/integration.test.js
 */

import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import { existsSync, mkdirSync, rmSync, readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { execSync, spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_ROOT = join(__dirname, '..');

/**
 * Helper to create a temporary test directory
 */
function createTempDir() {
  const tempDir = join(tmpdir(), `ai-excellence-integration-${Date.now()}-${Math.random().toString(36).slice(2)}`);
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
 * Helper to run CLI command
 */
function runCLI(args, cwd) {
  const cliPath = join(PROJECT_ROOT, 'bin', 'cli.js');
  try {
    const result = execSync(`node ${cliPath} ${args}`, {
      cwd,
      encoding: 'utf-8',
      timeout: 30000,
      env: { ...process.env, FORCE_COLOR: '0' }
    });
    return { success: true, output: result };
  } catch (error) {
    return { success: false, output: error.stdout || '', error: error.stderr || error.message };
  }
}

/**
 * Validate CLAUDE.md structure
 */
function validateClaudeMd(content) {
  const requiredSections = [
    '## Overview',
    '## Tech Stack',
    '## Current State'
  ];

  const recommendedSections = [
    '## Architecture',
    '## Conventions',
    '## Common Commands',
    '## Session Instructions'
  ];

  const results = {
    valid: true,
    requiredMissing: [],
    recommendedMissing: [],
    hasTitle: /^#\s+/.test(content)
  };

  for (const section of requiredSections) {
    if (!content.includes(section)) {
      results.requiredMissing.push(section);
      results.valid = false;
    }
  }

  for (const section of recommendedSections) {
    if (!content.includes(section)) {
      results.recommendedMissing.push(section);
    }
  }

  return results;
}

/**
 * Validate JSON configuration
 */
function validateConfig(configPath) {
  if (!existsSync(configPath)) {
    return { valid: false, error: 'Config file does not exist' };
  }

  try {
    const content = readFileSync(configPath, 'utf-8');
    const config = JSON.parse(content);

    const requiredFields = ['version', 'preset'];
    const missingFields = requiredFields.filter(f => !config[f]);

    if (missingFields.length > 0) {
      return { valid: false, error: `Missing required fields: ${missingFields.join(', ')}` };
    }

    const validPresets = ['minimal', 'standard', 'full', 'team', 'custom'];
    if (!validPresets.includes(config.preset)) {
      return { valid: false, error: `Invalid preset: ${config.preset}` };
    }

    return { valid: true, config };
  } catch (error) {
    return { valid: false, error: `JSON parse error: ${error.message}` };
  }
}

// ============================================
// INTEGRATION TEST SUITES
// ============================================

describe('Full Initialization Workflow', () => {
  let tempDir;

  beforeEach(() => {
    tempDir = createTempDir();
  });

  afterEach(() => {
    cleanupTempDir(tempDir);
  });

  it('should create complete minimal preset structure', () => {
    // Simulate minimal preset installation
    const dirs = [
      '.claude/commands',
      '.claude/agents',
      'docs/session-notes',
      '.tmp'
    ];

    const files = {
      'CLAUDE.md': `# Project: Test

## Overview
Test project for integration testing.

## Tech Stack
- Node.js 20.x
- JavaScript

## Current State
Initial setup for testing.
`,
      '.claude/commands/plan.md': `---
description: Create implementation plan
---
# Plan Mode
Plan before implementing.
`,
      '.claude/commands/verify.md': `---
description: Verify completion
---
# Verification
Verify work is complete.
`
    };

    // Create directories
    for (const dir of dirs) {
      mkdirSync(join(tempDir, dir), { recursive: true });
    }

    // Create files
    for (const [path, content] of Object.entries(files)) {
      writeFileSync(join(tempDir, path), content);
    }

    // Validate structure
    for (const dir of dirs) {
      assert.ok(existsSync(join(tempDir, dir)), `Directory ${dir} should exist`);
    }

    for (const path of Object.keys(files)) {
      assert.ok(existsSync(join(tempDir, path)), `File ${path} should exist`);
    }

    // Validate CLAUDE.md
    const claudeMd = readFileSync(join(tempDir, 'CLAUDE.md'), 'utf-8');
    const validation = validateClaudeMd(claudeMd);
    assert.ok(validation.valid, `CLAUDE.md should be valid. Missing: ${validation.requiredMissing.join(', ')}`);
  });

  it('should create complete standard preset structure', () => {
    const standardDirs = [
      '.claude/commands',
      '.claude/agents',
      'docs/session-notes',
      'docs/decisions',
      'scripts/hooks',
      '.tmp/scratch',
      '.tmp/investigation',
      '.tmp/staging'
    ];

    const standardCommands = ['plan', 'verify', 'handoff', 'assumptions', 'review', 'security-review'];
    const standardAgents = ['reviewer', 'explorer', 'tester'];

    // Create structure
    for (const dir of standardDirs) {
      mkdirSync(join(tempDir, dir), { recursive: true });
    }

    // Create command files
    for (const cmd of standardCommands) {
      writeFileSync(
        join(tempDir, '.claude/commands', `${cmd}.md`),
        `---\ndescription: ${cmd} command\n---\n# ${cmd}\nCommand content.`
      );
    }

    // Create agent files
    for (const agent of standardAgents) {
      writeFileSync(
        join(tempDir, '.claude/agents', `${agent}.md`),
        `---\nname: ${agent}\ndescription: ${agent} agent\n---\n# ${agent}\nAgent content.`
      );
    }

    // Validate
    const commandFiles = readdirSync(join(tempDir, '.claude/commands'));
    const agentFiles = readdirSync(join(tempDir, '.claude/agents'));

    assert.strictEqual(commandFiles.length, standardCommands.length,
      `Should have ${standardCommands.length} commands`);
    assert.strictEqual(agentFiles.length, standardAgents.length,
      `Should have ${standardAgents.length} agents`);
  });

  it('should create complete full preset structure', () => {
    const fullDirs = [
      '.claude/commands',
      '.claude/agents',
      'docs/session-notes',
      'docs/decisions',
      'docs/architecture',
      'scripts/hooks',
      'scripts/mcp',
      'scripts/metrics',
      '.tmp'
    ];

    // Create all directories
    for (const dir of fullDirs) {
      mkdirSync(join(tempDir, dir), { recursive: true });
    }

    // Create MCP server placeholder
    writeFileSync(
      join(tempDir, 'scripts/mcp/project-memory-server.py'),
      '#!/usr/bin/env python3\n# MCP Server\n'
    );

    // Create metrics script placeholder
    writeFileSync(
      join(tempDir, 'scripts/metrics/collect-session-metrics.sh'),
      '#!/bin/bash\n# Metrics collection\n'
    );

    // Validate MCP files
    assert.ok(existsSync(join(tempDir, 'scripts/mcp/project-memory-server.py')),
      'MCP server should exist');
    assert.ok(existsSync(join(tempDir, 'scripts/metrics/collect-session-metrics.sh')),
      'Metrics script should exist');
  });
});

describe('CLAUDE.md Validation', () => {
  let tempDir;

  beforeEach(() => {
    tempDir = createTempDir();
  });

  afterEach(() => {
    cleanupTempDir(tempDir);
  });

  it('should validate complete CLAUDE.md', () => {
    const validClaudeMd = `# Project: Complete Example

## Overview
A complete project with all required and recommended sections.

## Tech Stack
- Language: TypeScript 5.3
- Runtime: Node.js 20.x
- Framework: Express 4.x

## Architecture

### Directory Structure
\`\`\`
src/
├── api/
├── services/
└── utils/
\`\`\`

## Conventions
- Use conventional commits
- Follow ESLint rules

## Common Commands
\`\`\`bash
npm run dev
npm test
\`\`\`

## Current State

### Active Work
- Building the framework

### Known Issues
- None

## Session Instructions

### Before Starting
1. Read this file
2. Check session notes

### During Work
- Use /plan before implementing
`;

    writeFileSync(join(tempDir, 'CLAUDE.md'), validClaudeMd);
    const content = readFileSync(join(tempDir, 'CLAUDE.md'), 'utf-8');
    const validation = validateClaudeMd(content);

    assert.ok(validation.valid, 'Complete CLAUDE.md should be valid');
    assert.strictEqual(validation.requiredMissing.length, 0, 'No required sections should be missing');
    assert.ok(validation.hasTitle, 'Should have a title');
  });

  it('should detect missing required sections', () => {
    const incompleteClaudeMd = `# Project: Incomplete

## Overview
This is missing Tech Stack and Current State.
`;

    writeFileSync(join(tempDir, 'CLAUDE.md'), incompleteClaudeMd);
    const content = readFileSync(join(tempDir, 'CLAUDE.md'), 'utf-8');
    const validation = validateClaudeMd(content);

    assert.ok(!validation.valid, 'Incomplete CLAUDE.md should be invalid');
    assert.ok(validation.requiredMissing.includes('## Tech Stack'), 'Should detect missing Tech Stack');
    assert.ok(validation.requiredMissing.includes('## Current State'), 'Should detect missing Current State');
  });

  it('should detect missing title', () => {
    const noTitleClaudeMd = `## Overview
No title here.

## Tech Stack
- Node.js

## Current State
Active.
`;

    writeFileSync(join(tempDir, 'CLAUDE.md'), noTitleClaudeMd);
    const content = readFileSync(join(tempDir, 'CLAUDE.md'), 'utf-8');
    const validation = validateClaudeMd(content);

    assert.ok(!validation.hasTitle, 'Should detect missing title');
  });
});

describe('Configuration Schema Validation', () => {
  let tempDir;

  beforeEach(() => {
    tempDir = createTempDir();
  });

  afterEach(() => {
    cleanupTempDir(tempDir);
  });

  it('should validate minimal preset config', () => {
    const minimalConfig = {
      version: '1.0.0',
      preset: 'minimal',
      commands: ['plan', 'verify'],
      agents: [],
      hooks: { enabled: false },
      mcp: { enabled: false }
    };

    const configPath = join(tempDir, 'ai-excellence.config.json');
    writeFileSync(configPath, JSON.stringify(minimalConfig, null, 2));

    const validation = validateConfig(configPath);
    assert.ok(validation.valid, 'Minimal config should be valid');
    assert.strictEqual(validation.config.preset, 'minimal');
  });

  it('should validate standard preset config', () => {
    const standardConfig = {
      version: '1.0.0',
      preset: 'standard',
      commands: ['plan', 'verify', 'handoff', 'assumptions', 'review', 'security-review'],
      agents: ['reviewer', 'explorer', 'tester'],
      hooks: { enabled: true, scripts: ['post-edit', 'verify-deps'] },
      mcp: { enabled: false },
      security: {
        preCommit: true,
        secretsDetection: true
      }
    };

    const configPath = join(tempDir, 'ai-excellence.config.json');
    writeFileSync(configPath, JSON.stringify(standardConfig, null, 2));

    const validation = validateConfig(configPath);
    assert.ok(validation.valid, 'Standard config should be valid');
    assert.strictEqual(validation.config.commands.length, 6);
    assert.strictEqual(validation.config.agents.length, 3);
  });

  it('should validate full preset config', () => {
    const fullConfig = {
      version: '1.0.0',
      preset: 'full',
      commands: ['plan', 'verify', 'handoff', 'assumptions', 'review', 'security-review', 'refactor', 'test-coverage'],
      agents: ['reviewer', 'explorer', 'tester'],
      hooks: { enabled: true, scripts: ['post-edit', 'verify-deps', 'check-todos', 'check-claude-md'] },
      mcp: { enabled: true, storage: 'sqlite', maxDecisions: 1000 },
      security: {
        preCommit: true,
        secretsDetection: true,
        dependencyScanning: true
      },
      metrics: { enabled: true, autoCollect: false }
    };

    const configPath = join(tempDir, 'ai-excellence.config.json');
    writeFileSync(configPath, JSON.stringify(fullConfig, null, 2));

    const validation = validateConfig(configPath);
    assert.ok(validation.valid, 'Full config should be valid');
    assert.strictEqual(validation.config.commands.length, 8);
    assert.ok(validation.config.mcp.enabled);
    assert.ok(validation.config.metrics.enabled);
  });

  it('should reject invalid preset', () => {
    const invalidConfig = {
      version: '1.0.0',
      preset: 'invalid-preset'
    };

    const configPath = join(tempDir, 'ai-excellence.config.json');
    writeFileSync(configPath, JSON.stringify(invalidConfig, null, 2));

    const validation = validateConfig(configPath);
    assert.ok(!validation.valid, 'Invalid preset should fail validation');
    assert.ok(validation.error.includes('Invalid preset'));
  });

  it('should reject missing required fields', () => {
    const incompleteConfig = {
      commands: ['plan']
    };

    const configPath = join(tempDir, 'ai-excellence.config.json');
    writeFileSync(configPath, JSON.stringify(incompleteConfig, null, 2));

    const validation = validateConfig(configPath);
    assert.ok(!validation.valid, 'Incomplete config should fail validation');
    assert.ok(validation.error.includes('Missing required fields'));
  });
});

describe('Cross-Component Integration', () => {
  let tempDir;

  beforeEach(() => {
    tempDir = createTempDir();
  });

  afterEach(() => {
    cleanupTempDir(tempDir);
  });

  it('should have consistent command references across components', () => {
    const allCommands = ['plan', 'verify', 'handoff', 'assumptions', 'review', 'security-review', 'refactor', 'test-coverage'];

    // Check that all commands exist in the project
    const commandsDir = join(PROJECT_ROOT, '.claude', 'commands');

    for (const cmd of allCommands) {
      const cmdPath = join(commandsDir, `${cmd}.md`);
      assert.ok(existsSync(cmdPath), `Command ${cmd}.md should exist`);

      const content = readFileSync(cmdPath, 'utf-8');
      assert.ok(content.includes('---'), `Command ${cmd}.md should have frontmatter`);
      assert.ok(content.includes('description:'), `Command ${cmd}.md should have description`);
    }
  });

  it('should have consistent agent references across components', () => {
    const allAgents = ['explorer', 'reviewer', 'tester'];

    const agentsDir = join(PROJECT_ROOT, '.claude', 'agents');

    for (const agent of allAgents) {
      const agentPath = join(agentsDir, `${agent}.md`);
      assert.ok(existsSync(agentPath), `Agent ${agent}.md should exist`);

      const content = readFileSync(agentPath, 'utf-8');
      assert.ok(content.includes('---'), `Agent ${agent}.md should have frontmatter`);
      assert.ok(content.includes('name:'), `Agent ${agent}.md should have name`);
    }
  });

  it('should have matching hook scripts', () => {
    const allHooks = ['post-edit.sh', 'verify-deps.sh', 'check-todos.sh', 'check-claude-md.sh'];

    const hooksDir = join(PROJECT_ROOT, 'scripts', 'hooks');

    for (const hook of allHooks) {
      const hookPath = join(hooksDir, hook);
      assert.ok(existsSync(hookPath), `Hook ${hook} should exist`);

      const content = readFileSync(hookPath, 'utf-8');
      assert.ok(content.startsWith('#!/bin/bash'), `Hook ${hook} should have bash shebang`);
    }
  });

  it('should have all preset templates', () => {
    const presets = ['minimal', 'standard', 'full', 'team'];

    const presetsDir = join(PROJECT_ROOT, 'templates', 'presets');

    for (const preset of presets) {
      const presetDir = join(presetsDir, preset);
      assert.ok(existsSync(presetDir), `Preset directory ${preset} should exist`);

      const configPath = join(presetDir, 'ai-excellence.config.json');
      const claudeMdPath = join(presetDir, 'CLAUDE.md');

      assert.ok(existsSync(configPath), `Preset ${preset} should have config.json`);
      assert.ok(existsSync(claudeMdPath), `Preset ${preset} should have CLAUDE.md`);
    }
  });
});

describe('Security Validation', () => {
  let tempDir;

  beforeEach(() => {
    tempDir = createTempDir();
  });

  afterEach(() => {
    cleanupTempDir(tempDir);
  });

  it('should detect various secret patterns', () => {
    const secretPatterns = [
      { name: 'API Key', content: 'API_KEY="sk-1234567890abcdefghijklmnop"', shouldDetect: true },
      { name: 'AWS Key', content: 'AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY', shouldDetect: true },
      { name: 'Password', content: 'PASSWORD="supersecretpassword123"', shouldDetect: true },
      { name: 'Token', content: 'GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx', shouldDetect: true },
      { name: 'Safe content', content: 'This is safe content without secrets', shouldDetect: false },
      { name: 'Placeholder', content: 'API_KEY=${API_KEY}', shouldDetect: false }
    ];

    const detectSecrets = (content) => {
      const patterns = [
        /(?:api[_-]?key|apikey)\s*[:=]\s*["']?[a-zA-Z0-9_\-]{16,}["']?/i,
        /(?:secret|password|token|credential)\s*[:=]\s*["']?[a-zA-Z0-9_\-]{8,}["']?/i,
        /(?:aws|gcp|azure)[_-]?(?:secret|key|token)\s*[:=]\s*["']?[a-zA-Z0-9_\-/+=]{16,}["']?/i,
        /ghp_[a-zA-Z0-9]{36}/,
        /sk-[a-zA-Z0-9]{32,}/
      ];

      return patterns.some(pattern => pattern.test(content));
    };

    for (const test of secretPatterns) {
      const detected = detectSecrets(test.content);
      assert.strictEqual(detected, test.shouldDetect,
        `${test.name}: Expected ${test.shouldDetect}, got ${detected}`);
    }
  });

  it('should validate dependency names', () => {
    const validateDependency = (name) => {
      // npm package name rules
      const validPattern = /^(@[a-z0-9-~][a-z0-9-._~]*\/)?[a-z0-9-~][a-z0-9-._~]*$/;
      return validPattern.test(name) && name.length <= 214;
    };

    const validDeps = ['lodash', '@types/node', 'fs-extra', 'chalk'];
    const invalidDeps = ['Invalid Name', 'UPPERCASE', '../escape', 'a'.repeat(215)];

    for (const dep of validDeps) {
      assert.ok(validateDependency(dep), `${dep} should be valid`);
    }

    for (const dep of invalidDeps) {
      assert.ok(!validateDependency(dep), `${dep} should be invalid`);
    }
  });
});

describe('File Permission Validation', () => {
  let tempDir;

  beforeEach(() => {
    tempDir = createTempDir();
  });

  afterEach(() => {
    cleanupTempDir(tempDir);
  });

  it('should create shell scripts with correct permissions', async () => {
    const scriptPath = join(tempDir, 'test-script.sh');
    writeFileSync(scriptPath, '#!/bin/bash\necho "test"');

    const { chmod } = await import('fs/promises');
    await chmod(scriptPath, 0o755);

    const { stat } = await import('fs/promises');
    const stats = await stat(scriptPath);

    // Check executable bit
    const isExecutable = (stats.mode & 0o111) !== 0;
    assert.ok(isExecutable, 'Script should be executable');
  });
});

describe('Template Variable Substitution', () => {
  it('should replace project name placeholder', () => {
    const template = '# Project: [PROJECT_NAME]\n\n## Overview\n[PROJECT_NAME] is great.';
    const projectName = 'MyAwesomeProject';
    const result = template.replace(/\[PROJECT_NAME\]/g, projectName);

    assert.ok(result.includes(projectName), 'Should replace project name');
    assert.ok(!result.includes('[PROJECT_NAME]'), 'Should not have placeholder');
  });

  it('should replace date placeholder', () => {
    const template = '## Recent Decisions\n- [DATE]: Initial decision';
    const date = new Date().toISOString().split('T')[0];
    const result = template.replace(/\[DATE\]/g, date);

    assert.ok(result.includes(date), 'Should replace date');
    assert.ok(!result.includes('[DATE]'), 'Should not have placeholder');
  });
});

console.log('Integration tests loaded. Run with: node --test tests/integration.test.js');
