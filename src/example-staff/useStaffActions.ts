// src/example-staff/useStaffActions.ts
// Hook for staff punch-in/out actions — fake/demo implementation

import { useState, useCallback } from 'react';
import type { AttendancePunch, GeofenceResult } from '../shared/types/staff';
import { generateId } from '../shared/utils/id';

type PunchState = {
  lastPunch: AttendancePunch | null;
  isPunchedIn: boolean;
  pendingSync: boolean;
  exceptionReason: string | null;
};

type StaffActions = {
  punchIn: (geofenceResult: GeofenceResult, distanceMeters: number, reason?: string) => void;
  punchOut: (geofenceResult: GeofenceResult, distanceMeters: number, reason?: string) => void;
  clearException: () => void;
  state: PunchState;
};

const GEOFENCE_RADIUS_METERS = 100;

/**
 * Manages staff punch-in/out with geofence validation and offline queue.
 *
 * Key behaviors:
 * - Punches outside the geofence are accepted but flagged for manager approval.
 * - Punches taken offline are queued (pendingSync = true) and replayed on reconnect.
 * - Raw GPS coordinates are never stored — only distance from boundary (rounded to 10m).
 */
export function useStaffActions(staffId: string, branchId: string): StaffActions {
  const [state, setState] = useState<PunchState>({
    lastPunch: null,
    isPunchedIn: false,
    pendingSync: false,
    exceptionReason: null,
  });

  const createPunch = (
    type: 'in' | 'out',
    geofenceResult: GeofenceResult,
    distanceMeters: number,
    reason?: string
  ): AttendancePunch => ({
    id: generateId(),
    staffId,
    branchId,
    type,
    punchedAt: new Date().toISOString(),
    geofenceResult,
    // Round to nearest 10m — never store exact distance or coordinates
    distanceFromBoundaryMeters: Math.round(distanceMeters / 10) * 10,
    requiresApproval: geofenceResult === 'outside',
    approvedBy: null,
    approvedAt: null,
    syncedAt: null,
  });

  const punchIn = useCallback(
    (geofenceResult: GeofenceResult, distanceMeters: number, reason?: string): void => {
      const punch = createPunch('in', geofenceResult, distanceMeters, reason);
      setState({
        lastPunch: punch,
        isPunchedIn: true,
        pendingSync: true,
        exceptionReason: geofenceResult === 'outside' ? (reason ?? null) : null,
      });
      // In production: add to offline queue; flush if online
    },
    [staffId, branchId]
  );

  const punchOut = useCallback(
    (geofenceResult: GeofenceResult, distanceMeters: number, reason?: string): void => {
      const punch = createPunch('out', geofenceResult, distanceMeters, reason);
      setState({
        lastPunch: punch,
        isPunchedIn: false,
        pendingSync: true,
        exceptionReason: geofenceResult === 'outside' ? (reason ?? null) : null,
      });
    },
    [staffId, branchId]
  );

  const clearException = useCallback((): void => {
    setState((prev) => ({ ...prev, exceptionReason: null }));
  }, []);

  return { punchIn, punchOut, clearException, state };
}
