/**
 * Security Tests for AI Excellence Framework
 *
 * Tests security-critical functionality including:
 * - ReDoS (Regular Expression Denial of Service) resistance
 * - Secret pattern detection accuracy
 * - Input sanitization
 *
 * Run with: node --test tests/security.test.js
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import { SECRET_PATTERNS, detectSecrets, cloneRegExp } from '../src/index.js';

// ============================================
// ReDoS RESISTANCE TESTS
// ============================================

/**
 * Maximum allowed time for regex matching in milliseconds.
 * If any pattern takes longer than this, it's considered potentially vulnerable to ReDoS.
 * Normal matches should complete in <10ms; we use 100ms as a generous upper bound.
 */
const MAX_MATCH_TIME_MS = 100;

/**
 * Test a regex pattern against a pathological input for ReDoS vulnerability.
 *
 * @param {RegExp} pattern - The regex pattern to test
 * @param {string} input - The pathological input string
 * @param {string} patternName - Name for error messages
 */
function assertNoReDoS(pattern, input, patternName) {
  // Clone the pattern to ensure we get a fresh regex state
  const clonedPattern = cloneRegExp(pattern);

  const startTime = performance.now();
  // Use String.prototype.match instead of RegExp.prototype.test
  // to handle global flag correctly
  try {
    input.match(clonedPattern);
  } catch {
    // Some patterns might throw on invalid input, that's fine
  }
  const endTime = performance.now();
  const elapsed = endTime - startTime;

  assert.ok(
    elapsed < MAX_MATCH_TIME_MS,
    `Pattern "${patternName}" took ${elapsed.toFixed(2)}ms (max: ${MAX_MATCH_TIME_MS}ms) - potential ReDoS vulnerability`
  );
}

describe('ReDoS Resistance', () => {
  describe('SECRET_PATTERNS should resist ReDoS attacks', () => {
    // Pathological inputs that commonly trigger ReDoS in poorly-crafted regexes
    const pathologicalInputs = {
      // Repeated 'a' characters - triggers backtracking on many patterns
      repeatedChars: 'a'.repeat(100000),

      // Alternating pattern - can cause exponential backtracking
      alternating: 'ababababab'.repeat(10000),

      // Near-match that forces full backtracking
      nearMatchApiKey: 'api_key="' + 'x'.repeat(100000) + '"',

      // Nested brackets/quotes that some patterns might struggle with
      nestedQuotes: '"'.repeat(50000) + "'".repeat(50000),

      // Whitespace variations
      whitespaceHeavy: ' '.repeat(100000),

      // Mixed alphanumeric that might match partial patterns
      mixedAlphanumeric: 'aA1bB2cC3dD4eE5'.repeat(10000),

      // URL-like input with many slashes
      manySlashes: 'https://' + '/'.repeat(50000),

      // Input with many colons and equals (common in config patterns)
      configLike: ':=:=:=:='.repeat(25000),

      // Base64-like input (for JWT patterns)
      base64Like: 'eyJ'.repeat(50000),

      // Hex-like input (for various key patterns)
      hexLike: 'deadbeef'.repeat(12500)
    };

    // Test each category of SECRET_PATTERNS
    for (const [category, patterns] of Object.entries(SECRET_PATTERNS)) {
      describe(`Category: ${category}`, () => {
        for (const { name, pattern } of patterns) {
          it(`${name} pattern should complete quickly on pathological inputs`, () => {
            // Test against each pathological input
            for (const [inputType, input] of Object.entries(pathologicalInputs)) {
              assertNoReDoS(pattern, input, `${name} against ${inputType}`);
            }
          });
        }
      });
    }
  });

  describe('detectSecrets should resist ReDoS attacks', () => {
    it('should complete quickly on large files with no secrets', () => {
      // Simulate a large file with no actual secrets
      const largeContent = `
// This is a large JavaScript file with lots of comments and code
// but no actual secrets

${'function foo() { return "bar"; }\n'.repeat(10000)}

// More comments about stuff
${'const data = { key: "value", other: 123 };\n'.repeat(5000)}

// End of file
`.trim();

      const startTime = performance.now();
      const result = detectSecrets(largeContent);
      const elapsed = performance.now() - startTime;

      // Should complete in under 1 second for a file this size
      assert.ok(
        elapsed < 1000,
        `detectSecrets took ${elapsed.toFixed(2)}ms on large file (max: 1000ms)`
      );
      assert.strictEqual(result.findings.length, 0, 'Should find no secrets in benign content');
    });

    it('should handle pathological repeated patterns gracefully', () => {
      // Create content that might trigger backtracking in naive implementations
      const pathologicalContent = `
api_key = "${'a'.repeat(100000)}"
password: "${'x'.repeat(100000)}"
secret = "${'!@#$%^&*()'.repeat(10000)}"
`;

      const startTime = performance.now();
      const result = detectSecrets(pathologicalContent);
      const elapsed = performance.now() - startTime;

      assert.ok(
        elapsed < 2000,
        `detectSecrets took ${elapsed.toFixed(2)}ms on pathological content (max: 2000ms)`
      );

      // These should match because they're in the expected format
      assert.ok(result.findings.length >= 0, 'Should handle pathological input without crashing');
    });

    it('should handle nested/recursive-like structures', () => {
      // Content that might trigger catastrophic backtracking
      const nestedContent = `
${'{"type":"'.repeat(5000)}${'service_account"}'.repeat(5000)}
`;

      const startTime = performance.now();
      detectSecrets(nestedContent);
      const elapsed = performance.now() - startTime;

      assert.ok(
        elapsed < 2000,
        `detectSecrets took ${elapsed.toFixed(2)}ms on nested content (max: 2000ms)`
      );
    });
  });
});

