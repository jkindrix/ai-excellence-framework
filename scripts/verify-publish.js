#!/usr/bin/env node
/**
 * Pre-publish verification script for AI Excellence Framework
 *
 * Run before npm publish to verify:
 * - Package size is acceptable
 * - Required files are included
 * - No sensitive files are included
 * - Version is consistent
 * - All tests pass
 *
 * Usage: node scripts/verify-publish.js [--fix]
 */

import { execSync } from 'child_process';
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

// Configuration
const MAX_PACKAGE_SIZE_KB = 250; // Maximum acceptable package size in KB
const MAX_UNPACKED_SIZE_KB = 800; // Maximum unpacked size in KB
const MAX_FILE_COUNT = 100; // Maximum number of files

// Required files that MUST be in the package
const REQUIRED_FILES = [
  'bin/cli.js',
  'src/index.js',
  'src/commands/init.js',
  'src/commands/generate.js',
  'src/commands/doctor.js',
  'src/commands/validate.js',
  'src/commands/lint.js',
  'src/commands/uninstall.js',
  'src/commands/detect.js',
  'types/index.d.ts',
  'README.md',
  'CHANGELOG.md',
  'CLAUDE.md',
  '.claude/commands/plan.md',
  '.claude/commands/verify.md',
  '.claude/commands/security-review.md',
  '.claude/agents/reviewer.md',
  'templates/presets/standard/CLAUDE.md',
];

// Files that must NOT be in the package
const FORBIDDEN_PATTERNS = [
  '.env',
  '.secrets',
  'settings.local',
  '.local.json',
  '.local.md',
  'node_modules',
  '.git/',
  '__pycache__',
  '.pyc',
  'coverage/',
  '.nyc_output',
  '.test.js',
  '.test.py',
  '.test.sh',
];

