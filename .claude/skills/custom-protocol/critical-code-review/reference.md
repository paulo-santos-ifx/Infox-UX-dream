# Code Smell Reference

This document catalogs common code smells and anti-patterns to identify during review.

## Classic Code Smells

### God File / God Component

**Problem:**
A single file does too much. Frontend component with 500+ lines, or backend service with many responsibilities.

**Detection:**
- Multiple imports from unrelated domains
- Multiple export statements
- File solves more than one problem

**Fix:**
Break into smaller, focused modules.

---

### Long Method / Large Function

**Problem:**
Function with 40+ lines becomes hard to understand, test, and maintain.

**Detection:**
- Function scrolls past one screen
- Deep nesting levels (3+ levels)
- Multiple return statements scattered throughout

**Threshold:** Functions over 30-40 lines should be questioned.

**Fix:**
Extract logic into smaller functions. Each function should have one reason to change.

---

### Primitive Obsession

**Problem:**
Using primitives (strings, numbers) instead of creating meaningful types.

**Frontend Example:**
```tsx
// BAD
const button = (color: string, size: string, variant: string) => {};

// GOOD
interface ButtonProps {
  color: ButtonColor;
  size: ButtonSize;
  variant: ButtonVariant;
}
const button = (props: ButtonProps) => {};
```

**Backend Example:**
```typescript
// BAD
type UserId = string;
function getUser(userId: UserId) {}

// GOOD
class UserId {
  constructor(private value: string) {}
  getValue() {
    return this.value;
  }
}
```

---

### Duplicate Code

**Problem:**
Same logic exists in multiple places. Creates maintenance nightmares.

**Detection Patterns:**
- Same `if` statement in 3+ files
- Identical loop logic repeated
- Same calculation in multiple functions

**Fix:**
- Extract to shared function
- Create base class or mixin
- Use inheritance or composition

---

### Shotgun Surgery

**Problem:**
A single logical change requires modifying many files.

**Example:**
Changing button styling requires updates in 8 different components.

**Root Cause:**
Insufficient abstraction. Styles are hardcoded instead of centralized.

**Fix:**
Create theme system, design tokens, or shared components.

---

### Long Parameter List

**Problem:**
Function with 5+ parameters is hard to use and understand.

```typescript
// BAD
function createUser(name, email, age, country, subscription, role, isAdmin, newsletter);

// GOOD
interface UserInput {
  name: string;
  email: string;
  age: number;
  country: string;
  subscription: "free" | "pro" | "enterprise";
  role: UserRole;
  isAdmin: boolean;
  newsletter: boolean;
}
function createUser(input: UserInput);
```

---

### Magic Numbers

**Problem:**
Unexplained constants scattered through code.

```typescript
// BAD
if (age > 18 && score > 75) {
}
const timeout = 5000;
const maxRetries = 3;

// GOOD
const LEGAL_AGE = 18;
const MIN_SCORE_FOR_APPROVAL = 75;
const API_TIMEOUT_MS = 5000;
const MAX_RETRY_ATTEMPTS = 3;
```

---

### Divergent Change

**Problem:**
A class changes for multiple unrelated reasons.

**Example:**
User service handles:
- Database queries
- Email notifications
- Password validation
- API rate limiting

**Fix:**
Apply Single Responsibility Principle. Create separate services.

---

### Inappropriate Intimacy

**Problem:**
Classes know too much about each other's internals.

**Frontend Example:**
```typescript
// BAD
const user = userComponent.state.user;
user.profile.settings.theme = "dark";

// GOOD
userComponent.updateTheme("dark");
```

**Fix:**
Use proper interfaces and encapsulation.

---

### Feature Envy

**Problem:**
A function uses more data from another object than its own.

```typescript
// BAD
function calculateTotal(order: Order) {
  return order.items.reduce(
    (sum, item) => sum + item.price * item.quantity * order.discountRate,
    0,
  );
}

// GOOD - Move logic to Order class
class Order {
  calculateTotal() {
    return this.items.reduce(
      (sum, item) => sum + item.price * item.quantity * this.discountRate,
      0,
    );
  }
}
```

---

### Data Clump

**Problem:**
Same data appears together in multiple places.

```typescript
// BAD
function displayUser(name: string, email: string, phone: string) {}
function createAccount(name: string, email: string, phone: string) {}
function sendInvite(name: string, email: string, phone: string) {}

// GOOD
interface ContactInfo {
  name: string;
  email: string;
  phone: string;
}
function displayUser(contact: ContactInfo) {}
function createAccount(contact: ContactInfo) {}
function sendInvite(contact: ContactInfo) {}
```

---

### Lazy Class

**Problem:**
A class that doesn't do much, or became unnecessary after refactoring.

**Frontend Example:**
```typescript
// BAD - wrapper with no value
const UserWrapper = () => <User {...props} />

// GOOD - remove the wrapper
export User
```

---

## Architectural Smells

### Tight Coupling

