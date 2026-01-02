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
// Type Definitions (JSDoc for IDE support)
// ============================================

/**
 * @typedef {'minimal' | 'standard' | 'full' | 'team'} PresetName
 * Valid preset names for framework initialization
 */

/**
 * @typedef {'plan' | 'verify' | 'handoff' | 'assumptions' | 'review' | 'security-review' | 'refactor' | 'test-coverage'} CommandName
 * Available slash command names
 */

/**
 * @typedef {'reviewer' | 'explorer' | 'tester'} AgentName
 * Available subagent names
 */

/**
 * @typedef {Object} MetricsConfig
 * @property {boolean} [enabled=false] - Whether metrics collection is enabled
 * @property {boolean} [autoCollect=false] - Whether to automatically collect metrics
 */

/**
 * @typedef {Object} PresetConfig
 * @property {string} description - Human-readable description of the preset
 * @property {CommandName[]} commands - List of commands included in this preset
 * @property {AgentName[]} agents - List of agents included in this preset
 * @property {boolean} hooks - Whether git hooks are enabled
 * @property {boolean} mcp - Whether MCP server is enabled
 * @property {boolean} preCommit - Whether pre-commit configuration is included
 * @property {MetricsConfig} [metrics] - Optional metrics configuration
 * @property {boolean} [federation] - Whether team federation is enabled
 */

/**
 * @typedef {Object} InstallationStatus
 * @property {boolean} installed - Whether the framework is installed
 * @property {PresetName|null} preset - Detected preset level, or null if not installed
 * @property {Object} checks - Individual component check results
 * @property {boolean} checks.claudeMd - Whether CLAUDE.md exists
 * @property {boolean} checks.commandsDir - Whether .claude/commands exists
 * @property {boolean} checks.agentsDir - Whether .claude/agents exists
 * @property {boolean} checks.preCommit - Whether .pre-commit-config.yaml exists
 * @property {boolean} checks.mcpServer - Whether MCP server is installed
 */

/**
 * @typedef {Object} SecretMatch
 * @property {string} name - Name of the secret pattern that matched
 * @property {string} category - Category of the secret (e.g., 'ai', 'cloud', 'database')
 * @property {string} match - The matched secret value
 * @property {number} line - Line number where the secret was found
 */

/**
 * @typedef {Object} ClaudeMdStructure
 * @property {boolean} valid - Whether the structure is valid
 * @property {string[]} missingSections - List of missing required sections
 * @property {string[]} presentSections - List of present sections
 * @property {Object.<string, string>} [sections] - Parsed section contents (if available)
 */

// ============================================
// Command Exports
// ============================================

export { initCommand } from './commands/init.js';
export { validateCommand } from './commands/validate.js';
export { updateCommand } from './commands/update.js';
export { doctorCommand } from './commands/doctor.js';
export { generateCommand, SUPPORTED_TOOLS } from './commands/generate.js';
export { lintCommand } from './commands/lint.js';
export { uninstall } from './commands/uninstall.js';
export { detectCommand, detectTools } from './commands/detect.js';

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

import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const packageJson = require('../package.json');

/**
 * Framework version (semver) - read from package.json to avoid duplication
 * @constant {string}
 */
export const VERSION = packageJson.version;

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
 * @param {PresetName} presetName - Name of the preset
 * @returns {PresetConfig} Preset configuration
 */
export function getPresetConfig(presetName) {
  return PRESET_CONFIGS[presetName] || PRESET_CONFIGS.standard;
}

