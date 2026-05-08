# Module Design

Each surface (POS, Manager, Staff, Admin) is a **vertical slice** — it owns its own components, hooks, data access, and types. Shared infrastructure lives in `src/shared/` and is consumed, never modified, by individual modules.

---

## Module Boundary Rule

```
┌─────────────────────────────────────────────────────┐
│  Module (e.g. POS)                                  │
│                                                     │
│  ┌─────────────┐   ┌──────────────┐   ┌─────────┐  │
│  │  Components │   │    Hooks     │   │  Types  │  │
│  │  (React)    │──▶│  (business   │──▶│  (local │  │
│  │             │   │   logic)     │   │   only) │  │
│  └─────────────┘   └──────┬───────┘   └─────────┘  │
│                           │                         │
│                    ┌──────▼──────┐                  │
│                    │  shared/*   │  ← allowed        │
│                    └─────────────┘                  │
│                                                     │
│  ✗ Cannot import from other modules directly        │
└─────────────────────────────────────────────────────┘
```

**Rules:**
- A module may import from `src/shared/` freely.
- A module must **never** import from another module's directory.
- Cross-module data flow goes through the function layer (server-side), never client-side imports.

---

## POS Module

**Responsibility:** Real-time order entry, payment, and receipt generation at the point of sale.

**Key state machines:**
- `ShiftSession` — tracks open/suspended/closed shift; all transactions require an active shift.
- `OrderLifecycle` — idle → building → confirming → paid / cancelled.
- `OfflineQueue` — orders queued while disconnected; replayed in order on reconnect.

**Fake data shape:**
```typescript
// src/example-pos/fakeMachines.ts
export type MachineState = 'idle' | 'shift_open' | 'order_building' | 'confirming' | 'suspended';

export type Register = {
  id: string;
  branchId: string;
  label: string;         // e.g. "レジ 1"
  currentShiftId: string | null;
};
```

---

## Manager Module

**Responsibility:** Branch-level oversight — daily close, exception approval, POS activity review.

**Key views:**
- `BranchDashboard` — today's transaction count, revenue, open exceptions.
- `ExceptionQueue` — geo-fence mismatches, punch corrections, discount overrides.
- `DailyClose` — end-of-day reconciliation flow; requires manager PIN confirmation.

**Separation note:** Manager module is **read-only** relative to POS data. It cannot mutate orders or shift sessions — only approve/reject exceptions and close the day.

**Fake data shape:**
```typescript
// src/example-manager/fakeMetrics.ts
export type BranchMetrics = {
  branchId: string;
  date: string;           // YYYY-MM-DD
  transactionCount: number;
  grossRevenue: number;
  voidCount: number;
  openExceptions: number;
};
```

---

## Staff Module

**Responsibility:** Employee self-service — attendance punch, schedule view, payroll summary.

**Key flows:**
- **Punch In** — GPS check → geofence validation → record with timestamp and coordinates hash.
- **Punch Out** — same validation; compute shift duration.
- **Exception** — if outside geofence, punch is flagged; employee provides reason; manager approves.

**Fake data shape:**
```typescript
// src/example-staff/fakeStaff.ts
export type StaffMember = {
  id: string;
  displayName: string;
  branchId: string;
  role: 'cashier' | 'senior_cashier' | 'branch_manager';
  activeShiftId: string | null;
};
```

---

## Admin Module

**Responsibility:** Super-admin operations — tenant provisioning, user management, global audit review.

**Not included in this showcase** (it is the most operationally sensitive surface). The patterns it uses are the same as the other modules plus an additional `super_admin` role gate at every function entry point.

---

## Composition Pattern

Each module exports a single top-level component and a single hook:

```typescript
// Canonical module export shape
export { PosApp } from './index';          // React entry point
export { usePosSession } from './usePosSession'; // Primary state hook
```

The host app (`App.tsx`) routes to each module by role:

```typescript
// Fake routing by role
if (role === 'cashier')        return <PosApp />;
if (role === 'branch_manager') return <ManagerDashboard />;
if (role === 'staff')          return <StaffPanel />;
```

This means the entire module tree for roles a user doesn't have is **never loaded** — no accidental cross-module data leakage via bundle imports.
