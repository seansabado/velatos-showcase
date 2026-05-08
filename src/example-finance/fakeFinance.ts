// src/example-finance/fakeFinance.ts
// Fake reconciliation data for portfolio demos

import type { TillBalance, DailyClose } from './financeTypes';

export const FAKE_TILL_BALANCE: TillBalance = {
  tillId: 'till-shibuya-01',
  branchId: 'branch-shibuya',
  businessDate: '2026-05-08',
  openingFloat: 30000,
  salesTotal: 186400,
  refundsTotal: 5200,
  payoutsTotal: 3000,
  tenders: [
    { tenderType: 'cash', expected: 74200, counted: 73700 },
    { tenderType: 'card', expected: 109000, counted: 109000 },
    { tenderType: 'other', expected: 3200, counted: 3200 },
  ],
};

export const FAKE_DAILY_CLOSE: DailyClose = {
  id: 'dc-20260508-shibuya-01',
  tillId: 'till-shibuya-01',
  status: 'open',
  variance: -500,
  notes: [],
  approvedBy: null,
  closedAt: null,
  createdAt: '2026-05-08T10:00:00Z',
};
