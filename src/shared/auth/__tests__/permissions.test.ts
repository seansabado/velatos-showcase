import { roleAtLeast, hasPermission, canAccessTenant } from '../permissions';
import type { AuthClaims } from '../../types/tenant';

const baseClaims: AuthClaims = {
  uid: 'u1',
  tenantId: 'tenant-a',
  role: 'cashier',
  branchId: 'branch-1',
};

describe('roleAtLeast', () => {
  it('respects hierarchy ordering', () => {
    expect(roleAtLeast('cashier', 'cashier')).toBe(true);
    expect(roleAtLeast('branch_manager', 'senior_cashier')).toBe(true);
    expect(roleAtLeast('cashier', 'branch_manager')).toBe(false);
  });
});

describe('hasPermission', () => {
  it('allows cashier actions for cashier role', () => {
    expect(hasPermission(baseClaims, 'pos.order.create')).toBe(true);
    expect(hasPermission(baseClaims, 'manager.daily_close')).toBe(false);
  });

  it('allows manager actions for branch manager', () => {
    const claims: AuthClaims = { ...baseClaims, role: 'branch_manager' };
    expect(hasPermission(claims, 'manager.daily_close')).toBe(true);
    expect(hasPermission(claims, 'admin.tenant.manage')).toBe(false);
  });
});

describe('canAccessTenant', () => {
  it('allows same-tenant access', () => {
    expect(canAccessTenant(baseClaims, 'tenant-a')).toBe(true);
  });

  it('denies cross-tenant for non-super admin', () => {
    expect(canAccessTenant(baseClaims, 'tenant-b')).toBe(false);
  });

  it('allows cross-tenant for super admin', () => {
    const claims: AuthClaims = { ...baseClaims, role: 'super_admin' };
    expect(canAccessTenant(claims, 'tenant-b')).toBe(true);
  });
});
