/**
 * AI Excellence Framework - Detect Tools Command
 *
 * Scans the project directory to detect which AI coding tools are already configured.
 */

import { existsSync } from 'fs';
import { join, basename } from 'path';
import chalk from 'chalk';

/**
 * Tool detection patterns
 */
const TOOL_PATTERNS = [
  {
    id: 'claude',
    name: 'Claude Code',
    patterns: ['CLAUDE.md', '.claude/'],
    configFiles: ['CLAUDE.md', '.claude/commands/', '.claude/agents/']
  },
  {
    id: 'cursor',
    name: 'Cursor IDE',
    patterns: ['.cursor/', '.cursorrules'],
    configFiles: ['.cursor/rules/', '.cursor/index.mdc', '.cursorrules']
  },
  {
    id: 'copilot',
    name: 'GitHub Copilot',
    patterns: ['.github/copilot-instructions.md'],
    configFiles: ['.github/copilot-instructions.md']
  },
  {
    id: 'windsurf',
    name: 'Windsurf IDE',
    patterns: ['.windsurf/', '.windsurfrules'],
    configFiles: ['.windsurf/rules/', '.windsurfrules']
  },
  {
    id: 'aider',
    name: 'Aider CLI',
    patterns: ['.aider.conf.yml', '.aider.conf.yaml'],
    configFiles: ['.aider.conf.yml', '.aider.conf.yaml']
  },
  {
    id: 'agents',
    name: 'AGENTS.md (AAIF)',
    patterns: ['AGENTS.md'],
    configFiles: ['AGENTS.md']
  },
  {
    id: 'gemini',
    name: 'Google Gemini CLI',
    patterns: ['GEMINI.md', '.gemini/'],
    configFiles: ['GEMINI.md', '.gemini/']
  },
  {
    id: 'codex',
    name: 'OpenAI Codex',
    patterns: ['.codex/'],
    configFiles: ['.codex/']
  },
  {
    id: 'zed',
    name: 'Zed Editor',
    patterns: ['.zed/', '.rules'],
    configFiles: ['.zed/ai-rules.md', '.rules']
  },
  {
    id: 'amp',
    name: 'Sourcegraph Amp',
    patterns: ['.amp/', 'amp.toml'],
    configFiles: ['.amp/', 'amp.toml']
  },
  {
    id: 'roo',
    name: 'Roo Code',
    patterns: ['.roo/'],
    configFiles: ['.roo/rules/']
  },
  {
    id: 'junie',
    name: 'JetBrains Junie',
    patterns: ['.junie/'],
    configFiles: ['.junie/guidelines.md']
  },
  {
    id: 'cline',
    name: 'Cline AI',
    patterns: ['.cline/', '.clinerules'],
    configFiles: ['.cline/', '.clinerules']
  },
  {
    id: 'goose',
    name: 'Block Goose',
    patterns: ['.goose/'],
    configFiles: ['.goose/extensions.yaml']
  },
  {
    id: 'kiro',
    name: 'Kiro CLI',
    patterns: ['.kiro/'],
    configFiles: ['.kiro/mcp.json', '.kiro/steering/']
  },
  {
    id: 'continue',
    name: 'Continue.dev',
    patterns: ['.continue/'],
    configFiles: ['.continue/config.yaml', '.continue/rules/']
  },
  {
    id: 'augment',
    name: 'Augment Code',
    patterns: ['.augment/'],
    configFiles: ['.augment/rules.md', '.augment/mcp.json']
  },
  {
    id: 'qodo',
    name: 'Qodo AI',
    patterns: ['qodo.toml', 'best_practices.md'],
    configFiles: ['qodo.toml', 'best_practices.md']
  },
  {
    id: 'opencode',
    name: 'OpenCode AI',
    patterns: ['opencode.json', '.opencode/'],
    configFiles: ['opencode.json', '.opencode/agents/', '.opencode/instructions.md']
  },
  {
    id: 'zencoder',
    name: 'Zencoder',
    patterns: ['.zencoder/', 'zencoder.json'],
    configFiles: ['.zencoder/rules/', '.zencoder/zencoder.json', 'zencoder.json']
  },
  {
    id: 'tabnine',
    name: 'Tabnine',
    patterns: ['.tabnine/'],
    configFiles: ['.tabnine/guidelines/']
  },
  {
    id: 'amazonq',
    name: 'Amazon Q Developer',
    patterns: ['.amazonq/'],
    configFiles: ['.amazonq/rules/']
  },
  {
    id: 'plugins',
    name: 'Claude Code Plugins',
    patterns: ['.claude-plugin/'],
    configFiles: ['.claude-plugin/plugin.json']
  },
  {
    id: 'skills',
    name: 'Agent Skills',
    patterns: ['.github/skills/'],
    configFiles: ['.github/skills/']
  }
];

