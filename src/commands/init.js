/**
 * AI Excellence Framework - Init Command
 *
 * Initializes the framework in a project directory.
 */

import { existsSync } from 'fs';
import { readFile, writeFile, mkdir, chmod } from 'fs/promises';
import { join, dirname, basename } from 'path';
import { fileURLToPath } from 'url';
import chalk from 'chalk';
import ora from 'ora';
import enquirer from 'enquirer';
import fse from 'fs-extra';
import { createError, FrameworkError } from '../errors.js';
import { PRESET_CONFIGS } from '../index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PACKAGE_ROOT = join(__dirname, '..', '..');

/**
 * Convert the shared PRESET_CONFIGS format to init command format.
 * This ensures preset definitions are centralized in index.js while
 * providing the component structure needed by the init command.
 *
 * @param {string} presetName - Name of the preset
 * @param {Object} preset - Preset configuration from PRESET_CONFIGS
 * @returns {Object} Init command format preset
 */
function convertPresetFormat(presetName, preset) {
  return {
    name: presetName.charAt(0).toUpperCase() + presetName.slice(1),
    description: preset.description,
    components: {
      claudeMd: true,
      commands: preset.commands || [],
      agents: preset.agents || [],
      hooks: preset.hooks || false,
      mcp: preset.mcp || false,
      preCommit: preset.preCommit || false,
      templates: preset.preCommit || false, // Templates go with preCommit
      metrics: preset.metrics?.enabled || false,
      teamFeatures: preset.federation || false
    }
  };
}

// Build PRESETS from the centralized PRESET_CONFIGS
// This eliminates duplication and ensures consistency
const PRESETS = Object.fromEntries(
  Object.entries(PRESET_CONFIGS).map(([name, config]) => [name, convertPresetFormat(name, config)])
);

/**
 * Main init command handler
 *
 * @param {object} options - Command options
 * @param {string} [options.preset='standard'] - Preset configuration to use
 * @param {boolean} [options.yes=false] - Skip prompts and use defaults
 * @param {boolean} [options.force=false] - Overwrite existing files
 * @param {boolean} [options.dryRun=false] - Show what would be created without creating
 * @param {boolean} [options.verbose=false] - Show detailed output
 * @param {boolean} [options.json=false] - Output results as JSON
 * @returns {Promise<void>} Resolves when initialization is complete
 * @throws {FrameworkError} If initialization fails
 */
export async function initCommand(options) {
  const cwd = process.cwd();
  const jsonOutput = options.json === true;

  // Helper to log only when not in JSON mode
  const log = (...args) => {
    if (!jsonOutput) {
      console.log(...args);
    }
  };

  log(chalk.cyan('\n  AI Excellence Framework Installer\n'));

  // Dry run mode
  if (options.dryRun) {
    log(chalk.yellow('  Running in dry-run mode. No files will be created.\n'));
  }

  // Get configuration
  let config;
  if (options.yes || jsonOutput) {
    config = PRESETS[options.preset];
    log(chalk.gray(`  Using preset: ${config.name}\n`));
  } else {
    config = await promptConfiguration(options.preset);
  }

  // Check for existing installation
  const existingFiles = checkExistingFiles(cwd);
  if (existingFiles.length > 0 && !options.force) {
    log(chalk.yellow('\n  Existing AI Excellence Framework files detected:'));
    existingFiles.forEach(f => log(chalk.gray(`    - ${f}`)));

    if (!options.yes && !jsonOutput) {
      const { proceed } = await enquirer.prompt({
        type: 'confirm',
        name: 'proceed',
        message: 'Overwrite existing files?',
        initial: false
      });

      if (!proceed) {
        log(chalk.gray('\n  Installation cancelled.\n'));
        if (jsonOutput) {
          console.log(JSON.stringify({ success: false, cancelled: true, existingFiles }, null, 2));
        }
        return;
      }
    } else if (!options.force) {
      log(chalk.gray('\n  Use --force to overwrite.\n'));
      if (jsonOutput) {
        console.log(JSON.stringify({ success: false, existingFiles, error: 'Use --force to overwrite' }, null, 2));
      }
      return;
    }
  }

  // Install components
  // Disable spinner in JSON mode for clean output
  const spinner = jsonOutput
    ? { text: '', start: () => spinner, succeed: () => {}, fail: () => {} }
    : ora('Installing AI Excellence Framework...').start();

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
      await installCommands(cwd, config.components.commands, options.dryRun, results);
    }

    // 4. Install subagents
    if (config.components.agents.length > 0) {
      spinner.text = 'Installing subagents...';
      await installAgents(cwd, config.components.agents, options.dryRun, results);
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

    // Output results
    if (jsonOutput) {
      console.log(
        JSON.stringify(
          {
            success: true,
            dryRun: options.dryRun,
            preset: options.preset,
            results
          },
          null,
          2
        )
      );
    } else {
      printResults(results, options.dryRun);
      printNextSteps(config);
    }
  } catch (error) {
    spinner.fail('Installation failed');

    // Output JSON error if in JSON mode
    if (jsonOutput) {
      const errObj = error instanceof FrameworkError ? error.toJSON() : { message: error.message };
      console.log(JSON.stringify({ success: false, error: errObj }, null, 2));
    }

    // Re-throw if already a FrameworkError
    if (error instanceof FrameworkError) {
      throw error;
    }

    // Wrap in FrameworkError and throw (CLI will handle exit code)
    throw createError('AIX-INIT-100', error.message, {
      cause: error,
      context: { preset: config?.name, cwd }
    });
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
        await mkdir(fullPath, { recursive: true });
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
    content = await readFile(templatePath, 'utf-8');
  } else {
    content = generateClaudeMdTemplate();
  }

  // Replace placeholders
  const projectName = basename(cwd) || 'Project';
  content = content.replace(/\[PROJECT_NAME\]/g, projectName);
  content = content.replace(/\[DATE\]/g, new Date().toISOString().split('T')[0]);

  if (!dryRun) {
    await writeFile(targetPath, content);
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
        await fse.copy(sourcePath, targetPath);
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
        await fse.copy(sourcePath, targetPath);
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

  const hooks = ['post-edit.sh', 'verify-deps.sh', 'check-todos.sh', 'check-claude-md.sh'];

  for (const hook of hooks) {
    const sourcePath = join(sourceDir, hook);
    const targetPath = join(hooksDir, hook);

    if (existsSync(sourcePath)) {
      if (!dryRun) {
        await fse.copy(sourcePath, targetPath);
        // Make executable
        await chmod(targetPath, 0o755);
      }
      results.created.push(`scripts/hooks/${hook}`);
    }
  }
}

