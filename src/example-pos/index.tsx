// src/example-pos/index.tsx
// Fake POS application shell — demonstrates pattern, not real POS logic

import React, { useEffect, useState } from 'react';
import { useMachineState } from './useMachineState';
import { useShiftSession } from './useShiftSession';
import { useOnlineStatus } from '../shared/hooks/useOnlineStatus';
import { t } from '../i18n/i18n';
import { STATE_LABELS, FAKE_REGISTERS } from './fakeMachines';
import { formatCurrency } from '../shared/utils/formatCurrency';

// ---------------------------------------------------------------------------
// Sub-components (inline for brevity — would be separate files in production)
// ---------------------------------------------------------------------------

function OnlineBadge({ online }: { online: boolean }): React.ReactElement {
  return (
    <span style={{ color: online ? 'green' : 'red', fontSize: 12 }}>
      {online ? '● オンライン' : t('common.status.offline')}
    </span>
  );
}

function StateBadge({ state }: { state: string }): React.ReactElement {
  return (
    <span style={{ fontWeight: 'bold', fontSize: 14 }}>
      {STATE_LABELS[state as keyof typeof STATE_LABELS] ?? state}
    </span>
  );
}

function ShiftControls({
  send,
  canSend,
}: {
  send: (event: string) => boolean;
  canSend: (event: string) => boolean;
}): React.ReactElement {
  return (
    <div style={{ display: 'flex', gap: 8 }}>
      <button disabled={!canSend('openShift')} onClick={() => send('openShift')}>
        {t('pos.shift.open_button')}
      </button>
      <button disabled={!canSend('startClose')} onClick={() => send('startClose')}>
        {t('pos.shift.close_button')}
      </button>
      <button disabled={!canSend('suspend')} onClick={() => send('suspend')}>
        一時停止
      </button>
      <button disabled={!canSend('resume')} onClick={() => send('resume')}>
        再開
      </button>
    </div>
  );
}

function OrderControls({
  send,
  canSend,
  sessionRevenue,
}: {
  send: (event: string) => boolean;
  canSend: (event: string) => boolean;
  sessionRevenue: number;
}): React.ReactElement {
  return (
    <div style={{ marginTop: 16 }}>
      <div style={{ marginBottom: 8, fontSize: 13, color: '#666' }}>
        売上合計: {formatCurrency(sessionRevenue)}
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <button disabled={!canSend('newOrder')} onClick={() => send('newOrder')}>
          {t('pos.order.new_button')}
        </button>
        <button disabled={!canSend('confirmOrder')} onClick={() => send('confirmOrder')}>
          {t('pos.order.confirm_button')}
        </button>
        <button disabled={!canSend('cancelOrder')} onClick={() => send('cancelOrder')}>
          {t('pos.order.cancel_button')}
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main POS App Shell
// ---------------------------------------------------------------------------

/**
 * Entry point for the fake POS surface.
 *
 * Demonstrates:
 *  - FSM-driven UI (buttons are enabled/disabled based on valid transitions)
 *  - Shift session state
 *  - Online status indicator
 *  - Offline queue length badge
 *  - Japanese UI copy
 */
export function PosApp(): React.ReactElement {
  const { online } = useOnlineStatus();
  const { state: machineState, send, canSend } = useMachineState('idle');
  const { state: shiftState, openShift, addOrder, flushQueue, retryFailedMutations } = useShiftSession(online);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  const register = FAKE_REGISTERS[0];

  useEffect(() => {
    if (online && shiftState.offlineQueue.length > 0) {
      void flushQueue();
    }
  }, [online, shiftState.offlineQueue.length, flushQueue]);

  useEffect(() => {
    if (shiftState.syncStatus === 'error') {
      setSyncMessage('一部の同期に失敗しました。再試行が必要です。');
      return;
    }

    if (shiftState.syncStatus === 'syncing') {
      setSyncMessage('同期中...');
      return;
    }

    setSyncMessage(null);
  }, [shiftState.syncStatus]);

  return (
    <div style={{ fontFamily: 'sans-serif', padding: 24, maxWidth: 480 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ margin: 0 }}>VelatOS POS — {register.label}</h2>
        <OnlineBadge online={online} />
      </div>

      {/* Machine state */}
      <div style={{ marginTop: 12, marginBottom: 12, padding: 8, background: '#f5f5f5' }}>
        状態: <StateBadge state={machineState} />
        {shiftState.offlineQueue.length > 0 && (
          <span style={{ marginLeft: 12, color: 'orange', fontSize: 12 }}>
            未同期: {shiftState.offlineQueue.length}件
          </span>
        )}
        {shiftState.deadLetterQueue.length > 0 && (
          <span style={{ marginLeft: 12, color: '#b00020', fontSize: 12 }}>
            要対応: {shiftState.deadLetterQueue.length}件
          </span>
        )}
      </div>

      {syncMessage && (
        <div style={{ marginBottom: 12, fontSize: 12, color: shiftState.syncStatus === 'error' ? '#b00020' : '#666' }}>
          {syncMessage}
        </div>
      )}

      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <button
          onClick={() => void flushQueue()}
          disabled={!online || shiftState.offlineQueue.length === 0 || shiftState.syncStatus === 'syncing'}
        >
          手動同期
        </button>
        <button
          onClick={retryFailedMutations}
          disabled={shiftState.deadLetterQueue.length === 0}
        >
          失敗分を再投入
        </button>
      </div>

      {/* Shift controls */}
      <ShiftControls send={(e) => {
        const ok = send(e);
        if (ok && e === 'openShift') openShift(register.id, 'staff-demo-001');
        return ok;
      }} canSend={canSend} />

      {/* Order controls */}
      <OrderControls
        send={(e) => {
          const ok = send(e);
          if (ok && e === 'completeOrder') {
            addOrder({
              tenantId: 'demo-tenant',
              branchId: register.branchId,
              registerId: register.id,
              shiftId: shiftState.session?.id ?? 'no-shift',
              cashierId: 'staff-demo-001',
              status: 'confirmed',
              lines: [],
              subtotal: 5000,
              tax: 500,
              total: 5500,
              paymentMethod: 'cash',
              createdAt: new Date().toISOString(),
              confirmedAt: new Date().toISOString(),
              voidedAt: null,
              voidReason: null,
            });
          }
          return ok;
        }}
        canSend={canSend}
        sessionRevenue={shiftState.session?.grossRevenue ?? 0}
      />

      {/* Debug state panel */}
      <details style={{ marginTop: 24, fontSize: 12, color: '#888' }}>
        <summary>デバッグ情報</summary>
        <pre style={{ background: '#f0f0f0', padding: 8, overflow: 'auto' }}>
          {JSON.stringify({ machineState, shiftState }, null, 2)}
        </pre>
      </details>
    </div>
  );
}

export default PosApp;
