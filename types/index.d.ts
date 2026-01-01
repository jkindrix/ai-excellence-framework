/**
 * AI Excellence Framework - TypeScript Type Definitions
 *
 * @packageDocumentation
 * @module ai-excellence-framework
 */

// ============================================
// Core Types
// ============================================

/**
 * Framework version string
 */
export const VERSION: string;

/**
 * Available preset names for framework initialization
 */
export type PresetName = 'minimal' | 'standard' | 'full' | 'team';

/**
 * List of available presets
 */
export const PRESETS: PresetName[];

/**
 * Available slash command names
 */
export type CommandName =
  | 'plan'
  | 'verify'
  | 'handoff'
  | 'assumptions'
  | 'review'
  | 'security-review'
  | 'refactor'
  | 'test-coverage';

/**
 * Available agent names
 */
export type AgentName = 'explorer' | 'reviewer' | 'tester';

// ============================================
// Configuration Types
// ============================================

/**
 * Framework configuration options
 */
export interface FrameworkConfig {
  /** Configuration version */
  version: string;

  /** Selected preset */
  preset: PresetName | 'custom';

  /** Enabled slash commands */
  commands: CommandName[];

  /** Enabled agents */
  agents: AgentName[];

  /** Enable git hooks */
  hooks: boolean;

  /** Enable MCP server */
  mcp: boolean;

  /** Enable pre-commit integration */
  preCommit: boolean;

  /** Additional custom configuration */
  custom?: CustomConfig;
}

/**
 * Custom configuration options
 */
export interface CustomConfig {
  /** Custom slash commands directory */
  commandsDir?: string;

  /** Custom agents directory */
  agentsDir?: string;

  /** MCP server configuration */
  mcpServer?: MCPServerConfig;

  /** Metrics configuration */
  metrics?: MetricsConfig;
}

/**
 * MCP server configuration
 */
export interface MCPServerConfig {
  /** Database file path */
  dbPath?: string;

  /** Maximum stored decisions */
  maxDecisions?: number;

  /** Maximum stored patterns */
  maxPatterns?: number;

  /** Maximum context keys */
  maxContextKeys?: number;

  /** Connection pool size */
  poolSize?: number;

  /** Rate limit (ops per minute) */
  rateLimit?: number;
}

/**
 * Metrics configuration
 */
export interface MetricsConfig {
  /** Enable metrics collection */
  enabled: boolean;

  /** Auto-collect on git commit */
  autoCollect?: boolean;

  /** Metrics storage path */
  storagePath?: string;

  /** Alert thresholds */
  alerts?: AlertConfig[];
}

/**
 * Alert configuration
 */
export interface AlertConfig {
  /** Alert identifier */
  id: string;

  /** Threshold value */
  threshold: number;

  /** Time window */
  window?: 'session' | 'daily' | 'weekly' | 'monthly';

  /** Action to take */
  action: 'notify' | 'suggest' | 'block';

  /** Alert message */
  message: string;
}

/**
 * Default configuration values
 */
export const DEFAULT_CONFIG: FrameworkConfig;

// ============================================
// Command Types
// ============================================

/**
 * Options for the init command
 */
export interface InitOptions {
  /** Preset to use */
  preset?: PresetName;

  /** Run in non-interactive mode */
  yes?: boolean;

  /** Preview changes without writing */
  dryRun?: boolean;

  /** Overwrite existing files */
  force?: boolean;

  /** Skip hooks installation */
  hooks?: boolean;

  /** Skip MCP server installation */
  mcp?: boolean;

  /** Verbose output */
  verbose?: boolean;
}

/**
 * Options for the validate command
 */
export interface ValidateOptions {
  /** Verbose output */
  verbose?: boolean;

  /** Output format */
  format?: 'text' | 'json';

  /** Strict mode (fail on warnings) */
  strict?: boolean;
}

/**
 * Options for the doctor command
 */
export interface DoctorOptions {
  /** Attempt to fix issues */
  fix?: boolean;

  /** Verbose output */
  verbose?: boolean;
}

/**
 * Options for the update command
 */
export interface UpdateOptions {
  /** Target version */
  version?: string;

