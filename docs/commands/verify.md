# /verify Command

Skeptical validation that attempts to prove work is NOT complete.

## Purpose

Counter the "looks good" bias with deliberate falsification. The AI adopts a skeptical mindset and actively tries to find what's missing.

## Why It Matters

| Without /verify | With /verify |
|-----------------|--------------|
| Assumed complete | Proven complete |
| Hidden gaps remain | Gaps surfaced |
| Overconfidence | Calibrated confidence |
| Issues found later | Issues found now |

## Usage

```
/verify [what was implemented]
```

**Examples:**
```
/verify the authentication feature
/verify all CRUD operations for users
/verify the payment integration
```

## Output Format

```markdown
## Verification Report

### Claims Reviewed

| Claim | Status | Evidence |
|-------|--------|----------|
| [claim] | ✓/✗/⚠️ | [proof] |

### Issues Found

- 🔴 **Critical**: [must fix]
- 🟡 **Warning**: [should fix]

### Remaining Work

- [ ] [Task not complete]

### Verdict

[ ] ✓ COMPLETE - All claims verified
[ ] ⚠️ PARTIAL - Issues noted above
[ ] ✗ INCOMPLETE - Significant work remains
```

## Verification Steps

### 1. Enumerate Claims

List everything that was supposedly completed:
- Files created/modified
- Functions implemented
- Tests written
- Documentation updated

### 2. Manual Inspection

Read each file mentioned. Don't trust summaries—verify content:
- Does the code exist?
- Does it do what was claimed?
- Is it complete?

### 3. Functional Testing

- Can you run the code?
- Do tests pass?
- Does it handle error cases?

### 4. Edge Case Analysis

- What inputs weren't tested?
- What states weren't considered?
- What could break this?

### 5. Integration Check

- Is everything wired up?
- Do imports resolve?
- Are configurations updated?

### 6. Falsification Attempt

Actively try to prove it's NOT complete:
- What's missing?
- What doesn't work?
- What was forgotten?

## Best Practices

### 1. Be Specific About Scope

```
# Good
/verify the user registration endpoint including validation and error handling

# Less good
/verify the user stuff
```

### 2. Act on Findings

If issues are found, address them before claiming completion.

### 3. Iterate if Needed

```
/verify [feature]
# Fix issues
/verify [feature] again
```

### 4. Document Limitations

If something is intentionally incomplete, note it:

```markdown
### Known Limitations
- Email verification not implemented (Phase 2)
- Rate limiting deferred to infrastructure layer
```

## When to Use

| Situation | Use /verify? |
|-----------|--------------|
| Before marking PR ready | Yes |
| After implementing feature | Yes |
| After fixing bug | Yes |
| After refactoring | Yes |
| During implementation | Optional |

## The Falsification Mindset

Regular verification asks: "Is this complete?"

Falsification asks: "How can I prove this is NOT complete?"

This reversal catches issues that confirmation bias misses.

## Evidence

| Source | Finding |
|--------|---------|
| [Veracode](https://www.veracode.com/blog/genai-code-security-report/) | 45% of AI code has vulnerabilities |
| [ISSTA 2025](https://arxiv.org/abs/2409.20550) | Verification catches issues before deploy |

## See Also

- [/plan](/commands/plan) — Plan before implementing
- [/security-review](/commands/security-review) — Security-focused verification