/**
 * Merge user configuration with defaults
 * @param {Object} userConfig - User-provided configuration
 * @param {PresetName} [userConfig.preset] - Preset to use as base
 * @param {MetricsConfig} [userConfig.metrics] - Metrics configuration overrides
 * @returns {PresetConfig} Merged configuration
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
import { readFile } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PACKAGE_ROOT = join(__dirname, '..');

/**
 * Check if framework is installed in a directory
 * @param {string} [cwd=process.cwd()] - Directory to check
 * @returns {InstallationStatus} Installation status with component checks
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
 * Read and parse CLAUDE.md (synchronous version)
 *
 * **WARNING:** This function uses synchronous I/O which blocks the event loop.
 * It is retained only for backward compatibility with existing integrations.
 *
 * @param {string} [cwd=process.cwd()] - Directory to read from
 * @returns {{raw: string, sections: Object.<string, string>}|null} Parsed CLAUDE.md or null
 * @deprecated Since v1.0.0. Use {@link readClaudeMdAsync} instead for better performance.
 *   This function will be removed in v2.0.0.
 * @internal This function is not recommended for new code. It remains exported
 *   only for backward compatibility and may be removed in future major versions.
 * @example
 * // Preferred: Use async version
 * const parsed = await readClaudeMdAsync('/path/to/project');
 *
 * // Legacy: Synchronous version (deprecated)
 * const parsed = readClaudeMd('/path/to/project');
 */
export function readClaudeMd(cwd = process.cwd()) {
  // Emit deprecation warning (only once per process)
  if (!readClaudeMd._warned) {
    readClaudeMd._warned = true;
    process.emitWarning(
      'readClaudeMd() is deprecated. Use readClaudeMdAsync() instead for better performance.',
      {
        type: 'DeprecationWarning',
        code: 'AIX_DEP_001',
        detail: 'Synchronous file reads block the event loop. See: https://nodejs.org/api/deprecations.html'
      }
    );
  }

  const path = join(cwd, 'CLAUDE.md');
  if (!existsSync(path)) {
    return null;
  }

  const content = readFileSync(path, 'utf-8');
  return parseClaudeMd(content);
}
// Track if deprecation warning has been emitted
readClaudeMd._warned = false;

/**
 * Read and parse CLAUDE.md (async version)
 *
 * Preferred for command handlers and async contexts to avoid blocking the event loop.
 * This is the recommended way to read CLAUDE.md files.
 *
 * @param {string} [cwd=process.cwd()] - Directory to read from
 * @returns {Promise<{raw: string, sections: Object.<string, string>}|null>} Parsed CLAUDE.md or null if file doesn't exist
 * @example
 * const parsed = await readClaudeMdAsync('/path/to/project');
 * if (parsed) {
 *   console.log(parsed.sections['Overview']);
 * }
 */
export async function readClaudeMdAsync(cwd = process.cwd()) {
  const path = join(cwd, 'CLAUDE.md');
  if (!existsSync(path)) {
    return null;
  }

  const content = await readFile(path, 'utf-8');
  return parseClaudeMd(content);
}

/**
 * Parse CLAUDE.md content into sections
 *
 * Extracts level-2 headings (## Section) and their content into a structured object.
 *
 * @param {string} content - CLAUDE.md content
 * @returns {{raw: string, sections: Object.<string, string>}} Object containing raw content and parsed sections
 * @example
 * const { sections } = parseClaudeMd(markdownContent);
 * console.log(sections['Overview']); // Content under ## Overview
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
 * Secret detection patterns organized by category.
 *
 * All patterns are pre-compiled RegExp literals for optimal performance.
 * RegExp literals in JavaScript are compiled once at parse time, making them
 * more efficient than creating new RegExp objects at runtime.
 *
 * The object is frozen with Object.freeze() to prevent accidental mutation.
 *
 * @type {Readonly<Object.<string, ReadonlyArray<{name: string, pattern: RegExp}>>>}
 * @see detectSecrets for usage
 */
