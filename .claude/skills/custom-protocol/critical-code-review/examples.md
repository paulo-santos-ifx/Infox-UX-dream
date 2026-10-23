# Code Review Examples

This document contains complete review examples showing how to apply the critical-code-review skill.

---

## Example 1: Button Component Refactor (Frontend)

### Original Context

**Objective:** Consolidate 3 button implementations into a reusable Button component.

**Files Modified:**
- `components/Button/Button.tsx` (NEW)
- `components/UserPage.tsx`
- `components/Dashboard.tsx`
- `components/Modal.tsx`

### The Code Being Reviewed

```tsx
// components/Button/Button.tsx
import React from "react";

export const Button = ({
  children,
  onClick,
  color = "blue",
  size = "md",
  fullWidth = false,
  disabled = false,
  loading = false,
  variant = "solid",
  className = "",
}) => {
  const getColorClass = () => {
    switch (color) {
      case "blue":
        return "bg-blue-500 hover:bg-blue-600 text-white";
      case "red":
        return "bg-red-500 hover:bg-red-600 text-white";
      case "green":
        return "bg-green-500 hover:bg-green-600 text-white";
      case "gray":
        return "bg-gray-300 hover:bg-gray-400 text-black";
      default:
        return "bg-blue-500 hover:bg-blue-600 text-white";
    }
  };

  const getSizeClass = () => {
    if (size === "sm") return "px-2 py-1 text-sm";
    if (size === "md") return "px-4 py-2 text-base";
    if (size === "lg") return "px-6 py-3 text-lg";
    return "px-4 py-2 text-base";
  };

  const getVariantClass = () => {
    if (variant === "solid") return getColorClass();
    if (variant === "outline") return `border-2 border-${color}-500 text-${color}-500`;
    if (variant === "ghost") return `text-${color}-500 hover:bg-${color}-100`;
    return getColorClass();
  };

  const baseClass = "font-semibold rounded transition-colors cursor-pointer";
  const fullWidthClass = fullWidth ? "w-full" : "";
  const disabledClass = disabled ? "opacity-50 cursor-not-allowed" : "";
  const loadingClass = loading ? "opacity-75" : "";

  const finalClass = `${baseClass} ${getSizeClass()} ${getVariantClass()} ${fullWidthClass} ${disabledClass} ${loadingClass} ${className}`;

  return (
    <button onClick={onClick} disabled={disabled || loading} className={finalClass}>
      {loading ? "Loading..." : children}
    </button>
  );
};
```

### The Review

````markdown
# Code Review: Button Component Refactor

## Context

**Objective:** Consolidate duplicated button implementations across UserPage, Dashboard, Modal.

**Assessment:** ✔ Good consolidation of duplicated code. ⚠ Implementation has maintainability issues.

---

## Architecture Review

✔ Centralizes button styling — reduces duplication across components
✔ Single source of truth for button behavior — easier to update

⚠ Tailwind class composition fragile — dynamic class names fail at build time
⚠ No design system abstraction — colors hardcoded, not theme-aware
⚠ Variant system inflexible — adding new variant requires component modification

---

## Code Quality Review

### HIGH Priority Issue: Dynamic Tailwind Classes

```tsx
// PROBLEM
`border-2 border-${color}-500 text-${color}-500`
// Tailwind purge doesn't detect dynamic classes
// This will NOT work in production builds
```
````

**Why it fails:**
Tailwind uses static analysis. Dynamic class names like `border-${variable}-500` aren't recognized and get purged from the CSS bundle.

**Suggestion:**
Create a static class mapping:

```tsx
const VARIANT_CLASSES = {
  solid: {
    blue: "bg-blue-500 hover:bg-blue-600 text-white",
    red: "bg-red-500 hover:bg-red-600 text-white",
    // ...
  },
  outline: {
    blue: "border-2 border-blue-500 text-blue-500",
    red: "border-2 border-red-500 text-red-500",
    // ...
  },
};
```

This is explicit and Tailwind-safe.

### HIGH Priority Issue: String Interpolation for Classes

```tsx
// PROBLEM
const finalClass = `${baseClass} ${getSizeClass()} ...`;
// Hard to read, hard to debug
```

**Suggestion:**
Use a utility like `clsx`:

```tsx
import clsx from "clsx";

const finalClass = clsx(
  "font-semibold rounded transition-colors cursor-pointer",
  getSizeClass(),
  getVariantClass(),
  { "w-full": fullWidth },
  { "opacity-50 cursor-not-allowed": disabled },
  { "opacity-75": loading },
  className,
);
```

