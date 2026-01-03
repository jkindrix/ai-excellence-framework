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
 * Valid preset names for input validation (lazy initialized to avoid circular dependency)
 * @type {ReadonlySet<string>|null}
 */
let _validPresets = null;

/**
 * Get valid preset names (lazy initialization)
 * @returns {ReadonlySet<string>}
 */
function getValidPresets() {
  if (!_validPresets) {
    _validPresets = new Set(Object.keys(PRESET_CONFIGS));
  }
  return _validPresets;
}

/**
 * Sanitize a string for safe inclusion in error messages and logs.
 * Prevents log injection attacks by removing control characters and ANSI escape sequences.
 *
 * @param {string} input - The string to sanitize
 * @param {number} [maxLength=50] - Maximum length of output
 * @returns {string} Sanitized string safe for error messages
 * @private
 */
function sanitizeForError(input, maxLength = 50) {
  if (typeof input !== 'string') {
    return String(input).slice(0, maxLength);
  }

  // Remove control characters (0x00-0x1F, 0x7F) and ANSI escape sequences
  let sanitized = input
    .replace(/[\x00-\x1f\x7f]/g, '') // Remove control characters
    .replace(/\x1b\[[0-9;]*[a-zA-Z]/g, '') // Remove ANSI escape sequences
    .replace(/\x1b\][^\x07]*\x07/g, ''); // Remove OSC sequences

  // Truncate to max length
  if (sanitized.length > maxLength) {
    sanitized = `${sanitized.slice(0, maxLength)}...`;
  }

  return sanitized;
}

/**
 * Sanitize and validate command options to prevent injection and invalid input.
 *
 * Security: This function protects against:
 * - Prototype pollution via __proto__, constructor, prototype keys
 * - Invalid preset names
 * - Type coercion issues
 * - Excessively long string inputs
 *
 * @param {object} options - Raw command options
 * @returns {object} Sanitized options with validated types
 * @throws {FrameworkError} If critical validation fails
 */
function sanitizeOptions(options) {
  // Guard against null/undefined
  if (!options || typeof options !== 'object') {
    return { preset: 'standard', yes: false, force: false, dryRun: false, verbose: false, json: false };
  }

  // Protect against prototype pollution
  // Only check own properties, not inherited ones from the prototype chain
  const dangerousKeys = ['__proto__', 'constructor', 'prototype'];
  for (const key of dangerousKeys) {
    if (Object.hasOwn(options, key)) {
      throw createError('AIX-INIT-110', `Invalid option key: ${key}`);
    }
  }

  // Create sanitized copy using Object.create(null) to avoid prototype chain
  const sanitized = Object.create(null);

  // Validate and sanitize preset
  const presetRaw = options.preset;
  if (presetRaw !== undefined && presetRaw !== null) {
    const presetStr = String(presetRaw).toLowerCase().trim();
    // Limit length and validate characters
    if (presetStr.length > 50 || !/^[a-z][a-z0-9_-]*$/.test(presetStr)) {
      // Use sanitizeForError to prevent log injection via control characters
      throw createError('AIX-INIT-111', `Invalid preset name format: ${sanitizeForError(presetStr)}`);
    }
    sanitized.preset = getValidPresets().has(presetStr) ? presetStr : 'standard';
  } else {
    sanitized.preset = 'standard';
  }

  // Sanitize boolean options (coerce to boolean)
  sanitized.yes = Boolean(options.yes);
  sanitized.force = Boolean(options.force);
  sanitized.dryRun = Boolean(options.dryRun);
  sanitized.verbose = Boolean(options.verbose);
  sanitized.json = Boolean(options.json);

  // Pass through AbortSignal if present (for timeout support)
  if (options._abortSignal instanceof AbortSignal) {
    sanitized._abortSignal = options._abortSignal;
  }

  return sanitized;
}

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

// Build PRESETS from the centralized PRESET_CONFIGS (lazy initialized to avoid circular dependency)
let _presets = null;

/**
 * Get presets object (lazy initialization)
 * @returns {Object}
 */
function getPresets() {
  if (!_presets) {
    _presets = Object.fromEntries(
      Object.entries(PRESET_CONFIGS).map(([name, config]) => [name, convertPresetFormat(name, config)])
    );
  }
  return _presets;
}

