# npm Publishing Checklist

Complete checklist for publishing the AI Excellence Framework to npm.

---

## Pre-Publication Verification

### 1. Code Quality

- [ ] All tests pass: `npm run test:all`
- [ ] Linting passes: `npm run lint`
- [ ] Formatting check passes: `npm run format:check`
- [ ] No TypeScript errors in type definitions

```bash
# Run all verification
npm run verify-publish
```

### 2. Version Management

- [ ] Version in `package.json` follows semver
- [ ] CHANGELOG.md updated with release notes
- [ ] Git tag matches package.json version

```bash
# Check version consistency
node -p "require('./package.json').version"
git tag -l "v*" | tail -5
```

### 3. Package Contents

Verify the published package includes only intended files:

```bash
# Preview package contents
npm pack --dry-run

# Create tarball and inspect
npm pack
tar -tzf ai-excellence-framework-*.tgz | head -50
```

Expected contents:

- `bin/` - CLI entry point
- `src/` - Source code
- `types/` - TypeScript definitions
- `templates/` - Preset configurations
- `.claude/` - Commands and agents
- `scripts/hooks/` - Git hooks (bash + PowerShell)
- `scripts/mcp/` - MCP server
- `scripts/metrics/` - Metrics collection
- `docs/` - Essential documentation subset
- `completions/` - Shell completions

### 4. Dependencies

- [ ] All dependencies exist on npm (not hallucinated)
- [ ] No devDependencies in production bundle
- [ ] Peer dependencies correctly specified

```bash
# Verify dependencies exist
./scripts/hooks/verify-deps.sh
# or on Windows
powershell -File scripts/hooks/powershell/Verify-Dependencies.ps1
```

### 5. Security Audit

- [ ] No known vulnerabilities: `npm audit`
- [ ] No secrets in published files
- [ ] Security hooks pass

```bash
npm audit
./scripts/hooks/check-ai-security.sh --strict
```

---

## Package.json Verification

### Required Fields

```json
{
  "name": "ai-excellence-framework",
  "version": "1.0.0",
  "description": "Universal framework for AI-assisted development",
  "main": "src/index.js",
  "types": "types/index.d.ts",
  "bin": {
    "ai-excellence": "./bin/cli.js",
    "aix": "./bin/cli.js"
  },
  "engines": {
    "node": ">=18.0.0"
  },
  "license": "MIT",
  "repository": {
    "type": "git",
    "url": "git+https://github.com/ai-excellence-framework/ai-excellence-framework.git"
  }
}
```

### Verify Exports

```bash
# Test that exports work
node -e "import('ai-excellence-framework').then(m => console.log(Object.keys(m)))"
node -e "import('ai-excellence-framework/cli')"
```

---

## Publication Steps

### Step 1: Authenticate

```bash
# Login to npm (if not already)
npm login

# Verify authentication
npm whoami
```

### Step 2: Final Verification

```bash
# Run complete verification suite
npm run verify-publish

# Expected output: All checks passing
```

### Step 3: Publish

```bash
# For first release
npm publish --access public

# For updates
npm publish

# For beta/pre-release
npm publish --tag beta
```

### Step 4: Verify Publication

```bash
# Check package on npm
npm view ai-excellence-framework

# Test installation
mkdir /tmp/test-install && cd /tmp/test-install
npm init -y
npx ai-excellence-framework --version
npx ai-excellence-framework init --preset minimal --non-interactive
```

### Step 5: Create Git Tag

```bash
VERSION=$(node -p "require('./package.json').version")
git tag -a "v${VERSION}" -m "Release v${VERSION}"
git push origin "v${VERSION}"
```

---

## Post-Publication

### Documentation

- [ ] VitePress site deployed (automatic via GitHub Actions)
- [ ] README.md has correct npm badge
- [ ] Installation instructions verified

### Announcements

- [ ] GitHub Release created with changelog
- [ ] Update any external documentation

### Monitoring

- [ ] Check npm download stats
- [ ] Monitor GitHub issues for installation problems

---

## Troubleshooting

### Package Size Too Large

```bash
# Check unpacked size
npm pack --dry-run 2>&1 | grep 'unpacked size'

# Review included files
npm pack && tar -tzf *.tgz | wc -l
```

If over limit:

1. Review `files` array in package.json
2. Add unnecessary files to `.npmignore`
3. Ensure devDependencies are not bundled

### Missing Files

If files are missing after publish:

1. Check `files` array in package.json includes them
2. Verify they're not in `.npmignore`
3. Check `.gitignore` (npm respects it by default)

### Authentication Issues

```bash
# Clear npm cache
npm cache clean --force

# Re-login
npm logout
npm login
```

### Version Conflicts

```bash
# If version already published
npm version patch  # or minor/major
npm publish
```

---

## Rollback Procedure

If a problematic version is published:

### Option 1: Unpublish (within 72 hours)

```bash
npm unpublish ai-excellence-framework@1.0.1
```

### Option 2: Deprecate

```bash
npm deprecate ai-excellence-framework@1.0.1 "Critical bug, use 1.0.2"
```

### Option 3: Patch Release

```bash
# Fix the issue
npm version patch
npm publish
```

---

## Automated Publishing (CI/CD)

### GitHub Actions Release Workflow

The release workflow (`.github/workflows/release.yml`) handles:

1. Version verification
2. Test execution
3. Package building
4. npm publishing
5. GitHub release creation
6. Changelog generation

Trigger by pushing a version tag:

```bash
npm version minor
git push && git push --tags
```

---

## npm Package Badges

Add to README.md:

```markdown
[![npm version](https://img.shields.io/npm/v/ai-excellence-framework.svg)](https://www.npmjs.com/package/ai-excellence-framework)
[![npm downloads](https://img.shields.io/npm/dm/ai-excellence-framework.svg)](https://www.npmjs.com/package/ai-excellence-framework)
[![Node.js Version](https://img.shields.io/node/v/ai-excellence-framework.svg)](https://nodejs.org)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
```

---

## Quick Reference

```bash
# Complete pre-publish verification
npm run verify-publish

# Publish to npm
npm publish --access public

# Create GitHub release
VERSION=$(node -p "require('./package.json').version")
gh release create "v${VERSION}" --generate-notes

# Verify installation
npx ai-excellence-framework --version
```

---

_Part of the AI Excellence Framework_
