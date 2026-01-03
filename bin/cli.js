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

// Node.js version check - must run before any imports that might fail on older versions
const MIN_NODE_VERSION = 18;
const currentVersion = parseInt(process.versions.node.split('.')[0], 10);

if (currentVersion < MIN_NODE_VERSION) {
  console.error(`\n❌ Error: Node.js ${MIN_NODE_VERSION}.x or higher is required.`);
  console.error(`   Current version: ${process.version}`);
  console.error('   Please upgrade Node.js: https://nodejs.org/\n');
  process.exit(1);
}

import { Command } from 'commander';
import chalk from 'chalk';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';
import { randomUUID } from 'crypto';

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
const STRUCTURED_LOGGING = process.env.AIX_STRUCTURED_LOGGING === 'true';

// Maximum length for any single CLI argument value
// Can be increased for legitimate long inputs (e.g., complex configurations)
// Default: 1000 chars, Max: 100000 chars
const DEFAULT_MAX_ARG_LENGTH = 1000;
const MAX_ARG_LENGTH_LIMIT = 100000; // Safety cap
const MAX_ARG_LENGTH = Math.min(
  parseInt(process.env.AIX_MAX_ARG_LENGTH || String(DEFAULT_MAX_ARG_LENGTH), 10),
  MAX_ARG_LENGTH_LIMIT
);

// Current operation ID for log correlation (set per-command execution)
let currentOperationId = null;

/**
 * Structured logger for CI/CD integration.
 * When AIX_STRUCTURED_LOGGING=true, outputs JSON-formatted log lines
 * that can be easily parsed by log aggregation tools.
 *
 * Log format:
 * {"timestamp":"ISO8601","level":"info|warn|error|debug","message":"...","context":{...}}
 *
 * @param {string} level - Log level (info, warn, error, debug)
 * @param {string} message - Log message
 * @param {Object} [context={}] - Additional context data
 */
function log(level, message, context = {}) {
  if (level === 'debug' && !DEBUG_MODE) {
    return;
  }

  if (STRUCTURED_LOGGING) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      // Include operation ID for log correlation if set
      ...(currentOperationId && { operationId: currentOperationId }),
      ...context
    };
    console.log(JSON.stringify(logEntry));
  } else {
    const colors = {
      info: chalk.blue,
      warn: chalk.yellow,
      error: chalk.red,
      debug: chalk.gray
    };
    const prefix = level === 'debug' ? '[DEBUG] ' : '';
    const colorFn = colors[level] || (x => x);

    if (level === 'error') {
      console.error(colorFn(`${prefix}${message}`));
    } else {
      console.log(colorFn(`${prefix}${message}`));
    }
  }
}

/**
 * Logger object with convenience methods for different log levels.
 * Respects AIX_STRUCTURED_LOGGING for JSON output and AIX_DEBUG for debug messages.
 */
const logger = {
  info: (msg, ctx) => log('info', msg, ctx),
  warn: (msg, ctx) => log('warn', msg, ctx),
  error: (msg, ctx) => log('error', msg, ctx),
  debug: (msg, ctx) => log('debug', msg, ctx)
};

/**
 * Create an abort error for the given command and reason.
 *
 * @param {string} commandName - Name of the command
 * @param {number} timeoutMs - Timeout in milliseconds
 * @param {Error|undefined} reason - Abort reason
 * @returns {FrameworkError} Configured error
 * @private
 */
function createAbortError(commandName, timeoutMs, reason) {
  const isTimeout = reason?.name === 'TimeoutError';
  return createError(
    'AIX-GEN-901',
    isTimeout
      ? `Command '${commandName}' timed out after ${timeoutMs}ms. Set AIX_TIMEOUT environment variable to increase the timeout.`
      : `Command '${commandName}' was aborted: ${reason?.message || 'Unknown reason'}`,
    {
      context: {
        command: commandName,
        timeout: timeoutMs,
        reason: reason?.name || 'AbortError'
      }
    }
  );
}

