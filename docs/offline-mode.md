# Offline-First ERP Patterns

Retail operations cannot afford to stop when the network does. POS terminals and staff mobile devices are designed to operate fully offline and reconcile seamlessly when connectivity is restored.

---

## The Problem

A typical cloud-first app fails entirely when offline:

```
User Action → API Call → ❌ Network Error → User sees error → Nothing saved
```

For a boutique POS this is unacceptable. A network blip during a transaction must not lose a sale.

---

## Offline Architecture

```
┌─────────────────────────────────────────────────┐
│  Device (POS Tablet / Staff Mobile PWA)         │
│                                                 │
│  ┌──────────────────────────────────────────┐   │
│  │  React UI  ──▶  useMachineState hook     │   │
│  │                   │                      │   │
│  │                   ▼                      │   │
│  │              Local State Store           │   │
│  │              (IndexedDB / localStorage)  │   │
│  │                   │                      │   │
│  │                   ▼                      │   │
│  │              Offline Queue               │   │
│  │              (ordered mutations)         │   │
│  └──────────────────┬───────────────────────┘   │
│                     │                           │
│            Online?  │                           │
│                ┌────┴────┐                      │
│              Yes         No                     │
│                │         │                      │
│                ▼         ▼                      │
│          Sync flush    Hold in queue             │
│          (in order)    (retry on reconnect)     │
└─────────────────────────────────────────────────┘
```

---

## Machine State for Shift Sessions

The shift session is the root state machine. Every transaction is scoped to an active shift. The state machine prevents invalid transitions:

```
              ┌──────────────────────────────────────┐
              │           SHIFT STATE MACHINE        │
              │                                      │
              │   ┌─────────┐  openShift   ┌──────┐ │
              │   │  CLOSED │─────────────▶│ OPEN │ │
              │   └─────────┘              └──┬───┘ │
              │        ▲                      │     │
              │        │ closeShift    suspend│     │
              │        │               ┌─────▼───┐  │
              │        └───────────────│SUSPENDED│  │
              │              resume    └─────────┘  │
              │                          │          │
              │                     resume│          │
              │                    ┌─────▼───┐      │
              │                    │  OPEN   │      │
              │                    └─────────┘      │
              └──────────────────────────────────────┘
```

**Transition rules (enforced locally, verified server-side on sync):**
- `CLOSED → OPEN`: requires cashier auth + register assignment
- `OPEN → SUSPENDED`: always allowed (e.g., break, network loss)
- `SUSPENDED → OPEN`: requires re-auth PIN
- `OPEN → CLOSED`: requires daily close confirmation; blocked if offline queue is non-empty

---

## Offline Queue Pattern

```typescript
// Conceptual structure — not real code
type QueuedMutation = {
  id: string;           // local UUID, becomes server ID on sync
  type: 'CREATE_ORDER' | 'VOID_ORDER' | 'PUNCH_IN' | 'PUNCH_OUT';
  payload: unknown;
  createdAt: string;    // ISO timestamp (device clock)
  attempts: number;
  lastAttempt: string | null;
};

// Queue is flushed in strict insertion order
// Out-of-order flush would corrupt shift totals and attendance records
async function flushQueue(queue: QueuedMutation[]): Promise<void> {
  for (const mutation of queue) {
    await syncMutation(mutation);   // retries with exponential backoff
    await removeFromQueue(mutation.id);
  }
}
```

**Key constraints:**
1. Queue is always flushed in **insertion order** — not parallelized — because later mutations may depend on earlier ones (e.g., order void requires the order to exist server-side first).
2. A mutation that permanently fails (4xx) is moved to an **error queue** with full payload for manual review, never silently dropped.
3. The UI reflects pending mutations optimistically; server-confirmed state is the source of truth after sync.

---

## Conflict Resolution

When a device reconnects after an extended offline period, conflicts can occur (e.g., the server closed a shift while the device added orders to it).

**Strategy:** Server wins on structural state (shift open/closed). Device wins on transactions created while offline — they are accepted and the shift is retroactively extended if needed, with an audit flag marking the discrepancy for manager review.

```
Device queued 3 orders during offline period.
Server has shift already closed by manager.

Resolution:
  1. Accept the 3 orders (revenue cannot be discarded).
  2. Reopen shift server-side with audit flag: "RETROACTIVE_EXTENSION".
  3. Queue exception for manager approval.
  4. Close shift after orders are posted.
```

---

## Online Status Hook

```typescript
// src/shared/hooks/useOnlineStatus.ts
// Tracks navigator.onLine + ping-based verification
// navigator.onLine can be true even when the API is unreachable

function useOnlineStatus(): { online: boolean; latencyMs: number | null } {
  // Polls a lightweight /health endpoint every 30s
  // Returns false if ping fails, even if navigator.onLine is true
}
```

The POS and Staff surfaces use this hook to:
- Show an offline indicator in the header
- Disable sync-dependent features (manager approval requests)
- Enable the offline queue for mutations that can be deferred
