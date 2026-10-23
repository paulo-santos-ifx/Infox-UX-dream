---
name: large-scale-refactor
description: Perform disciplined large-scale refactoring using a structured 5-phase pipeline. Use when refactoring large codebases, resolving architectural issues, eliminating code duplication, or breaking large files into modules. Guides the agent through Scan → Map → Plan → Refactor → Verify phases with strict constraints on file size and change scope.
---

# Large-Scale Refactoring

Refactor large codebases safely and incrementally using a disciplined 5-phase pipeline that prevents architectural blind spots and technical debt accumulation.

## When to Use This Skill

- **Refactoring large files** (>600 lines) into modules
- **Eliminating code duplication** across multiple files
- **Resolving architectural issues** without creating new problems
- **Migrating UI components** from multiple variants to composable patterns
- **Breaking apart monolithic services** into focused units

This skill is **not** for:
- Small, localized bug fixes
- Single-file changes
- Syntax updates (linting)

---

## The 5-Phase Pipeline

All refactoring must follow this exact sequence. **No phase can be skipped.**

```
1. SCAN    → Extract project structure
2. MAP     → Build dependency graph
3. PLAN    → Create refactor strategy
4. REFACTOR → Execute incremental changes
5. VERIFY  → Ensure correctness
```

---

## Integration with critical-code-review

Refactoring and review form a **closed loop**. After REFACTOR and VERIFY, run the **critical-code-review** skill so an independent audit finds architectural flaws, code smells, and risks. Then improve from the review feedback and, if needed, run the review again for final validation.

```
Refactor Agent (this skill) → SCAN → MAP → PLAN → REFACTOR → VERIFY
         ↓
Review Agent (critical-code-review) → identifies issues, suggests improvements
         ↓
Refactor Agent → addresses HIGH/CRITICAL findings, re-verifies
         ↓
Review Agent → final validation (loop closed)
```

**When to close the loop:** After completing at least one full REFACTOR step (or the whole refactor scope). Use the review report (e.g. `.refactor/review.md` or `CODE_REVIEW_REPORT.md`) as the backlog for the next refactor pass. Do not skip the review; it eliminates technical debt at the source and prevents the refactor from defending its own choices.

---

## Phase 1: SCAN

**Objective**: Understand the codebase skeleton without reading everything.

### Rules

- **List all project files** using `find`, `glob`, or `ls`
- **Extract only**: imports, exports, classes, functions, interfaces (not full content)
- **Max read size per file**: 200 lines
- **Large files (>200 lines)**: Extract using grep patterns, don't read entirely
- **Save output**: `.refactor/scan.json`

### Example Output

```json
{
  "scan_timestamp": "2026-03-15T10:30:00Z",
  "total_files": 42,
  "by_language": {
    "typescript": 35,
    "json": 5,
    "css": 2
  },
  "files": [
    {
      "path": "src/components/Button.tsx",
      "size_lines": 120,
      "imports": ["react", "styled-components", "./types"],
      "exports": ["Button", "ButtonProps"],
      "symbols": {
        "functions": ["Button"],
        "interfaces": ["ButtonProps"],
        "types": []
      }
    }
  ],
  "code_smells": {
    "files_over_600_lines": ["src/pages/Dashboard.tsx"],
    "potential_duplication": []
  }
}
```

### Scan Extraction Technique

For TypeScript/React files, use grep patterns instead of full reads:

```bash
# Get all imports
grep "^import\|^from" file.ts

# Get all exports
grep "^export" file.ts

# Get all function/interface definitions
grep "^(export\s+)?(async\s+)?(function|interface|type|class)" file.ts
```

Alternatively, use the automated script:

```bash
node scripts/scan.js src/
node scripts/scan.js src/ --output .refactor/scan.json --pretty
```

---

## Phase 2: MAP — Architecture Mapping

**Objective**: Build a dependency graph to navigate without opening giant files.

### Rules

- **Create `.refactor/architecture.md`**
- **Show relationships**, not file contents
- **Group by semantic layer**: components, services, utils, hooks, types
- **Use tree structure** to show import chains

### Example Output

```markdown
# Architecture Map

## Layers

### Components

- Button.tsx (120 lines, imports: theme, types)
- Avatar.tsx (85 lines, imports: theme, types)
- Modal.tsx (150 lines, imports: Button, Avatar, theme)

### Services

- UserService.ts (200 lines)
  - imports: API, types
  - used by: UserPage, ProfileModal

### Utils

- formatters.ts (80 lines)
  - used by: 5 components, 2 services

## Dependency Graph

UserPage
├─ UserService
├─ Modal
│ ├─ Button
│ └─ Avatar
└─ Avatar
```

### Detection

Identify **red flags** during mapping:
- Circular imports
- Deep nesting (>4 levels)
- Files with many responsibilities (high import count)
- Large service files (>300 lines)

---

## Phase 3: PLAN — Refactor Strategy

**Objective**: Create a battle plan **before touching any code**.

### File: `.refactor/task.md`

