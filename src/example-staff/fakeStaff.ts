// src/example-staff/fakeStaff.ts
// Fake staff data — non-proprietary demo data only

import type { StaffMember, AttendancePunch, ScheduleEntry } from '../shared/types/staff';

export const FAKE_STAFF: StaffMember[] = [
  {
    id: 'staff-001',
    tenantId: 'demo-tenant',
    branchId: 'branch-shibuya',
    displayName: '田中 花子',
    role: 'cashier',
    activeShiftId: null,
    hiredAt: '2024-04-01',
    isActive: true,
  },
  {
    id: 'staff-002',
    tenantId: 'demo-tenant',
    branchId: 'branch-shibuya',
    displayName: '山田 太郎',
    role: 'senior_cashier',
    activeShiftId: 'shift-abc123',
    hiredAt: '2023-09-15',
    isActive: true,
  },
  {
    id: 'staff-003',
    tenantId: 'demo-tenant',
    branchId: 'branch-shibuya',
    displayName: '佐藤 美咲',
    role: 'branch_manager',
    activeShiftId: null,
    hiredAt: '2022-01-10',
    isActive: true,
  },
];

export const FAKE_CURRENT_STAFF: StaffMember = FAKE_STAFF[0];

export const FAKE_PUNCHES: AttendancePunch[] = [
  {
    id: 'punch-001',
    staffId: 'staff-001',
    branchId: 'branch-shibuya',
    type: 'in',
    punchedAt: '2026-04-25T00:00:00Z', // 09:00 JST
    geofenceResult: 'inside',
    distanceFromBoundaryMeters: 0,
    requiresApproval: false,
    approvedBy: null,
    approvedAt: null,
    syncedAt: '2026-04-25T00:00:05Z',
  },
];

export const FAKE_SCHEDULE: ScheduleEntry[] = [
  {
    id: 'sched-001',
    staffId: 'staff-001',
    branchId: 'branch-shibuya',
    date: new Date().toISOString().slice(0, 10),
    startTime: '09:00',
    endTime: '17:30',
    publishedAt: '2026-04-20T10:00:00Z',
  },
];
