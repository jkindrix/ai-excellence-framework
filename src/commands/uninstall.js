/**
 * Uninstall command - Remove AI Excellence Framework from a project
 */

import fs from 'fs-extra';
import path from 'path';
import chalk from 'chalk';
import ora from 'ora';

// Files and directories installed by the framework
const FRAMEWORK_FILES = [
  '.claude/commands/',
  '.claude/agents/',
  '.claude/skills/',
  'ai-excellence.config.json',
  '.pre-commit-config.yaml',
  'scripts/hooks/post-edit.sh',
  'scripts/hooks/verify-deps.sh',
  'scripts/hooks/check-todos.sh',
  'scripts/hooks/check-claude-md.sh',
  'scripts/hooks/check-ai-security.sh',
  'scripts/mcp/project-memory-server.py',
  'scripts/metrics/collect-session-metrics.sh',
  'scripts/metrics/friction-metrics.js',
  'scripts/health/claude-md-monitor.sh'
];

// Generated tool configurations
const GENERATED_TOOL_CONFIGS = [
  'AGENTS.md',
  '.cursor/',
  '.github/copilot-instructions.md',
  '.windsurf/',
  '.aider.conf.yml',
  '.gemini/',
  '.codex/',
  '.zed/ai-rules.md',
  '.amp/',
  '.roo/',
  '.junie/',
  '.cline/',
  '.goose/',
  '.kiro/',
  '.continue/',
  '.augment/',
  'qodo.toml',
  'best_practices.md',
  '.opencode/',
  'opencode.json',
  '.zencoder/',
  'zencoder.json',
  '.claude-plugin/',
  '.tabnine/',
  '.amazonq/'
];

// Files to preserve by default (user content)
const PRESERVE_BY_DEFAULT = [
  'CLAUDE.md' // User's project context
];

/**
 * Check if a file/directory exists
 */
async function exists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Get list of files that would be removed
 */
async function getFilesToRemove(targetDir, options = {}) {
  const toRemove = [];
  const toPreserve = [];

  // Check framework files
  for (const file of FRAMEWORK_FILES) {
    const fullPath = path.join(targetDir, file);
    if (await exists(fullPath)) {
      toRemove.push({ path: file, type: 'framework' });
    }
  }

  // Check generated tool configs
  for (const file of GENERATED_TOOL_CONFIGS) {
    const fullPath = path.join(targetDir, file);
    if (await exists(fullPath)) {
      toRemove.push({ path: file, type: 'generated' });
    }
  }

  // Check preservable files
  for (const file of PRESERVE_BY_DEFAULT) {
    const fullPath = path.join(targetDir, file);
    if (await exists(fullPath)) {
      if (options.keepConfig) {
        toPreserve.push(file);
      } else {
        toRemove.push({ path: file, type: 'config', preservable: true });
      }
    }
  }

  return { toRemove, toPreserve };
}

/**
 * Remove a file or directory
 */
async function removeItem(targetDir, itemPath) {
  const fullPath = path.join(targetDir, itemPath);
  await fs.remove(fullPath);

  // Clean up empty parent directories
  const parentDir = path.dirname(fullPath);
  try {
    const contents = await fs.readdir(parentDir);
    if (contents.length === 0 && parentDir !== targetDir) {
      await fs.remove(parentDir);
    }
  } catch {
    // Parent doesn't exist or can't be read, that's fine
  }
}

/**
 * Uninstall the AI Excellence Framework from a project.
 *
 * Removes framework files including commands, agents, hooks, MCP server,
 * and optionally the CLAUDE.md configuration file.
 *
 * @param {Object} [options={}] - Uninstall options
 * @param {string} [options.targetDir=process.cwd()] - Directory to uninstall from
 * @param {boolean} [options.dryRun=false] - Show what would be removed without removing
 * @param {boolean} [options.force=false] - Skip confirmation prompt
 * @param {boolean} [options.keepConfig=false] - Preserve CLAUDE.md file
 * @param {boolean} [options.json=false] - Output results as JSON for scripting
 * @param {boolean} [options.verbose=false] - Show detailed progress
 * @returns {Promise<{success: boolean, removed: string[], preserved: string[], errors: Array<{path: string, error: string}>}>}
 *   Result object with arrays of removed files, preserved files, and any errors
 * @example
 * // Dry run to see what would be removed
 * const result = await uninstall({ dryRun: true });
 * console.log('Would remove:', result.removed);
 *
 * // Uninstall but keep CLAUDE.md
 * await uninstall({ keepConfig: true });
 */