More readable and maintainable.

### MEDIUM Priority Issue: Weak TypeScript

```tsx
// PROBLEM
color = 'blue',
size = 'md',
variant = 'solid',
// String unions should be typed
```

**Current behavior:**
```tsx
<Button color="xyz" />; // TypeScript doesn't catch this
```

**Suggestion:**

```tsx
type ButtonColor = 'blue' | 'red' | 'green' | 'gray'
type ButtonSize = 'sm' | 'md' | 'lg'
type ButtonVariant = 'solid' | 'outline' | 'ghost'

interface ButtonProps {
  children: React.ReactNode
  onClick?: () => void
  color?: ButtonColor
  size?: ButtonSize
  variant?: ButtonVariant
  fullWidth?: boolean
  disabled?: boolean
  loading?: boolean
  className?: string
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ children, onClick, ... }, ref) => {
    // ...
  }
)
```

### MEDIUM Priority Issue: Magic Strings

```tsx
// PROBLEM
if (loading ? 'Loading...' : children
// Hardcoded loading text — not i18n friendly
// Not customizable
```

**Suggestion:**
Add `loadingText` prop or use a slot:

```tsx
interface ButtonProps {
  // ...
  loadingText?: React.ReactNode;
}

{
  loading ? loadingText || "Loading..." : children;
}
```

---

## Maintainability Review

### API Clarity: ✔ Good

The component API is intuitive. Props are self-explanatory.

✅ `<Button color="blue" />` is clear
✅ `<Button size="lg" />` is clear
✅ `<Button variant="outline" />` is clear

### Scalability: ⚠ Problem

**Current limitation:**
Adding a new color requires modifying this component. Every color combination must be hardcoded.

**Future problem:**
When a designer asks for "brand-primary" instead of "blue", the entire component needs refactoring.

**Suggestion: Theme Abstraction**

Create a theme system:

```tsx
// theme.ts
export const buttonTheme = {
  colors: {
    primary: 'bg-blue-500 hover:bg-blue-600 text-white',
    danger: 'bg-red-500 hover:bg-red-600 text-white',
    success: 'bg-green-500 hover:bg-green-600 text-white',
  },
  sizes: {
    sm: 'px-2 py-1 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  },
}

// Button.tsx
type ButtonColor = keyof typeof buttonTheme.colors

export const Button = ({ color = 'primary', ... }: ButtonProps) => {
  const colorClasses = buttonTheme.colors[color]
  // ...
}
```

Now:
- Colors live in one place
- Easy to add new colors
- Easy to rebrand
- Design system becomes explicit

---

## Risk Analysis

### Risk 1: Missing ref Forwarding

**Problem:**
Component doesn't forward ref. Parent components can't interact directly with the button element.

```tsx
// This won't work
const buttonRef = useRef()
<Button ref={buttonRef} />
// buttonRef.current is null
```

**Severity:** MEDIUM

**Fix:**
```tsx
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ ... }, ref) => (
    <button ref={ref} {...} />
  )
)
```

### Risk 2: onclick Not Prevented When Disabled

**Problem:**
```tsx
onClick={onClick}
disabled={disabled || loading}
```

The `disabled` attribute prevents default click behavior, but `onClick` still fires in some edge cases. Better to guard it:

```tsx
const handleClick = (e: React.MouseEvent) => {
  if (disabled || loading) return;
  onClick?.();
};
```

**Severity:** LOW

---

## Performance Check

### ✔ No Issues Detected

- No inline functions that would recreate on every render
- No heavy imports
- Props are memoized appropriately
- Component is simple and will re-render efficiently

---

## Improvement Suggestions

**Priority 1 (Do This First):**
1. Fix dynamic Tailwind classes → use static mapping
2. Add strong TypeScript types
3. Forward ref support

**Priority 2 (Do This Soon):**
4. Extract colors/sizes to theme system
5. Add loadingText customization
6. Use clsx for class composition

**Priority 3 (Nice to Have):**
7. Add aria-labels
8. Support disabled state without opacity fade
9. Document usage patterns

---

## Summary

**Verdict:** ✔ Good consolidation, but implementation needs hardening.

**Key takeaway:** The component solves duplication (good), but creates new brittleness with dynamic Tailwind classes and lacks a theme abstraction for future scaling.

**Recommendation:** Address Priority 1 items before merge. Priority 2 items should be in next sprint.
````

---

## Example 2: User Repository Refactor (Backend)

### Original Context

**Objective:** Separate user persistence logic from domain logic. Reduce God Service.

