/**
 * AI Excellence Framework - Structured Error System
 *
 * Provides consistent, trackable error codes for CLI operations.
 * Error codes follow the format: AIX-{CATEGORY}-{NUMBER}
 *
 * Categories:
 * - INIT: Initialization errors (100-199)
 * - VALID: Validation errors (200-299)
 * - CONFIG: Configuration errors (300-399)
 * - FS: Filesystem errors (400-499)
 * - NET: Network errors (500-599)
 * - MCP: MCP server errors (600-699)
 * - HOOK: Hook errors (700-799)
 * - GEN: General errors (900-999)
 *
 * @module ai-excellence-framework/errors
 * @see https://github.com/lirantal/nodejs-cli-apps-best-practices
 */

import { homedir } from 'os';
import { relative, isAbsolute } from 'path';

/**
 * Base URL for error documentation.
 * Can be overridden via AIX_DOCS_URL environment variable.
 * @type {string}
 */
const DOCS_BASE_URL = process.env.AIX_DOCS_URL || 'https://ai-excellence-framework.github.io';

/**
 * Sanitize context object to prevent sensitive path leakage.
 * Replaces home directory paths with ~ and absolute paths with relative versions.
 * Handles circular references safely to prevent stack overflow.
 *
 * @param {Object.<string, *>} context - Context object to sanitize
 * @param {string} [basePath=process.cwd()] - Base path for relative conversion
 * @param {WeakSet} [seen] - Set of already-seen objects for circular reference detection
 * @returns {Object.<string, *>} Sanitized context object with paths replaced
 */
function sanitizeContext(context, basePath = process.cwd(), seen = new WeakSet()) {
  if (!context || typeof context !== 'object') {
    return context;
  }

  // Handle circular references - return placeholder if we've seen this object before
  if (seen.has(context)) {
    return '[Circular Reference]';
  }

  // Track this object to detect circular references
  seen.add(context);

  const home = homedir();

  // Handle arrays
  if (Array.isArray(context)) {
    return context.map(item => {
      if (typeof item === 'object' && item !== null) {
        return sanitizeContext(item, basePath, seen);
      }
      return item;
    });
  }

  const result = {};

  for (const [key, value] of Object.entries(context)) {
    if (typeof value === 'string') {
      // First check if this is a sensitive key that should be redacted
      if (isSensitiveEnvVar(key)) {
        result[key] = '[REDACTED]';
        continue;
      }

      let sanitized = value;

      // Replace home directory with ~
      if (home && sanitized.includes(home)) {
        sanitized = sanitized.replace(new RegExp(escapeRegExp(home), 'g'), '~');
      }

      // Convert absolute paths to relative (but keep the ~ substitution)
      if (isAbsolute(sanitized) && !sanitized.startsWith('~')) {
        try {
          const rel = relative(basePath, sanitized);
          // Only use relative if it doesn't escape too far
          if (!rel.startsWith('..') || rel.split('..').length <= 3) {
            sanitized = rel || '.';
          }
        } catch {
          // Keep original if relative conversion fails
        }
      }

      result[key] = sanitized;
    } else if (typeof value === 'object' && value !== null) {
      // Recursively sanitize nested objects (circular references handled by seen set)
      result[key] = sanitizeContext(value, basePath, seen);
    } else {
      result[key] = value;
    }
  }

  return result;
}

/**
 * Escape special regex characters in a string
 * @param {string} str - String to escape
 * @returns {string} Escaped string safe for use in RegExp
 */
function escapeRegExp(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Sanitize a stack trace to prevent path leakage.
 * Replaces absolute paths with relative versions and home directory with ~.
 *
 * @param {string} stack - Stack trace string
 * @param {string} [basePath=process.cwd()] - Base path for relative conversion
 * @returns {string} Sanitized stack trace
 */
function sanitizeStack(stack, _basePath = process.cwd()) {
  if (!stack || typeof stack !== 'string') {
    return stack;
  }

  const home = homedir();
  let sanitized = stack;

  // Replace home directory with ~
  if (home) {
    sanitized = sanitized.replace(new RegExp(escapeRegExp(home), 'g'), '~');
  }

  // Replace absolute paths that aren't in node_modules with relative paths
  // Match patterns like "at Function (/absolute/path/file.js:line:col)"
  sanitized = sanitized.replace(
    /(\s+at\s+.+\s+\()([^)]+node_modules[^)]+)(\))/g,
    '$1[node_modules]$3'
  );

  return sanitized;
}

