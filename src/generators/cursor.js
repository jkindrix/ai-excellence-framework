/**
 * Cursor IDE Rules Generator
 * @see https://docs.cursor.com/context/rules
 */

import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';
import { getProjectName } from './base.js';

/**
 * Generate Cursor IDE rules (.cursor/rules/).
 *
 * Creates project-specific rules for Cursor IDE based on CLAUDE.md context.
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
export async function generateCursorRules(cwd, context, options, results) {
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

/**
 * Generate main Cursor rule content
 * @param {object|null} context - Project context
 * @returns {string} Generated content
 */
export function generateCursorMainRule(context) {
  const projectName = getProjectName(context);

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

/**
 * Generate security rule content
 * @param {object|null} _context - Project context (unused)
 * @returns {string} Generated content
 */
export function generateCursorSecurityRule(_context) {
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

/**
 * Generate index rule content
 * @param {object|null} context - Project context
 * @returns {string} Generated content
 */
export function generateCursorIndex(context) {
  const projectName = getProjectName(context);

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
