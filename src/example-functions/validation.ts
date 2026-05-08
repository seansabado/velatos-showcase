// src/example-functions/validation.ts
// Tiny runtime validation helpers for function boundaries

export type ValidationError = {
  code: 'invalid-argument';
  message: string;
  details?: Record<string, unknown>;
};

export type ValidationResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: ValidationError };

type CreateOrderInput = {
  tenantId: string;
  branchId: string;
  registerId: string;
  shiftId: string;
  lines: Array<{ itemId: string; qty: number; unitPrice: number }>;
  paymentMethod: 'cash' | 'card' | 'other';
};

type ApproveExceptionInput = {
  tenantId: string;
  exceptionId: string;
};

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : null;
}

function isPositiveNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0;
}

function validateLines(raw: unknown): ValidationResult<CreateOrderInput['lines']> {
  if (!Array.isArray(raw) || raw.length === 0) {
    return {
      ok: false,
      error: { code: 'invalid-argument', message: 'lines must be a non-empty array' },
    };
  }

  const lines: CreateOrderInput['lines'] = [];
  for (const line of raw) {
    const rec = asRecord(line);
    if (!rec || typeof rec.itemId !== 'string' || !isPositiveNumber(rec.qty) || !isPositiveNumber(rec.unitPrice)) {
      return {
        ok: false,
        error: { code: 'invalid-argument', message: 'Each line must contain itemId, qty, and unitPrice' },
      };
    }

    lines.push({ itemId: rec.itemId, qty: rec.qty, unitPrice: rec.unitPrice });
  }

  return { ok: true, value: lines };
}

export function validateCreateOrderPayload(data: unknown): ValidationResult<CreateOrderInput> {
  const rec = asRecord(data);
  if (!rec) {
    return { ok: false, error: { code: 'invalid-argument', message: 'Payload must be an object' } };
  }

  const requiredStrings = ['tenantId', 'branchId', 'registerId', 'shiftId'] as const;
  for (const key of requiredStrings) {
    if (typeof rec[key] !== 'string' || (rec[key] as string).trim() === '') {
      return { ok: false, error: { code: 'invalid-argument', message: `Missing required field: ${key}` } };
    }
  }

  if (!['cash', 'card', 'other'].includes(String(rec.paymentMethod))) {
    return { ok: false, error: { code: 'invalid-argument', message: 'Invalid paymentMethod' } };
  }

  const linesResult = validateLines(rec.lines);
  if (!linesResult.ok) {
    return linesResult;
  }

  return {
    ok: true,
    value: {
      tenantId: rec.tenantId as string,
      branchId: rec.branchId as string,
      registerId: rec.registerId as string,
      shiftId: rec.shiftId as string,
      lines: linesResult.value,
      paymentMethod: rec.paymentMethod as CreateOrderInput['paymentMethod'],
    },
  };
}

export function validateApproveExceptionPayload(data: unknown): ValidationResult<ApproveExceptionInput> {
  const rec = asRecord(data);
  if (!rec) {
    return { ok: false, error: { code: 'invalid-argument', message: 'Payload must be an object' } };
  }

  if (typeof rec.tenantId !== 'string' || rec.tenantId.trim() === '') {
    return { ok: false, error: { code: 'invalid-argument', message: 'Missing tenantId' } };
  }

  if (typeof rec.exceptionId !== 'string' || rec.exceptionId.trim() === '') {
    return { ok: false, error: { code: 'invalid-argument', message: 'Missing exceptionId' } };
  }

  return {
    ok: true,
    value: {
      tenantId: rec.tenantId,
      exceptionId: rec.exceptionId,
    },
  };
}
