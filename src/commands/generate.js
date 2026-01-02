/**
 * AI Excellence Framework - Generate Command
 *
 * Generates configuration files for multiple AI coding tools:
 * - AGENTS.md (Linux Foundation AAIF standard)
 * - Skills (SKILL.md - universal agent skills specification)
 * - Claude Code Plugins (.claude-plugin/plugin.json)
 * - Cursor rules (.cursor/rules/)
 * - GitHub Copilot instructions (.github/copilot-instructions.md)
 * - Windsurf rules (.windsurf/rules/ and .windsurfrules)
 * - Aider configuration (.aider.conf.yml)
 * - JetBrains Junie (.junie/guidelines.md)
 * - Cline (.clinerules)
 * - Block Goose (AGENTS.md + MCP extensions)
 * - Kiro CLI (~/.kiro/ - AWS Q Developer successor)
 * - Continue.dev (config.yaml, .continue/rules/)
 * - Augment Code (augment rules)
 * - Qodo AI (TOML config)
 * - OpenCode AI (opencode.json, markdown agents)
 * - Zencoder (Zen Rules - .zencoder/rules/*.md)
 * - Tabnine (.tabnine/guidelines/)
 * - Amazon Q Developer (.amazonq/rules/)
 *
 * This enables the framework to work across all major AI coding assistants.
 *
 * @see https://agents.md - AAIF standard
 * @see https://agentskills.io/specification - Agent Skills specification
 * @see https://code.claude.com/docs/en/plugins-reference - Claude Code Plugins
 * @see https://kiro.dev/docs/cli/ - Kiro CLI
 * @see https://docs.continue.dev/reference - Continue.dev
 * @see https://www.augmentcode.com - Augment Code
 * @see https://www.qodo.ai - Qodo AI
 * @see https://github.com/JetBrains/junie-guidelines - Junie guidelines
 * @see https://docs.cline.bot/features/cline-rules - Cline rules
 * @see https://block.github.io/goose/ - Block Goose
 * @see https://opencode.ai - OpenCode AI
 * @see https://zencoder.ai - Zencoder
 * @see https://www.tabnine.com - Tabnine
 * @see https://docs.aws.amazon.com/amazonq - Amazon Q Developer
 */

import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { readFile } from 'fs/promises';
import { join, dirname, basename } from 'path';
import { fileURLToPath } from 'url';
import chalk from 'chalk';
import ora from 'ora';
import { createError, FrameworkError } from '../errors.js';

// Import shared utilities from generators module
import { parseProjectContext } from '../generators/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Supported AI tools
 * @see https://agents.md - Linux Foundation AAIF standard
 * @see https://agentskills.io - Agent Skills specification
 */
export const SUPPORTED_TOOLS = [
  'agents', // AGENTS.md (Linux Foundation AAIF standard)
  'skills', // SKILL.md (universal agent skills - Copilot/Codex/Claude)
  'plugins', // Claude Code Plugins (.claude-plugin/plugin.json)
  'cursor', // Cursor IDE (.cursor/rules/)
  'copilot', // GitHub Copilot (.github/copilot-instructions.md)
  'windsurf', // Windsurf IDE (.windsurf/rules/ and .windsurfrules)
  'aider', // Aider CLI (.aider.conf.yml)
  'claude', // Claude Code (CLAUDE.md) - default
  'gemini', // Google Gemini CLI (GEMINI.md)
  'codex', // OpenAI Codex CLI (AGENTS.md + .codex/)
  'zed', // Zed Editor (.rules)
  'amp', // Sourcegraph Amp (amp.toml)
  'roo', // Roo Code (.roo/rules/)
  'junie', // JetBrains Junie (.junie/guidelines.md)
  'cline', // Cline AI (.clinerules)
  'goose', // Block Goose (AGENTS.md + MCP extensions)
  'kiro', // Kiro CLI (~/.kiro/ - AWS Q Developer successor)
  'continue', // Continue.dev (config.yaml, .continue/rules/)
  'augment', // Augment Code (augment rules)
  'qodo', // Qodo AI (TOML config, best_practices.md)
  'opencode', // OpenCode AI (opencode.json, markdown agents)
  'zencoder', // Zencoder (Zen Rules - .zencoder/rules/*.md)
  'tabnine', // Tabnine (.tabnine/guidelines/)
  'amazonq', // Amazon Q Developer (.amazonq/rules/)
  'all' // Generate all formats
];

/**
 * Set for O(1) tool name lookup
 * @type {Set<string>}
 */
const SUPPORTED_TOOLS_SET = new Set(SUPPORTED_TOOLS);

/**
 * Check if a tool name is supported
 * @param {string} tool - Tool name to check
 * @returns {boolean} True if tool is supported
 */
export function isToolSupported(tool) {
  return SUPPORTED_TOOLS_SET.has(tool);
}

/**
 * Main generate command handler
 *
 * @param {object} options - Command options
 * @param {string|string[]} [options.tools=['all']] - AI tools to generate configs for
 * @param {boolean} [options.force=false] - Overwrite existing files
 * @param {boolean} [options.dryRun=false] - Show what would be created without creating
 * @returns {Promise<void>} Resolves when generation is complete
 * @throws {FrameworkError} If generation fails
 */
export async function generateCommand(options) {
  const cwd = process.cwd();

  console.log(chalk.cyan('\n  AI Excellence Framework - Multi-Tool Generator\n'));

  // Determine which tools to generate for
  let tools = options.tools || ['all'];
  if (typeof tools === 'string') {
    tools = tools.split(',').map(t => t.trim().toLowerCase());
  }

  if (tools.includes('all')) {
    tools = SUPPORTED_TOOLS.filter(t => t !== 'all');
  }

  // Validate tools (using O(1) Set lookup)
  const invalidTools = tools.filter(t => !isToolSupported(t));
  if (invalidTools.length > 0) {
    throw createError(
      'AIX-CONFIG-303',
      `Invalid tools: ${invalidTools.join(', ')}. Supported: ${SUPPORTED_TOOLS.join(', ')}`
    );
  }

  // Check for CLAUDE.md as source of truth
  const claudeMdPath = join(cwd, 'CLAUDE.md');
  let projectContext = null;

  if (existsSync(claudeMdPath)) {
    console.log(chalk.gray('  Using CLAUDE.md as source of truth\n'));
    const claudeMdContent = await readFile(claudeMdPath, 'utf-8');
    projectContext = parseProjectContext(claudeMdContent);
  } else if (!options.force) {
    console.log(chalk.yellow('  No CLAUDE.md found. Run "aix init" first or use --force.\n'));
    return;
  }

  const spinner = ora('Generating configuration files...').start();

  const results = {
    created: [],
    skipped: [],
    errors: []
  };

  try {
    // Generate each tool's configuration
    for (const tool of tools) {
      spinner.text = `Generating ${tool} configuration...`;

      try {
        switch (tool) {
          case 'agents':
            await generateAgentsMd(cwd, projectContext, options, results);
            break;
          case 'skills':
            await generateSkills(cwd, projectContext, options, results);
            break;
          case 'plugins':
            await generateClaudePlugins(cwd, projectContext, options, results);
            break;
          case 'cursor':
            await generateCursorRules(cwd, projectContext, options, results);
            break;
          case 'copilot':
            await generateCopilotInstructions(cwd, projectContext, options, results);
            break;
          case 'windsurf':
            await generateWindsurfRules(cwd, projectContext, options, results);
            break;
          case 'aider':
            await generateAiderConfig(cwd, projectContext, options, results);
            break;
          case 'claude':
            // CLAUDE.md is handled by init command
            results.skipped.push('CLAUDE.md (use "aix init" command)');
            break;
          case 'gemini':
            await generateGeminiConfig(cwd, projectContext, options, results);
            break;
          case 'codex':
            await generateCodexConfig(cwd, projectContext, options, results);
            break;
          case 'zed':
            await generateZedRules(cwd, projectContext, options, results);
            break;
          case 'amp':
            await generateAmpConfig(cwd, projectContext, options, results);
            break;
          case 'roo':
            await generateRooRules(cwd, projectContext, options, results);
            break;
          case 'junie':
            await generateJunieGuidelines(cwd, projectContext, options, results);
            break;
          case 'cline':
            await generateClineRules(cwd, projectContext, options, results);
            break;
          case 'goose':
            await generateGooseConfig(cwd, projectContext, options, results);
            break;
          case 'kiro':
            await generateKiroConfig(cwd, projectContext, options, results);
            break;
          case 'continue':
            await generateContinueConfig(cwd, projectContext, options, results);
            break;
          case 'augment':
            await generateAugmentConfig(cwd, projectContext, options, results);
            break;
          case 'qodo':
            await generateQodoConfig(cwd, projectContext, options, results);
            break;
          case 'opencode':
            await generateOpenCodeConfig(cwd, projectContext, options, results);
            break;
          case 'zencoder':
            await generateZencoderConfig(cwd, projectContext, options, results);
            break;
          case 'tabnine':
            await generateTabnineConfig(cwd, projectContext, options, results);
            break;
          case 'amazonq':
            await generateAmazonQConfig(cwd, projectContext, options, results);
            break;
          default:
            results.errors.push(`Unknown tool: ${tool}`);
        }
      } catch (error) {
        results.errors.push(`${tool}: ${error.message}`);
      }
    }

    spinner.succeed('Configuration files generated!');

    // Print results
    printResults(results, options.dryRun);
  } catch (error) {
    spinner.fail('Generation failed');

    // Re-throw if already a FrameworkError
    if (error instanceof FrameworkError) {
      throw error;
    }

    // Wrap and throw (CLI will handle exit code)
    throw createError('AIX-GEN-900', error.message, { cause: error });
  }
}

/**
 * Generate AGENTS.md (Linux Foundation standard)
 * @see https://agents.md
 * Note: Also available in modular form at ../generators/agents.js
 */
async function generateAgentsMd(cwd, context, options, results) {
  const targetPath = join(cwd, 'AGENTS.md');

  if (existsSync(targetPath) && !options.force) {
    results.skipped.push('AGENTS.md (already exists, use --force)');
    return;
  }

  const content = generateAgentsMdContent(context);

  if (!options.dryRun) {
    writeFileSync(targetPath, content);
  }
  results.created.push('AGENTS.md');
}

/**
 * Generate AGENTS.md content
 */
function generateAgentsMdContent(context) {
  const projectName = context?.projectName || basename(process.cwd());
  const techStackStr =
    context?.techStack?.map(t => `${t.category}: ${t.value}`).join(', ') || 'Not specified';

  return `# AGENTS.md

> Configuration for AI coding agents.
> Part of the [AAIF (Agentic AI Foundation)](https://aaif.io) standard under Linux Foundation governance.
> See [agents.md](https://agents.md) for specification.

## Project Overview

**Name**: ${projectName}
**Stack**: ${techStackStr}

${context?.overview || 'A software project configured for AI-assisted development.'}

## Build & Test

\`\`\`bash
# Install dependencies
npm install

# Run tests
npm test

# Build project
npm run build

# Run linter
npm run lint
\`\`\`

${context?.commands || ''}

## Architecture Overview

${
  context?.architecture ||
  `This project follows standard practices for its technology stack.

Key directories:
- \`src/\` - Source code
- \`tests/\` - Test files
- \`docs/\` - Documentation`
}

## Code Style & Conventions

${
  context?.conventions ||
  `- Use consistent naming conventions
- Follow the existing code style in the repository
- Write meaningful commit messages using conventional commits
- Add tests for new functionality`
}