**Files Modified:**
- `services/UserService.ts` (split into 3 files)
- `repositories/UserRepository.ts` (NEW)
- `entities/User.ts` (NEW)
- Existing routes updated

### The Code Being Reviewed

```typescript
// repositories/UserRepository.ts
import { PrismaClient } from '@prisma/client'
import { User } from '../entities/User'

export class UserRepository {
  constructor(private prisma: PrismaClient) {}

  async findById(id: string): Promise<User | null> {
    const result = await this.prisma.user.findUnique({ where: { id } })
    return result ? new User(result) : null
  }

  async findByEmail(email: string): Promise<User | null> {
    const result = await this.prisma.user.findUnique({ where: { email } })
    return result ? new User(result) : null
  }

  async findAll(): Promise<User[]> {
    const results = await this.prisma.user.findMany()
    return results.map(r => new User(r))
  }

  async create(userData: any): Promise<User> {
    const result = await this.prisma.user.create({ data: userData })
    return new User(result)
  }

  async update(id: string, updates: any): Promise<User> {
    const result = await this.prisma.user.update({
      where: { id },
      data: updates,
    })
    return new User(result)
  }

  async delete(id: string): Promise<boolean> {
    await this.prisma.user.delete({ where: { id } })
    return true
  }
}
````

### The Review

````markdown
# Code Review: User Repository Refactor

## Context

**Objective:** Extract data persistence from UserService into UserRepository.

**Assessment:** ✔ Good separation of concerns. ⚠ TypeScript usage weak. ⚠ Inconsistent error handling.

---

## Architecture Review

✔ Separates persistence layer from business logic
✔ Repository pattern enables testing with mocks
✔ Reduces coupling to Prisma

⚠ No error mapping — raw database errors leak to caller
⚠ No transaction support — multi-operation changes are unsafe
⚠ No query builder abstraction — complex queries still coupled to Prisma

---

## Code Quality Review

### HIGH Priority: Weak TypeScript

```typescript
// PROBLEM
async create(userData: any): Promise<User> {
async update(id: string, updates: any): Promise<User> {
// 'any' defeats type safety
// Caller can pass anything
```
````

**Suggestion:**

```typescript
interface CreateUserInput {
  email: string
  name: string
  passwordHash: string
}

interface UpdateUserInput {
  email?: string
  name?: string
  // only updatable fields
}

async create(userData: CreateUserInput): Promise<User> {
  const result = await this.prisma.user.create({ data: userData })
  return new User(result)
}

async update(id: string, updates: Partial<UpdateUserInput>): Promise<User> {
  const result = await this.prisma.user.update({
    where: { id },
    data: updates,
  })
  return new User(result)
}
```

### HIGH Priority: No Error Handling

```typescript
// PROBLEM
async findById(id: string): Promise<User | null> {
  const result = await this.prisma.user.findUnique({ where: { id } })
  // If database fails, raw error propagates
  // Caller doesn't know what went wrong
  return result ? new User(result) : null
}
```

**What happens:**
```
PrismaClientKnownRequestError: Unique constraint failed
Leaks database internals to caller.
```

**Suggestion:**

```typescript
export class RepositoryError extends Error {
  constructor(operation: string, originalError: Error) {
    super(`Repository error during ${operation}: ${originalError.message}`)
    this.name = 'RepositoryError'
  }
}

async findById(id: string): Promise<User | null> {
  try {
    const result = await this.prisma.user.findUnique({ where: { id } })
    return result ? new User(result) : null
  } catch (error) {
    throw new RepositoryError('findById', error as Error)
  }
}
```

### MEDIUM Priority: `findAll` Without Pagination

```typescript
// PROBLEM
async findAll(): Promise<User[]> {
  const results = await this.prisma.user.findMany()
  // If 1 million users exist, this loads all into memory
}
```

**Suggestion:**

```typescript
interface PaginationParams {
  skip: number
  take: number
}

async findAll(pagination?: PaginationParams): Promise<{ users: User[]; total: number }> {
  const [results, total] = await Promise.all([
    this.prisma.user.findMany({
      skip: pagination?.skip || 0,
      take: pagination?.take || 50,
    }),
    this.prisma.user.count(),
  ])
  
  return {
    users: results.map(r => new User(r)),
    total,
  }
}
```

### MEDIUM Priority: Missing Timestamps

```typescript
// PROBLEM
No createdAt, updatedAt tracking
Can't audit when user records change
```

**Suggestion:**

```typescript
async create(userData: CreateUserInput): Promise<User> {
  const result = await this.prisma.user.create({
    data: {
      ...userData,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  })
  return new User(result)
}

async update(id: string, updates: Partial<UpdateUserInput>): Promise<User> {
  const result = await this.prisma.user.update({
    where: { id },
    data: {
      ...updates,
      updatedAt: new Date(),
    },
  })
  return new User(result)
}
```

Or better — let Prisma handle this with `@updatedAt` in schema.

---

## Maintainability Review

### API Clarity: ✔ Good

Methods are self-documenting:
- `findById()` is clear
- `create()` is clear
- `delete()` is clear

### Scalability: ⚠ Warning

**Current limitation:**
Repository only handles simple queries. Complex queries (e.g., "find users created today with 3+ projects") require going back to the service layer.

**Suggestion:**

```typescript
// Add query methods as needed
async findActiveUsers(): Promise<User[]> {
  return this.prisma.user.findMany({
    where: { isActive: true },
  })
}

async findCreatedAfter(date: Date): Promise<User[]> {
  return this.prisma.user.findMany({
    where: { createdAt: { gte: date } },
  })
}
```

Or use a Query Builder pattern if queries get complex.

---

## Risk Analysis

### Risk 1: delete() Returns Boolean

```typescript
async delete(id: string): Promise<boolean> {
  await this.prisma.user.delete({ where: { id } })
  return true
}
```

**Problem:**
- If delete fails, exception thrown before `return true`
- Return value is always true if no exception
- Redundant information

**Severity:** LOW

**Fix:**
```typescript
async delete(id: string): Promise<void> {
  await this.prisma.user.delete({ where: { id } })
  // Exception if fails, no return needed
}
```

### Risk 2: No Soft Delete Support

```typescript
// PROBLEM
delete(id) actually removes the record
If business logic needs to restore deleted users later, data is gone
```

**Severity:** MEDIUM (depends on requirements)

**Fix:**
```typescript
async delete(id: string): Promise<void> {
  await this.prisma.user.update({
    where: { id },
    data: { deletedAt: new Date() },
  })
}

// Query methods respect soft delete
async findById(id: string): Promise<User | null> {
  const result = await this.prisma.user.findUnique({
    where: { id },
  })
  
  if (!result || result.deletedAt) return null
  return new User(result)
}
```

---

## Performance Check

### ✔ N+1 Not Present

`findById` and `findByEmail` correctly use `findUnique` (single query).

### ⚠ Missing Indexes Hint

```typescript
async findByEmail(email: string): Promise<User | null> {
  // Assumes email is indexed in database
  // If not, this scales poorly
}
```

**Suggestion:**
Add comment:

```typescript
/**
 * @requires User.email must be indexed in the database schema
 */
async findByEmail(email: string): Promise<User | null> {
  // ...
}
```

---

## Improvement Suggestions

1. **HIGH:** Add strong TypeScript types for create/update
2. **HIGH:** Wrap database errors in RepositoryError
3. **HIGH:** Add pagination to findAll()
4. **MEDIUM:** Support soft deletes
5. **MEDIUM:** Add query methods for complex searches
6. **MEDIUM:** Track timestamps (createdAt, updatedAt)
7. **LOW:** Consider query builder for complex scenarios

---

## Summary

**Verdict:** ✔ Good foundational pattern, needs strengthening.

**Key takeaway:** Repository correctly separates persistence, but needs better error handling and stronger typing.

**Next steps:** Address HIGH priority items. Consider implementing a Query Builder if complex queries become common.
```

---

## Common Review Patterns

### Pattern: The Defensive Reviewer

When you see code and your first instinct is to defend it:

```
❌ "This is fine because I've seen it elsewhere."
✅ "Component X has the same issue. Let's fix both."
```

### Pattern: The Scalability Question

Always ask the 3-year test:

```
"If this code lives in production for 3 years unchanged,
will someone be frustrated modifying it?"
```

### Pattern: The Severity Call

```
🔴 CRITICAL — breaks functionality
🟠 HIGH — impacts maintainability or performance
🟡 MEDIUM — improves quality
🟢 LOW — nice to have
```

Choose severity based on: "How much pain does this cause in production?"

### Pattern: Actionable Feedback

```
❌ "This is confusing"
✅ "Function is 35 lines. Suggest extracting tax calculation
and discount logic into separate functions. This improves
testability and reusability."
```

---

## When to Approve Despite Issues

You can approve with `LOW`/`MEDIUM` issues if:

1. ✅ All `CRITICAL`/`HIGH` issues are addressed
2. ✅ Issues are documented
3. ✅ Timeline for fixing is agreed

Never approve with `CRITICAL` issues.
```