**Required structure**:

```markdown
# Refactor Objective

[1-2 sentence description of the goal]

# Problems Detected

- [Code smell 1]
- [Code smell 2]
- [Architectural issue]

# Current State

[Brief architecture description]

# Target State

[How it should look after refactor]

# Refactor Strategy

[Overall approach — what pattern will you use?]

# Steps

1. [Single semantic change]
2. [Single semantic change]
3. [Single semantic change]
   ...

# Risks

- [What could go wrong]
- [How to mitigate]

# Rollback Plan

[How to undo if needed]
```

### Critical Rule: One Semantic Change Per Step

Each step must represent **one type of change**:

```
✅ GOOD
Step 1: Create reusable Button component
Step 2: Update first consumer to use Button
Step 3: Update remaining consumers

❌ BAD
Step 1: Create Button, refactor consumers, remove old styles, fix imports
```

### Step Naming Convention

Use this pattern:

```
1. Create [abstraction/service/hook]
2. Migrate [first usage/group]
3. Migrate [remaining usages]
4. Cleanup [old code/unused exports]
5. Verify [tests/no regressions]
```

---

## Phase 4: REFACTOR — Incremental Execution

**Objective**: Execute the plan while respecting strict constraints.

### Hard Limits

```
MAX_EDIT_LINES      = 120 lines per edit
MAX_READ_LINES      = 200 lines per file
MAX_FILES_PER_STEP  = 3 files affected
```

### Flow for Each Step

```
1. Read affected files (respecting MAX_READ_LINES)
2. Plan the change in detail
3. Make the change (respecting MAX_EDIT_LINES)
4. Verify imports/exports
5. Run quick sanity check (TypeScript compiler, linter)
6. Move to next step
```

### Chunked Reading Strategy

If a file exceeds 200 lines:
1. Read the first 200 lines (imports + structure)
2. Use grep to find specific sections you need
3. Read only that section
4. Never load the entire file into context

Example:

```bash
# Find where Button is used in a 500-line file
grep -n "Button" file.tsx

# Read only the section around Button usage
sed -n '100,150p' file.tsx
```

### Incremental Pattern: Abstraction + Migration + Cleanup

Always follow this sequence:

```
CREATE
└─ New abstraction/component/service

MIGRATE (first)
└─ Update one consumer as proof-of-concept
└─ Verify it works
└─ Update remaining

CLEANUP
└─ Remove old duplicates
└─ Remove unused exports
└─ Verify no breakage
```

**Never** create an abstraction and immediately try to migrate everywhere. Start with **one** consumer to validate the approach.

---

## Phase 5: VERIFY

**Objective**: Ensure the refactoring didn't introduce regressions.

### Verification Checklist

After each step, verify:
- [ ] **Imports are correct**: All used symbols are exported from source files
- [ ] **Exports are complete**: New abstractions are properly exported
- [ ] **No dead code**: Old patterns are removed, not left behind
- [ ] **TypeScript compilation**: `tsc --noEmit` passes (if using TS)
- [ ] **Linter**: No new linter errors introduced
- [ ] **Tests pass**: Existing tests still pass
- [ ] **No circular imports**: Dependency graph remains acyclic

### After Each Step

Log:

```
STEP [N]: [Description]
Status: ✅ COMPLETE

Files modified:
- file1.tsx
- file2.tsx

Verification:
✅ Imports verified
✅ TypeScript: OK
✅ Tests: passed
```

### After VERIFY: close the loop with code review

Once the refactor step (or full pipeline) is verified, run the **critical-code-review** skill on the changed code. Treat the review as the next backlog: address CRITICAL and HIGH items, then re-run verification. Optionally run the review again for final validation. This closes the refactor ↔ review loop and prevents technical debt from surviving the refactor.

---

## Code Smell Detection

During SCAN and MAP phases, flag these patterns:

### File Size

```
> 600 lines    → Candidate for splitting into modules
> 300 lines    → Consider splitting into 2-3 files
```

### Duplication

```
// Button variants repeated 10+ times
<button className="bg-blue px-4 py-2">
<button className="bg-red px-4 py-2">
<button className="bg-green px-4 py-2">

Recommendation: Create reusable <Button variant="primary" />
```

### Service Responsibilities

```
// One service doing too much
UserService
  - fetch users
  - fetch roles
  - fetch permissions
  - manage cache
  - handle auth tokens

Recommendation: Split into UserService + RoleService + AuthService
```

### Import Chains

```
// Too many levels of indirection
Page → Container → Component → Hook → Service → Utils → API

Recommendation: Flatten where possible, group related concerns
```

---

## Refactoring Patterns

### UI Component Consolidation

Transform:

```typescript
// Before: 3 separate components
<ButtonPrimary /> // 50 lines
<ButtonDanger />  // 50 lines  
<ButtonSuccess /> // 50 lines

// After: 1 component, multiple variants
<Button variant="primary" />
<Button variant="danger" />
<Button variant="success" />
```