## Security Guidelines

When generating or modifying code:

${
  context?.securityChecklist?.length > 0
    ? context.securityChecklist.map(item => `- ${item}`).join('\n')
    : `- Never hardcode secrets or credentials
- Validate all user inputs
- Avoid SQL/command/XSS injection vulnerabilities
- Verify dependencies exist before adding them
- Handle errors without exposing internal details`
}

## Git Workflow

- Create feature branches from \`main\`
- Use conventional commit messages (feat, fix, docs, refactor, test)
- Run tests before committing
- Request review for significant changes

## Boundaries & Restrictions

### Files to NEVER modify without explicit permission:
- \`.env\` files (contain secrets)
- \`package-lock.json\` / \`yarn.lock\` (modify via package manager)
- Generated files in \`dist/\` or \`build/\`
- Migration files (create new ones instead)

### Patterns to follow:
- Match existing code style
- Prefer composition over inheritance
- Keep functions focused and small
- Document complex logic

## Verification Commands

Before completing any task, run these checks:

\`\`\`bash
# Type checking (if applicable)
npm run typecheck || true

# Linting
npm run lint

# Tests
npm test

# Build verification
npm run build
\`\`\`

---
*Generated by [AI Excellence Framework](https://github.com/ai-excellence-framework/ai-excellence-framework)*
`;
}

/**
 * Generate Cursor IDE rules (.cursor/rules/)
 * @see https://docs.cursor.com/context/rules
 */
async function generateCursorRules(cwd, context, options, results) {
  const rulesDir = join(cwd, '.cursor', 'rules');

  if (!options.dryRun) {
    mkdirSync(rulesDir, { recursive: true });
  }

  // Generate main rules file
  const mainRulePath = join(rulesDir, 'project.mdc');
  if (!existsSync(mainRulePath) || options.force) {
    const content = generateCursorMainRule(context);
    if (!options.dryRun) {
      writeFileSync(mainRulePath, content);
    }
    results.created.push('.cursor/rules/project.mdc');
  } else {
    results.skipped.push('.cursor/rules/project.mdc (exists)');
  }

  // Generate security rules
  const securityRulePath = join(rulesDir, 'security.mdc');
  if (!existsSync(securityRulePath) || options.force) {
    const content = generateCursorSecurityRule(context);
    if (!options.dryRun) {
      writeFileSync(securityRulePath, content);
    }
    results.created.push('.cursor/rules/security.mdc');
  } else {
    results.skipped.push('.cursor/rules/security.mdc (exists)');
  }

  // Generate index file
  const indexPath = join(cwd, '.cursor', 'index.mdc');
  if (!existsSync(indexPath) || options.force) {
    const content = generateCursorIndex(context);
    if (!options.dryRun) {
      writeFileSync(indexPath, content);
    }
    results.created.push('.cursor/index.mdc');
  } else {
    results.skipped.push('.cursor/index.mdc (exists)');
  }
}

function generateCursorMainRule(context) {
  const projectName = context?.projectName || basename(process.cwd());

  return `---
description: Project-wide coding conventions and patterns for ${projectName}
alwaysApply: true
---

# Project: ${projectName}

## Tech Stack
${context?.techStack?.map(t => `- ${t.category}: ${t.value}`).join('\n') || '- See package.json for dependencies'}

## Conventions
${
  context?.conventions ||
  `- Follow existing code patterns in the repository
- Use consistent naming conventions
- Write meaningful variable and function names
- Add JSDoc comments for public APIs`
}

## Testing
- Write tests for new functionality
- Run \`npm test\` before committing
- Aim for meaningful coverage of critical paths

## Commit Messages
Use conventional commits:
- \`feat:\` new features
- \`fix:\` bug fixes
- \`docs:\` documentation
- \`refactor:\` code improvements
- \`test:\` test additions/changes
`;
}

function generateCursorSecurityRule(_context) {
  return `---
description: Security guidelines for AI-generated code
globs: ["**/*.{js,ts,jsx,tsx,py,go,java,rb}"]
alwaysApply: true
---

# Security Guidelines

## OWASP Top 10 Prevention

### Injection Prevention
- Never concatenate user input into SQL queries - use parameterized queries
- Never pass user input directly to shell commands - use safe APIs
- Sanitize HTML output to prevent XSS

### Authentication & Authorization
- Never hardcode credentials or secrets
- Validate authentication on every protected endpoint
- Use principle of least privilege

### Data Protection
- Never log sensitive data (passwords, tokens, PII)
- Encrypt sensitive data at rest and in transit
- Validate and sanitize all inputs

## AI-Specific Security

### Dependency Verification
Before adding any dependency:
1. Verify it exists on the package registry
2. Check download counts and maintenance status
3. Review for known vulnerabilities

### Code Review Checklist
- [ ] No hardcoded secrets
- [ ] Input validation present
- [ ] Error messages don't expose internals
- [ ] Dependencies are verified
- [ ] Authentication/authorization checked
`;
}

function generateCursorIndex(context) {
  const projectName = context?.projectName || basename(process.cwd());

  return `---
description: AI Excellence Framework configuration for ${projectName}
alwaysApply: true
---

# ${projectName}

${context?.overview || 'A software project configured with the AI Excellence Framework.'}

## Quick Reference

### Commands
\`\`\`bash
npm install    # Install dependencies
npm test       # Run tests
npm run build  # Build project
npm run lint   # Check code style
\`\`\`

### Key Files
- \`CLAUDE.md\` - Detailed project context
- \`AGENTS.md\` - Agent configuration (Linux Foundation standard)
- \`.cursor/rules/\` - Cursor-specific rules

### Working Guidelines
1. Read relevant documentation before making changes
2. Follow existing code patterns
3. Write tests for new functionality
4. Run verification commands before committing
`;
}

/**
 * Generate GitHub Copilot instructions
 * @see https://docs.github.com/copilot/customizing-copilot
 */
async function generateCopilotInstructions(cwd, context, options, results) {
  const githubDir = join(cwd, '.github');
  const targetPath = join(githubDir, 'copilot-instructions.md');

  if (!options.dryRun) {
    mkdirSync(githubDir, { recursive: true });
  }

  if (existsSync(targetPath) && !options.force) {
    results.skipped.push('.github/copilot-instructions.md (exists)');
    return;
  }

  const content = generateCopilotContent(context);

  if (!options.dryRun) {
    writeFileSync(targetPath, content);
  }
  results.created.push('.github/copilot-instructions.md');
}

function generateCopilotContent(context) {
  const projectName = context?.projectName || basename(process.cwd());

  return `# GitHub Copilot Instructions for ${projectName}

## Project Context

${context?.overview || 'This project uses the AI Excellence Framework for AI-assisted development.'}

## Tech Stack

${context?.techStack?.map(t => `- **${t.category}**: ${t.value}`).join('\n') || 'See package.json for dependencies.'}

## Code Style

${
  context?.conventions ||
  `- Follow existing patterns in the codebase
- Use consistent naming conventions
- Prefer explicit over implicit
- Write self-documenting code`
}

## Security Requirements

When generating code, always:

${
  context?.securityChecklist?.length > 0
    ? context.securityChecklist.map(item => `- ${item}`).join('\n')
    : `- Validate all user inputs
- Use parameterized queries for database operations
- Never hardcode secrets or credentials
- Sanitize output to prevent XSS
- Verify dependencies exist before suggesting them`
}

## Testing

- Write unit tests for new functions
- Include edge cases in test coverage
- Use descriptive test names

## Commit Messages

Use conventional commit format:
- \`feat:\` for new features
- \`fix:\` for bug fixes
- \`docs:\` for documentation
- \`refactor:\` for code improvements
- \`test:\` for test changes

## Files to Avoid Modifying

- \`.env\` files (contain secrets)
- Lock files (package-lock.json, yarn.lock)
- Generated/compiled files
- Migration files (create new ones instead)
`;
}

/**
 * Generate Windsurf IDE rules
 * Supports both .windsurf/rules/ directory and .windsurfrules single file
 * @see https://docs.windsurf.com/windsurf/cascade/memories
 * @see https://codeium.com/windsurf/directory
 */
async function generateWindsurfRules(cwd, context, options, results) {
  const windsurfDir = join(cwd, '.windsurf');
  const rulesDir = join(windsurfDir, 'rules');

  if (!options.dryRun) {
    mkdirSync(rulesDir, { recursive: true });
  }

  // Generate main rules file in directory format
  const mainRulePath = join(rulesDir, 'project.md');
  if (!existsSync(mainRulePath) || options.force) {
    const content = generateWindsurfMainRule(context);
    if (!options.dryRun) {
      writeFileSync(mainRulePath, content);
    }
    results.created.push('.windsurf/rules/project.md');
  } else {
    results.skipped.push('.windsurf/rules/project.md (exists)');
  }

  // Generate security rules in directory format
  const securityRulePath = join(rulesDir, 'security.md');
  if (!existsSync(securityRulePath) || options.force) {
    const content = generateWindsurfSecurityRule(context);
    if (!options.dryRun) {
      writeFileSync(securityRulePath, content);
    }
    results.created.push('.windsurf/rules/security.md');
  } else {
    results.skipped.push('.windsurf/rules/security.md (exists)');
  }

  // Also generate .windsurfrules single file format (legacy/alternative)
  const windsurfrulesPath = join(cwd, '.windsurfrules');
  if (!existsSync(windsurfrulesPath) || options.force) {
    const content = generateWindsurfrulesContent(context);
    if (!options.dryRun) {
      writeFileSync(windsurfrulesPath, content);
    }
    results.created.push('.windsurfrules');
  } else {
    results.skipped.push('.windsurfrules (exists)');
  }
}

/**
 * Generate .windsurfrules single file content
 */
function generateWindsurfrulesContent(context) {
  const projectName = context?.projectName || basename(process.cwd());

  return `# Windsurf Rules for ${projectName}

> Single-file format for Windsurf AI rules.
> See: https://codeium.com/windsurf/directory

## Project Overview

${(context?.overview || 'Project configured with AI Excellence Framework.').slice(0, 500)}

## Tech Stack

${context?.techStack?.map(t => `- ${t.category}: ${t.value}`).join('\n') || '- See package.json for dependencies'}

## Coding Conventions

${
  context?.conventions ||
  `- Follow existing code patterns in the repository
- Use consistent naming conventions
- Write self-documenting code
- Add tests for new functionality`
}

## Commands

\`\`\`bash
npm install    # Install dependencies
npm test       # Run tests
npm run build  # Build project
npm run lint   # Check code style
\`\`\`

## Security Guidelines

${
  context?.securityChecklist?.map(item => `- ${item}`).join('\n') ||
  `- Never hardcode secrets or credentials
- Validate all user inputs
- Use parameterized queries for databases
- Sanitize output to prevent XSS
- Verify dependencies exist before adding`
}

## Git Workflow

- Use conventional commits (feat, fix, docs, refactor, test)
- Run tests before committing
- Create feature branches from main
- Keep commits focused and atomic

## Files to Avoid

Never modify without explicit permission:
- .env files (contain secrets)
- Lock files (package-lock.json, yarn.lock)
- Generated files in dist/ or build/
- Migration files (create new ones instead)
`;
}

