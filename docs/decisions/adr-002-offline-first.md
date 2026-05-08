# ADR-002: Offline-First Architecture for POS and Staff Mobile

**Status:** Accepted  
**Date:** 2026-04-01  
**Author:** Sean Raynon

---

## Context

Boutique retail stores in Japan often operate with consumer-grade internet connections. Network interruptions during trading hours are a real operational risk. A POS that fails when offline means lost sales — an unacceptable outcome.

The question is how aggressively to invest in offline capability at the architecture level.

---

## Decision

**POS Tablet and Staff Mobile are designed offline-first. All mutations are written to a local queue immediately and synced to the server when connectivity is restored.**

Key design choices:
- The device's local state is the primary source of truth during a session. The server is the authoritative source after sync.
- Mutations are queued in strict insertion order and replayed in order. Out-of-order replay would corrupt shift totals and attendance records.
- The UI reflects optimistic local state; a sync indicator shows pending items.
- A shift cannot be closed while the offline queue is non-empty. This prevents the server from seeing a closed shift before all its transactions arrive.
- GPS punch data is validated against the geofence on the device (proximity check); the server re-validates on sync.

---

## Consequences

**Positive:**
- Sales and attendance punches are never lost due to network failure.
- User experience is unaffected during brief outages.
- The device can operate for an entire shift without connectivity if needed.

**Negative:**
- Conflict resolution logic is required for edge cases (e.g., manager closes the shift server-side while the device has queued orders offline). See `docs/offline-mode.md` for the resolution strategy.
- Testing offline behavior requires simulating network conditions — more complex than online-only testing.
- The offline queue must be persisted to device storage to survive app restarts. This adds complexity to the storage layer.

---

## Alternatives Considered

**Online-only with graceful degradation (rejected):** Show an error and retry. Simpler to implement, but unacceptable for POS — a cashier mid-transaction should not have to wait for connectivity.

**Optimistic UI without queue (rejected):** Update the UI immediately but don't persist locally. This looks responsive but can silently lose data if the app is closed or crashes before connectivity is restored.

**Conflict-free replicated data types (CRDTs) (deferred):** CRDTs would eliminate most conflicts at the data structure level. However, the operational complexity of a CRDT-based store is significant, and the conflict rate in practice is very low (one device per register, one punch per staff per session). Revisit if multi-device per register is required.