  /** Preview changes */
  dryRun?: boolean;

  /** Migrate configuration */
  migrate?: boolean;
}

/**
 * Supported AI coding tools for multi-tool generation
 */
export type SupportedTool =
  | 'agents'
  | 'cursor'
  | 'copilot'
  | 'windsurf'
  | 'aider'
  | 'claude'
  | 'gemini'
  | 'codex'
  | 'zed'
  | 'amp'
  | 'roo'
  | 'junie'
  | 'cline'
  | 'goose'
  | 'kiro'
  | 'continue'
  | 'augment'
  | 'qodo'
  | 'opencode'
  | 'zencoder'
  | 'tabnine'
  | 'amazonq'
  | 'plugins'
  | 'skills'
  | 'all';

/**
 * List of supported AI tools
 */
export const SUPPORTED_TOOLS: SupportedTool[];

/**
 * Options for the generate command
 */
export interface GenerateOptions {
  /** Tools to generate configuration for */
  tools?: SupportedTool | SupportedTool[] | string;

  /** Overwrite existing files */
  force?: boolean;

  /** Preview changes without writing */
  dryRun?: boolean;
}

/**
 * Options for the lint command
 */
export interface LintOptions {
  /** Show detailed output */
  verbose?: boolean;

  /** Only check specific files */
  only?: string | string[];

  /** Exit 0 even with errors */
  ignoreErrors?: boolean;
}

/**
 * Lint check result
 */
export interface LintResult {
  /** Check passed */
  passed: boolean;

  /** Result message */
  message: string;

  /** Suggestion for fixing */
  suggestion?: string;
}

/**
 * Lint results summary
 */
export interface LintResults {
  /** Errors (severity: error) */
  errors: LintFinding[];

  /** Warnings (severity: warning) */
  warnings: LintFinding[];

  /** Informational (severity: info) */
  info: LintFinding[];

  /** Passed checks */
  passed: LintFinding[];
}

/**
 * Individual lint finding
 */
export interface LintFinding {
  /** File checked */
  file: string;

  /** Check name */
  check: string;

  /** Finding message */
  message: string;

  /** Suggestion for fixing */
  suggestion?: string;
}

/**
 * Result of init command
 */
export interface InitResult {
  /** Files created */
  created: string[];

  /** Files skipped */
  skipped: string[];

  /** Errors encountered */
  errors: Array<{ file: string; error: string }>;

  /** Overall success */
  success: boolean;
}

/**
 * Result of validate command
 */
export interface ValidateResult {
  /** Validation passed */
  valid: boolean;

  /** Errors found */
  errors: ValidationError[];

  /** Warnings found */
  warnings: ValidationWarning[];

  /** Validated components */
  components: ComponentValidation[];
}

/**
 * Validation error details
 */
export interface ValidationError {
  /** Error code */
  code: string;

  /** Error message */
  message: string;

  /** File path (if applicable) */
  file?: string;

  /** Line number (if applicable) */
  line?: number;
}

/**
 * Validation warning details
 */
export interface ValidationWarning {
  /** Warning code */
  code: string;

  /** Warning message */
  message: string;

  /** Suggestion for resolution */
  suggestion?: string;
}

/**
 * Component validation result
 */
export interface ComponentValidation {
  /** Component name */
  name: string;

  /** Validation status */
  status: 'valid' | 'invalid' | 'missing' | 'outdated';

  /** Details */
  details?: string;
}

/**
 * Result of doctor command
 */
export interface DoctorResult {
  /** Overall health status */
  healthy: boolean;

  /** Health checks performed */
  checks: HealthCheck[];

  /** Issues fixed (if --fix used) */
  fixed?: string[];
}

/**
 * Health check result
 */
export interface HealthCheck {
  /** Check name */
  name: string;

  /** Check passed */
  passed: boolean;

  /** Details */
  message: string;

  /** Suggestion if failed */
  suggestion?: string;
}

// ============================================
// Command Functions
// ============================================

/**
 * Initialize the framework in a project
 * @param options - Initialization options
 * @returns Promise resolving to init result
 */
export function initCommand(options?: InitOptions): Promise<InitResult>;

