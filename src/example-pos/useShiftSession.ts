// src/example-pos/useShiftSession.ts
// Demonstrates shift session management with offline queue support
// Not connected to any real system

import { useState, useCallback, useEffect, useRef } from 'react';
import type { ShiftSession, Order } from '../shared/types/pos';
import { generateId } from '../shared/utils/id';
import {
  computeRetryDelayMs,
  simulateServerSync,
  createSyncRuntimeState,
  getIdempotencyKey,
} from './syncEngine';

export type QueuedMutation = {
  id: string;
  type: 'CREATE_ORDER' | 'VOID_ORDER' | 'CLOSE_SHIFT';
  payload: unknown;
  idempotencyKey: string;
  createdAt: string;
  attempts: number;
  lastError: string | null;
  nextRetryAt: string | null;
};

type ShiftState = {
  session: ShiftSession | null;
  offlineQueue: QueuedMutation[];
  deadLetterQueue: QueuedMutation[];
  syncStatus: 'idle' | 'syncing' | 'error';
  lastSyncAt: string | null;
  isOnline: boolean;
};

type ShiftActions = {
  openShift: (registerId: string, cashierId: string) => void;
  closeShift: () => void;
  addOrder: (order: Omit<Order, 'id' | 'syncedAt'>) => string;
  voidOrder: (orderId: string, reason: string) => void;
  flushQueue: () => Promise<void>;
  retryFailedMutations: () => void;
  state: ShiftState;
};

const MAX_SYNC_ATTEMPTS = 3;

/**
 * Manages a POS shift session with offline queue support.
 *
 * Key properties:
 * - All mutations are added to the offline queue immediately (optimistic).
 * - When online, the queue is flushed in insertion order.
 * - Shift cannot close while the queue has unsynced mutations.
 * - The queue is persisted to localStorage in production; here it's in-memory.
 */
export function useShiftSession(isOnline: boolean): ShiftActions {
  const syncRuntimeRef = useRef(createSyncRuntimeState());
  const [state, setState] = useState<ShiftState>({
    session: null,
    offlineQueue: [],
    deadLetterQueue: [],
    syncStatus: 'idle',
    lastSyncAt: null,
    isOnline,
  });

  useEffect(() => {
    setState((prev) => ({ ...prev, isOnline }));
  }, [isOnline]);

  const openShift = useCallback((registerId: string, cashierId: string): void => {
    const session: ShiftSession = {
      id: generateId(),
      tenantId: 'demo-tenant',
      branchId: 'branch-shibuya',
      registerId,
      cashierId,
      openedAt: new Date().toISOString(),
      closedAt: null,
      suspendedAt: null,
      transactionCount: 0,
      grossRevenue: 0,
    };
    setState((prev) => ({ ...prev, session }));
  }, []);

  const addOrder = useCallback((order: Omit<Order, 'id' | 'syncedAt'>): string => {
    const id = generateId();
    const mutation: QueuedMutation = {
      id: generateId(),
      type: 'CREATE_ORDER',
      payload: { ...order, id, syncedAt: null },
      idempotencyKey: '',
      createdAt: new Date().toISOString(),
      attempts: 0,
      lastError: null,
      nextRetryAt: null,
    };
    mutation.idempotencyKey = getIdempotencyKey(mutation);

    setState((prev) => ({
      ...prev,
      offlineQueue: [...prev.offlineQueue, mutation],
      session: prev.session
        ? {
            ...prev.session,
            transactionCount: prev.session.transactionCount + 1,
            grossRevenue: prev.session.grossRevenue + order.total,
          }
        : null,
    }));

    return id;
  }, []);

  const voidOrder = useCallback((orderId: string, reason: string): void => {
    const mutation: QueuedMutation = {
      id: generateId(),
      type: 'VOID_ORDER',
      payload: { orderId, reason, voidedAt: new Date().toISOString() },
      idempotencyKey: '',
      createdAt: new Date().toISOString(),
      attempts: 0,
      lastError: null,
      nextRetryAt: null,
    };
    mutation.idempotencyKey = getIdempotencyKey(mutation);

    setState((prev) => ({
      ...prev,
      offlineQueue: [...prev.offlineQueue, mutation],
    }));
  }, []);

  const closeShift = useCallback((): void => {
    setState((prev) => {
      if (!prev.session) return prev;
      if (prev.offlineQueue.length > 0) {
        console.warn('Cannot close shift with pending offline queue items');
        return prev;
      }
      return {
        ...prev,
        session: { ...prev.session, closedAt: new Date().toISOString() },
      };
    });
  }, []);

  /**
   * Flushes the offline queue in insertion order.
   * In production: sends each mutation to the server; removes on success;
   * moves to error queue on permanent failure.
   */
  const flushQueue = useCallback(async (): Promise<void> => {
    if (!state.isOnline || state.offlineQueue.length === 0) {
      return;
    }

    setState((prev) => ({ ...prev, syncStatus: 'syncing' }));

    let hadError = false;

    for (const queued of state.offlineQueue) {
      if (queued.nextRetryAt && new Date(queued.nextRetryAt).getTime() > Date.now()) {
        hadError = true;
        continue;
      }

      const result = await simulateServerSync(queued, state.isOnline, syncRuntimeRef.current);

      if (result.ok) {
        setState((prev) => ({
          ...prev,
          offlineQueue: prev.offlineQueue.filter((m) => m.id !== queued.id),
        }));
        continue;
      }

      hadError = true;
      setState((prev) => {
        const nextAttempts = queued.attempts + 1;
        const exceedsRetries = nextAttempts >= MAX_SYNC_ATTEMPTS;
        const nextRetryAt = new Date(Date.now() + computeRetryDelayMs(nextAttempts)).toISOString();

        if (exceedsRetries) {
          const failedMutation: QueuedMutation = {
            ...queued,
            attempts: nextAttempts,
            lastError: result.error,
            nextRetryAt,
          };

          return {
            ...prev,
            offlineQueue: prev.offlineQueue.filter((m) => m.id !== queued.id),
            deadLetterQueue: [...prev.deadLetterQueue, failedMutation],
          };
        }

        return {
          ...prev,
          offlineQueue: prev.offlineQueue.map((m) =>
            m.id === queued.id
              ? {
                  ...m,
                  attempts: nextAttempts,
                  lastError: result.error,
                  nextRetryAt,
                }
              : m
          ),
        };
      });
    }

    setState((prev) => ({
      ...prev,
      syncStatus: hadError ? 'error' : 'idle',
      lastSyncAt: new Date().toISOString(),
    }));
  }, [state.offlineQueue, state.isOnline]);

  const retryFailedMutations = useCallback((): void => {
    setState((prev) => ({
      ...prev,
      offlineQueue: [
        ...prev.offlineQueue,
        ...prev.deadLetterQueue.map((m) => ({
          ...m,
          attempts: 0,
          lastError: null,
          nextRetryAt: null,
        })),
      ],
      deadLetterQueue: [],
    }));
  }, []);

  return { openShift, closeShift, addOrder, voidOrder, flushQueue, retryFailedMutations, state };
}
