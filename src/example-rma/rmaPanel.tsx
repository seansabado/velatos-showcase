// src/example-rma/rmaPanel.tsx
// Fake RMA case detail panel — demonstrates FSM-driven UI pattern

import React, { useState } from 'react';
import { useRmaFsm } from './useRmaFsm';
import { FAKE_RMA_DRAFT, STATUS_LABELS, FLOW_LABELS } from './fakeRmaCases';
import type { RmaStatus, RmaLineCondition } from './rmaTypes';

const LINE_CONDITION_LABELS: Record<RmaLineCondition, string> = {
  as_authorized: '✓ 申告通り',
  short:         '⚠ 数量不足',
  missing:       '✗ 欠品',
  damaged:       '⚠ 追加破損',
  accepted:      '✓ 検品合格',
  quarantined:   '⚠ 保留',
  rejected_line: '✗ 検品不合格',
};

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function StatusBadge({ status }: { status: RmaStatus }): React.ReactElement {
  const colors: Partial<Record<RmaStatus, string>> = {
    draft:      '#888',
    submitted:  '#0066cc',
    received:   '#6f42c1',
    inspecting: '#fd7e14',
    approved:   '#28a745',
    rejected:   '#dc3545',
    resolved:   '#20c997',
    cancelled:  '#6c757d',
    closed:     '#343a40',
  };

  return (
    <span style={{
      display: 'inline-block',
      padding: '2px 10px',
      borderRadius: 12,
      background: colors[status] ?? '#ccc',
      color: '#fff',
      fontSize: 12,
      fontWeight: 'bold',
    }}>
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}

// ---------------------------------------------------------------------------
// RMA Panel
// ---------------------------------------------------------------------------

/**
 * Fake RMA case panel.
 *
 * Demonstrates:
 *  - FSM state driving available actions (buttons only enabled for valid transitions)
 *  - Line-by-line condition recording before status advance
 *  - Transition guard feedback (can't advance to inspecting until all lines received)
 *  - Cancellation with minimum-length reason requirement
 *  - Japanese UI copy
 */
export function RmaPanel(): React.ReactElement {
  const { rmaCase, advance, cancel, canAdvanceTo, updateLine } = useRmaFsm(FAKE_RMA_DRAFT);
  const [cancelReason, setCancelReason] = useState('');
  const [showCancel, setShowCancel] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);

  const handleAdvance = (toStatus: RmaStatus): void => {
    const err = advance(toStatus);
    setLastError(err?.message ?? null);
  };

  const handleCancel = (): void => {
    const err = cancel(cancelReason);
    if (err) {
      setLastError(err.message);
    } else {
      setShowCancel(false);
    }
  };

  const nextStatuses: RmaStatus[] = [
    'submitted', 'received', 'inspecting', 'approved', 'rejected', 'resolved', 'closed',
  ];

  return (
    <div style={{ fontFamily: 'sans-serif', padding: 24, maxWidth: 520 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
        <div>
          <h2 style={{ margin: 0 }}>{rmaCase.ref}</h2>
          <div style={{ fontSize: 13, color: '#666', marginTop: 4 }}>
            {FLOW_LABELS[rmaCase.flowType]} — {rmaCase.branchId}
          </div>
        </div>
        <StatusBadge status={rmaCase.status} />
      </div>

      {/* Error banner */}
      {lastError && (
        <div style={{ padding: '8px 12px', background: '#f8d7da', color: '#721c24', borderRadius: 6, marginBottom: 12, fontSize: 13 }}>
          ⚠ {lastError}
          <button onClick={() => setLastError(null)} style={{ float: 'right', background: 'none', border: 'none', cursor: 'pointer', color: '#721c24' }}>×</button>
        </div>
      )}

      {/* Lines */}
      <h4 style={{ marginBottom: 8 }}>対象商品</h4>
      <div style={{ border: '1px solid #ddd', borderRadius: 6, overflow: 'hidden', marginBottom: 20 }}>
        {rmaCase.lines.map((line, i) => (
          <div key={line.id} style={{
            padding: '10px 14px',
            background: i % 2 === 0 ? '#fafafa' : '#fff',
            borderBottom: i < rmaCase.lines.length - 1 ? '1px solid #eee' : 'none',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: 'bold', fontSize: 13 }}>{line.itemLabel}</div>
                <div style={{ fontSize: 12, color: '#888' }}>申告数: {line.claimedQty}</div>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                {/* Received qty input */}
                <input
                  type="number"
                  min={0}
                  max={line.claimedQty}
                  placeholder="受領数"
                  value={line.receivedQty ?? ''}
                  onChange={(e) => updateLine(line.id, { receivedQty: Number(e.target.value) })}
                  style={{ width: 60, padding: '4px 6px', fontSize: 12, border: '1px solid #ccc', borderRadius: 4 }}
                />
                {/* Condition select */}
                <select
                  value={line.condition ?? ''}
                  onChange={(e) => updateLine(line.id, { condition: (e.target.value as RmaLineCondition) || null })}
                  style={{ fontSize: 12, padding: '4px 6px', border: '1px solid #ccc', borderRadius: 4 }}
                >
                  <option value="">状態を選択</option>
                  {Object.entries(LINE_CONDITION_LABELS).map(([val, label]) => (
                    <option key={val} value={val}>{label}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Transition buttons — only enabled for valid next states */}
      <h4 style={{ marginBottom: 8 }}>ステータス変更</h4>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
        {nextStatuses.map((s) => (
          <button
            key={s}
            disabled={!canAdvanceTo(s)}
            onClick={() => handleAdvance(s)}
            style={{
              padding: '6px 14px',
              fontSize: 12,
              border: '1px solid #333',
              borderRadius: 4,
              background: canAdvanceTo(s) ? '#1a1a1a' : '#eee',
              color: canAdvanceTo(s) ? '#fff' : '#aaa',
              cursor: canAdvanceTo(s) ? 'pointer' : 'not-allowed',
            }}
          >
            → {STATUS_LABELS[s]}
          </button>
        ))}
      </div>

      {/* Cancel flow */}
      {!showCancel && !['cancelled', 'closed', 'resolved'].includes(rmaCase.status) && (
        <button onClick={() => setShowCancel(true)} style={{ fontSize: 12, color: 'red', background: 'none', border: '1px solid red', padding: '4px 10px', cursor: 'pointer', borderRadius: 4 }}>
          キャンセル
        </button>
      )}
      {showCancel && (
        <div style={{ marginTop: 12, padding: 12, background: '#fff3f3', borderRadius: 6, border: '1px solid #f5c6cb' }}>
          <div style={{ fontSize: 13, fontWeight: 'bold', marginBottom: 6 }}>キャンセル理由（5文字以上）</div>
          <textarea
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            rows={2}
            style={{ width: '100%', padding: 6, fontSize: 13, borderRadius: 4, border: '1px solid #ccc' }}
          />
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <button
              disabled={cancelReason.trim().length < 5}
              onClick={handleCancel}
              style={{ padding: '6px 14px', background: 'red', color: '#fff', border: 'none', borderRadius: 4, cursor: cancelReason.trim().length < 5 ? 'not-allowed' : 'pointer' }}
            >
              確定
            </button>
            <button onClick={() => setShowCancel(false)} style={{ padding: '6px 14px', background: '#eee', border: 'none', borderRadius: 4, cursor: 'pointer' }}>
              戻る
            </button>
          </div>
        </div>
      )}

      {/* Debug */}
      <details style={{ marginTop: 24, fontSize: 11, color: '#888' }}>
        <summary>デバッグ情報</summary>
        <pre style={{ background: '#f5f5f5', padding: 8, overflow: 'auto', fontSize: 11 }}>
          {JSON.stringify(rmaCase, null, 2)}
        </pre>
      </details>
    </div>
  );
}

export default RmaPanel;
