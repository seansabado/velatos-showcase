// src/example-functions/index.ts
// Fake complete callable function examples — demonstrates the full pipeline pattern

import { requireAuth, makeFakeContext } from './auth';
import { verifyTenantAccess } from './tenantGuard';
import { logAudit } from './auditLogger';
import { generateId, generateRef } from '../shared/utils/id';
import type { CallableContext } from '../shared/types/tenant';
import type { Order } from '../shared/types/pos';
import {
  validateCreateOrderPayload,
  validateApproveExceptionPayload,
} from './validation';

// ---------------------------------------------------------------------------
// Example 1: Create Order
// ---------------------------------------------------------------------------

type CreateOrderPayload = {
  tenantId: string;
  branchId: string;
  registerId: string;
  shiftId: string;
  lines: Array<{ itemId: string; qty: number; unitPrice: number }>;
  paymentMethod: 'cash' | 'card' | 'other';
};

/**
 * Example callable function: create a POS order.
 *
 * Pipeline:
 *   requireAuth → verifyTenantAccess (cashier+) → validate → create → audit
 */
export async function exampleCreateOrder(
  data: unknown,
  context: CallableContext
): Promise<{ orderId: string; orderRef: string }> {
  // 1. Auth
  const claims = requireAuth(context);

  // 2. Validate payload at runtime before casting
  const parseResult = validateCreateOrderPayload(data);
  if (!parseResult.ok) {
    throw parseResult.error;
  }
  const payload: CreateOrderPayload = parseResult.value;

  // 3. Tenant guard — cashier minimum
  verifyTenantAccess(claims, payload.tenantId, 'cashier');

  // 4. Business logic (fake — no real computation)
  const subtotal = payload.lines.reduce((sum, l) => sum + l.qty * l.unitPrice, 0);
  const tax = Math.floor(subtotal * 0.1);
  const orderId = generateId();
  const orderRef = generateRef('ORD');

  // 5. Persist (fake — would write to data store in production)
  const order: Order = {
    id: orderId,
    tenantId: payload.tenantId,
    branchId: payload.branchId,
    registerId: payload.registerId,
    shiftId: payload.shiftId,
    cashierId: claims.uid,
    status: 'confirmed',
    lines: payload.lines.map((l, i) => ({
      id: generateId(),
      itemId: l.itemId,
      itemLabel: `Item ${i + 1}`,
      qty: l.qty,
      unitPrice: l.unitPrice,
      totalPrice: l.qty * l.unitPrice,
    })),
    subtotal,
    tax,
    total: subtotal + tax,
    paymentMethod: payload.paymentMethod,
    createdAt: new Date().toISOString(),
    confirmedAt: new Date().toISOString(),
    voidedAt: null,
    voidReason: null,
    syncedAt: new Date().toISOString(),
  };

  console.log('[FAKE PERSIST] Order:', order);

  // 6. Audit (fire and forget)
  void logAudit(claims, 'ORDER_CREATED', 'order', orderId, 'success', {
    lineCount: payload.lines.length,
    paymentMethod: payload.paymentMethod,
    total: order.total,
    shiftId: payload.shiftId,
  });

  return { orderId, orderRef };
}

// ---------------------------------------------------------------------------
// Example 2: Approve Exception (branch_manager+)
// ---------------------------------------------------------------------------

type ApproveExceptionPayload = {
  tenantId: string;
  exceptionId: string;
};

export async function exampleApproveException(
  data: unknown,
  context: CallableContext
): Promise<{ approved: boolean }> {
  const claims = requireAuth(context);
  const parseResult = validateApproveExceptionPayload(data);
  if (!parseResult.ok) {
    throw parseResult.error;
  }
  const payload: ApproveExceptionPayload = parseResult.value;

  // Requires branch_manager or above
  verifyTenantAccess(claims, payload.tenantId, 'branch_manager');

  // Fake: approve the exception
  console.log(`[FAKE] Approving exception ${payload.exceptionId} by ${claims.uid}`);

  void logAudit(claims, 'EXCEPTION_APPROVED', 'attendance_exception', payload.exceptionId, 'success', {});

  return { approved: true };
}

// ---------------------------------------------------------------------------
// Demo runner (not for production — illustrates the pattern only)
// ---------------------------------------------------------------------------

export async function runDemo(): Promise<void> {
  console.log('--- Example Function Pipeline Demo ---\n');

  const context = makeFakeContext({
    uid: 'staff-tanaka',
    tenantId: 'demo-tenant',
    role: 'cashier',
    branchId: 'branch-shibuya',
  });

  try {
    const result = await exampleCreateOrder(
      {
        tenantId: 'demo-tenant',
        branchId: 'branch-shibuya',
        registerId: 'reg-001',
        shiftId: 'shift-abc123',
        lines: [
          { itemId: 'item-ring-s925', qty: 1, unitPrice: 8800 },
          { itemId: 'item-pouch-sm', qty: 2, unitPrice: 1100 },
        ],
        paymentMethod: 'card',
      },
      context
    );
    console.log('\nResult:', result);
  } catch (err) {
    console.error('Error:', err);
  }
}

// Uncomment to run:
// runDemo();
