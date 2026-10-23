# Examples of Large-Scale Refactoring

## Example 1: Button Component Consolidation

A classic case: 3 button variants scattered around, now consolidated.

### Context

You have:
- `src/components/buttons/ButtonPrimary.tsx` (45 lines)
- `src/components/buttons/ButtonDanger.tsx` (48 lines)
- `src/components/buttons/ButtonSuccess.tsx` (50 lines)

Total: ~150 lines of duplicated code.

### SCAN Phase Output

```json
{
  "files": [
    {
      "path": "src/components/buttons/ButtonPrimary.tsx",
      "lines": 45,
      "imports": ["react", "styled-components", "../theme"],
      "exports": ["ButtonPrimary"]
    },
    {
      "path": "src/components/buttons/ButtonDanger.tsx",
      "lines": 48,
      "imports": ["react", "styled-components", "../theme"],
      "exports": ["ButtonDanger"]
    },
    {
      "path": "src/components/buttons/ButtonSuccess.tsx",
      "lines": 50,
      "imports": ["react", "styled-components", "../theme"],
      "exports": ["ButtonSuccess"]
    }
  ],
  "code_smells": {
    "duplication": "3 button variants with 85% identical code"
  }
}
```

### PLAN Phase

```markdown
# Refactor Objective

Consolidate 3 button component variants into 1 reusable Button component with variant system.

# Problems Detected

- 150 lines of near-identical code spread across 3 files
- Adding a new button style requires duplicating logic
- Maintenance burden: fixing a bug means fixing 3 places
- Consumers must import specific ButtonPrimary, ButtonDanger, etc.

# Target State

Single Button component accepting `variant` prop:
- `<Button variant="primary">Click me</Button>`
- `<Button variant="danger">Delete</Button>`
- `<Button variant="success">Confirm</Button>`

# Steps

1. Create new Button.tsx with variant system
2. Implement primary variant (proof of concept)
3. Migrate first ButtonPrimary consumer
4. Migrate remaining ButtonPrimary consumers
5. Implement danger variant
6. Migrate ButtonDanger consumers
7. Implement success variant
8. Migrate ButtonSuccess consumers
9. Delete old ButtonPrimary.tsx
10. Delete old ButtonDanger.tsx
11. Delete old ButtonSuccess.tsx
```

### REFACTOR Phase Execution

#### Step 1: Create Button.tsx with Variant System

**File**: `src/components/buttons/Button.tsx`

```typescript
import React from 'react';
import styled, { css } from 'styled-components';
import { theme } from '../theme';

export type ButtonVariant = 'primary' | 'danger' | 'success';

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  fullWidth?: boolean;
}

const variantStyles = {
  primary: css`
    background-color: ${theme.colors.blue};
    color: white;
    &:hover {
      background-color: ${theme.colors.blueHover};
    }
  `,
  danger: css`
    background-color: ${theme.colors.red};
    color: white;
    &:hover {
      background-color: ${theme.colors.redHover};
    }
  `,
  success: css`
    background-color: ${theme.colors.green};
    color: white;
    &:hover {
      background-color: ${theme.colors.greenHover};
    }
  `,
};

const StyledButton = styled.button<{ $variant: ButtonVariant; $fullWidth: boolean }>`
  padding: ${theme.spacing.md} ${theme.spacing.lg};
  border: none;
  border-radius: ${theme.borderRadius.sm};
  font-size: ${theme.typography.body};
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
  width: ${(props) => (props.$fullWidth ? '100%' : 'auto')};

  ${(props) => variantStyles[props.$variant]}

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', fullWidth = false, ...props }, ref) => (
    <StyledButton
      ref={ref}
      $variant={variant}
      $fullWidth={fullWidth}
      {...props}
    />
  )
);

Button.displayName = 'Button';
```

**Status**: ✅ COMPLETE

**Verification**:
- ✅ TypeScript compilation passes
- ✅ All variants exported
- ✅ Can be imported: `import { Button } from './Button'`

---

#### Step 2: Migrate First ButtonPrimary Consumer (Proof of Concept)

**File**: `src/pages/Home.tsx`

**Before**:
```typescript
import { ButtonPrimary } from '../components/buttons/ButtonPrimary';