export const SECRET_PATTERNS = Object.freeze({
  // Generic credential patterns
  generic: Object.freeze([
    Object.freeze({ name: 'API Key', pattern: /api[_-]?key\s*[:=]\s*["'][^"']{16,}["']/gi }),
    Object.freeze({ name: 'Password', pattern: /password\s*[:=]\s*["'][^"']{8,}["']/gi }),
    Object.freeze({ name: 'Secret', pattern: /secret\s*[:=]\s*["'][^"']{8,}["']/gi }),
    Object.freeze({ name: 'Bearer Token', pattern: /bearer\s+[a-zA-Z0-9_.-]{20,}/gi })
  ]),

  // AI/ML API Keys
  ai_ml: Object.freeze([
    Object.freeze({ name: 'OpenAI Key', pattern: /sk-[a-zA-Z0-9]{32,}/g }),
    Object.freeze({ name: 'Anthropic Key', pattern: /sk-ant-[a-zA-Z0-9_-]{32,}/g }),
    Object.freeze({ name: 'Google AI Key', pattern: /AIza[a-zA-Z0-9_-]{35}/g })
  ]),

  // Cloud Provider Keys
  cloud: Object.freeze([
    Object.freeze({ name: 'AWS Access Key', pattern: /AKIA[0-9A-Z]{16}/g }),
    Object.freeze({ name: 'AWS Secret Key', pattern: /aws[_-]?secret[_-]?access[_-]?key\s*[:=]\s*["'][a-zA-Z0-9/+=]{40}["']/gi }),
    Object.freeze({ name: 'Azure Connection String', pattern: /DefaultEndpointsProtocol=https;AccountName=[^;]+;AccountKey=[a-zA-Z0-9+/=]{88}/g }),
    Object.freeze({ name: 'GCP Service Account', pattern: /"type"\s*:\s*"service_account"/g })
  ]),

  // Version Control Systems
  vcs: Object.freeze([
    Object.freeze({ name: 'GitHub Token', pattern: /ghp_[a-zA-Z0-9]{36}/g }),
    Object.freeze({ name: 'GitHub OAuth', pattern: /gho_[a-zA-Z0-9]{36}/g }),
    Object.freeze({ name: 'GitHub App Token', pattern: /ghu_[a-zA-Z0-9]{36}/g }),
    Object.freeze({ name: 'GitHub Refresh Token', pattern: /ghr_[a-zA-Z0-9]{36}/g }),
    Object.freeze({ name: 'GitLab Token', pattern: /glpat-[a-zA-Z0-9-]{20}/g }),
    Object.freeze({ name: 'Bitbucket Token', pattern: /ATBB[a-zA-Z0-9]{32}/g })
  ]),

  // Communication Platforms
  communication: Object.freeze([
    Object.freeze({ name: 'Slack Token', pattern: /xox[baprs]-[a-zA-Z0-9-]{10,}/g }),
    Object.freeze({ name: 'Slack Webhook', pattern: /hooks\.slack\.com\/services\/T[a-zA-Z0-9_]+\/B[a-zA-Z0-9_]+\/[a-zA-Z0-9_]+/g }),
    Object.freeze({ name: 'Discord Webhook', pattern: /discord(?:app)?\.com\/api\/webhooks\/[0-9]+\/[a-zA-Z0-9_-]+/g }),
    Object.freeze({ name: 'Twilio Key', pattern: /SK[a-f0-9]{32}/g }),
    Object.freeze({ name: 'Twilio Auth Token', pattern: /twilio[_-]?auth[_-]?token\s*[:=]\s*["'][a-f0-9]{32}["']/gi })
  ]),

  // Payment Providers
  payment: Object.freeze([
    Object.freeze({ name: 'Stripe Live Key', pattern: /sk_live_[a-zA-Z0-9]{24,}/g }),
    Object.freeze({ name: 'Stripe Test Key', pattern: /sk_test_[a-zA-Z0-9]{24,}/g }),
    Object.freeze({ name: 'Stripe Publishable', pattern: /pk_(live|test)_[a-zA-Z0-9]{24,}/g }),
    Object.freeze({ name: 'PayPal Secret', pattern: /paypal[_-]?secret\s*[:=]\s*["'][a-zA-Z0-9]{32,}["']/gi })
  ]),

  // Database Connection Strings
  // Note: Length limits {1,100} added to prevent ReDoS on malformed input
  database: Object.freeze([
    Object.freeze({ name: 'MongoDB URI', pattern: /mongodb(\+srv)?:\/\/[^:\s]{1,100}:[^@\s]{1,100}@[^\s]{1,200}/g }),
    Object.freeze({ name: 'PostgreSQL URI', pattern: /postgres(ql)?:\/\/[^:\s]{1,100}:[^@\s]{1,100}@[^\s]{1,200}/g }),
    Object.freeze({ name: 'MySQL URI', pattern: /mysql:\/\/[^:\s]{1,100}:[^@\s]{1,100}@[^\s]{1,200}/g }),
    Object.freeze({ name: 'Redis URI', pattern: /redis:\/\/[^:\s]{1,100}:[^@\s]{1,100}@[^\s]{1,200}/g })
  ]),

  // Package Registry Tokens
  registry: Object.freeze([
    Object.freeze({ name: 'npm Token', pattern: /npm_[a-zA-Z0-9]{36}/g }),
    Object.freeze({ name: 'PyPI Token', pattern: /pypi-[a-zA-Z0-9_-]{100,}/g })
  ]),

  // Email/Marketing Services
  email: Object.freeze([
    Object.freeze({ name: 'SendGrid Key', pattern: /SG\.[a-zA-Z0-9_-]{22}\.[a-zA-Z0-9_-]{43}/g }),
    Object.freeze({ name: 'Mailchimp Key', pattern: /[a-f0-9]{32}-us[0-9]{1,2}/g })
  ]),

  // Cryptographic Material
  crypto: Object.freeze([
    Object.freeze({ name: 'Private Key', pattern: /-----BEGIN (RSA |EC |DSA |OPENSSH |PGP )?PRIVATE KEY-----/g }),
    // JWT pattern with min/max lengths to reduce false positives and prevent ReDoS:
    // - Header (eyJ...): 17-200 chars (typical: 30-100, allows for custom claims)
    // - Payload (eyJ...): 17-5000 chars (typical: 50-2000, allows for large payloads)
    // - Signature: 40-500 chars (HS256: 43, RS256: 342, EdDSA: 86-88)
    // Upper bounds prevent catastrophic backtracking on malformed input
    // @see https://jwt.io for JWT structure reference
    Object.freeze({ name: 'JWT Token', pattern: /eyJ[a-zA-Z0-9_-]{17,200}\.eyJ[a-zA-Z0-9_-]{17,5000}\.[a-zA-Z0-9_-]{40,500}/g })
  ])
});

/**
 * Get all secret patterns as a flat array
 * @returns {Array<{name: string, pattern: RegExp, category: string}>}
 */
export function getAllSecretPatterns() {
  const patterns = [];
  for (const [category, categoryPatterns] of Object.entries(SECRET_PATTERNS)) {
    for (const { name, pattern } of categoryPatterns) {
      patterns.push({ name, pattern, category });
    }
  }
  return patterns;
}

/**
 * Check for potential secrets in content
 * @param {string} content - Content to check
 * @param {Object} [options] - Detection options
 * @param {string[]} [options.categories] - Categories to check (default: all)
 * @returns {Object} Detection result with category information
 */
export function detectSecrets(content, options = {}) {
  const patterns = options.categories
    ? options.categories.flatMap(cat => (SECRET_PATTERNS[cat] || []).map(p => ({ ...p, category: cat })))
    : getAllSecretPatterns();

  const findings = [];
  for (const { name, pattern, category } of patterns) {
    const matches = content.match(pattern);
    if (matches) {
      findings.push({ type: name, category, count: matches.length });
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
  readClaudeMdAsync,
  parseClaudeMd,
  detectSecrets,
  validateClaudeMdStructure,
  getPackageRoot,
  getPresetPath
};
