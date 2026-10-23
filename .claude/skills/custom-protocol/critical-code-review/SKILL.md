---
name: critical-code-review
description: Perform rigorous technical code review as a senior engineer auditor, identifying architectural flaws, code smells, maintainability risks, and performance issues. Act as if you did not write the code. Use when reviewing refactored code, generated changes, or pull requests requiring architectural critique.
---

# Critical Code Review

## The Core Principle

When reviewing code, **act as if you did not write it**. You are an auditor, not a defender. Assume the worst. Challenge every decision.

This skill combats AI bias: generated code tends to defend itself. Your job is to be the rabid senior engineer reviewing a risky PR at 2 AM.

---

## Review Pipeline

Follow this sequence strictly:
1. **Context Understanding** — Why was this changed?
2. **Change Inspection** — What actually changed?
3. **Architectural Review** — Does this improve or degrade the system?
4. **Code Quality Review** — What code smells exist?
5. **Maintainability Review** — Will this scale? Will it be easy to modify?
6. **Risk Analysis** — What could break?
7. **Performance Check** — Any hidden performance debt?
8. **Improvement Suggestions** — What should change?

---

## 1. Context Understanding

Before criticizing, understand _why_ the code was changed.

**Read these files** (if they exist):
- `.refactor/task.md` — what was the objective?
- `.refactor/progress.md` — what was accomplished?
- Recent git history or user description

**Output a brief summary:**
```
# Review Context

Objective:
[what was the goal]

Files modified:
[list of modified files]

Scope:
[how large is this change]
```

Without context, criticism is noise.

---

## 2. Change Inspection

Analyze **only what changed**. Use `git diff` as your primary source.

Identify:
- New files created
- Existing files modified
- Code removed
- API changes

**Filter out noise** — ignore formatting, whitespace, or trivial renames.

Focus on **intent**.

---

## 3. Architectural Review

Now the serious engineering begins. Answer these questions:
- ✅ Does this **reduce coupling** or increase it?
- ✅ Does this **improve code reuse** or create islands?
- ✅ Does this **respect the project structure**?
- ✅ Does this follow **SOLID principles**?
- ✅ Does this improve **separation of concerns**?

**Output format:**
```
## Architecture Review

✔ Positive observation
✔ Positive observation

⚠ Warning: description
⚠ Warning: description

✗ Critical issue: description
```

---

## 4. Code Quality Review

Inspect the code microscopically. Check for:
- **Excessive complexity** — nested conditionals, long chains
- **Large functions** — should be broken into smaller units
- **Poor naming** — unclear variable or function names
- **Logic duplication** — same logic in multiple places
- **Unnecessary conditionals** — can be simplified
- **Magic numbers** — unexplained constants

**Example problem:**
```
Function renderButton() has 45 lines.
Recommendation: Extract styling, validation, and event handling into separate concerns.
```

---

## 5. Maintainability Review

This is what separates senior engineers from coders.

Ask yourself:
- 🤔 Would a new developer understand this?
- 🤔 Is the API clear and intuitive?
- 🤔 Will this scale when the project grows?
- 🤔 Will this be easy to modify in 6 months?
- 🤔 Does it follow project conventions?

**Example bad API:**
```tsx
<Button color="blue" bg="blue-500" hover="blue-600" />;
// Fragile. What if someone wants blue-400?
```

**Example good API:**
```tsx
<Button variant="primary" />;
// Clear intent. Scales with design system.
```

---

## 6. Risk Analysis

Search for **regression risks**:
- Broken imports or circular dependencies
- Props or parameters that aren't used
- Unexpected side effects
- State mutations in unexpected places
- Backward compatibility breaks
- References to old code that should have been removed

**Example risk:**
```
UserPage.tsx still uses old Button component.
This will cause visual inconsistency.
Risk Level: MEDIUM
```

---

## 7. Performance Check

Look for invisible problems that become expensive later:

**Frontend:**
- Inline functions in JSX
- Unnecessary re-renders
- Heavy imports in components
- Objects recreated on every render

**Backend:**
- N+1 query patterns
- Unnecessary database calls
- Large objects in memory
- Inefficient loops

---

## 8. Severity Classification

Classify each issue:
- 🔴 **CRITICAL** — must fix before merge, causes bugs or major architectural issues
- 🟠 **HIGH** — should fix soon, impacts maintainability or performance
- 🟡 **MEDIUM** — consider fixing, improves code quality
- 🟢 **LOW** — nice to have, minor improvement

---

## 9. Improvement Suggestions

Make **specific, actionable suggestions**. Do NOT modify code automatically.

**Good suggestion:**
```
MEDIUM: Function calculateDiscount() has 32 lines.
Suggestion: Extract tax calculation and discount logic into separate pure functions.
This improves testability and reusability.
```

**Bad suggestion:**
```
Code is complex.
```

---

## 10. Brutal Review Mode (Optional)

For critical reviews, adopt this perspective:

**Assume this code will live in production for 3 years without modification.**

Ask:
- Will this be a nightmare in year 2?
- What happens when someone unfamiliar tries to modify it?
- If performance degrades, how hard will it be to debug?
- Will future developers hate the person who wrote this?

This question demolishes a lot of shortcuts.

---

## Output Format

Generate a review file:

```markdown
# Code Review Report

## Context

[Objective and scope]

## Architecture Review

[✔ positives, ⚠ warnings, ✗ issues]

## Code Quality

[Problems found, with severity]

## Maintainability

[API clarity, scalability concerns, convention adherence]

## Risk Analysis

[Potential regressions and dependencies]

## Performance

[Any performance concerns]

## Improvement Suggestions

1. [Specific actionable suggestion]
2. [Specific actionable suggestion]
3. [Specific actionable suggestion]

## Summary

[Overall assessment and next steps]
```

---

## Integration with large-scale-refactor

When used together with the `large-scale-refactor` skill:

```
Refactor Agent → generates changes
         ↓
Review Agent   → identifies issues
         ↓
Refactor Agent → improves based on feedback
         ↓
Review Agent   → final validation
```

This creates a feedback loop that eliminates technical debt at the source.

---

## Anti-Pattern: Don't Defend

❌ **WRONG:**
```
The code is fine because it follows the pattern used in Component X.
```

✅ **RIGHT:**
```
Component X has the same issue. Recommend refactoring both.
```

Never let existing bad code justify new bad code.

---

## Utility Scripts

The skill includes Node.js scripts to automate parts of the review:

**Complexity Analyzer:**
```bash
node scripts/analyze-complexity.js src/
# Detects long functions, deep nesting, magic numbers, duplicates
```

**Review Helper:**
```bash
node scripts/review.js                # Full analysis
node scripts/review.js --quick        # Quick scan
node scripts/review.js --init         # Create review template
```

**Review Validator:**
```bash
node scripts/validate-review.js .refactor/review.md
# Validates that the review meets quality standards
```

Or use npm scripts from the skill directory:
```bash
npm run review        # Full analysis
npm run analyze       # Complexity analysis only
npm run validate      # Validate review file
```

---

## See Also

For detailed examples and reference material, see:
- [reference.md](reference.md) — Code smell catalog and architectural patterns
- [examples.md](examples.md) — Complete review examples
