# Advanced Reference — Large-Scale Refactoring

Technical guide for executing large-scale refactorings with confidence.

---

## Efficient Scan Techniques

### 1. Extract Structure Without Reading Everything

For large files (>200 lines), use grep instead of full reads:

```bash
# Extract all import lines
grep "^import\|^from" src/components/Dashboard.tsx

# Typical result:
import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useQuery } from '@tanstack/react-query';
import { UserService } from '../../services/UserService';
import { theme } from '../../theme';
import { formatDate } from '../../utils/formatters';
```

```bash
# Extract all export lines
grep "^export" src/components/Dashboard.tsx

# Result:
export const Dashboard = () => { ... };
export const DashboardLoader = () => { ... };
```

```bash
# Extract interfaces/types defined
grep "^interface\|^type\|^enum" src/services/UserService.ts

# Result:
interface User {
  id: string;
  name: string;
}
type UserId = string;
enum UserRole {
  ADMIN = 'admin',
}
```

```bash
# Find functions (React components, utilities, etc)
grep -E "^(export\s+)?(async\s+)?function|^const\s+\w+\s*=" src/utils/validators.ts | head -20

# Result:
const validateEmail = (email: string) => { ... };
const validatePassword = (password: string) => { ... };
export async function fetchUserData(id: string) { ... };
```

### 2. Dependency Mapping

```bash
# Find who uses a function/component
grep -r "ButtonPrimary" src/ --include="*.tsx" --include="*.ts"

# Result:
src/pages/Home.tsx: import { ButtonPrimary } from '../components/buttons';
src/pages/Profile.tsx: <ButtonPrimary onClick={...}>
src/components/Modal.tsx: import { ButtonPrimary } from '../buttons';
```

```bash
# Find all imports from a specific file
grep -r "from.*Button" src/ --include="*.tsx" | grep -v node_modules

# Result:
src/pages/Home.tsx:import { Button } from '../components/buttons';
src/pages/Profile.tsx:import { ButtonPrimary, ButtonDanger } from '../components';
src/Modal.tsx:import ButtonPrimary from '../Button/Primary';
```

### 3. Automatic Code Smell Detection

#### Large Files

```bash
# Find all files > 300 lines
find src -name "*.tsx" -o -name "*.ts" | while read f; do
  lines=$(wc -l < "$f")
  if [ $lines -gt 300 ]; then
    echo "$f: $lines lines"
  fi
done

# Result:
src/pages/Dashboard.tsx: 520 lines
src/services/UserService.ts: 380 lines
src/components/Table.tsx: 450 lines
```

#### Circular Imports

```bash
# Check for circular imports (requires depcheck tool)
npx depcheck src/

# Or manually: find imports that form cycles
# A imports B, B imports A
grep -r "from.*A" src/B.ts
grep -r "from.*B" src/A.ts
```

#### Duplicated Styles

```bash
# Find duplicated className or styled patterns
grep -r "bg-blue px-4 py-2" src/

# Result:
src/pages/Home.tsx:        className="bg-blue px-4 py-2"
src/components/Card.tsx:     className="bg-blue px-4 py-2"
src/pages/Profile.tsx:       className="bg-blue px-4 py-2"

# Recommendation: extract to component or CSS class
```

#### Inconsistent Naming

```bash
# Look for inconsistent patterns
grep -r "UserService\|userService\|USER_SERVICE" src/

# If mixed: candidate for refactoring
```

---

## Detailed Dependency Analysis

### Building the Graph

For a file like `src/pages/Dashboard.tsx`:

```
Dashboard.tsx
  imports from:
    ├─ react
    ├─ ../components/Sidebar.tsx
    ├─ ../components/MainContent.tsx
    ├─ ../services/UserService.ts
    └─ ../theme

Sidebar.tsx imports from:
  ├─ react
  ├─ ../theme
  └─ ./icons

MainContent.tsx imports from:
  ├─ react
  ├─ ../theme
  ├─ ../utils/formatters.ts
  └─ ../services/UserService.ts

UserService.ts imports from:
  ├─ ../api
  └─ ../types
```

