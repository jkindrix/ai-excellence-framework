# Troubleshooting Guide

Quick solutions to common issues when using the AI Excellence Framework.

## Installation Issues

### `npm test` fails with "Cannot find module"

**Problem:** Test runner can't find test files.

**Solution:** Ensure test script uses glob pattern:
```json
"test": "node --test tests/*.test.js"
```

### `npx ai-excellence init` fails

**Problem:** CLI fails during initialization.

**Solutions:**
1. Ensure Node.js 18+ is installed: `node --version`
2. Try with verbose output: `npx ai-excellence doctor --verbose`
3. Clear npm cache: `npm cache clean --force`
4. Install globally: `npm install -g ai-excellence-framework`

### Pre-commit hooks not running

**Problem:** Git commits don't trigger hooks.

**Solutions:**
1. Install pre-commit: `pip install pre-commit`
2. Install hooks: `pre-commit install`
3. Check hook is executable: `chmod +x .git/hooks/pre-commit`

## Configuration Issues

### CLAUDE.md not being read

**Problem:** Claude doesn't seem to see your CLAUDE.md file.

**Checklist:**
- [ ] File is named exactly `CLAUDE.md` (case-sensitive)
- [ ] File is in project root (same directory you run `claude` from)
- [ ] File is valid markdown (check with `markdownlint CLAUDE.md`)
- [ ] File size is reasonable (<50KB recommended)

### Slash commands not working

**Problem:** `/plan` or `/verify` commands not recognized.

**Solutions:**
1. Check commands exist: `ls -la .claude/commands/`
2. Verify file extension is `.md`
3. Check frontmatter is valid YAML:
   ```yaml
   ---
   description: Your description here
   ---
   ```
4. Restart Claude Code session

### MCP server won't start

**Problem:** Project Memory MCP server fails to start.

**Solutions:**
1. Check Python version: `python3 --version` (needs 3.9+)
2. Install MCP SDK: `pip install mcp`
3. Check database path is writable
4. Look for errors in stderr output
5. Test with: `python scripts/mcp/project-memory-server.py`

## Runtime Issues

### Context being lost during session

**Problem:** Claude forgets earlier context.

**Mitigations:**
1. Keep key context in CLAUDE.md (persists across messages)
2. Use `/handoff` at session end
3. Reference specific files when needed
4. Break large tasks into smaller chunks

### AI generating incorrect code

**Problem:** Code has bugs, security issues, or doesn't work.

**Checklist:**
- [ ] Run `/security-review` on generated code
- [ ] Use `/verify` before accepting completion
- [ ] Check dependencies exist (slopsquatting risk)
- [ ] Review error handling

### Slow performance

**Problem:** Commands or MCP server running slowly.

**Solutions:**
1. Check database size: `ls -lh ~/.claude/project-memories/`
2. Reduce CLAUDE.md size if >50KB
3. Close unused terminal sessions
4. Check available disk space

## Test Failures

### Node.js tests failing

**Problem:** `npm test` shows failures.

**Debug steps:**
1. Run single test: `node --test tests/cli.test.js`
2. Add verbose output: `node --test --test-reporter=spec tests/*.test.js`
3. Check Node version: `node --version` (needs 18+)

### Python tests failing

**Problem:** `npm run test:mcp` shows failures.

**Debug steps:**
1. Check pytest is installed: `pip install pytest`
2. Run directly: `python -m pytest tests/mcp/ -v`
3. Check imports: `python -c "from scripts.mcp import project_memory_server"`

### Shell tests failing

**Problem:** `npm run test:scripts` shows failures.

**Debug steps:**
1. Make executable: `chmod +x tests/scripts.test.sh`
2. Check bash version: `bash --version`
3. Run directly: `bash tests/scripts.test.sh`

## Security Warnings

### Secrets detected in CLAUDE.md

**Problem:** Validation warns about hardcoded secrets.

**Solutions:**
1. Move secrets to `.env` file
2. Use environment variables
3. Reference secret storage: "API key in 1Password vault"
4. If false positive, check patterns in `validate.js`

### Dependencies not found (slopsquatting warning)

**Problem:** Hook warns about potentially hallucinated packages.

**Solutions:**
1. Verify package exists: `npm view package-name`
2. Check for typos in package name
3. If valid, add to allowlist in `verify-deps.sh`

## Getting Help

### Before asking for help

1. Run `npx ai-excellence doctor --verbose`
2. Check `npm test` output
3. Review this troubleshooting guide
4. Search existing issues

### Reporting issues

Include:
- Node.js version: `node --version`
- Python version: `python3 --version`
- OS and version
- Error message (full output)
- Steps to reproduce

**GitHub Issues:** https://github.com/your-username/ai-excellence-framework/issues

## Common Error Messages

### "EACCES: permission denied"

**Cause:** File/directory permission issue.

**Fix:**
```bash
chmod -R u+rw .claude/
chmod +x scripts/hooks/*.sh
```

### "ENOENT: no such file or directory"

**Cause:** Missing file or wrong path.

**Fix:**
1. Run `npx ai-excellence validate` to check structure
2. Run `npx ai-excellence init` to restore missing files

### "SyntaxError: Unexpected token"

**Cause:** Invalid JSON or JavaScript syntax.

**Fix:**
1. Check file for syntax errors
2. Validate JSON: `node -e "require('./package.json')"`
3. Lint code: `npm run lint`

### "ModuleNotFoundError: No module named 'mcp'"

**Cause:** MCP SDK not installed.

**Fix:**
```bash
pip install mcp
```

### "SQLITE_CANTOPEN"

**Cause:** Database path doesn't exist or isn't writable.

**Fix:**
```bash
mkdir -p ~/.claude/project-memories
chmod 755 ~/.claude/project-memories
```
