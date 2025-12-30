/**
 * AI Excellence Framework - Input Validation Utilities
 *
 * Provides secure validation for paths, configurations, and user inputs.
 */

import { existsSync, statSync, accessSync, constants } from 'fs';
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

  // Check existence
  const pathExists = existsSync(normalizedPath);

  if (options.mustExist && !pathExists) {
    result.error = 'Path does not exist';
    return result;
  }

  // Check type (directory vs file)
  if (pathExists) {
    try {
      const stats = statSync(normalizedPath);

      if (options.mustBeDirectory && !stats.isDirectory()) {
        result.error = 'Path must be a directory';
        return result;
      }

      if (options.mustBeFile && !stats.isFile()) {
        result.error = 'Path must be a file';
        return result;
      }
    } catch (err) {
      result.error = `Cannot read path: ${err.message}`;
      return result;
    }
  }

  // Check write permission
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
 * @param {string} preset - Preset name to validate
 * @returns {object} Validation result
 */
export function validatePreset(preset) {
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
 * Check if a string looks like a secret
 *
 * @param {string} value - Value to check
 * @returns {boolean} True if value looks like a secret
 */
export function looksLikeSecret(value) {
  if (!value || typeof value !== 'string') {
    return false;
  }

  const secretPatterns = [
    /^sk-[a-zA-Z0-9]{32,}$/,
    /^ghp_[a-zA-Z0-9]{36}$/,
    /^gho_[a-zA-Z0-9]{36}$/,
    /^glpat-[a-zA-Z0-9-]{20,}$/,
    /^AKIA[0-9A-Z]{16}$/,
    /^-----BEGIN .*PRIVATE KEY-----/,
    /^[a-f0-9]{32,64}$/i
  ];

  return secretPatterns.some(pattern => pattern.test(value));
}

export default {
  validatePath,
  validatePreset,
  validateProjectName,
  validateConfig,
  sanitizeString,
  looksLikeSecret
};
