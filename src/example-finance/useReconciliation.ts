// src/example-finance/useReconciliation.ts
// Fake reconciliation hook showing daily close gate logic

import { useMemo, useState } from 'react';
import type { TillBalance, DailyClose, ReconciliationSummary } from './financeTypes';

function computeCashExpected(balance: TillBalance): number {
  const cashTender = balance.tenders.find((t) => t.tenderType === 'cash')?.expected ?? 0;
  return balance.openingFloat + cashTender - balance.payoutsTotal;
}

function computeCashCounted(balance: TillBalance): number {
  const cashTender = balance.tenders.find((t) => t.tenderType === 'cash')?.counted ?? 0;
  return balance.openingFloat + cashTender - balance.payoutsTotal;
}

function evaluateStatus(variance: number): ReconciliationSummary['status'] {
  if (variance === 0) return 'ready';
  if (Math.abs(variance) <= 1000) return 'review_required';
  return 'open';
}

export function useReconciliation(initialBalance: TillBalance, initialClose: DailyClose) {
  const [balance, setBalance] = useState<TillBalance>(initialBalance);
  const [dailyClose, setDailyClose] = useState<DailyClose>(initialClose);

  const summary = useMemo<ReconciliationSummary>(() => {
    const expectedCashOnHand = computeCashExpected(balance);
    const countedCashOnHand = computeCashCounted(balance);
    const variance = countedCashOnHand - expectedCashOnHand;
    const status = evaluateStatus(variance);

    return { expectedCashOnHand, countedCashOnHand, variance, status };
  }, [balance]);

  function updateCountedCash(countedCashTender: number): void {
    setBalance((prev) => ({
      ...prev,
      tenders: prev.tenders.map((t) =>
        t.tenderType === 'cash' ? { ...t, counted: countedCashTender } : t
      ),
    }));
  }

  function addCloseNote(note: string): void {
    if (note.trim() === '') return;
    setDailyClose((prev) => ({ ...prev, notes: [...prev.notes, note.trim()] }));
  }

  function canClose(): boolean {
    if (summary.status === 'ready') return true;
    if (summary.status === 'review_required' && dailyClose.notes.length > 0) return true;
    return false;
  }

  function closeDay(approverUid: string): string | null {
    if (!canClose()) {
      return 'Cannot close day. Add a review note or resolve variance first.';
    }

    setDailyClose((prev) => ({
      ...prev,
      status: 'closed',
      approvedBy: approverUid,
      closedAt: new Date().toISOString(),
      variance: summary.variance,
    }));

    return null;
  }

  return {
    balance,
    dailyClose,
    summary,
    updateCountedCash,
    addCloseNote,
    canClose,
    closeDay,
  };
}