**Steps**:
1. Create new `Button.tsx` with variants prop
2. Implement one variant completely
3. Migrate first consumer using ButtonPrimary
4. Migrate ButtonDanger consumers
5. Migrate ButtonSuccess consumers
6. Delete ButtonPrimary.tsx, ButtonDanger.tsx, ButtonSuccess.tsx

### Logic Extraction

Transform:

```typescript
// Before: logic duplicated in 3 components
const handleUserSubmit = (data) => {
  validate(data);
  const user = transform(data);
  api.post("/users", user);
};

// After: logic in reusable hook
const useUserSubmit = () => {
  return (data) => {
    /* same logic */
  };
};
```

**Steps**:
1. Create `hooks/useUserSubmit.ts`
2. Extract logic into hook
3. Update first component to use hook
4. Verify behavior unchanged
5. Update remaining components
6. Remove duplicate code

### Large File Decomposition

Transform:

```typescript
// Before: 800-line Dashboard.tsx
export const Dashboard = () => { /* 800 lines */ };

// After: 3 focused files
Dashboard/
  ├─ index.tsx       (80 lines - orchestration)
  ├─ Sidebar.tsx     (150 lines - left panel)
  ├─ Content.tsx     (250 lines - main area)
  └─ types.ts        (30 lines - shared types)
```

**Steps**:
1. Create Dashboard folder with index.tsx
2. Create Sidebar.tsx, move sidebar logic
3. Create Content.tsx, move content logic
4. Create types.ts, move shared types
5. Update imports in index.tsx
6. Verify Dashboard still works
7. Delete old Dashboard.tsx

---

## Progress Tracking

Maintain `.refactor/progress.md`:

```markdown
# Refactor Progress

## Overall

Status: IN PROGRESS
Completed: 3/8 steps

## Step Details

### Step 1: Create Button component ✅

- Completed: 2026-03-15 10:30
- Files created: Button.tsx
- Files modified: index.ts

### Step 2: Migrate ButtonPrimary consumers 🔄

- In progress: 2026-03-15 10:45
- Updated: 3/5 consumers
- Remaining: Profile, Settings, Modal

### Step 3: Migrate ButtonDanger consumers ⏳

- Not started
```

---

## Safety Checkpoints

Before each modification, document:

```markdown
### File: src/components/Button.tsx

**Change type**: Create new component
**Reason**: Consolidate 3 button variants
**Risk**: None (new file)
**After**: Verify exports are correct

### File: src/pages/Home.tsx

**Change type**: Update import
**Reason**: Use new Button instead of ButtonPrimary
**Old**: import { ButtonPrimary } from '../Button/Primary'
**New**: import { Button } from '../Button'
**After**: TypeScript compiler + visual test
```

---

## Stop Conditions

**Halt and reassess if you detect:**
- [ ] Circular imports emerge
- [ ] Type errors appear that are hard to resolve
- [ ] Scope of refactor keeps expanding
- [ ] You're modifying >3 files per step
- [ ] A file exceeds 200 lines and you haven't split it
- [ ] Unclear dependencies prevent clean separation

**When stopped**: Update `.refactor/task.md` with findings and ask for guidance.

---

## Quick Checklist Before Starting

Before diving in:
- [ ] Understand the current architecture (finish SCAN + MAP)
- [ ] Have written plan (PLAN phase complete)
- [ ] Have approval on strategy
- [ ] Know what files will be touched
- [ ] Know the rollback strategy
- [ ] Are prepared to do this incrementally (not all at once)

---

## Anti-Patterns to Avoid

```
❌ Read entire 800-line file to understand one function
✅ Grep for the function, read only that section

❌ Change 5 files simultaneously
✅ Change 1 file, verify, move to next

❌ Create abstraction then migrate all at once
✅ Create abstraction, test with 1 consumer, then scale

❌ Delete old code immediately
✅ Verify new code works, then remove old code

❌ Ignore imports/exports during refactoring
✅ Check imports/exports after every step

❌ Assume tests pass; don't verify
✅ Run tests explicitly after every step
```

---

## Examples

### Example 1: Button Consolidation

See [examples.md](examples.md) for a complete worked example of consolidating 3 button components into 1 reusable component.

### Example 2: Large File Decomposition

See [examples.md](examples.md) for step-by-step decomposition of a 500-line Dashboard component.

---

## Summary

The key principle: **Think like an architect before acting like a mason.**

Each refactoring must be:
- **Planned** before executed (SCAN → MAP → PLAN)
- **Incremental** (one semantic change per step)
- **Verified** (imports, exports, compilation, tests)
- **Tracked** (progress.md updated after each step)
- **Reversible** (rollback plan available)
- **Reviewed** (close the loop with the **critical-code-review** skill after VERIFY)

This prevents the architectural blind spots that plague AI-generated codebases and ensures sustainable, maintainable refactoring.

**See also:** [critical-code-review](../critical-code-review/SKILL.md) — run after REFACTOR/VERIFY for independent audit and to close the refactor ↔ review loop.