function generateWindsurfMainRule(context) {
  const projectName = context?.projectName || basename(process.cwd());

  // Windsurf rules have 6000 char limit per file
  return `# Project Rules: ${projectName}

## Overview
${(context?.overview || 'Project configured with AI Excellence Framework.').slice(0, 500)}

## Tech Stack
${
  context?.techStack
    ?.slice(0, 8)
    .map(t => `- ${t.category}: ${t.value}`)
    .join('\n') || '- See package.json'
}

## Conventions
- Follow existing code patterns
- Use conventional commits (feat, fix, docs, refactor, test)
- Write tests for new functionality
- Run \`npm test\` before committing

## Commands
\`\`\`bash
npm install  # Install dependencies
npm test     # Run tests
npm run lint # Check code style
\`\`\`

## Boundaries
Never modify without permission:
- .env files
- Lock files (package-lock.json)
- Generated files in dist/build
`;
}

function generateWindsurfSecurityRule(_context) {
  return `# Security Rules

## Input Validation
- Validate all user inputs
- Use parameterized queries
- Sanitize HTML output

## Secrets
- Never hardcode credentials
- Never log sensitive data
- Use environment variables

## Dependencies
- Verify packages exist before adding
- Check for known vulnerabilities
- Prefer well-maintained libraries

## Error Handling
- Don't expose internal details
- Log errors securely
- Return safe error messages
`;
}

/**
 * Generate Aider configuration
 * @see https://aider.chat/docs/config.html
 */
async function generateAiderConfig(cwd, context, options, results) {
  const targetPath = join(cwd, '.aider.conf.yml');

  if (existsSync(targetPath) && !options.force) {
    results.skipped.push('.aider.conf.yml (exists)');
    return;
  }

  const content = generateAiderContent(context);

  if (!options.dryRun) {
    writeFileSync(targetPath, content);
  }
  results.created.push('.aider.conf.yml');
}

function generateAiderContent(_context) {
  return `# Aider Configuration
# Generated by AI Excellence Framework
# See: https://aider.chat/docs/config.html

# Auto-commit changes with good messages
auto-commits: true

# Run linter after changes
auto-lint: true

# Run tests after changes
auto-test: true

# Test command
test-cmd: npm test

# Lint command
lint-cmd: npm run lint

# Git settings
git: true
gitignore: true

# Don't modify these files
read-only:
  - "*.lock"
  - ".env*"
  - "dist/**"
  - "build/**"

# Model preferences (uncomment to use)
# model: claude-3-5-sonnet-20241022
# weak-model: claude-3-haiku-20240307

# Editor mode preference
# edit-format: diff

# Security: verify code before accepting
show-diffs: true
`;
}

/**
 * Generate Google Gemini CLI configuration
 * @see https://developers.google.com/gemini-code-assist/docs/gemini-cli
 */
async function generateGeminiConfig(cwd, context, options, results) {
  const targetPath = join(cwd, 'GEMINI.md');

  if (existsSync(targetPath) && !options.force) {
    results.skipped.push('GEMINI.md (exists)');
    return;
  }

  const content = generateGeminiContent(context);

  if (!options.dryRun) {
    writeFileSync(targetPath, content);
  }
  results.created.push('GEMINI.md');
}

function generateGeminiContent(context) {
  const projectName = context?.projectName || basename(process.cwd());

  return `# Gemini CLI Project Configuration
# This file is read by Gemini CLI for project-specific context
# See: https://developers.google.com/gemini-code-assist/docs/gemini-cli

## Project: ${projectName}

${context?.overview || 'A software project configured for AI-assisted development with Gemini CLI.'}

## Tech Stack

${context?.techStack?.map(t => `- **${t.category}**: ${t.value}`).join('\n') || 'See package.json for dependencies.'}

## Architecture

${
  context?.architecture ||
  `Standard project structure:
- \`src/\` - Source code
- \`tests/\` - Test files
- \`docs/\` - Documentation`
}

## Commands

\`\`\`bash
npm install    # Install dependencies
npm test       # Run tests
npm run build  # Build project
npm run lint   # Check code style
\`\`\`

## Coding Conventions

${
  context?.conventions ||
  `- Follow existing code patterns
- Use conventional commits
- Write tests for new features
- Document public APIs`
}

## Security Guidelines

When generating code:
- Never hardcode secrets or credentials
- Validate all user inputs
- Use parameterized queries for databases
- Sanitize output to prevent XSS
- Verify dependencies exist before adding

## Boundaries

Files to never modify without explicit permission:
- \`.env\` files
- Lock files (package-lock.json, yarn.lock)
- Generated files in dist/ or build/
- Migration files

---
*Generated by [AI Excellence Framework](https://github.com/ai-excellence-framework/ai-excellence-framework)*
`;
}

/**
 * Generate OpenAI Codex CLI configuration
 * @see https://developers.openai.com/codex/
 */
async function generateCodexConfig(cwd, context, options, results) {
  const codexDir = join(cwd, '.codex');

  if (!options.dryRun) {
    mkdirSync(codexDir, { recursive: true });
  }

  // Generate config.toml
  const configPath = join(codexDir, 'config.toml');
  if (!existsSync(configPath) || options.force) {
    const content = generateCodexToml(context);
    if (!options.dryRun) {
      writeFileSync(configPath, content);
    }
    results.created.push('.codex/config.toml');
  } else {
    results.skipped.push('.codex/config.toml (exists)');
  }

  // Generate AGENTS.override.md for Codex-specific overrides
  const overridePath = join(codexDir, 'AGENTS.override.md');
  if (!existsSync(overridePath) || options.force) {
    const content = generateCodexAgentsOverride(context);
    if (!options.dryRun) {
      writeFileSync(overridePath, content);
    }
    results.created.push('.codex/AGENTS.override.md');
  } else {
    results.skipped.push('.codex/AGENTS.override.md (exists)');
  }
}

function generateCodexToml(_context) {
  return `# Codex CLI Configuration
# Generated by AI Excellence Framework
# See: https://developers.openai.com/codex/local-config/

# Approval settings
# ask_for_approval = "on-failure"  # Options: always, on-failure, never

# Sandbox settings for filesystem/network access
# sandbox_mode = "workspace-write"  # Options: off, workspace-write, workspace-read

# Model selection (uncomment to use)
# model = "gpt-5.2-codex"

# Additional writable paths beyond workspace
# writable_roots = []

# Execution policy file
# execpolicy_file = ".codex/execpolicy.json"
`;
}

function generateCodexAgentsOverride(context) {
  const projectName = context?.projectName || basename(process.cwd());

  return `# Codex-Specific Agent Instructions
# This file overrides AGENTS.md for Codex CLI
# See: https://developers.openai.com/codex/guides/agents-md/

## Project: ${projectName}

## Codex-Specific Guidelines

When working with Codex CLI:

### Verification
- Always run tests after making changes
- Use \`npm test\` for test verification
- Use \`npm run lint\` for code style

### Safety
- Prefer sandbox mode for untrusted operations
- Request approval for destructive actions
- Verify file paths before modifications

### Skills
- Use available Codex skills when applicable
- Invoke skills with \`$skill-name\` syntax

## Security Checklist
${
  context?.securityChecklist?.map(item => `- ${item}`).join('\n') ||
  `- Validate inputs
- No hardcoded secrets
- Sanitize outputs
- Verify dependencies`
}
`;
}

/**
 * Generate Zed Editor rules
 * @see https://zed.dev/docs/ai/rules
 */
async function generateZedRules(cwd, context, options, results) {
  const targetPath = join(cwd, '.rules');

  if (existsSync(targetPath) && !options.force) {
    results.skipped.push('.rules (exists)');
    return;
  }

  const content = generateZedContent(context);

  if (!options.dryRun) {
    writeFileSync(targetPath, content);
  }
  results.created.push('.rules');
}

function generateZedContent(context) {
  const projectName = context?.projectName || basename(process.cwd());

  return `# Zed AI Rules for ${projectName}
# Priority: .rules > .cursorrules > .windsurfrules > AGENTS.md
# See: https://zed.dev/docs/ai/rules

## Project Overview

${context?.overview || 'A software project configured for AI-assisted development.'}

## Tech Stack

${context?.techStack?.map(t => `- ${t.category}: ${t.value}`).join('\n') || 'See package.json for dependencies.'}

## Coding Conventions

${
  context?.conventions ||
  `- Follow existing patterns in the codebase
- Use consistent naming conventions
- Write self-documenting code
- Add tests for new functionality`
}

## Commands

\`\`\`bash
npm install    # Install dependencies
npm test       # Run tests
npm run build  # Build project
npm run lint   # Check code style
\`\`\`

## Security Requirements

When generating code:
- Never hardcode secrets or credentials
- Validate all user inputs
- Use parameterized queries for database operations
- Sanitize output to prevent XSS
- Verify dependencies exist before adding them

## Git Workflow

- Use conventional commits (feat, fix, docs, refactor, test)
- Run tests before committing
- Create feature branches from main

## Files to Avoid Modifying

- .env files (contain secrets)
- Lock files (package-lock.json, yarn.lock)
- Generated/compiled files in dist/ or build/
- Migration files (create new ones instead)
`;
}

/**
 * Generate Sourcegraph Amp configuration
 * @see https://ampcode.com/manual
 */
async function generateAmpConfig(cwd, context, options, results) {
  // Amp reads AGENTS.md, but we can add amp-specific config
  const targetPath = join(cwd, 'amp.toml');

  if (existsSync(targetPath) && !options.force) {
    results.skipped.push('amp.toml (exists)');
    return;
  }

  const content = generateAmpToml(context);

  if (!options.dryRun) {
    writeFileSync(targetPath, content);
  }
  results.created.push('amp.toml');
}

function generateAmpToml(_context) {
  return `# Amp Configuration
# Generated by AI Excellence Framework
# See: https://ampcode.com/manual

[amp]
# Enable extended thinking for complex tasks
# anthropic.thinking.enabled = true

# Enable todo tracking
todos.enabled = true

# Tool execution timeout (seconds)
tools.stopTimeout = 600

# Git integration
git.commit.ampThread.enabled = true
git.commit.coauthor.enabled = true

[amp.permissions]
# Define tool permissions
# Example: block dangerous commands
# [[amp.permissions.rules]]
# tool = "shell"
# action = "reject"
# pattern = "rm -rf /*"

[amp.terminal]
# Terminal settings
# commands.nodeSpawn.loadProfile = "daily"

# MCP Servers (uncomment to add)
# [amp.mcpServers]
# [amp.mcpServers.memory]
# command = "npx"
# args = ["-y", "@modelcontextprotocol/server-memory"]
`;
}

/**
 * Generate Roo Code rules
 * @see https://roocode.com
 */
async function generateRooRules(cwd, context, options, results) {
  const rooDir = join(cwd, '.roo');
  const rulesDir = join(rooDir, 'rules');

  if (!options.dryRun) {
    mkdirSync(rulesDir, { recursive: true });
  }

  // Generate main rules file
  const mainRulePath = join(rulesDir, 'project.md');
  if (!existsSync(mainRulePath) || options.force) {
    const content = generateRooMainRule(context);
    if (!options.dryRun) {
      writeFileSync(mainRulePath, content);
    }
    results.created.push('.roo/rules/project.md');
  } else {
    results.skipped.push('.roo/rules/project.md (exists)');
  }

  // Generate security rules
  const securityRulePath = join(rulesDir, 'security.md');
  if (!existsSync(securityRulePath) || options.force) {
    const content = generateRooSecurityRule(context);
    if (!options.dryRun) {
      writeFileSync(securityRulePath, content);
    }
    results.created.push('.roo/rules/security.md');
  } else {
    results.skipped.push('.roo/rules/security.md (exists)');
  }

  // Generate .roomodes file for custom modes
  const roomodesPath = join(rooDir, '.roomodes');
  if (!existsSync(roomodesPath) || options.force) {
    const content = generateRoomodes(context);
    if (!options.dryRun) {
      writeFileSync(roomodesPath, content);
    }
    results.created.push('.roo/.roomodes');
  } else {
    results.skipped.push('.roo/.roomodes (exists)');
  }
}

