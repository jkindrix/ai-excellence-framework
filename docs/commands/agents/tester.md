# Tester Agent

Specialized agent for test generation and coverage improvement.

## Purpose

Generate test cases, identify coverage gaps, and suggest testing strategies.

## Tools Available

| Tool | Purpose |
|------|---------|
| Read | Read source and test files |
| Grep | Find patterns and coverage |
| Write | Generate test files |

## Usage

```
Test: [file or feature]
```

**Examples:**
```
Test: src/services/payment.ts
Test: the user registration flow
Test: edge cases for order processing
```

## When to Use

| Situation | Use Tester? |
|-----------|-------------|
| After implementing feature | Yes |
| Improving test coverage | Yes |
| Before release | Yes |
| Finding edge cases | Yes |
| During implementation | Sometimes |

## Output Format

```markdown
## Test Analysis: [Target]

### Current Coverage
| Type | Coverage |
|------|----------|
| Line | X% |
| Branch | X% |
| Function | X% |

### Missing Tests
- [ ] [Test case description]
- [ ] [Test case description]

### Edge Cases
- [ ] [Edge case to test]
- [ ] [Edge case to test]

### Generated Tests

```javascript
// tests/payment.test.js

describe('PaymentService', () => {
  describe('processPayment', () => {
    test('handles successful payment', async () => {
      // Test implementation
    });

    test('handles payment failure', async () => {
      // Test implementation
    });
  });
});
```

### Recommendations
1. [Testing strategy recommendation]
```

## Test Types Generated

### Unit Tests

```javascript
test('validates email format', () => {
  expect(validateEmail('user@example.com')).toBe(true);
  expect(validateEmail('invalid')).toBe(false);
});
```

### Integration Tests

```javascript
test('creates user and sends welcome email', async () => {
  const user = await userService.create({ email: 'test@example.com' });
  expect(mockEmailService.send).toHaveBeenCalledWith(
    expect.objectContaining({ to: 'test@example.com' })
  );
});
```

### Edge Case Tests

```javascript
test('handles concurrent payment attempts', async () => {
  const results = await Promise.all([
    paymentService.process(order),
    paymentService.process(order),
  ]);
  expect(results.filter(r => r.success)).toHaveLength(1);
});
```

## Best Practices

### 1. Test Critical Paths First

Focus on:
- Payment processing
- Authentication flows
- Data validation
- Security-sensitive code

### 2. Include Negative Tests

```javascript
// Don't just test success
test('rejects invalid payment amount', async () => {
  await expect(paymentService.process({ amount: -100 }))
    .rejects.toThrow('Invalid amount');
});
```

### 3. Test Boundaries

```javascript
test('handles maximum order quantity', async () => {
  const order = { quantity: MAX_QUANTITY };
  await expect(orderService.create(order)).resolves.toBeDefined();
});

test('rejects exceeding maximum quantity', async () => {
  const order = { quantity: MAX_QUANTITY + 1 };
  await expect(orderService.create(order)).rejects.toThrow();
});
```

### 4. Mock External Dependencies

```javascript
beforeEach(() => {
  jest.spyOn(stripeClient, 'createPaymentIntent')
    .mockResolvedValue({ id: 'pi_123', status: 'succeeded' });
});
```

## Integration with Main Conversation

```
1. Implement feature (main conversation)
2. Request tests (Tester agent)
3. Review generated tests (main conversation)
4. Add to test suite (main conversation)
5. Run tests and iterate
```

## See Also

- [/test-coverage](/commands/test-coverage) — Coverage analysis command
- [/verify](/commands/verify) — Verify implementation
- [Reviewer Agent](/commands/agents/reviewer) — Code review
