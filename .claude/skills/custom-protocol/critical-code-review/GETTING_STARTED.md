# Getting Started with Critical Code Review

This guide shows how to use the critical-code-review skill in practice.

## Quick Start

### 1. Initialize Review Template

```bash
node scripts/review.js --init
# Creates .refactor/review.md template
```

### 2. Run Complexity Analysis

```bash
node scripts/analyze-complexity.js src/
# Identifies potential issues in your code
```

### 3. Manual Review

Follow the 8-step pipeline from SKILL.md and fill out the template:
1. Understand context (read .refactor/task.md)
2. Inspect changes (git diff)
3. Architectural review
4. Code quality review
5. Maintainability review
6. Risk analysis
7. Performance check
8. Improvement suggestions

### 4. Validate Your Review

```bash
node scripts/validate-review.js .refactor/review.md
# Ensures your review meets quality standards
```

---

## Workflow Example

### Scenario: Consolidating Button Components

**Step 1: Run initial analysis**
```bash
node scripts/review.js src/components/Button/
# Shows context, modified files, complexity issues
```

**Step 2: Initialize review template**
```bash
node scripts/review.js --init
```

**Step 3: Fill out the review**
Edit `.refactor/review.md` following the template structure:
- Context: What was being consolidated?
- Architecture: Does this improve componentization?
- Code Quality: Any dynamic Tailwind issues?
- Maintainability: Is the API clear?
- Risk: Could this break existing buttons?
- Suggestions: Extract theme? Add types?

**Step 4: Validate the review**
```bash
node scripts/validate-review.js .refactor/review.md
# Checks that suggestions are specific and actionable
```

**Step 5: Address issues**
- CRITICAL issues block merge
- HIGH issues should be fixed soon
- MEDIUM/LOW issues are enhancements

---

## Script Details

### analyze-complexity.js

Automated detection of code smells:

```bash
# Analyze single directory
node scripts/analyze-complexity.js src/

# Analyze specific file type (searches recursively)
node scripts/analyze-complexity.js src/components/
```

**Detects:**
- Functions longer than 30 lines
- Nesting depth > 3 levels
- Magic numbers (unexplained constants)
- Duplicate code patterns (appears 3+ times)
- High cyclomatic complexity (5+ conditional branches)

**Output:**
```
## 🟡 MEDIUM

**File:** `src/components/Button.tsx:15`
**Type:** LongFunction
**Issue:** Function 'renderButton' is 45 lines (threshold: 30)
**Suggestion:** Extract logic into smaller functions...
```

### review.js

Interactive review helper:

```bash
# Full review workflow
node scripts/review.js

# Quick scan (skips performance section)
node scripts/review.js --quick

# Review specific directory
node scripts/review.js src/components/

# Initialize template
node scripts/review.js --init
```

**Output:**
- Reads context from `.refactor/task.md`
- Lists modified files from git
- Runs complexity analyzer
- Shows review checklist for all 4 dimensions
- Points to review file location

### validate-review.js

Quality gates for reviews:

```bash
# Validate default location
node scripts/validate-review.js

# Validate specific file
node scripts/validate-review.js .refactor/review.md
```

**Validates:**
- ✅ All required sections present
- ✅ CRITICAL/HIGH issues have specific suggestions
- ✅ No generic criticism
- ✅ Recommendations are actionable
- ✅ All issues have improvement suggestions

**Fails if:**
- 🔴 Missing required sections
- 🔴 CRITICAL issues without suggestions
- 🔴 Generic phrases like "should be better"
- 🔴 No improvement suggestions at all

---

## Integration with large-scale-refactor

When used together, create a powerful feedback loop:

```
1. Run large-scale-refactor skill
   → generates code changes

2. Run critical-code-review skill
   → identifies issues in the changes

3. Fix HIGH/CRITICAL issues from review
   → improve the generated code

4. Re-run review validation
   → confirm all issues addressed

5. Merge with confidence
   → code is well-reviewed and high-quality
```

---

## Best Practices

### 1. Be Specific

❌ **Bad:**
```
Code is too complex.
```

✅ **Good:**
```
Function calculateTotal() has 35 lines with 5 nested if-statements.
Recommendation: Extract tax calculation and discount logic into separate pure functions.
This improves testability and reusability.
```

### 2. Every Issue Needs a Suggestion

❌ **Bad:**
```
🔴 CRITICAL: Missing error handling
```

✅ **Good:**
```
🔴 CRITICAL: Missing error handling
Suggestion: Wrap database call in try-catch and throw custom RepositoryError
```

### 3. Don't Defend Bad Code

❌ **Wrong:**
```
Component X does the same thing, so this is fine.
```

✅ **Right:**
```
Component X has the same issue. Recommend refactoring both to use a shared utility.
```

### 4. The 3-Year Test

Ask: "If this code lives in production for 3 years unchanged, will future devs hate it?"

---

## Example Reviews

See [examples.md](examples.md) for complete review examples:
- Button component consolidation
- User repository extraction

---

## Troubleshooting

### "No complexity issues detected" but I know there are issues

The analyzer uses basic pattern matching. For complex cases:
- Use the review checklist manually
- Look at examples in reference.md
- Compare against SOLID principles

### "Review validator failed" 

Check:
- Do you have "## Improvement Suggestions" section?
- Are CRITICAL/HIGH issues actionable?
- Did you use vague language like "should be better"?

### Scripts not running

- Ensure Node.js is installed: `node --version`
- Check you're in the right directory
- Try: `node scripts/review.js --help`

---

## Next Steps

1. Read [SKILL.md](SKILL.md) for the full pipeline
2. Study [reference.md](reference.md) for code smell patterns
3. Review [examples.md](examples.md) for complete examples
4. Run `node scripts/review.js --init` to start reviewing
