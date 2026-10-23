# Skill: Large-Scale Refactoring

A disciplined framework for refactoring large codebases safely, incrementally, and with architectural awareness.

## The Problem

AI-generated codebases tend to accumulate:
- Duplicated code scattered everywhere
- Giant files (500+ lines)
- Undetected circular dependencies
- Unplanned cascading changes

Each local LLM prompt solves one problem, but nobody is looking at the **system as a whole**.

## The Solution

A fixed cognitive pipeline that forces the agent to think like an **architect before acting like a mason**:

```
SCAN → MAP → PLAN → REFACTOR → VERIFY
```

Each phase has clear rules, scope limits, and verification checkpoints.

## When to Use This Skill

✅ **Use when**:
- Refactoring large files (>600 lines)
- Eliminating duplicated code across multiple files
- Solving architectural problems
- Migrating UI from multiple variants to composable components
- Splitting monolithic services

❌ **Do NOT use when**:
- Making localized bug fixes
- Changing a single small file
- Formatting/linting

## How to Get Started

### 1. Initialize Environment

```bash
bash scripts/init-refactor.sh
```

Creates:
- `.refactor/task.md` - Refactor plan
- `.refactor/progress.md` - Progress tracking
- `.refactor/` - Tracking directory

### 2. Run Scan

```bash
node scripts/scan.js src/
```

Generates `.refactor/scan.json`:
- List of files
- Structure (imports, exports, symbols)
- Detected code smells

### 3. Follow the Pipeline

Mention the refactoring need to the agent:

> "I need to refactor the Dashboard. It's 520 lines, logic is mixed, and I want to consolidate duplicate button components."

The agent will follow:

**Phase 1: SCAN**
- List project files
- Extract structure
- Save to `.refactor/scan.json`

**Phase 2: MAP**
- Build dependency graph
- Create `.refactor/architecture.md`

**Phase 3: PLAN**
- List problems detected
- Propose strategy
- Break into small steps
- Save to `.refactor/task.md`

**Phase 4: REFACTOR**
- Execute each step incrementally
- Respect limits (MAX_EDIT_LINES = 120)
- Update `.refactor/progress.md`

**Phase 5: VERIFY**
- Verification checklist
- TypeScript compilation
- Tests passing
- No regressions

## Skill Files

```
large-scale-refactor/
├── SKILL.md              # Main pipeline (read first)
├── examples.md           # 2 complete examples
├── reference.md          # Advanced technical reference
├── README.md             # This file
└── scripts/
    ├── scan.js           # Automates SCAN phase
    └── init-refactor.sh  # Initial setup
```

## Key Concepts

### 5 Mandatory Phases

None can be skipped:
1. **SCAN**: Understand structure without reading everything
2. **MAP**: Build dependency graph
3. **PLAN**: Plan before editing anything
4. **REFACTOR**: Execute incrementally
5. **VERIFY**: Ensure no regressions

### Strict Rules

```
MAX_EDIT_LINES = 120         # Max lines per edit
MAX_READ_LINES = 200         # Max lines read from a file
MAX_FILES_PER_STEP = 3       # Max files affected per step
```

### One Semantic Change Per Step

```
✅ Step 1: Create Button component
✅ Step 2: Migrate first consumer
❌ NEVER: Create Button + migrate all + delete old files
```

## Examples

### Example 1: Consolidate 3 Buttons into 1

Transform:
```
ButtonPrimary.tsx (45 lines)
ButtonDanger.tsx (48 lines)
ButtonSuccess.tsx (50 lines)
```

Into:
```
Button.tsx (95 lines)
<Button variant="primary" />
<Button variant="danger" />
<Button variant="success" />
```

**See**: [examples.md](examples.md) - Complete walkthrough with code

### Example 2: Decompose 520-Line Dashboard

Transform:
```
Dashboard.tsx (520 lines - monolith)
```