export async function uninstall(options = {}) {
  const targetDir = options.targetDir || process.cwd();
  const dryRun = options.dryRun || false;
  const force = options.force || false;
  const keepConfig = options.keepConfig || false;
  const json = options.json || false;

  const result = {
    success: true,
    removed: [],
    preserved: [],
    errors: []
  };

  // Get files to remove
  const { toRemove, toPreserve } = await getFilesToRemove(targetDir, { keepConfig });

  if (toRemove.length === 0) {
    if (json) {
      console.log(JSON.stringify({
        success: true,
        message: 'No framework files found',
        removed: [],
        preserved: toPreserve
      }));
    } else {
      console.log(chalk.yellow('No AI Excellence Framework files found in this directory.'));
    }
    return result;
  }

  // Show what will be removed
  if (!json) {
    console.log('');
    console.log(chalk.bold('Files to be removed:'));
    console.log('');

    for (const item of toRemove) {
      const icon = item.preservable ? '⚠' : '•';
      const note = item.preservable ? chalk.yellow(' (user content)') : '';
      console.log(`  ${icon} ${item.path}${note}`);
    }

    if (toPreserve.length > 0) {
      console.log('');
      console.log(chalk.bold('Files to be preserved:'));
      for (const file of toPreserve) {
        console.log(`  ✓ ${file}`);
      }
    }

    console.log('');
  }

  // Dry run - just show what would happen
  if (dryRun) {
    if (json) {
      console.log(JSON.stringify({
        dryRun: true,
        wouldRemove: toRemove.map(f => f.path),
        wouldPreserve: toPreserve
      }));
    } else {
      console.log(chalk.cyan('Dry run - no files were removed.'));
    }
    return {
      success: true,
      removed: [],
      preserved: toPreserve,
      dryRun: true
    };
  }

  // Confirm removal if not forced
  if (!force && !json) {
    const { Confirm } = await import('enquirer');
    const prompt = new Confirm({
      name: 'confirm',
      message: 'Remove these files?'
    });

    const confirmed = await prompt.run();
    if (!confirmed) {
      console.log(chalk.yellow('Uninstall cancelled.'));
      return { success: false, cancelled: true };
    }
  }

  // Remove files
  const spinner = json ? null : ora('Removing framework files...').start();

  for (const item of toRemove) {
    try {
      await removeItem(targetDir, item.path);
      result.removed.push(item.path);
    } catch (error) {
      result.errors.push({ path: item.path, error: error.message });
    }
  }

  result.preserved = toPreserve;

  // Report results
  if (spinner) {
    if (result.errors.length === 0) {
      spinner.succeed(`Removed ${result.removed.length} files/directories`);
    } else {
      spinner.warn(`Removed ${result.removed.length} files, ${result.errors.length} errors`);
    }
  }

  if (json) {
    console.log(JSON.stringify({
      success: result.errors.length === 0,
      removed: result.removed,
      preserved: result.preserved,
      errors: result.errors
    }));
  } else {
    if (result.errors.length > 0) {
      console.log('');
      console.log(chalk.red('Errors:'));
      for (const err of result.errors) {
        console.log(`  • ${err.path}: ${err.error}`);
      }
    }

    console.log('');
    console.log(chalk.green('AI Excellence Framework has been removed.'));

    if (keepConfig) {
      console.log(chalk.cyan('Your CLAUDE.md file was preserved.'));
    }
  }

  return result;
}

export default uninstall;