// ANSI colors
const RED = '\x1b[31m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const BLUE = '\x1b[34m';
const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';

function log(message, color = RESET) {
  console.log(`${color}${message}${RESET}`);
}

function logSection(title) {
  console.log('');
  log(`${BOLD}━━━ ${title} ━━━${RESET}`, BLUE);
}

function logCheck(name, passed, details = '') {
  const icon = passed ? '✓' : '✗';
  const color = passed ? GREEN : RED;
  const suffix = details ? ` (${details})` : '';
  log(`  ${icon} ${name}${suffix}`, color);
  return passed;
}

function getPackageJson() {
  const pkgPath = join(ROOT, 'package.json');
  return JSON.parse(readFileSync(pkgPath, 'utf-8'));
}

function getPackInfo() {
  try {
    const output = execSync('npm pack --dry-run 2>&1', {
      cwd: ROOT,
      encoding: 'utf-8',
    });

    // Parse package size
    const sizeMatch = output.match(/package size:\s+([\d.]+)\s*(\w+)/i);
    const unpackedMatch = output.match(/unpacked size:\s+([\d.]+)\s*(\w+)/i);
    const filesMatch = output.match(/total files:\s+(\d+)/i);

    // Get file list
    const files = [];
    const lines = output.split('\n');
    for (const line of lines) {
      const match = line.match(/npm notice\s+[\d.]+\s*\w+\s+(.+)/);
      if (match) {
        files.push(match[1]);
      }
    }

    return {
      packageSize: sizeMatch
        ? parseSize(sizeMatch[1], sizeMatch[2])
        : 0,
      unpackedSize: unpackedMatch
        ? parseSize(unpackedMatch[1], unpackedMatch[2])
        : 0,
      fileCount: filesMatch ? parseInt(filesMatch[1], 10) : 0,
      files,
    };
  } catch (error) {
    log(`Error running npm pack: ${error.message}`, RED);
    return null;
  }
}

function parseSize(value, unit) {
  const num = parseFloat(value);
  switch (unit.toLowerCase()) {
    case 'b':
      return num / 1024;
    case 'kb':
      return num;
    case 'mb':
      return num * 1024;
    case 'gb':
      return num * 1024 * 1024;
    default:
      return num;
  }
}

function checkPackageSize(packInfo) {
  logSection('Package Size');

  const results = [
    logCheck(
      `Package size ≤ ${MAX_PACKAGE_SIZE_KB}KB`,
      packInfo.packageSize <= MAX_PACKAGE_SIZE_KB,
      `${packInfo.packageSize.toFixed(1)}KB`
    ),
    logCheck(
      `Unpacked size ≤ ${MAX_UNPACKED_SIZE_KB}KB`,
      packInfo.unpackedSize <= MAX_UNPACKED_SIZE_KB,
      `${packInfo.unpackedSize.toFixed(1)}KB`
    ),
    logCheck(
      `File count ≤ ${MAX_FILE_COUNT}`,
      packInfo.fileCount <= MAX_FILE_COUNT,
      `${packInfo.fileCount} files`
    ),
  ];

  return results.every(Boolean);
}

function checkRequiredFiles(packInfo) {
  logSection('Required Files');

  const results = REQUIRED_FILES.map((file) => {
    const found = packInfo.files.some((f) => f === file || f.startsWith(file));
    return logCheck(file, found);
  });

  return results.every(Boolean);
}

function checkForbiddenFiles(packInfo) {
  logSection('Forbidden Files (must not be included)');

  const results = FORBIDDEN_PATTERNS.map((pattern) => {
    const found = packInfo.files.some((f) =>
      f.toLowerCase().includes(pattern.toLowerCase())
    );
    const passed = logCheck(`No ${pattern}`, !found);
    if (found) {
      const matching = packInfo.files.filter((f) =>
        f.toLowerCase().includes(pattern.toLowerCase())
      );
      matching.forEach((f) => log(`    → Found: ${f}`, YELLOW));
    }
    return passed;
  });

  return results.every(Boolean);
}

function checkVersionConsistency() {
  logSection('Version Consistency');

  const pkg = getPackageJson();
  const changelog = readFileSync(join(ROOT, 'CHANGELOG.md'), 'utf-8');
  const versionRegex = /^\d+\.\d+\.\d+(-[\w.]+)?$/;

  const results = [
    logCheck('Valid semver format', versionRegex.test(pkg.version), pkg.version),
    logCheck('Version in CHANGELOG', changelog.includes(`[${pkg.version}]`)),
    logCheck('Package exports defined', pkg.exports && Object.keys(pkg.exports).length > 0),
    logCheck('Bin commands defined', pkg.bin && Object.keys(pkg.bin).length >= 2),
    logCheck('Node engines specified', pkg.engines && pkg.engines.node),
  ];

  return results.every(Boolean);
}

function checkCriticalFiles() {
  logSection('Critical Files Exist');

  const criticalFiles = [
    'package.json',
    'README.md',
    'CHANGELOG.md',
    'LICENSE',
    'SECURITY.md',
    'CONTRIBUTING.md',
    'bin/cli.js',
    'src/index.js',
    'types/index.d.ts',
  ];

  const results = criticalFiles.map((file) => {
    const exists = existsSync(join(ROOT, file));
    return logCheck(file, exists);
  });

  return results.every(Boolean);
}

function checkLicense() {
  logSection('License');

  const pkg = getPackageJson();
  const licenseFile = existsSync(join(ROOT, 'LICENSE'));

  const results = [
    logCheck('License field set', !!pkg.license, pkg.license),
    logCheck('LICENSE file exists', licenseFile),
  ];

  return results.every(Boolean);
}

async function runTests() {
  logSection('Tests');

  try {
    log('  Running npm test...', YELLOW);
    execSync('npm test', { cwd: ROOT, stdio: 'pipe' });
    logCheck('npm test passes', true);
    return true;
  } catch (error) {
    logCheck('npm test passes', false);
    log(`  Test output: ${error.stdout?.toString() || error.message}`, RED);
    return false;
  }
}

async function main() {
  const args = process.argv.slice(2);
  const fix = args.includes('--fix');
  const skipTests = args.includes('--skip-tests');

  console.log('');
  log(
    `${BOLD}AI Excellence Framework - Pre-Publish Verification${RESET}`,
    BLUE
  );
  log('━'.repeat(50), BLUE);

  const pkg = getPackageJson();
  log(`Version: ${pkg.version}`);
  log(`Name: ${pkg.name}`);

  const packInfo = getPackInfo();
  if (!packInfo) {
    log('\nFailed to get package info', RED);
    process.exit(1);
  }

  let allPassed = true;

  allPassed = checkPackageSize(packInfo) && allPassed;
  allPassed = checkRequiredFiles(packInfo) && allPassed;
  allPassed = checkForbiddenFiles(packInfo) && allPassed;
  allPassed = checkVersionConsistency() && allPassed;
  allPassed = checkCriticalFiles() && allPassed;
  allPassed = checkLicense() && allPassed;

  if (!skipTests) {
    allPassed = (await runTests()) && allPassed;
  } else {
    logSection('Tests');
    log('  ⚠ Skipped (--skip-tests flag)', YELLOW);
  }

  // Summary
  console.log('');
  log('━'.repeat(50), BLUE);

  if (allPassed) {
    log(`${BOLD}✓ All checks passed! Ready to publish.${RESET}`, GREEN);
    console.log('');
    log('To publish:', YELLOW);
    log('  npm publish', YELLOW);
    console.log('');
    log('Or for a dry run:', YELLOW);
    log('  npm publish --dry-run', YELLOW);
    console.log('');
    process.exit(0);
  } else {
    log(`${BOLD}✗ Some checks failed. Please fix before publishing.${RESET}`, RED);
    console.log('');
    process.exit(1);
  }
}

main().catch((error) => {
  log(`Error: ${error.message}`, RED);
  process.exit(1);
});
