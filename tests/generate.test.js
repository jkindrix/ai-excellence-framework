/**
 * Tests for the generate command
 */

import { test, describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import { mkdtempSync, rmSync, writeFileSync, readFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

// Test directory setup
let testDir;

beforeEach(() => {
  testDir = mkdtempSync(join(tmpdir(), 'aix-generate-test-'));
});

afterEach(() => {
  if (testDir && existsSync(testDir)) {
    rmSync(testDir, { recursive: true, force: true });
  }
});

describe('generate command', () => {
  test('SUPPORTED_TOOLS includes all major AI tools', async () => {
    const { SUPPORTED_TOOLS } = await import('../src/commands/generate.js');

    // Core tools
    assert.ok(SUPPORTED_TOOLS.includes('agents'), 'Should support AGENTS.md');
    assert.ok(SUPPORTED_TOOLS.includes('skills'), 'Should support Skills (SKILL.md)');
    assert.ok(SUPPORTED_TOOLS.includes('cursor'), 'Should support Cursor');
    assert.ok(SUPPORTED_TOOLS.includes('copilot'), 'Should support Copilot');
    assert.ok(SUPPORTED_TOOLS.includes('windsurf'), 'Should support Windsurf');
    assert.ok(SUPPORTED_TOOLS.includes('aider'), 'Should support Aider');
    assert.ok(SUPPORTED_TOOLS.includes('claude'), 'Should support Claude');

    // Additional tools
    assert.ok(SUPPORTED_TOOLS.includes('gemini'), 'Should support Gemini CLI');
    assert.ok(SUPPORTED_TOOLS.includes('codex'), 'Should support OpenAI Codex');
    assert.ok(SUPPORTED_TOOLS.includes('zed'), 'Should support Zed Editor');
    assert.ok(SUPPORTED_TOOLS.includes('amp'), 'Should support Sourcegraph Amp');
    assert.ok(SUPPORTED_TOOLS.includes('roo'), 'Should support Roo Code');
    assert.ok(SUPPORTED_TOOLS.includes('junie'), 'Should support JetBrains Junie');
    assert.ok(SUPPORTED_TOOLS.includes('cline'), 'Should support Cline');
    assert.ok(SUPPORTED_TOOLS.includes('goose'), 'Should support Block Goose');

    assert.ok(SUPPORTED_TOOLS.includes('all'), 'Should support all');
  });

  test('generates AGENTS.md with required sections', async () => {
    // Create a CLAUDE.md as source
    const claudeMd = `# Project: Test Project

## Overview

A test project for validation.

## Tech Stack

- **Language**: JavaScript
- **Runtime**: Node.js 20

## Architecture

Standard structure.

## Conventions

Follow best practices.

## Common Commands

\`\`\`bash
npm test
\`\`\`
`;

    writeFileSync(join(testDir, 'CLAUDE.md'), claudeMd);

    // Import and run generate
    const { generateCommand } = await import('../src/commands/generate.js');

    const originalCwd = process.cwd();
    const originalExit = process.exit;
    const originalLog = console.log;

    try {
      process.chdir(testDir);
      process.exit = () => {};
      console.log = () => {};

      await generateCommand({ tools: 'agents', force: true });

      const agentsPath = join(testDir, 'AGENTS.md');
      assert.ok(existsSync(agentsPath), 'AGENTS.md should be created');

      const content = readFileSync(agentsPath, 'utf-8');

      // Check required sections per AGENTS.md spec
      assert.ok(content.includes('## Build & Test'), 'Should have Build & Test section');
      assert.ok(content.includes('## Architecture'), 'Should have Architecture section');
      assert.ok(content.includes('## Security'), 'Should have Security section');
      assert.ok(content.includes('## Git Workflow'), 'Should have Git Workflow section');
      assert.ok(content.includes('## Boundaries'), 'Should have Boundaries section');
      assert.ok(content.includes('## Verification Commands'), 'Should have Verification section');
    } finally {
      process.chdir(originalCwd);
      process.exit = originalExit;
      console.log = originalLog;
    }
  });

  test('generates Cursor rules in .mdc format', async () => {
    writeFileSync(
      join(testDir, 'CLAUDE.md'),
      '# Project\n\n## Overview\n\nTest\n\n## Tech Stack\n\n- JS'
    );

    const { generateCommand } = await import('../src/commands/generate.js');

    const originalCwd = process.cwd();
    const originalExit = process.exit;
    const originalLog = console.log;

    try {
      process.chdir(testDir);
      process.exit = () => {};
      console.log = () => {};

      await generateCommand({ tools: 'cursor', force: true });

      // Check .cursor directory created
      const cursorDir = join(testDir, '.cursor');
      assert.ok(existsSync(cursorDir), '.cursor/ should be created');

      // Check index.mdc
      const indexPath = join(cursorDir, 'index.mdc');
      assert.ok(existsSync(indexPath), 'index.mdc should be created');

      const indexContent = readFileSync(indexPath, 'utf-8');
      assert.ok(indexContent.startsWith('---'), 'Should have YAML frontmatter');
      assert.ok(indexContent.includes('alwaysApply: true'), 'Should have alwaysApply');

      // Check rules directory
      const rulesDir = join(cursorDir, 'rules');
      assert.ok(existsSync(rulesDir), '.cursor/rules/ should be created');

      // Check security rules
      const securityPath = join(rulesDir, 'security.mdc');
      assert.ok(existsSync(securityPath), 'security.mdc should be created');

      const securityContent = readFileSync(securityPath, 'utf-8');
      assert.ok(securityContent.includes('OWASP'), 'Should reference OWASP');
    } finally {
      process.chdir(originalCwd);
      process.exit = originalExit;
      console.log = originalLog;
    }
  });

  test('generates GitHub Copilot instructions', async () => {
    writeFileSync(
      join(testDir, 'CLAUDE.md'),
      '# Project\n\n## Overview\n\nTest\n\n## Tech Stack\n\n- TS'
    );

    const { generateCommand } = await import('../src/commands/generate.js');

    const originalCwd = process.cwd();
    const originalExit = process.exit;
    const originalLog = console.log;

    try {
      process.chdir(testDir);
      process.exit = () => {};
      console.log = () => {};

      await generateCommand({ tools: 'copilot', force: true });

      const copilotPath = join(testDir, '.github', 'copilot-instructions.md');
      assert.ok(existsSync(copilotPath), 'copilot-instructions.md should be created');

      const content = readFileSync(copilotPath, 'utf-8');
      assert.ok(content.includes('Security'), 'Should have security section');
      assert.ok(content.includes('conventional commit'), 'Should have commit guidance');
    } finally {
      process.chdir(originalCwd);
      process.exit = originalExit;
      console.log = originalLog;
    }
  });

  test('generates Windsurf rules within char limit', async () => {
    writeFileSync(
      join(testDir, 'CLAUDE.md'),
      '# Project\n\n## Overview\n\nTest\n\n## Tech Stack\n\n- Go'
    );

    const { generateCommand } = await import('../src/commands/generate.js');

    const originalCwd = process.cwd();
    const originalExit = process.exit;
    const originalLog = console.log;

    try {
      process.chdir(testDir);
      process.exit = () => {};
      console.log = () => {};

      await generateCommand({ tools: 'windsurf', force: true });

      const windsurfDir = join(testDir, '.windsurf', 'rules');
      assert.ok(existsSync(windsurfDir), '.windsurf/rules/ should be created');

      // Check char limit (6000 per file)
      const projectPath = join(windsurfDir, 'project.md');
      const content = readFileSync(projectPath, 'utf-8');
      assert.ok(content.length <= 6000, `Should be under 6000 chars (got ${content.length})`);
    } finally {
      process.chdir(originalCwd);
      process.exit = originalExit;
      console.log = originalLog;
    }
  });

  test('generates Aider configuration', async () => {
    writeFileSync(
      join(testDir, 'CLAUDE.md'),
      '# Project\n\n## Overview\n\nTest\n\n## Tech Stack\n\n- Python'
    );

    const { generateCommand } = await import('../src/commands/generate.js');

    const originalCwd = process.cwd();
    const originalExit = process.exit;
    const originalLog = console.log;

    try {
      process.chdir(testDir);
      process.exit = () => {};
      console.log = () => {};

      await generateCommand({ tools: 'aider', force: true });

      const aiderPath = join(testDir, '.aider.conf.yml');
      assert.ok(existsSync(aiderPath), '.aider.conf.yml should be created');

      const content = readFileSync(aiderPath, 'utf-8');
      assert.ok(content.includes('auto-commits'), 'Should have auto-commits');
      assert.ok(content.includes('auto-lint'), 'Should have auto-lint');
      assert.ok(content.includes('auto-test'), 'Should have auto-test');
      assert.ok(content.includes('read-only'), 'Should have read-only patterns');
    } finally {
      process.chdir(originalCwd);
      process.exit = originalExit;
      console.log = originalLog;
    }
  });

  test('dry-run mode does not create files', async () => {
    writeFileSync(
      join(testDir, 'CLAUDE.md'),
      '# Project\n\n## Overview\n\nTest\n\n## Tech Stack\n\n- Rust'
    );

    const { generateCommand } = await import('../src/commands/generate.js');

    const originalCwd = process.cwd();
    const originalExit = process.exit;
    const originalLog = console.log;

    try {
      process.chdir(testDir);
      process.exit = () => {};
      console.log = () => {};

      await generateCommand({ tools: 'all', dryRun: true, force: true });

      // Nothing should be created
      assert.ok(
        !existsSync(join(testDir, 'AGENTS.md')),
        'AGENTS.md should not be created in dry-run'
      );
      assert.ok(!existsSync(join(testDir, '.cursor')), '.cursor/ should not be created in dry-run');
      assert.ok(
        !existsSync(join(testDir, '.github', 'copilot-instructions.md')),
        'copilot-instructions.md should not be created in dry-run'
      );
    } finally {
      process.chdir(originalCwd);
      process.exit = originalExit;
      console.log = originalLog;
    }
  });

  test('respects existing files without --force', async () => {
    writeFileSync(
      join(testDir, 'CLAUDE.md'),
      '# Project\n\n## Overview\n\nTest\n\n## Tech Stack\n\n- C'
    );
    writeFileSync(join(testDir, 'AGENTS.md'), '# Existing Content');

    const { generateCommand } = await import('../src/commands/generate.js');

    const originalCwd = process.cwd();
    const originalExit = process.exit;
    const originalLog = console.log;

    try {
      process.chdir(testDir);
      process.exit = () => {};
      console.log = () => {};

      await generateCommand({ tools: 'agents', force: false });

      // Original content should be preserved
      const content = readFileSync(join(testDir, 'AGENTS.md'), 'utf-8');
      assert.strictEqual(content, '# Existing Content', 'Existing content should be preserved');
    } finally {
      process.chdir(originalCwd);
      process.exit = originalExit;
      console.log = originalLog;
    }
  });
});

describe('project context parsing', () => {
  test('extracts tech stack from CLAUDE.md', async () => {
    const claudeMd = `# Project: Test

## Overview

A test project.

## Tech Stack

- **Language**: TypeScript 5.3
- **Runtime**: Node.js 20
- **Framework**: Express 4.x
- **Database**: PostgreSQL 15
`;

    writeFileSync(join(testDir, 'CLAUDE.md'), claudeMd);

    const { generateCommand } = await import('../src/commands/generate.js');

    const originalCwd = process.cwd();
    const originalExit = process.exit;
    const originalLog = console.log;

    try {
      process.chdir(testDir);
      process.exit = () => {};
      console.log = () => {};

      await generateCommand({ tools: 'agents', force: true });

      const content = readFileSync(join(testDir, 'AGENTS.md'), 'utf-8');

      assert.ok(content.includes('TypeScript'), 'Should include TypeScript');
      assert.ok(content.includes('Node.js'), 'Should include Node.js');
    } finally {
      process.chdir(originalCwd);
      process.exit = originalExit;
      console.log = originalLog;
    }
  });

  test('extracts security checklist from CLAUDE.md', async () => {
    const claudeMd = `# Project: Test

## Overview

Test.

## Tech Stack

- JS

## Session Instructions

### Security Checklist
- [ ] No hardcoded secrets
- [ ] Input validation present
- [ ] XSS protection
`;

    writeFileSync(join(testDir, 'CLAUDE.md'), claudeMd);

    const { generateCommand } = await import('../src/commands/generate.js');

    const originalCwd = process.cwd();
    const originalExit = process.exit;
    const originalLog = console.log;

    try {
      process.chdir(testDir);
      process.exit = () => {};
      console.log = () => {};

      await generateCommand({ tools: 'agents', force: true });

      const content = readFileSync(join(testDir, 'AGENTS.md'), 'utf-8');

      assert.ok(
        content.includes('hardcoded secrets') || content.includes('credentials'),
        'Should include security guidance'
      );
    } finally {
      process.chdir(originalCwd);
      process.exit = originalExit;
      console.log = originalLog;
    }
  });
});

describe('extended tool generators', () => {
  test('generates Skills (SKILL.md) in .github/skills/', async () => {
    writeFileSync(
      join(testDir, 'CLAUDE.md'),
      '# Project\n\n## Overview\n\nTest\n\n## Tech Stack\n\n- TypeScript'
    );

    const { generateCommand } = await import('../src/commands/generate.js');

    const originalCwd = process.cwd();
    const originalExit = process.exit;
    const originalLog = console.log;

    try {
      process.chdir(testDir);
      process.exit = () => {};
      console.log = () => {};

      await generateCommand({ tools: 'skills', force: true });

      // Check project-standards skill
      const skillPath = join(testDir, '.github', 'skills', 'project-standards', 'SKILL.md');
      assert.ok(existsSync(skillPath), 'project-standards/SKILL.md should be created');

      const content = readFileSync(skillPath, 'utf-8');
      assert.ok(content.includes('---'), 'Should have YAML frontmatter');
      assert.ok(content.includes('name: project-standards'), 'Should have name in frontmatter');
      assert.ok(content.includes('description:'), 'Should have description in frontmatter');

      // Check security-review skill
      const securitySkillPath = join(testDir, '.github', 'skills', 'security-review', 'SKILL.md');
      assert.ok(existsSync(securitySkillPath), 'security-review/SKILL.md should be created');
    } finally {
      process.chdir(originalCwd);
      process.exit = originalExit;
      console.log = originalLog;
    }
  });

  test('generates JetBrains Junie guidelines', async () => {
    writeFileSync(
      join(testDir, 'CLAUDE.md'),
      '# Project\n\n## Overview\n\nTest\n\n## Tech Stack\n\n- Kotlin'
    );

    const { generateCommand } = await import('../src/commands/generate.js');

    const originalCwd = process.cwd();
    const originalExit = process.exit;
    const originalLog = console.log;

    try {
      process.chdir(testDir);
      process.exit = () => {};
      console.log = () => {};

      await generateCommand({ tools: 'junie', force: true });

      const guidelinesPath = join(testDir, '.junie', 'guidelines.md');
      assert.ok(existsSync(guidelinesPath), '.junie/guidelines.md should be created');

      const content = readFileSync(guidelinesPath, 'utf-8');
      assert.ok(content.includes('Junie'), 'Should reference Junie');
      assert.ok(content.includes('JetBrains'), 'Should reference JetBrains');
      assert.ok(content.includes('## Coding Conventions'), 'Should have conventions section');
    } finally {
      process.chdir(originalCwd);
      process.exit = originalExit;
      console.log = originalLog;
    }
  });

  test('generates Cline rules', async () => {
    writeFileSync(
      join(testDir, 'CLAUDE.md'),
      '# Project\n\n## Overview\n\nTest\n\n## Tech Stack\n\n- React'
    );

    const { generateCommand } = await import('../src/commands/generate.js');

    const originalCwd = process.cwd();
    const originalExit = process.exit;
    const originalLog = console.log;

    try {
      process.chdir(testDir);
      process.exit = () => {};
      console.log = () => {};

      await generateCommand({ tools: 'cline', force: true });

      const clinerulePath = join(testDir, '.clinerules');
      assert.ok(existsSync(clinerulePath), '.clinerules should be created');

      const content = readFileSync(clinerulePath, 'utf-8');
      assert.ok(content.includes('Cline'), 'Should reference Cline');
      assert.ok(content.includes('Plan Mode'), 'Should have Plan Mode guidance');
      assert.ok(content.includes('Act Mode'), 'Should have Act Mode guidance');
    } finally {
      process.chdir(originalCwd);
      process.exit = originalExit;
      console.log = originalLog;
    }
  });

  test('generates Block Goose configuration', async () => {
    writeFileSync(
      join(testDir, 'CLAUDE.md'),
      '# Project\n\n## Overview\n\nTest\n\n## Tech Stack\n\n- Python'
    );

    const { generateCommand } = await import('../src/commands/generate.js');

    const originalCwd = process.cwd();
    const originalExit = process.exit;
    const originalLog = console.log;

    try {
      process.chdir(testDir);
      process.exit = () => {};
      console.log = () => {};

      await generateCommand({ tools: 'goose', force: true });

      // Check extensions.yaml
      const extensionsPath = join(testDir, '.goose', 'extensions.yaml');
      assert.ok(existsSync(extensionsPath), '.goose/extensions.yaml should be created');

      const extensionsContent = readFileSync(extensionsPath, 'utf-8');
      assert.ok(extensionsContent.includes('recommended_extensions'), 'Should have extensions');
      assert.ok(extensionsContent.includes('mcp'), 'Should reference MCP');

      // Check README
      const readmePath = join(testDir, '.goose', 'README.md');
      assert.ok(existsSync(readmePath), '.goose/README.md should be created');

      const readmeContent = readFileSync(readmePath, 'utf-8');
      assert.ok(readmeContent.includes('Goose'), 'Should reference Goose');
      assert.ok(readmeContent.includes('AAIF'), 'Should reference AAIF');
    } finally {
      process.chdir(originalCwd);
      process.exit = originalExit;
      console.log = originalLog;
    }
  });

  test('generates .windsurfrules single file format', async () => {
    writeFileSync(
      join(testDir, 'CLAUDE.md'),
      '# Project\n\n## Overview\n\nTest\n\n## Tech Stack\n\n- Vue'
    );

    const { generateCommand } = await import('../src/commands/generate.js');

    const originalCwd = process.cwd();
    const originalExit = process.exit;
    const originalLog = console.log;

    try {
      process.chdir(testDir);
      process.exit = () => {};
      console.log = () => {};

      await generateCommand({ tools: 'windsurf', force: true });

      // Check .windsurfrules single file
      const windsurfrulesPath = join(testDir, '.windsurfrules');
      assert.ok(existsSync(windsurfrulesPath), '.windsurfrules should be created');

      const content = readFileSync(windsurfrulesPath, 'utf-8');
      assert.ok(content.includes('Windsurf'), 'Should reference Windsurf');
      assert.ok(content.includes('## Security'), 'Should have security section');
    } finally {
      process.chdir(originalCwd);
      process.exit = originalExit;
      console.log = originalLog;
    }
  });
});

describe('plugin and platform generators', () => {
  test('SUPPORTED_TOOLS includes plugin and platform tools', async () => {
    const { SUPPORTED_TOOLS } = await import('../src/commands/generate.js');

    assert.ok(SUPPORTED_TOOLS.includes('plugins'), 'Should support Claude Code Plugins');
    assert.ok(SUPPORTED_TOOLS.includes('kiro'), 'Should support Kiro CLI');
    assert.ok(SUPPORTED_TOOLS.includes('continue'), 'Should support Continue.dev');
    assert.ok(SUPPORTED_TOOLS.includes('augment'), 'Should support Augment Code');
    assert.ok(SUPPORTED_TOOLS.includes('qodo'), 'Should support Qodo AI');

    // Plugin and platform tools are present
    assert.ok(SUPPORTED_TOOLS.includes('all'), 'Should support all');
  });

  test('generates Claude Code Plugins', async () => {
    writeFileSync(
      join(testDir, 'CLAUDE.md'),
      '# Project\n\n## Overview\n\nTest\n\n## Tech Stack\n\n- TypeScript'
    );

    const { generateCommand } = await import('../src/commands/generate.js');

    const originalCwd = process.cwd();
    const originalExit = process.exit;
    const originalLog = console.log;

    try {
      process.chdir(testDir);
      process.exit = () => {};
      console.log = () => {};

      await generateCommand({ tools: 'plugins', force: true });

      // Check plugin.json
      const pluginPath = join(testDir, '.claude-plugin', 'plugin.json');
      assert.ok(existsSync(pluginPath), '.claude-plugin/plugin.json should be created');

      const content = readFileSync(pluginPath, 'utf-8');
      const parsed = JSON.parse(content);
      assert.ok(parsed.name, 'Should have name');
      assert.ok(parsed.version, 'Should have version');
      assert.ok(parsed.commands, 'Should reference commands directory');

      // Check README
      const readmePath = join(testDir, '.claude-plugin', 'README.md');
      assert.ok(existsSync(readmePath), '.claude-plugin/README.md should be created');
    } finally {
      process.chdir(originalCwd);
      process.exit = originalExit;
      console.log = originalLog;
    }
  });

  test('generates Kiro CLI configuration', async () => {
    writeFileSync(
      join(testDir, 'CLAUDE.md'),
      '# Project\n\n## Overview\n\nTest\n\n## Tech Stack\n\n- Python'
    );

    const { generateCommand } = await import('../src/commands/generate.js');

    const originalCwd = process.cwd();
    const originalExit = process.exit;
    const originalLog = console.log;

    try {
      process.chdir(testDir);
      process.exit = () => {};
      console.log = () => {};

      await generateCommand({ tools: 'kiro', force: true });

      // Check mcp.json
      const mcpPath = join(testDir, '.kiro', 'mcp.json');
      assert.ok(existsSync(mcpPath), '.kiro/mcp.json should be created');

      const mcpContent = readFileSync(mcpPath, 'utf-8');
      const parsed = JSON.parse(mcpContent);
      assert.ok(parsed.mcpServers, 'Should have mcpServers');

      // Check steering rules
      const steeringPath = join(testDir, '.kiro', 'steering', 'project.md');
      assert.ok(existsSync(steeringPath), '.kiro/steering/project.md should be created');

      const steeringContent = readFileSync(steeringPath, 'utf-8');
      assert.ok(steeringContent.includes('Kiro'), 'Should reference Kiro');
    } finally {
      process.chdir(originalCwd);
      process.exit = originalExit;
      console.log = originalLog;
    }
  });

  test('generates Continue.dev configuration', async () => {
    writeFileSync(
      join(testDir, 'CLAUDE.md'),
      '# Project\n\n## Overview\n\nTest\n\n## Tech Stack\n\n- JavaScript'
    );

    const { generateCommand } = await import('../src/commands/generate.js');

    const originalCwd = process.cwd();
    const originalExit = process.exit;
    const originalLog = console.log;

    try {
      process.chdir(testDir);
      process.exit = () => {};
      console.log = () => {};

      await generateCommand({ tools: 'continue', force: true });

      // Check config.yaml
      const configPath = join(testDir, '.continue', 'config.yaml');
      assert.ok(existsSync(configPath), '.continue/config.yaml should be created');

      const configContent = readFileSync(configPath, 'utf-8');
      assert.ok(configContent.includes('Continue.dev'), 'Should reference Continue.dev');
      assert.ok(configContent.includes('contextProviders'), 'Should have context providers');

      // Check rules
      const rulesPath = join(testDir, '.continue', 'rules', 'project.md');
      assert.ok(existsSync(rulesPath), '.continue/rules/project.md should be created');
    } finally {
      process.chdir(originalCwd);
      process.exit = originalExit;
      console.log = originalLog;
    }
  });

  test('generates Augment Code configuration', async () => {
    writeFileSync(
      join(testDir, 'CLAUDE.md'),
      '# Project\n\n## Overview\n\nTest\n\n## Tech Stack\n\n- Go'
    );

    const { generateCommand } = await import('../src/commands/generate.js');

    const originalCwd = process.cwd();
    const originalExit = process.exit;
    const originalLog = console.log;

    try {
      process.chdir(testDir);
      process.exit = () => {};
      console.log = () => {};

      await generateCommand({ tools: 'augment', force: true });

      // Check rules.md
      const rulesPath = join(testDir, '.augment', 'rules.md');
      assert.ok(existsSync(rulesPath), '.augment/rules.md should be created');

      const rulesContent = readFileSync(rulesPath, 'utf-8');
      assert.ok(rulesContent.includes('Augment'), 'Should reference Augment');

      // Check mcp.json
      const mcpPath = join(testDir, '.augment', 'mcp.json');
      assert.ok(existsSync(mcpPath), '.augment/mcp.json should be created');

      const mcpContent = readFileSync(mcpPath, 'utf-8');
      const parsed = JSON.parse(mcpContent);
      assert.ok(parsed.mcpServers, 'Should have mcpServers');
    } finally {
      process.chdir(originalCwd);
      process.exit = originalExit;
      console.log = originalLog;
    }
  });

  test('generates Qodo AI configuration', async () => {
    writeFileSync(
      join(testDir, 'CLAUDE.md'),
      '# Project\n\n## Overview\n\nTest\n\n## Tech Stack\n\n- Rust'
    );

    const { generateCommand } = await import('../src/commands/generate.js');

    const originalCwd = process.cwd();
    const originalExit = process.exit;
    const originalLog = console.log;

    try {
      process.chdir(testDir);
      process.exit = () => {};
      console.log = () => {};

      await generateCommand({ tools: 'qodo', force: true });

      // Check qodo.toml
      const configPath = join(testDir, 'qodo.toml');
      assert.ok(existsSync(configPath), 'qodo.toml should be created');

      const configContent = readFileSync(configPath, 'utf-8');
      assert.ok(configContent.includes('[project]'), 'Should have project section');
      assert.ok(configContent.includes('[agent]'), 'Should have agent section');
      assert.ok(configContent.includes('[security]'), 'Should have security section');

      // Check best_practices.md
      const bestPracticesPath = join(testDir, 'best_practices.md');
      assert.ok(existsSync(bestPracticesPath), 'best_practices.md should be created');

      const bpContent = readFileSync(bestPracticesPath, 'utf-8');
      assert.ok(bpContent.includes('Qodo'), 'Should reference Qodo');
      assert.ok(bpContent.includes('## Security Requirements'), 'Should have security section');
    } finally {
      process.chdir(originalCwd);
      process.exit = originalExit;
      console.log = originalLog;
    }
  });

  test('AGENTS.md includes AAIF attribution', async () => {
    writeFileSync(
      join(testDir, 'CLAUDE.md'),
      '# Project\n\n## Overview\n\nTest\n\n## Tech Stack\n\n- TypeScript'
    );

    const { generateCommand } = await import('../src/commands/generate.js');

    const originalCwd = process.cwd();
    const originalExit = process.exit;
    const originalLog = console.log;

    try {
      process.chdir(testDir);
      process.exit = () => {};
      console.log = () => {};

      await generateCommand({ tools: 'agents', force: true });

      const agentsPath = join(testDir, 'AGENTS.md');
      const content = readFileSync(agentsPath, 'utf-8');

      assert.ok(content.includes('AAIF'), 'Should include AAIF reference');
      assert.ok(
        content.includes('Agentic AI Foundation') || content.includes('Linux Foundation'),
        'Should mention governance'
      );
    } finally {
      process.chdir(originalCwd);
      process.exit = originalExit;
      console.log = originalLog;
    }
  });
});

describe('additional tool generators', () => {
  test('SUPPORTED_TOOLS includes all additional tools', async () => {
    const { SUPPORTED_TOOLS } = await import('../src/commands/generate.js');

    // Additional tools
    assert.ok(SUPPORTED_TOOLS.includes('opencode'), 'Should support OpenCode AI');
    assert.ok(SUPPORTED_TOOLS.includes('zencoder'), 'Should support Zencoder');
    assert.ok(SUPPORTED_TOOLS.includes('tabnine'), 'Should support Tabnine');
    assert.ok(SUPPORTED_TOOLS.includes('amazonq'), 'Should support Amazon Q Developer');

    // Total count check (24 tools + 'all' = 25)
    assert.strictEqual(SUPPORTED_TOOLS.length, 25, 'Should have 25 entries (24 tools + all)');
  });

  test('generates OpenCode AI configuration', async () => {
    writeFileSync(
      join(testDir, 'CLAUDE.md'),
      '# Project\n\n## Overview\n\nTest project\n\n## Tech Stack\n\n- TypeScript'
    );

    const { generateCommand } = await import('../src/commands/generate.js');

    const originalCwd = process.cwd();
    const originalExit = process.exit;
    const originalLog = console.log;

    try {
      process.chdir(testDir);
      process.exit = () => {};
      console.log = () => {};

      await generateCommand({ tools: 'opencode', force: true });

      // Check opencode.json
      const configPath = join(testDir, 'opencode.json');
      assert.ok(existsSync(configPath), 'opencode.json should be created');

      const configContent = readFileSync(configPath, 'utf-8');
      const parsed = JSON.parse(configContent);
      assert.ok(parsed.$schema, 'Should have $schema');
      assert.ok(parsed.model, 'Should have model configuration');
      assert.ok(parsed.tools, 'Should have tools configuration');
      assert.ok(parsed.agents, 'Should reference agents directory');
      assert.ok(parsed.instructions, 'Should reference instructions file');

      // Check agents directory
      const agentPath = join(testDir, '.opencode', 'agents', 'project.md');
      assert.ok(existsSync(agentPath), '.opencode/agents/project.md should be created');

      const agentContent = readFileSync(agentPath, 'utf-8');
      assert.ok(agentContent.includes('---'), 'Should have YAML frontmatter');
      assert.ok(agentContent.includes('name:'), 'Should have agent name');

      // Check instructions
      const instructionsPath = join(testDir, '.opencode', 'instructions.md');
      assert.ok(existsSync(instructionsPath), '.opencode/instructions.md should be created');

      const instructionsContent = readFileSync(instructionsPath, 'utf-8');
      assert.ok(instructionsContent.includes('OpenCode'), 'Should reference OpenCode');
    } finally {
      process.chdir(originalCwd);
      process.exit = originalExit;
      console.log = originalLog;
    }
  });

  test('generates Zencoder configuration (Zen Rules)', async () => {
    writeFileSync(
      join(testDir, 'CLAUDE.md'),
      '# Project\n\n## Overview\n\nTest project\n\n## Tech Stack\n\n- JavaScript'
    );

    const { generateCommand } = await import('../src/commands/generate.js');

    const originalCwd = process.cwd();
    const originalExit = process.exit;
    const originalLog = console.log;

    try {
      process.chdir(testDir);
      process.exit = () => {};
      console.log = () => {};

      await generateCommand({ tools: 'zencoder', force: true });

      // Check zencoder.json
      const configPath = join(testDir, '.zencoder', 'zencoder.json');
      assert.ok(existsSync(configPath), '.zencoder/zencoder.json should be created');

      const configContent = readFileSync(configPath, 'utf-8');
      const parsed = JSON.parse(configContent);
      assert.ok(parsed.rules, 'Should have rules configuration');
      assert.ok(parsed.codebase, 'Should have codebase configuration');
      assert.ok(parsed.commands, 'Should have commands configuration');
      assert.ok(parsed.security, 'Should have security configuration');

      // Check project rules with YAML frontmatter
      const projectRulesPath = join(testDir, '.zencoder', 'rules', 'project.md');
      assert.ok(existsSync(projectRulesPath), '.zencoder/rules/project.md should be created');

      const projectContent = readFileSync(projectRulesPath, 'utf-8');
      assert.ok(projectContent.startsWith('---'), 'Should have YAML frontmatter');
      assert.ok(projectContent.includes('globs:'), 'Should have globs in frontmatter');
      assert.ok(projectContent.includes('alwaysApply:'), 'Should have alwaysApply in frontmatter');

      // Check security rules
      const securityRulesPath = join(testDir, '.zencoder', 'rules', 'security.md');
      assert.ok(existsSync(securityRulesPath), '.zencoder/rules/security.md should be created');

      const securityContent = readFileSync(securityRulesPath, 'utf-8');
      assert.ok(securityContent.includes('OWASP'), 'Should mention OWASP');
      assert.ok(securityContent.includes('priority:'), 'Should have priority in frontmatter');

      // Check testing rules
      const testingRulesPath = join(testDir, '.zencoder', 'rules', 'testing.md');
      assert.ok(existsSync(testingRulesPath), '.zencoder/rules/testing.md should be created');

      const testingContent = readFileSync(testingRulesPath, 'utf-8');
      assert.ok(testingContent.includes('Test Coverage'), 'Should have test coverage section');
    } finally {
      process.chdir(originalCwd);
      process.exit = originalExit;
      console.log = originalLog;
    }
  });

  test('generates all tools', async () => {
    writeFileSync(
      join(testDir, 'CLAUDE.md'),
      '# Project\n\n## Overview\n\nTest\n\n## Tech Stack\n\n- TypeScript\n- Node.js'
    );

    const { generateCommand } = await import('../src/commands/generate.js');

    const originalCwd = process.cwd();
    const originalExit = process.exit;
    const originalLog = console.log;

    try {
      process.chdir(testDir);
      process.exit = () => {};
      console.log = () => {};

      await generateCommand({ tools: 'opencode,zencoder', force: true });

      // Verify both were created
      assert.ok(existsSync(join(testDir, 'opencode.json')), 'opencode.json should exist');
      assert.ok(
        existsSync(join(testDir, '.zencoder', 'zencoder.json')),
        '.zencoder/zencoder.json should exist'
      );
    } finally {
      process.chdir(originalCwd);
      process.exit = originalExit;
      console.log = originalLog;
    }
  });

  test('generates Tabnine configuration', async () => {
    writeFileSync(
      join(testDir, 'CLAUDE.md'),
      '# Project\n\n## Overview\n\nTest project\n\n## Tech Stack\n\n- Python'
    );

    const { generateCommand } = await import('../src/commands/generate.js');

    const originalCwd = process.cwd();
    const originalExit = process.exit;
    const originalLog = console.log;

    try {
      process.chdir(testDir);
      process.exit = () => {};
      console.log = () => {};

      await generateCommand({ tools: 'tabnine', force: true });

      // Check guidelines directory
      const guidelinesDir = join(testDir, '.tabnine', 'guidelines');
      assert.ok(existsSync(guidelinesDir), '.tabnine/guidelines should be created');

      // Check project.md
      const projectPath = join(guidelinesDir, 'project.md');
      assert.ok(existsSync(projectPath), '.tabnine/guidelines/project.md should be created');

      const projectContent = readFileSync(projectPath, 'utf-8');
      assert.ok(projectContent.includes('Project Guidelines'), 'Should have project guidelines header');
      assert.ok(projectContent.includes('Tabnine'), 'Should reference Tabnine');

      // Check coding-standards.md
      const codingPath = join(guidelinesDir, 'coding-standards.md');
      assert.ok(existsSync(codingPath), '.tabnine/guidelines/coding-standards.md should be created');

      // Check security.md
      const securityPath = join(guidelinesDir, 'security.md');
      assert.ok(existsSync(securityPath), '.tabnine/guidelines/security.md should be created');

      const securityContent = readFileSync(securityPath, 'utf-8');
      assert.ok(securityContent.includes('Security Guidelines'), 'Should have security header');
    } finally {
      process.chdir(originalCwd);
      process.exit = originalExit;
      console.log = originalLog;
    }
  });

  test('generates Amazon Q Developer configuration', async () => {
    writeFileSync(
      join(testDir, 'CLAUDE.md'),
      '# Project\n\n## Overview\n\nTest project\n\n## Tech Stack\n\n- Java'
    );

    const { generateCommand } = await import('../src/commands/generate.js');

    const originalCwd = process.cwd();
    const originalExit = process.exit;
    const originalLog = console.log;

    try {
      process.chdir(testDir);
      process.exit = () => {};
      console.log = () => {};

      await generateCommand({ tools: 'amazonq', force: true });

      // Check rules directory
      const rulesDir = join(testDir, '.amazonq', 'rules');
      assert.ok(existsSync(rulesDir), '.amazonq/rules should be created');

      // Check project-rules.md
      const projectPath = join(rulesDir, 'project-rules.md');
      assert.ok(existsSync(projectPath), '.amazonq/rules/project-rules.md should be created');

      const projectContent = readFileSync(projectPath, 'utf-8');
      assert.ok(projectContent.includes('Amazon Q Developer'), 'Should reference Amazon Q Developer');
      assert.ok(projectContent.includes('Project Rules'), 'Should have project rules header');

      // Check coding-rules.md
      const codingPath = join(rulesDir, 'coding-rules.md');
      assert.ok(existsSync(codingPath), '.amazonq/rules/coding-rules.md should be created');

      // Check security-rules.md
      const securityPath = join(rulesDir, 'security-rules.md');
      assert.ok(existsSync(securityPath), '.amazonq/rules/security-rules.md should be created');

      const securityContent = readFileSync(securityPath, 'utf-8');
      assert.ok(securityContent.includes('AWS-Specific Security'), 'Should have AWS security section');
      assert.ok(securityContent.includes('IAM'), 'Should mention IAM');
    } finally {
      process.chdir(originalCwd);
      process.exit = originalExit;
      console.log = originalLog;
    }
  });
});