/**
 * Validate framework installation
 * @param options - Validation options
 * @returns Promise resolving to validation result
 */
export function validateCommand(options?: ValidateOptions): Promise<ValidateResult>;

/**
 * Check framework health
 * @param options - Doctor options
 * @returns Promise resolving to health check result
 */
export function doctorCommand(options?: DoctorOptions): Promise<DoctorResult>;

/**
 * Update framework to latest version
 * @param options - Update options
 * @returns Promise resolving to success status
 */
export function updateCommand(options?: UpdateOptions): Promise<boolean>;

/**
 * Generate configurations for AI coding tools
 * @param options - Generate options
 * @returns Promise resolving when generation is complete
 */
export function generateCommand(options?: GenerateOptions): Promise<void>;

/**
 * Lint framework configuration files
 * @param options - Lint options
 * @returns Promise resolving to lint results
 */
export function lintCommand(options?: LintOptions): Promise<LintResults>;

/**
 * Options for the uninstall command
 */
export interface UninstallOptions {
  /** Force removal without confirmation */
  force?: boolean;

  /** Keep configuration files */
  keepConfig?: boolean;

  /** Preview removal without executing */
  dryRun?: boolean;
}

/**
 * Uninstall framework from project
 * @param options - Uninstall options
 * @returns Promise resolving when uninstall is complete
 */
export function uninstall(options?: UninstallOptions): Promise<void>;

/**
 * Options for the detect command
 */
export interface DetectOptions {
  /** Directory to scan */
  targetDir?: string;

  /** Show detailed information */
  verbose?: boolean;

  /** Output as JSON */
  json?: boolean;
}

/**
 * Result of tool detection
 */
export interface DetectResult {
  /** Detected tools */
  detected: Array<{
    id: string;
    name: string;
    foundFiles: string[];
  }>;

  /** Tools not detected */
  notDetected: Array<{
    id: string;
    name: string;
  }>;
}

/**
 * Detect configured AI tools in a directory
 * @param cwd - Directory to scan
 * @returns Detection result
 */
export function detectTools(cwd: string): DetectResult;

/**
 * Detect command handler
 * @param options - Detect options
 * @returns Promise resolving when detection is complete
 */
export function detectCommand(options?: DetectOptions): Promise<void>;

// ============================================
// Error Types
// ============================================

/**
 * Error categories
 */
export type ErrorCategory =
  | 'INIT'
  | 'VALID'
  | 'CONFIG'
  | 'FS'
  | 'NET'
  | 'MCP'
  | 'HOOK'
  | 'GEN';

/**
 * Framework error class
 */
export class FrameworkError extends Error {
  /** Error code (e.g., 'AIX-INIT-101') */
  code: string;

  /** Error timestamp */
  timestamp: string;

  /** Original error cause */
  cause: Error | null;

  /** Additional context */
  context: Record<string, unknown>;

  /** Whether error is recoverable */
  recoverable: boolean;

  /** Suggested fix */
  suggestion: string | null;

  constructor(
    code: string,
    message: string,
    options?: {
      cause?: Error;
      context?: Record<string, unknown>;
      recoverable?: boolean;
      suggestion?: string;
    }
  );

  /** Get JSON representation */
  toJSON(): {
    name: string;
    code: string;
    message: string;
    timestamp: string;
    recoverable: boolean;
    suggestion: string | null;
    context: Record<string, unknown>;
    stack?: string;
  };

  /** Format for CLI output */
  format(verbose?: boolean): string;
}

/**
 * Error code definition
 */
export interface ErrorCodeDefinition {
  category: string;
  description: string;
  suggestion: string;
}

/**
 * Catalog of all error codes
 */
export const ERROR_CODES: Record<string, ErrorCodeDefinition>;

/**
 * Exit codes for CLI commands
 */
export const EXIT_CODES: {
  SUCCESS: 0;
  GENERAL_ERROR: 1;
  MISUSE: 2;
  CANNOT_EXECUTE: 126;
  NOT_FOUND: 127;
  INVALID_ARG: 128;
  CTRL_C: 130;
  INIT_ERROR: 64;
  VALIDATION_ERROR: 65;
  CONFIG_ERROR: 66;
  IO_ERROR: 74;
  TEMP_FAILURE: 75;
  PROTOCOL_ERROR: 76;
  PERMISSION_ERROR: 77;
  CONFIG_MISSING: 78;
};

