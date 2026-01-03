/**
 * AI Excellence Framework - Generator Base Utilities
 *
 * Shared utilities for all generator modules.
 */

import { basename } from 'path';
import { createHash } from 'crypto';
import chalk from 'chalk';

/**
 * Simple cache for parsed CLAUDE.md content.
 * Uses content hash as key to detect changes.
 *
 * Thread Safety Assumptions:
 * --------------------------
 * This cache is designed for Node.js's single-threaded event loop model:
 * - All JavaScript in Node.js runs on a single thread (the main event loop)
 * - Map operations (get, set, delete) complete synchronously and atomically
 * - No concurrent access issues exist in standard Node.js usage
 *
 * Worker Thread Considerations:
 * If this module is used in Node.js worker threads (worker_threads module),
 * each worker gets its own isolated copy of the module and cache. This is
 * safe but means:
 * - Each worker maintains its own cache (no sharing)
 * - Memory usage multiplies with worker count
 * - Cache hits are worker-local only
 *
 * For shared caching across workers, consider:
 * - SharedArrayBuffer with Atomics (complex, not recommended for this use case)
 * - External cache (Redis, memcached) for distributed scenarios
 * - MessageChannel for cache invalidation signals between workers
 *
 * @type {Map<string, {context: object, timestamp: number, lastAccess: number}>}
 * @see https://nodejs.org/api/worker_threads.html - Worker threads documentation
 */
const parseCache = new Map();

// Cache configuration
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes TTL
const CACHE_MAX_SIZE = 50; // Maximum cached entries

/**
 * Get content hash for cache key.
 * Uses SHA-256 truncated to 16 characters for efficient cache keys.
 *
 * @param {string} content - Content to hash
 * @returns {string} SHA-256 hash (first 16 chars) - e.g., "a1b2c3d4e5f6g7h8"
 */
function getContentHash(content) {
  return createHash('sha256').update(content).digest('hex').slice(0, 16);
}

/**
 * Remove expired entries from cache.
 * Called automatically when cache grows too large.
 *
 * @returns {number} Number of expired entries removed
 */
function cleanupExpiredEntries() {
  const now = Date.now();
  const expiredKeys = [];

  for (const [key, entry] of parseCache.entries()) {
    if (now - entry.timestamp >= CACHE_TTL_MS) {
      expiredKeys.push(key);
    }
  }

  for (const key of expiredKeys) {
    parseCache.delete(key);
  }

  return expiredKeys.length;
}

/**
 * Enforce cache size limit using LRU eviction.
 * Removes least recently accessed entries.
 *
 * @returns {void}
 */
function enforceCacheSizeLimit() {
  if (parseCache.size <= CACHE_MAX_SIZE) {
    return;
  }

  // First, try removing expired entries
  cleanupExpiredEntries();

  // If still over limit, remove least recently accessed
  if (parseCache.size > CACHE_MAX_SIZE) {
    const entries = [...parseCache.entries()];
    entries.sort((a, b) => a[1].lastAccess - b[1].lastAccess);

    const toRemove = parseCache.size - CACHE_MAX_SIZE;
    for (let i = 0; i < toRemove && i < entries.length; i++) {
      parseCache.delete(entries[i][0]);
    }
  }
}

/**
 * Clear the parse cache.
 * Useful for testing or when CLAUDE.md is known to have changed.
 *
 * @returns {void}
 */
export function clearParseCache() {
  parseCache.clear();
}

/**
 * Get cache statistics for diagnostics.
 * @returns {{size: number, maxSize: number, ttlMs: number}}
 */
export function getCacheStats() {
  return {
    size: parseCache.size,
    maxSize: CACHE_MAX_SIZE,
    ttlMs: CACHE_TTL_MS
  };
}

/**
 * Parse CLAUDE.md into structured project context.
 * Results are cached based on content hash for performance.
 *
 * @param {string} content - Raw CLAUDE.md content
 * @param {boolean} [skipCache=false] - Force re-parsing even if cached
 * @returns {object} Parsed project context
 */
