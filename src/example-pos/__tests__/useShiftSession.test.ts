import { computeRetryDelayMs, simulateServerSync } from '../syncEngine';
import type { SyncMutation } from '../syncEngine';

function makeMutation(overrides: Partial<SyncMutation> = {}): SyncMutation {
  return {
    id: 'm1',
    type: 'CREATE_ORDER',
    payload: { orderId: 'o1' },
    attempts: 0,
    ...overrides,
  };
}

describe('computeRetryDelayMs', () => {
  it('returns short delay for first retry', () => {
    expect(computeRetryDelayMs(1)).toBe(1000);
  });

  it('returns medium delay for second retry', () => {
    expect(computeRetryDelayMs(2)).toBe(3000);
  });

  it('returns long delay for third+ retry', () => {
    expect(computeRetryDelayMs(3)).toBe(8000);
    expect(computeRetryDelayMs(8)).toBe(8000);
  });
});

describe('simulateServerSync', () => {
  it('fails when offline', async () => {
    const result = await simulateServerSync(makeMutation(), false);
    expect(result).toEqual({ ok: false, error: 'Network offline' });
  });

  it('fails first VOID_ORDER attempt then succeeds later', async () => {
    const first = await simulateServerSync(makeMutation({ type: 'VOID_ORDER', attempts: 0 }), true);
    const second = await simulateServerSync(makeMutation({ type: 'VOID_ORDER', attempts: 1 }), true);

    expect(first).toEqual({ ok: false, error: 'Conflict: order lock not released yet' });
    expect(second).toEqual({ ok: true });
  });

  it('fails on forced failure payload', async () => {
    const result = await simulateServerSync(
      makeMutation({ payload: { forceFail: true } }),
      true
    );
    expect(result).toEqual({ ok: false, error: 'Server rejected mutation payload' });
  });

  it('succeeds for normal create order mutation when online', async () => {
    const result = await simulateServerSync(makeMutation(), true);
    expect(result).toEqual({ ok: true });
  });
});
