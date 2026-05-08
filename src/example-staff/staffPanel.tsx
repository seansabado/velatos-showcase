// src/example-staff/staffPanel.tsx
// Fake staff mobile panel — demonstrates pattern, not real staff logic

import React, { useState } from 'react';
import { useStaffActions } from './useStaffActions';
import { FAKE_CURRENT_STAFF, FAKE_SCHEDULE } from './fakeStaff';
import { t } from '../i18n/i18n';
import { formatTime } from '../shared/utils/formatDate';

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function ScheduleCard({ entry }: { entry: typeof FAKE_SCHEDULE[0] }): React.ReactElement {
  return (
    <div style={{ padding: '12px 16px', border: '1px solid #ddd', borderRadius: 8, marginBottom: 8 }}>
      <div style={{ fontWeight: 'bold', fontSize: 15 }}>{entry.date}</div>
      <div style={{ fontSize: 13, color: '#555', marginTop: 4 }}>
        {entry.startTime} – {entry.endTime}
      </div>
    </div>
  );
}

function GeofenceWarning({
  onSubmit,
}: {
  onSubmit: (reason: string) => void;
}): React.ReactElement {
  const [reason, setReason] = useState('');

  return (
    <div style={{ padding: 16, background: '#fff3cd', borderRadius: 8, marginBottom: 16 }}>
      <div style={{ color: '#856404', fontWeight: 'bold', marginBottom: 8 }}>
        ⚠ {t('staff.punch.geofence_warning')}
      </div>
      <textarea
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        rows={3}
        placeholder="理由を入力してください"
        style={{ width: '100%', padding: 8, fontSize: 13, borderRadius: 4, border: '1px solid #ccc' }}
      />
      <button
        disabled={reason.trim().length < 5}
        onClick={() => onSubmit(reason)}
        style={{ marginTop: 8, padding: '8px 16px', background: '#856404', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer' }}
      >
        提出
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Staff Panel
// ---------------------------------------------------------------------------

/**
 * Fake staff mobile panel.
 *
 * Demonstrates:
 *  - Punch in/out with simulated geofence check
 *  - Exception flow (geofence outside → reason required)
 *  - Schedule view
 *  - Offline-pending indicator
 *  - Japanese UI copy
 */
export function StaffPanel(): React.ReactElement {
  const staff = FAKE_CURRENT_STAFF;
  const { punchIn, punchOut, clearException, state } = useStaffActions(staff.id, staff.branchId);
  const [showGeofenceForm, setShowGeofenceForm] = useState(false);
  const [pendingPunchType, setPendingPunchType] = useState<'in' | 'out' | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  // Simulate a geofence check (in production: real GPS coordinates are checked
  // against the branch boundary server-side; only the result is returned to the client)
  const simulateGeofenceCheck = (): { result: 'inside' | 'outside'; distanceMeters: number } => {
    const outside = Math.random() < 0.2; // 20% chance of being outside for demo
    return {
      result: outside ? 'outside' : 'inside',
      distanceMeters: outside ? Math.floor(Math.random() * 200) + 100 : 0,
    };
  };

  const handlePunch = (type: 'in' | 'out'): void => {
    const { result, distanceMeters } = simulateGeofenceCheck();

    if (result === 'outside') {
      setPendingPunchType(type);
      setShowGeofenceForm(true);
      return;
    }

    if (type === 'in') {
      punchIn('inside', 0);
      setMessage(t('staff.punch.success_in'));
    } else {
      punchOut('inside', 0);
      setMessage(t('staff.punch.success_out'));
    }
  };

  const handleExceptionSubmit = (reason: string): void => {
    if (!pendingPunchType) return;
    if (pendingPunchType === 'in') {
      punchIn('outside', 150, reason);
      setMessage(t('staff.punch.success_in') + '（例外申請済み）');
    } else {
      punchOut('outside', 150, reason);
      setMessage(t('staff.punch.success_out') + '（例外申請済み）');
    }
    setShowGeofenceForm(false);
    setPendingPunchType(null);
  };

  return (
    <div style={{ fontFamily: 'sans-serif', padding: 24, maxWidth: 400 }}>
      {/* Header */}
      <h2 style={{ marginBottom: 4 }}>👤 {staff.displayName}</h2>
      <div style={{ fontSize: 12, color: '#888', marginBottom: 20 }}>
        {staff.branchId} — {staff.role}
      </div>

      {/* Success message */}
      {message && (
        <div style={{ padding: '10px 14px', background: '#d4edda', color: '#155724', borderRadius: 6, marginBottom: 16, fontSize: 13 }}>
          ✓ {message}
          <button onClick={() => setMessage(null)} style={{ marginLeft: 12, background: 'none', border: 'none', cursor: 'pointer', color: '#155724' }}>×</button>
        </div>
      )}

      {/* Geofence exception form */}
      {showGeofenceForm && (
        <GeofenceWarning onSubmit={handleExceptionSubmit} />
      )}

      {/* Punch buttons */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
        <button
          disabled={state.isPunchedIn}
          onClick={() => handlePunch('in')}
          style={{
            flex: 1, padding: '14px 0', fontSize: 16, fontWeight: 'bold',
            background: state.isPunchedIn ? '#ccc' : '#28a745', color: '#fff',
            border: 'none', borderRadius: 8, cursor: state.isPunchedIn ? 'not-allowed' : 'pointer',
          }}
        >
          {t('staff.punch.in_button')}
        </button>
        <button
          disabled={!state.isPunchedIn}
          onClick={() => handlePunch('out')}
          style={{
            flex: 1, padding: '14px 0', fontSize: 16, fontWeight: 'bold',
            background: !state.isPunchedIn ? '#ccc' : '#dc3545', color: '#fff',
            border: 'none', borderRadius: 8, cursor: !state.isPunchedIn ? 'not-allowed' : 'pointer',
          }}
        >
          {t('staff.punch.out_button')}
        </button>
      </div>

      {/* Pending sync indicator */}
      {state.pendingSync && (
        <div style={{ fontSize: 12, color: 'orange', marginBottom: 16 }}>
          ⏳ {t('common.status.syncing')}
        </div>
      )}

      {/* Schedule */}
      <h3>{t('staff.schedule.title')}</h3>
      {FAKE_SCHEDULE.length === 0 ? (
        <div style={{ color: '#888', fontSize: 13 }}>{t('staff.schedule.no_schedule')}</div>
      ) : (
        FAKE_SCHEDULE.map((entry) => <ScheduleCard key={entry.id} entry={entry} />)
      )}
    </div>
  );
}

export default StaffPanel;
