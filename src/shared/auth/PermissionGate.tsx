// src/shared/auth/PermissionGate.tsx
// Declarative role-based UI guard for React views

import React from 'react';
import type { AuthClaims } from '../types/tenant';
import type { PermissionAction } from './permissions';
import { hasPermission, canAccessTenant } from './permissions';

type PermissionGateProps = {
  claims: AuthClaims;
  action: PermissionAction;
  tenantId?: string;
  fallback?: React.ReactNode;
  children: React.ReactNode;
};

export function PermissionGate(props: PermissionGateProps): React.ReactElement {
  const { claims, action, tenantId, fallback = null, children } = props;

  const allowedByRole = hasPermission(claims, action);
  const allowedByTenant = tenantId ? canAccessTenant(claims, tenantId) : true;

  if (!allowedByRole || !allowedByTenant) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