/**
 * Main init command handler
 *
 * @param {object} rawOptions - Command options (will be sanitized)
 * @param {string} [rawOptions.preset='standard'] - Preset configuration to use
 * @param {boolean} [rawOptions.yes=false] - Skip prompts and use defaults
 * @param {boolean} [rawOptions.force=false] - Overwrite existing files
 * @param {boolean} [rawOptions.dryRun=false] - Show what would be created without creating
 * @param {boolean} [rawOptions.verbose=false] - Show detailed output
 * @param {boolean} [rawOptions.json=false] - Output results as JSON
 * @param {AbortSignal} [rawOptions._abortSignal] - Signal for cancellation support
 * @returns {Promise<void>} Resolves when initialization is complete
 * @throws {FrameworkError} If initialization fails or input validation fails
 */
export async function initCommand(rawOptions) {
  // Sanitize and validate all input options
  const options = sanitizeOptions(rawOptions);

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
    config = getPresets()[options.preset];
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
 *
 * @param {string} defaultPreset - Default preset to pre-select
 * @returns {Promise<Object>} Selected preset configuration
 * @private
 */
async function promptConfiguration(defaultPreset) {
  const presets = getPresets();
  const { preset } = await enquirer.prompt({
    type: 'select',
    name: 'preset',
    message: 'Select a configuration preset:',
    choices: Object.entries(presets).map(([key, value]) => ({
      name: key,
      message: `${value.name} - ${value.description}`,
      value: key
    })),
    initial: defaultPreset
  });

  return presets[preset];
}

/**
 * Check for existing framework files in the target directory
 *
 * @param {string} cwd - Directory to check
 * @returns {string[]} Array of existing file paths (relative to cwd)
 * @private
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
 * Create directory structure for the framework
 *
 * @param {string} cwd - Target directory
 * @param {Object} config - Preset configuration
 * @param {boolean} dryRun - If true, don't create directories
 * @param {Object} results - Results tracker with created/skipped arrays
 * @returns {Promise<void>}
 * @private
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
 * Install CLAUDE.md template file
 *
 * @param {string} cwd - Target directory
 * @param {boolean} dryRun - If true, don't write files
 * @param {Object} results - Results tracker with created/skipped arrays
 * @returns {Promise<void>}
 * @private
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
 * Generate CLAUDE.md template inline when external template is unavailable
 *
 * @returns {string} CLAUDE.md template content with placeholders
 * @private
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
 * Install slash commands from framework package
 *
 * @param {string} cwd - Target directory
 * @param {string[]} commands - Array of command names to install
 * @param {boolean} dryRun - If true, don't copy files
 * @param {Object} results - Results tracker with created/skipped arrays
 * @returns {Promise<void>}
 * @private
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
 * Install subagent definitions from framework package
 *
 * @param {string} cwd - Target directory
 * @param {string[]} agents - Array of agent names to install
 * @param {boolean} dryRun - If true, don't copy files
 * @param {Object} results - Results tracker with created/skipped arrays
 * @returns {Promise<void>}
 * @private
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
 * Install hook scripts from framework package
 *
 * @param {string} cwd - Target directory
 * @param {boolean} dryRun - If true, don't copy files
 * @param {Object} results - Results tracker with created/skipped arrays
 * @returns {Promise<void>}
 * @private
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
 * Errors are classified as:
 * - critical: Template is fundamentally broken and should not be copied
 * - warning: Template has issues but may still work
 *
 * @param {string} content - YAML file content
 * @returns {{valid: boolean, errors: string[], warnings: string[], hasCriticalErrors: boolean}}
 */
function validateBasicYaml(content) {
  const errors = [];
  const warnings = [];

  // CRITICAL: Check for tabs (YAML requires spaces) - this breaks YAML parsing
  if (content.includes('\t')) {
    errors.push('YAML file contains tabs (use spaces for indentation)');
  }

  // CRITICAL: Check for required pre-commit config keys
  if (!content.includes('repos:')) {
    errors.push('Missing required "repos:" key in pre-commit config');
  }

  // WARNING: Check for consistent indentation (basic check)
  // Odd indentation is often a warning, not always a breaking error
  const lines = content.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // Check for odd indentation that would break YAML
    const leadingSpaces = line.match(/^( *)/)?.[1]?.length || 0;
    if (leadingSpaces % 2 !== 0 && !line.trim().startsWith('#')) {
      warnings.push(`Line ${i + 1}: Odd indentation (${leadingSpaces} spaces) may cause YAML parsing issues`);
      break; // Only report first occurrence
    }
  }

  // CRITICAL: Check for empty file
  if (content.trim().length === 0) {
    errors.push('YAML file is empty');
  }

  // Determine if there are critical errors that should block installation
  // Critical errors: tabs, missing repos:, empty file
  const hasCriticalErrors = errors.length > 0;

  return {
    valid: errors.length === 0 && warnings.length === 0,
    errors,
    warnings,
    hasCriticalErrors
  };
}