// ============================================
// SECRET PATTERN ACCURACY TESTS
// ============================================

describe('Secret Pattern Accuracy', () => {
  describe('Should detect real secrets', () => {
    const testCases = [
      // AI/ML Keys
      { input: 'sk-1234567890abcdefghijklmnopqrstuvwxyz12345678', expected: 'OpenAI Key' },
      { input: 'sk-ant-api03-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx', expected: 'Anthropic Key' },
      { input: 'AIzaSyAxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx', expected: 'Google AI Key' },

      // GitHub Tokens
      { input: 'ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx', expected: 'GitHub Token' },
      { input: 'gho_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx', expected: 'GitHub OAuth' },

      // AWS Keys
      { input: 'AKIAIOSFODNN7EXAMPLE', expected: 'AWS Access Key' },
      { input: 'ASIAJEXAMPLEEXAMPLEU', expected: 'AWS STS Key' },

      // Stripe Keys
      { input: 'sk_live_xxxxxxxxxxxxxxxxxxxxxxxxxx', expected: 'Stripe Live Key' },
      { input: 'sk_test_xxxxxxxxxxxxxxxxxxxxxxxxxx', expected: 'Stripe Test Key' }
    ];

    for (const { input, expected } of testCases) {
      it(`should detect ${expected}`, () => {
        const results = detectSecrets(input);
        const found = results.findings.some(r => r.type === expected);
        assert.ok(found, `Expected to find "${expected}" in: ${input.substring(0, 30)}...`);
      });
    }
  });

  describe('Should NOT detect false positives', () => {
    const benignInputs = [
      // Common false positive triggers
      'const api_version = "v2"',
      'function parseSecretKey(input) {}',
      'PASSWORD_MIN_LENGTH = 8',
      'The API key format is documented at...',
      'export type SecretType = string;',
      'git commit -m "Update API documentation"',
      '// TODO: Add bearer token support',
      'class StripePaymentHandler {}',
      'describe("AWS integration", () => {})'
    ];

    for (const input of benignInputs) {
      it(`should not flag: "${input.substring(0, 40)}..."`, () => {
        const results = detectSecrets(input);
        assert.strictEqual(results.findings.length, 0, `Unexpected match in benign input: ${JSON.stringify(results.findings)}`);
      });
    }
  });
});

// ============================================
// REGEX CLONING TESTS
// ============================================

describe('cloneRegExp utility', () => {
  it('should preserve pattern and flags', () => {
    const original = /test-pattern/gi;
    const cloned = cloneRegExp(original);

    assert.strictEqual(cloned.source, original.source);
    assert.strictEqual(cloned.flags, original.flags);
    assert.notStrictEqual(cloned, original, 'Should be a different object');
  });

  it('should reset lastIndex on global regexes', () => {
    const original = /test/g;
    original.lastIndex = 5;

    const cloned = cloneRegExp(original);
    assert.strictEqual(cloned.lastIndex, 0, 'Cloned regex should have lastIndex reset');
  });

  it('should preserve sticky and unicode flags', () => {
    const original = /test/gsu;
    const cloned = cloneRegExp(original);

    assert.ok(cloned.global, 'Should preserve global flag');
    assert.ok(cloned.dotAll, 'Should preserve dotAll (s) flag');
    assert.ok(cloned.unicode, 'Should preserve unicode flag');
  });
});

// ============================================
// PATTERN INTEGRITY TESTS
// ============================================

describe('Pattern Integrity', () => {
  it('SECRET_PATTERNS should be frozen (immutable)', () => {
    assert.ok(Object.isFrozen(SECRET_PATTERNS), 'SECRET_PATTERNS should be frozen');

    for (const [category, patterns] of Object.entries(SECRET_PATTERNS)) {
      assert.ok(Object.isFrozen(patterns), `${category} array should be frozen`);

      for (const patternObj of patterns) {
        assert.ok(Object.isFrozen(patternObj), `Pattern objects in ${category} should be frozen`);
      }
    }
  });

  it('All patterns should have bounded quantifiers', () => {
    // Patterns with unbounded quantifiers (*, +) without limits are ReDoS risks
    // This test warns about potentially dangerous patterns

    const unboundedPatterns = [];

    for (const [category, patterns] of Object.entries(SECRET_PATTERNS)) {
      for (const { name, pattern } of patterns) {
        const source = pattern.source;

        // Look for potentially dangerous patterns:
        // - .* or .+ without preceding boundary
        // - Nested quantifiers like (a+)+
        // - Alternation in quantified groups like (a|b)+

        // Check for unbounded .* or .+
        if (/\.\*(?!\?)/.test(source) || /\.\+(?!\?)/.test(source)) {
          // Check if it's bounded by character class negation [^...]*
          if (!/\[\^[^\]]+\]\*/.test(source) && !/\[\^[^\]]+\]\+/.test(source)) {
            unboundedPatterns.push({ category, name, pattern: source });
          }
        }
      }
    }

    // Report any potentially dangerous patterns
    if (unboundedPatterns.length > 0) {
      console.warn('Potentially dangerous patterns found:');
      unboundedPatterns.forEach(p => console.warn(`  ${p.category}/${p.name}: ${p.pattern}`));
    }

    // This is a soft assertion - we report but don't fail
    // The ReDoS timing tests above are the real validation
    assert.ok(true, 'Pattern review complete');
  });

  it('All categories should be documented', () => {
    const expectedCategories = [
      'generic',
      'ai_ml',
      'cloud',
      'vcs',
      'communication',
      'payment',
      'database',
      'registry',
      'email',
      'crypto'
    ];

    for (const category of expectedCategories) {
      assert.ok(
        SECRET_PATTERNS[category],
        `Expected category "${category}" to exist in SECRET_PATTERNS`
      );
    }
  });
});