/**
 * Detect which AI tools are configured in a directory
 */
export function detectTools(cwd) {
  const detected = [];
  const notDetected = [];

  for (const tool of TOOL_PATTERNS) {
    const found = tool.patterns.some(pattern => existsSync(join(cwd, pattern)));
    const foundFiles = tool.configFiles.filter(f => existsSync(join(cwd, f)));

    if (found) {
      detected.push({
        ...tool,
        foundFiles
      });
    } else {
      notDetected.push(tool);
    }
  }

  return { detected, notDetected };
}

/**
 * Main detect command handler.
 *
 * Scans the project directory to identify which AI coding tools are configured.
 * Detects tools like Claude Code, Cursor, Copilot, Cline, Windsurf, and others
 * based on their configuration files.
 *
 * @param {Object} options - Command options
 * @param {string} [options.targetDir=process.cwd()] - Directory to scan for tool configurations
 * @param {boolean} [options.json=false] - Output results as JSON for scripting
 * @param {boolean} [options.verbose=false] - Show detailed output including config file paths
 * @returns {Promise<void>} Resolves when detection is complete (output is to stdout)
 * @example
 * // Detect tools in current directory
 * await detectCommand({});
 *
 * // Detect with JSON output for scripting
 * await detectCommand({ json: true });
 */
export async function detectCommand(options) {
  const cwd = options.targetDir || process.cwd();
  const json = options.json || false;
  const verbose = options.verbose || false;

  const { detected, notDetected } = detectTools(cwd);

  if (json) {
    console.log(
      JSON.stringify(
        {
          projectPath: cwd,
          projectName: basename(cwd),
          detectedCount: detected.length,
          totalTools: TOOL_PATTERNS.length,
          detected: detected.map(t => ({
            id: t.id,
            name: t.name,
            configFiles: t.foundFiles
          })),
          notConfigured: verbose ? notDetected.map(t => ({ id: t.id, name: t.name })) : undefined
        },
        null,
        2
      )
    );
    return;
  }

  console.log(chalk.cyan('\n  AI Excellence Framework - Tool Detection\n'));
  console.log(chalk.gray(`  Scanning: ${cwd}\n`));

  if (detected.length === 0) {
    console.log(chalk.yellow('  No AI tools detected in this project.\n'));
    console.log(chalk.gray('  Run "npx ai-excellence init" to set up the framework.'));
    console.log(chalk.gray('  Run "npx ai-excellence generate --tools all" to generate configurations.\n'));
    return;
  }

  console.log(chalk.green(`  Detected ${detected.length} AI tool(s):\n`));

  for (const tool of detected) {
    console.log(`  ${chalk.green('✓')} ${chalk.bold(tool.name)} (${tool.id})`);
    if (verbose) {
      for (const file of tool.foundFiles) {
        console.log(chalk.gray(`      - ${file}`));
      }
    }
  }

  if (verbose && notDetected.length > 0) {
    console.log(chalk.yellow(`\n  Not configured (${notDetected.length}):\n`));
    for (const tool of notDetected) {
      console.log(chalk.gray(`    - ${tool.name}`));
    }
  }

  // Suggestions
  console.log('');
  if (detected.length < 5) {
    console.log(
      chalk.cyan('  💡 Tip: Run "npx ai-excellence generate --tools all" to add more tool support.\n')
    );
  }

  // Check for CLAUDE.md as primary config
  const hasClaude = detected.some(t => t.id === 'claude');
  if (!hasClaude) {
    console.log(
      chalk.yellow('  ⚠️  No CLAUDE.md found. Run "npx ai-excellence init" to create one.\n')
    );
  }

  // Check for AGENTS.md (AAIF standard)
  const hasAgents = detected.some(t => t.id === 'agents');
  if (!hasAgents) {
    console.log(
      chalk.gray(
        '  Note: Consider adding AGENTS.md for Linux Foundation AAIF compatibility.'
      )
    );
    console.log(chalk.gray('        Run: npx ai-excellence generate --tools agents\n'));
  }

  console.log(chalk.gray(`  Total: ${detected.length}/${TOOL_PATTERNS.length} tools configured\n`));
}

export default detectCommand;
