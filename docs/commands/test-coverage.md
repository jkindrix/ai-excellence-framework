# /test-coverage Command

Analyze test coverage and identify gaps.

## Purpose

Find untested code paths and generate test cases to improve coverage.

## Usage

```
/test-coverage [file, module, or feature]
```

**Examples:**
```
/test-coverage src/services/payment.ts
/test-coverage the authentication module
/test-coverage recent changes
```

## Output Format

```markdown
## Test Coverage Analysis: [Target]

### Current Coverage
| Metric | Value |
|--------|-------|
| Line coverage | X% |
| Branch coverage | X% |
| Function coverage | X% |

### Uncovered Code Paths
| Location | Type | Priority |
|----------|------|----------|
| `file.ts:45-52` | Branch | High |
| `file.ts:78` | Line | Medium |

### Missing Test Cases
- [ ] [Test case description]
- [ ] [Test case description]

### Edge Cases Not Tested
- [ ] [Edge case]
- [ ] [Edge case]

### Generated Tests
[Test code suggestions]

### Recommendations
1. [Priority recommendation]
2. [Priority recommendation]
```

## Coverage Analysis

### Line Coverage

What percentage of lines execute during tests?

```markdown
### Line Coverage: 75%

#### Uncovered Lines
- `src/services/payment.ts:45-52` - Error handling path
- `src/services/payment.ts:78` - Timeout logic
```

### Branch Coverage

What percentage of if/else branches are tested?

```markdown
### Branch Coverage: 60%

#### Uncovered Branches
- `if (error.code === 'TIMEOUT')` - Never triggered
- `else if (user.role === 'admin')` - Never triggered
```

### Function Coverage

What percentage of functions have tests?

```markdown
### Function Coverage: 80%

#### Untested Functions
- `handleTimeout()` - No tests
- `cleanupSession()` - No tests
```

## Test Case Generation

The command can suggest test cases:

```markdown
### Generated Tests

#### Test: Payment timeout handling
```javascript
test('handles payment timeout gracefully', async () => {
  // Arrange
  mockStripe.paymentIntents.create.mockRejectedValue({
    code: 'TIMEOUT'
  });

  // Act & Assert
  await expect(paymentService.process(order))
    .rejects.toThrow('Payment timeout');
});
```

#### Test: Admin role access
```javascript
test('allows admin to access all users', async () => {
  // Arrange
  const adminUser = { id: 1, role: 'admin' };

  // Act
  const users = await userService.getAll(adminUser);

  // Assert
  expect(users).toHaveLength(10);
});
```
```

## Best Practices

### 1. Focus on Critical Paths

Not all code needs 100% coverage:

```markdown
### Priority Levels

| Priority | Coverage Goal | Examples |
|----------|---------------|----------|
| **High** | >90% | Payment, auth, security |
| **Medium** | >70% | Business logic, services |
| **Low** | >50% | Utilities, helpers |
```

### 2. Test Edge Cases

Focus on boundaries and error conditions:

```markdown
### Edge Cases to Test
- Empty input
- Maximum values
- Invalid formats
- Concurrent access
- Network failures
```

### 3. Integration vs Unit

Consider test type:

```markdown
### Test Type Recommendations
- `processPayment()` - Integration test with Stripe mock
- `validateEmail()` - Unit test
- `handleWebhook()` - Integration test
```

### 4. Run After Feature Implementation

```
# Implement feature
/test-coverage [feature]
# Write missing tests
/verify test coverage improved
```

## When to Use

| Situation | Use /test-coverage? |
|-----------|---------------------|
| After implementing feature | Yes |
| Before release | Yes |
| Periodic health check | Yes |
| During code review | Sometimes |
| Quick bug fix | Usually no |

## Evidence

| Source | Finding |
|--------|---------|
| [Veracode](https://www.veracode.com/blog/genai-code-security-report/) | Testing catches 45% of AI vulnerabilities |

## See Also

- [Tester Agent](/commands/agents/tester) — Specialized test generation
- [/verify](/commands/verify) — Verify implementation
- [/review](/commands/review) — Code review
