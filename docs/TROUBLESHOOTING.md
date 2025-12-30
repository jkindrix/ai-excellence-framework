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

**GitHub Issues:** https://github.com/ai-excellence-framework/ai-excellence-framework/issues

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

## Advanced Troubleshooting

### CI/CD Pipeline Issues

#### Tests Pass Locally but Fail in CI

**Problem:** Tests work on your machine but fail in GitHub Actions.

**Common Causes:**

1. **Node.js version mismatch**
   ```yaml
   # Ensure consistent version in .github/workflows
   - uses: actions/setup-node@v4
     with:
       node-version: '20.x'
   ```

2. **Missing environment variables**
   ```bash
   # Check if tests depend on env vars
   env | grep -E 'CI|NODE|NPM'
   ```

3. **File permission differences**
   ```bash
   # Make hooks executable in CI
   chmod +x scripts/hooks/*.sh
   ```

4. **Path separator issues (Windows)**
   ```javascript
   // Use path.join instead of string concatenation
   const configPath = path.join(projectRoot, '.claude', 'commands');
   ```

#### MCP Server Connection Timeout in CI

**Problem:** MCP tests timeout in GitHub Actions.

**Solutions:**

1. Increase pytest timeout:
   ```bash
   python -m pytest tests/mcp/ -v --timeout=60
   ```

2. Check if MCP SDK is installed:
   ```yaml
   - name: Install MCP
     run: pip install mcp
   ```

3. Use mock database for tests:
   ```python
   @pytest.fixture
   def temp_db():
       with tempfile.TemporaryDirectory() as tmpdir:
           yield Path(tmpdir) / "test.db"
   ```

### Memory and Performance Issues

#### High Memory Usage During Long Sessions

**Problem:** Claude Code slows down or crashes after extended use.

**Mitigations:**

1. **Break context into smaller pieces**
   - Split large CLAUDE.md into focused sections
   - Use `/handoff` to create session boundaries

2. **Clean up .tmp directory**
   ```bash
   rm -rf .tmp/*
   ```

3. **Reduce MCP database size**
   ```bash
   # Check database size
   ls -lh ~/.claude/project-memories/

   # Vacuum database
   sqlite3 ~/.claude/project-memories/project.db "VACUUM;"
   ```

4. **Use explorer agent for large codebases**
   - The explorer agent uses the faster Haiku model
   - Better for broad searches

#### Slow MCP Server Response

**Problem:** MCP queries take too long.

**Diagnosis:**

```bash
# Check database size
du -h ~/.claude/project-memories/*.db

# Check table sizes
sqlite3 ~/.claude/project-memories/project.db "
  SELECT name,
         (SELECT COUNT(*) FROM sqlite_master WHERE name=t.name) as rows
  FROM (SELECT 'decisions' as name UNION SELECT 'patterns' UNION SELECT 'context') t;
"
```

**Solutions:**

1. **Enable WAL mode** (already default in v1.4.0+)
   ```python
   conn.execute("PRAGMA journal_mode=WAL")
   ```

2. **Add indexes for frequent queries**
   ```sql
   CREATE INDEX IF NOT EXISTS idx_decisions_timestamp ON decisions(timestamp);
   ```

3. **Increase connection pool** (team deployments)
   ```bash
   export PROJECT_MEMORY_POOL_SIZE=10
   ```

### Cross-Platform Issues

#### Line Ending Problems

**Problem:** Files show as modified after checkout on Windows.

**Solutions:**

1. Configure git:
   ```bash
   git config core.autocrlf input  # Mac/Linux
   git config core.autocrlf true   # Windows
   ```

2. Add .gitattributes:
   ```
   * text=auto eol=lf
   *.sh text eol=lf
   *.md text eol=lf
   ```

#### Shell Scripts Fail on Windows

**Problem:** Bash scripts don't run on Windows.

**Solutions:**

1. Use Git Bash or WSL
2. Use cross-platform npm scripts:
   ```json
   "scripts": {
     "health": "node scripts/metrics/friction-metrics.js status"
   }
   ```

3. Use shx for cross-platform shell commands:
   ```bash
   npm install shx --save-dev
   ```

### Security Scanner False Positives

#### detect-secrets Flags Test Fixtures

**Problem:** Secret detection flags example/test files.