export function parseProjectContext(content, skipCache = false) {
  const now = Date.now();

  // Check cache first
  if (!skipCache) {
    const hash = getContentHash(content);
    const cached = parseCache.get(hash);

    if (cached) {
      // Check if entry is still valid
      if (now - cached.timestamp < CACHE_TTL_MS) {
        // Update last access time for LRU tracking
        cached.lastAccess = now;
        return cached.context;
      }
      // Entry expired, remove it
      parseCache.delete(hash);
    }
  }

  const context = {
    projectName: '',
    overview: '',
    techStack: [],
    architecture: '',
    conventions: '',
    commands: '',
    currentState: '',
    sessionInstructions: '',
    securityChecklist: '',
    raw: content
  };

  // Extract project name from first heading
  const nameMatch = content.match(/^#\s+(?:Project:\s*)?(.+)$/m);
  if (nameMatch) {
    context.projectName = nameMatch[1].trim();
  }

  // Extract sections
  const sections = extractSections(content);

  context.overview = sections.Overview || '';
  context.techStack = extractTechStack(sections['Tech Stack'] || '');
  context.architecture = sections.Architecture || '';
  context.conventions = sections.Conventions || '';
  context.commands = sections['Common Commands'] || '';
  context.currentState = sections['Current State'] || '';
  context.sessionInstructions = sections['Session Instructions'] || '';
  context.securityChecklist = extractSecurityChecklist(content);

  // Store in cache for future lookups
  if (!skipCache) {
    const hash = getContentHash(content);
    parseCache.set(hash, {
      context,
      timestamp: now,
      lastAccess: now
    });

    // Enforce cache size limits with proper LRU eviction
    enforceCacheSizeLimit();
  }

  return context;
}

/**
 * Extract sections from markdown
 * @param {string} content - Markdown content
 * @returns {object} Sections keyed by heading
 */
export function extractSections(content) {
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

  return sections;
}

/**
 * Extract tech stack as array
 * @param {string} content - Tech stack section content
 * @returns {Array<{category: string, value: string}>} Tech stack items
 */
export function extractTechStack(content) {
  const stack = [];
  const lines = content.split('\n');

  for (const line of lines) {
    const match = line.match(/^-\s*\*?\*?(.+?)\*?\*?:\s*(.+)$/);
    if (match) {
      stack.push({
        category: match[1].trim(),
        value: match[2].trim()
      });
    }
  }

  return stack;
}

/**
 * Extract security checklist items
 * @param {string} content - Full CLAUDE.md content
 * @returns {string[]} Security checklist items
 */
export function extractSecurityChecklist(content) {
  const items = [];
  const checklistMatch = content.match(/### Security Checklist[\s\S]*?((?:\n- \[.\].+)+)/);

  if (checklistMatch) {
    const lines = checklistMatch[1].split('\n');
    for (const line of lines) {
      const itemMatch = line.match(/- \[.\]\s*(.+)/);
      if (itemMatch) {
        items.push(itemMatch[1].trim());
      }
    }
  }

  return items;
}

/**
 * Get project name from context or use directory name as fallback
 * @param {object|null} context - Project context
 * @returns {string} Project name
 */
export function getProjectName(context) {
  return context?.projectName || basename(process.cwd());
}

/**
 * Format tech stack as string
 * @param {object|null} context - Project context
 * @returns {string} Formatted tech stack
 */
export function formatTechStack(context) {
  return context?.techStack?.map(t => `${t.category}: ${t.value}`).join(', ') || 'Not specified';
}

/**
 * Print generation results to stdout.
 *
 * @param {object} results - Results object with created, skipped, errors arrays
 * @param {string[]} results.created - Files that were created
 * @param {string[]} results.skipped - Files that were skipped
 * @param {string[]} results.errors - Error messages
 * @param {boolean} dryRun - Whether this was a dry run
 * @returns {void}
 */
export function printResults(results, dryRun) {
  console.log('');

  if (results.created.length > 0) {
    console.log(
      chalk.green(`  ${dryRun ? 'Would create' : 'Created'} ${results.created.length} files:`)
    );
    results.created.forEach(f => console.log(chalk.gray(`    \u2713 ${f}`)));
  }

  if (results.skipped.length > 0) {
    console.log(chalk.yellow(`\n  Skipped ${results.skipped.length} files:`));
    results.skipped.forEach(f => console.log(chalk.gray(`    - ${f}`)));
  }

  if (results.errors.length > 0) {
    console.log(chalk.red('\n  Errors:'));
    results.errors.forEach(e => console.log(chalk.red(`    \u2717 ${e}`)));
  }

  console.log(chalk.cyan('\n  Multi-tool support enabled!'));
  console.log(
    chalk.gray('  Your project now works with: Claude, Cursor, Copilot, Windsurf, Aider,')
  );
  console.log(
    chalk.gray('  Gemini CLI, Codex CLI, Zed, Amp, Roo, Junie, Cline, Goose, Kiro,')
  );
  console.log(
    chalk.gray('  Continue, Augment, Qodo, OpenCode, Zencoder, Tabnine, Amazon Q,')
  );
  console.log(chalk.gray('  Skills, and Plugins (23 tools total)\n'));
}
