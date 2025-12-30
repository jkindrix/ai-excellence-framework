/**
 * AI Excellence Framework
 *
 * A comprehensive framework for reducing friction in AI-assisted software development.
 *
 * @module ai-excellence-framework
 * @see https://ai-excellence-framework.github.io/
 *
 * @example
 * // Programmatic usage
 * import { initCommand, validateCommand, VERSION } from 'ai-excellence-framework';
 *
 * // Initialize framework in a directory
 * const result = await initCommand({ preset: 'standard', yes: true });
 *
 * // Validate installation
 * const validation = await validateCommand({ verbose: true });
 *
 * @example
 * // Error handling
 * import { createError, FrameworkError, EXIT_CODES } from 'ai-excellence-framework/errors';
 *
 * try {
 *   await riskyOperation();
 * } catch (error) {
 *   if (error instanceof FrameworkError) {
 *     console.error(error.format());
 *     process.exit(EXIT_CODES[error.code.split('-')[1]] || 1);
 *   }
 *   throw error;
 * }
 */

// ============================================
// Command Exports
// ============================================

export { initCommand } from './commands/init.js';
export { validateCommand } from './commands/validate.js';
export { updateCommand } from './commands/update.js';
export { doctorCommand } from './commands/doctor.js';

// ============================================
// Error System Exports
// ============================================

export {
  FrameworkError,
  ERROR_CODES,
  EXIT_CODES,
  createError,
  getExitCode,
  asyncHandler,
  assertCondition
} from './errors.js';

// ============================================
// Constants
// ============================================

/**
 * Framework version (semver)
 * @constant {string}
 */
export const VERSION = '1.1.0';

/**
 * Available presets for initialization
 * @constant {string[]}
 */
export const PRESETS = ['minimal', 'standard', 'full', 'team'];

/**
 * Available slash commands
 * @constant {string[]}
 */
export const COMMANDS = [
  'plan',
  'verify',
  'handoff',
  'assumptions',
  'review',
  'security-review',
  'refactor',
  'test-coverage'
];

/**
 * Available agents
 * @constant {string[]}
 */
export const AGENTS = ['explorer', 'reviewer', 'tester'];

/**
 * Default configuration applied when no options specified
 * @constant {Object}
 */
export const DEFAULT_CONFIG = {
  version: VERSION,
  preset: 'standard',
  commands: ['plan', 'verify', 'handoff', 'assumptions', 'review', 'security-review'],
  agents: ['reviewer', 'explorer', 'tester'],
  hooks: true,
  mcp: false,
  preCommit: true,
  metrics: {
    enabled: false,
    autoCollect: false
  }
};

/**
 * Preset configurations
 * @constant {Object}
 */
export const PRESET_CONFIGS = {
  minimal: {
    description: 'CLAUDE.md + essential commands only',
    commands: ['plan', 'verify'],
    agents: [],
    hooks: false,
    mcp: false,
    preCommit: false
  },
  standard: {
    description: 'Recommended setup for individual developers',
    commands: ['plan', 'verify', 'handoff', 'assumptions', 'review', 'security-review'],
    agents: ['reviewer', 'explorer', 'tester'],
    hooks: true,
    mcp: false,
    preCommit: true
  },
  full: {
    description: 'Complete setup with MCP server and metrics',
    commands: ['plan', 'verify', 'handoff', 'assumptions', 'review', 'security-review', 'refactor', 'test-coverage'],
    agents: ['reviewer', 'explorer', 'tester'],
    hooks: true,
    mcp: true,
    preCommit: true,
    metrics: { enabled: true, autoCollect: true }
  },
  team: {
    description: 'Full setup with team collaboration features',
    commands: ['plan', 'verify', 'handoff', 'assumptions', 'review', 'security-review', 'refactor', 'test-coverage'],
    agents: ['reviewer', 'explorer', 'tester'],
    hooks: true,
    mcp: true,
    preCommit: true,
    metrics: { enabled: true, autoCollect: true },
    federation: true
  }
};

// ============================================
// Utility Functions
// ============================================

/**
 * Get configuration for a preset
 * @param {string} presetName - Name of the preset
 * @returns {Object} Preset configuration
 */
export function getPresetConfig(presetName) {
  return PRESET_CONFIGS[presetName] || PRESET_CONFIGS.standard;
}

/**
 * Merge user configuration with defaults
 * @param {Object} userConfig - User-provided configuration
 * @returns {Object} Merged configuration
 */
export function mergeConfig(userConfig = {}) {
  const base = userConfig.preset
    ? { ...DEFAULT_CONFIG, ...getPresetConfig(userConfig.preset) }
    : DEFAULT_CONFIG;

  return {
    ...base,
    ...userConfig,
    // Deep merge for nested objects
    metrics: {
      ...base.metrics,
      ...(userConfig.metrics || {})
    }
  };
}
