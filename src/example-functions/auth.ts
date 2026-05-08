// src/example-functions/auth.ts
// Fake auth helper — demonstrates the requireAuth pattern
// Not connected to any real auth provider

import type { AuthClaims, CallableContext } from '../shared/types/tenant';

/**
 * Extracts and validates the caller's auth claims from a callable function context.
 *
 * In production: the auth token is verified by the function runtime before
 * this code runs. Custom claims (tenantId, role, branchId) are set at login
 * by a separate onLogin trigger and cannot be modified by the client.
 *
 * Throws an unauthenticated error if:
 * - No auth token is present
 * - Required custom claims are missing
 */
export function requireAuth(context: CallableContext): AuthClaims {
  if (!context.auth) {
    throw {
      code: 'unauthenticated',
      message: 'This function requires authentication.',
    };
  }

  const { uid, token } = context.auth;
  const tenantId = token['tenantId'] as string | undefined;
  const role = token['role'] as string | undefined;
  const branchId = token['branchId'] as string | undefined;

  if (!tenantId || !role || !branchId) {
    throw {
      code: 'unauthenticated',
      message: 'Auth token is missing required claims. Please sign in again.',
    };
  }

  const validRoles = ['cashier', 'senior_cashier', 'branch_manager', 'area_manager', 'super_admin'];
  if (!validRoles.includes(role)) {
    throw {
      code: 'unauthenticated',
      message: `Unrecognized role claim: ${role}`,
    };
  }

  return {
    uid,
    tenantId,
    role: role as AuthClaims['role'],
    branchId,
  };
}

/**
 * Fake context factory — for demo and testing purposes only.
 * In production: context is injected by the function runtime.
 */
export function makeFakeContext(claims: Partial<AuthClaims>): CallableContext {
  return {
    auth: {
      uid: claims.uid ?? 'demo-uid',
      token: {
        tenantId: claims.tenantId ?? 'demo-tenant',
        role: claims.role ?? 'cashier',
        branchId: claims.branchId ?? 'branch-shibuya',
      },
    },
  };
}
