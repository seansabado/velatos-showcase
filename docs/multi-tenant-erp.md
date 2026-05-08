# Multi-Tenant ERP Patterns

The platform serves multiple independent tenants (retail brands / companies) from a shared infrastructure. Tenant isolation is the most critical security property of the system.

---

## Isolation Model

```
┌─────────────────────────────────────────────────────────────┐
│  Shared Infrastructure                                      │
│  (compute, function runtime, auth provider)                 │
│                                                             │
│  ┌────────────────────┐   ┌────────────────────┐           │
│  │  Tenant: acme_co   │   │  Tenant: bloom_jp  │           │
│  │                    │   │                    │           │
│  │  /tenants/acme_co/ │   │  /tenants/bloom_jp/│           │
│  │    orders/         │   │    orders/         │           │
│  │    staff/          │   │    staff/          │           │
│  │    shifts/         │   │    shifts/         │           │
│  │    audit_log/      │   │    audit_log/      │           │
│  └────────────────────┘   └────────────────────┘           │
│                                                             │
│  ✗ No cross-tenant query is ever possible                   │
│  ✗ No shared collections that mix tenant data               │
└─────────────────────────────────────────────────────────────┘
```

---

## Tenant Identity in Auth Tokens

Every authenticated user carries a `tenantId` claim in their auth token. This claim is set at account creation and cannot be changed by the user.

```typescript
// Fake token claims shape
type AuthClaims = {
  uid: string;
  tenantId: string;    // e.g. "acme_co"
  role: UserRole;      // e.g. "cashier" | "branch_manager" | "super_admin"
  branchId: string;    // e.g. "branch_shibuya"
};
```

The `tenantId` from the token is **always** used to build data paths. The `tenantId` from the request payload is **ignored**. This prevents a malicious actor from accessing another tenant's data by spoofing the payload.

---

## Data Path Convention

All data is stored under a per-tenant root:

```
/tenants/{tenantId}/                     ← tenant root
  config/                                ← tenant settings
  branches/{branchId}/                   ← branch documents
  staff/{staffId}/                       ← staff profiles
  shifts/{shiftId}/                      ← shift sessions
  orders/{orderId}/                      ← POS transactions
  audit_log/{entryId}/                   ← append-only audit
  rma/{rmaId}/                           ← return/repair cases
```

**No document ever lives outside its tenant path.** Indexes and aggregates are also scoped per tenant.

---

## Fake Tenant Config Shape

```typescript
// Illustrative — not real schema
type TenantConfig = {
  tenantId: string;
  displayName: string;         // "Acme Boutique Co., Ltd."
  locale: 'ja' | 'en';
  timezone: string;            // "Asia/Tokyo"
  currency: 'JPY' | 'USD';
  features: {
    rmaEnabled: boolean;
    webAuthnEnabled: boolean;
    offlineMode: boolean;
    analyticsExport: boolean;
  };
  branches: BranchRef[];
};

type BranchRef = {
  id: string;
  label: string;               // "渋谷店"
  geofenceRadiusMeters: number;
};
```

---

## Tenant Guard at the Function Layer

Every callable function that touches tenant data runs the tenant guard before any business logic:

```typescript
// Conceptual pattern — see src/example-functions/tenantGuard.ts for fake implementation

async function verifyTenantAccess(
  claims: AuthClaims,
  requestedTenantId: string,
  minimumRole: UserRole
): Promise<void> {
  // 1. Token tenantId must match requested tenantId
  if (claims.tenantId !== requestedTenantId) {
    throw new UnauthorizedError('Tenant mismatch');
  }

  // 2. Role must meet minimum threshold
  if (!roleAtLeast(claims.role, minimumRole)) {
    throw new ForbiddenError(`Requires role: ${minimumRole}`);
  }
}
```

---

## Super-Admin Isolation

Super-admins operate on a separate admin SDK path with an additional authentication step (PIN + 2FA). They can query across tenants for billing and support purposes, but:
- Every cross-tenant read is logged with the admin's identity.
- Cross-tenant writes are blocked except for explicit provisioning operations.
- Super-admin sessions expire after 30 minutes of inactivity.

---

## Tenant Provisioning Flow

```
1. Super-admin triggers "Create Tenant" 
2. Cloud Function: createTenant()
   a. Validate plan limits (max branches, max staff)
   b. Create tenant document at /tenants/{newTenantId}/config
   c. Create initial branch document
   d. Create initial super-user for the tenant
   e. Write audit entry: TENANT_CREATED
3. Return credentials to super-admin for handoff to client
```

No tenant can provision itself. Tenant creation is always a super-admin operation.
