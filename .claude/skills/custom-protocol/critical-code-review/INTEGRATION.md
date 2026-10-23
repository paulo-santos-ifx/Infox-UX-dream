# Integration Guide: critical-code-review + large-scale-refactor

This document explains how to use these two skills together to create a powerful refactoring and review workflow.

## The Philosophy

**Large-scale-refactor** generates high-quality refactoring.
**Critical-code-review** ensures that quality is maintained.

Together, they create a feedback loop that eliminates AI-generated technical debt at the source.

```
Refactor Agent      Review Agent        Status
    ↓                   ↓                  
generates changes   identifies issues   → Issues found?
    ↓                   ↓
fixes HIGH issues   validates fixes    → All fixed?
    ↓                   ↓
final code          final validation   → APPROVED ✅
```

---

## Complete Workflow

### Phase 1: Plan the Refactoring

Use `large-scale-refactor` skill to understand what needs changing:

```bash
# This happens in the refactoring skill
# It creates .refactor/task.md explaining the refactoring goal
```

**Example task.md:**
```
# Refactoring Task: Extract Button Components

## Objective
Consolidate 3 button implementations into reusable Button component.

## Scope
- components/UserPage.tsx (Line 45-67)
- components/Dashboard.tsx (Line 120-140)
- components/Modal.tsx (Line 80-105)

## Expected Outcome
Single Button component that replaces all three.
```

### Phase 2: Generate Changes

The refactor skill generates the code changes:

```bash
# Large-scale-refactor generates:
# - components/Button/Button.tsx (NEW)
# - components/Button/Button.types.ts (NEW)
# - Modified UserPage, Dashboard, Modal
```

### Phase 3: Review the Changes

Now use `critical-code-review` to audit the generated code:

```bash
# Initialize review
node scripts/review.js --init

# Analyze complexity
node scripts/analyze-complexity.js src/components/Button/

# This generates output like:
# 🟡 MEDIUM: Function renderButton() is 45 lines
# 🔴 CRITICAL: Dynamic Tailwind classes won't work in production
# ⚠ Missing TypeScript types
```

### Phase 4: Document Issues

Fill out `.refactor/review.md` with findings:

```markdown
# Code Review Report

## Architecture Review

✔ Consolidates 3 implementations
✔ Reduces duplication

⚠ No theme abstraction
✗ Dynamic Tailwind classes will fail in production

## Code Quality Review

🔴 CRITICAL: Function renderButton() uses template literals with Tailwind
- Problem: `border-${color}-500` won't be detected by Tailwind purge
- Suggestion: Use static mapping instead

🟡 MEDIUM: No TypeScript types
- Problem: Props are untyped, easy to misuse
- Suggestion: Create ButtonProps interface

## Improvement Suggestions

1. **Priority 1 (Must Fix)**
   - Replace dynamic Tailwind with static classes
   - Add strong TypeScript types

2. **Priority 2 (Should Fix)**
   - Extract colors to theme system
   - Add component documentation

## Summary

**Verdict:** ⚠ Approved with concerns

The refactoring succeeds but needs fixes before production.
```

### Phase 5: Validate Review Quality

```bash
node scripts/validate-review.js .refactor/review.md

# Output:
# ✅ All required sections present
# ✅ CRITICAL issues have specific suggestions
# ✅ Recommendations are actionable
```

### Phase 6: Fix Issues

Go back to refactoring or manual fixes:

```bash
# Refactor agent OR manual changes to fix:
# - CRITICAL: Replace dynamic Tailwind
# - CRITICAL: Add TypeScript types
# - HIGH: Extract theme system (if high priority)
```

### Phase 7: Re-Review

Run the review again on the fixed code:

```bash
# Clear old review
rm .refactor/review.md

# Run new review
node scripts/review.js --init
node scripts/analyze-complexity.js src/components/Button/

# Fill out review again with updated findings
# This time: "No critical issues, ready for merge"
```

### Phase 8: Final Validation

```bash
node scripts/validate-review.js .refactor/review.md

# Success! Code is ready.
```

---

## Decision Tree

When you find issues during review, use this to decide what to do:

```
Issue found during review
    ↓
Is it CRITICAL?
├─ YES → Must fix before merge
│        └─ Use refactor skill or manual fixes
│        └─ Re-review after fixes
├─ NO → Is it HIGH?
│        ├─ YES → Should fix soon
│        │        └─ Document in "Priority 1"
│        │        └─ Can merge if no CRITICAL issues
│        ├─ NO → Is it MEDIUM?
│        │        ├─ YES → Nice to improve
│        │        │        └─ Document in "Priority 2"
│        │        ├─ NO → Is it LOW?
│        │                ├─ YES → Optional enhancement
│        │                │        └─ Document in "Priority 3"
```

---

## Example: Button Component Refactor

### 1. Refactoring Generates This

