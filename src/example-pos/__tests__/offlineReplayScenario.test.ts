import { runOfflineReplayScenario } from '../replayScenario';

describe('runOfflineReplayScenario', () => {
  it('completes with zero pending queue and dedupes duplicate replay', async () => {
    const result = await runOfflineReplayScenario();

    expect(result.finalQueueSize).toBe(0);
    expect(result.deadLetterSize).toBe(0);
    expect(result.dedupedCount).toBe(1);

    expect(result.events.some((e) => e.action === 'queued')).toBe(true);
    expect(result.events.some((e) => e.action === 'sync_success')).toBe(true);
    expect(result.events.some((e) => e.action === 'sync_deduped')).toBe(true);
  });

  it('produces event timeline with idempotency keys for auditability', async () => {
    const result = await runOfflineReplayScenario();

    for (const event of result.events) {
      expect(event.idempotencyKey).toBeTruthy();
      expect(event.idempotencyKey).toMatch(/^CREATE_ORDER:/);
      expect(event.at).toMatch(/T/);
    }
  });
});
