// src/shared/hooks/useFirestoreDoc.ts
// Fake hook that simulates a real-time document subscription pattern
// Not connected to any real database

import { useState, useEffect } from 'react';

type DocState<T> =
  | { status: 'loading' }
  | { status: 'ready'; data: T }
  | { status: 'not-found' }
  | { status: 'error'; message: string };

/**
 * Subscribes to a single document in a real-time data store.
 * Demonstrates the pattern used across all surfaces.
 *
 * In production: wraps the real-time listener from the database SDK.
 * Here: returns fake data after a simulated delay.
 *
 * @param path - Dot-notation path, e.g. "tenants/acme_co/orders/ORD-001"
 * @param fakeData - Fake data to return (demo only)
 */
export function useFirestoreDoc<T>(
  path: string | null,
  fakeData?: T
): DocState<T> {
  const [state, setState] = useState<DocState<T>>({ status: 'loading' });

  useEffect(() => {
    if (!path) {
      setState({ status: 'not-found' });
      return;
    }

    setState({ status: 'loading' });

    // Simulate async fetch
    const timeout = setTimeout(() => {
      if (fakeData !== undefined) {
        setState({ status: 'ready', data: fakeData });
      } else {
        setState({ status: 'not-found' });
      }
    }, 400);

    return () => clearTimeout(timeout);
  }, [path]);

  return state;
}