```tsx
// components/Button/Button.tsx
export const Button = ({ children, variant = "solid", color = "blue", size = "md" }) => {
  const variantClass =
    variant === "solid"
      ? `bg-${color}-500 hover:bg-${color}-600` // ← PROBLEM
      : `border-${color}-500 text-${color}-500`; // ← PROBLEM

  return <button className={variantClass}>{children}</button>;
};
```

### 2. Review Finds Issues

```
🔴 CRITICAL: Dynamic Tailwind classes
   Suggestion: Use static class mapping
   
🟡 MEDIUM: No TypeScript types
   Suggestion: Create ButtonProps interface
```

### 3. Refactoring Fixes

```tsx
// components/Button/Button.tsx
import { buttonClasses } from "./button.theme";

export const Button = ({ children, variant = "solid", color = "primary" }: ButtonProps) => {
  const classes = buttonClasses[variant]?.[color];

  return <button className={classes}>{children}</button>;
};

// button.theme.ts
export const buttonClasses = {
  solid: {
    primary: "bg-blue-500 hover:bg-blue-600 text-white",
    danger: "bg-red-500 hover:bg-red-600 text-white",
  },
};

// Button.types.ts
export interface ButtonProps {
  children: React.ReactNode;
  variant?: "solid" | "outline" | "ghost";
  color?: "primary" | "danger" | "success";
  size?: "sm" | "md" | "lg";
  onClick?: () => void;
}
```

### 4. Review Again

```
✔ Static Tailwind classes work correctly
✔ Strong TypeScript types prevent misuse
✔ Theme system enables easy rebranding

⚠ Missing error boundary (MEDIUM, Priority 2)
```

### 5. Approve

```
Verdict: ✅ Approved

The component is production-ready.
Future enhancements (error boundary, animation options) can be added in follow-up.
```

---

## Git Integration (Optional)

You can automate this with git hooks:

```bash
# .git/hooks/post-merge
#!/bin/bash
if [ -f ".refactor/task.md" ]; then
  echo "Refactoring detected. Running review..."
  node scripts/review.js
fi
```

---

## Checklist for Review/Refactor Loop

When using both skills:
- [ ] Refactoring plan is clear (.refactor/task.md)
- [ ] Code changes are generated
- [ ] Initial analysis run (complexity analyzer)
- [ ] Review checklist completed
- [ ] All CRITICAL issues documented
- [ ] Specific suggestions provided for each issue
- [ ] Review validated (validate-review.js passes)
- [ ] Issues are fixed (refactoring or manual)
- [ ] Code re-reviewed
- [ ] Final validation passes
- [ ] Ready for merge

---

## Severity Guidelines

When deciding severity levels:

### 🔴 CRITICAL

- Breaks functionality in production
- Breaks type safety
- Causes security vulnerability
- Creates impossible-to-debug issues
- Blocks other changes
- **Must fix before merge**

### 🟠 HIGH

- Causes maintainability problems
- Performance degradation
- Architectural violations
- Difficult to test
- **Should fix before merge, can defer if business needs it**

### 🟡 MEDIUM

- Code quality improvement
- Minor architectural improvement
- Nice-to-have refactoring
- **Can be done in follow-up sprint**

### 🟢 LOW

- Minor enhancement
- Optional improvement
- Documentation suggestion
- **Optional, capture for future**

---

## When to Use Each Skill

| Task                   | Skill    | Then Review?         |
| ---------------------- | -------- | -------------------- |
| Consolidate components | refactor | ✅ Yes               |
| Extract service layer  | refactor | ✅ Yes               |
| Break large file       | refactor | ✅ Yes               |
| Update dependencies    | manual   | ✅ Yes (quick)       |
| Add new feature        | manual   | ✅ Yes               |
| Simple bug fix         | manual   | ⚠ Maybe (if complex) |

**Rule:** Any significant code change benefits from review.

---

## Antipatterns to Avoid

❌ **Don't** skip validation after fixing issues
```
Review finds 3 issues → Fix them → Merge without re-reviewing
```

✅ **Do** re-validate
```
Review finds 3 issues → Fix them → Re-review → Validate → Merge
```

---

❌ **Don't** use "refactoring" as excuse for bad code
```
"This is fine because we'll refactor it later"
```

✅ **Do** fix issues immediately
```
"Let's fix this now before it causes problems"
```

---

❌ **Don't** approve with CRITICAL issues
```
"This has critical bugs but it's mostly good"
```

✅ **Do** require fixes
```
"CRITICAL issues block merge. Let's address them now."
```

---

## Summary

The `critical-code-review` + `large-scale-refactor` loop is powerful because:
1. ✅ **Automation** — Refactoring generates code quickly
2. ✅ **Quality** — Review ensures quality
3. ✅ **Feedback** — Review findings improve future refactoring
4. ✅ **Learning** — Team learns patterns from reviews
5. ✅ **Prevention** — Technical debt caught early

This is how you build AI-assisted refactoring that actually maintains code quality over time.