/**
 * Wrap a command handler with timeout support using AbortController.
 *
 * Uses the modern AbortSignal.timeout() API for cleaner cancellation semantics.
 * This approach provides:
 * - Automatic cleanup when the timeout fires
 * - Proper signal propagation for cancellable operations
 * - Clear abort reason for debugging
 * - Defensive handling of edge cases (pre-aborted signals, race conditions)
 *
 * If the command takes longer than the configured timeout, it will be aborted
 * with an appropriate error message.
 *
 * @param {Function} handler - Command handler function
 * @param {string} commandName - Name of the command for error messages
 * @returns {Function} Wrapped handler with timeout and abort support
 * @see https://nodejs.org/api/globals.html#class-abortsignal
 */
function withTimeout(handler, commandName) {
  return async function (...args) {
    const timeoutMs = COMMAND_TIMEOUT;

    // Generate unique operation ID for log correlation
    currentOperationId = randomUUID();

    logger.debug(`Starting ${commandName} with timeout: ${timeoutMs}ms`, { command: commandName, timeout: timeoutMs });

    // Create an AbortController for manual cancellation (future use)
    const controller = new AbortController();

    // Create a timeout signal using AbortSignal.timeout()
    // This automatically cleans up when the timeout fires
    const timeoutSignal = AbortSignal.timeout(timeoutMs);

    // Combine signals: abort on either timeout OR manual abort
    // AbortSignal.any() allows combining multiple abort reasons
    const combinedSignal = AbortSignal.any([controller.signal, timeoutSignal]);

    // Check if signal is already aborted (defensive: handles edge case where
    // timeout is extremely short or system is under heavy load)
    if (combinedSignal.aborted) {
      currentOperationId = null;
      throw createAbortError(commandName, timeoutMs, combinedSignal.reason);
    }

    // Store signal on args options if present (allows handlers to check for abort)
    // This enables cooperative cancellation within command handlers
    const lastArg = args[args.length - 1];
    if (lastArg && typeof lastArg === 'object' && !Array.isArray(lastArg)) {
      lastArg._abortSignal = combinedSignal;
    }

    // Track whether we've already cleaned up to prevent double-cleanup
    let cleanedUp = false;
    let abortReject = null;
    let abortHandler = null;

    /**
     * Clean up abort listener and reset state.
     * Safe to call multiple times (idempotent).
     */
    const cleanup = () => {
      if (cleanedUp) {
        return;
      }
      cleanedUp = true;

      if (abortHandler) {
        combinedSignal.removeEventListener('abort', abortHandler);
        abortHandler = null;
      }
      abortReject = null;
      currentOperationId = null;
    };

    // Create abort handler that can be cleaned up
    abortHandler = () => {
      if (abortReject) {
        abortReject(createAbortError(commandName, timeoutMs, combinedSignal.reason));
      }
    };

    // Listen for abort to throw appropriate error
    // Note: We add the listener before creating the promise to avoid race conditions
    combinedSignal.addEventListener('abort', abortHandler, { once: true });

    // Create the abort promise after adding listener
    const abortPromise = new Promise((_, reject) => {
      abortReject = reject;
      // Double-check: if signal was aborted between our check and adding listener,
      // reject immediately (defensive against race conditions)
      if (combinedSignal.aborted) {
        reject(createAbortError(commandName, timeoutMs, combinedSignal.reason));
      }
    });

    try {
      // Race between command execution and abort
      const result = await Promise.race([handler.apply(this, args), abortPromise]);
      return result;
    } catch (error) {
      // Abort any ongoing operations (cleanup for cooperative cancellation)
      if (!controller.signal.aborted) {
        controller.abort(error);
      }
      throw error;
    } finally {
      // Clean up: remove abort listener to prevent memory leaks
      cleanup();
    }
  };
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Read package.json for version
const packageJson = JSON.parse(readFileSync(join(__dirname, '..', 'package.json'), 'utf-8'));

// Expected types for known options (for explicit type checking)
const OPTION_TYPES = {
  // Boolean options
  force: 'boolean',
  yes: 'boolean',
  dryRun: 'boolean',
  verbose: 'boolean',
  json: 'boolean',
  fix: 'boolean',
  check: 'boolean',
  hooks: 'boolean',
  mcp: 'boolean',
  color: 'boolean',
  keepConfig: 'boolean',
  ignoreErrors: 'boolean',
  // String options
  preset: 'string',
  tools: 'string',
  only: 'string'
};

/**
 * Validate and normalize Commander.js option types.
 * Ensures options are the expected type and handles coercion.
 *
 * @param {Object} opts - Options object from commander
 * @returns {Object} Normalized options with correct types
 */
function normalizeOptionTypes(opts) {
  const normalized = { ...opts };

  for (const [key, expectedType] of Object.entries(OPTION_TYPES)) {
    if (!(key in normalized)) {
      continue;
    }

    const value = normalized[key];

    if (expectedType === 'boolean') {
      // Coerce to boolean (Commander should already do this, but be explicit)
      if (typeof value !== 'boolean') {
        normalized[key] = Boolean(value);
        logger.debug(`Coerced option '${key}' to boolean: ${normalized[key]}`, { option: key });
      }
    } else if (expectedType === 'string') {
      // Ensure string type
      if (value !== undefined && value !== null && typeof value !== 'string') {
        normalized[key] = String(value);
        logger.debug(`Coerced option '${key}' to string`, { option: key });
      }
    }
  }

  return normalized;
}

/**
 * Validate that all option values are within acceptable length bounds.
 * Prevents denial-of-service via extremely long inputs and memory exhaustion.
 *
 * @param {Object} opts - Options object from commander
 * @throws {Error} If any option value exceeds MAX_ARG_LENGTH
 */
function validateInputLengths(opts) {
  for (const [key, value] of Object.entries(opts)) {
    if (typeof value === 'string' && value.length > MAX_ARG_LENGTH) {
      const truncated = sanitizeForDisplay(value, 30);
      logger.error(`Option '${key}' value is too long (${value.length} chars, max: ${MAX_ARG_LENGTH})`, {
        option: key,
        length: value.length,
        maxLength: MAX_ARG_LENGTH
      });
      console.error(chalk.red('\nError: Option value too long'));
      console.error(chalk.gray(`Option '${key}' is ${value.length} characters (max: ${MAX_ARG_LENGTH})`));
      console.error(chalk.gray(`Value starts with: "${truncated}"`));
      process.exit(1);
    }
  }
}

const program = new Command();

program
  .name('ai-excellence')
  .description(
    'AI Excellence Framework - Reduce friction in AI-assisted development\n\n' +
    'Input Limits:\n' +
    `  - String arguments: max ${MAX_ARG_LENGTH} characters (set AIX_MAX_ARG_LENGTH to customize)\n` +
    '  - Timeout: default 5min (set AIX_TIMEOUT env var to customize, max 600s)'
  )
  .version(packageJson.version)
  .option('--no-color', 'Disable colored output (also respects NO_COLOR env var)')
  .hook('preAction', thisCommand => {
    // Normalize and validate option types
    const rawOpts = thisCommand.opts();
    const opts = normalizeOptionTypes(rawOpts);

    // Check for --no-color flag or NO_COLOR environment variable
    // Chalk automatically respects NO_COLOR, but we also support the CLI flag
    if (opts.color === false || process.env.NO_COLOR) {
      // Disable chalk colors by setting the level to 0
      chalk.level = 0;
    }

    // Validate input lengths to prevent DoS via extremely long arguments
    validateInputLengths(opts);
  })
  .addHelpText('after', `
Examples:
  $ ai-excellence init                    # Initialize with standard preset
  $ ai-excellence init --preset full      # Full setup with MCP and metrics
  $ ai-excellence init --preset minimal   # Minimal setup (CLAUDE.md only)
  $ ai-excellence validate --fix          # Validate and auto-fix issues
  $ ai-excellence doctor                  # Check framework health
  $ ai-excellence generate cursor         # Generate Cursor IDE rules
  $ ai-excellence generate --all          # Generate configs for all tools
  $ ai-excellence --no-color init         # Run without colors

Environment variables:
  NO_COLOR=1                              # Disable colored output
  AIX_TIMEOUT=300000                      # Command timeout (ms, default: 5 min)
  AIX_DEBUG=true                          # Enable debug output
  AIX_STRUCTURED_LOGGING=true             # Enable JSON log output for CI/CD

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
      context: {
        originalErrorType: error.name || 'Error',
        originalErrorCode: error.code || null,
        originalStack: error.stack
      }
    });
    console.error(wrapped.format(process.env.VERBOSE === 'true'));
    process.exit(1);
  }
}

main();
