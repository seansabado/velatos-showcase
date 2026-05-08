// src/example-rma/fakeRmaCases.ts
// Fake RMA case data — non-proprietary demo data only

import type { RmaCase } from './rmaTypes';
import { generateId } from '../shared/utils/id';

export const FAKE_RMA_DRAFT: RmaCase = {
  id: generateId(),
  ref: 'RMA-20260425-A1B2',
  tenantId: 'demo-tenant',
  branchId: 'branch-shibuya',
  flowType: 'return',
  status: 'draft',
  publicToken: 'pub_tk_demo_abcdef1234',
  customerEmail: null,
  customerPhone: null,
  lines: [
    {
      id: 'rma-line-001',
      itemId: 'item-ring-s925',
      itemLabel: 'シルバーリング S925',
      claimedQty: 1,
      receivedQty: null,
      condition: null,
      inspectionNote: null,
    },
    {
      id: 'rma-line-002',
      itemId: 'item-pouch-sm',
      itemLabel: 'ポーチ S',
      claimedQty: 2,
      receivedQty: null,
      condition: null,
      inspectionNote: null,
    },
  ],
  submittedAt: null,
  receivedAt: null,
  resolvedAt: null,
  closedAt: null,
  createdAt: '2026-04-25T09:20:00Z',
  updatedAt: '2026-04-25T09:20:00Z',
};

export const FAKE_RMA_INSPECTING: RmaCase = {
  id: generateId(),
  ref: 'RMA-20260424-C3D4',
  tenantId: 'demo-tenant',
  branchId: 'branch-shibuya',
  flowType: 'repair',
  status: 'inspecting',
  publicToken: 'pub_tk_demo_xyz789',
  customerEmail: null,
  customerPhone: null,
  lines: [
    {
      id: 'rma-line-003',
      itemId: 'item-bracelet-g14k',
      itemLabel: 'ブレスレット 14K',
      claimedQty: 1,
      receivedQty: 1,
      condition: null,
      inspectionNote: null,
    },
  ],
  submittedAt: '2026-04-24T10:00:00Z',
  receivedAt: '2026-04-24T14:00:00Z',
  resolvedAt: null,
  closedAt: null,
  createdAt: '2026-04-24T09:45:00Z',
  updatedAt: '2026-04-24T14:00:00Z',
};

export const STATUS_LABELS: Record<string, string> = {
  draft:      '下書き',
  submitted:  '申請済み',
  received:   '受領済み',
  inspecting: '検品中',
  approved:   '承認済み',
  rejected:   '却下',
  resolved:   '解決済み',
  cancelled:  'キャンセル',
  closed:     '完了',
};

export const FLOW_LABELS: Record<string, string> = {
  return:   '返品',
  repair:   '修理',
  exchange: '交換',
};