/**
 * Install pre-commit configuration
 *
 * Validates the template before copying. Critical errors (tabs, missing repos:,
 * empty file) will block installation. Warnings are displayed but don't block.
 *
 * @param {string} cwd - Current working directory
 * @param {boolean} dryRun - If true, don't actually copy files
 * @param {Object} results - Results object to track created/skipped files
 * @throws {FrameworkError} If template has critical YAML errors
 */
async function installPreCommit(cwd, dryRun, results) {
  const sourcePath = join(PACKAGE_ROOT, 'templates', '.pre-commit-config.yaml');
  const targetPath = join(cwd, '.pre-commit-config.yaml');

  if (existsSync(sourcePath)) {
    // Validate template before copying
    const content = await readFile(sourcePath, 'utf-8');
    const validation = validateBasicYaml(content);

    // Critical errors block installation - template is fundamentally broken
    if (validation.hasCriticalErrors) {
      const errorMsg = `Pre-commit template has critical errors and cannot be installed:\n${validation.errors.map(e => `  - ${e}`).join('\n')}`;
      console.error(chalk.red(`\n❌ ${errorMsg}\n`));
      throw createError('AIX-HOOK-700', errorMsg, {
        context: { templatePath: sourcePath, errors: validation.errors },
        suggestion: 'The pre-commit template in the framework package is malformed. Please report this issue.'
      });
    }

    // Warnings are displayed but don't block installation
    if (validation.warnings.length > 0) {
      console.warn(
        chalk.yellow(`\n⚠️  Pre-commit template has potential issues:\n${validation.warnings.map(e => `  - ${e}`).join('\n')}\n`)
      );
    }

    if (!dryRun) {
      await fse.copy(sourcePath, targetPath);
    }
    results.created.push('.pre-commit-config.yaml');
  }
}

/**
 * Install MCP server files from framework package
 *
 * @param {string} cwd - Target directory
 * @param {boolean} dryRun - If true, don't copy files
 * @param {Object} results - Results tracker with created/skipped arrays
 * @returns {Promise<void>}
 * @private
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
 * Install template files from framework package
 *
 * @param {string} cwd - Target directory
 * @param {boolean} dryRun - If true, don't copy files
 * @param {Object} results - Results tracker with created/skipped arrays
 * @returns {Promise<void>}
 * @private
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
 * Install metrics collection scripts from framework package
 *
 * @param {string} cwd - Target directory
 * @param {boolean} dryRun - If true, don't copy files
 * @param {Object} results - Results tracker with created/skipped arrays
 * @returns {Promise<void>}
 * @private
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
 * Update .gitignore with framework-specific entries
 *
 * @param {string} cwd - Target directory
 * @param {boolean} dryRun - If true, don't modify files
 * @param {Object} results - Results tracker with created/skipped arrays
 * @returns {Promise<void>}
 * @private
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
 * Print installation results to console
 *
 * @param {Object} results - Results object with created, skipped, and errors arrays
 * @param {string[]} results.created - Files that were created
 * @param {string[]} results.skipped - Files that were skipped
 * @param {string[]} results.errors - Errors that occurred
 * @param {boolean} dryRun - If true, shows "Would create" instead of "Created"
 * @returns {void}
 * @private
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
 *
 * @param {Object} config - Preset configuration with components object
 * @param {Object} config.components - Component flags (preCommit, mcp, etc.)
 * @returns {void}
 * @private
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
