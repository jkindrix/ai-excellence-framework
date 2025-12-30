#!/usr/bin/env node
/**
 * Prepare script - runs before npm publish
 *
 * Validates the package is ready for publication.
 */

import { existsSync, readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

const requiredFiles = [
  'bin/cli.js',
  'src/index.js',
  'src/commands/init.js',
  'src/commands/validate.js',
  'src/commands/update.js',
  'src/commands/doctor.js',
  'README.md',
  'CLAUDE.md',
  '.claude/commands/plan.md',
  '.claude/commands/verify.md'
];

console.log('Preparing ai-excellence-framework for publication...\n');

let errors = 0;

// Check required files
for (const file of requiredFiles) {
  const path = join(projectRoot, file);
  if (existsSync(path)) {
    console.log(`  ✓ ${file}`);
  } else {
    console.log(`  ✗ Missing: ${file}`);
    errors++;
  }
}

// Validate package.json
const packageJson = JSON.parse(
  readFileSync(join(projectRoot, 'package.json'), 'utf-8')
);

console.log('\nPackage metadata:');
console.log(`  Name: ${packageJson.name}`);
console.log(`  Version: ${packageJson.version}`);
console.log(`  License: ${packageJson.license}`);

if (!packageJson.name) {
  console.log('  ✗ Missing package name');
  errors++;
}

if (!packageJson.version) {
  console.log('  ✗ Missing package version');
  errors++;
}

console.log('');

if (errors > 0) {
  console.log(`\n✗ Preparation failed with ${errors} error(s)`);
  process.exit(1);
} else {
  console.log('✓ Package is ready for publication');
}
