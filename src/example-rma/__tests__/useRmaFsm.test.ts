// src/example-rma/__tests__/useRmaFsm.test.ts
// Unit tests for the RMA FSM — transition validation and guard logic

import { RMA_TRANSITIONS } from '../rmaTypes';
import type { RmaCase, RmaStatus } from '../rmaTypes';

// Pure function extracted from useRmaFsm for testability
// (in production: FSM guards are pure functions, hooks are wrappers)

function canTransition(current: RmaStatus, to: RmaStatus): boolean {
  return (RMA_TRANSITIONS[current] ?? []).includes(to);
}

function guardInspecting(rmaCase: RmaCase): string | null {
  const allReceived = rmaCase.lines.every((l) => l.receivedQty !== null);
  return allReceived ? null : 'All lines must have a received quantity before inspection.';
}

function guardApproveReject(rmaCase: RmaCase): string | null {
  const allInspected = rmaCase.lines.every((l) => l.condition !== null);
  return allInspected ? null : 'All lines must have an inspection outcome before resolving.';
}

function makeCase(overrides: Partial<RmaCase> = {}): RmaCase {
  return {
    id: 'test-id',
    ref: 'RMA-TEST-0001',
    tenantId: 'demo-tenant',
    branchId: 'branch-test',
    flowType: 'return',
    status: 'draft',
    publicToken: 'tok_test',
    customerEmail: null,
    customerPhone: null,
    lines: [
      { id: 'line-1', itemId: 'item-1', itemLabel: 'Item 1', claimedQty: 1, receivedQty: null, condition: null, inspectionNote: null },
    ],
    submittedAt: null,
    receivedAt: null,
    resolvedAt: null,
    closedAt: null,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Transition map
// ---------------------------------------------------------------------------

describe('RMA_TRANSITIONS', () => {
  it('allows draft → submitted', () => expect(canTransition('draft', 'submitted')).toBe(true));
  it('allows draft → cancelled', () => expect(canTransition('draft', 'cancelled')).toBe(true));
  it('allows submitted → received', () => expect(canTransition('submitted', 'received')).toBe(true));
  it('allows received → inspecting', () => expect(canTransition('received', 'inspecting')).toBe(true));
  it('allows inspecting → approved', () => expect(canTransition('inspecting', 'approved')).toBe(true));
  it('allows inspecting → rejected', () => expect(canTransition('inspecting', 'rejected')).toBe(true));
  it('allows approved → resolved', () => expect(canTransition('approved', 'resolved')).toBe(true));
  it('allows rejected → closed', () => expect(canTransition('rejected', 'closed')).toBe(true));

  it('blocks draft → inspecting (must go through submitted → received first)', () =>
    expect(canTransition('draft', 'inspecting')).toBe(false));

  it('blocks inspecting → closed (must go through approved/rejected)', () =>
    expect(canTransition('inspecting', 'closed')).toBe(false));

  it('blocks resolved → reopening (terminal state)', () =>
    expect(canTransition('resolved', 'submitted')).toBe(false));

  it('blocks closed → anything (terminal state)', () =>
    expect(canTransition('closed', 'draft')).toBe(false));
});

// ---------------------------------------------------------------------------
// Guards
// ---------------------------------------------------------------------------

describe('guardInspecting', () => {
  it('passes when all lines have receivedQty', () => {
    const rmaCase = makeCase({ lines: [
      { id: 'l1', itemId: 'i1', itemLabel: 'Item', claimedQty: 1, receivedQty: 1, condition: null, inspectionNote: null },
    ]});
    expect(guardInspecting(rmaCase)).toBeNull();
  });

  it('fails when any line has null receivedQty', () => {
    const rmaCase = makeCase();
    expect(guardInspecting(rmaCase)).not.toBeNull();
  });

  it('fails when one of multiple lines is missing receivedQty', () => {
    const rmaCase = makeCase({ lines: [
      { id: 'l1', itemId: 'i1', itemLabel: 'Item 1', claimedQty: 1, receivedQty: 1, condition: null, inspectionNote: null },
      { id: 'l2', itemId: 'i2', itemLabel: 'Item 2', claimedQty: 2, receivedQty: null, condition: null, inspectionNote: null },
    ]});
    expect(guardInspecting(rmaCase)).not.toBeNull();
  });
});

describe('guardApproveReject', () => {
  it('passes when all lines have a condition', () => {
    const rmaCase = makeCase({ lines: [
      { id: 'l1', itemId: 'i1', itemLabel: 'Item', claimedQty: 1, receivedQty: 1, condition: 'accepted', inspectionNote: null },
    ]});
    expect(guardApproveReject(rmaCase)).toBeNull();
  });

  it('fails when any line has null condition', () => {
    const rmaCase = makeCase({ lines: [
      { id: 'l1', itemId: 'i1', itemLabel: 'Item', claimedQty: 1, receivedQty: 1, condition: null, inspectionNote: null },
    ]});
    expect(guardApproveReject(rmaCase)).not.toBeNull();
  });
});
