# Data Governance

This document covers audit logging, access control boundaries, and PII handling rules.

---

## Audit Log Design

The audit log is **append-only**. No entry is ever updated or deleted. It is the single authoritative record of who did what, when, and with what result.

### Entry Shape

```typescript
// src/shared/types/audit.ts
type AuditEntry = {
  id: string;                  // UUID, server-generated
  tenantId: string;
  actorId: string;             // uid of the user who performed the action
  actorRole: UserRole;         // role at time of action
  branchId: string | null;     // null for tenant-level actions
  action: AuditAction;         // see enum below
  resourceType: string;        // e.g. "order", "shift", "rma_case"
  resourceId: string;          // ID of the affected resource
  result: 'success' | 'failure';
  metadata: Record<string, string | number | boolean>; // no PII
  occurredAt: string;          // ISO 8601 UTC
};

type AuditAction =
  | 'SHIFT_OPENED'
  | 'SHIFT_CLOSED'
  | 'ORDER_CREATED'
  | 'ORDER_VOIDED'
  | 'PUNCH_IN'
  | 'PUNCH_OUT'
  | 'GEOFENCE_EXCEPTION'
  | 'EXCEPTION_APPROVED'
  | 'EXCEPTION_REJECTED'
  | 'RMA_CREATED'
  | 'RMA_STATUS_CHANGED'
  | 'SETTINGS_CHANGED'
  | 'USER_INVITED'
  | 'USER_ROLE_CHANGED'
  | 'TENANT_CREATED';
```

### What Goes in `metadata`

```typescript
// ✅ Allowed — non-PII facts
metadata: {
  orderLineCount: 3,
  paymentMethod: 'cash',
  voidReasonCode: 'customer_request',
  previousStatus: 'open',
  newStatus: 'closed',
  geofenceDistanceMeters: 142,  // distance from fence, not raw coordinates
  hasAttachments: true,
}

// ❌ Never allowed in audit metadata
metadata: {
  customerEmail: '...',    // PII — never
  customerPhone: '...',    // PII — never
  gpsLat: 35.68,           // raw coordinates — never
  gpsLng: 139.69,          // raw coordinates — never
  cardLast4: '4242',       // payment PII — never
}
```

---

## Access Control Matrix

| Resource | cashier | branch_manager | area_manager | super_admin |
|---|---|---|---|---|
| Own shift | Read/Write | Read | Read | Read |
| Other cashier shifts | — | Read | Read | Read |
| Branch orders | Own only | All | All | All |
| Exception queue | Submit | Approve/Reject | Approve/Reject | Approve/Reject |
| Daily close | — | Write | Write | Write |
| Branch config | — | Read | Read/Write | Read/Write |
| Staff profiles | Own | Branch | Area | All |
| Audit log | — | Branch | Area | All |
| Tenant config | — | — | — | Write |

---

## PII Boundaries

PII (personally identifiable information) is handled under strict isolation:

```
┌─────────────────────────────────────────────────────┐
│  PII Namespace (encrypted at rest, per-tenant)      │
│                                                     │
│  /tenants/{id}/staff/{staffId}/pii/                 │
│    email, phone, home_address                       │
│                                                     │
│  /tenants/{id}/customers/{customerId}/pii/          │
│    email, phone                                     │
│                                                     │
│  Access: only functions with explicit PII scope     │
│  Never: appears in audit logs, analytics, exports   │
└─────────────────────────────────────────────────────┘
```

**GPS data:** Raw coordinates are never stored. The system stores:
- `geofenceResult: 'inside' | 'outside'`
- `distanceFromBoundaryMeters: number` (rounded to nearest 10m)
- `branchId` (already known from session)

---

## Data Retention

| Data type | Retention | Deletion mechanism |
|---|---|---|
| Orders | 7 years (tax law) | Archival after 2 years; deletion after 7 |
| Audit log entries | 7 years | Never deleted; compacted after 2 years |
| Shift sessions | 3 years | Archival after 1 year |
| Attendance records | 3 years | Archival after 1 year |
| PII (staff) | Duration of employment + 1 year | Soft-delete then hard-delete |
| PII (customer) | Last transaction + 2 years | Hard-delete on request |
| Offline queue entries | 30 days after sync | Auto-purged by background job |

---

## Security Controls

1. **Function-layer enforcement** — no client can bypass access control by calling the data store directly.
2. **Row-level scoping** — data paths enforce tenant and branch scope; no cross-tenant index exists.
3. **Secret management** — no secrets in client bundles or repository; secrets are environment-injected at the function runtime.
4. **Token expiry** — auth tokens expire after 1 hour; refresh tokens after 30 days of inactivity.
5. **Admin 2FA** — any `super_admin` or `area_manager` action requires 2FA at login.
6. **Audit completeness** — every function that mutates data writes an audit entry; the absence of an audit entry for a mutation is a bug, not a feature.
