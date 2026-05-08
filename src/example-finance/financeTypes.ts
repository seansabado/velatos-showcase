// src/example-finance/financeTypes.ts
// Fake finance reconciliation domain types

export type TenderType = 'cash' | 'card' | 'bank_transfer' | 'other';

export type TenderTotal = {
  tenderType: TenderType;
  expected: number;
  counted: number;
};

export type TillBalance = {
  tillId: string;
  branchId: string;
  businessDate: string; // YYYY-MM-DD
  openingFloat: number;
  salesTotal: number;
  refundsTotal: number;
  payoutsTotal: number;
  tenders: TenderTotal[];
};

export type DailyCloseStatus = 'open' | 'ready' | 'review_required' | 'closed';

export type DailyClose = {
  id: string;
  tillId: string;
  status: DailyCloseStatus;
  variance: number;
  notes: string[];
  approvedBy: string | null;
  closedAt: string | null;
  createdAt: string;
};

export type ReconciliationSummary = {
  expectedCashOnHand: number;
  countedCashOnHand: number;
  variance: number;
  status: DailyCloseStatus;
};
