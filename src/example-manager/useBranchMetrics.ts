// src/example-manager/useBranchMetrics.ts
// Hook for loading branch performance metrics — fake/demo implementation

import { useState, useEffect } from 'react';
import { FAKE_BRANCH_METRICS } from './fakeMetrics';

export type BranchMetrics = {
  branchId: string;
  branchLabel: string;
  date: string;
  transactionCount: number;
  grossRevenue: number;
  voidCount: number;
  openExceptions: number;
  dailyClosed: boolean;
};

type MetricsState =
  | { status: 'loading' }
  | { status: 'ready'; metrics: BranchMetrics }
  | { status: 'error'; message: string };

/**
 * Loads today's branch metrics for the manager dashboard.
 *
 * In production: subscribes to an aggregated real-time document
 * updated by a Cloud Function after each transaction.
 *
 * Here: returns fake data after a simulated delay.
 */
export function useBranchMetrics(branchId: string, date: string): MetricsState {
  const [state, setState] = useState<MetricsState>({ status: 'loading' });

  useEffect(() => {
    setState({ status: 'loading' });

    const timeout = setTimeout(() => {
      if (branchId && date) {
        setState({ status: 'ready', metrics: FAKE_BRANCH_METRICS });
      } else {
        setState({ status: 'error', message: 'Invalid branch or date' });
      }
    }, 500);

    return () => clearTimeout(timeout);
  }, [branchId, date]);

  return state;
}
