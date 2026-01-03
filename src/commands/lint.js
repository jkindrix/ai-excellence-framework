/**
 * AI Excellence Framework - Lint Command
 *
 * Checks configuration files for issues and best practices:
 * - CLAUDE.md structure and content
 * - AGENTS.md alignment with specification
 * - Cursor/Copilot/Windsurf rules
 * - Security configuration
 */

import { existsSync, readFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';
import chalk from 'chalk';
import ora from 'ora';
import { createError, FrameworkError } from '../errors.js';

/**
 * Configuration file checks
 */
const CHECKS = {
  claudeMd: {
    name: 'CLAUDE.md',
    required: true,
    checks: [
      { name: 'exists', fn: checkExists, severity: 'error' },
      { name: 'length', fn: checkClaudeMdLength, severity: 'warning' },
      {
        name: 'required-sections',
        fn: checkRequiredSections,
        severity: 'error'
      },
      {
        name: 'recommended-sections',
        fn: checkRecommendedSections,
        severity: 'info'
      },
      {
        name: 'security-checklist',
        fn: checkSecurityChecklist,
        severity: 'warning'
      },
      { name: 'no-secrets', fn: checkNoSecrets, severity: 'error' },
      {
        name: 'session-instructions',
        fn: checkSessionInstructions,
        severity: 'info'
      }
    ]
  },
  agentsMd: {
    name: 'AGENTS.md',
    required: false,
    checks: [
      { name: 'exists', fn: checkExists, severity: 'info' },
      { name: 'core-sections', fn: checkAgentsMdSections, severity: 'warning' },
      {
        name: 'verification-commands',
        fn: checkVerificationCommands,
        severity: 'warning'
      },
      { name: 'boundaries', fn: checkBoundaries, severity: 'info' }
    ]
  },
  cursor: {
    name: '.cursor/',
    required: false,
    checks: [
      { name: 'exists', fn: checkCursorExists, severity: 'info' },
      { name: 'mdc-format', fn: checkMdcFormat, severity: 'warning' },
      {
        name: 'security-rules',
        fn: checkCursorSecurityRules,
        severity: 'info'
      }
    ]
  },
  copilot: {
    name: '.github/copilot-instructions.md',
    required: false,
    checks: [
      { name: 'exists', fn: checkExists, severity: 'info' },
      { name: 'length', fn: checkCopilotLength, severity: 'warning' },
      { name: 'security-section', fn: checkCopilotSecurity, severity: 'info' }
    ]
  },
  windsurf: {
    name: '.windsurf/',
    required: false,
    checks: [
      { name: 'exists', fn: checkWindsurfExists, severity: 'info' },
      { name: 'char-limit', fn: checkWindsurfCharLimit, severity: 'warning' }
    ]
  },
  hooks: {
    name: 'scripts/hooks/',
    required: false,
    checks: [
      { name: 'exists', fn: checkHooksExist, severity: 'info' },
      { name: 'executable', fn: checkHooksExecutable, severity: 'warning' },
      { name: 'verify-deps', fn: checkVerifyDepsHook, severity: 'info' }
    ]
  }
};

/**
 * Main lint command handler
 *
 * @param {object} options - Command options
 * @param {boolean} [options.ignoreErrors=false] - Don't exit with error on lint failures
 * @param {boolean} [options.verbose=false] - Show detailed output
 * @returns {Promise<void>} Resolves when linting is complete
 * @throws {FrameworkError} If linting fails with errors
 */
export async function lintCommand(options) {
  const cwd = process.cwd();

  console.log(chalk.cyan('\n  AI Excellence Framework - Configuration Linter\n'));

  const spinner = ora('Checking configuration files...').start();

  const results = {
    errors: [],
    warnings: [],
    info: [],
    passed: []
  };

  try {
    // Run all checks
    for (const [key, config] of Object.entries(CHECKS)) {
      if (options.only && !options.only.includes(key)) {
        continue;
      }

      spinner.text = `Checking ${config.name}...`;

      for (const check of config.checks) {
        const result = await check.fn(cwd, config.name, options);

        if (result.passed) {
          results.passed.push({
            file: config.name,
            check: check.name,
            message: result.message
          });
        } else {
          const category =
            check.severity === 'error'
              ? 'errors'
              : check.severity === 'warning'
                ? 'warnings'
                : 'info';

          results[category].push({
            file: config.name,
            check: check.name,
            message: result.message,
            suggestion: result.suggestion
          });
        }
      }
    }

    spinner.succeed('Lint complete!');

    // Print results
    printLintResults(results, options);

    // Throw error if lint failed (CLI will handle exit code)
    if (results.errors.length > 0 && !options.ignoreErrors) {
      throw createError('AIX-VALID-200', `Lint found ${results.errors.length} error(s)`);
    }
  } catch (error) {
    spinner.fail('Lint failed');

    // Re-throw if already a FrameworkError
    if (error instanceof FrameworkError) {
      throw error;
    }

    // Wrap and throw (CLI will handle exit code)
    throw createError('AIX-GEN-900', error.message, { cause: error });
  }
}

// ============================================
// Check Functions
// ============================================

function checkExists(cwd, name) {
  const path = join(cwd, name);
  const exists = existsSync(path);

  return {
    passed: exists,
    message: exists ? `${name} exists` : `${name} not found`,
    suggestion: exists ? null : `Run 'aix init' to create ${name}`
  };
}

function checkClaudeMdLength(cwd) {
  const path = join(cwd, 'CLAUDE.md');
  if (!existsSync(path)) {
    return { passed: true, message: 'Skipped (file not found)' };
  }

  const content = readFileSync(path, 'utf-8');
  const lines = content.split('\n').length;

  // Best practice: < 300 lines
  const passed = lines <= 300;

  return {
    passed,
    message: passed
      ? `CLAUDE.md has ${lines} lines (good)`
      : `CLAUDE.md has ${lines} lines (recommended: <300)`,
    suggestion: passed ? null : 'Consider moving details to per-folder CLAUDE.md files'
  };
}

function checkRequiredSections(cwd) {
  const path = join(cwd, 'CLAUDE.md');
  if (!existsSync(path)) {
    return { passed: false, message: 'CLAUDE.md not found' };
  }

  const content = readFileSync(path, 'utf-8');
  const required = ['Overview', 'Tech Stack'];
  const missing = required.filter(s => !content.includes(`## ${s}`));

  return {
    passed: missing.length === 0,
    message:
      missing.length === 0
        ? 'All required sections present'
        : `Missing required sections: ${missing.join(', ')}`,
    suggestion:
      missing.length > 0 ? `Add sections: ${missing.map(s => `## ${s}`).join(', ')}` : null
  };
}

function checkRecommendedSections(cwd) {
  const path = join(cwd, 'CLAUDE.md');
  if (!existsSync(path)) {
    return { passed: true, message: 'Skipped' };
  }

  const content = readFileSync(path, 'utf-8');
  const recommended = ['Architecture', 'Conventions', 'Current State', 'Session Instructions'];
  const missing = recommended.filter(s => !content.includes(`## ${s}`));

  return {
    passed: missing.length === 0,
    message:
      missing.length === 0
        ? 'All recommended sections present'
        : `Missing recommended sections: ${missing.join(', ')}`,
    suggestion: missing.length > 0 ? 'These sections improve AI context understanding' : null
  };
}

function checkSecurityChecklist(cwd) {
  const path = join(cwd, 'CLAUDE.md');
  if (!existsSync(path)) {
    return { passed: true, message: 'Skipped' };
  }

  const content = readFileSync(path, 'utf-8');
  const hasChecklist =
    content.includes('Security Checklist') ||
    (content.includes('security') && content.includes('- [ ]'));

  return {
    passed: hasChecklist,
    message: hasChecklist ? 'Security checklist found' : 'No security checklist found',
    suggestion: hasChecklist ? null : 'Add a security checklist for AI-generated code review'
  };
}

function checkNoSecrets(cwd, name) {
  const path = join(cwd, name);
  if (!existsSync(path)) {
    return { passed: true, message: 'Skipped' };
  }

  const content = readFileSync(path, 'utf-8');

  const patterns = [
    { name: 'API Key', pattern: /api[_-]?key\s*[:=]\s*["'][^"']{20,}["']/gi },
    { name: 'OpenAI Key', pattern: /sk-[a-zA-Z0-9]{32,}/g },
    { name: 'GitHub Token', pattern: /ghp_[a-zA-Z0-9]{36}/g },
    { name: 'AWS Key', pattern: /AKIA[0-9A-Z]{16}/g },
    {
      name: 'Private Key',
      pattern: /-----BEGIN (RSA |EC |DSA )?PRIVATE KEY-----/g
    }
  ];

  const findings = [];
  for (const { name: patternName, pattern } of patterns) {
    // Reset lastIndex before testing to prevent issues with global regex
    // See: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp/lastIndex
    pattern.lastIndex = 0;
    if (pattern.test(content)) {
      findings.push(patternName);
    }
  }

  return {
    passed: findings.length === 0,
    message:
      findings.length === 0
        ? 'No secrets detected'
        : `Potential secrets found: ${findings.join(', ')}`,
    suggestion: findings.length > 0 ? 'Remove secrets and use environment variables' : null
  };
}

function checkSessionInstructions(cwd) {
  const path = join(cwd, 'CLAUDE.md');
  if (!existsSync(path)) {
    return { passed: true, message: 'Skipped' };
  }

  const content = readFileSync(path, 'utf-8');
  const hasInstructions =
    content.includes('Session Instructions') ||
    content.includes('Before Starting') ||
    content.includes('During Work');

  return {
    passed: hasInstructions,
    message: hasInstructions ? 'Session instructions found' : 'No session instructions found',
    suggestion: hasInstructions ? null : 'Add session instructions for better workflow guidance'
  };
}

function checkAgentsMdSections(cwd) {
  const path = join(cwd, 'AGENTS.md');
  if (!existsSync(path)) {
    return { passed: true, message: 'Skipped (no AGENTS.md)' };
  }

  const content = readFileSync(path, 'utf-8');

  // Core areas per AGENTS.md spec
  const coreAreas = ['Build', 'Test', 'Architecture', 'Style', 'Git', 'Security'];
  const found = coreAreas.filter(area => content.toLowerCase().includes(area.toLowerCase()));

  const coverage = (found.length / coreAreas.length) * 100;

  return {
    passed: coverage >= 50,
    message: `AGENTS.md covers ${found.length}/${coreAreas.length} core areas (${Math.round(coverage)}%)`,
    suggestion:
      coverage < 50
        ? `Consider adding: ${coreAreas.filter(a => !found.includes(a)).join(', ')}`
        : null
  };
}

function checkVerificationCommands(cwd) {
  const path = join(cwd, 'AGENTS.md');
  if (!existsSync(path)) {
    return { passed: true, message: 'Skipped' };
  }

  const content = readFileSync(path, 'utf-8');
  const hasCommands = content.includes('```bash') || content.includes('```sh');
  const hasVerification =
    content.toLowerCase().includes('verification') || content.toLowerCase().includes('test');

  return {
    passed: hasCommands && hasVerification,
    message:
      hasCommands && hasVerification
        ? 'Verification commands found'
        : 'Missing verification commands section',
    suggestion: !(hasCommands && hasVerification)
      ? 'Add executable verification commands for agents to run'
      : null
  };
}

function checkBoundaries(cwd) {
  const path = join(cwd, 'AGENTS.md');
  if (!existsSync(path)) {
    return { passed: true, message: 'Skipped' };
  }

  const content = readFileSync(path, 'utf-8');
  const hasBoundaries =
    content.toLowerCase().includes('boundaries') ||
    content.toLowerCase().includes('never modify') ||
    content.toLowerCase().includes('restrictions');

  return {
    passed: hasBoundaries,
    message: hasBoundaries ? 'File boundaries defined' : 'No file boundaries defined',
    suggestion: hasBoundaries
      ? null
      : 'Define files agents should never modify (e.g., .env, lock files)'
  };
}

function checkCursorExists(cwd) {
  const path = join(cwd, '.cursor');
  return {
    passed: existsSync(path),
    message: existsSync(path) ? '.cursor/ directory exists' : 'No .cursor/ directory',
    suggestion: existsSync(path) ? null : "Run 'aix generate --tools cursor' to create"
  };
}

function checkMdcFormat(cwd) {
  const rulesDir = join(cwd, '.cursor', 'rules');
  if (!existsSync(rulesDir)) {
    return { passed: true, message: 'Skipped (no rules dir)' };
  }

  const files = readdirSync(rulesDir).filter(f => f.endsWith('.mdc'));
  const issues = [];

  for (const file of files) {
    const content = readFileSync(join(rulesDir, file), 'utf-8');
    if (!content.startsWith('---')) {
      issues.push(`${file}: missing YAML frontmatter`);
    }
  }

  return {
    passed: issues.length === 0,
    message:
      issues.length === 0
        ? `${files.length} .mdc files valid`
        : `MDC format issues: ${issues.join('; ')}`,
    suggestion:
      issues.length > 0 ? 'Add YAML frontmatter with description, globs, alwaysApply' : null
  };
}

function checkCursorSecurityRules(cwd) {
  const rulesDir = join(cwd, '.cursor', 'rules');
  if (!existsSync(rulesDir)) {
    return { passed: true, message: 'Skipped' };
  }

  const hasSecurity = existsSync(join(rulesDir, 'security.mdc'));

  return {
    passed: hasSecurity,
    message: hasSecurity ? 'Security rules file present' : 'No dedicated security rules file',
    suggestion: hasSecurity ? null : 'Consider creating .cursor/rules/security.mdc'
  };
}

function checkCopilotLength(cwd) {
  const path = join(cwd, '.github', 'copilot-instructions.md');
  if (!existsSync(path)) {
    return { passed: true, message: 'Skipped' };
  }

  const content = readFileSync(path, 'utf-8');
  const chars = content.length;

  // Copilot instructions should be concise
  const passed = chars <= 8000;

  return {
    passed,
    message: passed
      ? `Copilot instructions: ${chars} chars (good)`
      : `Copilot instructions: ${chars} chars (consider shortening)`,
    suggestion: passed ? null : 'Keep instructions concise for better performance'
  };
}

function checkCopilotSecurity(cwd) {
  const path = join(cwd, '.github', 'copilot-instructions.md');
  if (!existsSync(path)) {
    return { passed: true, message: 'Skipped' };
  }

  const content = readFileSync(path, 'utf-8');
  const hasSecurity = content.toLowerCase().includes('security');

  return {
    passed: hasSecurity,
    message: hasSecurity ? 'Security guidance included' : 'No security section found',
    suggestion: hasSecurity ? null : 'Add security requirements for AI-generated code'
  };
}

function checkWindsurfExists(cwd) {
  const path = join(cwd, '.windsurf');
  return {
    passed: existsSync(path),
    message: existsSync(path) ? '.windsurf/ directory exists' : 'No .windsurf/ directory',
    suggestion: existsSync(path) ? null : "Run 'aix generate --tools windsurf' to create"
  };
}

function checkWindsurfCharLimit(cwd) {
  const rulesDir = join(cwd, '.windsurf', 'rules');
  if (!existsSync(rulesDir)) {
    return { passed: true, message: 'Skipped' };
  }

  const files = readdirSync(rulesDir).filter(f => f.endsWith('.md'));
  const oversized = [];

  for (const file of files) {
    const content = readFileSync(join(rulesDir, file), 'utf-8');
    if (content.length > 6000) {
      oversized.push(`${file}: ${content.length} chars`);
    }
  }

  return {
    passed: oversized.length === 0,
    message:
      oversized.length === 0
        ? 'All rules within 6000 char limit'
        : `Oversized rules: ${oversized.join('; ')}`,
    suggestion: oversized.length > 0 ? 'Windsurf rules limited to 6000 chars each' : null
  };
}

function checkHooksExist(cwd) {
  const path = join(cwd, 'scripts', 'hooks');
  return {
    passed: existsSync(path),
    message: existsSync(path) ? 'Hooks directory exists' : 'No hooks directory',
    suggestion: existsSync(path) ? null : "Run 'aix init' with hooks enabled"
  };
}

function checkHooksExecutable(cwd) {
  const hooksDir = join(cwd, 'scripts', 'hooks');
  if (!existsSync(hooksDir)) {
    return { passed: true, message: 'Skipped' };
  }

  const hooks = readdirSync(hooksDir).filter(f => f.endsWith('.sh'));
  const issues = [];

  for (const hook of hooks) {
    const path = join(hooksDir, hook);
    try {
      const stats = statSync(path);
      const isExecutable = (stats.mode & 0o111) !== 0;
      if (!isExecutable) {
        issues.push(hook);
      }
    } catch {
      issues.push(hook);
    }
  }

  return {
    passed: issues.length === 0,
    message:
      issues.length === 0
        ? `${hooks.length} hooks executable`
        : `Non-executable hooks: ${issues.join(', ')}`,
    suggestion: issues.length > 0 ? 'Run: chmod +x scripts/hooks/*.sh' : null
  };
}

function checkVerifyDepsHook(cwd) {
  const path = join(cwd, 'scripts', 'hooks', 'verify-deps.sh');
  const exists = existsSync(path);

  return {
    passed: exists,
    message: exists
      ? 'verify-deps.sh present (slopsquatting protection)'
      : 'No verify-deps.sh hook',
    suggestion: exists ? null : 'Add verify-deps.sh to prevent hallucinated dependencies'
  };
}

// ============================================
// Output Functions
// ============================================

function printLintResults(results, options) {
  console.log('');

  // Errors
  if (results.errors.length > 0) {
    console.log(chalk.red(`  ✗ ${results.errors.length} Error(s):`));
    for (const err of results.errors) {
      console.log(chalk.red(`    • ${err.file}: ${err.message}`));
      if (err.suggestion && options.verbose) {
        console.log(chalk.gray(`      → ${err.suggestion}`));
      }
    }
    console.log('');
  }

  // Warnings
  if (results.warnings.length > 0) {
    console.log(chalk.yellow(`  ⚠ ${results.warnings.length} Warning(s):`));
    for (const warn of results.warnings) {
      console.log(chalk.yellow(`    • ${warn.file}: ${warn.message}`));
      if (warn.suggestion && options.verbose) {
        console.log(chalk.gray(`      → ${warn.suggestion}`));
      }
    }
    console.log('');
  }

  // Info
  if (results.info.length > 0 && options.verbose) {
    console.log(chalk.blue(`  ℹ ${results.info.length} Suggestion(s):`));
    for (const info of results.info) {
      console.log(chalk.blue(`    • ${info.file}: ${info.message}`));
      if (info.suggestion) {
        console.log(chalk.gray(`      → ${info.suggestion}`));
      }
    }
    console.log('');
  }

  // Summary
  const total =
    results.passed.length + results.errors.length + results.warnings.length + results.info.length;

  console.log(chalk.gray(`  Summary: ${results.passed.length}/${total} checks passed`));

  if (results.errors.length === 0 && results.warnings.length === 0) {
    console.log(chalk.green('\n  ✓ All configurations look good!\n'));
  } else if (results.errors.length === 0) {
    console.log(chalk.yellow('\n  ⚠ Configuration valid with warnings\n'));
  } else {
    console.log(chalk.red('\n  ✗ Configuration has errors that should be fixed\n'));
  }
}

export default lintCommand;
