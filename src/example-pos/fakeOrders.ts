// src/example-pos/fakeOrders.ts
// Fake order data — non-proprietary demo data only

import type { Order } from '../shared/types/pos';

export const FAKE_ORDERS: Order[] = [
  {
    id: 'ord-20260425-A3F7',
    tenantId: 'demo-tenant',
    branchId: 'branch-shibuya',
    registerId: 'reg-001',
    shiftId: 'shift-abc123',
    cashierId: 'staff-001',
    status: 'confirmed',
    lines: [
      {
        id: 'line-001',
        itemId: 'item-ring-s925',
        itemLabel: 'シルバーリング S925',
        qty: 1,
        unitPrice: 8800,
        totalPrice: 8800,
      },
      {
        id: 'line-002',
        itemId: 'item-pouch-sm',
        itemLabel: 'ポーチ S',
        qty: 2,
        unitPrice: 1100,
        totalPrice: 2200,
      },
    ],
    subtotal: 11000,
    tax: 1100,
    total: 12100,
    paymentMethod: 'card',
    createdAt: '2026-04-25T09:15:00Z',
    confirmedAt: '2026-04-25T09:16:30Z',
    voidedAt: null,
    voidReason: null,
    syncedAt: '2026-04-25T09:16:35Z',
  },
  {
    id: 'ord-20260425-B9D2',
    tenantId: 'demo-tenant',
    branchId: 'branch-shibuya',
    registerId: 'reg-001',
    shiftId: 'shift-abc123',
    cashierId: 'staff-001',
    status: 'voided',
    lines: [
      {
        id: 'line-003',
        itemId: 'item-bracelet-g14k',
        itemLabel: 'ブレスレット 14K',
        qty: 1,
        unitPrice: 42000,
        totalPrice: 42000,
      },
    ],
    subtotal: 42000,
    tax: 4200,
    total: 46200,
    paymentMethod: 'cash',
    createdAt: '2026-04-25T10:30:00Z',
    confirmedAt: '2026-04-25T10:31:00Z',
    voidedAt: '2026-04-25T10:45:00Z',
    voidReason: 'customer_request',
    syncedAt: '2026-04-25T10:45:10Z',
  },
];

export const FAKE_PENDING_ORDER: Omit<Order, 'id' | 'confirmedAt' | 'voidedAt' | 'voidReason' | 'syncedAt'> = {
  tenantId: 'demo-tenant',
  branchId: 'branch-shibuya',
  registerId: 'reg-001',
  shiftId: 'shift-abc123',
  cashierId: 'staff-001',
  status: 'building',
  lines: [],
  subtotal: 0,
  tax: 0,
  total: 0,
  paymentMethod: null,
  createdAt: new Date().toISOString(),
};