/**
 * Sensitive environment variable patterns that should be redacted
 * @type {RegExp[]}
 */
const SENSITIVE_ENV_PATTERNS = [
  /^(.*_)?(API_?KEY|SECRET|PASSWORD|TOKEN|CREDENTIAL|AUTH|PRIVATE)(_.*)?$/i,
  /^(AWS|AZURE|GCP|GOOGLE|OPENAI|ANTHROPIC|STRIPE)_.+/i,
  /^(DATABASE|DB|MONGO|REDIS|POSTGRES)_(URL|URI|PASSWORD|CONNECTION)/i
];

/**
 * Check if an environment variable name is sensitive
 * @param {string} name - Environment variable name
 * @returns {boolean} True if the name looks sensitive
 */
function isSensitiveEnvVar(name) {
  return SENSITIVE_ENV_PATTERNS.some(pattern => pattern.test(name));
}

/**
 * Redact sensitive values from context
 * @param {*} value - Value to potentially redact
 * @param {string} key - Key name for the value
 * @returns {*} Redacted value if sensitive, original otherwise
 */
function _redactSensitiveValue(value, key) {
  if (typeof value !== 'string') {
    return value;
  }

  // Check if the key name suggests sensitivity
  if (isSensitiveEnvVar(key)) {
    return '[REDACTED]';
  }

  return value;
}

/**
 * Base error class for all framework errors.
 * Extends Error with structured properties for tracking and debugging.
 */
export class FrameworkError extends Error {
  /**
   * @param {string} code - Error code (e.g., 'AIX-INIT-101')
   * @param {string} message - Human-readable error message
   * @param {Object} [options] - Additional error options
   * @param {Error} [options.cause] - Original error that caused this error
   * @param {Object} [options.context] - Additional context for debugging
   * @param {boolean} [options.recoverable=true] - Whether the error is recoverable
   * @param {string} [options.suggestion] - Suggested fix for the error
   */
  constructor(code, message, options = {}) {
    super(message);
    this.name = 'FrameworkError';
    this.code = code;
    this.timestamp = new Date().toISOString();
    this.cause = options.cause || null;
    this.context = options.context || {};
    this.recoverable = options.recoverable !== false;
    this.suggestion = options.suggestion || null;
  }

  /**
   * Returns a structured representation for logging/debugging.
   * Context paths and stack traces are sanitized to prevent leaking sensitive information.
   * @param {boolean} [sanitize=true] - Whether to sanitize paths in context and stack
   * @returns {Object} Structured error object
   */
  toJSON(sanitize = true) {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      timestamp: this.timestamp,
      recoverable: this.recoverable,
      suggestion: this.suggestion,
      context: sanitize ? sanitizeContext(this.context) : this.context,
      stack: sanitize ? sanitizeStack(this.stack) : this.stack
    };
  }

  /**
   * Returns a formatted string for CLI output.
   * Stack traces are sanitized to prevent path information leakage.
   * @param {boolean} [verbose=false] - Include stack trace
   * @returns {string} Formatted error message
   */
  format(verbose = false) {
    let output = `\n  Error: ${this.code}\n`;
    output += `  ${this.message}\n`;

    if (this.suggestion) {
      output += `\n  Suggestion: ${this.suggestion}\n`;
    }

    if (verbose && this.stack) {
      // Sanitize stack trace to prevent path information leakage
      const sanitizedStack = sanitizeStack(this.stack);
      output += `\n  Stack trace:\n  ${sanitizedStack.split('\n').slice(1).join('\n  ')}\n`;
    }

    output += `\n  Documentation: ${DOCS_BASE_URL}/ERROR-CODES.html#${this.code.toLowerCase()}\n`;

    return output;
  }
}

