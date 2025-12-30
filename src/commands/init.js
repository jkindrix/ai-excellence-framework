/**
 * AI Excellence Framework - Init Command
 *
 * Initializes the framework in a project directory.
 */

import { existsSync, mkdirSync, writeFileSync, readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import chalk from 'chalk';
import ora from 'ora';
import enquirer from 'enquirer';
import fse from 'fs-extra';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PACKAGE_ROOT = join(__dirname, '..', '..');

// Preset configurations
const PRESETS = {
  minimal: {
    name: 'Minimal',
    description: 'CLAUDE.md + essential commands only',
    components: {
      claudeMd: true,
      commands: ['plan', 'verify'],
      agents: [],
      hooks: false,
      mcp: false,
      preCommit: false,
      templates: false,
      metrics: false
    }
  },
  standard: {
    name: 'Standard',
    description: 'Recommended setup for individual developers',
    components: {
      claudeMd: true,
      commands: [
        'plan',
        'verify',
        'handoff',
        'assumptions',
        'review',
        'security-review'
      ],
      agents: ['reviewer', 'explorer', 'tester'],
      hooks: true,
      mcp: false,
      preCommit: true,
      templates: true,
      metrics: false
    }
  },
  full: {
    name: 'Full',
    description: 'Complete setup with MCP server and metrics',
    components: {
      claudeMd: true,
      commands: [
        'plan',
        'verify',
        'handoff',
        'assumptions',
        'review',
        'security-review'
      ],
      agents: ['reviewer', 'explorer', 'tester'],
      hooks: true,
      mcp: true,
      preCommit: true,
      templates: true,
      metrics: true
    }
  },
  team: {
    name: 'Team',
    description: 'Full setup with team collaboration features',
    components: {
      claudeMd: true,
      commands: [
        'plan',
        'verify',
        'handoff',
        'assumptions',
        'review',
        'security-review'
      ],
      agents: ['reviewer', 'explorer', 'tester'],
      hooks: true,
      mcp: true,
      preCommit: true,
      templates: true,
      metrics: true,
      teamFeatures: true
    }
  }
};

/**
 * Main init command handler
 */
export async function initCommand(options) {
  const cwd = process.cwd();

  console.log(chalk.cyan('\n  AI Excellence Framework Installer\n'));

  // Dry run mode
  if (options.dryRun) {
    console.log(
      chalk.yellow('  Running in dry-run mode. No files will be created.\n')
    );
  }

  // Get configuration
  let config;
  if (options.yes) {
    config = PRESETS[options.preset];
    console.log(chalk.gray(`  Using preset: ${config.name}\n`));
  } else {
    config = await promptConfiguration(options.preset);
  }

  // Check for existing installation
  const existingFiles = checkExistingFiles(cwd);
  if (existingFiles.length > 0 && !options.force) {
    console.log(
      chalk.yellow('\n  Existing AI Excellence Framework files detected:')
    );
    existingFiles.forEach(f => console.log(chalk.gray(`    - ${f}`)));

    if (!options.yes) {
      const { proceed } = await enquirer.prompt({
        type: 'confirm',
        name: 'proceed',
        message: 'Overwrite existing files?',
        initial: false
      });

      if (!proceed) {
        console.log(chalk.gray('\n  Installation cancelled.\n'));
        return;
      }
    } else {
      console.log(chalk.gray('\n  Use --force to overwrite.\n'));
      return;
    }
  }

  // Install components
  const spinner = ora('Installing AI Excellence Framework...').start();

  try {
    const results = {
      created: [],
      skipped: [],
      errors: []
    };

    // 1. Create directory structure
    spinner.text = 'Creating directory structure...';
    await createDirectories(cwd, config, options.dryRun, results);

    // 2. Install CLAUDE.md
    if (config.components.claudeMd) {
      spinner.text = 'Creating CLAUDE.md...';
      await installClaudeMd(cwd, options.dryRun, results);
    }

    // 3. Install slash commands
    if (config.components.commands.length > 0) {
      spinner.text = 'Installing slash commands...';
      await installCommands(
        cwd,
        config.components.commands,
        options.dryRun,
        results
      );
    }

    // 4. Install subagents
    if (config.components.agents.length > 0) {
      spinner.text = 'Installing subagents...';
      await installAgents(
        cwd,
        config.components.agents,
        options.dryRun,
        results
      );
    }

    // 5. Install hooks
    if (config.components.hooks && options.hooks !== false) {
      spinner.text = 'Installing hook scripts...';
      await installHooks(cwd, options.dryRun, results);
    }

    // 6. Install pre-commit config
    if (config.components.preCommit) {
      spinner.text = 'Installing pre-commit configuration...';
      await installPreCommit(cwd, options.dryRun, results);
    }

    // 7. Install MCP server
    if (config.components.mcp && options.mcp !== false) {
      spinner.text = 'Installing MCP server...';
      await installMcp(cwd, options.dryRun, results);
    }

    // 8. Install templates
    if (config.components.templates) {
      spinner.text = 'Installing templates...';
      await installTemplates(cwd, options.dryRun, results);
    }

    // 9. Install metrics
    if (config.components.metrics) {
      spinner.text = 'Installing metrics collection...';
      await installMetrics(cwd, options.dryRun, results);
    }

    // 10. Update .gitignore
    spinner.text = 'Updating .gitignore...';
    await updateGitignore(cwd, options.dryRun, results);

    spinner.succeed('AI Excellence Framework installed successfully!');

    // Print results
    printResults(results, options.dryRun);

    // Print next steps
    printNextSteps(config);
  } catch (error) {
    spinner.fail('Installation failed');
    console.error(chalk.red(`\n  Error: ${error.message}\n`));
    if (options.verbose) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

/**
 * Prompt for configuration interactively
 */
async function promptConfiguration(defaultPreset) {
  const { preset } = await enquirer.prompt({
    type: 'select',
    name: 'preset',
    message: 'Select a configuration preset:',
    choices: Object.entries(PRESETS).map(([key, value]) => ({
      name: key,
      message: `${value.name} - ${value.description}`,
      value: key
    })),
    initial: defaultPreset
  });

  return PRESETS[preset];
}

/**
 * Check for existing framework files
 */
function checkExistingFiles(cwd) {
  const filesToCheck = [
    'CLAUDE.md',
    '.claude/commands/plan.md',
    '.claude/commands/verify.md',
    '.pre-commit-config.yaml'
  ];

  return filesToCheck.filter(f => existsSync(join(cwd, f)));
}

/**
 * Create directory structure
 */
async function createDirectories(cwd, config, dryRun, results) {
  const dirs = [
    '.claude/commands',
    '.claude/agents',
    'docs/session-notes',
    'docs/decisions',
    '.tmp/scratch',
    '.tmp/investigation',
    '.tmp/staging'
  ];

  if (config.components.hooks) {
    dirs.push('scripts/hooks');
  }

  if (config.components.mcp) {
    dirs.push('scripts/mcp');
  }

  if (config.components.metrics) {
    dirs.push('scripts/metrics');
  }

  for (const dir of dirs) {
    const fullPath = join(cwd, dir);
    if (!existsSync(fullPath)) {
      if (!dryRun) {
        mkdirSync(fullPath, { recursive: true });
      }
      results.created.push(`${dir}/`);
    }
  }
}

/**
 * Install CLAUDE.md template
 */
async function installClaudeMd(cwd, dryRun, results) {
  const targetPath = join(cwd, 'CLAUDE.md');
  const templatePath = join(PACKAGE_ROOT, 'templates', 'CLAUDE.md.template');

  // Check if template exists, otherwise use embedded template
  let content;
  if (existsSync(templatePath)) {
    content = readFileSync(templatePath, 'utf-8');
  } else {
    content = generateClaudeMdTemplate();
  }

  // Replace placeholders
  const projectName = dirname(cwd).split('/').pop() || 'Project';
  content = content.replace(/\[PROJECT_NAME\]/g, projectName);
  content = content.replace(
    /\[DATE\]/g,
    new Date().toISOString().split('T')[0]
  );

  if (!dryRun) {
    writeFileSync(targetPath, content);
  }
  results.created.push('CLAUDE.md');
}

/**
 * Generate CLAUDE.md template inline
 */
function generateClaudeMdTemplate() {
  return `# Project: [PROJECT_NAME]

## Overview
[One paragraph describing what this project does and its purpose]

## Tech Stack
- Language: [e.g., TypeScript 5.3]
- Runtime: [e.g., Node.js 20.x]
- Framework: [e.g., Next.js 14]
- Database: [e.g., PostgreSQL 15]
- Key Dependencies: [list critical deps with versions]

## Architecture

### Directory Structure
\`\`\`
src/
├── api/          # API routes and handlers
├── components/   # UI components
├── lib/          # Shared utilities
├── services/     # Business logic
└── types/        # Type definitions
\`\`\`

### Key Entry Points
- API: \`src/api/index.ts\`
- Main: \`src/index.ts\`

## Conventions

### Code Style
- [Naming conventions]
- [File organization rules]
- [Import ordering]

### Commit Messages
- Use conventional commits: feat|fix|docs|refactor|test|chore
- Include ticket number when applicable

### Testing
- Unit tests: \`npm test\`
- Integration: \`npm run test:integration\`

## Common Commands
\`\`\`bash
npm run dev      # Start development server
npm run build    # Production build
npm test         # Run tests
npm run lint     # Run linter
\`\`\`

## Current State

### Active Work
- [Current feature/task being developed]

### Known Issues
- [List known bugs or technical debt]

### Recent Decisions
- [DATE]: [Decision and rationale]

## Session Instructions

### Before Starting
1. Read this file completely
2. Check \`docs/session-notes/\` for recent context
3. Run tests to verify baseline

### During Work
- Use \`/plan\` before implementing anything significant
- Use \`/assumptions\` to surface hidden assumptions
- Use \`/verify\` before marking tasks complete
- Track assumptions explicitly using TodoWrite

### Before Ending
- Run \`/handoff\` to capture session state
- Update "Current State" section above
- Commit work in progress

### Security Checklist (for AI-generated code)
Before committing, verify:
- [ ] No hardcoded secrets or credentials
- [ ] Input validation present where needed
- [ ] No SQL/command/XSS injection vulnerabilities
- [ ] Dependencies exist (not hallucinated names)
- [ ] Error handling doesn't expose internal details
`;
}

/**
 * Install slash commands
 */
async function installCommands(cwd, commands, dryRun, results) {
  const commandsDir = join(cwd, '.claude', 'commands');

  for (const cmd of commands) {
    const sourcePath = join(PACKAGE_ROOT, '.claude', 'commands', `${cmd}.md`);
    const targetPath = join(commandsDir, `${cmd}.md`);

    if (existsSync(sourcePath)) {
      if (!dryRun) {
        fse.copySync(sourcePath, targetPath);
      }
      results.created.push(`.claude/commands/${cmd}.md`);
    } else {
      results.skipped.push(`.claude/commands/${cmd}.md (source not found)`);
    }
  }
}

/**
 * Install subagents
 */
async function installAgents(cwd, agents, dryRun, results) {
  const agentsDir = join(cwd, '.claude', 'agents');

  for (const agent of agents) {
    const sourcePath = join(PACKAGE_ROOT, '.claude', 'agents', `${agent}.md`);
    const targetPath = join(agentsDir, `${agent}.md`);

    if (existsSync(sourcePath)) {
      if (!dryRun) {
        fse.copySync(sourcePath, targetPath);
      }
      results.created.push(`.claude/agents/${agent}.md`);
    } else {
      results.skipped.push(`.claude/agents/${agent}.md (source not found)`);
    }
  }
}

/**
 * Install hook scripts
 */
async function installHooks(cwd, dryRun, results) {
  const hooksDir = join(cwd, 'scripts', 'hooks');
  const sourceDir = join(PACKAGE_ROOT, 'scripts', 'hooks');

  const hooks = [
    'post-edit.sh',
    'verify-deps.sh',
    'check-todos.sh',
    'check-claude-md.sh'
  ];

  for (const hook of hooks) {
    const sourcePath = join(sourceDir, hook);
    const targetPath = join(hooksDir, hook);

    if (existsSync(sourcePath)) {
      if (!dryRun) {
        fse.copySync(sourcePath, targetPath);
        // Make executable
        const { chmod } = await import('fs/promises');
        await chmod(targetPath, 0o755);
      }
      results.created.push(`scripts/hooks/${hook}`);
    }
  }
}

/**
 * Install pre-commit configuration
 */
async function installPreCommit(cwd, dryRun, results) {
  const sourcePath = join(PACKAGE_ROOT, 'templates', '.pre-commit-config.yaml');
  const targetPath = join(cwd, '.pre-commit-config.yaml');

  if (existsSync(sourcePath)) {
    if (!dryRun) {
      fse.copySync(sourcePath, targetPath);
    }
    results.created.push('.pre-commit-config.yaml');
  }
}

/**
 * Install MCP server
 */
async function installMcp(cwd, dryRun, results) {
  const mcpDir = join(cwd, 'scripts', 'mcp');
  const sourcePath = join(
    PACKAGE_ROOT,
    'scripts',
    'mcp',
    'project-memory-server.py'
  );
  const targetPath = join(mcpDir, 'project-memory-server.py');

  if (existsSync(sourcePath)) {
    if (!dryRun) {
      fse.copySync(sourcePath, targetPath);
    }
    results.created.push('scripts/mcp/project-memory-server.py');
  }

  // Create requirements.txt for MCP
  const requirementsPath = join(mcpDir, 'requirements.txt');
  if (!dryRun) {
    writeFileSync(requirementsPath, 'mcp>=1.0.0\n');
  }
  results.created.push('scripts/mcp/requirements.txt');
}

/**
 * Install templates
 */
async function installTemplates(cwd, dryRun, results) {
  const templatesDir = join(cwd, 'templates');
  const sourceDir = join(PACKAGE_ROOT, 'templates');

  if (!existsSync(templatesDir) && !dryRun) {
    mkdirSync(templatesDir, { recursive: true });
  }

  // Copy specific templates
  const templates = ['.pre-commit-config.yaml', 'CLAUDE.md.template'];

  for (const template of templates) {
    const sourcePath = join(sourceDir, template);
    const targetPath = join(templatesDir, template);

    if (existsSync(sourcePath)) {
      if (!dryRun) {
        fse.copySync(sourcePath, targetPath);
      }
      results.created.push(`templates/${template}`);
    }
  }
}

/**
 * Install metrics collection
 */
async function installMetrics(cwd, dryRun, results) {
  const metricsDir = join(cwd, 'scripts', 'metrics');
  const sourcePath = join(
    PACKAGE_ROOT,
    'scripts',
    'metrics',
    'collect-session-metrics.sh'
  );
  const targetPath = join(metricsDir, 'collect-session-metrics.sh');

  if (existsSync(sourcePath)) {
    if (!dryRun) {
      fse.copySync(sourcePath, targetPath);
      const { chmod } = await import('fs/promises');
      await chmod(targetPath, 0o755);
    }
    results.created.push('scripts/metrics/collect-session-metrics.sh');
  }
}

/**
 * Update .gitignore with framework entries
 */
async function updateGitignore(cwd, dryRun, results) {
  const gitignorePath = join(cwd, '.gitignore');
  const additions = `
# AI Excellence Framework
CLAUDE.local.md
.claude/settings.local.json
docs/session-notes/*.local.md
.tmp/
.secrets.baseline
`;

  if (existsSync(gitignorePath)) {
    const existing = readFileSync(gitignorePath, 'utf-8');
    if (!existing.includes('AI Excellence Framework')) {
      if (!dryRun) {
        writeFileSync(gitignorePath, existing + additions);
      }
      results.created.push('.gitignore (updated)');
    }
  } else {
    if (!dryRun) {
      writeFileSync(gitignorePath, `${additions.trim()}\n`);
    }
    results.created.push('.gitignore');
  }
}

/**
 * Print installation results
 */
function printResults(results, dryRun) {
  console.log('');

  if (results.created.length > 0) {
    console.log(
      chalk.green(
        `  ${dryRun ? 'Would create' : 'Created'} ${results.created.length} files:`
      )
    );
    results.created.forEach(f => console.log(chalk.gray(`    ✓ ${f}`)));
  }

  if (results.skipped.length > 0) {
    console.log(chalk.yellow(`\n  Skipped ${results.skipped.length} files:`));
    results.skipped.forEach(f => console.log(chalk.gray(`    - ${f}`)));
  }

  if (results.errors.length > 0) {
    console.log(chalk.red('\n  Errors:'));
    results.errors.forEach(e => console.log(chalk.red(`    ✗ ${e}`)));
  }
}

/**
 * Print next steps after installation
 */
function printNextSteps(config) {
  console.log(chalk.cyan('\n  Next Steps:\n'));
  console.log(chalk.white('  1. Edit CLAUDE.md to describe your project'));
  console.log(chalk.white('  2. Run "claude" and try "/plan [your task]"'));

  if (config.components.preCommit) {
    console.log(
      chalk.white('  3. Run "pip install pre-commit && pre-commit install"')
    );
  }

  if (config.components.mcp) {
    console.log(
      chalk.white(
        '  4. Set up MCP server: pip install -r scripts/mcp/requirements.txt'
      )
    );
  }

  console.log(
    chalk.gray(
      '\n  Documentation: https://github.com/ai-excellence-framework/ai-excellence-framework'
    )
  );
  console.log(chalk.gray('  Quick Reference: npx ai-excellence-framework --help'));
  console.log('');
}
