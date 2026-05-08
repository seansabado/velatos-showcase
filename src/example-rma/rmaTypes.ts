// src/example-rma/rmaTypes.ts
// Fake RMA (Return / Repair / Exchange) domain types — non-proprietary

export type RmaFlowType = 'return' | 'repair' | 'exchange';

export type RmaStatus =
  | 'draft'
  | 'submitted'
  | 'received'
  | 'inspecting'
  | 'approved'
  | 'rejected'
  | 'resolved'
  | 'cancelled'
  | 'closed';

export type RmaLineCondition =
  | 'as_authorized'   // item matches what was submitted
  | 'short'           // fewer items than claimed
  | 'missing'         // item not present
  | 'damaged'         // item present but additional damage found
  | 'accepted'        // passed inspection
  | 'quarantined'     // held pending further review
  | 'rejected_line';  // failed inspection

export type RmaLine = {
  id: string;
  itemId: string;
  itemLabel: string;
  claimedQty: number;
  receivedQty: number | null;
  condition: RmaLineCondition | null;
  inspectionNote: string | null;
};

export type RmaCase = {
  id: string;
  ref: string;             // e.g. "RMA-20260425-A1B2"
  tenantId: string;
  branchId: string;
  flowType: RmaFlowType;
  status: RmaStatus;
  publicToken: string;     // customer-facing status URL token
  customerEmail: string | null;
  customerPhone: string | null;
  lines: RmaLine[];
  submittedAt: string | null;
  receivedAt: string | null;
  resolvedAt: string | null;
  closedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

// Valid transitions map: which statuses can follow which
export const RMA_TRANSITIONS: Partial<Record<RmaStatus, RmaStatus[]>> = {
  draft:      ['submitted', 'cancelled'],
  submitted:  ['received', 'cancelled'],
  received:   ['inspecting', 'cancelled'],
  inspecting: ['approved', 'rejected'],
  approved:   ['resolved'],
  rejected:   ['closed'],
  resolved:   ['closed'],
};