/**
 * Create a framework error
 * @param code - Error code from ERROR_CODES
 * @param customMessage - Optional custom message
 * @param options - Error options
 */
export function createError(
  code: string,
  customMessage?: string,
  options?: {
    cause?: Error;
    context?: Record<string, unknown>;
    recoverable?: boolean;
    suggestion?: string;
  }
): FrameworkError;

/**
 * Get exit code for an error code
 * @param errorCode - Framework error code
 */
export function getExitCode(errorCode: string): number;

/**
 * Wrap async function with error handling
 * @param fn - Async function to wrap
 */
export function asyncHandler<T extends (...args: unknown[]) => Promise<unknown>>(
  fn: T
): T;

/**
 * Assert a condition or throw error
 * @param condition - Condition to check
 * @param code - Error code if condition is false
 * @param message - Error message
 * @param options - Error options
 */
export function assertCondition(
  condition: boolean,
  code: string,
  message?: string,
  options?: {
    cause?: Error;
    context?: Record<string, unknown>;
  }
): asserts condition;

// ============================================
// MCP Types
// ============================================

/**
 * Decision stored in MCP memory
 */
export interface Decision {
  id: number;
  timestamp: string;
  decision: string;
  rationale: string;
  context?: string;
  alternatives?: string;
  created_at: string;
}

/**
 * Pattern stored in MCP memory
 */
export interface Pattern {
  id: number;
  name: string;
  description: string;
  example?: string;
  when_to_use?: string;
  updated_at: string;
}

/**
 * MCP memory statistics
 */
export interface MemoryStats {
  decisions: number;
  patterns: number;
  context_keys: number;
  db_size_bytes: number;
  limits: {
    max_decisions: number;
    max_patterns: number;
    max_context_keys: number;
  };
}

/**
 * MCP health check result
 */
export interface MCPHealthCheck {
  status: 'healthy' | 'degraded' | 'unhealthy';
  version: string;
  checks: {
    database_connection: string;
    database_integrity: string;
    write_capability: string;
    capacity: {
      decisions_used_percent: number;
      patterns_used_percent: number;
      warning?: string;
    };
  };
  db_path: string;
}

/**
 * MCP export data format
 */
export interface MCPExportData {
  version: string;
  exported_at: string;
  project: string;
  data: {
    decisions: Decision[];
    patterns: Pattern[];
    context: Record<string, string>;
  };
  stats: MemoryStats;
}

// ============================================
// Metrics Types
// ============================================

/**
 * Session metrics
 */
export interface SessionMetrics {
  session: {
    id: string;
    started_at: string;
    ended_at: string;
    duration_minutes: number;
    project: string;
  };
  tasks: {
    total: number;
    completed: number;
    in_progress: number;
    blocked: number;
  };
  ai_interactions: {
    total_queries: number;
    successful: number;
    required_retry: number;
    context_resets: number;
  };
  friction_points: {
    encountered: string[];
    mitigated: string[];
    unresolved: string[];
  };
  quality: {
    commits: number;
    tests_added: number;
    tests_passed: boolean;
    lint_errors: number;
    security_issues: number;
  };
}

/**
 * Aggregate metrics over a period
 */
export interface AggregateMetrics {
  period: {
    start: string;
    end: string;
    type: 'daily' | 'weekly' | 'monthly';
  };
  sessions: {
    count: number;
    total_hours: number;
    avg_session_minutes: number;
  };
  productivity: {
    tasks_completed: number;
    completion_rate: number;
    avg_tasks_per_session: number;
  };
  friction: {
    most_common: Array<{
      type: string;
      count: number;
      mitigation_rate: number;
    }>;
  };
  quality_trends: {
    test_coverage: number[];
    security_issues: number[];
    lint_errors: number[];
  };
}

// ============================================
// Utility Types
// ============================================

/**
 * Deep partial type
 */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

/**
 * Configuration with partial overrides
 */
export type PartialConfig = DeepPartial<FrameworkConfig>;
