// src/example-manager/dashboard.tsx
// Fake manager dashboard component — demonstrates pattern, not real manager logic

import React, { useState } from 'react';
import { useBranchMetrics } from './useBranchMetrics';
import { FAKE_EXCEPTIONS } from './fakeMetrics';
import { formatCurrency } from '../shared/utils/formatCurrency';
import { t } from '../i18n/i18n';

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function MetricCard({ label, value, highlight }: { label: string; value: string | number; highlight?: boolean }): React.ReactElement {
  return (
    <div style={{
      padding: '12px 16px',
      border: '1px solid #ddd',
      borderRadius: 8,
      background: highlight ? '#fff3cd' : '#fff',
      minWidth: 120,
    }}>
      <div style={{ fontSize: 11, color: '#666', marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 'bold' }}>{value}</div>
    </div>
  );
}

function ExceptionRow({ exc, onApprove, onReject }: {
  exc: typeof FAKE_EXCEPTIONS[0];
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
}): React.ReactElement {
  return (
    <div style={{ padding: '8px 0', borderBottom: '1px solid #eee', display: 'flex', gap: 12, alignItems: 'center' }}>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 'bold', fontSize: 13 }}>{exc.staffName}</div>
        <div style={{ fontSize: 12, color: '#888' }}>{exc.description}</div>
      </div>
      <button onClick={() => onApprove(exc.id)} style={{ color: 'green', border: '1px solid green', background: 'none', padding: '4px 8px', cursor: 'pointer' }}>
        {t('manager.exception.approve_button')}
      </button>
      <button onClick={() => onReject(exc.id)} style={{ color: 'red', border: '1px solid red', background: 'none', padding: '4px 8px', cursor: 'pointer' }}>
        {t('manager.exception.reject_button')}
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Manager Dashboard
// ---------------------------------------------------------------------------

/**
 * Fake manager dashboard.
 *
 * Demonstrates:
 *  - Data loading state pattern
 *  - Metric card layout
 *  - Exception queue with approve/reject actions
 *  - Daily close gate (blocked while exceptions are open)
 *  - Japanese UI copy
 */
export function ManagerDashboard(): React.ReactElement {
  const today = new Date().toISOString().slice(0, 10);
  const metricsState = useBranchMetrics('branch-shibuya', today);

  const [exceptions, setExceptions] = useState(FAKE_EXCEPTIONS);
  const [dailyClosed, setDailyClosed] = useState(false);

  const handleApprove = (id: string): void =>
    setExceptions((prev) => prev.filter((e) => e.id !== id));

  const handleReject = (id: string): void =>
    setExceptions((prev) => prev.filter((e) => e.id !== id));

  const canClose = exceptions.length === 0 && !dailyClosed;

  return (
    <div style={{ fontFamily: 'sans-serif', padding: 24, maxWidth: 600 }}>
      <h2>{t('manager.dashboard.title')} — 渋谷店</h2>
      <div style={{ fontSize: 12, color: '#888', marginBottom: 16 }}>{today}</div>

      {/* Metrics */}
      {metricsState.status === 'loading' && (
        <div style={{ color: '#888' }}>{t('common.status.loading')}</div>
      )}
      {metricsState.status === 'ready' && (
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 24 }}>
          <MetricCard
            label={t('manager.dashboard.transactions_today')}
            value={metricsState.metrics.transactionCount}
          />
          <MetricCard
            label={t('manager.dashboard.gross_revenue')}
            value={formatCurrency(metricsState.metrics.grossRevenue)}
          />
          <MetricCard
            label="取消件数"
            value={metricsState.metrics.voidCount}
            highlight={metricsState.metrics.voidCount > 0}
          />
          <MetricCard
            label={t('manager.dashboard.open_exceptions')}
            value={exceptions.length}
            highlight={exceptions.length > 0}
          />
        </div>
      )}

      {/* Exception queue */}
      <h3 style={{ marginBottom: 8 }}>未処理の例外</h3>
      {exceptions.length === 0 ? (
        <div style={{ color: '#888', fontSize: 13 }}>例外はありません</div>
      ) : (
        exceptions.map((exc) => (
          <ExceptionRow key={exc.id} exc={exc} onApprove={handleApprove} onReject={handleReject} />
        ))
      )}

      {/* Daily close */}
      <div style={{ marginTop: 24 }}>
        <button
          disabled={!canClose}
          onClick={() => setDailyClosed(true)}
          style={{
            padding: '10px 20px',
            background: canClose ? '#1a1a1a' : '#ccc',
            color: '#fff',
            border: 'none',
            borderRadius: 6,
            cursor: canClose ? 'pointer' : 'not-allowed',
            fontSize: 14,
          }}
        >
          {dailyClosed ? '締め完了 ✓' : t('manager.daily_close.button')}
        </button>
        {!canClose && !dailyClosed && exceptions.length > 0 && (
          <div style={{ fontSize: 12, color: 'red', marginTop: 4 }}>
            例外を処理してから締めてください
          </div>
        )}
      </div>
    </div>
  );
}

export default ManagerDashboard;
