/**
 * AI Excellence Framework - Generator Modules Index
 *
 * Central export point for all generator modules.
 * Generators are progressively being extracted to separate files.
 *
 * Modular structure:
 * - base.js - Shared utilities (parseProjectContext, extractSections, etc.)
 * - agents.js - AGENTS.md generator (Linux Foundation AAIF)
 * - cursor.js - Cursor IDE rules generator
 * - copilot.js - GitHub Copilot instructions generator
 * - windsurf.js - Windsurf IDE rules generator
 *
 * Remaining generators are still in ../commands/generate.js and will be
 * extracted incrementally as needed.
 */

// Re-export base utilities
export {
  parseProjectContext,
  extractSections,
  extractTechStack,
  extractSecurityChecklist,
  getProjectName,
  formatTechStack,
  printResults,
  clearParseCache,
  getCacheStats
} from './base.js';

// Re-export modular generators
export { generateAgentsMd, generateAgentsMdContent } from './agents.js';
export {
  generateCursorRules,
  generateCursorMainRule,
  generateCursorSecurityRule,
  generateCursorIndex
} from './cursor.js';
export { generateCopilotInstructions, generateCopilotContent } from './copilot.js';
export {
  generateWindsurfRules,
  generateWindsurfrulesContent,
  generateWindsurfMainRule,
  generateWindsurfSecurityRule
} from './windsurf.js';

/**
 * Generator registry for dynamic lookup
 * Maps tool names to their generator functions
 *
 * Note: Generators not yet extracted remain in generate.js
 * and are called directly from the switch statement there.
 */
export const MODULAR_GENERATORS = {
  agents: 'generateAgentsMd',
  cursor: 'generateCursorRules',
  copilot: 'generateCopilotInstructions',
  windsurf: 'generateWindsurfRules'
};