export const Home = () => (
  <div>
    <ButtonPrimary onClick={() => console.log('Clicked')}>
      Get Started
    </ButtonPrimary>
  </div>
);
```

**After**:
```typescript
import { Button } from '../components/buttons/Button';

export const Home = () => (
  <div>
    <Button variant="primary" onClick={() => console.log('Clicked')}>
      Get Started
    </Button>
  </div>
);
```

**Status**: ✅ COMPLETE

**Verification**:
- ✅ Page renders
- ✅ Button works (click event fires)
- ✅ Styling correct
- ✅ No TypeScript errors

---

#### Step 3: Migrate Remaining ButtonPrimary Consumers

Find all consumers:
```bash
grep -r "ButtonPrimary" src/ --include="*.tsx"
```

Result:
- `src/pages/Profile.tsx`
- `src/pages/Settings.tsx`
- `src/components/Modal.tsx`

**Update all 3**: Replace import and usage (same pattern as Step 2)

**Status**: ✅ COMPLETE

**Verification**:
- ✅ All pages render
- ✅ No TypeScript errors
- ✅ Visual test: buttons look identical

---

#### Step 4: Implement Danger Variant & Migrate Consumers

Same pattern: implement variant in Button.tsx, then migrate consumers.

**Status**: ✅ COMPLETE

---

#### Step 5: Implement Success Variant & Migrate Consumers

Same pattern.

**Status**: ✅ COMPLETE

---

#### Step 6: Delete Old Files

```bash
rm src/components/buttons/ButtonPrimary.tsx
rm src/components/buttons/ButtonDanger.tsx
rm src/components/buttons/ButtonSuccess.tsx
```

Update `src/components/buttons/index.ts`:

```typescript
// Before
export { ButtonPrimary } from "./ButtonPrimary";
export { ButtonDanger } from "./ButtonDanger";
export { ButtonSuccess } from "./ButtonSuccess";

// After
export { Button, type ButtonVariant, type ButtonProps } from "./Button";
```

**Status**: ✅ COMPLETE

**Verification**:
- ✅ TypeScript: no missing exports
- ✅ All imports in codebase resolve
- ✅ Build succeeds
- ✅ Visual test: all pages render

---

### VERIFY Phase Summary

```markdown
# Consolidation Complete

## Before

- 3 files (145 lines)
- Duplicated logic
- Multiple import paths

## After

- 1 file (95 lines) — **35% reduction**
- Single source of truth
- Single import: `import { Button } from './Button'`

## Verification Checklist

✅ TypeScript compilation: OK
✅ Linter: No new errors
✅ Visual inspection: All buttons render correctly
✅ Functionality: All click handlers work
✅ No circular imports
✅ Build: Successful

## Time Saved

Going forward, adding a new button variant is now:
- Edit one file (Button.tsx)
- Add one CSS block
- Update consumers (if needed)

vs. before:
- Create 3 new files
- Duplicate all the scaffolding code
- Maintain 3x the code
```

---

## Example 2: Decompose Large File

### Context

`src/pages/Dashboard.tsx` has 520 lines. It's a monolith.

### SCAN Phase

```json
{
  "path": "src/pages/Dashboard.tsx",
  "lines": 520,
  "code_smells": "File > 500 lines, candidate for splitting",
  "sections_detected": [
    "Header (60 lines)",
    "Sidebar (120 lines)",
    "MainContent (250 lines)",
    "Footer (30 lines)"
  ]
}
```

### PLAN Phase

```markdown
# Refactor Objective

Split 520-line Dashboard into focused modules.

# Target Structure

Dashboard/
├─ index.tsx (60 lines - orchestration)
├─ Sidebar.tsx (120 lines)
├─ MainContent.tsx (250 lines)
├─ types.ts (shared types)
└─ utils.ts (shared utilities)

# Steps

