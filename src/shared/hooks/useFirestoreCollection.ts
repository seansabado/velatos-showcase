// src/shared/hooks/useFirestoreCollection.ts
// Fake hook that simulates a real-time collection subscription pattern
// Not connected to any real database

import { useState, useEffect } from 'react';

type CollectionState<T> =
  | { status: 'loading' }
  | { status: 'ready'; items: T[] }
  | { status: 'error'; message: string };

type CollectionOptions = {
  orderBy?: string;
  limit?: number;
};

/**
 * Subscribes to a collection in a real-time data store.
 * Demonstrates the pattern used across all surfaces.
 *
 * In production: wraps the real-time collection listener from the database SDK.
 * Here: returns fake data after a simulated delay.
 *
 * @param path - Collection path, e.g. "tenants/acme_co/orders"
 * @param fakeItems - Fake items to return (demo only)
 * @param options - Ordering and limit options
 */
export function useFirestoreCollection<T>(
  path: string | null,
  fakeItems: T[] = [],
  options: CollectionOptions = {}
): CollectionState<T> {
  const [state, setState] = useState<CollectionState<T>>({ status: 'loading' });
  const { limit } = options;

  useEffect(() => {
    if (!path) {
      setState({ status: 'ready', items: [] });
      return;
    }

    setState({ status: 'loading' });

    const timeout = setTimeout(() => {
      const items = limit ? fakeItems.slice(0, limit) : fakeItems;
      setState({ status: 'ready', items });
    }, 400);

    return () => clearTimeout(timeout);
  }, [path, limit]);

  return state;
}