/**
 * Error codes catalog with descriptions and suggestions.
 * Used for documentation generation and runtime error creation.
 */
export const ERROR_CODES = {
  // Initialization Errors (100-199)
  'AIX-INIT-100': {
    category: 'Initialization',
    description: 'General initialization failure',
    suggestion: 'Check file permissions and try again with --verbose flag'
  },
  'AIX-INIT-101': {
    category: 'Initialization',
    description: 'Directory already contains framework files',
    suggestion: 'Use --force to overwrite existing files, or use --dry-run to preview changes'
  },
  'AIX-INIT-102': {
    category: 'Initialization',
    description: 'Invalid preset specified',
    suggestion: 'Valid presets are: minimal, standard, full, team'
  },
  'AIX-INIT-103': {
    category: 'Initialization',
    description: 'Failed to create directory structure',
    suggestion: 'Check write permissions for the target directory'
  },
  'AIX-INIT-104': {
    category: 'Initialization',
    description: 'Template file not found',
    suggestion: 'Reinstall the framework: npm install -g ai-excellence-framework'
  },
  'AIX-INIT-105': {
    category: 'Initialization',
    description: 'Interactive prompts not available',
    suggestion: 'Use --yes flag for non-interactive mode, or run in an interactive terminal'
  },

  // Validation Errors (200-299)
  'AIX-VALID-200': {
    category: 'Validation',
    description: 'General validation failure',
    suggestion: 'Run "aix validate --verbose" for detailed validation output'
  },
  'AIX-VALID-201': {
    category: 'Validation',
    description: 'CLAUDE.md file is missing',
    suggestion: 'Run "aix init" to create CLAUDE.md or create it manually'
  },
  'AIX-VALID-202': {
    category: 'Validation',
    description: 'CLAUDE.md missing required sections',
    suggestion: 'Required sections: ## Overview, ## Tech Stack, ## Current State'
  },
  'AIX-VALID-203': {
    category: 'Validation',
    description: 'Configuration schema validation failed',
    suggestion: 'Check ai-excellence.config.json against the schema'
  },
  'AIX-VALID-204': {
    category: 'Validation',
    description: 'Slash command file is malformed',
    suggestion: 'Slash commands must have YAML frontmatter with "description" field'
  },
  'AIX-VALID-205': {
    category: 'Validation',
    description: 'Agent definition is malformed',
    suggestion: 'Agent files must have YAML frontmatter with "name" and "description" fields'
  },
  'AIX-VALID-206': {
    category: 'Validation',
    description: 'Hook script is not executable',
    suggestion: 'Run: chmod +x scripts/hooks/*.sh'
  },

  // Configuration Errors (300-399)
  'AIX-CONFIG-300': {
    category: 'Configuration',
    description: 'General configuration error',
    suggestion: 'Check ai-excellence.config.json for syntax errors'
  },
  'AIX-CONFIG-301': {
    category: 'Configuration',
    description: 'Configuration file not found',
    suggestion:
      'Run "aix init" to create configuration or create ai-excellence.config.json manually'
  },
  'AIX-CONFIG-302': {
    category: 'Configuration',
    description: 'Invalid JSON in configuration file',
    suggestion: 'Validate JSON syntax at https://jsonlint.com/'
  },
  'AIX-CONFIG-303': {
    category: 'Configuration',
    description: 'Unknown configuration option',
    suggestion: 'Check documentation for valid configuration options'
  },
  'AIX-CONFIG-304': {
    category: 'Configuration',
    description: 'Incompatible configuration version',
    suggestion: 'Run "aix update" to migrate configuration to current version'
  },

  // Filesystem Errors (400-499)
  'AIX-FS-400': {
    category: 'Filesystem',
    description: 'General filesystem error',
    suggestion: 'Check file permissions and disk space'
  },
  'AIX-FS-401': {
    category: 'Filesystem',
    description: 'Permission denied',
    suggestion: 'Check file/directory permissions or run with appropriate privileges'
  },
  'AIX-FS-402': {
    category: 'Filesystem',
    description: 'File not found',
    suggestion: 'Verify the file path exists and is spelled correctly'
  },
  'AIX-FS-403': {
    category: 'Filesystem',
    description: 'Directory not found',
    suggestion: 'Create the directory first or check the path'
  },
  'AIX-FS-404': {
    category: 'Filesystem',
    description: 'Disk space insufficient',
    suggestion: 'Free up disk space and try again'
  },
  'AIX-FS-405': {
    category: 'Filesystem',
    description: 'File already exists and overwrite not allowed',
    suggestion: 'Use --force flag to overwrite or rename the existing file'
  },

  // Network Errors (500-599)
  'AIX-NET-500': {
    category: 'Network',
    description: 'General network error',
    suggestion: 'Check internet connection and try again'
  },
  'AIX-NET-501': {
    category: 'Network',
    description: 'Failed to download template',
    suggestion: 'Check internet connection or use offline installation'
  },
  'AIX-NET-502': {
    category: 'Network',
    description: 'Registry unreachable',
    suggestion: 'Check npm registry configuration and network connectivity'
  },

  // MCP Server Errors (600-699)
  'AIX-MCP-600': {
    category: 'MCP Server',
    description: 'General MCP server error',
    suggestion: 'Check MCP server logs and configuration'
  },
  'AIX-MCP-601': {
    category: 'MCP Server',
    description: 'MCP server failed to start',
    suggestion: 'Check Python installation and MCP SDK: pip install mcp'
  },
  'AIX-MCP-602': {
    category: 'MCP Server',
    description: 'MCP database initialization failed',
    suggestion: 'Check write permissions for ~/.claude/project-memories/'
  },
  'AIX-MCP-603': {
    category: 'MCP Server',
    description: 'MCP connection pool exhausted',
    suggestion: 'Increase PROJECT_MEMORY_POOL_SIZE environment variable'
  },
  'AIX-MCP-604': {
    category: 'MCP Server',
    description: 'MCP rate limit exceeded',
    suggestion: 'Wait before retrying or increase PROJECT_MEMORY_RATE_LIMIT'
  },
  'AIX-MCP-605': {
    category: 'MCP Server',
    description: 'MCP data import failed',
    suggestion: 'Verify the import file is valid JSON from a previous export'
  },

  // Hook Errors (700-799)
  'AIX-HOOK-700': {
    category: 'Hooks',
    description: 'General hook error',
    suggestion: 'Check hook script syntax and permissions'
  },
  'AIX-HOOK-701': {
    category: 'Hooks',
    description: 'Pre-commit hook installation failed',
    suggestion: 'Install pre-commit: pip install pre-commit && pre-commit install'
  },
  'AIX-HOOK-702': {
    category: 'Hooks',
    description: 'Hook script execution failed',
    suggestion: 'Check script syntax: bash -n scripts/hooks/script.sh'
  },
  'AIX-HOOK-703': {
    category: 'Hooks',
    description: 'Hook blocked by security policy',
    suggestion: 'Review hook commands against allowed commands in settings.json'
  },

  // General Errors (900-999)
  'AIX-GEN-900': {
    category: 'General',
    description: 'Unknown error occurred',
    suggestion: 'Run with --verbose flag and report issue on GitHub'
  },
  'AIX-GEN-901': {
    category: 'General',
    description: 'Operation cancelled by user',
    suggestion: 'No action needed'
  },
  'AIX-GEN-902': {
    category: 'General',
    description: 'Operation timed out',
    suggestion: 'Try again or increase timeout if available'
  },
  'AIX-GEN-903': {
    category: 'General',
    description: 'Unsupported Node.js version',
    suggestion: 'Upgrade to Node.js 18.x or higher'
  },
  'AIX-GEN-904': {
    category: 'General',
    description: 'Unsupported operating system',
    suggestion: 'This operation is not supported on your operating system'
  }
};