function generateRooMainRule(context) {
  const projectName = context?.projectName || basename(process.cwd());

  return `# Roo Code Project Rules: ${projectName}

## Overview
${context?.overview || 'A software project configured for AI-assisted development.'}

## Tech Stack
${context?.techStack?.map(t => `- ${t.category}: ${t.value}`).join('\n') || '- See package.json for dependencies'}

## Conventions
${
  context?.conventions ||
  `- Follow existing code patterns
- Use conventional commits (feat, fix, docs, refactor, test)
- Write tests for new functionality
- Run tests before committing`
}

## Commands
\`\`\`bash
npm install  # Install dependencies
npm test     # Run tests
npm run lint # Check code style
\`\`\`

## Git Workflow
- Create feature branches from main
- Use descriptive commit messages
- Run tests before pushing
`;
}

function generateRooSecurityRule(_context) {
  return `# Roo Code Security Rules

## Input Validation
- Validate all user inputs
- Use parameterized queries for databases
- Sanitize HTML output to prevent XSS

## Secrets Management
- Never hardcode credentials or API keys
- Use environment variables for secrets
- Never log sensitive data

## Dependency Security
- Verify packages exist before adding
- Check for known vulnerabilities
- Prefer well-maintained libraries

## Error Handling
- Don't expose internal details in error messages
- Log errors securely
- Return safe, generic error messages to users

## OWASP Top 10 Awareness
- Prevent injection attacks (SQL, command, XSS)
- Implement proper authentication
- Protect sensitive data
- Use secure configurations
`;
}

function generateRoomodes(_context) {
  return `{
  "customModes": [
    {
      "slug": "security-review",
      "name": "Security Review",
      "roleDefinition": "You are a security-focused code reviewer. Analyze code for OWASP Top 10 vulnerabilities, AI-specific security issues like slopsquatting, and general security best practices.",
      "groups": ["read", "command"],
      "customInstructions": "Focus on: injection vulnerabilities, authentication issues, sensitive data exposure, security misconfigurations, and dependency vulnerabilities. Check for hardcoded secrets and validate that all inputs are sanitized."
    },
    {
      "slug": "architect",
      "name": "Architect Mode",
      "roleDefinition": "You are a software architect focused on design patterns, scalability, and maintainability. Analyze code structure and suggest improvements.",
      "groups": ["read", "command"],
      "customInstructions": "Focus on: separation of concerns, SOLID principles, design patterns, and architectural best practices. Consider scalability and maintainability."
    }
  ]
}
`;
}

/**
 * Generate Agent Skills (SKILL.md)
 * Universal skills specification for Copilot, Codex, Claude Code
 * @see https://agentskills.io/specification
 */
async function generateSkills(cwd, context, options, results) {
  const skillsDir = join(cwd, '.github', 'skills', 'project-standards');

  if (!options.dryRun) {
    mkdirSync(skillsDir, { recursive: true });
  }

  // Generate main SKILL.md
  const skillPath = join(skillsDir, 'SKILL.md');
  if (!existsSync(skillPath) || options.force) {
    const content = generateSkillMdContent(context);
    if (!options.dryRun) {
      writeFileSync(skillPath, content);
    }
    results.created.push('.github/skills/project-standards/SKILL.md');
  } else {
    results.skipped.push('.github/skills/project-standards/SKILL.md (exists)');
  }

  // Also create security-review skill
  const securitySkillDir = join(cwd, '.github', 'skills', 'security-review');
  if (!options.dryRun) {
    mkdirSync(securitySkillDir, { recursive: true });
  }

  const securitySkillPath = join(securitySkillDir, 'SKILL.md');
  if (!existsSync(securitySkillPath) || options.force) {
    const content = generateSecuritySkillContent(context);
    if (!options.dryRun) {
      writeFileSync(securitySkillPath, content);
    }
    results.created.push('.github/skills/security-review/SKILL.md');
  } else {
    results.skipped.push('.github/skills/security-review/SKILL.md (exists)');
  }
}

function generateSkillMdContent(context) {
  const projectName = context?.projectName || basename(process.cwd());

  return `---
name: project-standards
description: Apply project coding standards, conventions, and best practices for ${projectName}
---

# Project Standards Skill

This skill ensures code follows the project's established patterns and conventions.

## When to Use

Activate this skill when:
- Writing new code in this repository
- Reviewing or modifying existing code
- Setting up new components or modules

## Coding Conventions

${
  context?.conventions ||
  `- Follow existing code patterns in the repository
- Use consistent naming conventions
- Write self-documenting code with clear variable names
- Add JSDoc/docstrings for public APIs`
}

## Tech Stack

${context?.techStack?.map(t => `- **${t.category}**: ${t.value}`).join('\n') || '- See package.json for dependencies'}

## Testing Requirements

- Write unit tests for new functionality
- Ensure tests pass before committing: \`npm test\`
- Include edge cases in test coverage

## Commit Standards

Use conventional commits:
- \`feat:\` new features
- \`fix:\` bug fixes
- \`docs:\` documentation changes
- \`refactor:\` code improvements
- \`test:\` test additions/changes

## Verification Commands

\`\`\`bash
npm test        # Run tests
npm run lint    # Check code style
npm run build   # Verify build
\`\`\`

## Files to Avoid

Never modify without explicit permission:
- \`.env\` files (contain secrets)
- Lock files (package-lock.json, yarn.lock)
- Generated files in dist/ or build/
`;
}

function generateSecuritySkillContent(_context) {
  return `---
name: security-review
description: Perform security-focused code review using OWASP guidelines and AI-specific security best practices
allowed-tools: Read, Grep, Glob
---

# Security Review Skill

This skill performs comprehensive security analysis of code.

## When to Use

Activate this skill when:
- Reviewing AI-generated code
- Auditing authentication/authorization code
- Checking for OWASP Top 10 vulnerabilities
- Validating dependency security

## OWASP Top 10 Checks

### 1. Injection Prevention
- SQL injection: Use parameterized queries
- Command injection: Avoid shell execution with user input
- XSS: Sanitize all HTML output

### 2. Authentication
- No hardcoded credentials
- Secure password hashing
- Proper session management

### 3. Sensitive Data
- Encrypt data at rest and in transit
- Never log passwords, tokens, or PII
- Use environment variables for secrets

## AI-Specific Security

### Slopsquatting Prevention
Before adding any dependency:
1. Verify package exists on registry (npm, PyPI, etc.)
2. Check download counts and maintenance status
3. Review for known vulnerabilities
4. Cross-reference with official documentation

### Code Review Checklist
- [ ] No hardcoded secrets or API keys
- [ ] Input validation present on all user inputs
- [ ] Error messages don't expose internal details
- [ ] Dependencies are verified (not hallucinated)
- [ ] Authentication/authorization properly checked
- [ ] No eval() or dynamic code execution with user input

## Security Commands

\`\`\`bash
npm audit              # Check for known vulnerabilities
npx snyk test          # Deep vulnerability scan
npm outdated           # Check for outdated packages
\`\`\`
`;
}

/**
 * Generate JetBrains Junie guidelines
 * @see https://www.jetbrains.com/help/junie/customize-guidelines.html
 */
async function generateJunieGuidelines(cwd, context, options, results) {
  const junieDir = join(cwd, '.junie');

  if (!options.dryRun) {
    mkdirSync(junieDir, { recursive: true });
  }

  const guidelinesPath = join(junieDir, 'guidelines.md');
  if (!existsSync(guidelinesPath) || options.force) {
    const content = generateJunieContent(context);
    if (!options.dryRun) {
      writeFileSync(guidelinesPath, content);
    }
    results.created.push('.junie/guidelines.md');
  } else {
    results.skipped.push('.junie/guidelines.md (exists)');
  }
}

function generateJunieContent(context) {
  const projectName = context?.projectName || basename(process.cwd());

  return `# Junie Guidelines for ${projectName}

> These guidelines are automatically loaded by JetBrains Junie AI agent.
> See: https://www.jetbrains.com/help/junie/customize-guidelines.html

## Project Overview

${context?.overview || 'A software project configured for AI-assisted development with JetBrains Junie.'}

## Tech Stack

${context?.techStack?.map(t => `- **${t.category}**: ${t.value}`).join('\n') || 'See package.json for dependencies.'}

## Coding Conventions

${
  context?.conventions ||
  `### General Rules
- Follow existing code patterns in the repository
- Use consistent naming conventions
- Write self-documenting code
- Add comments for complex logic only

### Naming Conventions
- camelCase for variables and functions
- PascalCase for classes and components
- SCREAMING_SNAKE_CASE for constants
- kebab-case for file names`
}

## Testing Guidelines

- Write unit tests for new functionality
- Use descriptive test names that explain the behavior
- Include edge cases and error conditions
- Run tests before committing: \`npm test\`

## Code Style

- Use consistent indentation (2 spaces recommended)
- Keep functions focused and small (<50 lines)
- Prefer composition over inheritance
- Use meaningful variable names

## Commands

\`\`\`bash
npm install    # Install dependencies
npm test       # Run tests
npm run build  # Build project
npm run lint   # Check code style
\`\`\`

## Security Guidelines

When generating code:
${
  context?.securityChecklist?.map(item => `- ${item}`).join('\n') ||
  `- Never hardcode secrets or credentials
- Validate all user inputs
- Use parameterized queries for databases
- Sanitize output to prevent XSS
- Verify dependencies exist before adding`
}

## Files to Avoid Modifying

- \`.env\` files (contain secrets)
- Lock files (package-lock.json, yarn.lock)
- Generated files in dist/ or build/
- Migration files (create new ones instead)

## Antipatterns to Avoid

- Don't use \`any\` type in TypeScript without justification
- Don't catch errors without handling them
- Don't leave console.log statements in production code
- Don't commit commented-out code
- Don't use deprecated APIs

---
*Generated by [AI Excellence Framework](https://github.com/ai-excellence-framework/ai-excellence-framework)*
`;
}

/**
 * Generate Cline rules
 * @see https://docs.cline.bot/features/cline-rules
 */
async function generateClineRules(cwd, context, options, results) {
  // Generate single .clinerules file (can also be a directory)
  const clinerulePath = join(cwd, '.clinerules');

  if (existsSync(clinerulePath) && !options.force) {
    results.skipped.push('.clinerules (exists)');
    return;
  }

  const content = generateClineContent(context);

  if (!options.dryRun) {
    writeFileSync(clinerulePath, content);
  }
  results.created.push('.clinerules');
}

