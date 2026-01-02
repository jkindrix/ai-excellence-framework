#!/usr/bin/env node

/**
 * AI Excellence Framework CLI
 *
 * A comprehensive framework for reducing friction in AI-assisted software development.
 *
 * Usage:
 *   npx ai-excellence-framework init [options]
 *   npx ai-excellence-framework validate
 *   npx ai-excellence-framework update
 *   npx ai-excellence-framework doctor
 *   npx ai-excellence-framework generate
 *   npx ai-excellence-framework lint
 *   npx ai-excellence-framework uninstall
 *
 * Configuration:
 *   AIX_TIMEOUT       - Command timeout in milliseconds (default: 300000 = 5 minutes)
 *   AIX_DEBUG         - Enable debug output (default: false)
 */

import { Command } from 'commander';
import chalk from 'chalk';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';

// Import commands
import { initCommand } from '../src/commands/init.js';
import { validateCommand } from '../src/commands/validate.js';
import { updateCommand } from '../src/commands/update.js';
import { doctorCommand } from '../src/commands/doctor.js';
import { generateCommand, SUPPORTED_TOOLS } from '../src/commands/generate.js';
import { lintCommand } from '../src/commands/lint.js';
import { uninstall } from '../src/commands/uninstall.js';
import { detectCommand } from '../src/commands/detect.js';

// Import error handling
import { FrameworkError, createError, getExitCode } from '../src/errors.js';

// Configuration from environment
const DEFAULT_TIMEOUT = 300000; // 5 minutes
const COMMAND_TIMEOUT = parseInt(process.env.AIX_TIMEOUT || String(DEFAULT_TIMEOUT), 10);
const DEBUG_MODE = process.env.AIX_DEBUG === 'true';

/**
 * Wrap a command handler with timeout support.
 * If the command takes longer than the configured timeout, it will be aborted.
 *
 * @param {Function} handler - Command handler function
 * @param {string} commandName - Name of the command for error messages
 * @returns {Function} Wrapped handler with timeout
 */
