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
export const VERSION = '1.3.0';

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
    preCommit: true
  },
  full: {
    description: 'Complete setup with MCP server and metrics',
    commands: [
      'plan',
      'verify',
      'handoff',
      'assumptions',
      'review',
      'security-review',
      'refactor',
      'test-coverage'
    ],
    agents: ['reviewer', 'explorer', 'tester'],
    hooks: true,
    mcp: true,
    preCommit: true,
    metrics: { enabled: true, autoCollect: true }
  },
  team: {
    description: 'Full setup with team collaboration features',
    commands: [
      'plan',
      'verify',
      'handoff',
      'assumptions',
      'review',
      'security-review',
      'refactor',
      'test-coverage'
    ],
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

// ============================================
// File System Utilities
// ============================================

import { existsSync, readFileSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PACKAGE_ROOT = join(__dirname, '..');

/**
 * Check if framework is installed in a directory
 * @param {string} [cwd=process.cwd()] - Directory to check
 * @returns {Object} Installation status
 */
export function checkInstallation(cwd = process.cwd()) {
  const checks = {
    claudeMd: existsSync(join(cwd, 'CLAUDE.md')),
    commandsDir: existsSync(join(cwd, '.claude', 'commands')),
    agentsDir: existsSync(join(cwd, '.claude', 'agents')),
    preCommit: existsSync(join(cwd, '.pre-commit-config.yaml')),
    mcpServer: existsSync(join(cwd, 'scripts', 'mcp', 'project-memory-server.py'))
  };

  const installed = checks.claudeMd && checks.commandsDir;

  let preset = null;
  if (installed) {
    if (checks.mcpServer) {
      preset = 'full';
    } else if (checks.preCommit && checks.agentsDir) {
      preset = 'standard';
    } else {
      preset = 'minimal';
    }
  }

  return { installed, preset, checks };
}

/**
 * Get list of installed slash commands
 * @param {string} [cwd=process.cwd()] - Directory to check
 * @returns {string[]} List of command names
 */
export function listInstalledCommands(cwd = process.cwd()) {
  const commandsDir = join(cwd, '.claude', 'commands');
  if (!existsSync(commandsDir)) {
    return [];
  }

  try {
    return readdirSync(commandsDir)
      .filter(f => f.endsWith('.md'))
      .map(f => f.replace('.md', ''));
  } catch {
    return [];
  }
}

/**
 * Get list of installed agents
 * @param {string} [cwd=process.cwd()] - Directory to check
 * @returns {string[]} List of agent names
 */
export function listInstalledAgents(cwd = process.cwd()) {
  const agentsDir = join(cwd, '.claude', 'agents');
  if (!existsSync(agentsDir)) {
    return [];
  }

  try {
    return readdirSync(agentsDir)
      .filter(f => f.endsWith('.md'))
      .map(f => f.replace('.md', ''));
  } catch {
    return [];
  }
}

/**
 * Read and parse CLAUDE.md
 * @param {string} [cwd=process.cwd()] - Directory to read from
 * @returns {Object|null} Parsed CLAUDE.md or null
 */
export function readClaudeMd(cwd = process.cwd()) {
  const path = join(cwd, 'CLAUDE.md');
  if (!existsSync(path)) {
    return null;
  }

  const content = readFileSync(path, 'utf-8');
  return parseClaudeMd(content);
}

/**
 * Parse CLAUDE.md content into sections
 * @param {string} content - CLAUDE.md content
 * @returns {Object} Parsed sections
 */
export function parseClaudeMd(content) {
  const sections = {};
  const lines = content.split('\n');
  let currentSection = null;
  let currentContent = [];

  for (const line of lines) {
    const match = line.match(/^##\s+(.+)$/);
    if (match) {
      if (currentSection) {
        sections[currentSection] = currentContent.join('\n').trim();
      }
      currentSection = match[1];
      currentContent = [];
    } else if (currentSection) {
      currentContent.push(line);
    }
  }

  if (currentSection) {
    sections[currentSection] = currentContent.join('\n').trim();
  }

  return { raw: content, sections };
}

/**
 * Check for potential secrets in content
 * @param {string} content - Content to check
 * @returns {Object} Detection result
 */
export function detectSecrets(content) {
  const patterns = [
    { name: 'API Key', pattern: /api[_-]?key\s*[:=]\s*["'][^"']{16,}["']/gi },
    { name: 'Password', pattern: /password\s*[:=]\s*["'][^"']{8,}["']/gi },
    { name: 'Secret', pattern: /secret\s*[:=]\s*["'][^"']{8,}["']/gi },
    { name: 'OpenAI Key', pattern: /sk-[a-zA-Z0-9]{32,}/g },
    { name: 'GitHub Token', pattern: /ghp_[a-zA-Z0-9]{36}/g },
    { name: 'GitLab Token', pattern: /glpat-[a-zA-Z0-9-]{20}/g },
    { name: 'AWS Key', pattern: /AKIA[0-9A-Z]{16}/g },
    { name: 'Private Key', pattern: /-----BEGIN (RSA |EC |DSA )?PRIVATE KEY-----/g }
  ];

  const findings = [];
  for (const { name, pattern } of patterns) {
    const matches = content.match(pattern);
    if (matches) {
      findings.push({ type: name, count: matches.length });
    }
  }

  return { clean: findings.length === 0, findings };
}

/**
 * Validate CLAUDE.md structure
 * @param {string} content - CLAUDE.md content
 * @returns {Object} Validation result
 */
export function validateClaudeMdStructure(content) {
  const required = ['Overview', 'Tech Stack', 'Current State'];
  const recommended = ['Architecture', 'Conventions', 'Common Commands', 'Session Instructions'];

  const { sections } = parseClaudeMd(content);
  const sectionNames = Object.keys(sections);

  const missingRequired = required.filter(s => !sectionNames.includes(s));
  const missingRecommended = recommended.filter(s => !sectionNames.includes(s));

  return {
    valid: missingRequired.length === 0,
    missingRequired,
    missingRecommended,
    sections: sectionNames
  };
}

/**
 * Get framework package root path
 * @returns {string} Package root path
 */
export function getPackageRoot() {
  return PACKAGE_ROOT;
}

/**
 * Get path to a preset template
 * @param {string} preset - Preset name
 * @returns {string|null} Path or null if not found
 */
export function getPresetPath(preset) {
  if (!PRESETS.includes(preset)) {
    return null;
  }
  const path = join(PACKAGE_ROOT, 'templates', 'presets', preset);
  return existsSync(path) ? path : null;
}

// ============================================
// Default Export
// ============================================

export default {
  VERSION,
  PRESETS,
  COMMANDS,
  AGENTS,
  DEFAULT_CONFIG,
  PRESET_CONFIGS,
  getPresetConfig,
  mergeConfig,
  checkInstallation,
  listInstalledCommands,
  listInstalledAgents,
  readClaudeMd,
  parseClaudeMd,
  detectSecrets,
  validateClaudeMdStructure,
  getPackageRoot,
  getPresetPath
};