function generateClineContent(context) {
  const projectName = context?.projectName || basename(process.cwd());

  return `# Cline Rules for ${projectName}

> These rules are automatically applied by Cline AI assistant.
> See: https://docs.cline.bot/features/cline-rules

## Project Context

${context?.overview || 'A software project configured for AI-assisted development with Cline.'}

## Tech Stack

${context?.techStack?.map(t => `- ${t.category}: ${t.value}`).join('\n') || 'See package.json for dependencies.'}

## Coding Standards

${
  context?.conventions ||
  `- Follow existing patterns in the codebase
- Use consistent naming conventions
- Write self-documenting code
- Add tests for new functionality`
}

## Commands

\`\`\`bash
npm install    # Install dependencies
npm test       # Run tests
npm run build  # Build project
npm run lint   # Check code style
\`\`\`

## Security Requirements

${
  context?.securityChecklist?.map(item => `- ${item}`).join('\n') ||
  `- Never hardcode secrets or credentials
- Validate all user inputs
- Use parameterized queries
- Sanitize output to prevent XSS
- Verify dependencies exist before adding`
}

## File Restrictions

Never modify without explicit permission:
- .env files
- Lock files (package-lock.json, yarn.lock)
- Generated files in dist/ or build/
- Database migration files

## Git Workflow

- Use conventional commits (feat, fix, docs, refactor, test)
- Run tests before committing
- Create descriptive commit messages
- Keep commits focused and atomic

## Plan Mode Guidelines

When in Plan mode:
- Analyze requirements thoroughly
- Consider edge cases
- Design before implementing
- Document architectural decisions

## Act Mode Guidelines

When in Act mode:
- Follow the established plan
- Make incremental changes
- Verify each step works
- Run tests after changes
`;
}

/**
 * Generate Block Goose configuration
 * Goose uses AGENTS.md + MCP servers
 * @see https://block.github.io/goose/
 */
async function generateGooseConfig(cwd, context, options, results) {
  // Goose primarily uses AGENTS.md which we already generate
  // We'll add a .goose directory with extension recommendations

  const gooseDir = join(cwd, '.goose');

  if (!options.dryRun) {
    mkdirSync(gooseDir, { recursive: true });
  }

  // Generate extensions.yaml for recommended MCP extensions
  const extensionsPath = join(gooseDir, 'extensions.yaml');
  if (!existsSync(extensionsPath) || options.force) {
    const content = generateGooseExtensions(context);
    if (!options.dryRun) {
      writeFileSync(extensionsPath, content);
    }
    results.created.push('.goose/extensions.yaml');
  } else {
    results.skipped.push('.goose/extensions.yaml (exists)');
  }

  // Generate README for Goose users
  const readmePath = join(gooseDir, 'README.md');
  if (!existsSync(readmePath) || options.force) {
    const content = generateGooseReadme(context);
    if (!options.dryRun) {
      writeFileSync(readmePath, content);
    }
    results.created.push('.goose/README.md');
  } else {
    results.skipped.push('.goose/README.md (exists)');
  }
}

function generateGooseExtensions(_context) {
  return `# Goose Extensions Configuration
# Recommended MCP extensions for this project
# See: https://block.github.io/goose/docs/guides/using-extensions/

# To add these extensions, run:
#   goose configure

recommended_extensions:
  # Developer tools (built-in)
  - name: developer
    enabled: true
    type: builtin
    description: Core development tools for file operations and shell commands

  # Memory for persistent context
  - name: memory
    enabled: true
    type: mcp
    command: npx
    args: ["-y", "@anthropic-ai/mcp-server-memory"]
    description: Persistent memory for decisions and patterns

  # Git operations
  - name: git
    enabled: true
    type: mcp
    command: npx
    args: ["-y", "@anthropic-ai/mcp-server-git"]
    description: Git operations and repository management

  # Filesystem access
  - name: filesystem
    enabled: true
    type: mcp
    command: npx
    args: ["-y", "@anthropic-ai/mcp-server-filesystem", "--allowed-directories", "."]
    description: Enhanced filesystem operations

# Optional extensions (uncomment to enable)
# - name: github
#   enabled: false
#   type: mcp
#   command: npx
#   args: ["-y", "@anthropic-ai/mcp-server-github"]
#   env:
#     GITHUB_TOKEN: "\${GITHUB_TOKEN}"

# - name: postgres
#   enabled: false
#   type: mcp
#   command: npx
#   args: ["-y", "@anthropic-ai/mcp-server-postgres"]
#   env:
#     DATABASE_URL: "\${DATABASE_URL}"
`;
}

function generateGooseReadme(context) {
  const projectName = context?.projectName || basename(process.cwd());

  return `# Goose Configuration for ${projectName}

This directory contains configuration for [Block Goose](https://block.github.io/goose/),
an open-source AI agent that runs locally on your machine.

## Quick Start

1. Install Goose: https://block.github.io/goose/docs/quickstart/
2. Configure your provider: \`goose configure\`
3. Start Goose: \`goose\` or use the desktop app

## Project Configuration

Goose automatically reads:
- \`AGENTS.md\` - Project-level AI agent instructions
- \`.goose/extensions.yaml\` - Recommended MCP extensions

## Recommended Extensions

See \`extensions.yaml\` for recommended MCP extensions including:
- **developer** - Core development tools
- **memory** - Persistent context across sessions
- **git** - Git operations
- **filesystem** - Enhanced file operations

## Security Notes

- Goose runs locally - your code never leaves your machine
- Review all suggested changes before accepting
- Use \`GOOSE_MODE=smart_approve\` for balanced security/convenience

## Links

- [Goose Documentation](https://block.github.io/goose/)
- [MCP Extensions](https://block.github.io/goose/docs/guides/using-extensions/)
- [AAIF (Agentic AI Foundation)](https://aaif.io)

---
*Generated by [AI Excellence Framework](https://github.com/ai-excellence-framework/ai-excellence-framework)*
`;
}

/**
 * Generate Claude Code Plugins
 * @see https://code.claude.com/docs/en/plugins-reference
 */
async function generateClaudePlugins(cwd, context, options, results) {
  const pluginDir = join(cwd, '.claude-plugin');

  if (!options.dryRun) {
    mkdirSync(pluginDir, { recursive: true });
  }

  // Generate plugin.json manifest
  const manifestPath = join(pluginDir, 'plugin.json');
  if (!existsSync(manifestPath) || options.force) {
    const content = generatePluginManifest(context);
    if (!options.dryRun) {
      writeFileSync(manifestPath, content);
    }
    results.created.push('.claude-plugin/plugin.json');
  } else {
    results.skipped.push('.claude-plugin/plugin.json (exists)');
  }

  // Generate plugin README
  const readmePath = join(pluginDir, 'README.md');
  if (!existsSync(readmePath) || options.force) {
    const content = generatePluginReadme(context);
    if (!options.dryRun) {
      writeFileSync(readmePath, content);
    }
    results.created.push('.claude-plugin/README.md');
  } else {
    results.skipped.push('.claude-plugin/README.md (exists)');
  }
}

function generatePluginManifest(context) {
  const projectName = context?.projectName || basename(process.cwd());
  const safeName = projectName.toLowerCase().replace(/[^a-z0-9-]/g, '-');

  return JSON.stringify(
    {
      name: safeName,
      version: '1.0.0',
      description: `Claude Code plugin for ${projectName}`,
      author: 'AI Excellence Framework',
      repository: '',
      commands: './commands',
      agents: './agents',
      skills: './skills',
      hooks: './hooks.json',
      mcp: './.mcp.json'
    },
    null,
    2
  );
}

function generatePluginReadme(context) {
  const projectName = context?.projectName || basename(process.cwd());

  return `# Claude Code Plugin: ${projectName}

This directory contains a Claude Code plugin configuration.

## Plugin Structure

\`\`\`
.claude-plugin/
├── plugin.json          # Plugin manifest (required)
├── README.md            # This file
├── commands/            # Slash commands (optional)
├── agents/              # Custom agents (optional)
├── skills/              # Agent skills (optional)
├── hooks.json           # Event hooks (optional)
└── .mcp.json            # MCP servers (optional)
\`\`\`

## Installation

This plugin is installed locally in the project. To share it:

1. Push to a git repository
2. Add to a marketplace: \`/plugin marketplace add your-org/your-repo\`
3. Others can install: \`/plugin install your-org/your-repo\`

## Plugin Scopes

- **User**: \`/plugin install --user\` - Available across all projects
- **Project**: \`/plugin install --project\` - Shared with collaborators
- **Local**: \`/plugin install --local\` - Only for you in this project

## Resources

- [Claude Code Plugins Docs](https://code.claude.com/docs/en/plugins-reference)
- [Plugin Marketplaces](https://code.claude.com/docs/en/discover-plugins)

---
*Generated by [AI Excellence Framework](https://github.com/ai-excellence-framework/ai-excellence-framework)*
`;
}

/**
 * Generate Kiro CLI configuration (AWS Q Developer successor)
 * @see https://kiro.dev/docs/cli/
 */
async function generateKiroConfig(cwd, context, options, results) {
  // Kiro uses project-local files, similar to Q Developer
  const kiroDir = join(cwd, '.kiro');

  if (!options.dryRun) {
    mkdirSync(kiroDir, { recursive: true });
  }

  // Generate MCP configuration
  const mcpPath = join(kiroDir, 'mcp.json');
  if (!existsSync(mcpPath) || options.force) {
    const content = generateKiroMcpConfig(context);
    if (!options.dryRun) {
      writeFileSync(mcpPath, content);
    }
    results.created.push('.kiro/mcp.json');
  } else {
    results.skipped.push('.kiro/mcp.json (exists)');
  }

  // Generate steering rules directory
  const steeringDir = join(kiroDir, 'steering');
  if (!options.dryRun) {
    mkdirSync(steeringDir, { recursive: true });
  }

  const steeringPath = join(steeringDir, 'project.md');
  if (!existsSync(steeringPath) || options.force) {
    const content = generateKiroSteering(context);
    if (!options.dryRun) {
      writeFileSync(steeringPath, content);
    }
    results.created.push('.kiro/steering/project.md');
  } else {
    results.skipped.push('.kiro/steering/project.md (exists)');
  }
}

function generateKiroMcpConfig(_context) {
  return JSON.stringify(
    {
      mcpServers: {
        memory: {
          command: 'npx',
          args: ['-y', '@anthropic-ai/mcp-server-memory'],
          disabled: false
        },
        filesystem: {
          command: 'npx',
          args: ['-y', '@anthropic-ai/mcp-server-filesystem', '--allowed-directories', '.'],
          disabled: false
        }
      }
    },
    null,
    2
  );
}

function generateKiroSteering(context) {
  const projectName = context?.projectName || basename(process.cwd());

  return `# Kiro Steering Rules for ${projectName}

> These rules guide Kiro CLI behavior for this project.
> See: https://kiro.dev/docs/cli/

## Project Context

${context?.overview || 'A software project configured for AI-assisted development with Kiro CLI.'}

## Tech Stack

${context?.techStack?.map(t => `- ${t.category}: ${t.value}`).join('\n') || 'See package.json for dependencies.'}

## Coding Standards

${
  context?.conventions ||
  `- Follow existing code patterns
- Use conventional commits
- Write tests for new features
- Run tests before committing`
}

## Commands

\`\`\`bash
npm install    # Install dependencies
npm test       # Run tests
npm run build  # Build project
npm run lint   # Check code style
\`\`\`

## Security Guidelines

${
  context?.securityChecklist?.map(item => `- ${item}`).join('\n') ||
  `- Never hardcode secrets or credentials
- Validate all user inputs
- Use parameterized queries
- Verify dependencies exist before adding`
}

## Files to Avoid

- .env files (contain secrets)
- Lock files (package-lock.json, yarn.lock)
- Generated files in dist/ or build/
- Migration files

---
*Generated by [AI Excellence Framework](https://github.com/ai-excellence-framework/ai-excellence-framework)*
`;
}

/**
 * Generate Continue.dev configuration
 * @see https://docs.continue.dev/reference
 */