/**
 * Creates a FrameworkError with predefined code and suggestion.
 *
 * @param {string} code - Error code from ERROR_CODES
 * @param {string} [customMessage] - Optional custom message (overrides default)
 * @param {Object} [options] - Additional error options
 * @returns {FrameworkError} Configured error instance
 *
 * @example
 * throw createError('AIX-INIT-101', 'Found existing CLAUDE.md in /path/to/project');
 */
export function createError(code, customMessage, options = {}) {
  const errorDef = ERROR_CODES[code] || ERROR_CODES['AIX-GEN-900'];
  const message = customMessage || errorDef.description;

  return new FrameworkError(code, message, {
    ...options,
    suggestion: options.suggestion || errorDef.suggestion
  });
}

/**
 * Exit codes for CLI commands.
 * Following Unix conventions and extending for framework-specific cases.
 *
 * @see https://tldp.org/LDP/abs/html/exitcodes.html
 */
export const EXIT_CODES = {
  SUCCESS: 0, // Successful completion
  GENERAL_ERROR: 1, // General error
  MISUSE: 2, // Command line misuse
  CANNOT_EXECUTE: 126, // Permission problem or command not executable
  NOT_FOUND: 127, // Command not found
  INVALID_ARG: 128, // Invalid argument to exit
  CTRL_C: 130, // Script terminated by Ctrl+C

  // Framework-specific exit codes (64-113 range, per sysexits.h)
  INIT_ERROR: 64, // Initialization failed
  VALIDATION_ERROR: 65, // Validation failed
  CONFIG_ERROR: 66, // Configuration error
  IO_ERROR: 74, // I/O error
  TEMP_FAILURE: 75, // Temporary failure, retry later
  PROTOCOL_ERROR: 76, // Protocol error (MCP, etc.)
  PERMISSION_ERROR: 77, // Permission denied
  CONFIG_MISSING: 78 // Configuration file missing
};

