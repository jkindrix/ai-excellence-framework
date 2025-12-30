/**
 * AI Excellence Framework - Generate Command
 *
 * Generates configuration files for multiple AI coding tools:
 * - AGENTS.md (Linux Foundation standard)
 * - Cursor rules (.cursor/rules/)
 * - GitHub Copilot instructions (.github/copilot-instructions.md)
 * - Windsurf rules (.windsurf/rules/)
 * - Aider configuration (.aider.conf.yml)
 *
 * This enables the framework to work across all major AI coding assistants.
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { join, dirname, basename } from 'path';
import { fileURLToPath } from 'url';
import chalk from 'chalk';
import ora from 'ora';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const _PACKAGE_ROOT = join(__dirname, '..', '..');

/**
 * Supported AI tools
 * @see https://agents.md - Linux Foundation AAIF standard
 */
export const SUPPORTED_TOOLS = [
  'agents', // AGENTS.md (Linux Foundation AAIF standard)
  'cursor', // Cursor IDE (.cursor/rules/)
  'copilot', // GitHub Copilot (.github/copilot-instructions.md)
  'windsurf', // Windsurf IDE (.windsurf/rules/)
  'aider', // Aider CLI (.aider.conf.yml)
  'claude', // Claude Code (CLAUDE.md) - default
  'gemini', // Google Gemini CLI (GEMINI.md)
  'codex', // OpenAI Codex CLI (AGENTS.md + .codex/)
  'zed', // Zed Editor (.rules)
  'amp', // Sourcegraph Amp (amp.toml)
  'roo', // Roo Code (.roo/rules/)
  'all' // Generate all formats
];

/**
 * Main generate command handler
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

  // Validate tools
  const invalidTools = tools.filter(t => !SUPPORTED_TOOLS.includes(t));
  if (invalidTools.length > 0) {
    console.error(chalk.red(`  Invalid tools: ${invalidTools.join(', ')}`));
    console.log(chalk.gray(`  Supported: ${SUPPORTED_TOOLS.join(', ')}`));
    process.exit(1);
  }

  // Check for CLAUDE.md as source of truth
  const claudeMdPath = join(cwd, 'CLAUDE.md');
  let projectContext = null;

  if (existsSync(claudeMdPath)) {
    console.log(chalk.gray('  Using CLAUDE.md as source of truth\n'));
    projectContext = parseProjectContext(readFileSync(claudeMdPath, 'utf-8'));
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
    console.error(chalk.red(`\n  Error: ${error.message}\n`));
    process.exit(1);
  }
}

/**
 * Parse CLAUDE.md into structured project context
 */
function parseProjectContext(content) {
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

  return context;
}

/**
 * Extract sections from markdown
 */
function extractSections(content) {
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
 */
function extractTechStack(content) {
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
 */
function extractSecurityChecklist(content) {
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
 * Generate AGENTS.md (Linux Foundation standard)
 * @see https://agents.md
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
  const techStackStr = context?.techStack?.map(t => `${t.category}: ${t.value}`).join(', ') || 'Not specified';

  return `# AGENTS.md

> Configuration for AI coding agents. See [agents.md](https://agents.md) for specification.

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

${context?.architecture || `This project follows standard practices for its technology stack.

Key directories:
- \`src/\` - Source code
- \`tests/\` - Test files
- \`docs/\` - Documentation`}

## Code Style & Conventions

${context?.conventions || `- Use consistent naming conventions
- Follow the existing code style in the repository
- Write meaningful commit messages using conventional commits
- Add tests for new functionality`}

## Security Guidelines

When generating or modifying code:

${context?.securityChecklist?.length > 0
    ? context.securityChecklist.map(item => `- ${item}`).join('\n')
    : `- Never hardcode secrets or credentials
- Validate all user inputs
- Avoid SQL/command/XSS injection vulnerabilities
- Verify dependencies exist before adding them
- Handle errors without exposing internal details`}

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
${context?.conventions || `- Follow existing code patterns in the repository
- Use consistent naming conventions
- Write meaningful variable and function names
- Add JSDoc comments for public APIs`}

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

${context?.conventions || `- Follow existing patterns in the codebase
- Use consistent naming conventions
- Prefer explicit over implicit
- Write self-documenting code`}

## Security Requirements

When generating code, always:

${context?.securityChecklist?.length > 0
    ? context.securityChecklist.map(item => `- ${item}`).join('\n')
    : `- Validate all user inputs
- Use parameterized queries for database operations
- Never hardcode secrets or credentials
- Sanitize output to prevent XSS
- Verify dependencies exist before suggesting them`}

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
 * @see https://docs.windsurf.com/windsurf/cascade/memories
 */
async function generateWindsurfRules(cwd, context, options, results) {
  const windsurfDir = join(cwd, '.windsurf');
  const rulesDir = join(windsurfDir, 'rules');

  if (!options.dryRun) {
    mkdirSync(rulesDir, { recursive: true });
  }

  // Generate main rules file
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

  // Generate security rules
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
}

function generateWindsurfMainRule(context) {
  const projectName = context?.projectName || basename(process.cwd());

  // Windsurf rules have 6000 char limit per file
  return `# Project Rules: ${projectName}

## Overview
${(context?.overview || 'Project configured with AI Excellence Framework.').slice(0, 500)}

## Tech Stack
${context?.techStack?.slice(0, 8).map(t => `- ${t.category}: ${t.value}`).join('\n') || '- See package.json'}

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

${context?.architecture || `Standard project structure:
- \`src/\` - Source code
- \`tests/\` - Test files
- \`docs/\` - Documentation`}

## Commands

\`\`\`bash
npm install    # Install dependencies
npm test       # Run tests
npm run build  # Build project
npm run lint   # Check code style
\`\`\`

## Coding Conventions

${context?.conventions || `- Follow existing code patterns
- Use conventional commits
- Write tests for new features
- Document public APIs`}

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
${context?.securityChecklist?.map(item => `- ${item}`).join('\n') || `- Validate inputs
- No hardcoded secrets
- Sanitize outputs
- Verify dependencies`}
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

${context?.conventions || `- Follow existing patterns in the codebase
- Use consistent naming conventions
- Write self-documenting code
- Add tests for new functionality`}

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
${context?.conventions || `- Follow existing code patterns
- Use conventional commits (feat, fix, docs, refactor, test)
- Write tests for new functionality
- Run tests before committing`}

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
  console.log(chalk.gray('  Your project now works with: Claude, Cursor, Copilot, Windsurf, Aider,'));
  console.log(chalk.gray('  Gemini CLI, Codex CLI, Zed, Amp, and Roo Code\n'));
}

export default generateCommand;
