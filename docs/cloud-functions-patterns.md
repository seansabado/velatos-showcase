# Cloud Functions Patterns

All server-side logic is implemented as callable functions. This document describes the standard patterns used across all function handlers.

---

## The Function Pipeline

Every callable function follows the same pipeline:

```
Incoming Call
     │
     ├─── 1. requireAuth(context)
     │         → AuthClaims (or throws Unauthenticated)
     │
     ├─── 2. validatePayload(data, schema)
     │         → TypedPayload (or throws InvalidArgument)
     │
     ├─── 3. verifyTenantAccess(claims, payload.tenantId, minimumRole)
     │         → void (or throws PermissionDenied)
     │
     ├─── 4. handler(claims, payload)
     │         → Result
     │
     └─── 5. logAudit(claims, action, resourceId, result, metadata)
               → void (fire-and-forget, never blocks response)
```

Audit logging is always the last step and never blocks the response. If audit logging fails, the error is reported to an internal alerting channel but does not affect the caller.

---

## requireAuth

```typescript
// src/example-functions/auth.ts

import type { CallableContext } from './types';
import type { AuthClaims } from '../shared/types/tenant';

/**
 * Extracts and validates the auth token from a callable context.
 * Throws an Unauthenticated error if no valid token is present.
 *
 * This is a FAKE/DEMO implementation — not connected to any real auth provider.
 */
export function requireAuth(context: CallableContext): AuthClaims {
  if (!context.auth) {
    throw { code: 'unauthenticated', message: 'Authentication required' };
  }

  const { uid, token } = context.auth;

  // In production: token claims are set by the auth provider at login
  // and cannot be modified by the client.
  const tenantId = token['tenantId'] as string | undefined;
  const role = token['role'] as string | undefined;
  const branchId = token['branchId'] as string | undefined;

  if (!tenantId || !role || !branchId) {
    throw { code: 'unauthenticated', message: 'Incomplete auth claims' };
  }

  return { uid, tenantId, role: role as AuthClaims['role'], branchId };
}
```

---

## verifyTenantAccess

```typescript
// src/example-functions/tenantGuard.ts

import type { AuthClaims, UserRole } from '../shared/types/tenant';

const ROLE_HIERARCHY: Record<UserRole, number> = {
  cashier: 0,
  senior_cashier: 1,
  branch_manager: 2,
  area_manager: 3,
  super_admin: 4,
};

/**
 * Verifies that the caller belongs to the requested tenant
 * and has at least the required role.
 *
 * CRITICAL: tenantId is always taken from the auth token (claims),
 * never from the request payload. This prevents tenant spoofing.
 */
export function verifyTenantAccess(
  claims: AuthClaims,
  requestedTenantId: string,
  minimumRole: UserRole
): void {
  if (claims.tenantId !== requestedTenantId) {
    throw {
      code: 'permission-denied',
      message: 'Tenant mismatch — access denied',
    };
  }

  const callerLevel = ROLE_HIERARCHY[claims.role] ?? -1;
  const requiredLevel = ROLE_HIERARCHY[minimumRole] ?? 999;

  if (callerLevel < requiredLevel) {
    throw {
      code: 'permission-denied',
      message: `Requires role: ${minimumRole}`,
    };
  }
}
```

---

## logAudit

```typescript
// src/example-functions/auditLogger.ts

import type { AuthClaims } from '../shared/types/tenant';
import type { AuditAction, AuditEntry } from '../shared/types/audit';
import { generateId } from '../shared/utils/id';

/**
 * Appends an audit log entry.
 * Fire-and-forget — callers do not await this.
 * Failures are reported to internal alerting, never surfaced to the caller.
 *
 * IMPORTANT: metadata must never contain PII.
 */
export async function logAudit(
  claims: AuthClaims,
  action: AuditAction,
  resourceType: string,
  resourceId: string,
  result: 'success' | 'failure',
  metadata: Record<string, string | number | boolean> = {}
): Promise<void> {
  const entry: AuditEntry = {
    id: generateId(),
    tenantId: claims.tenantId,
    actorId: claims.uid,
    actorRole: claims.role,
    branchId: claims.branchId ?? null,
    action,
    resourceType,
    resourceId,
    result,
    metadata,
    occurredAt: new Date().toISOString(),
  };

  // In production: write to append-only audit collection
  // This fake implementation just logs to console
  console.log('[AUDIT]', JSON.stringify(entry));
}
```

---

## Composing a Complete Function

```typescript
// src/example-functions/index.ts — example handler

import { requireAuth } from './auth';
import { verifyTenantAccess } from './tenantGuard';
import { logAudit } from './auditLogger';

type CreateOrderPayload = {
  tenantId: string;
  branchId: string;
  registerId: string;
  shiftId: string;
  lines: Array<{ itemId: string; qty: number; unitPrice: number }>;
};

/**
 * FAKE example of a complete callable function.
 * Demonstrates the full pipeline pattern without any real business logic.
 */
export async function exampleCreateOrder(
  data: unknown,
  context: CallableContext
): Promise<{ orderId: string }> {
  // 1. Auth
  const claims = requireAuth(context);

  // 2. Validate (abbreviated — use Zod or equivalent in production)
  const payload = data as CreateOrderPayload;
  if (!payload.tenantId || !payload.shiftId || !payload.lines?.length) {
    throw { code: 'invalid-argument', message: 'Missing required fields' };
  }

  // 3. Tenant guard — cashier minimum
  verifyTenantAccess(claims, payload.tenantId, 'cashier');

  // 4. Business logic (fake)
  const orderId = generateId();
  // ... write order to data store ...

  // 5. Audit (fire and forget)
  logAudit(claims, 'ORDER_CREATED', 'order', orderId, 'success', {
    lineCount: payload.lines.length,
    shiftId: payload.shiftId,
    registerId: payload.registerId,
  });

  return { orderId };
}
```

---

## Error Codes

| Code | HTTP equiv | When to use |
|---|---|---|
| `unauthenticated` | 401 | No valid auth token |
| `permission-denied` | 403 | Valid token but insufficient role or wrong tenant |
| `invalid-argument` | 400 | Payload validation failure |
| `not-found` | 404 | Resource does not exist (within caller's tenant) |
| `already-exists` | 409 | Duplicate creation attempt |
| `failed-precondition` | 422 | Business rule violation (e.g., shift not open) |
| `internal` | 500 | Unexpected server error |

Never expose raw database errors or stack traces to the caller — map all unexpected errors to `internal`.
