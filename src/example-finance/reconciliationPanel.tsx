// src/example-finance/reconciliationPanel.tsx
// Fake UI for till reconciliation and day close gating

import React, { useState } from 'react';
import { useReconciliation } from './useReconciliation';
import { FAKE_DAILY_CLOSE, FAKE_TILL_BALANCE } from './fakeFinance';

export function ReconciliationPanel(): React.ReactElement {
  const {
    summary,
    dailyClose,
    balance,
    updateCountedCash,
    addCloseNote,
    canClose,
    closeDay,
  } = useReconciliation(FAKE_TILL_BALANCE, FAKE_DAILY_CLOSE);

  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);

  function submitClose(): void {
    const err = closeDay('manager-sato');
    setError(err);
  }

  return (
    <section style={{ fontFamily: 'sans-serif', maxWidth: 520, padding: 20 }}>
      <h2 style={{ marginTop: 0 }}>Daily Reconciliation</h2>
      <div style={{ marginBottom: 12, fontSize: 13, color: '#666' }}>
        Till: {balance.tillId} | Date: {balance.businessDate}
      </div>

      <div style={{ border: '1px solid #ddd', borderRadius: 6, padding: 12, marginBottom: 12 }}>
        <div>Expected cash: {summary.expectedCashOnHand.toLocaleString('ja-JP')} JPY</div>
        <div>Counted cash: {summary.countedCashOnHand.toLocaleString('ja-JP')} JPY</div>
        <div>Variance: {summary.variance.toLocaleString('ja-JP')} JPY</div>
        <div>Status: {summary.status}</div>
      </div>

      <label style={{ display: 'block', marginBottom: 6 }}>Update counted cash tender:</label>
      <input
        type="number"
        defaultValue={balance.tenders.find((t) => t.tenderType === 'cash')?.counted ?? 0}
        onChange={(e) => updateCountedCash(Number(e.target.value || 0))}
        style={{ width: '100%', padding: 8, border: '1px solid #ccc', borderRadius: 4, marginBottom: 12 }}
      />

      <label style={{ display: 'block', marginBottom: 6 }}>Variance note (required if review_required):</label>
      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        style={{ width: '100%', minHeight: 70, padding: 8, border: '1px solid #ccc', borderRadius: 4 }}
      />
      <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
        <button onClick={() => { addCloseNote(note); setNote(''); }} style={{ padding: '6px 10px' }}>Add Note</button>
        <button onClick={submitClose} disabled={!canClose()} style={{ padding: '6px 10px' }}>Close Day</button>
      </div>

      {error && <div style={{ color: '#a00', marginTop: 10 }}>{error}</div>}

      <pre style={{ marginTop: 16, fontSize: 11, background: '#f5f5f5', padding: 10 }}>
        {JSON.stringify(dailyClose, null, 2)}
      </pre>
    </section>
  );
}

export default ReconciliationPanel;
