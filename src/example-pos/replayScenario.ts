// src/example-pos/replayScenario.ts
// Pure scenario runner for offline replay behavior with audit-style timeline output

import {
  createSyncRuntimeState,
  getIdempotencyKey,
  simulateServerSync,
  type SyncMutation,
} from './syncEngine';

export type ScenarioAuditEvent = {
  at: string;
  action: 'queued' | 'sync_success' | 'sync_failed' | 'sync_deduped';
  mutationId: string;
  idempotencyKey: string;
  details: string;
};

export type OfflineReplayScenarioResult = {
  finalQueueSize: number;
  deadLetterSize: number;
  dedupedCount: number;
  events: ScenarioAuditEvent[];
};

function nowIso(): string {
  return new Date().toISOString();
}

function addEvent(
  events: ScenarioAuditEvent[],
  mutation: SyncMutation,
  action: ScenarioAuditEvent['action'],
  details: string
): void {
  events.push({
    at: nowIso(),
    action,
    mutationId: mutation.id,
    idempotencyKey: getIdempotencyKey(mutation),
    details,
  });
}

/**
 * Simulates a realistic flow:
 * 1) Queue mutation while offline
 * 2) Reconnect and sync
 * 3) Receive duplicate replay
 * 4) Dedupe duplicate without re-applying side effects
 */
export async function runOfflineReplayScenario(): Promise<OfflineReplayScenarioResult> {
  const runtime = createSyncRuntimeState();
  const events: ScenarioAuditEvent[] = [];

  const queued: SyncMutation[] = [
    {
      id: 'mutation-order-001',
      type: 'CREATE_ORDER',
      payload: { orderId: 'order-001', total: 5500 },
      attempts: 0,
      idempotencyKey: 'CREATE_ORDER:order-001',
    },
  ];

  addEvent(events, queued[0], 'queued', 'Queued mutation while offline');

  const firstAttempt = await simulateServerSync(queued[0], true, runtime);
  if (!firstAttempt.ok) {
    addEvent(events, queued[0], 'sync_failed', firstAttempt.error);
    return {
      finalQueueSize: 1,
      deadLetterSize: 0,
      dedupedCount: 0,
      events,
    };
  }

  addEvent(events, queued[0], firstAttempt.deduped ? 'sync_deduped' : 'sync_success', 'Initial replay after reconnect');

  // Duplicate replay of the same mutation
  const duplicateAttempt = await simulateServerSync(queued[0], true, runtime);
  if (!duplicateAttempt.ok) {
    addEvent(events, queued[0], 'sync_failed', duplicateAttempt.error);
    return {
      finalQueueSize: 0,
      deadLetterSize: 0,
      dedupedCount: 0,
      events,
    };
  }

  addEvent(
    events,
    queued[0],
    duplicateAttempt.deduped ? 'sync_deduped' : 'sync_success',
    duplicateAttempt.deduped
      ? 'Duplicate replay ignored via idempotency key'
      : 'Duplicate replay unexpectedly applied'
  );

  return {
    finalQueueSize: 0,
    deadLetterSize: 0,
    dedupedCount: events.filter((e) => e.action === 'sync_deduped').length,
    events,
  };
}
