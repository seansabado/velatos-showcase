// src/shared/types/audit.ts
// Fake type definitions for audit log domain

import type { UserRole } from './tenant';

export type AuditAction =
  | 'SHIFT_OPENED'
  | 'SHIFT_CLOSED'
  | 'SHIFT_SUSPENDED'
  | 'SHIFT_RESUMED'
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
  | 'TENANT_CREATED'
  | 'DAILY_CLOSE_COMPLETED';

export type AuditEntry = {
  id: string;
  tenantId: string;
  actorId: string;
  actorRole: UserRole;
  branchId: string | null;
  action: AuditAction;
  resourceType: string;
  resourceId: string;
  result: 'success' | 'failure';
  /**
   * Non-PII metadata only. Never include email, phone, raw GPS,
   * or payment card data in this field.
   */
  metadata: Record<string, string | number | boolean>;
  occurredAt: string;              // ISO 8601 UTC
};
