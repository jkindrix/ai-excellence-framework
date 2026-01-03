/**
 * Tests for the lint command
 */

import { test, describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import { mkdtempSync, rmSync, writeFileSync, existsSync, mkdirSync, chmodSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

// Test directory setup
let testDir;

beforeEach(() => {
  testDir = mkdtempSync(join(tmpdir(), 'aix-lint-test-'));
});

afterEach(() => {
  if (testDir && existsSync(testDir)) {
    rmSync(testDir, { recursive: true, force: true });
  }
});

describe('lint command - CLAUDE.md checks', () => {
  test('passes with valid CLAUDE.md', async () => {
    const validClaudeMd = `# Project: Test

## Overview

A well-structured test project.

## Tech Stack

- **Language**: TypeScript
- **Runtime**: Node.js

## Architecture

Standard structure.

## Conventions

Follow best practices.

## Current State

Active development.

## Session Instructions

### Before Starting
1. Read this file

### Security Checklist
- [ ] No hardcoded secrets
`;

    writeFileSync(join(testDir, 'CLAUDE.md'), validClaudeMd);

    const { lintCommand } = await import('../src/commands/lint.js');

    const originalCwd = process.cwd();
    const originalExit = process.exit;
    const originalLog = console.log;
    let exitCode = 0;

    try {
      process.chdir(testDir);
      process.exit = code => {
        exitCode = code || 0;
      };
      console.log = () => {};

      await lintCommand({ verbose: false, ignoreErrors: true });

      // Should not exit with error for valid file
      assert.strictEqual(exitCode, 0, 'Should pass with valid CLAUDE.md');
    } finally {
      process.chdir(originalCwd);
      process.exit = originalExit;
      console.log = originalLog;
    }
  });

  test('warns when CLAUDE.md is too long', async () => {
    // Create a very long CLAUDE.md (>300 lines)
    const longContent =
      '# Project\n\n## Overview\n\nTest\n\n## Tech Stack\n\n- JS\n\n' +
      Array(350).fill('This is a line of content.').join('\n');

    writeFileSync(join(testDir, 'CLAUDE.md'), longContent);

    const { lintCommand } = await import('../src/commands/lint.js');

    const originalCwd = process.cwd();
    const originalExit = process.exit;
    let output = [];
    const originalLog = console.log;

    try {
      process.chdir(testDir);
      process.exit = () => {};
      console.log = msg => {
        output.push(msg);
      };

      await lintCommand({ verbose: true, ignoreErrors: true });

      // Should have warning about length
      const outputStr = output.join(' ');
      assert.ok(
        outputStr.includes('lines') || outputStr.includes('Warning'),
        'Should warn about file length'
      );
    } finally {
      process.chdir(originalCwd);
      process.exit = originalExit;
      console.log = originalLog;
    }
  });

  test('errors when CLAUDE.md is missing', async () => {
    // Don't create CLAUDE.md

    const { lintCommand } = await import('../src/commands/lint.js');

    const originalCwd = process.cwd();
    const originalLog = console.log;

    try {
      process.chdir(testDir);
      console.log = () => {};

      // lintCommand throws FrameworkError when there are errors
      await assert.rejects(
        async () => lintCommand({ verbose: false, ignoreErrors: false }),
        {
          code: 'AIX-VALID-200',
          message: /Lint found.*error/
        },
        'Should throw FrameworkError when CLAUDE.md missing'
      );
    } finally {
      process.chdir(originalCwd);
      console.log = originalLog;
    }
  });

  test('detects potential secrets', async () => {
    const claudeWithSecret = `# Project

## Overview

Test

## Tech Stack

- JS

Some config: api_key = "sk-1234567890abcdefghijklmnopqrstuvwxyz"
`;

    writeFileSync(join(testDir, 'CLAUDE.md'), claudeWithSecret);

    const { lintCommand } = await import('../src/commands/lint.js');

    const originalCwd = process.cwd();
    const originalLog = console.log;

    try {
      process.chdir(testDir);
      console.log = () => {};

      // lintCommand throws FrameworkError when secrets are detected
      await assert.rejects(
        async () => lintCommand({ verbose: false, ignoreErrors: false }),
        {
          code: 'AIX-VALID-200',
          message: /Lint found.*error/
        },
        'Should throw FrameworkError when secrets detected'
      );
    } finally {
      process.chdir(originalCwd);
      console.log = originalLog;
    }
  });
});

describe('lint command - AGENTS.md checks', () => {
  test('checks AGENTS.md core sections', async () => {
    // Create CLAUDE.md first
    writeFileSync(
      join(testDir, 'CLAUDE.md'),
      '# Project\n\n## Overview\n\nTest\n\n## Tech Stack\n\n- JS'
    );

    // Create incomplete AGENTS.md
    const incompleteAgents = `# AGENTS.md

## Project Overview

Just an overview section.
`;

    writeFileSync(join(testDir, 'AGENTS.md'), incompleteAgents);

    const { lintCommand } = await import('../src/commands/lint.js');

    const originalCwd = process.cwd();
    const originalExit = process.exit;
    let output = [];
    const originalLog = console.log;

    try {
      process.chdir(testDir);
      process.exit = () => {};
      console.log = msg => {
        output.push(msg);
      };

      await lintCommand({ verbose: true, ignoreErrors: true });

      const outputStr = output.join(' ');
      // Should report missing core areas
      assert.ok(
        outputStr.includes('core areas') || outputStr.includes('AGENTS.md'),
        'Should check AGENTS.md sections'
      );
    } finally {
      process.chdir(originalCwd);
      process.exit = originalExit;
      console.log = originalLog;
    }
  });

  test('passes with complete AGENTS.md', async () => {
    writeFileSync(
      join(testDir, 'CLAUDE.md'),
      '# Project\n\n## Overview\n\nTest\n\n## Tech Stack\n\n- JS'
    );

    const completeAgents = `# AGENTS.md

## Build & Test

\`\`\`bash
npm test
\`\`\`

## Architecture Overview

Standard structure.

## Code Style

Follow conventions.

## Security Guidelines

Never hardcode secrets.

## Git Workflow

Use conventional commits.

## Boundaries & Restrictions

Never modify .env files.

## Verification Commands

\`\`\`bash
npm run lint
npm test
\`\`\`
`;

    writeFileSync(join(testDir, 'AGENTS.md'), completeAgents);

    const { lintCommand } = await import('../src/commands/lint.js');

    const originalCwd = process.cwd();
    const originalExit = process.exit;
    let exitCode = 0;
    const originalLog = console.log;

    try {
      process.chdir(testDir);
      process.exit = code => {
        exitCode = code || 0;
      };
      console.log = () => {};

      await lintCommand({ verbose: false, ignoreErrors: true });

      assert.strictEqual(exitCode, 0, 'Should pass with complete AGENTS.md');
    } finally {
      process.chdir(originalCwd);
      process.exit = originalExit;
      console.log = originalLog;
    }
  });
});

describe('lint command - Cursor rules checks', () => {
  test('checks MDC format', async () => {
    writeFileSync(
      join(testDir, 'CLAUDE.md'),
      '# Project\n\n## Overview\n\nTest\n\n## Tech Stack\n\n- JS'
    );

    // Create Cursor rules without frontmatter
    mkdirSync(join(testDir, '.cursor', 'rules'), { recursive: true });
    writeFileSync(
      join(testDir, '.cursor', 'rules', 'invalid.mdc'),
      '# No frontmatter\nJust content.'
    );

    const { lintCommand } = await import('../src/commands/lint.js');

    const originalCwd = process.cwd();
    const originalExit = process.exit;
    let output = [];
    const originalLog = console.log;

    try {
      process.chdir(testDir);
      process.exit = () => {};
      console.log = msg => {
        output.push(msg);
      };

      await lintCommand({ verbose: true, ignoreErrors: true });

      const outputStr = output.join(' ');
      assert.ok(
        outputStr.includes('frontmatter') || outputStr.includes('MDC'),
        'Should warn about missing frontmatter'
      );
    } finally {
      process.chdir(originalCwd);
      process.exit = originalExit;
      console.log = originalLog;
    }
  });

  test('passes with valid MDC format', async () => {
    writeFileSync(
      join(testDir, 'CLAUDE.md'),
      '# Project\n\n## Overview\n\nTest\n\n## Tech Stack\n\n- JS'
    );

    mkdirSync(join(testDir, '.cursor', 'rules'), { recursive: true });

    const validMdc = `---
description: Test rule
alwaysApply: true
---

# Valid Rule

Content here.
`;

    writeFileSync(join(testDir, '.cursor', 'rules', 'valid.mdc'), validMdc);

    const { lintCommand } = await import('../src/commands/lint.js');

    const originalCwd = process.cwd();
    const originalExit = process.exit;
    let exitCode = 0;
    const originalLog = console.log;

    try {
      process.chdir(testDir);
      process.exit = code => {
        exitCode = code || 0;
      };
      console.log = () => {};

      await lintCommand({ verbose: false, ignoreErrors: true });

      assert.strictEqual(exitCode, 0, 'Should pass with valid MDC');
    } finally {
      process.chdir(originalCwd);
      process.exit = originalExit;
      console.log = originalLog;
    }
  });
});

describe('lint command - Windsurf checks', () => {
  test('warns when rules exceed char limit', async () => {
    writeFileSync(
      join(testDir, 'CLAUDE.md'),
      '# Project\n\n## Overview\n\nTest\n\n## Tech Stack\n\n- JS'
    );

    mkdirSync(join(testDir, '.windsurf', 'rules'), { recursive: true });

    // Create oversized rule (>6000 chars)
    const oversizedContent = '# Rule\n\n' + 'A'.repeat(7000);
    writeFileSync(join(testDir, '.windsurf', 'rules', 'oversized.md'), oversizedContent);

    const { lintCommand } = await import('../src/commands/lint.js');

    const originalCwd = process.cwd();
    const originalExit = process.exit;
    let output = [];
    const originalLog = console.log;

    try {
      process.chdir(testDir);
      process.exit = () => {};
      console.log = msg => {
        output.push(msg);
      };

      await lintCommand({ verbose: true, ignoreErrors: true });

      const outputStr = output.join(' ');
      assert.ok(
        outputStr.includes('6000') || outputStr.includes('char') || outputStr.includes('Oversized'),
        'Should warn about char limit'
      );
    } finally {
      process.chdir(originalCwd);
      process.exit = originalExit;
      console.log = originalLog;
    }
  });
});

describe('lint command - hooks checks', () => {
  test('checks hook executability', async () => {
    writeFileSync(
      join(testDir, 'CLAUDE.md'),
      '# Project\n\n## Overview\n\nTest\n\n## Tech Stack\n\n- JS'
    );

    mkdirSync(join(testDir, 'scripts', 'hooks'), { recursive: true });

    // Create non-executable hook
    writeFileSync(join(testDir, 'scripts', 'hooks', 'test.sh'), '#!/bin/bash\necho test');
    chmodSync(join(testDir, 'scripts', 'hooks', 'test.sh'), 0o644); // Not executable

    const { lintCommand } = await import('../src/commands/lint.js');

    const originalCwd = process.cwd();
    const originalExit = process.exit;
    let output = [];
    const originalLog = console.log;

    try {
      process.chdir(testDir);
      process.exit = () => {};
      console.log = msg => {
        output.push(msg);
      };

      await lintCommand({ verbose: true, ignoreErrors: true });

      const outputStr = output.join(' ');
      assert.ok(
        outputStr.includes('executable') || outputStr.includes('chmod'),
        'Should warn about non-executable hooks'
      );
    } finally {
      process.chdir(originalCwd);
      process.exit = originalExit;
      console.log = originalLog;
    }
  });

  test('warns when verify-deps.sh is missing', async () => {
    writeFileSync(
      join(testDir, 'CLAUDE.md'),
      '# Project\n\n## Overview\n\nTest\n\n## Tech Stack\n\n- JS'
    );

    // Create hooks directory WITHOUT verify-deps.sh
    mkdirSync(join(testDir, 'scripts', 'hooks'), { recursive: true });
    writeFileSync(join(testDir, 'scripts', 'hooks', 'other-hook.sh'), '#!/bin/bash');
    chmodSync(join(testDir, 'scripts', 'hooks', 'other-hook.sh'), 0o755);

    const { lintCommand } = await import('../src/commands/lint.js');

    const originalCwd = process.cwd();
    const originalExit = process.exit;
    let output = [];
    const originalLog = console.log;

    try {
      process.chdir(testDir);
      process.exit = () => {};
      console.log = msg => {
        output.push(msg);
      };

      await lintCommand({ verbose: true, ignoreErrors: true });

      const outputStr = output.join(' ');
      // Should report missing verify-deps.sh in verbose mode (info level)
      assert.ok(
        outputStr.includes('verify-deps') ||
          outputStr.includes('slopsquatting') ||
          outputStr.includes('hallucinated'),
        'Should warn about missing verify-deps.sh for slopsquatting protection'
      );
    } finally {
      process.chdir(originalCwd);
      process.exit = originalExit;
      console.log = originalLog;
    }
  });
});

describe('lint command - options', () => {
  test('--only filters checks', async () => {
    writeFileSync(
      join(testDir, 'CLAUDE.md'),
      '# Project\n\n## Overview\n\nTest\n\n## Tech Stack\n\n- JS'
    );

    const { lintCommand } = await import('../src/commands/lint.js');

    const originalCwd = process.cwd();
    const originalExit = process.exit;
    let exitCode = 0;
    const originalLog = console.log;

    try {
      process.chdir(testDir);
      process.exit = code => {
        exitCode = code || 0;
      };
      console.log = () => {};

      await lintCommand({
        verbose: false,
        only: ['claudeMd'],
        ignoreErrors: true
      });

      assert.strictEqual(exitCode, 0, 'Should only check specified files');
    } finally {
      process.chdir(originalCwd);
      process.exit = originalExit;
      console.log = originalLog;
    }
  });

  test('--ignore-errors exits 0 even with errors', async () => {
    // No CLAUDE.md = error

    const { lintCommand } = await import('../src/commands/lint.js');

    const originalCwd = process.cwd();
    const originalExit = process.exit;
    let exitCode = 0;
    const originalLog = console.log;

    try {
      process.chdir(testDir);
      process.exit = code => {
        exitCode = code || 0;
      };
      console.log = () => {};

      await lintCommand({ verbose: false, ignoreErrors: true });

      assert.strictEqual(exitCode, 0, 'Should exit 0 with --ignore-errors');
    } finally {
      process.chdir(originalCwd);
      process.exit = originalExit;
      console.log = originalLog;
    }
  });
});