**Usage**: To refactor `Dashboard.tsx`, understand `Sidebar`, `MainContent`, and `UserService`. Don't need to understand everything about `react` or `theme` until needed.

### Detecting Cycles

```
File A imports B
File B imports C
File C imports A

❌ CYCLE DETECTED: A → B → C → A
Solution: Extract shared type to new file D
```

---

## Safe Migration Techniques

### Pattern 1: Feature Flag

For risky changes, use feature flags:

```typescript
// Old implementation
const Dashboard = () => {
  return <OldDashboard />;
};

// New implementation
const Dashboard = () => {
  const useNewDashboard = process.env.REACT_APP_NEW_DASHBOARD === 'true';
  return useNewDashboard ? <NewDashboard /> : <OldDashboard />;
};
```

Benefit: Safe deploy, easy rollback.

### Pattern 2: Dual Export

Keep both interfaces during transition:

```typescript
// Old export
export { ButtonPrimary };

// New export
export { Button };

// Adapter (for compatibility)
export const ButtonPrimary = (props) => (
  <Button variant="primary" {...props} />
);
```

Benefit: Consumers can migrate gradually.

### Pattern 3: Localized Testing

Migrate in stages and test each one:

```
Step 1: Create new Button component → Run tests
Step 2: Update Home.tsx to use Button → Verify visually
Step 3: Update Profile.tsx to use Button → Verify visually
Step 4: Update Modal.tsx to use Button → Verify visually
Step 5: Run full test suite
Step 6: Delete old ButtonPrimary.tsx
```

---

## Refactorings by Code Type

### 1. React Components

#### Pattern: Consolidate Variants

```
Before: Button.tsx, ButtonPrimary.tsx, ButtonSecondary.tsx, ButtonDanger.tsx
After: Button.tsx (with prop `variant`)

Steps:
1. Create Button.tsx with variant system
2. Implement primary variant (test locally)
3. Migrate ButtonPrimary consumers
4. Implement secondary variant
5. Migrate ButtonSecondary consumers
6. Implement danger variant
7. Migrate ButtonDanger consumers
8. Delete old files
```

#### Pattern: Extract Container/Presentational

```
Before: Component.tsx (120 lines, logic + UI mixed)

After:
  ├─ Component.tsx (60 lines, container logic)
  └─ ComponentUI.tsx (60 lines, rendering only)

Reason: Easier to test, reuse UI
```

### 2. Services/APIs

#### Pattern: Separate Responsibilities

```
Before: UserService.ts (200 lines)
  - fetch users
  - fetch roles
  - manage cache
  - handle auth

After:
  ├─ UserService.ts (100 lines) - fetch users
  ├─ RoleService.ts (50 lines) - fetch roles
  ├─ CacheService.ts (40 lines) - manage cache
  └─ AuthService.ts (60 lines) - handle auth
```

### 3. Custom Hooks

#### Pattern: Extract Duplicated Logic

```typescript
// Before: Logic repeated in 3 components
const UserProfile = () => {
  const [user, setUser] = useState(null);
  useEffect(() => { fetchUser().then(setUser); }, []);
  return <div>{user?.name}</div>;
};

const UserSettings = () => {
  const [user, setUser] = useState(null);
  useEffect(() => { fetchUser().then(setUser); }, []);
  return <div>{user?.email}</div>;
};

// After: Reusable hook
const useUser = () => {
  const [user, setUser] = useState(null);
  useEffect(() => { fetchUser().then(setUser); }, []);
  return user;
};

const UserProfile = () => {
  const user = useUser();
  return <div>{user?.name}</div>;
};

const UserSettings = () => {
  const user = useUser();
  return <div>{user?.email}</div>;
};
```

---

## Post-Refactoring Verification

### Compilation Checklist

```bash
# TypeScript
tsc --noEmit

# Linter
eslint src/

# Tests
jest --testPathPattern="refactored" --coverage

# Build
npm run build
```