function withTimeout(handler, commandName) {
  return async function (...args) {
    const timeoutMs = COMMAND_TIMEOUT;

    if (DEBUG_MODE) {
      console.log(chalk.gray(`[DEBUG] Starting ${commandName} with timeout: ${timeoutMs}ms`));
    }

    let timerId = null;

    const timeoutPromise = new Promise((_, reject) => {
      timerId = setTimeout(() => {
        reject(
          createError(
            'AIX-GEN-901',
            `Command '${commandName}' timed out after ${timeoutMs}ms. Set AIX_TIMEOUT environment variable to increase the timeout.`,
            { context: { command: commandName, timeout: timeoutMs } }
          )
        );
      }, timeoutMs);
    });

    try {
      const result = await Promise.race([handler.apply(this, args), timeoutPromise]);
      clearTimeout(timerId);
      return result;
    } catch (error) {
      clearTimeout(timerId);
      throw error;
    }
  };
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Read package.json for version
const packageJson = JSON.parse(readFileSync(join(__dirname, '..', 'package.json'), 'utf-8'));

const program = new Command();

program
  .name('ai-excellence')
  .description('AI Excellence Framework - Reduce friction in AI-assisted development')
  .version(packageJson.version)
  .addHelpText('after', `
Examples:
  $ ai-excellence init                    # Initialize with standard preset
  $ ai-excellence init --preset full      # Full setup with MCP and metrics
  $ ai-excellence init --preset minimal   # Minimal setup (CLAUDE.md only)
  $ ai-excellence validate --fix          # Validate and auto-fix issues
  $ ai-excellence doctor                  # Check framework health
  $ ai-excellence generate cursor         # Generate Cursor IDE rules
  $ ai-excellence generate --all          # Generate configs for all tools

More info: https://ai-excellence-framework.github.io/
`);

// Valid presets
const VALID_PRESETS = ['minimal', 'standard', 'full', 'team'];

/**
 * Sanitize user input for safe display in error messages.
 * Prevents terminal escape sequence injection and limits length.
 *
 * @param {string} input - User-provided input
 * @param {number} [maxLength=50] - Maximum length to display
 * @returns {string} Sanitized string safe for terminal output
 */
function sanitizeForDisplay(input, maxLength = 50) {
  if (typeof input !== 'string') {
    return String(input).slice(0, maxLength);
  }

  // Remove control characters and ANSI escape sequences
  let sanitized = input
    .replace(/[\x00-\x1f\x7f]/g, '') // Remove control characters
    .replace(/\x1b\[[0-9;]*[a-zA-Z]/g, '') // Remove ANSI escape sequences
    .replace(/\x1b\][^\x07]*\x07/g, ''); // Remove OSC sequences

  // Truncate if too long
  if (sanitized.length > maxLength) {
    sanitized = `${sanitized.slice(0, maxLength)}...`;
  }

  return sanitized;
}

// Init command
program
  .command('init')
  .description('Initialize the AI Excellence Framework in your project')
  .option(
    '-p, --preset <preset>',
    'Preset configuration (minimal, standard, full, team)',
    'standard'
  )
  .hook('preAction', thisCommand => {
    const { preset } = thisCommand.opts();
    if (preset && !VALID_PRESETS.includes(preset)) {
      const safePreset = sanitizeForDisplay(preset);
      console.error(chalk.red(`\nError: Invalid preset '${safePreset}'`));
      console.log(chalk.gray(`Valid presets: ${VALID_PRESETS.join(', ')}`));
      process.exit(1);
    }
  })
  .option('-f, --force', 'Overwrite existing files', false)
  .option('-y, --yes', 'Skip interactive prompts, use defaults', false)
  .option('--dry-run', 'Show what would be created without making changes', false)
  .option('--no-hooks', 'Skip pre-commit hooks installation')
  .option('--no-mcp', 'Skip MCP server setup')
  .option('--verbose', 'Show detailed installation progress', false)
  .option('--json', 'Output results as JSON', false)
  .action(withTimeout(initCommand, 'init'));

// Validate command
program
  .command('validate')
  .description('Validate your AI Excellence Framework configuration')
  .option('--fix', 'Attempt to fix issues automatically', false)
  .option('--json', 'Output results as JSON', false)
  .option('--verbose', 'Show detailed validation output', false)
  .action(withTimeout(validateCommand, 'validate'));

// Update command
program
  .command('update')
  .description('Update the framework to the latest version')
  .option('--check', 'Check for updates without installing', false)
  .option('-f, --force', 'Force update even if no changes detected', false)
  .option('--verbose', 'Show detailed update progress', false)
  .option('--json', 'Output results as JSON', false)
  .action(withTimeout(updateCommand, 'update'));

// Doctor command
program
  .command('doctor')
  .description('Diagnose common issues and verify setup')
  .option('--verbose', 'Show detailed diagnostic information', false)
  .option('--json', 'Output results as JSON', false)
  .action(withTimeout(doctorCommand, 'doctor'));

// Generate command (multi-tool support)
program
  .command('generate')
  .alias('gen')
  .description('Generate configuration files for multiple AI coding tools')
  .option('-t, --tools <tools>', `Tools to generate for: ${SUPPORTED_TOOLS.join(', ')}`, 'all')
  .option('-f, --force', 'Overwrite existing files', false)
  .option('--dry-run', 'Show what would be created without making changes', false)
  .option('--json', 'Output results as JSON', false)
  .option('--verbose', 'Show detailed generation output', false)
  .action(withTimeout(generateCommand, 'generate'));

// Lint command (configuration validation)
program
  .command('lint')
  .description('Check configuration files for issues and best practices')
  .option('--verbose', 'Show all findings including suggestions', false)
  .option('--only <files>', 'Only check specific files (comma-separated)', '')
  .option('--ignore-errors', 'Exit 0 even with errors', false)
  .action(withTimeout(lintCommand, 'lint'));

// Uninstall command
program
  .command('uninstall')
  .description('Remove AI Excellence Framework files from your project')
  .option('--dry-run', 'Show what would be removed without making changes', false)
  .option('-f, --force', 'Skip confirmation prompt', false)
  .option('--keep-config', 'Preserve CLAUDE.md file', false)
  .option('--json', 'Output results as JSON', false)
  .option('--verbose', 'Show detailed removal progress', false)
  .action(withTimeout(uninstall, 'uninstall'));

// Detect command
program
  .command('detect')
  .description('Detect which AI coding tools are configured in this project')
  .option('--verbose', 'Show detailed information including unconfigured tools', false)
  .option('--json', 'Output results as JSON', false)
  .action(withTimeout(detectCommand, 'detect'));

// Error handling
program.exitOverride(err => {
  // Exit cleanly for help and version
  if (
    err.code === 'commander.help' ||
    err.code === 'commander.helpDisplayed' ||
    err.code === 'commander.version'
  ) {
    process.exit(0);
  }
  console.error(chalk.red(`\nError: ${err.message}`));
  process.exit(1);
});

// Main execution with error boundary
async function main() {
  try {
    // Parse arguments
    await program.parseAsync();

    // Show help if no command provided
    if (!process.argv.slice(2).length) {
      console.log(chalk.cyan('\n  AI Excellence Framework'));
      console.log(chalk.gray('  Reduce friction in AI-assisted development\n'));
      program.help();
    }
  } catch (error) {
    // Handle FrameworkError with proper formatting and exit codes
    if (error instanceof FrameworkError) {
      console.error(error.format(process.env.VERBOSE === 'true'));
      process.exit(getExitCode(error.code));
    }

    // Handle commander errors (already handled by exitOverride, but as safety net)
    if (error.code?.startsWith('commander.')) {
      // Already handled by exitOverride
      return;
    }

    // Handle unexpected errors
    const wrapped = createError('AIX-GEN-900', error.message, {
      cause: error,
      context: { originalStack: error.stack }
    });
    console.error(wrapped.format(process.env.VERBOSE === 'true'));
    process.exit(1);
  }
}

main();
