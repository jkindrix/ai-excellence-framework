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
 * Check if a value is a plain object (not null, array, or other special types)
 * @param {*} value - Value to check
 * @returns {boolean} True if plain object
 * @private
 */
function isPlainObject(value) {
  if (value === null || typeof value !== 'object') {
    return false;
  }
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

/**
 * Deep merge two objects, with source values taking precedence.
 * Arrays are replaced, not merged. Only plain objects are recursively merged.
 *
 * @param {Object} target - Target object
 * @param {Object} source - Source object (values override target)
 * @returns {Object} Merged object (new object, inputs are not mutated)
 * @private
 */
function deepMerge(target, source) {
  const result = { ...target };

  for (const key of Object.keys(source)) {
    const sourceValue = source[key];
    const targetValue = target[key];

    // If both values are plain objects, merge recursively
    if (isPlainObject(sourceValue) && isPlainObject(targetValue)) {
      result[key] = deepMerge(targetValue, sourceValue);
    } else {
      // Otherwise, source value wins (including arrays, primitives, null)
      result[key] = sourceValue;
    }
  }

  return result;
}

/**
 * Merge user configuration with defaults
 * Uses deep merge to properly handle nested configuration objects.
 *
 * @param {Object} userConfig - User-provided configuration
 * @param {PresetName} [userConfig.preset] - Preset to use as base
 * @param {MetricsConfig} [userConfig.metrics] - Metrics configuration overrides
 * @returns {PresetConfig} Merged configuration
 * @example
 * const config = mergeConfig({
 *   preset: 'full',
 *   metrics: { autoCollect: false }  // Override specific nested value
 * });
 */
export function mergeConfig(userConfig = {}) {
  const base = userConfig.preset
    ? deepMerge(DEFAULT_CONFIG, getPresetConfig(userConfig.preset))
    : { ...DEFAULT_CONFIG };

  return deepMerge(base, userConfig);
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
 * @deprecated **DEPRECATED - WILL BE REMOVED IN v2.0.0**
 *
 * **Timeline:**
 * - v1.0.0: Deprecated, async version introduced
 * - v1.5.0: Deprecation warning emitted at runtime (current)
 * - v2.0.0: Function will be removed entirely
 *
 * **Why deprecated:** This function uses synchronous I/O which blocks the event loop,
 * causing performance issues in async contexts. The async version provides identical
 * functionality without blocking.
 *
 * **Migration:** Replace all calls with the async version:
 * ```javascript
 * // Before (deprecated):
 * const parsed = readClaudeMd('/path/to/project');
 *
 * // After (recommended):
 * const parsed = await readClaudeMdAsync('/path/to/project');
 * ```
 *
 * @param {string} [cwd=process.cwd()] - Directory to read from
 * @returns {{raw: string, sections: Object.<string, string>}|null} Parsed CLAUDE.md or null
 * @throws {Error} If file exists but cannot be read (permissions, encoding issues)
 * @see {@link readClaudeMdAsync} - The recommended async replacement
 * @see https://nodejs.org/api/deprecations.html - Node.js deprecation guidelines
 */
export function readClaudeMd(cwd = process.cwd()) {
  // Emit deprecation warning (only once per process)
  // Note: This pattern is safe in Node.js's single-threaded execution model.
  // The flag is set synchronously before emitWarning, preventing re-entrancy.
  // In clustered environments, each worker process correctly emits one warning.
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
 * Uses try/catch with readFile instead of existsSync to avoid TOCTOU race conditions
 * and maintain fully async behavior.
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

  try {
    const content = await readFile(path, 'utf-8');
    return parseClaudeMd(content);
  } catch (error) {
    // Return null for file not found (ENOENT), re-throw other errors
    if (error.code === 'ENOENT') {
      return null;
    }
    throw error;
  }
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
 * ReDoS Prevention: All patterns use bounded quantifiers (e.g., {16,256} instead of {16,})
 * to prevent catastrophic backtracking on malformed input. Upper bounds are set based on
 * typical maximum lengths for each credential type plus reasonable buffer.
 *
 * Official Documentation Sources:
 * @see https://owasp.org/www-community/attacks/Regular_expression_Denial_of_Service_-_ReDoS - ReDoS prevention
 * @see https://platform.openai.com/docs/api-reference/authentication - OpenAI API keys
 * @see https://docs.anthropic.com/en/api/getting-started - Anthropic API keys (sk-ant-api03-*)
 * @see https://github.blog/engineering/platform-security/behind-githubs-new-authentication-token-formats/ - GitHub token formats
 * @see https://docs.stripe.com/keys - Stripe API key formats
 * @see https://docs.aws.amazon.com/IAM/latest/UserGuide/id_credentials_access-keys.html - AWS access keys
 * @see https://summitroute.com/blog/2018/06/20/aws_security_credential_formats/ - AWS credential formats (AKIA/ASIA)
 *
 * @type {Readonly<Object.<string, ReadonlyArray<{name: string, pattern: RegExp}>>>}
 * @see detectSecrets for usage
 */
export const SECRET_PATTERNS = Object.freeze({
  // Generic credential patterns
  // Upper bounds: API keys typically 32-128 chars, passwords/secrets up to 256 chars
  generic: Object.freeze([
    Object.freeze({ name: 'API Key', pattern: /api[_-]?key\s{0,5}[:=]\s{0,5}["'][^"']{16,256}["']/gi }),
    Object.freeze({ name: 'Password', pattern: /password\s{0,5}[:=]\s{0,5}["'][^"']{8,256}["']/gi }),
    Object.freeze({ name: 'Secret', pattern: /secret\s{0,5}[:=]\s{0,5}["'][^"']{8,256}["']/gi }),
    Object.freeze({ name: 'Bearer Token', pattern: /bearer\s{1,5}[a-zA-Z0-9_.-]{20,2048}/gi })
  ]),

  // AI/ML API Keys (2024-2025 formats)
  // OpenAI: sk-[48 chars], sk-proj-[variable], sk-admin-[variable]
  //   @see https://platform.openai.com/docs/api-reference/authentication
  //   @see https://platform.openai.com/docs/api-reference/project-api-keys
  // Anthropic: sk-ant-api03-[93+ chars]
  //   @see https://docs.anthropic.com/en/api/getting-started
  // Google: AIza[35 chars]
  //   @see https://cloud.google.com/docs/authentication/api-keys
  // xAI: xai-[variable]
  //   @see https://docs.x.ai/docs/overview
  // Perplexity: pplx-[variable]
  //   @see https://docs.perplexity.ai/guides/api-key-management
  // Hugging Face: hf_[variable]
  //   @see https://huggingface.co/docs/hub/en/security-tokens
  ai_ml: Object.freeze([
    Object.freeze({ name: 'OpenAI Key', pattern: /sk-[a-zA-Z0-9]{32,128}/g }),
    Object.freeze({ name: 'OpenAI Project Key', pattern: /sk-proj-[a-zA-Z0-9_-]{32,200}/g }),
    Object.freeze({ name: 'Anthropic Key', pattern: /sk-ant-[a-zA-Z0-9_-]{32,128}/g }),
    Object.freeze({ name: 'Google AI Key', pattern: /AIza[a-zA-Z0-9_-]{35}/g }),
    Object.freeze({ name: 'xAI Grok Key', pattern: /xai-[a-zA-Z0-9_-]{32,128}/g }),
    Object.freeze({ name: 'Perplexity Key', pattern: /pplx-[a-zA-Z0-9]{32,128}/g }),
    Object.freeze({ name: 'Hugging Face Token', pattern: /hf_[a-zA-Z0-9]{32,128}/g }),
    Object.freeze({ name: 'Cohere Key', pattern: /co-[a-zA-Z0-9]{32,64}/g }),
    Object.freeze({ name: 'Replicate Token', pattern: /r8_[a-zA-Z0-9]{32,64}/g }),
    Object.freeze({ name: 'Mistral Key', pattern: /mistral[_-]?api[_-]?key\s{0,5}[:=]\s{0,5}["'][a-zA-Z0-9]{32,64}["']/gi })
  ]),

  // Cloud Provider Keys
  // AWS: AKIA (long-term IAM) or ASIA (temporary STS credentials) + 16 chars
  //   @see https://docs.aws.amazon.com/IAM/latest/UserGuide/id_credentials_access-keys.html
  //   @see https://docs.aws.amazon.com/STS/latest/APIReference/API_GetAccessKeyInfo.html
  //   @see https://summitroute.com/blog/2018/06/20/aws_security_credential_formats/
  // Azure: Connection strings with AccountName (3-24 chars) and AccountKey (88 char base64)
  //   @see https://docs.microsoft.com/en-us/azure/storage/common/storage-configure-connection-string
  // GCP: Service account JSON files with "type": "service_account"
  //   @see https://cloud.google.com/iam/docs/keys-create-delete
  cloud: Object.freeze([
    Object.freeze({ name: 'AWS Access Key', pattern: /AKIA[0-9A-Z]{16}/g }),
    Object.freeze({ name: 'AWS STS Key', pattern: /ASIA[0-9A-Z]{16}/g }),
    Object.freeze({ name: 'AWS Secret Key', pattern: /aws[_-]?secret[_-]?access[_-]?key\s{0,5}[:=]\s{0,5}["'][a-zA-Z0-9/+=]{40}["']/gi }),
    Object.freeze({ name: 'Azure Connection String', pattern: /DefaultEndpointsProtocol=https;AccountName=[^;]{3,24};AccountKey=[a-zA-Z0-9+/=]{88}/g }),
    Object.freeze({ name: 'GCP Service Account', pattern: /"type"\s{0,5}:\s{0,5}"service_account"/g })
  ]),

  // Version Control Systems
  // GitHub: ghp_ (PAT), gho_ (OAuth), ghu_ (user-to-server), ghs_ (server-to-server), ghr_ (refresh)
  //   Format: prefix + 36 alphanumeric chars with 32-bit checksum in last 6 chars
  //   @see https://github.blog/engineering/platform-security/behind-githubs-new-authentication-token-formats/
  //   @see https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens
  // GitLab: glpat-[20-26 chars]
  //   @see https://docs.gitlab.com/ee/user/profile/personal_access_tokens.html
  // Bitbucket: ATBB[32 chars]
  //   @see https://support.atlassian.com/bitbucket-cloud/docs/app-passwords/
  vcs: Object.freeze([
    Object.freeze({ name: 'GitHub Token', pattern: /ghp_[a-zA-Z0-9]{36}/g }),
    Object.freeze({ name: 'GitHub OAuth', pattern: /gho_[a-zA-Z0-9]{36}/g }),
    Object.freeze({ name: 'GitHub App Token', pattern: /ghu_[a-zA-Z0-9]{36}/g }),
    Object.freeze({ name: 'GitHub Refresh Token', pattern: /ghr_[a-zA-Z0-9]{36}/g }),
    Object.freeze({ name: 'GitLab Token', pattern: /glpat-[a-zA-Z0-9-]{20,64}/g }),
    Object.freeze({ name: 'Bitbucket Token', pattern: /ATBB[a-zA-Z0-9]{32}/g })
  ]),

  // Communication Platforms
  // Slack: xoxb (bot), xoxp (user), xoxa (app), xoxr (refresh), xoxs (session)
  //   @see https://api.slack.com/authentication/token-types
  // Discord: Webhook format includes channel ID (17-20 digits) and token (60-80 chars)
  //   @see https://discord.com/developers/docs/resources/webhook
  // Twilio: Account SID (AC...) and Auth Token (32 hex chars)
  //   @see https://www.twilio.com/docs/iam/keys/api-key
  communication: Object.freeze([
    Object.freeze({ name: 'Slack Token', pattern: /xox[baprs]-[a-zA-Z0-9-]{10,255}/g }),
    Object.freeze({ name: 'Slack Webhook', pattern: /hooks\.slack\.com\/services\/T[a-zA-Z0-9_]{8,12}\/B[a-zA-Z0-9_]{8,12}\/[a-zA-Z0-9_]{20,30}/g }),
    Object.freeze({ name: 'Discord Webhook', pattern: /discord(?:app)?\.com\/api\/webhooks\/[0-9]{17,20}\/[a-zA-Z0-9_-]{60,80}/g }),
    Object.freeze({ name: 'Twilio Key', pattern: /SK[a-f0-9]{32}/g }),
    Object.freeze({ name: 'Twilio Auth Token', pattern: /twilio[_-]?auth[_-]?token\s{0,5}[:=]\s{0,5}["'][a-f0-9]{32}["']/gi })
  ]),

  // Payment Providers
  // Stripe: sk_live_/sk_test_ (secret), pk_live_/pk_test_ (publishable)
  //   @see https://docs.stripe.com/keys
  //   @see https://docs.stripe.com/api/authentication
  // PayPal: Client ID and Secret from developer portal
  //   @see https://developer.paypal.com/api/rest/authentication/
  payment: Object.freeze([
    Object.freeze({ name: 'Stripe Live Key', pattern: /sk_live_[a-zA-Z0-9]{24,256}/g }),
    Object.freeze({ name: 'Stripe Test Key', pattern: /sk_test_[a-zA-Z0-9]{24,256}/g }),
    Object.freeze({ name: 'Stripe Publishable', pattern: /pk_(live|test)_[a-zA-Z0-9]{24,256}/g }),
    Object.freeze({ name: 'PayPal Secret', pattern: /paypal[_-]?secret\s{0,5}[:=]\s{0,5}["'][a-zA-Z0-9]{32,80}["']/gi })
  ]),

  // Database Connection Strings
  // Standard URI format: protocol://username:password@host:port/database
  // Length limits {1,100} added to prevent ReDoS on malformed input
  //   @see https://www.mongodb.com/docs/manual/reference/connection-string/
  //   @see https://www.postgresql.org/docs/current/libpq-connect.html#LIBPQ-CONNSTRING
  //   @see https://dev.mysql.com/doc/connector-python/en/connector-python-connectargs.html
  //   @see https://redis.io/docs/connect/clients/
  database: Object.freeze([
    Object.freeze({ name: 'MongoDB URI', pattern: /mongodb(\+srv)?:\/\/[^:\s]{1,100}:[^@\s]{1,100}@[^\s]{1,200}/g }),
    Object.freeze({ name: 'PostgreSQL URI', pattern: /postgres(ql)?:\/\/[^:\s]{1,100}:[^@\s]{1,100}@[^\s]{1,200}/g }),
    Object.freeze({ name: 'MySQL URI', pattern: /mysql:\/\/[^:\s]{1,100}:[^@\s]{1,100}@[^\s]{1,200}/g }),
    Object.freeze({ name: 'Redis URI', pattern: /redis:\/\/[^:\s]{1,100}:[^@\s]{1,100}@[^\s]{1,200}/g })
  ]),

  // Package Registry Tokens
  // npm: npm_[36 chars] - granular access tokens
  //   @see https://docs.npmjs.com/creating-and-viewing-access-tokens
  // PyPI: pypi-[100-200 chars] - API tokens (project-scoped are longer)
  //   @see https://pypi.org/help/#apitoken
  registry: Object.freeze([
    Object.freeze({ name: 'npm Token', pattern: /npm_[a-zA-Z0-9]{36}/g }),
    Object.freeze({ name: 'PyPI Token', pattern: /pypi-[a-zA-Z0-9_-]{100,256}/g })
  ]),

  // Email/Marketing Services
  // SendGrid: SG.[22 chars].[43 chars] - API keys
  //   @see https://docs.sendgrid.com/ui/account-and-settings/api-keys
  // Mailchimp: [32 hex chars]-us[datacenter number]
  //   @see https://mailchimp.com/developer/marketing/guides/quick-start/
  email: Object.freeze([
    Object.freeze({ name: 'SendGrid Key', pattern: /SG\.[a-zA-Z0-9_-]{22}\.[a-zA-Z0-9_-]{43}/g }),
    Object.freeze({ name: 'Mailchimp Key', pattern: /[a-f0-9]{32}-us[0-9]{1,2}/g })
  ]),

  // Cryptographic Material
  // Private keys: PEM format with algorithm-specific headers
  //   @see https://www.rfc-editor.org/rfc/rfc7468 - PEM format specification
  // JWT: Header.Payload.Signature (base64url encoded)
  //   @see https://jwt.io - JWT structure reference
  //   @see https://www.rfc-editor.org/rfc/rfc7519 - JWT specification
  //   Signature lengths: HS256: 43, RS256: 342, EdDSA: 86-88
  crypto: Object.freeze([
    Object.freeze({ name: 'Private Key', pattern: /-----BEGIN (RSA |EC |DSA |OPENSSH |PGP )?PRIVATE KEY-----/g }),
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
    // Reset lastIndex for safety with global regex patterns
    // String.match() handles this internally, but explicit reset is defensive
    pattern.lastIndex = 0;
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
// Abort Signal Utilities
// ============================================

/**
 * Check if an abort signal has been triggered and throw if aborted.
 *
 * This enables cooperative cancellation within command handlers. Commands
 * should call this at natural checkpoints (e.g., between file operations)
 * to allow graceful cancellation.
 *
 * @param {AbortSignal|undefined} signal - The abort signal to check
 * @param {string} [context='Operation'] - Context for the error message
 * @throws {Error} If the signal has been aborted
 *
 * @example
 * async function longRunningCommand(options) {
 *   const signal = options._abortSignal;
 *
 *   // Check at natural checkpoints
 *   for (const file of files) {
 *     checkAbortSignal(signal, 'File processing');
 *     await processFile(file);
 *   }
 * }
 */
export function checkAbortSignal(signal, context = 'Operation') {
  if (signal?.aborted) {
    const error = new Error(`${context} aborted: ${signal.reason?.message || 'Cancelled'}`);
    error.name = 'AbortError';
    error.code = 'ERR_ABORT';
    throw error;
  }
}

/**
 * Wrap an async operation to respect abort signal.
 *
 * Creates a race between the operation and the abort signal,
 * rejecting immediately if the signal is triggered.
 *
 * @template T
 * @param {Promise<T>} promise - The promise to wrap
 * @param {AbortSignal|undefined} signal - The abort signal
 * @param {string} [context='Operation'] - Context for the error message
 * @returns {Promise<T>} The result of the original promise
 * @throws {Error} If aborted before completion
 *
 * @example
 * const result = await withAbortSignal(
 *   fetchData(url),
 *   options._abortSignal,
 *   'Data fetch'
 * );
 */
export async function withAbortSignal(promise, signal, context = 'Operation') {
  if (!signal) {
    return promise;
  }

  // Check if already aborted
  checkAbortSignal(signal, context);

  return Promise.race([
    promise,
    new Promise((_, reject) => {
      signal.addEventListener('abort', () => {
        const error = new Error(`${context} aborted: ${signal.reason?.message || 'Cancelled'}`);
        error.name = 'AbortError';
        error.code = 'ERR_ABORT';
        reject(error);
      }, { once: true });
    })
  ]);
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
  checkAbortSignal,
  withAbortSignal,
  getPackageRoot,
  getPresetPath
};
