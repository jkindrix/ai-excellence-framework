/**
 * Windsurf IDE Rules Generator
 * @see https://docs.windsurf.com/windsurf/cascade/memories
 * @see https://codeium.com/windsurf/directory
 */

import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';
import { getProjectName } from './base.js';

/**
 * Generate Windsurf IDE rules (.windsurf/rules/).
 *
 * Creates project-specific rules for Windsurf IDE based on CLAUDE.md context.
 *
 * @param {string} cwd - Current working directory
 * @param {Object|null} context - Project context parsed from CLAUDE.md
 * @param {Object} options - Generation options
 * @param {boolean} [options.force=false] - Overwrite existing files
 * @param {boolean} [options.dryRun=false] - Preview without writing files
 * @param {Object} results - Results accumulator object
 * @param {string[]} results.created - Array to push created file paths
 * @param {string[]} results.skipped - Array to push skipped file paths
 * @returns {Promise<void>} Resolves when generation is complete
 */
export async function generateWindsurfRules(cwd, context, options, results) {
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
 * @param {object|null} context - Project context
 * @returns {string} Generated content
 */
export function generateWindsurfrulesContent(context) {
  const projectName = getProjectName(context);

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

/**
 * Generate main Windsurf rule content
 * @param {object|null} context - Project context
 * @returns {string} Generated content
 */
export function generateWindsurfMainRule(context) {
  const projectName = getProjectName(context);

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

/**
 * Generate security Windsurf rule content
 * @param {object|null} _context - Project context (unused)
 * @returns {string} Generated content
 */
export function generateWindsurfSecurityRule(_context) {
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