/**
 * Maps error codes to exit codes.
 *
 * @param {string} errorCode - Framework error code
 * @returns {number} Appropriate exit code
 */
export function getExitCode(errorCode) {
  const prefix = errorCode.split('-')[1];

  switch (prefix) {
    case 'INIT':
      return EXIT_CODES.INIT_ERROR;
    case 'VALID':
      return EXIT_CODES.VALIDATION_ERROR;
    case 'CONFIG':
      return EXIT_CODES.CONFIG_ERROR;
    case 'FS':
      return EXIT_CODES.IO_ERROR;
    case 'NET':
      return EXIT_CODES.TEMP_FAILURE;
    case 'MCP':
      return EXIT_CODES.PROTOCOL_ERROR;
    case 'HOOK':
      return EXIT_CODES.PERMISSION_ERROR;
    default:
      return EXIT_CODES.GENERAL_ERROR;
  }
}

/**
 * Wraps an async function with error handling.
 * Catches errors, formats them, and exits with appropriate code.
 *
 * @template {(...args: any[]) => Promise<any>} T
 * @param {T} fn - Async function to wrap
 * @returns {(...args: Parameters<T>) => Promise<ReturnType<T> | void>} Wrapped function with error handling
 *
 * @example
 * const safeInit = asyncHandler(async (options) => {
 *   await initCommand(options);
 * });
 */
export function asyncHandler(fn) {
  return async (...args) => {
    try {
      return await fn(...args);
    } catch (error) {
      if (error instanceof FrameworkError) {
        console.error(error.format(process.env.VERBOSE === 'true'));
        process.exit(getExitCode(error.code));
      } else {
        // Wrap unknown errors
        const wrapped = createError('AIX-GEN-900', error.message, {
          cause: error,
          context: { originalStack: error.stack }
        });
        console.error(wrapped.format(true));
        process.exit(EXIT_CODES.GENERAL_ERROR);
      }
    }
  };
}

/**
 * Validates that a condition is true, throwing an error if not.
 *
 * @param {boolean} condition - Condition to check
 * @param {string} code - Error code to throw if condition is false
 * @param {string} [message] - Custom error message
 * @param {Object} [options] - Error options
 * @returns {void} Returns nothing; throws if condition is false
 * @throws {FrameworkError} If condition is false
 *
 * @example
 * assertCondition(fs.existsSync(path), 'AIX-FS-402', `File not found: ${path}`);
 */
export function assertCondition(condition, code, message, options) {
  if (!condition) {
    throw createError(code, message, options);
  }
}
