// src/shared/types/pos.ts
// Fake type definitions for POS domain — no real business logic or schema

export type MachineState =
  | 'idle'
  | 'shift_open'
  | 'order_building'
  | 'confirming'
  | 'suspended'
  | 'shift_closing';

export type PaymentMethod = 'cash' | 'card' | 'other';

export type OrderStatus = 'building' | 'confirmed' | 'voided';

export type OrderLine = {
  id: string;
  itemId: string;
  itemLabel: string;     // e.g. "シルバーリング S925"
  qty: number;
  unitPrice: number;     // JPY, integer
  totalPrice: number;    // qty * unitPrice
};

export type Order = {
  id: string;
  tenantId: string;
  branchId: string;
  registerId: string;
  shiftId: string;
  cashierId: string;
  status: OrderStatus;
  lines: OrderLine[];
  subtotal: number;
  tax: number;
  total: number;
  paymentMethod: PaymentMethod | null;
  createdAt: string;
  confirmedAt: string | null;
  voidedAt: string | null;
  voidReason: string | null;
  syncedAt: string | null;   // null = pending sync (offline queue)
};

export type ShiftSession = {
  id: string;
  tenantId: string;
  branchId: string;
  registerId: string;
  cashierId: string;
  openedAt: string;
  closedAt: string | null;
  suspendedAt: string | null;
  transactionCount: number;
  grossRevenue: number;
};

export type Register = {
  id: string;
  branchId: string;
  label: string;             // e.g. "レジ 1"
  currentShiftId: string | null;
};