async function generateContinueConfig(cwd, context, options, results) {
  const continueDir = join(cwd, '.continue');

  if (!options.dryRun) {
    mkdirSync(continueDir, { recursive: true });
  }

  // Generate config.yaml
  const configPath = join(continueDir, 'config.yaml');
  if (!existsSync(configPath) || options.force) {
    const content = generateContinueConfigYaml(context);
    if (!options.dryRun) {
      writeFileSync(configPath, content);
    }
    results.created.push('.continue/config.yaml');
  } else {
    results.skipped.push('.continue/config.yaml (exists)');
  }

  // Generate rules directory
  const rulesDir = join(continueDir, 'rules');
  if (!options.dryRun) {
    mkdirSync(rulesDir, { recursive: true });
  }

  const rulesPath = join(rulesDir, 'project.md');
  if (!existsSync(rulesPath) || options.force) {
    const content = generateContinueRules(context);
    if (!options.dryRun) {
      writeFileSync(rulesPath, content);
    }
    results.created.push('.continue/rules/project.md');
  } else {
    results.skipped.push('.continue/rules/project.md (exists)');
  }
}

function generateContinueConfigYaml(context) {
  const projectName = context?.projectName || basename(process.cwd());

  return `# Continue.dev Configuration
# See: https://docs.continue.dev/reference
# This file configures Continue's AI coding assistant

name: "${projectName}"
version: "1.0.0"

# Model configuration (uncomment and configure as needed)
# models:
#   - name: "claude-3-5-sonnet"
#     provider: "anthropic"
#     apiKey: "\${ANTHROPIC_API_KEY}"
#   - name: "gpt-4o"
#     provider: "openai"
#     apiKey: "\${OPENAI_API_KEY}"

# Context providers
contextProviders:
  - name: "code"
    params:
      nRetrieve: 25
  - name: "docs"
    params:
      sites:
        - title: "Project Docs"
          startUrl: "./docs"

# Slash commands
slashCommands:
  - name: "test"
    description: "Generate tests for selected code"
  - name: "docs"
    description: "Generate documentation for selected code"
  - name: "review"
    description: "Review selected code for issues"

# MCP servers (Model Context Protocol)
# mcpServers:
#   - name: "memory"
#     command: "npx"
#     args: ["-y", "@anthropic-ai/mcp-server-memory"]

# Rules directory for team standards
rules:
  - ".continue/rules/"
`;
}

function generateContinueRules(context) {
  const projectName = context?.projectName || basename(process.cwd());

  return `# Continue.dev Rules for ${projectName}

These rules are automatically applied by Continue's AI assistant.

## Project Overview

${context?.overview || 'A software project configured for AI-assisted development.'}

## Tech Stack

${context?.techStack?.map(t => `- **${t.category}**: ${t.value}`).join('\n') || 'See package.json for dependencies.'}

## Coding Conventions

${
  context?.conventions ||
  `- Follow existing patterns in the codebase
- Use consistent naming conventions
- Write self-documenting code
- Add tests for new functionality`
}

## Security Guidelines

${
  context?.securityChecklist?.map(item => `- ${item}`).join('\n') ||
  `- Never hardcode secrets or credentials
- Validate all user inputs
- Use parameterized queries for databases
- Sanitize output to prevent XSS
- Verify dependencies exist before adding`
}

## Commands

\`\`\`bash
npm install    # Install dependencies
npm test       # Run tests
npm run build  # Build project
npm run lint   # Check code style
\`\`\`

## Git Workflow

- Use conventional commits (feat, fix, docs, refactor, test)
- Run tests before committing
- Create feature branches from main
- Keep commits focused and atomic

---
*Generated by [AI Excellence Framework](https://github.com/ai-excellence-framework/ai-excellence-framework)*
`;
}

/**
 * Generate Augment Code configuration
 * @see https://www.augmentcode.com
 */
async function generateAugmentConfig(cwd, context, options, results) {
  const augmentDir = join(cwd, '.augment');

  if (!options.dryRun) {
    mkdirSync(augmentDir, { recursive: true });
  }

  // Generate augment rules
  const rulesPath = join(augmentDir, 'rules.md');
  if (!existsSync(rulesPath) || options.force) {
    const content = generateAugmentRules(context);
    if (!options.dryRun) {
      writeFileSync(rulesPath, content);
    }
    results.created.push('.augment/rules.md');
  } else {
    results.skipped.push('.augment/rules.md (exists)');
  }

  // Generate MCP configuration
  const mcpPath = join(augmentDir, 'mcp.json');
  if (!existsSync(mcpPath) || options.force) {
    const content = generateAugmentMcp(context);
    if (!options.dryRun) {
      writeFileSync(mcpPath, content);
    }
    results.created.push('.augment/mcp.json');
  } else {
    results.skipped.push('.augment/mcp.json (exists)');
  }
}

function generateAugmentRules(context) {
  const projectName = context?.projectName || basename(process.cwd());

  return `# Augment Code Rules for ${projectName}

> These rules guide Augment's AI agent behavior.
> See: https://www.augmentcode.com/changelog

## Project Overview

${context?.overview || 'A software project configured for AI-assisted development with Augment Code.'}

## Tech Stack

${context?.techStack?.map(t => `- **${t.category}**: ${t.value}`).join('\n') || 'See package.json for dependencies.'}

## Coding Conventions

${
  context?.conventions ||
  `### General Rules
- Follow existing code patterns in the repository
- Use consistent naming conventions
- Write self-documenting code
- Add comments for complex logic only

### Naming Conventions
- camelCase for variables and functions
- PascalCase for classes and components
- SCREAMING_SNAKE_CASE for constants
- kebab-case for file names`
}

## Testing Requirements

- Write unit tests for new functionality
- Run tests before committing: \`npm test\`
- Include edge cases and error conditions
- Use descriptive test names

## Security Guidelines

${
  context?.securityChecklist?.map(item => `- ${item}`).join('\n') ||
  `- Never hardcode secrets or credentials
- Validate all user inputs
- Use parameterized queries for databases
- Sanitize output to prevent XSS
- Verify dependencies exist before adding`
}

## Commands

\`\`\`bash
npm install    # Install dependencies
npm test       # Run tests
npm run build  # Build project
npm run lint   # Check code style
\`\`\`

## Files to Avoid

Never modify without explicit permission:
- \`.env\` files (contain secrets)
- Lock files (package-lock.json, yarn.lock)
- Generated files in dist/ or build/
- Migration files

## Custom Commands

Use these slash commands in Augment:
- \`/test\` - Generate tests for selected code
- \`/docs\` - Generate documentation
- \`/review\` - Review code for issues
- \`/refactor\` - Suggest refactoring improvements

---
*Generated by [AI Excellence Framework](https://github.com/ai-excellence-framework/ai-excellence-framework)*
`;
}

function generateAugmentMcp(_context) {
  return JSON.stringify(
    {
      mcpServers: {
        memory: {
          command: 'npx',
          args: ['-y', '@anthropic-ai/mcp-server-memory'],
          enabled: true
        },
        filesystem: {
          command: 'npx',
          args: ['-y', '@anthropic-ai/mcp-server-filesystem', '--allowed-directories', '.'],
          enabled: true
        }
      }
    },
    null,
    2
  );
}

/**
 * Generate Qodo AI configuration
 * @see https://www.qodo.ai
 */
async function generateQodoConfig(cwd, context, options, results) {
  // Generate qodo.toml configuration
  const configPath = join(cwd, 'qodo.toml');
  if (!existsSync(configPath) || options.force) {
    const content = generateQodoToml(context);
    if (!options.dryRun) {
      writeFileSync(configPath, content);
    }
    results.created.push('qodo.toml');
  } else {
    results.skipped.push('qodo.toml (exists)');
  }

  // Generate best_practices.md
  const bestPracticesPath = join(cwd, 'best_practices.md');
  if (!existsSync(bestPracticesPath) || options.force) {
    const content = generateQodoBestPractices(context);
    if (!options.dryRun) {
      writeFileSync(bestPracticesPath, content);
    }
    results.created.push('best_practices.md');
  } else {
    results.skipped.push('best_practices.md (exists)');
  }
}

function generateQodoToml(context) {
  const projectName = context?.projectName || basename(process.cwd());

  return `# Qodo AI Configuration
# See: https://www.qodo.ai
# This file configures Qodo's AI coding agents

[project]
name = "${projectName}"
version = "1.0.0"

[agent]
# Agent mode settings
default_mode = "code"  # Options: ask, code, plan

# Enable MCP tools
mcp_enabled = true

[testing]
# Test generation settings
framework = "jest"  # Options: jest, mocha, pytest, etc.
coverage_target = 80

[review]
# Code review settings
auto_review = true
security_checks = true
style_checks = true

[security]
# Security scanning
owasp_checks = true
dependency_audit = true
secret_detection = true

[git]
# Git integration
conventional_commits = true
auto_stage = false
branch_prefix = "feature/"

[commands]
# Custom test command
test = "npm test"
lint = "npm run lint"
build = "npm run build"

# Workflows (uncomment to customize)
# [workflows.review]
# steps = ["lint", "test", "security-scan"]

# [workflows.deploy]
# steps = ["test", "build", "deploy"]
`;
}

function generateQodoBestPractices(context) {
  const projectName = context?.projectName || basename(process.cwd());

  return `# Best Practices for ${projectName}

> This file is used by Qodo AI to enforce project-specific standards.
> It can be auto-generated by running \`/scan_repo_discussions\` in Qodo Merge.
> See: https://www.qodo.ai

## Coding Standards

${
  context?.conventions ||
  `### General Rules
- Follow existing code patterns in the repository
- Use consistent naming conventions
- Write self-documenting code with clear variable names
- Keep functions focused and small (< 50 lines)
- Prefer composition over inheritance

### Naming Conventions
- Variables: camelCase (\`userName\`, \`itemCount\`)
- Functions: camelCase with verb prefix (\`getUserById\`, \`calculateTotal\`)
- Classes: PascalCase (\`UserService\`, \`OrderProcessor\`)
- Constants: SCREAMING_SNAKE_CASE (\`MAX_RETRIES\`, \`API_BASE_URL\`)
- Files: kebab-case (\`user-service.js\`, \`order-utils.ts\`)`
}

## Security Requirements

${
  context?.securityChecklist?.map(item => `- ${item}`).join('\n') ||
  `- Never hardcode secrets, API keys, or credentials
- Validate and sanitize all user inputs
- Use parameterized queries for database operations
- Sanitize HTML output to prevent XSS attacks
- Verify that all dependencies exist and are maintained
- Check for known vulnerabilities before adding packages`
}

## Testing Standards

- Write unit tests for all new functions and methods
- Include tests for edge cases and error conditions
- Use descriptive test names that explain the expected behavior
- Aim for meaningful coverage of critical paths (80%+)
- Run \`npm test\` before every commit

## Code Review Checklist

When reviewing code, verify:
- [ ] No hardcoded secrets or sensitive data
- [ ] Input validation is present where needed
- [ ] Error handling doesn't expose internal details
- [ ] New dependencies are verified and necessary
- [ ] Tests are included for new functionality
- [ ] Code follows established patterns

## Git Workflow

- Use conventional commits: \`feat:\`, \`fix:\`, \`docs:\`, \`refactor:\`, \`test:\`
- Keep commits focused and atomic
- Run tests before pushing
- Create feature branches from \`main\`
- Request review for significant changes

## Files to Protect

Never modify without explicit permission:
- \`.env\` files (contain secrets)
- \`package-lock.json\` / \`yarn.lock\` (modify via package manager)
- Files in \`dist/\` or \`build/\` (generated)
- Database migration files (create new ones)

---
*Generated by [AI Excellence Framework](https://github.com/ai-excellence-framework/ai-excellence-framework)*
`;
}