**Solution:** Add to `.secrets.baseline`:

```json
{
  "files": {
    "tests/fixtures/example-secrets.txt": [
      {
        "type": "Test fixture",
        "is_verified": true
      }
    ]
  }
}
```

Or use inline allowlist:

```bash
API_KEY="test-key-12345"  # pragma: allowlist secret
```

#### Semgrep Overly Strict Rules

**Problem:** Semgrep blocks legitimate code patterns.

**Solution:** Create `.semgrep.yml` with rule overrides:

```yaml
rules:
  - id: custom-override
    patterns:
      - pattern-not: $FUNC(...)
    paths:
      exclude:
        - tests/
        - examples/
```

### Debugging the Framework

#### Enable Verbose Mode

```bash
# CLI verbose output
npx ai-excellence-framework doctor --verbose

# MCP server debug mode
export PROJECT_MEMORY_DEBUG=true
python scripts/mcp/project-memory-server.py
```

#### Check Framework State

```bash
# Full validation with verbose output
npx ai-excellence-framework validate --verbose

# List installed components
ls -la .claude/commands/
ls -la .claude/agents/
ls -la scripts/hooks/
```

#### Inspect MCP Database

```bash
# Open database for inspection
sqlite3 ~/.claude/project-memories/project.db

# Common queries
.tables
SELECT COUNT(*) FROM decisions;
SELECT * FROM decisions ORDER BY timestamp DESC LIMIT 5;
.quit
```

### Recovery Procedures

#### Corrupted CLAUDE.md

**Problem:** CLAUDE.md has syntax errors or is unreadable.

**Recovery:**

1. Check git history:
   ```bash
   git log --oneline CLAUDE.md
   git show HEAD~1:CLAUDE.md > CLAUDE.md.backup
   ```

2. Regenerate from template:
   ```bash
   npx ai-excellence-framework init --force
   ```

3. Use health monitor:
   ```bash
   ./scripts/health/claude-md-monitor.sh --fix
   ```

#### Corrupted MCP Database

**Problem:** SQLite database is corrupted.

**Recovery:**

1. Backup current state:
   ```bash
   cp ~/.claude/project-memories/project.db ~/.claude/project-memories/project.db.corrupted
   ```

2. Try integrity check:
   ```bash
   sqlite3 ~/.claude/project-memories/project.db "PRAGMA integrity_check;"
   ```

3. Recover what's possible:
   ```bash
   sqlite3 ~/.claude/project-memories/project.db ".recover" | \
     sqlite3 ~/.claude/project-memories/project-recovered.db
   ```

4. If recovery fails, reinitialize:
   ```bash
   rm ~/.claude/project-memories/project.db
   # MCP will create new database on next start
   ```

#### Lost Configuration

**Problem:** Configuration files are missing or corrupted.

**Recovery:**

```bash
# Validate and auto-fix
npx ai-excellence-framework validate --fix

# Full reinitialization (preserves CLAUDE.md content)
npx ai-excellence-framework init --preset standard --force
```

## Diagnostic Commands Reference

| Command | Purpose |
|---------|---------|
| `npx ai-excellence doctor` | Full environment check |
| `npx ai-excellence validate` | Configuration validation |
| `npx ai-excellence validate --fix` | Auto-fix issues |
| `./scripts/health/claude-md-monitor.sh` | CLAUDE.md health check |
| `node scripts/metrics/friction-metrics.js status` | Metrics system status |
| `python -c "import mcp; print('OK')"` | MCP SDK check |
| `pre-commit run --all-files` | Run all hooks manually |

## Getting Expert Help

If you've tried the above solutions and still have issues:

1. **Gather diagnostics:**
   ```bash
   npx ai-excellence doctor --verbose > diagnostics.txt 2>&1
   node --version >> diagnostics.txt
   python3 --version >> diagnostics.txt
   ```

2. **Create minimal reproduction:**
   - Steps to reproduce
   - Expected vs actual behavior
   - Relevant configuration files

3. **Open an issue:**
   - [GitHub Issues](https://github.com/ai-excellence-framework/ai-excellence-framework/issues)
   - Include diagnostics.txt
   - Tag with appropriate labels

4. **Community help:**
   - [GitHub Discussions](https://github.com/ai-excellence-framework/ai-excellence-framework/discussions)
