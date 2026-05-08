// src/example-functions/__tests__/tenantGuard.test.ts
// Unit tests for verifyTenantAccess and requireSuperAdmin

import { verifyTenantAccess, requireSuperAdmin } from '../tenantGuard';
import type { AuthClaims } from '../../shared/types/tenant';

function makeClaims(overrides: Partial<AuthClaims> = {}): AuthClaims {
  return {
    uid: 'test-uid',
    tenantId: 'tenant-acme',
    role: 'cashier',
    branchId: 'branch-shibuya',
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// verifyTenantAccess
// ---------------------------------------------------------------------------

describe('verifyTenantAccess', () => {
  describe('tenant isolation', () => {
    it('allows access when tenantId matches token', () => {
      const claims = makeClaims({ tenantId: 'tenant-acme', role: 'cashier' });
      expect(() => verifyTenantAccess(claims, 'tenant-acme', 'cashier')).not.toThrow();
    });

    it('rejects access when tenantId does not match token', () => {
      const claims = makeClaims({ tenantId: 'tenant-acme', role: 'cashier' });
      expect(() => verifyTenantAccess(claims, 'tenant-other', 'cashier')).toThrow(
        expect.objectContaining({ code: 'permission-denied' })
      );
    });

    it('rejects even when caller has super_admin role but wrong tenant', () => {
      // verifyTenantAccess still enforces tenant match — use requireSuperAdmin for cross-tenant ops
      const claims = makeClaims({ tenantId: 'tenant-acme', role: 'super_admin' });
      expect(() => verifyTenantAccess(claims, 'tenant-other', 'cashier')).toThrow(
        expect.objectContaining({ code: 'permission-denied' })
      );
    });
  });

  describe('role hierarchy', () => {
    it('allows cashier when minimum is cashier', () => {
      const claims = makeClaims({ role: 'cashier' });
      expect(() => verifyTenantAccess(claims, 'tenant-acme', 'cashier')).not.toThrow();
    });

    it('allows branch_manager when minimum is cashier', () => {
      const claims = makeClaims({ role: 'branch_manager' });
      expect(() => verifyTenantAccess(claims, 'tenant-acme', 'cashier')).not.toThrow();
    });

    it('allows super_admin when minimum is branch_manager', () => {
      const claims = makeClaims({ role: 'super_admin' });
      expect(() => verifyTenantAccess(claims, 'tenant-acme', 'branch_manager')).not.toThrow();
    });

    it('rejects cashier when minimum is branch_manager', () => {
      const claims = makeClaims({ role: 'cashier' });
      expect(() => verifyTenantAccess(claims, 'tenant-acme', 'branch_manager')).toThrow(
        expect.objectContaining({ code: 'permission-denied' })
      );
    });

    it('rejects senior_cashier when minimum is branch_manager', () => {
      const claims = makeClaims({ role: 'senior_cashier' });
      expect(() => verifyTenantAccess(claims, 'tenant-acme', 'branch_manager')).toThrow(
        expect.objectContaining({ code: 'permission-denied' })
      );
    });

    it('rejects branch_manager when minimum is area_manager', () => {
      const claims = makeClaims({ role: 'branch_manager' });
      expect(() => verifyTenantAccess(claims, 'tenant-acme', 'area_manager')).toThrow(
        expect.objectContaining({ code: 'permission-denied' })
      );
    });
  });
});

// ---------------------------------------------------------------------------
// requireSuperAdmin
// ---------------------------------------------------------------------------

describe('requireSuperAdmin', () => {
  it('allows super_admin', () => {
    const claims = makeClaims({ role: 'super_admin' });
    expect(() => requireSuperAdmin(claims)).not.toThrow();
  });

  it('rejects area_manager', () => {
    const claims = makeClaims({ role: 'area_manager' });
    expect(() => requireSuperAdmin(claims)).toThrow(
      expect.objectContaining({ code: 'permission-denied' })
    );
  });

  it('rejects branch_manager', () => {
    const claims = makeClaims({ role: 'branch_manager' });
    expect(() => requireSuperAdmin(claims)).toThrow(
      expect.objectContaining({ code: 'permission-denied' })
    );
  });

  it('rejects cashier', () => {
    const claims = makeClaims({ role: 'cashier' });
    expect(() => requireSuperAdmin(claims)).toThrow(
      expect.objectContaining({ code: 'permission-denied' })
    );
  });
});
