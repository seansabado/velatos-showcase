# Architecture Overview

This document describes the high-level architecture of a multi-module enterprise retail ERP. All details are generic and non-proprietary.

---

## System Map

```
┌─────────────────────────────────────────────────────────────────────┐
│                          CLIENT SURFACES                            │
│                                                                     │
│  ┌──────────────┐   ┌──────────────────┐   ┌──────────────────┐   │
│  │  POS Tablet  │   │  Manager Web App │   │  Staff Mobile    │   │
│  │  (React/TS)  │   │  (React/TS)      │   │  (React/TS PWA)  │   │
│  └──────┬───────┘   └────────┬─────────┘   └────────┬─────────┘   │
│         │                    │                       │             │
└─────────┼────────────────────┼───────────────────────┼─────────────┘
          │                    │                       │
          ▼                    ▼                       ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      API / FUNCTION LAYER                          │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │                  Callable Cloud Functions                    │  │
│  │                                                              │  │
│  │  requireAuth() → verifyTenantAccess() → handler() → audit() │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │                  Scheduled / Background Jobs                 │  │
│  │  • Daily shift close sweep                                   │  │
│  │  • Nightly audit log compaction                              │  │
│  │  • SLA breach detection                                      │  │
│  └──────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────────────┐
│                          DATA LAYER                                 │
│                                                                     │
│  ┌────────────────────┐   ┌────────────────────┐                  │
│  │   Document Store   │   │   Relational DB     │                  │
│  │   (per-tenant,     │   │   (aggregate        │                  │
│  │    real-time sync) │   │    reports, audit)  │                  │
│  └────────────────────┘   └────────────────────┘                  │
│                                                                     │
│  ┌────────────────────┐   ┌────────────────────┐                  │
│  │   Object Storage   │   │   Message Queue     │                  │
│  │   (receipts,       │   │   (async jobs,      │                  │
│  │    attachments)    │   │    outbox pattern)  │                  │
│  └────────────────────┘   └────────────────────┘                  │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Surface Responsibilities

### POS (Point of Sale) Tablet
- Operates in **offline-capable mode** — machine state is persisted locally and reconciled on reconnect.
- Cashier identity is pinned to a shift session; all transactions are scoped to `(tenant, branch, register, shift)`.
- No raw customer PII is stored on the device; only anonymized order references.

### Manager Operations Web
- Always-online surface for branch managers.
- Read-only aggregated views of POS activity; write access scoped to approvals and exception handling.
- Branch-level data only — cross-branch queries require elevated role.

### Staff Mobile (PWA)
- Progressive Web App for employees: attendance punch-in/out, schedule view, payroll summary.
- GPS geofence check at punch time; geofence exceptions flow to manager approval queue.
- Offline queue for punches taken without connectivity.

---

## Request Lifecycle

```
Client Action
     │
     ▼
Cloud Function Entry Point
     │
     ├─── 1. requireAuth()
     │         Verify Firebase Auth token; extract uid, email, claims
     │
     ├─── 2. verifyTenantAccess()
     │         Confirm caller's tenantId matches requested resource
     │         Verify role claim satisfies minimum required role
     │
     ├─── 3. validate()
     │         Schema validation on payload (Zod / custom)
     │
     ├─── 4. handler()
     │         Business logic — pure function, no direct DB writes
     │
     ├─── 5. persist()
     │         Transactional write to data store
     │
     └─── 6. audit()
               Append audit log entry: actor, action, resource, result
```

---

## Key Design Principles

1. **Tenant isolation is enforced at the function layer, not just the client.** Every server-side operation verifies `tenantId` from the auth token, never from the request payload.

2. **Offline capability is a first-class requirement.** POS and Staff Mobile can operate for extended periods without connectivity. Sync is eventual, conflict resolution is explicit.

3. **Audit trail is append-only.** No audit log entry is ever updated or deleted. Compaction produces read-optimized summaries but never removes source records.

4. **PII never leaves the data boundary.** Raw emails, phone numbers, and GPS coordinates are stored only in the per-tenant encrypted namespace. Audit logs and analytics store boolean flags or hashed identifiers only.

5. **Role hierarchy is explicit.** `cashier < branch_manager < area_manager < super_admin`. Each function declares its minimum required role; the tenant guard enforces it.
