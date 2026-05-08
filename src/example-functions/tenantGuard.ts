// src/example-functions/tenantGuard.ts
// Fake tenant guard — demonstrates the verifyTenantAccess pattern

import type { AuthClaims, UserRole } from '../shared/types/tenant';

/**
 * Role hierarchy — higher number = more privileged.
 * Used by roleAtLeast() to compare roles numerically.
 */
const ROLE_LEVEL: Record<UserRole, number> = {
  cashier: 0,
  senior_cashier: 1,
  branch_manager: 2,
  area_manager: 3,
  super_admin: 4,
};

function roleAtLeast(actual: UserRole, minimum: UserRole): boolean {
  return (ROLE_LEVEL[actual] ?? -1) >= (ROLE_LEVEL[minimum] ?? 999);
}

/**
 * Verifies that the authenticated caller:
 * 1. Belongs to the tenant they are attempting to access.
 * 2. Holds at least the minimum required role.
 *
 * CRITICAL DESIGN NOTE:
 * The tenantId used for comparison is taken from `claims` (the verified auth token),
 * never from the request payload. This is the core of the tenant isolation guarantee.
 * A caller cannot access another tenant's data by changing the tenantId in their request.
 *
 * @throws permission-denied if tenant mismatch or insufficient role
 */
export function verifyTenantAccess(
  claims: AuthClaims,
  requestedTenantId: string,
  minimumRole: UserRole
): void {
  // Tenant isolation — token tenantId must match requested tenantId
  if (claims.tenantId !== requestedTenantId) {
    throw {
      code: 'permission-denied',
      message: 'Tenant mismatch. You do not have access to this resource.',
    };
  }

  // Role gate
  if (!roleAtLeast(claims.role, minimumRole)) {
    throw {
      code: 'permission-denied',
      message: `This operation requires the '${minimumRole}' role or higher.`,
    };
  }
}

/**
 * Super-admin bypass — for operations that must work across tenants
 * (e.g., platform-level provisioning).
 *
 * Still requires super_admin role. Only skips the tenant ID match check.
 * All cross-tenant operations are logged with the admin's identity.
 */
export function requireSuperAdmin(claims: AuthClaims): void {
  if (claims.role !== 'super_admin') {
    throw {
      code: 'permission-denied',
      message: 'This operation requires super_admin privileges.',
    };
  }
}