1. Create Dashboard/ directory and types.ts
2. Create Dashboard/index.tsx with original structure
3. Extract Sidebar logic → Dashboard/Sidebar.tsx
4. Update Dashboard/index.tsx to use Sidebar
5. Extract MainContent logic → Dashboard/MainContent.tsx
6. Update Dashboard/index.tsx to use MainContent
7. Delete old Dashboard.tsx
```

### REFACTOR Phase

#### Step 1-2: Create folder and types

```typescript
// src/pages/Dashboard/types.ts
export interface SidebarItem {
  id: string;
  label: string;
  icon: string;
  onClick: () => void;
}

export interface DashboardState {
  selectedSidebar: string | null;
  isLoading: boolean;
}
```

```typescript
// src/pages/Dashboard/index.tsx (60 lines - orchestration)
import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { MainContent } from './MainContent';
import { DashboardState } from './types';

export const Dashboard = () => {
  const [state, setState] = useState<DashboardState>({
    selectedSidebar: null,
    isLoading: false,
  });

  return (
    <div style={{ display: 'flex', height: '100vh' }}>
      <Sidebar
        selected={state.selectedSidebar}
        onSelect={(id) =>
          setState((s) => ({ ...s, selectedSidebar: id }))
        }
      />
      <MainContent selected={state.selectedSidebar} />
    </div>
  );
};
```

#### Step 3-4: Extract Sidebar

```typescript
// src/pages/Dashboard/Sidebar.tsx (120 lines)
import React from 'react';
import styled from 'styled-components';
import { theme } from '../../theme';
import { SidebarItem } from './types';

interface SidebarProps {
  selected: string | null;
  onSelect: (id: string) => void;
}

const items: SidebarItem[] = [
  { id: 'overview', label: 'Overview', icon: 'chart' },
  { id: 'users', label: 'Users', icon: 'users' },
  { id: 'settings', label: 'Settings', icon: 'cog' },
];

const StyledSidebar = styled.aside`
  width: 250px;
  background: ${theme.colors.gray900};
  color: white;
  padding: ${theme.spacing.lg};
  overflow-y: auto;
`;

const SidebarItemStyled = styled.button<{ $active: boolean }>`
  display: block;
  width: 100%;
  padding: ${theme.spacing.md};
  margin-bottom: ${theme.spacing.sm};
  background: ${(props) =>
    props.$active ? theme.colors.blue : 'transparent'};
  border: none;
  color: white;
  cursor: pointer;
  border-radius: ${theme.borderRadius.sm};

  &:hover {
    background: ${theme.colors.gray800};
  }
`;

export const Sidebar: React.FC<SidebarProps> = ({ selected, onSelect }) => (
  <StyledSidebar>
    {items.map((item) => (
      <SidebarItemStyled
        key={item.id}
        $active={selected === item.id}
        onClick={() => onSelect(item.id)}
      >
        {item.label}
      </SidebarItemStyled>
    ))}
  </StyledSidebar>
);
```

#### Step 5-6: Extract MainContent

```typescript
// src/pages/Dashboard/MainContent.tsx (250 lines)
import React from 'react';
import styled from 'styled-components';

interface MainContentProps {
  selected: string | null;
}

const StyledContent = styled.main`
  flex: 1;
  padding: 40px;
  overflow-y: auto;
`;

export const MainContent: React.FC<MainContentProps> = ({ selected }) => (
  <StyledContent>
    {selected === 'overview' && <Overview />}
    {selected === 'users' && <Users />}
    {selected === 'settings' && <Settings />}
    {!selected && <Welcome />}
  </StyledContent>
);

// Placeholder components
const Overview = () => <div>Overview Content</div>;
const Users = () => <div>Users Content</div>;
const Settings = () => <div>Settings Content</div>;
const Welcome = () => <div>Welcome to Dashboard</div>;
```

#### Step 7: Delete Old File

```bash
rm src/pages/Dashboard.tsx
```

Update import locations:
- Before: `import Dashboard from '../pages/Dashboard'`
- After: `import { Dashboard } from '../pages/Dashboard'`

---

### VERIFY Phase Summary

```markdown
# Decomposition Complete

