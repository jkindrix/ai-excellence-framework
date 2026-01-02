/**
 * AI Excellence Framework - Validate Command
 *
 * Validates the framework configuration and setup with auto-fix capabilities.
 */

import { existsSync, readFileSync, writeFileSync, mkdirSync, appendFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import chalk from 'chalk';
import ora from 'ora';
import fse from 'fs-extra';
import { detectSecrets } from '../index.js';
import { createError } from '../errors.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PACKAGE_ROOT = join(__dirname, '..', '..');

/**
 * Validation rules with auto-fix capabilities
 */
const VALIDATION_RULES = [
  {
    id: 'claude-md-exists',
    name: 'CLAUDE.md exists',
    category: 'core',
    check: cwd => existsSync(join(cwd, 'CLAUDE.md')),
    fix: async cwd => {
      const template = `# Project Name

## Overview

[Brief description of what this project does]

## Tech Stack

- Language: [e.g., JavaScript, Python]
- Framework: [e.g., React, Django]

## Architecture

[Key architectural decisions and patterns]

## Conventions

- [Naming conventions]
- [File structure patterns]

## Common Commands

\`\`\`bash
# Build
npm run build

# Test
npm test

# Run
npm start
\`\`\`

## Current State

### Phase
Initial setup

### Recent Decisions
- [Date]: [Decision made]

### Known Issues
- None yet

## Session Instructions

### Before Starting
1. Read this file completely
2. Check recent commits for context

### During Work
- Use /plan before implementation
- Use /verify before completing tasks

### Before Ending
- Update "Current State" section
- Commit work in progress
`;
      writeFileSync(join(cwd, 'CLAUDE.md'), template);
      return true;
    },
    severity: 'error'
  },
  {
    id: 'claude-md-has-overview',
    name: 'CLAUDE.md has Overview section',
    category: 'core',
    check: cwd => {
      const path = join(cwd, 'CLAUDE.md');
      if (!existsSync(path)) {
        return false;
      }
      const content = readFileSync(path, 'utf-8');
      return /## Overview/i.test(content);
    },
    fix: async cwd => {
      const path = join(cwd, 'CLAUDE.md');
      if (!existsSync(path)) {
        return false;
      }
      let content = readFileSync(path, 'utf-8');
      if (!/## Overview/i.test(content)) {
        // Find the first heading and insert after it
        content = content.replace(
          /^(# .+\n)/m,
          '$1\n## Overview\n\n[Brief description of what this project does]\n\n'
        );
        writeFileSync(path, content);
      }
      return true;
    },
    severity: 'warning'
  },
  {
    id: 'claude-md-has-tech-stack',
    name: 'CLAUDE.md has Tech Stack section',
    category: 'core',
    check: cwd => {
      const path = join(cwd, 'CLAUDE.md');
      if (!existsSync(path)) {
        return false;
      }
      const content = readFileSync(path, 'utf-8');
      return /## Tech Stack/i.test(content);
    },
    fix: async cwd => {
      const path = join(cwd, 'CLAUDE.md');
      if (!existsSync(path)) {
        return false;
      }
      let content = readFileSync(path, 'utf-8');
      if (!/## Tech Stack/i.test(content)) {
        // Find Overview section and insert after it
        if (/## Overview/i.test(content)) {
          content = content.replace(
            /(## Overview[\s\S]*?)(\n## |\n$)/m,
            '$1\n\n## Tech Stack\n\n- Language: [specify]\n- Framework: [specify]\n\n$2'
          );
        } else {
          content += '\n\n## Tech Stack\n\n- Language: [specify]\n- Framework: [specify]\n';
        }
        writeFileSync(path, content);
      }
      return true;
    },
    severity: 'warning'
  },
  {
    id: 'claude-md-has-current-state',
    name: 'CLAUDE.md has Current State section',
    category: 'core',
    check: cwd => {
      const path = join(cwd, 'CLAUDE.md');
      if (!existsSync(path)) {
        return false;
      }
      const content = readFileSync(path, 'utf-8');
      return /## Current State/i.test(content);
    },
    fix: async cwd => {
      const path = join(cwd, 'CLAUDE.md');
      if (!existsSync(path)) {
        return false;
      }
      let content = readFileSync(path, 'utf-8');
      if (!/## Current State/i.test(content)) {
        content +=
          '\n\n## Current State\n\n### Phase\nIn development\n\n### Recent Decisions\n- [Add decisions here]\n';
        writeFileSync(path, content);
      }
      return true;
    },
    severity: 'warning'
  },
  {
    id: 'commands-dir-exists',
    name: '.claude/commands directory exists',
    category: 'commands',
    check: cwd => existsSync(join(cwd, '.claude', 'commands')),
    fix: async cwd => {
      mkdirSync(join(cwd, '.claude', 'commands'), { recursive: true });
      return true;
    },
    severity: 'info'
  },
  {
    id: 'plan-command-exists',
    name: '/plan command exists',
    category: 'commands',
    check: cwd => existsSync(join(cwd, '.claude', 'commands', 'plan.md')),
    fix: async cwd => {
      const source = join(PACKAGE_ROOT, '.claude', 'commands', 'plan.md');
      const target = join(cwd, '.claude', 'commands', 'plan.md');
      if (existsSync(source)) {
        mkdirSync(dirname(target), { recursive: true });
        fse.copySync(source, target);
        return true;
      }
      return false;
    },
    severity: 'warning'
  },
  {
    id: 'verify-command-exists',
    name: '/verify command exists',
    category: 'commands',
    check: cwd => existsSync(join(cwd, '.claude', 'commands', 'verify.md')),
    fix: async cwd => {
      const source = join(PACKAGE_ROOT, '.claude', 'commands', 'verify.md');
      const target = join(cwd, '.claude', 'commands', 'verify.md');
      if (existsSync(source)) {
        mkdirSync(dirname(target), { recursive: true });
        fse.copySync(source, target);
        return true;
      }
      return false;
    },
    severity: 'warning'
  },
  {
    id: 'pre-commit-config',
    name: 'Pre-commit configuration exists',
    category: 'security',
    check: cwd => existsSync(join(cwd, '.pre-commit-config.yaml')),
    fix: async cwd => {
      const source = join(PACKAGE_ROOT, 'templates', '.pre-commit-config.yaml');
      const target = join(cwd, '.pre-commit-config.yaml');
      if (existsSync(source)) {
        fse.copySync(source, target);
        return true;
      }
      // Create a basic pre-commit config
      const config = `repos:
  - repo: https://github.com/pre-commit/pre-commit-hooks
    rev: v4.5.0
    hooks:
      - id: trailing-whitespace
      - id: end-of-file-fixer
      - id: check-yaml
      - id: check-json
      - id: check-added-large-files
        args: ['--maxkb=1000']
      - id: detect-private-key
      - id: check-merge-conflict
`;
      writeFileSync(target, config);
      return true;
    },
    severity: 'info'
  },
  {
    id: 'gitignore-exists',
    name: '.gitignore exists',
    category: 'security',
    check: cwd => existsSync(join(cwd, '.gitignore')),
    fix: async cwd => {
      const content = `# AI Excellence Framework
CLAUDE.local.md
.claude/settings.local.json
.tmp/
.secrets.baseline

# Dependencies
node_modules/

# Build
dist/
build/

# Environment
.env
.env.local
*.local

# IDE
.idea/
.vscode/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db
`;
      writeFileSync(join(cwd, '.gitignore'), content);
      return true;
    },
    severity: 'warning'
  },
  {
    id: 'gitignore-has-tmp',
    name: '.gitignore ignores .tmp/',
    category: 'security',
    check: cwd => {
      const path = join(cwd, '.gitignore');
      if (!existsSync(path)) {
        return false;
      }
      const content = readFileSync(path, 'utf-8');
      return content.includes('.tmp/') || content.includes('.tmp');
    },
    fix: async cwd => {
      const path = join(cwd, '.gitignore');
      if (!existsSync(path)) {
        return false;
      }
      appendFileSync(path, '\n# AI Excellence Framework temp files\n.tmp/\n');
      return true;
    },
    severity: 'warning'
  },
  {
    id: 'gitignore-has-secrets',
    name: '.gitignore ignores .secrets.baseline',
    category: 'security',
    check: cwd => {
      const path = join(cwd, '.gitignore');
      if (!existsSync(path)) {
        return false;
      }
      const content = readFileSync(path, 'utf-8');
      return content.includes('.secrets.baseline');
    },
    fix: async cwd => {
      const path = join(cwd, '.gitignore');
      if (!existsSync(path)) {
        return false;
      }
      appendFileSync(path, '\n.secrets.baseline\n');
      return true;
    },
    severity: 'info'
  },
  {
    id: 'session-notes-dir',
    name: 'Session notes directory exists',
    category: 'workflow',
    check: cwd => existsSync(join(cwd, 'docs', 'session-notes')),
    fix: async cwd => {
      mkdirSync(join(cwd, 'docs', 'session-notes'), { recursive: true });
      writeFileSync(join(cwd, 'docs', 'session-notes', '.gitkeep'), '');
      return true;
    },
    severity: 'info'
  },
  {
    id: 'tmp-dir-exists',
    name: '.tmp directory exists',
    category: 'workflow',
    check: cwd => existsSync(join(cwd, '.tmp')),
    fix: async cwd => {
      mkdirSync(join(cwd, '.tmp'), { recursive: true });
      writeFileSync(join(cwd, '.tmp', '.gitkeep'), '');
      return true;
    },
    severity: 'info'
  },
  {
    id: 'no-hardcoded-secrets',
    name: 'No obvious hardcoded secrets in CLAUDE.md',
    category: 'security',
    check: cwd => {
      const path = join(cwd, 'CLAUDE.md');
      if (!existsSync(path)) {
        return true;
      }
      const content = readFileSync(path, 'utf-8');
      // Use comprehensive detectSecrets from index.js for consistency
      const result = detectSecrets(content);
      return result.clean;
    },
    fix: null, // Cannot auto-fix secrets - requires manual intervention
    severity: 'error'
  },
  {
    id: 'agents-dir-exists',
    name: '.claude/agents directory exists',
    category: 'agents',
    check: cwd => existsSync(join(cwd, '.claude', 'agents')),
    fix: async cwd => {
      mkdirSync(join(cwd, '.claude', 'agents'), { recursive: true });
      return true;
    },
    severity: 'info'
  }
];

/**
 * Main validate command handler
 *
 * @param {object} options - Command options
 * @param {boolean} [options.fix=false] - Automatically fix issues where possible
 * @param {boolean} [options.json=false] - Output results as JSON
 * @returns {Promise<void>} Resolves when validation is complete
 * @throws {FrameworkError} If validation fails with errors
 */
export async function validateCommand(options) {
  const cwd = process.cwd();
  const autoFix = options.fix || false;
  const json = options.json || false;

  if (!json) {
    console.log(chalk.cyan('\n  AI Excellence Framework Validator\n'));

    if (autoFix) {
      console.log(chalk.yellow('  Auto-fix mode enabled\n'));
    }
  }

  const spinner = json ? null : ora('Running validation checks...').start();

  const results = {
    passed: [],
    warnings: [],
    errors: [],
    info: [],
    fixed: []
  };

  // Run all validation rules
  for (const rule of VALIDATION_RULES) {
    try {
      let passed = await rule.check(cwd);

      if (!passed && autoFix && rule.fix) {
        if (spinner) {
          spinner.text = `Fixing: ${rule.name}...`;
        }
        try {
          const fixed = await rule.fix(cwd);
          if (fixed) {
            passed = await rule.check(cwd);
            if (passed) {
              results.fixed.push(rule);
            }
          }
        } catch (fixError) {
          // Log fix failure for debugging, continue with original result
          if (process.env.DEBUG || process.env.VERBOSE) {
            console.error(`  Auto-fix failed for ${rule.id}: ${fixError.message}`);
          }
        }
      }

      if (passed) {
        results.passed.push(rule);
      } else {
        switch (rule.severity) {
          case 'error':
            results.errors.push(rule);
            break;
          case 'warning':
            results.warnings.push(rule);
            break;
          case 'info':
            results.info.push(rule);
            break;
          default:
            // Unknown severity, treat as warning
            results.warnings.push(rule);
        }
      }
    } catch (error) {
      results.errors.push({
        ...rule,
        error: error.message
      });
    }
  }

  if (spinner) {
    spinner.stop();
  }

  // JSON output
  if (json) {
    const jsonOutput = {
      valid: results.errors.length === 0,
      passed: results.passed.length,
      total: VALIDATION_RULES.length,
      errors: results.errors.map(r => ({ id: r.id, name: r.name, category: r.category, fixable: !!r.fix })),
      warnings: results.warnings.map(r => ({ id: r.id, name: r.name, category: r.category, fixable: !!r.fix })),
      info: results.info.map(r => ({ id: r.id, name: r.name, category: r.category, fixable: !!r.fix })),
      fixed: results.fixed.map(r => ({ id: r.id, name: r.name, category: r.category }))
    };
    console.log(JSON.stringify(jsonOutput, null, 2));
    if (results.errors.length > 0) {
      throw createError('AIX-VALID-200', `Validation failed with ${results.errors.length} error(s)`);
    }
    return;
  }

  // Print results
  printValidationResults(results, autoFix);

  // Throw error if validation failed (CLI will handle exit code)
  if (results.errors.length > 0) {
    throw createError('AIX-VALID-200', `Validation failed with ${results.errors.length} error(s)`);
  }
}

/**
 * Print validation results
 */
function printValidationResults(results, autoFix) {
  const total = VALIDATION_RULES.length;
  const passedCount = results.passed.length;

  // Summary
  console.log(chalk.white(`  Validation Results: ${passedCount}/${total} checks passed\n`));

  // Fixed (if any)
  if (results.fixed.length > 0) {
    console.log(chalk.green('  🔧 Auto-fixed:'));
    results.fixed.forEach(r => {
      console.log(chalk.green(`    ✓ ${r.name}`));
    });
    console.log('');
  }

  // Passed
  if (results.passed.length > 0) {
    console.log(chalk.green('  ✓ Passed:'));
    results.passed.forEach(r => {
      console.log(chalk.gray(`    ✓ ${r.name}`));
    });
    console.log('');
  }

  // Errors
  if (results.errors.length > 0) {
    console.log(chalk.red('  ✗ Errors (must fix):'));
    results.errors.forEach(r => {
      console.log(chalk.red(`    ✗ ${r.name}`));
      if (r.error) {
        console.log(chalk.gray(`      Error: ${r.error}`));
      }
      if (r.fix && !autoFix) {
        console.log(chalk.gray('      Run with --fix to auto-repair'));
      }
    });
    console.log('');
  }

  // Warnings
  if (results.warnings.length > 0) {
    console.log(chalk.yellow('  ⚠ Warnings (should fix):'));
    results.warnings.forEach(r => {
      console.log(chalk.yellow(`    ⚠ ${r.name}`));
      if (r.fix && !autoFix) {
        console.log(chalk.gray('      Run with --fix to auto-repair'));
      }
    });
    console.log('');
  }

  // Info
  if (results.info.length > 0) {
    console.log(chalk.blue('  ℹ Info (optional):'));
    results.info.forEach(r => {
      console.log(chalk.gray(`    ℹ ${r.name}`));
      if (r.fix && !autoFix) {
        console.log(chalk.gray('      Run with --fix to auto-repair'));
      }
    });
    console.log('');
  }

  // Overall status
  if (results.errors.length === 0 && results.warnings.length === 0) {
    console.log(chalk.green('  ✓ All critical checks passed!\n'));
  } else if (results.errors.length === 0) {
    console.log(chalk.yellow('  ⚠ Framework is functional but has warnings to address.\n'));
    if (!autoFix) {
      console.log(chalk.gray('  Run "npx ai-excellence validate --fix" to auto-fix issues.\n'));
    }
  } else {
    console.log(chalk.red('  ✗ Framework has errors that need to be fixed.\n'));
    if (!autoFix) {
      console.log(chalk.gray('  Run "npx ai-excellence validate --fix" to auto-fix issues.\n'));
      console.log(chalk.gray('  Or run "npx ai-excellence init" to reinitialize.\n'));
    }
  }
}
