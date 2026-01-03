/**
 * AI Excellence Framework - Input Validation Utilities
 *
 * Provides secure validation for paths, configurations, and user inputs.
 */

import { statSync, accessSync, constants } from 'fs';
import { resolve, isAbsolute, normalize, relative } from 'path';

/**
 * Validate that a path is safe and within allowed boundaries
 *
 * @param {string} inputPath - Path to validate
 * @param {object} options - Validation options
 * @param {string} [options.basePath] - Base path to restrict access within
 * @param {boolean} [options.mustExist=false] - Whether path must exist
 * @param {boolean} [options.mustBeDirectory=false] - Whether path must be a directory
 * @param {boolean} [options.mustBeFile=false] - Whether path must be a file
 * @param {boolean} [options.mustBeWritable=false] - Whether path must be writable
 * @returns {object} Validation result
 */
export function validatePath(inputPath, options = {}) {
  const result = {
    valid: false,
    path: null,
    error: null
  };

  // Check for empty or non-string input
  if (!inputPath || typeof inputPath !== 'string') {
    result.error = 'Path must be a non-empty string';
    return result;
  }

  // Normalize and resolve the path
  let normalizedPath;
  try {
    normalizedPath = normalize(inputPath);

    // Check for null bytes (common injection technique)
    if (normalizedPath.includes('\x00')) {
      result.error = 'Path contains invalid null bytes';
      return result;
    }

    // Resolve to absolute path
    normalizedPath = resolve(normalizedPath);
  } catch (err) {
    result.error = `Invalid path: ${err.message}`;
    return result;
  }

  // Check for path traversal if basePath is specified
  if (options.basePath) {
    const basePath = resolve(options.basePath);
    const relativePath = relative(basePath, normalizedPath);

    // Check if path escapes the base directory
    if (relativePath.startsWith('..') || isAbsolute(relativePath)) {
      result.error = 'Path traversal not allowed';
      return result;
    }
  }

  // Use a single statSync call to avoid TOCTOU race conditions.
  // The file could be deleted/changed between separate existsSync and statSync calls.
  // This approach is atomic: we either get stats or catch an error.
  let stats = null;
  let pathExists = false;

  try {
    stats = statSync(normalizedPath);
    pathExists = true;
  } catch (err) {
    // ENOENT means file doesn't exist - this is expected and not an error
    // Other errors (EACCES, etc.) should be reported
    if (err.code !== 'ENOENT') {
      result.error = `Cannot access path: ${err.message}`;
      return result;
    }
    // pathExists remains false
  }

  // Check existence requirement
  if (options.mustExist && !pathExists) {
    result.error = 'Path does not exist';
    return result;
  }

  // Check type (directory vs file) - only if path exists
  if (pathExists && stats) {
    if (options.mustBeDirectory && !stats.isDirectory()) {
      result.error = 'Path must be a directory';
      return result;
    }

    if (options.mustBeFile && !stats.isFile()) {
      result.error = 'Path must be a file';
      return result;
    }
  }

  // Check write permission - only if path exists
  if (options.mustBeWritable && pathExists) {
    try {
      accessSync(normalizedPath, constants.W_OK);
    } catch {
      result.error = 'Path is not writable';
      return result;
    }
  }

  result.valid = true;
  result.path = normalizedPath;
  return result;
}

/**
 * Validate a preset name
 *
 * Valid presets are:
 * - 'minimal', 'standard', 'full', 'team' - Predefined presets from PRESET_CONFIGS
 * - 'custom' - Special value indicating user-provided configuration (not in PRESET_CONFIGS)
 *
 * Note: 'custom' is intentionally valid here but not in PRESET_CONFIGS. When preset='custom',
 * the user is expected to provide their own commands, agents, and other configuration values
 * rather than inheriting from a predefined preset.
 *
 * @param {string} preset - Preset name to validate
 * @returns {object} Validation result
 */
export function validatePreset(preset) {
  // 'custom' is a special marker for user-provided configuration, not a preset in PRESET_CONFIGS
  const validPresets = ['minimal', 'standard', 'full', 'team', 'custom'];

  const result = {
    valid: false,
    preset: null,
    error: null
  };

  if (!preset || typeof preset !== 'string') {
    result.error = 'Preset must be a non-empty string';
    return result;
  }

  const normalized = preset.toLowerCase().trim();

  if (!validPresets.includes(normalized)) {
    result.error = `Invalid preset: ${preset}. Valid options: ${validPresets.join(', ')}`;
    return result;
  }

  result.valid = true;
  result.preset = normalized;
  return result;
}

/**
 * Validate a project name
 *
 * @param {string} name - Project name to validate
 * @returns {object} Validation result
 */
