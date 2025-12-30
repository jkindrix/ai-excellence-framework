#!/usr/bin/env node

/**
 * AI Excellence Framework CLI
 *
 * A comprehensive framework for reducing friction in AI-assisted software development.
 *
 * Usage:
 *   npx ai-excellence-framework init [options]
 *   npx ai-excellence-framework validate
 *   npx ai-excellence-framework update
 *   npx ai-excellence-framework doctor
 */

import { Command } from 'commander';
import chalk from 'chalk';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';

// Import commands
import { initCommand } from '../src/commands/init.js';
import { validateCommand } from '../src/commands/validate.js';
import { updateCommand } from '../src/commands/update.js';
import { doctorCommand } from '../src/commands/doctor.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Read package.json for version
const packageJson = JSON.parse(
  readFileSync(join(__dirname, '..', 'package.json'), 'utf-8')
);

const program = new Command();

program
  .name('ai-excellence')
  .description('AI Excellence Framework - Reduce friction in AI-assisted development')
  .version(packageJson.version);

// Init command
program
  .command('init')
  .description('Initialize the AI Excellence Framework in your project')
  .option('-p, --preset <preset>', 'Preset configuration (minimal, standard, full, team)', 'standard')
  .option('-f, --force', 'Overwrite existing files', false)
  .option('-y, --yes', 'Skip interactive prompts, use defaults', false)
  .option('--dry-run', 'Show what would be created without making changes', false)
  .option('--no-hooks', 'Skip pre-commit hooks installation')
  .option('--no-mcp', 'Skip MCP server setup')
  .action(initCommand);

// Validate command
program
  .command('validate')
  .description('Validate your AI Excellence Framework configuration')
  .option('--fix', 'Attempt to fix issues automatically', false)
  .action(validateCommand);

// Update command
program
  .command('update')
  .description('Update the framework to the latest version')
  .option('--check', 'Check for updates without installing', false)
  .option('-f, --force', 'Force update even if no changes detected', false)
  .action(updateCommand);

// Doctor command
program
  .command('doctor')
  .description('Diagnose common issues and verify setup')
  .option('--verbose', 'Show detailed diagnostic information', false)
  .action(doctorCommand);

// Error handling
program.exitOverride(err => {
  if (err.code === 'commander.help') {
    process.exit(0);
  }
  console.error(chalk.red(`\nError: ${err.message}`));
  process.exit(1);
});

// Parse arguments
program.parse();

// Show help if no command provided
if (!process.argv.slice(2).length) {
  console.log(chalk.cyan('\n  AI Excellence Framework'));
  console.log(chalk.gray('  Reduce friction in AI-assisted development\n'));
  program.help();
}