**Problem:**
Components/modules depend directly on implementations instead of abstractions.

**Frontend Example:**
```typescript
// BAD
import { UserService } from "./services/UserService";
export const UserList = () => {
  const users = new UserService().getUsers();
};

// GOOD
interface IUserService {
  getUsers(): Promise<User[]>;
}
export const UserList = ({ userService }: { userService: IUserService }) => {
  const users = userService.getUsers();
};
```

---

### Circular Dependencies

**Problem:**
Module A imports Module B which imports Module A.

**Detection:**
```bash
# Frontend
import Button from './Button' // Button imports this
import Form from './Form'     // Form imports Button

# Backend
from user_service import get_user  # user_service imports auth
from auth_service import verify    # auth imports user_service
```

**Fix:**
Extract shared logic to a third module.

---

### Missing Abstraction

**Problem:**
Direct coupling to concrete implementations when abstraction would help.

```typescript
// BAD
const apiKey = process.env.API_KEY
axios.get(`https://api.example.com/users`, { headers: { 'X-API-Key': apiKey }})

// GOOD
interface APIClient {
  request(url: string, options: RequestOptions): Promise<unknown>
}

class ProductionAPIClient implements APIClient {
  constructor(private apiKey: string) {}
  request(url: string, options) { ... }
}
```

---

### Breaking Encapsulation

**Problem:**
Code accesses internals of other modules instead of using public APIs.

```typescript
// BAD
const privateData = component["_internalState"];

// GOOD
const publicData = component.getPublicState();
```

---

## Performance Smells

### N+1 Query Pattern

**Backend Problem:**
```typescript
// BAD
const users = await User.find();
for (const user of users) {
  user.profile = await Profile.find({ userId: user.id }); // 1 + N queries
}

// GOOD
const users = await User.find();
const profiles = await Profile.find({ userId: { $in: users.map((u) => u.id) } });
// 2 queries total
```

---

### Inefficient Loops

**Problem:**
```typescript
// BAD
for (let i = 0; i < items.length; i++) {
  items[i] = items[i].toUpperCase(); // creates new array each iteration
}

// GOOD
items = items.map((item) => item.toUpperCase());
```

---

### Unnecessary Re-renders (Frontend)

**Problem:**
```tsx
// BAD
const ParentComponent = () => {
  const handleClick = () => {}; // new function on every render
  return <Child onClick={handleClick} />;
};

// GOOD
const ParentComponent = () => {
  const handleClick = useCallback(() => {}, []);
  return <Child onClick={handleClick} />;
};
```

---

## Classification by SOLID Violations

### Single Responsibility Principle (SRP)

**Violation:**
```typescript
class User {
  saveToDatabase() {}
  sendEmailNotification() {}
  generatePDF() {}
  calculateTax() {}
}
```

**Fix:**
Split into UserRepository, NotificationService, ReportGenerator, TaxCalculator.

---

### Open/Closed Principle (OCP)

**Violation:**
```typescript
function applyDiscount(user: User) {
  if (user.type === "gold") return 0.2;
  if (user.type === "silver") return 0.1;
  if (user.type === "bronze") return 0.05;
  // Adding new type requires modifying this function
}
```

**Fix:**
```typescript
interface DiscountStrategy {
  calculate(): number;
}
class GoldDiscount implements DiscountStrategy {}
```

---

### Liskov Substitution Principle (LSP)

**Violation:**
```typescript
class Bird {
  fly() {}
}
class Penguin extends Bird {
  fly() {
    throw new Error("Penguins cannot fly");
  }
}
```

**Fix:**
```typescript
interface Flyer {
  fly();
}
interface Swimmer {
  swim();
}
class Penguin implements Swimmer {}
```

---

### Interface Segregation Principle (ISP)

**Violation:**
```typescript
interface UserService {
  getUser(): User;
  deleteUser(): void;
  createReport(): PDF;
  sendNotification(): void;
  // Client may only need getUser()
}
```

**Fix:**
```typescript
interface UserReader {
  getUser(): User;
}
interface UserDeleter {
  deleteUser(): void;
}
interface ReportGenerator {
  createReport(): PDF;
}
```

---

### Dependency Inversion Principle (DIP)

**Violation:**
```typescript
class PaymentProcessor {
  constructor() {
    this.gateway = new StripePaymentGateway();
  }
}
```

**Fix:**
```typescript
class PaymentProcessor {
  constructor(private gateway: PaymentGateway) {}
}
```

---

## Summary

When reviewing, ask:

| Smell               | Question                           |
| ------------------- | ---------------------------------- |
| Long function       | Should this be split?              |
| Primitive obsession | Should this be a type?             |
| Duplicate code      | Is this logic reusable?            |
| Tight coupling      | Can this be abstracted?            |
| N+1 queries         | Can I fetch data more efficiently? |
| Large props list    | Should these be grouped?           |
| Circular dependency | Which module should own this?      |
| God file            | Should this be multiple files?     |