/**
 * Validate basic YAML structure without a full parser.
 * Checks for common issues that would cause pre-commit to fail.
 *
 * @param {string} content - YAML file content
 * @returns {{valid: boolean, errors: string[]}}
 */
function validateBasicYaml(content) {
  const errors = [];

  // Check for tabs (YAML requires spaces)
  if (content.includes('\t')) {
    errors.push('YAML file contains tabs (use spaces for indentation)');
  }

  // Check for required pre-commit config keys
  if (!content.includes('repos:')) {
    errors.push('Missing required "repos:" key in pre-commit config');
  }

  // Check for consistent indentation (basic check)
  const lines = content.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // Check for odd indentation that would break YAML
    const leadingSpaces = line.match(/^( *)/)?.[1]?.length || 0;
    if (leadingSpaces % 2 !== 0 && !line.trim().startsWith('#')) {
      errors.push(`Line ${i + 1}: Odd indentation (${leadingSpaces} spaces) may cause YAML parsing issues`);
      break; // Only report first occurrence
    }
  }

  // Check for empty file
  if (content.trim().length === 0) {
    errors.push('YAML file is empty');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Install pre-commit configuration
 */
async function installPreCommit(cwd, dryRun, results) {
  const sourcePath = join(PACKAGE_ROOT, 'templates', '.pre-commit-config.yaml');
  const targetPath = join(cwd, '.pre-commit-config.yaml');

  if (existsSync(sourcePath)) {
    // Validate template before copying
    const content = await readFile(sourcePath, 'utf-8');
    const validation = validateBasicYaml(content);

    if (!validation.valid) {
      console.warn(
        `Warning: Pre-commit template has potential issues:\n${validation.errors.map(e => `  - ${e}`).join('\n')}`
      );
      // Still proceed with copy but warn the user
    }

    if (!dryRun) {
      await fse.copy(sourcePath, targetPath);
    }
    results.created.push('.pre-commit-config.yaml');
  }
}

/**
 * Install MCP server
 */
async function installMcp(cwd, dryRun, results) {
  const mcpDir = join(cwd, 'scripts', 'mcp');
  const sourcePath = join(PACKAGE_ROOT, 'scripts', 'mcp', 'project-memory-server.py');
  const targetPath = join(mcpDir, 'project-memory-server.py');

  if (existsSync(sourcePath)) {
    if (!dryRun) {
      await fse.copy(sourcePath, targetPath);
    }
    results.created.push('scripts/mcp/project-memory-server.py');
  }

  // Create requirements.txt for MCP
  const requirementsPath = join(mcpDir, 'requirements.txt');
  if (!dryRun) {
    await writeFile(requirementsPath, 'mcp>=1.0.0\n');
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
    await mkdir(templatesDir, { recursive: true });
  }

  // Copy specific templates
  const templates = ['.pre-commit-config.yaml', 'CLAUDE.md.template'];

  for (const template of templates) {
    const sourcePath = join(sourceDir, template);
    const targetPath = join(templatesDir, template);

    if (existsSync(sourcePath)) {
      if (!dryRun) {
        await fse.copy(sourcePath, targetPath);
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
  const sourcePath = join(PACKAGE_ROOT, 'scripts', 'metrics', 'collect-session-metrics.sh');
  const targetPath = join(metricsDir, 'collect-session-metrics.sh');

  if (existsSync(sourcePath)) {
    if (!dryRun) {
      await fse.copy(sourcePath, targetPath);
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
    const existing = await readFile(gitignorePath, 'utf-8');
    if (!existing.includes('AI Excellence Framework')) {
      if (!dryRun) {
        await writeFile(gitignorePath, existing + additions);
      }
      results.created.push('.gitignore (updated)');
    }
  } else {
    if (!dryRun) {
      await writeFile(gitignorePath, `${additions.trim()}\n`);
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
      chalk.green(`  ${dryRun ? 'Would create' : 'Created'} ${results.created.length} files:`)
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
    console.log(chalk.white('  3. Run "pip install pre-commit && pre-commit install"'));
  }

  if (config.components.mcp) {
    console.log(chalk.white('  4. Set up MCP server: pip install -r scripts/mcp/requirements.txt'));
  }

  console.log(
    chalk.gray(
      '\n  Documentation: https://github.com/ai-excellence-framework/ai-excellence-framework'
    )
  );
  console.log(chalk.gray('  Quick Reference: npx ai-excellence-framework --help'));
  console.log('');
}
