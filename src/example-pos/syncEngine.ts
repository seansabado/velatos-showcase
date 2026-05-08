// src/example-pos/syncEngine.ts
// Standalone sync engine utilities for offline queue replay behavior

export type SyncMutation = {
  id: string;
  type: 'CREATE_ORDER' | 'VOID_ORDER' | 'CLOSE_SHIFT';
  payload: unknown;
  attempts: number;
  idempotencyKey?: string;
};

export type SyncRuntimeState = {
  processedIdempotencyKeys: Set<string>;
};

export function createSyncRuntimeState(): SyncRuntimeState {
  return {
    processedIdempotencyKeys: new Set<string>(),
  };
}

export function getIdempotencyKey(mutation: SyncMutation): string {
  if (mutation.idempotencyKey && mutation.idempotencyKey.trim() !== '') {
    return mutation.idempotencyKey;
  }

  return `${mutation.type}:${mutation.id}`;
}

export function computeRetryDelayMs(attempts: number): number {
  if (attempts <= 1) return 1_000;
  if (attempts === 2) return 3_000;
  return 8_000;
}

export async function simulateServerSync(
  mutation: SyncMutation,
  online: boolean,
  runtimeState: SyncRuntimeState = createSyncRuntimeState()
): Promise<{ ok: true; deduped: boolean } | { ok: false; error: string }> {
  if (!online) {
    return { ok: false, error: 'Network offline' };
  }

  const idempotencyKey = getIdempotencyKey(mutation);
  if (runtimeState.processedIdempotencyKeys.has(idempotencyKey)) {
    return { ok: true, deduped: true };
  }

  await new Promise<void>((resolve) => setTimeout(resolve, 50));

  const forcedFailure = typeof mutation.payload === 'object' && mutation.payload !== null
    ? Boolean((mutation.payload as Record<string, unknown>).forceFail)
    : false;

  if (forcedFailure) {
    return { ok: false, error: 'Server rejected mutation payload' };
  }

  if (mutation.type === 'VOID_ORDER' && mutation.attempts === 0) {
    return { ok: false, error: 'Conflict: order lock not released yet' };
  }

  runtimeState.processedIdempotencyKeys.add(idempotencyKey);
  return { ok: true, deduped: false };
}