## Before

- 1 monolithic file (520 lines)
- Hard to test individual sections
- Import/export tangle

## After

- 5 focused files (~520 lines total, but organized)
  - index.tsx: 60 lines (orchestration only)
  - Sidebar.tsx: 120 lines (sidebar logic)
  - MainContent.tsx: 250 lines (content logic)
  - types.ts: 30 lines (shared types)
  - utils.ts: 60 lines (utilities)

## Benefits

✅ Each file has single responsibility
✅ Easier to test individual components
✅ Easier to modify sidebar without touching content
✅ Types are centralized
✅ utils.ts available for future shared logic

## Verification Checklist

✅ Dashboard renders identically
✅ Sidebar switching works
✅ Content updates correctly
✅ TypeScript: no errors
✅ Build: successful
```

---

## Common Refactoring Patterns

### Pattern: Hook Extraction

```typescript
// Before: Logic duplicated in 3 components
const UserProfile = () => {
  const [user, setUser] = useState(null);
  useEffect(() => {
    fetchUser().then(setUser);
  }, []);
  return <div>{user?.name}</div>;
};

// After: Logic in reusable hook
const useUser = () => {
  const [user, setUser] = useState(null);
  useEffect(() => {
    fetchUser().then(setUser);
  }, []);
  return user;
};

const UserProfile = () => {
  const user = useUser();
  return <div>{user?.name}</div>;
};
```

### Pattern: Service Extraction

```typescript
// Before: Logic in components
const Dashboard = () => {
  const handleSubmit = async (data) => {
    const response = await api.post("/users", data);
    return response;
  };
};

// After: Logic in service
// services/UserService.ts
export const UserService = {
  create: (data) => api.post("/users", data),
  update: (id, data) => api.patch(`/users/${id}`, data),
};

// Component just calls service
const Dashboard = () => {
  const handleSubmit = (data) => UserService.create(data);
};
```

### Pattern: Constant Extraction

```typescript
// Before: Magic strings everywhere
const roles = ['admin', 'user', 'guest'];
const statuses = ['active', 'inactive', 'pending'];

// After: Constants file
// constants/roles.ts
export const ROLES = {
  ADMIN: 'admin',
  USER: 'user',
  GUEST: 'guest',
} as const;

// Use everywhere
if (userRole === ROLES.ADMIN) { ... }
```

---

## Common Mistakes to Avoid

### ❌ Mistake: Refactoring Without a Plan

```typescript
// DON'T: Start refactoring randomly
// "I'll consolidate buttons as I find them..."

// DO: Plan first
// 1. Scan for all button variants
// 2. Map where they're used
// 3. Create consolidated Button
// 4. Migrate methodically
// 5. Delete old files
```

### ❌ Mistake: Changing Too Much At Once

```typescript
// DON'T: Migrate all 10 files in one step
// "Update all ButtonPrimary → Button usage in one commit"

// DO: Incremental steps
// Step 1: Migrate Home.tsx, verify
// Step 2: Migrate Profile.tsx, verify
// Step 3: Migrate Settings.tsx, verify
// ...
```

### ❌ Mistake: Ignoring Imports

```typescript
// DON'T: Delete old file before verifying all imports updated
// → Runtime error: "Cannot find module './ButtonPrimary'"

// DO: Check all imports first
grep -r "ButtonPrimary" src/
// Migrate all occurrences
// THEN delete ButtonPrimary.tsx
```

### ❌ Mistake: Reading Entire Large Files

```typescript
// DON'T: Read entire 500-line Dashboard.tsx into context
// This wastes tokens and loses focus

// DO: Use grep to find specific sections
grep -n "Sidebar\|MainContent" Dashboard.tsx
// Read only those sections
sed -n '60,180p' Dashboard.tsx
```

---

## When to Stop and Ask for Help

- Circular import detected
- Step requires modifying >3 files
- TypeScript errors make pattern unclear
- Refactoring scope keeps expanding
- Code smell detection finds unexpected patterns

Always update `.refactor/task.md` with findings before asking for guidance.