/**
 * Generate OpenCode AI configuration
 * OpenCode uses opencode.json for configuration with markdown-based agents
 * @see https://opencode.ai
 */
async function generateOpenCodeConfig(cwd, context, options, results) {
  // Generate opencode.json configuration
  const configPath = join(cwd, 'opencode.json');
  if (!existsSync(configPath) || options.force) {
    const content = generateOpenCodeJson(context);
    if (!options.dryRun) {
      writeFileSync(configPath, content);
    }
    results.created.push('opencode.json');
  } else {
    results.skipped.push('opencode.json (exists)');
  }

  // Generate agents directory
  const agentsDir = join(cwd, '.opencode', 'agents');
  if (!options.dryRun) {
    mkdirSync(agentsDir, { recursive: true });
  }

  // Generate main agent markdown
  const agentPath = join(agentsDir, 'project.md');
  if (!existsSync(agentPath) || options.force) {
    const content = generateOpenCodeAgent(context);
    if (!options.dryRun) {
      writeFileSync(agentPath, content);
    }
    results.created.push('.opencode/agents/project.md');
  } else {
    results.skipped.push('.opencode/agents/project.md (exists)');
  }

  // Generate instructions file
  const instructionsPath = join(cwd, '.opencode', 'instructions.md');
  if (!existsSync(instructionsPath) || options.force) {
    const content = generateOpenCodeInstructions(context);
    if (!options.dryRun) {
      writeFileSync(instructionsPath, content);
    }
    results.created.push('.opencode/instructions.md');
  } else {
    results.skipped.push('.opencode/instructions.md (exists)');
  }
}

function generateOpenCodeJson(context) {
  const projectName = context?.projectName || basename(process.cwd());

  return JSON.stringify(
    {
      $schema: 'https://opencode.ai/schema/opencode.json',
      name: projectName,
      version: '1.0.0',
      model: {
        provider: 'anthropic',
        name: 'claude-sonnet-4-20250514'
      },
      tools: {
        shell: { enabled: true },
        file: { enabled: true },
        browser: { enabled: false }
      },
      formatter: {
        command: 'npm run format'
      },
      agents: '.opencode/agents',
      instructions: '.opencode/instructions.md',
      rules: [
        'Follow existing code patterns',
        'Use conventional commits',
        'Run tests before committing',
        'Never hardcode secrets'
      ]
    },
    null,
    2
  );
}

function generateOpenCodeAgent(context) {
  const projectName = context?.projectName || basename(process.cwd());

  return `---
name: project-assistant
description: AI assistant for ${projectName} development
tools: [shell, file]
---

# Project Assistant for ${projectName}

You are an AI coding assistant for this project.

## Project Overview

${context?.overview || 'A software project configured for AI-assisted development with OpenCode.'}

## Tech Stack

${context?.techStack?.map(t => `- **${t.category}**: ${t.value}`).join('\n') || 'See package.json for dependencies.'}

## Your Responsibilities

1. **Code Quality**: Write clean, maintainable code following project conventions
2. **Testing**: Write tests for new functionality
3. **Security**: Never hardcode secrets, validate inputs, use safe patterns
4. **Documentation**: Update docs when making significant changes

## Commands

\`\`\`bash
npm install    # Install dependencies
npm test       # Run tests
npm run build  # Build project
npm run lint   # Check code style
\`\`\`

## Coding Conventions

${
  context?.conventions ||
  `- Follow existing patterns in the codebase
- Use consistent naming conventions
- Write self-documenting code
- Add tests for new functionality`
}

## Security Guidelines

${
  context?.securityChecklist?.map(item => `- ${item}`).join('\n') ||
  `- Never hardcode secrets or credentials
- Validate all user inputs
- Use parameterized queries for databases
- Sanitize output to prevent XSS
- Verify dependencies exist before adding`
}

## Git Workflow

- Use conventional commits (feat, fix, docs, refactor, test)
- Run tests before committing
- Keep commits focused and atomic
`;
}

function generateOpenCodeInstructions(context) {
  const projectName = context?.projectName || basename(process.cwd());

  return `# OpenCode Instructions for ${projectName}

These instructions are automatically loaded by OpenCode AI.

## General Guidelines

- Read relevant documentation before making changes
- Follow existing code patterns
- Write tests for new functionality
- Run verification commands before committing

## Security Requirements

${
  context?.securityChecklist?.map(item => `- ${item}`).join('\n') ||
  `- Never hardcode secrets or credentials
- Validate all user inputs
- Use parameterized queries
- Sanitize output to prevent XSS
- Verify dependencies exist before adding`
}

## Files to Avoid Modifying

- \`.env\` files (contain secrets)
- Lock files (package-lock.json, yarn.lock)
- Generated files in dist/ or build/
- Migration files (create new ones instead)

## Verification Commands

Before completing any task:

\`\`\`bash
npm test       # Run tests
npm run lint   # Check code style
npm run build  # Verify build
\`\`\`

---
*Generated by [AI Excellence Framework](https://github.com/ai-excellence-framework/ai-excellence-framework)*
`;
}

/**
 * Generate Zencoder configuration (Zen Rules)
 * Zencoder uses .zencoder/rules/*.md with YAML frontmatter
 * @see https://zencoder.ai
 */
async function generateZencoderConfig(cwd, context, options, results) {
  const zencoderDir = join(cwd, '.zencoder');
  const rulesDir = join(zencoderDir, 'rules');

  if (!options.dryRun) {
    mkdirSync(rulesDir, { recursive: true });
  }

  // Generate main project rules
  const projectRulesPath = join(rulesDir, 'project.md');
  if (!existsSync(projectRulesPath) || options.force) {
    const content = generateZencoderProjectRules(context);
    if (!options.dryRun) {
      writeFileSync(projectRulesPath, content);
    }
    results.created.push('.zencoder/rules/project.md');
  } else {
    results.skipped.push('.zencoder/rules/project.md (exists)');
  }

  // Generate security rules
  const securityRulesPath = join(rulesDir, 'security.md');
  if (!existsSync(securityRulesPath) || options.force) {
    const content = generateZencoderSecurityRules(context);
    if (!options.dryRun) {
      writeFileSync(securityRulesPath, content);
    }
    results.created.push('.zencoder/rules/security.md');
  } else {
    results.skipped.push('.zencoder/rules/security.md (exists)');
  }

  // Generate testing rules
  const testingRulesPath = join(rulesDir, 'testing.md');
  if (!existsSync(testingRulesPath) || options.force) {
    const content = generateZencoderTestingRules(context);
    if (!options.dryRun) {
      writeFileSync(testingRulesPath, content);
    }
    results.created.push('.zencoder/rules/testing.md');
  } else {
    results.skipped.push('.zencoder/rules/testing.md (exists)');
  }

  // Generate zencoder.json config
  const configPath = join(zencoderDir, 'zencoder.json');
  if (!existsSync(configPath) || options.force) {
    const content = generateZencoderJson(context);
    if (!options.dryRun) {
      writeFileSync(configPath, content);
    }
    results.created.push('.zencoder/zencoder.json');
  } else {
    results.skipped.push('.zencoder/zencoder.json (exists)');
  }
}

function generateZencoderProjectRules(context) {
  const projectName = context?.projectName || basename(process.cwd());

  return `---
description: Project-wide coding conventions and patterns for ${projectName}
globs:
  - "**/*.{js,ts,jsx,tsx}"
  - "**/*.{py,rb,go,java}"
alwaysApply: true
---

# Project Rules: ${projectName}

## Overview

${context?.overview || 'A software project configured for AI-assisted development with Zencoder.'}

## Tech Stack

${context?.techStack?.map(t => `- **${t.category}**: ${t.value}`).join('\n') || 'See package.json for dependencies.'}

## Coding Conventions

${
  context?.conventions ||
  `### General Rules
- Follow existing code patterns in the repository
- Use consistent naming conventions
- Write self-documenting code
- Keep functions focused and small

### Naming Conventions
- camelCase for variables and functions
- PascalCase for classes and components
- SCREAMING_SNAKE_CASE for constants
- kebab-case for file names`
}

## Commands

\`\`\`bash
npm install    # Install dependencies
npm test       # Run tests
npm run build  # Build project
npm run lint   # Check code style
\`\`\`

## Git Workflow

- Use conventional commits (feat, fix, docs, refactor, test)
- Run tests before committing
- Create feature branches from main
- Keep commits focused and atomic

## Files to Avoid

Never modify without explicit permission:
- \`.env\` files (contain secrets)
- Lock files (package-lock.json, yarn.lock)
- Generated files in dist/ or build/
- Migration files
`;
}

function generateZencoderSecurityRules(_context) {
  return `---
description: Security guidelines for AI-generated code
globs:
  - "**/*.{js,ts,jsx,tsx,py,go,java,rb}"
alwaysApply: true
priority: high
---

# Security Rules

## OWASP Top 10 Prevention

### Injection Prevention
- Never concatenate user input into SQL queries - use parameterized queries
- Never pass user input directly to shell commands - use safe APIs
- Sanitize HTML output to prevent XSS

### Authentication & Authorization
- Never hardcode credentials or secrets
- Validate authentication on every protected endpoint
- Use principle of least privilege

### Data Protection
- Never log sensitive data (passwords, tokens, PII)
- Encrypt sensitive data at rest and in transit
- Validate and sanitize all inputs

## AI-Specific Security

### Dependency Verification
Before adding any dependency:
1. Verify it exists on the package registry
2. Check download counts and maintenance status
3. Review for known vulnerabilities

### Code Review Checklist
- [ ] No hardcoded secrets
- [ ] Input validation present
- [ ] Error messages don't expose internals
- [ ] Dependencies are verified
- [ ] Authentication/authorization checked

## Error Handling

- Don't expose internal details in error messages
- Log errors securely
- Return safe, generic error messages to users
`;
}

function generateZencoderTestingRules(_context) {
  return `---
description: Testing standards and requirements
globs:
  - "**/*.test.{js,ts,jsx,tsx}"
  - "**/*.spec.{js,ts,jsx,tsx}"
  - "**/test/**/*"
  - "**/tests/**/*"
alwaysApply: false
---

# Testing Rules

## Test Coverage Requirements

- Write unit tests for all new functions and methods
- Include tests for edge cases and error conditions
- Aim for meaningful coverage of critical paths (80%+)

## Test Naming

Use descriptive test names that explain the expected behavior:

\`\`\`javascript
// Good
test('should return null when user is not found', () => {});
test('throws error when email format is invalid', () => {});

// Avoid
test('test1', () => {});
test('works', () => {});
\`\`\`

## Test Structure

Follow the Arrange-Act-Assert pattern:

\`\`\`javascript
test('should calculate total with discount', () => {
  // Arrange
  const items = [{ price: 100 }, { price: 50 }];
  const discount = 0.1;

  // Act
  const result = calculateTotal(items, discount);

  // Assert
  expect(result).toBe(135);
});
\`\`\`

## Verification Commands

\`\`\`bash
npm test              # Run all tests
npm test -- --watch   # Watch mode
npm run test:coverage # Generate coverage report
\`\`\`
`;
}

