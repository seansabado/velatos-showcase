// src/example-manager/fakeMetrics.ts
// Fake branch metrics data — non-proprietary demo data only

import type { BranchMetrics } from './useBranchMetrics';

export const FAKE_BRANCH_METRICS: BranchMetrics = {
  branchId: 'branch-shibuya',
  branchLabel: '渋谷店',
  date: '2026-04-25',
  transactionCount: 47,
  grossRevenue: 384500,
  voidCount: 2,
  openExceptions: 1,
  dailyClosed: false,
};

export const FAKE_WEEKLY_METRICS: BranchMetrics[] = [
  { branchId: 'branch-shibuya', branchLabel: '渋谷店', date: '2026-04-19', transactionCount: 38, grossRevenue: 302000, voidCount: 0, openExceptions: 0, dailyClosed: true },
  { branchId: 'branch-shibuya', branchLabel: '渋谷店', date: '2026-04-20', transactionCount: 51, grossRevenue: 421000, voidCount: 1, openExceptions: 0, dailyClosed: true },
  { branchId: 'branch-shibuya', branchLabel: '渋谷店', date: '2026-04-21', transactionCount: 44, grossRevenue: 357000, voidCount: 0, openExceptions: 2, dailyClosed: true },
  { branchId: 'branch-shibuya', branchLabel: '渋谷店', date: '2026-04-22', transactionCount: 29, grossRevenue: 218000, voidCount: 0, openExceptions: 0, dailyClosed: true },
  { branchId: 'branch-shibuya', branchLabel: '渋谷店', date: '2026-04-23', transactionCount: 55, grossRevenue: 498000, voidCount: 3, openExceptions: 1, dailyClosed: true },
  { branchId: 'branch-shibuya', branchLabel: '渋谷店', date: '2026-04-24', transactionCount: 41, grossRevenue: 345000, voidCount: 1, openExceptions: 0, dailyClosed: true },
  { branchId: 'branch-shibuya', branchLabel: '渋谷店', date: '2026-04-25', transactionCount: 47, grossRevenue: 384500, voidCount: 2, openExceptions: 1, dailyClosed: false },
];

export const FAKE_EXCEPTIONS = [
  {
    id: 'exc-001',
    staffId: 'staff-tanaka',
    staffName: '田中 花子',
    type: 'geofence',
    description: '勤務地から142m離れた場所での打刻',
    occurredAt: '2026-04-25T08:47:00Z',
    status: 'pending' as const,
  },
];