### Import Resolution Checklist

```bash
# Verify all imports resolve
grep -r "from.*\/" src/ | while read line; do
  file=$(echo "$line" | cut -d: -f1)
  import=$(echo "$line" | sed "s/.*from['\"]\\(.*\\)['\"].*/\\1/")
  # Validate that file exists
done
```

### Manual Verification

1. **Rendering**: Page/component renders without error?
2. **Functionality**: Actions work (clicks, submits, navigation)?
3. **Styling**: Layout/colors unchanged?
4. **Performance**: No visible regression?
5. **Accessibility**: Labels, ARIA still work?

---

## Warning Signs

| Sign                      | Meaning             | Action                  |
| ------------------------- | ------------------- | ----------------------- |
| `Module not found`        | File/export missing | Check imports/exports   |
| `Cannot read property`    | Wrong type          | Verify TypeScript types |
| `Circular dependency`     | Import cycle exists | Refactor structure      |
| `Component not rendering` | Logic broken        | Add logs, debug         |
| `Style missing`           | CSS not loaded      | Check CSS imports       |
| Tests failing             | Behavior changed    | Review logic change     |

---

## Anti-Patterns in Refactoring

### ❌ Big Bang Refactor

```
AVOID: Change everything at once, massive merge

INSTEAD: 
  Step 1: Change A (test)
  Step 2: Change B (test)
  Step 3: Change C (test)
  ...multiple small commits...
```

### ❌ Premature Abstraction

```
AVOID: 
  "Extract HOC for 2 components"
  → 50 lines wrapper, 2 components complex

INSTEAD:
  "Leave duplicated until 3+ cases equal"
  → Clearer pattern emerges
```

### ❌ Skip Testing

```
AVOID:
  Refactor without running tests
  → Bugs found in production

INSTEAD:
  Refactor → Run tests → Merge
```

### ❌ No Communication

```
AVOID:
  PR with 50 files refactored
  → Code review impossible

INSTEAD:
  Series of small focused PRs
  → Each reviewable in 10 minutes
```

---

## Automated Scan Script

Automate the SCAN phase with `scan.js`:

```bash
# Generate structure report
node scripts/scan.js src/

# With custom output
node scripts/scan.js src/ --output .refactor/scan.json --pretty

# Help
node scripts/scan.js --help
```

Output example:

```json
{
  "scan_timestamp": "2026-03-15T10:30:00Z",
  "root": "/project/src",
  "total_files": 42,
  "by_extension": {
    ".ts": 25,
    ".tsx": 17
  },
  "large_files": [
    {
      "path": "src/pages/Dashboard.tsx",
      "lines": 520,
      "issue": "Large file (520 lines, max 600)"
    }
  ],
  "code_smells": []
}
```

---

## When to Halt Refactoring

Stop and reassess if you detect:
1. **Scope exploded**: Started with 5 steps, now 15
2. **Circular dependencies**: Structure more complex than expected
3. **Types broken**: Can't resolve TypeScript errors
4. **Tests failing**: >3 tests broken
5. **Confusion**: Lost understanding of what to do

**Action**: Stop, document in `.refactor/task.md`, ask for help.

---

## Useful Tools

| Tool            | Usage                    |
| --------------- | ------------------------ |
| `grep` / `rg`   | Search patterns in files |
| `find`          | List files by criteria   |
| `wc -l`         | Count file lines         |
| `tsc --noEmit`  | Check TypeScript types   |
| `eslint`        | Check code patterns      |
| `jest`          | Run tests                |
| `npm run build` | Verify build             |

---

## Pre-Refactoring Checklist

Before starting any refactoring:
- [ ] SCAN complete: project structure mapped
- [ ] ARCHITECTURE.md: dependencies visualized
- [ ] PLAN reviewed and approved
- [ ] Understand risks (circular imports? cascading changes?)
- [ ] Have rollback strategy
- [ ] Tests passing in current state
- [ ] Ready to work incrementally (not big bang)

Only start REFACTOR after all above complete.