function generateZencoderJson(context) {
  const projectName = context?.projectName || basename(process.cwd());

  return JSON.stringify(
    {
      name: projectName,
      version: '1.0.0',
      rules: {
        directory: '.zencoder/rules',
        autoApply: true
      },
      codebase: {
        include: ['src/**/*', 'lib/**/*', 'tests/**/*'],
        exclude: ['node_modules', 'dist', 'build', '.git']
      },
      commands: {
        test: 'npm test',
        lint: 'npm run lint',
        build: 'npm run build',
        format: 'npm run format'
      },
      security: {
        scanDependencies: true,
        checkSecrets: true
      }
    },
    null,
    2
  );
}

/**
 * Generate Tabnine configuration
 * @see https://www.tabnine.com/getting-started
 * Tabnine uses .tabnine/guidelines/ directory with markdown files
 */
async function generateTabnineConfig(cwd, context, options, results) {
  const guidelinesDir = join(cwd, '.tabnine', 'guidelines');

  if (!existsSync(guidelinesDir)) {
    if (!options.dryRun) {
      mkdirSync(guidelinesDir, { recursive: true });
    }
    results.created.push('.tabnine/guidelines/');
  }

  // Generate main guidelines file
  const mainPath = join(guidelinesDir, 'project.md');
  if (!existsSync(mainPath) || options.force) {
    const content = generateTabnineProjectGuidelines(context);
    if (!options.dryRun) {
      writeFileSync(mainPath, content);
    }
    results.created.push('.tabnine/guidelines/project.md');
  } else {
    results.skipped.push('.tabnine/guidelines/project.md (exists)');
  }

  // Generate coding standards file
  const codingPath = join(guidelinesDir, 'coding-standards.md');
  if (!existsSync(codingPath) || options.force) {
    const content = generateTabnineCodingStandards(context);
    if (!options.dryRun) {
      writeFileSync(codingPath, content);
    }
    results.created.push('.tabnine/guidelines/coding-standards.md');
  } else {
    results.skipped.push('.tabnine/guidelines/coding-standards.md (exists)');
  }

  // Generate security guidelines file
  const securityPath = join(guidelinesDir, 'security.md');
  if (!existsSync(securityPath) || options.force) {
    const content = generateTabnineSecurityGuidelines(context);
    if (!options.dryRun) {
      writeFileSync(securityPath, content);
    }
    results.created.push('.tabnine/guidelines/security.md');
  } else {
    results.skipped.push('.tabnine/guidelines/security.md (exists)');
  }
}

function generateTabnineProjectGuidelines(context) {
  const projectName = context?.projectName || basename(process.cwd());

  return `# Project Guidelines: ${projectName}

> Tabnine AI guidelines for this project.
> See: https://www.tabnine.com/getting-started

## Project Overview

${context?.overview || 'Project configured with AI Excellence Framework.'}

## Tech Stack

${context?.techStack?.map(t => `- **${t.category}**: ${t.value}`).join('\n') || '- See package.json for dependencies'}

## Architecture

${context?.architecture || 'Follow existing patterns in the codebase.'}

## Commands

\`\`\`bash
npm install    # Install dependencies
npm test       # Run tests
npm run build  # Build project
npm run lint   # Check code style
\`\`\`

## Current State

${context?.currentState || 'Refer to CLAUDE.md or README.md for current project status.'}

## Conventions

${
  context?.conventions ||
  `- Follow existing code patterns in the repository
- Use consistent naming conventions
- Write self-documenting code
- Add tests for new functionality
- Use conventional commits (feat, fix, docs, refactor, test)`
}
`;
}

function generateTabnineCodingStandards(context) {
  return `# Coding Standards

> Standards for code generation in this project.

## Naming Conventions

- Use descriptive, meaningful names
- camelCase for variables and functions
- PascalCase for classes and types
- SCREAMING_SNAKE_CASE for constants
- kebab-case for file names

## Code Style

${
  context?.conventions ||
  `- Use modern JavaScript/TypeScript features
- Prefer const over let, avoid var
- Use async/await over callbacks
- Keep functions focused and small
- Add JSDoc comments for public APIs`
}

## Error Handling

- Always handle errors explicitly
- Use try-catch for async operations
- Provide meaningful error messages
- Never silently swallow errors

## Testing

- Write tests for new functionality
- Follow Arrange-Act-Assert pattern
- Use descriptive test names
- Aim for 80%+ coverage on critical paths

## Documentation

- Add comments for complex logic
- Keep README.md up to date
- Document API changes
`;
}

function generateTabnineSecurityGuidelines(_context) {
  return `# Security Guidelines

> Security requirements for generated code.

## Input Validation

- Validate all user inputs
- Use parameterized queries for databases
- Sanitize HTML output to prevent XSS
- Validate file paths to prevent traversal

## Secrets Management

- Never hardcode secrets or credentials
- Never log sensitive data
- Use environment variables for configuration
- Never commit .env files

## Dependencies

- Verify packages exist before adding
- Check for known vulnerabilities
- Prefer well-maintained libraries
- Keep dependencies updated

## Error Handling

- Don't expose internal details in errors
- Log errors securely (no sensitive data)
- Return generic error messages to users

## Access Control

- Implement proper authentication
- Use role-based access control
- Validate permissions on every request
`;
}

/**
 * Generate Amazon Q Developer configuration
 * @see https://docs.aws.amazon.com/amazonq/latest/qdeveloper-ug/
 * Amazon Q uses .amazonq/rules/ directory with markdown files
 */
async function generateAmazonQConfig(cwd, context, options, results) {
  const rulesDir = join(cwd, '.amazonq', 'rules');

  if (!existsSync(rulesDir)) {
    if (!options.dryRun) {
      mkdirSync(rulesDir, { recursive: true });
    }
    results.created.push('.amazonq/rules/');
  }

  // Generate main rules file
  const mainPath = join(rulesDir, 'project-rules.md');
  if (!existsSync(mainPath) || options.force) {
    const content = generateAmazonQProjectRules(context);
    if (!options.dryRun) {
      writeFileSync(mainPath, content);
    }
    results.created.push('.amazonq/rules/project-rules.md');
  } else {
    results.skipped.push('.amazonq/rules/project-rules.md (exists)');
  }

  // Generate coding rules file
  const codingPath = join(rulesDir, 'coding-rules.md');
  if (!existsSync(codingPath) || options.force) {
    const content = generateAmazonQCodingRules(context);
    if (!options.dryRun) {
      writeFileSync(codingPath, content);
    }
    results.created.push('.amazonq/rules/coding-rules.md');
  } else {
    results.skipped.push('.amazonq/rules/coding-rules.md (exists)');
  }

  // Generate security rules file
  const securityPath = join(rulesDir, 'security-rules.md');
  if (!existsSync(securityPath) || options.force) {
    const content = generateAmazonQSecurityRules(context);
    if (!options.dryRun) {
      writeFileSync(securityPath, content);
    }
    results.created.push('.amazonq/rules/security-rules.md');
  } else {
    results.skipped.push('.amazonq/rules/security-rules.md (exists)');
  }
}

function generateAmazonQProjectRules(context) {
  const projectName = context?.projectName || basename(process.cwd());

  return `# Project Rules: ${projectName}

> Amazon Q Developer rules for this project.
> See: https://docs.aws.amazon.com/amazonq/latest/qdeveloper-ug/

## Project Overview

${context?.overview || 'Project configured with AI Excellence Framework.'}

## Tech Stack

${context?.techStack?.map(t => `- **${t.category}**: ${t.value}`).join('\n') || '- See package.json for dependencies'}

## Architecture

${context?.architecture || 'Follow existing patterns in the codebase.'}

## Commands

\`\`\`bash
npm install    # Install dependencies
npm test       # Run tests
npm run build  # Build project
npm run lint   # Check code style
\`\`\`

## Current State

${context?.currentState || 'Refer to CLAUDE.md or README.md for current project status.'}

## Development Workflow

1. Create feature branch from main
2. Make changes following project conventions
3. Write tests for new functionality
4. Run tests and linting
5. Create pull request with descriptive title

## Conventions

${
  context?.conventions ||
  `- Follow existing code patterns in the repository
- Use consistent naming conventions
- Write self-documenting code
- Add tests for new functionality
- Use conventional commits (feat, fix, docs, refactor, test)`
}
`;
}

function generateAmazonQCodingRules(context) {
  return `# Coding Rules

> Code generation rules for Amazon Q Developer.

## Naming Conventions

- Use descriptive, meaningful names
- camelCase for variables and functions
- PascalCase for classes, types, and components
- SCREAMING_SNAKE_CASE for constants
- kebab-case for file names

## Code Style

${
  context?.conventions ||
  `- Use modern JavaScript/TypeScript features
- Prefer const over let, avoid var
- Use async/await over callbacks
- Keep functions focused and small (< 50 lines)
- Add JSDoc comments for public APIs`
}

## Error Handling

- Always handle errors explicitly
- Use try-catch for async operations
- Provide meaningful error messages
- Log errors with appropriate severity

## Testing Requirements

- Write unit tests for new functions
- Write integration tests for APIs
- Follow Arrange-Act-Assert pattern
- Use descriptive test names

## Documentation

- Add JSDoc for public interfaces
- Update README for new features
- Document breaking changes
- Include usage examples

## Files to Avoid

Never modify without explicit permission:
- .env files (contain secrets)
- Lock files (package-lock.json, yarn.lock)
- Generated files in dist/ or build/
- Database migration files
`;
}

function generateAmazonQSecurityRules(_context) {
  return `# Security Rules

> Security requirements for code generated by Amazon Q Developer.

## Input Validation

- Validate all user inputs at boundaries
- Use parameterized queries for databases
- Sanitize HTML output to prevent XSS
- Validate file paths to prevent directory traversal
- Check content types for file uploads

## Secrets Management

- Never hardcode secrets, API keys, or credentials
- Never log sensitive data (passwords, tokens, PII)
- Use environment variables for configuration
- Never commit .env files to version control
- Rotate secrets regularly

## Dependencies

- Verify npm packages exist before adding
- Check for known vulnerabilities (npm audit)
- Prefer well-maintained, popular libraries
- Review transitive dependencies
- Keep dependencies up to date

## AWS-Specific Security

- Use IAM roles with least privilege
- Enable CloudTrail logging
- Encrypt data at rest and in transit
- Use VPC for network isolation
- Implement proper S3 bucket policies

## Error Handling

- Don't expose stack traces or internal details
- Log errors securely (no credentials in logs)
- Return generic error messages to users
- Implement proper error boundaries

## Authentication & Authorization

- Use strong authentication mechanisms
- Implement MFA where possible
- Validate JWT tokens properly
- Use role-based access control (RBAC)
- Check permissions on every request
`;
}

/**
 * Print generation results
 */
function printResults(results, dryRun) {
  console.log('');

  if (results.created.length > 0) {
    console.log(
      chalk.green(`  ${dryRun ? 'Would create' : 'Created'} ${results.created.length} files:`)
    );
    results.created.forEach(f => console.log(chalk.gray(`    ✓ ${f}`)));
  }

  if (results.skipped.length > 0) {
    console.log(chalk.yellow(`\n  Skipped ${results.skipped.length} files:`));
    results.skipped.forEach(f => console.log(chalk.gray(`    - ${f}`)));
  }

  if (results.errors.length > 0) {
    console.log(chalk.red('\n  Errors:'));
    results.errors.forEach(e => console.log(chalk.red(`    ✗ ${e}`)));
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

export default generateCommand;
