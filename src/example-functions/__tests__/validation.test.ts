import {
  validateCreateOrderPayload,
  validateApproveExceptionPayload,
} from '../validation';

describe('validateCreateOrderPayload', () => {
  const validPayload = {
    tenantId: 'demo-tenant',
    branchId: 'branch-shibuya',
    registerId: 'reg-001',
    shiftId: 'shift-001',
    paymentMethod: 'cash',
    lines: [{ itemId: 'item-1', qty: 1, unitPrice: 1000 }],
  };

  it('returns parsed payload on valid input', () => {
    const result = validateCreateOrderPayload(validPayload);
    expect(result.ok).toBe(true);
  });

  it('rejects missing required fields', () => {
    const result = validateCreateOrderPayload({ ...validPayload, tenantId: '' });
    expect(result.ok).toBe(false);
  });

  it('rejects invalid payment method', () => {
    const result = validateCreateOrderPayload({ ...validPayload, paymentMethod: 'crypto' });
    expect(result.ok).toBe(false);
  });

  it('rejects empty lines', () => {
    const result = validateCreateOrderPayload({ ...validPayload, lines: [] });
    expect(result.ok).toBe(false);
  });
});

describe('validateApproveExceptionPayload', () => {
  it('accepts valid payload', () => {
    const result = validateApproveExceptionPayload({ tenantId: 'demo-tenant', exceptionId: 'ex-1' });
    expect(result.ok).toBe(true);
  });

  it('rejects missing tenantId', () => {
    const result = validateApproveExceptionPayload({ exceptionId: 'ex-1' });
    expect(result.ok).toBe(false);
  });

  it('rejects missing exceptionId', () => {
    const result = validateApproveExceptionPayload({ tenantId: 'demo-tenant' });
    expect(result.ok).toBe(false);
  });
});
