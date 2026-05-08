// src/example-pos/useShiftSession.ts
// Demonstrates shift session management with offline queue support
// Not connected to any real system

import { useState, useCallback } from 'react';
import type { ShiftSession, Order } from '../shared/types/pos';
import { generateId } from '../shared/utils/id';

type QueuedMutation = {
  id: string;
  type: 'CREATE_ORDER' | 'VOID_ORDER' | 'CLOSE_SHIFT';
  payload: unknown;
  createdAt: string;
  attempts: number;
};

type ShiftState = {
  session: ShiftSession | null;
  offlineQueue: QueuedMutation[];
  isOnline: boolean;
};

type ShiftActions = {
  openShift: (registerId: string, cashierId: string) => void;
  closeShift: () => void;
  addOrder: (order: Omit<Order, 'id' | 'syncedAt'>) => string;
  voidOrder: (orderId: string, reason: string) => void;
  flushQueue: () => Promise<void>;
  state: ShiftState;
};

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
  const [state, setState] = useState<ShiftState>({
    session: null,
    offlineQueue: [],
    isOnline,
  });

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
      createdAt: new Date().toISOString(),
      attempts: 0,
    };

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
      createdAt: new Date().toISOString(),
      attempts: 0,
    };

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
    for (const mutation of state.offlineQueue) {
      // Simulated server sync — replace with real API call in production
      await new Promise<void>((resolve) => setTimeout(resolve, 50));
      setState((prev) => ({
        ...prev,
        offlineQueue: prev.offlineQueue.filter((m) => m.id !== mutation.id),
      }));
    }
  }, [state.offlineQueue]);

  return { openShift, closeShift, addOrder, voidOrder, flushQueue, state };
}