Into:
```
Dashboard/
  ├─ index.tsx (60 lines)
  ├─ Sidebar.tsx (120 lines)
  ├─ MainContent.tsx (250 lines)
  └─ types.ts (30 lines)
```

**See**: [examples.md](examples.md) - Complete walkthrough

## Common Patterns

### UI Component Consolidation

Multiple variants → One component with prop

```typescript
// Before
<ButtonPrimary /> <ButtonDanger /> <ButtonSuccess />

// After
<Button variant="primary" />
<Button variant="danger" />
<Button variant="success" />
```

### Extract Duplicated Logic

Repeated code in 3 components → Reusable hook

```typescript
// Before: useEffect duplicated in Home, Profile, Settings

// After
const useUser = () => {
  /* logic */
};
```

### Decompose Large File

500+ line file → Folder with focused files

```
Component.tsx (500 lines)
↓
Component/
  ├─ index.tsx (orchestration)
  ├─ Sidebar.tsx (feature 1)
  ├─ Content.tsx (feature 2)
  └─ types.ts (shared types)
```

## Code Smells Detected

Automatically during SCAN:

| Smell            | Threshold         | Action               |
| ---------------- | ----------------- | -------------------- |
| Large file       | >600 lines        | Split into modules   |
| Medium file      | >300 lines        | Consider refactoring |
| Duplication      | Repeated patterns | Extract abstraction  |
| Circular imports | A→B→A             | Refactor structure   |

## Post-Refactor Verification

Checklist after each step:
- [ ] Imports resolve
- [ ] Exports complete
- [ ] TypeScript compiles (`tsc --noEmit`)
- [ ] Linter passes (`eslint`)
- [ ] Tests pass (`jest`)
- [ ] No visual regressions

## When to Stop

**Stop and reassess if you detect:**
- Scope exploding (5 steps becomes 20)
- Circular dependencies
- TypeScript types won't resolve
- > 3 tests failing
- Confusion about what to do

**Action**: Document in `.refactor/task.md` and ask for help.

## Anti-Patterns to Avoid

```
❌ Read entire 800-line file
✅ Use grep to find specific section

❌ Change 5 files at once
✅ Change 1, test, move to next

❌ Create abstraction + migrate everything immediately
✅ Create, test with 1 consumer, then scale

❌ Delete old code right away
✅ Verify new code works, then delete

❌ Ignore imports/exports
✅ Check after every step

❌ Skip test verification
✅ Run tests explicitly after every step
```

## Included Scripts

### `scan.js` - Automates SCAN Phase

```bash
# Scan src/
node scripts/scan.js src/

# Custom output
node scripts/scan.js src/ --output .refactor/scan.json --pretty
```

Generates:
- File list
- Structure (imports/exports)
- Detected symbols
- Code smells

### `init-refactor.sh` - Initial Setup

```bash
bash scripts/init-refactor.sh
```

Creates initial files in `.refactor/`

## Recommended Reading Order

1. **First time?** Read [SKILL.md](SKILL.md) - Main pipeline
2. **Want examples?** See [examples.md](examples.md) - 2 real cases
3. **Advanced?** Check [reference.md](reference.md) - Everything in detail

## Next Steps

After creating this skill, you'll have:

✅ Clear framework for safe refactoring
✅ Scope limits (no more "big bang refactors")
✅ Verification at each step
✅ Progress documentation

### Future Evolution

This skill is the foundation for:
- **Heuristics Engine**: Auto-detect refactoring opportunities
- **Architectural Linter**: ESLint for entire project architecture
- **Auto-Refactor**: Suggest and implement refactorings automatically

---

## Questions?

Read in order:
1. SKILL.md (what is it, how it works)
2. examples.md (real examples)
3. reference.md (advanced techniques)
4. scripts/ (tools)

The framework is designed to be **safe** (incremental, verifiable) and **sustainable** (documented, reversible).

**Happy refactoring!** 🚀