export function validateProjectName(name) {
  const result = {
    valid: false,
    name: null,
    error: null
  };

  if (!name || typeof name !== 'string') {
    result.error = 'Project name must be a non-empty string';
    return result;
  }

  const trimmed = name.trim();

  // Check length
  if (trimmed.length < 1 || trimmed.length > 214) {
    result.error = 'Project name must be between 1 and 214 characters';
    return result;
  }

  // Check for invalid characters
  if (/[<>:"/\\|?*\x00-\x1f]/.test(trimmed)) {
    result.error = 'Project name contains invalid characters';
    return result;
  }

  // Check for reserved names
  const reservedNames = ['con', 'prn', 'aux', 'nul', 'com1', 'lpt1'];
  if (reservedNames.includes(trimmed.toLowerCase())) {
    result.error = 'Project name is a reserved system name';
    return result;
  }

  result.valid = true;
  result.name = trimmed;
  return result;
}

/**
 * Validate configuration object
 *
 * @param {object} config - Configuration to validate
 * @returns {object} Validation result
 */
export function validateConfig(config) {
  const result = {
    valid: false,
    config: null,
    errors: []
  };

  if (!config || typeof config !== 'object') {
    result.errors.push('Configuration must be an object');
    return result;
  }

  // Required fields
  if (!config.version) {
    result.errors.push('Missing required field: version');
  } else if (!/^\d+\.\d+\.\d+/.test(config.version)) {
    result.errors.push('Invalid version format (expected semver)');
  }

  if (!config.preset) {
    result.errors.push('Missing required field: preset');
  } else {
    const presetValidation = validatePreset(config.preset);
    if (!presetValidation.valid) {
      result.errors.push(presetValidation.error);
    }
  }

  // Validate commands array
  if (config.commands && !Array.isArray(config.commands)) {
    result.errors.push('commands must be an array');
  }

  // Validate agents array
  if (config.agents && !Array.isArray(config.agents)) {
    result.errors.push('agents must be an array');
  }

  // Validate hooks object
  if (config.hooks && typeof config.hooks !== 'object' && typeof config.hooks !== 'boolean') {
    result.errors.push('hooks must be a boolean or object');
  }

  // Validate mcp object
  if (config.mcp && typeof config.mcp !== 'object' && typeof config.mcp !== 'boolean') {
    result.errors.push('mcp must be a boolean or object');
  } else if (config.mcp && typeof config.mcp === 'object') {
    // Validate mcp nested structure
    if (config.mcp.storage && !['sqlite', 'postgres'].includes(config.mcp.storage)) {
      result.errors.push('mcp.storage must be "sqlite" or "postgres"');
    }
    if (config.mcp.limits && typeof config.mcp.limits !== 'object') {
      result.errors.push('mcp.limits must be an object');
    }
  }

  // Validate metrics object
  if (config.metrics && typeof config.metrics !== 'object' && typeof config.metrics !== 'boolean') {
    result.errors.push('metrics must be a boolean or object');
  } else if (config.metrics && typeof config.metrics === 'object') {
    // Validate metrics nested structure
    if (config.metrics.enabled !== undefined && typeof config.metrics.enabled !== 'boolean') {
      result.errors.push('metrics.enabled must be a boolean');
    }
    if (config.metrics.autoCollect !== undefined && typeof config.metrics.autoCollect !== 'boolean') {
      result.errors.push('metrics.autoCollect must be a boolean');
    }
    if (config.metrics.directory !== undefined && typeof config.metrics.directory !== 'string') {
      result.errors.push('metrics.directory must be a string');
    }
  }

  // Validate security object
  if (config.security && typeof config.security !== 'object' && typeof config.security !== 'boolean') {
    result.errors.push('security must be a boolean or object');
  } else if (config.security && typeof config.security === 'object') {
    const securityBoolFields = ['preCommit', 'secretsDetection', 'dependencyScanning', 'aiPatternChecks'];
    for (const field of securityBoolFields) {
      if (config.security[field] !== undefined && typeof config.security[field] !== 'boolean') {
        result.errors.push(`security.${field} must be a boolean`);
      }
    }
  }

  // Validate team object
  if (config.team && typeof config.team !== 'object' && typeof config.team !== 'boolean') {
    result.errors.push('team must be a boolean or object');
  } else if (config.team && typeof config.team === 'object') {
    const teamBoolFields = ['enabled', 'sharedMemory', 'enforceConventions'];
    for (const field of teamBoolFields) {
      if (config.team[field] !== undefined && typeof config.team[field] !== 'boolean') {
        result.errors.push(`team.${field} must be a boolean`);
      }
    }
  }

  // Validate project object
  if (config.project && typeof config.project !== 'object') {
    result.errors.push('project must be an object');
  } else if (config.project && typeof config.project === 'object') {
    if (config.project.name !== undefined && typeof config.project.name !== 'string') {
      result.errors.push('project.name must be a string');
    }
    if (config.project.language !== undefined) {
      const validLanguages = ['typescript', 'javascript', 'python', 'go', 'rust', 'java', 'other'];
      if (!validLanguages.includes(config.project.language)) {
        result.errors.push(`project.language must be one of: ${validLanguages.join(', ')}`);
      }
    }
  }

  if (result.errors.length === 0) {
    result.valid = true;
    result.config = config;
  }

  return result;
}

/**
 * Sanitize a string for safe use
 *
 * @param {string} input - String to sanitize
 * @param {object} options - Sanitization options
 * @param {number} [options.maxLength=10000] - Maximum length
 * @param {boolean} [options.allowHtml=false] - Whether to allow HTML
 * @returns {string} Sanitized string
 */
export function sanitizeString(input, options = {}) {
  if (!input || typeof input !== 'string') {
    return '';
  }

  const maxLength = options.maxLength || 10000;

  let sanitized = input;

  // Remove null bytes
  sanitized = sanitized.replace(/\x00/g, '');

  // Truncate if too long
  if (sanitized.length > maxLength) {
    sanitized = `${sanitized.substring(0, maxLength)}... [truncated]`;
  }

  // Escape HTML if not allowed
  if (!options.allowHtml) {
    sanitized = sanitized
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  return sanitized.trim();
}

/**
 * Comprehensive patterns for detecting standalone secret values.
 * These patterns are designed to match isolated values (not embedded in context).
 * Aligned with SECRET_PATTERNS in index.js but adapted for single-value checking.
 *
 * @see {@link ../index.js} SECRET_PATTERNS for content scanning patterns
 */
const STANDALONE_SECRET_PATTERNS = [
  // AI/ML API Keys
  /^sk-[a-zA-Z0-9]{32,}$/, // OpenAI
  /^sk-ant-[a-zA-Z0-9_-]{32,}$/, // Anthropic
  /^AIza[a-zA-Z0-9_-]{35}$/, // Google AI

  // Cloud Provider Keys
  /^AKIA[0-9A-Z]{16}$/, // AWS Access Key ID (long-term credentials)
  /^ASIA[0-9A-Z]{16}$/, // AWS Access Key ID (temporary STS credentials)
  // NOTE: AWS Secret Keys are 40-char base64 strings without distinctive prefixes,
  // making standalone detection prone to false positives. Secret keys are detected
  // via context patterns in SECRET_PATTERNS (index.js) like "aws_secret_access_key="
  // @see https://summitroute.com/blog/2018/06/20/aws_security_credential_formats/

  // Version Control Systems
  /^ghp_[a-zA-Z0-9]{36}$/, // GitHub Personal Access Token
  /^gho_[a-zA-Z0-9]{36}$/, // GitHub OAuth Token
  /^ghu_[a-zA-Z0-9]{36}$/, // GitHub User Token
  /^ghr_[a-zA-Z0-9]{36}$/, // GitHub Refresh Token
  /^glpat-[a-zA-Z0-9-]{20,}$/, // GitLab Token
  /^ATBB[a-zA-Z0-9]{32}$/, // Bitbucket Token

  // Communication Platforms
  /^xox[baprs]-[a-zA-Z0-9-]{10,}$/, // Slack Token
  /^SK[a-f0-9]{32}$/, // Twilio Key

  // Payment Providers
  /^sk_live_[a-zA-Z0-9]{24,}$/, // Stripe Live Key
  /^sk_test_[a-zA-Z0-9]{24,}$/, // Stripe Test Key
  /^pk_(live|test)_[a-zA-Z0-9]{24,}$/, // Stripe Publishable Key

  // Package Registry Tokens
  /^npm_[a-zA-Z0-9]{36}$/, // npm Token
  /^pypi-[a-zA-Z0-9_-]{100,}$/, // PyPI Token

  // Email Services
  /^SG\.[a-zA-Z0-9_-]{22}\.[a-zA-Z0-9_-]{43}$/, // SendGrid

  // Cryptographic Material
  /^-----BEGIN (RSA |EC |DSA |OPENSSH |PGP )?PRIVATE KEY-----/, // Private Keys
  /^eyJ[a-zA-Z0-9_-]{17,200}\.eyJ[a-zA-Z0-9_-]{17,500}\.[a-zA-Z0-9_-]{40,500}$/ // JWT (bounded)

  // NOTE: Generic hex patterns (32/40/64 char) removed due to excessive false positives:
  // - 32-char hex matches MD5 hashes (common in checksums, cache keys)
  // - 40-char hex matches git commit SHAs (extremely common in codebases)
  // - 64-char hex matches SHA256 hashes (used everywhere for integrity checks)
  // Secrets that are pure hex are rare; most have distinctive prefixes caught above.
];

/**
 * Check if a string looks like a secret
 *
 * Uses comprehensive patterns aligned with SECRET_PATTERNS from index.js,
 * but optimized for checking standalone values rather than scanning content.
 *
 * @param {string} value - Value to check
 * @returns {boolean} True if value looks like a secret
 */
export function looksLikeSecret(value) {
  if (!value || typeof value !== 'string') {
    return false;
  }

  // Trim whitespace for matching
  const trimmed = value.trim();

  // Quick length check - secrets are usually 16+ characters
  if (trimmed.length < 16) {
    return false;
  }

  return STANDALONE_SECRET_PATTERNS.some(pattern => pattern.test(trimmed));
}

export default {
  validatePath,
  validatePreset,
  validateProjectName,
  validateConfig,
  sanitizeString,
  looksLikeSecret
};
