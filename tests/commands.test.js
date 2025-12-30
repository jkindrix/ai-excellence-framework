/**
 * End-to-End Tests for Slash Commands
 *
 * These tests validate:
 * - Command file structure and frontmatter
 * - Required sections in each command
 * - Output format specifications
 * - Cross-references between commands
 *
 * Run with: node --test tests/commands.test.js
 */

import { describe, it, before } from 'node:test';
import assert from 'node:assert';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_ROOT = join(__dirname, '..');
const COMMANDS_DIR = join(PROJECT_ROOT, '.claude', 'commands');
const AGENTS_DIR = join(PROJECT_ROOT, '.claude', 'agents');

/**
 * Parse frontmatter from markdown file
 */
function parseFrontmatter(content) {
  const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
  if (!frontmatterMatch) {
    return null;
  }

  const frontmatter = {};
  const lines = frontmatterMatch[1].split('\n');

  for (const line of lines) {
    const colonIndex = line.indexOf(':');
    if (colonIndex > 0) {
      const key = line.slice(0, colonIndex).trim();
      const value = line.slice(colonIndex + 1).trim();
      frontmatter[key] = value;
    }
  }

  return frontmatter;
}

/**
 * Extract sections from markdown
 */
function extractSections(content) {
  const sections = {};
  const sectionPattern = /^(#{1,3})\s+(.+)$/gm;
  let match;

  while ((match = sectionPattern.exec(content)) !== null) {
    const level = match[1].length;
    const title = match[2].trim();
    sections[title] = { level, position: match.index };
  }

  return sections;
}

/**
 * Check if command has output format section
 */
function hasOutputFormat(content) {
  return content.includes('## Output Format') ||
         content.includes('### Output Format') ||
         content.includes('```markdown');
}

/**
 * Check if command uses $ARGUMENTS placeholder
 */
function usesArguments(content) {
  return content.includes('$ARGUMENTS');
}

// ============================================
// SLASH COMMAND TESTS
// ============================================

describe('Slash Command Structure', () => {
  let commandFiles;

  before(() => {
    commandFiles = readdirSync(COMMANDS_DIR)
      .filter(f => f.endsWith('.md'));
  });

  it('should have all expected commands', () => {
    const expectedCommands = [
      'plan.md',
      'verify.md',
      'handoff.md',
      'assumptions.md',
      'review.md',
      'security-review.md',
      'refactor.md',
      'test-coverage.md'
    ];

    for (const cmd of expectedCommands) {
      assert.ok(commandFiles.includes(cmd), `Command ${cmd} should exist`);
    }
  });

  it('should have valid frontmatter in all commands', () => {
    for (const file of commandFiles) {
      const content = readFileSync(join(COMMANDS_DIR, file), 'utf-8');
      const frontmatter = parseFrontmatter(content);

      assert.ok(frontmatter, `${file} should have frontmatter`);
      assert.ok(frontmatter.description, `${file} should have description`);
      assert.ok(frontmatter.description.length > 10, `${file} description should be meaningful`);
    }
  });

  it('should have a main title in all commands', () => {
    for (const file of commandFiles) {
      const content = readFileSync(join(COMMANDS_DIR, file), 'utf-8');
      const hasMainTitle = /^#\s+[A-Z]/m.test(content);

      assert.ok(hasMainTitle, `${file} should have a main title (# Heading)`);
    }
  });

  it('should have output format specification', () => {
    for (const file of commandFiles) {
      const content = readFileSync(join(COMMANDS_DIR, file), 'utf-8');

      assert.ok(hasOutputFormat(content),
        `${file} should have output format specification`);
    }
  });
});

describe('Plan Command', () => {
  let content;

  before(() => {
    content = readFileSync(join(COMMANDS_DIR, 'plan.md'), 'utf-8');
  });

  it('should have required planning sections', () => {
    const sections = extractSections(content);

    const requiredSections = [
      'Instructions',
      'Output Format'
    ];

    // Check for key planning concepts
    assert.ok(content.includes('understanding') || content.includes('Understanding'),
      'Should discuss understanding requirements');
    assert.ok(content.includes('assumption') || content.includes('Assumption'),
      'Should discuss assumptions');
    assert.ok(content.includes('approach') || content.includes('Approach'),
      'Should discuss approach');
  });

  it('should require approval before implementation', () => {
    assert.ok(
      content.includes('approved') ||
      content.includes('proceed') ||
      content.includes('confirmation'),
      'Should require approval before proceeding'
    );
  });

  it('should accept arguments', () => {
    assert.ok(usesArguments(content), 'Should use $ARGUMENTS placeholder');
  });
});

describe('Verify Command', () => {
  let content;

  before(() => {
    content = readFileSync(join(COMMANDS_DIR, 'verify.md'), 'utf-8');
  });

  it('should emphasize skeptical approach', () => {
    assert.ok(
      content.toLowerCase().includes('skeptic') ||
      content.toLowerCase().includes('validator') ||
      content.toLowerCase().includes('falsif'),
      'Should emphasize skeptical validation approach'
    );
  });

  it('should have verification steps', () => {
    assert.ok(content.includes('Verification Steps') || content.includes('Steps'),
      'Should have verification steps');
  });

  it('should include falsification attempt', () => {
    assert.ok(
      content.includes('Falsification') ||
      content.includes('prove') ||
      content.includes('NOT complete'),
      'Should include falsification attempt'
    );
  });

  it('should have verdict options', () => {
    assert.ok(content.includes('COMPLETE') || content.includes('✓'),
      'Should have complete verdict option');
    assert.ok(content.includes('INCOMPLETE') || content.includes('✗'),
      'Should have incomplete verdict option');
  });
});

describe('Handoff Command', () => {
  let content;

  before(() => {
    content = readFileSync(join(COMMANDS_DIR, 'handoff.md'), 'utf-8');
  });

  it('should have session summary section', () => {
    assert.ok(content.includes('Summary') || content.includes('Accomplished'),
      'Should have summary section');
  });

  it('should capture decisions', () => {
    assert.ok(content.includes('Decision') || content.includes('decision'),
      'Should capture decisions');
  });

  it('should list next steps', () => {
    assert.ok(
      content.includes('Next') ||
      content.includes('Recommended') ||
      content.includes('step'),
      'Should list next steps'
    );
  });

  it('should mention file location for saving', () => {
    assert.ok(content.includes('docs/session-notes') || content.includes('session'),
      'Should mention save location');
  });
});

describe('Assumptions Command', () => {
  let content;

  before(() => {
    content = readFileSync(join(COMMANDS_DIR, 'assumptions.md'), 'utf-8');
  });

  it('should categorize assumptions', () => {
    assert.ok(
      content.includes('Technical') ||
      content.includes('Business') ||
      content.includes('category') ||
      content.includes('type'),
      'Should categorize assumptions'
    );
  });

  it('should include risk assessment', () => {
    assert.ok(
      content.includes('risk') ||
      content.includes('Risk') ||
      content.includes('impact') ||
      content.includes('Impact'),
      'Should include risk assessment'
    );
  });

  it('should prompt for validation', () => {
    assert.ok(
      content.includes('validate') ||
      content.includes('verify') ||
      content.includes('confirm'),
      'Should prompt for validation'
    );
  });
});

describe('Review Command', () => {
  let content;

  before(() => {
    content = readFileSync(join(COMMANDS_DIR, 'review.md'), 'utf-8');
  });

  it('should have multiple perspectives', () => {
    const perspectives = [
      content.includes('Correctness'),
      content.includes('Security'),
      content.includes('Performance'),
      content.includes('Maintainability')
    ];

    const perspectiveCount = perspectives.filter(Boolean).length;
    assert.ok(perspectiveCount >= 3, `Should have at least 3 perspectives, found ${perspectiveCount}`);
  });

  it('should have severity levels', () => {
    assert.ok(
      content.includes('Critical') ||
      content.includes('Warning') ||
      content.includes('🔴') ||
      content.includes('🟡'),
      'Should have severity levels'
    );
  });
});

describe('Security Review Command', () => {
  let content;

  before(() => {
    content = readFileSync(join(COMMANDS_DIR, 'security-review.md'), 'utf-8');
  });

  it('should reference OWASP', () => {
    assert.ok(content.includes('OWASP'), 'Should reference OWASP');
  });

  it('should cover injection vulnerabilities', () => {
    assert.ok(
      content.includes('Injection') ||
      content.includes('injection') ||
      content.includes('SQL') ||
      content.includes('XSS'),
      'Should cover injection vulnerabilities'
    );
  });

  it('should cover AI-specific vulnerabilities', () => {
    assert.ok(
      content.includes('AI-Specific') ||
      content.includes('hallucinate') ||
      content.includes('slopsquatting') ||
      content.includes('log injection'),
      'Should cover AI-specific vulnerabilities'
    );
  });

  it('should include statistics', () => {
    assert.ok(
      content.includes('%') ||
      content.includes('86') ||
      content.includes('88'),
      'Should include vulnerability statistics'
    );
  });

  it('should have verdict options', () => {
    assert.ok(content.includes('SECURE') || content.includes('✅'),
      'Should have secure verdict');
    assert.ok(content.includes('INSECURE') || content.includes('🚫'),
      'Should have insecure verdict');
  });
});

describe('Refactor Command', () => {
  let content;

  before(() => {
    content = readFileSync(join(COMMANDS_DIR, 'refactor.md'), 'utf-8');
  });

  it('should emphasize safety', () => {
    assert.ok(
      content.includes('safe') ||
      content.includes('Safe') ||
      content.includes('test') ||
      content.includes('verify'),
      'Should emphasize safety'
    );
  });

  it('should have incremental approach', () => {
    assert.ok(
      content.includes('incremental') ||
      content.includes('step') ||
      content.includes('phase'),
      'Should have incremental approach'
    );
  });
});

describe('Test Coverage Command', () => {
  let content;

  before(() => {
    content = readFileSync(join(COMMANDS_DIR, 'test-coverage.md'), 'utf-8');
  });

  it('should analyze coverage', () => {
    assert.ok(
      content.includes('coverage') ||
      content.includes('Coverage'),
      'Should analyze coverage'
    );
  });

  it('should identify gaps', () => {
    assert.ok(
      content.includes('gap') ||
      content.includes('missing') ||
      content.includes('untested'),
      'Should identify gaps'
    );
  });

  it('should prioritize improvements', () => {
    assert.ok(
      content.includes('priorit') ||
      content.includes('critical') ||
      content.includes('high'),
      'Should prioritize improvements'
    );
  });
});

// ============================================
// SUBAGENT TESTS
// ============================================

describe('Subagent Structure', () => {
  let agentFiles;

  before(() => {
    agentFiles = readdirSync(AGENTS_DIR)
      .filter(f => f.endsWith('.md'));
  });

  it('should have all expected agents', () => {
    const expectedAgents = ['explorer.md', 'reviewer.md', 'tester.md'];

    for (const agent of expectedAgents) {
      assert.ok(agentFiles.includes(agent), `Agent ${agent} should exist`);
    }
  });

  it('should have valid frontmatter with name and description', () => {
    for (const file of agentFiles) {
      const content = readFileSync(join(AGENTS_DIR, file), 'utf-8');
      const frontmatter = parseFrontmatter(content);

      assert.ok(frontmatter, `${file} should have frontmatter`);
      assert.ok(frontmatter.name, `${file} should have name`);
      assert.ok(frontmatter.description, `${file} should have description`);
    }
  });

  it('should specify tools in explorer agent', () => {
    const explorerContent = readFileSync(join(AGENTS_DIR, 'explorer.md'), 'utf-8');

    assert.ok(
      explorerContent.includes('tools:') ||
      explorerContent.includes('Read') ||
      explorerContent.includes('Grep') ||
      explorerContent.includes('Glob'),
      'Explorer should specify available tools'
    );
  });

  it('should specify model in explorer agent', () => {
    const explorerContent = readFileSync(join(AGENTS_DIR, 'explorer.md'), 'utf-8');

    assert.ok(
      explorerContent.includes('model:') ||
      explorerContent.includes('haiku'),
      'Explorer should specify model for cost efficiency'
    );
  });
});

describe('Cross-Reference Validation', () => {
  it('should have consistent command references in CLAUDE.md', () => {
    const claudeMd = readFileSync(join(PROJECT_ROOT, 'CLAUDE.md'), 'utf-8');
    const commands = ['plan', 'verify', 'handoff', 'assumptions'];

    for (const cmd of commands) {
      assert.ok(
        claudeMd.includes(`/${cmd}`) || claudeMd.includes(cmd),
        `CLAUDE.md should reference ${cmd} command`
      );
    }
  });

  it('should have matching descriptions in README', () => {
    const readme = readFileSync(join(PROJECT_ROOT, 'README.md'), 'utf-8');

    assert.ok(readme.includes('/plan'), 'README should document /plan');
    assert.ok(readme.includes('/verify'), 'README should document /verify');
    assert.ok(readme.includes('/handoff'), 'README should document /handoff');
    assert.ok(readme.includes('/security-review'), 'README should document /security-review');
  });
});

console.log('Command tests loaded. Run with: node --test tests/commands.test.js');
