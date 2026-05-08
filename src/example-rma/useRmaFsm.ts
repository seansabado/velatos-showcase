// src/example-rma/useRmaFsm.ts
// Demonstrates a 9-state FSM for Return/Repair/Exchange case management
// Not connected to any real system

import { useState, useCallback } from 'react';
import type { RmaCase, RmaStatus, RmaLine } from './rmaTypes';
import { RMA_TRANSITIONS } from './rmaTypes';

type FsmError = { code: string; message: string };

type RmaFsmActions = {
  advance: (toStatus: RmaStatus, meta?: Partial<RmaCase>) => FsmError | null;
  cancel: (reason: string) => FsmError | null;
  canAdvanceTo: (toStatus: RmaStatus) => boolean;
  updateLine: (lineId: string, patch: Partial<RmaLine>) => void;
  rmaCase: RmaCase;
};

/**
 * Guards that must pass before a transition is allowed.
 * These mirror server-side validation — the server always re-validates.
 * Client-side guards are UX only (disable buttons, show warnings).
 */
function checkTransitionGuards(rmaCase: RmaCase, toStatus: RmaStatus): FsmError | null {
  if (toStatus === 'inspecting') {
    const allReceived = rmaCase.lines.every((l) => l.receivedQty !== null);
    if (!allReceived) {
      return { code: 'precondition_failed', message: 'All lines must have a received quantity before inspection.' };
    }
  }

  if (toStatus === 'approved' || toStatus === 'rejected') {
    const allInspected = rmaCase.lines.every((l) => l.condition !== null);
    if (!allInspected) {
      return { code: 'precondition_failed', message: 'All lines must have an inspection outcome before resolving.' };
    }
  }

  if (toStatus === 'resolved') {
    if (rmaCase.status !== 'approved') {
      return { code: 'precondition_failed', message: 'Only approved cases can be resolved.' };
    }
  }

  return null;
}

/**
 * RMA FSM hook — manages a single RMA case through its lifecycle.
 *
 * Key design points:
 * - `advance()` validates the transition locally before applying it.
 *   Invalid transitions return an error object rather than throwing.
 * - `cancel()` is always allowed from open states; closed/resolved states reject it.
 * - Line updates are decoupled from status transitions — inspection outcomes
 *   are recorded progressively before the status advances.
 * - The FSM is the source of truth for which UI actions are available;
 *   components derive their enabled/disabled state from `canAdvanceTo()`.
 */
export function useRmaFsm(initial: RmaCase): RmaFsmActions {
  const [rmaCase, setRmaCase] = useState<RmaCase>(initial);

  const advance = useCallback((toStatus: RmaStatus, meta: Partial<RmaCase> = {}): FsmError | null => {
    const allowed = RMA_TRANSITIONS[rmaCase.status] ?? [];

    if (!allowed.includes(toStatus)) {
      return {
        code: 'invalid_transition',
        message: `Cannot move from '${rmaCase.status}' to '${toStatus}'.`,
      };
    }

    const guardError = checkTransitionGuards(rmaCase, toStatus);
    if (guardError) return guardError;

    setRmaCase((prev) => ({
      ...prev,
      ...meta,
      status: toStatus,
      updatedAt: new Date().toISOString(),
    }));

    return null;
  }, [rmaCase]);

  const cancel = useCallback((reason: string): FsmError | null => {
    if (!reason || reason.trim().length < 5) {
      return { code: 'invalid_argument', message: 'Cancellation reason must be at least 5 characters.' };
    }

    const terminalStates: RmaStatus[] = ['resolved', 'closed', 'cancelled'];
    if (terminalStates.includes(rmaCase.status)) {
      return { code: 'precondition_failed', message: `Cannot cancel a case with status '${rmaCase.status}'.` };
    }

    setRmaCase((prev) => ({
      ...prev,
      status: 'cancelled',
      updatedAt: new Date().toISOString(),
    }));

    return null;
  }, [rmaCase.status]);

  const canAdvanceTo = useCallback((toStatus: RmaStatus): boolean => {
    const allowed = RMA_TRANSITIONS[rmaCase.status] ?? [];
    if (!allowed.includes(toStatus)) return false;
    return checkTransitionGuards(rmaCase, toStatus) === null;
  }, [rmaCase]);

  const updateLine = useCallback((lineId: string, patch: Partial<RmaLine>): void => {
    setRmaCase((prev) => ({
      ...prev,
      lines: prev.lines.map((l) => (l.id === lineId ? { ...l, ...patch } : l)),
      updatedAt: new Date().toISOString(),
    }));
  }, []);

  return { advance, cancel, canAdvanceTo, updateLine, rmaCase };
}
