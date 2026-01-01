# API Reference

Programmatic API for AI Excellence Framework.

## Installation

```bash
npm install ai-excellence-framework
```

## ESM Import

```javascript
import {
  init,
  validate,
  doctor,
  generate,
  lint,
  update,
} from 'ai-excellence-framework';
```

## Commands

### init(options)

Initialize the framework in a project directory.

```javascript
import { init } from 'ai-excellence-framework/commands/init';

await init({
  preset: 'standard',      // 'minimal' | 'standard' | 'full' | 'team'
  force: false,            // Overwrite existing files
  dryRun: false,           // Preview without changes
  skipHooks: false,        // Skip hook installation
  skipMcp: false,          // Skip MCP server setup
  skipPrecommit: false,    // Skip pre-commit config
  targetDir: process.cwd() // Target directory
});
```

**Returns:** `Promise<InitResult>`

```typescript
interface InitResult {
  success: boolean;
  filesCreated: string[];
  filesSkipped: string[];
  warnings: string[];
}
```

---

### validate(options)

Validate framework configuration.

```javascript
import { validate } from 'ai-excellence-framework/commands/validate';

const result = await validate({
  fix: false,              // Auto-fix issues
  strict: false,           // Strict validation mode
  targetDir: process.cwd()
});
```

**Returns:** `Promise<ValidationResult>`

```typescript
interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  fixed: string[];
}

interface ValidationError {
  code: string;
  message: string;
  file?: string;
  line?: number;
}
```

---

### doctor(options)

Check environment and installation health.

```javascript
import { doctor } from 'ai-excellence-framework/commands/doctor';

const result = await doctor({
  verbose: false,          // Detailed output
  targetDir: process.cwd()
});
```

**Returns:** `Promise<DoctorResult>`

```typescript
interface DoctorResult {
  healthy: boolean;
  checks: HealthCheck[];
}

interface HealthCheck {
  name: string;
  status: 'pass' | 'warn' | 'fail';
  message: string;
  details?: string;
}
```

---

### generate(options)

Generate configurations for AI tools.

```javascript
import { generate } from 'ai-excellence-framework/commands/generate';

const result = await generate({
  tools: ['cursor', 'copilot', 'agents'],  // or 'all'
  dryRun: false,
  outputDir: process.cwd()
});
```

**Returns:** `Promise<GenerateResult>`

```typescript
interface GenerateResult {
  success: boolean;
  generated: GeneratedFile[];
  skipped: string[];
}

interface GeneratedFile {
  tool: string;
  path: string;
  size: number;
}
```

**Supported Tools:**

| Tool | Config Generated |
|------|------------------|
| `cursor` | `.cursor/rules/` |
| `copilot` | `.github/copilot-instructions.md` |
| `windsurf` | `.windsurf/rules/` |
| `aider` | `.aider.conf.yml` |
| `agents` | `AGENTS.md` |
| `gemini` | `.gemini/` |
| `codex` | `.codex/` |
| `zed` | `.zed/` |
| `amp` | `.amp/` |
| `roo` | `.roo/` |
| `junie` | `.junie/` |
| `cline` | `.cline/` |
| `goose` | `.goose/` |
| `kiro` | `.kiro/` |
| `continue` | `.continue/` |
| `augment` | `.augment/` |
| `qodo` | `qodo.toml` |
| `opencode` | `.opencode/` |
| `zencoder` | `.zencoder/` |
| `plugins` | `.claude-plugin/` |

---

### lint(options)

Lint configuration files.

```javascript
import { lint } from 'ai-excellence-framework/commands/lint';

const result = await lint({
  fix: false,              // Auto-fix issues
  format: 'text',          // 'text' | 'json'
  targetDir: process.cwd()
});
```

**Returns:** `Promise<LintResult>`

```typescript
interface LintResult {
  valid: boolean;
  findings: LintFinding[];
  fixed: number;
}

interface LintFinding {
  severity: 'error' | 'warning' | 'info';
  rule: string;
  message: string;
  file: string;
  line?: number;
  fix?: string;
}
```

---

### update(options)

Check for and apply framework updates.

```javascript
import { update } from 'ai-excellence-framework/commands/update';

const result = await update({
  check: true,             // Check only, don't update
  force: false             // Force update
});
```

**Returns:** `Promise<UpdateResult>`

```typescript
interface UpdateResult {
  currentVersion: string;
  latestVersion: string;
  updateAvailable: boolean;
  updated: boolean;
  changelog?: string;
}
```

---

## Error Handling

All commands throw `AIExcellenceError` on failure:

```javascript
import { init, AIExcellenceError } from 'ai-excellence-framework';

try {
  await init({ preset: 'standard' });
} catch (error) {
  if (error instanceof AIExcellenceError) {
    console.error(`Error ${error.code}: ${error.message}`);
    console.error(`Suggestion: ${error.suggestion}`);
  }
}
```

### Error Codes

| Code | Description |
|------|-------------|
| `AIX-INIT-001` | Initialization failed |
| `AIX-INIT-002` | Directory not empty |
| `AIX-VALID-001` | Validation failed |
| `AIX-VALID-002` | Schema mismatch |
| `AIX-GEN-001` | Generation failed |
| `AIX-GEN-002` | Unknown tool |
| `AIX-FS-001` | File system error |
| `AIX-NET-001` | Network error |

---

## TypeScript

Full TypeScript definitions included:

```typescript
import type {
  InitOptions,
  InitResult,
  ValidateOptions,
  ValidationResult,
  DoctorOptions,
  DoctorResult,
  GenerateOptions,
  GenerateResult,
  LintOptions,
  LintResult,
  UpdateOptions,
  UpdateResult,
  AIExcellenceError,
} from 'ai-excellence-framework';
```

---

## CLI Usage

For command-line usage, see [CLI Reference](./QUICK-REFERENCE.md).

```bash
# All commands available via CLI
npx ai-excellence-framework <command> [options]

# Or with alias
npx aix <command> [options]
```
