// src/shared/types/staff.ts
// Fake type definitions for Staff domain

export type UserRole =
  | 'cashier'
  | 'senior_cashier'
  | 'branch_manager'
  | 'area_manager'
  | 'super_admin';

export type PunchType = 'in' | 'out';

export type GeofenceResult = 'inside' | 'outside';

export type StaffMember = {
  id: string;
  tenantId: string;
  branchId: string;
  displayName: string;
  role: UserRole;
  activeShiftId: string | null;
  hiredAt: string;        // YYYY-MM-DD
  isActive: boolean;
};

export type AttendancePunch = {
  id: string;
  staffId: string;
  branchId: string;
  type: PunchType;
  punchedAt: string;           // ISO 8601 UTC
  geofenceResult: GeofenceResult;
  distanceFromBoundaryMeters: number;  // rounded to nearest 10m
  requiresApproval: boolean;
  approvedBy: string | null;
  approvedAt: string | null;
  syncedAt: string | null;     // null = pending offline sync
};

export type AttendanceException = {
  id: string;
  punchId: string;
  staffId: string;
  branchId: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  reviewedBy: string | null;
  reviewedAt: string | null;
};

export type ScheduleEntry = {
  id: string;
  staffId: string;
  branchId: string;
  date: string;          // YYYY-MM-DD
  startTime: string;     // HH:MM (local)
  endTime: string;       // HH:MM (local)
  publishedAt: string | null;
};
