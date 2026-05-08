// src/shared/auth/permissions.ts
// Role and permission utilities for UI and function surfaces

import type { AuthClaims, UserRole } from '../types/tenant';

const ROLE_LEVEL: Record<UserRole, number> = {
  cashier: 0,
  senior_cashier: 1,
  branch_manager: 2,
  area_manager: 3,
  super_admin: 4,
};

export type PermissionAction =
  | 'pos.order.create'
  | 'pos.order.void'
  | 'pos.shift.open'
  | 'pos.shift.close'
  | 'staff.punch'
  | 'manager.exception.approve'
  | 'manager.daily_close'
  | 'rma.case.review'
  | 'rma.case.resolve'
  | 'admin.tenant.manage';

const MINIMUM_ROLE: Record<PermissionAction, UserRole> = {
  'pos.order.create': 'cashier',
  'pos.order.void': 'senior_cashier',
  'pos.shift.open': 'cashier',
  'pos.shift.close': 'branch_manager',
  'staff.punch': 'cashier',
  'manager.exception.approve': 'branch_manager',
  'manager.daily_close': 'branch_manager',
  'rma.case.review': 'senior_cashier',
  'rma.case.resolve': 'branch_manager',
  'admin.tenant.manage': 'super_admin',
};

export function roleAtLeast(actual: UserRole, minimum: UserRole): boolean {
  return (ROLE_LEVEL[actual] ?? -1) >= (ROLE_LEVEL[minimum] ?? 999);
}

export function hasPermission(claims: AuthClaims, action: PermissionAction): boolean {
  return roleAtLeast(claims.role, MINIMUM_ROLE[action]);
}

export function canAccessTenant(claims: AuthClaims, tenantId: string): boolean {
  return claims.tenantId === tenantId || claims.role === 'super_admin';
}
