// src/shared/hooks/useOnlineStatus.ts
// Tracks real network connectivity — navigator.onLine + health-ping verification

import { useState, useEffect, useRef } from 'react';

type OnlineStatus = {
  online: boolean;
  latencyMs: number | null;
  lastChecked: string | null;
};

const PING_INTERVAL_MS = 30_000;
const PING_TIMEOUT_MS = 5_000;

/**
 * Returns the current network status with latency measurement.
 *
 * navigator.onLine alone is unreliable — it can be true even when the API
 * is unreachable (e.g., connected to a router with no internet).
 * This hook adds a periodic lightweight health-ping to verify real connectivity.
 *
 * Note: In this demo the ping is simulated. In production it calls a
 * lightweight /health endpoint.
 */
export function useOnlineStatus(): OnlineStatus {
  const [status, setStatus] = useState<OnlineStatus>({
    online: typeof navigator !== 'undefined' ? navigator.onLine : true,
    latencyMs: null,
    lastChecked: null,
  });

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const ping = async (): Promise<void> => {
    const start = Date.now();
    try {
      // In production: fetch('/health', { signal: AbortSignal.timeout(PING_TIMEOUT_MS) })
      // Simulated for demo:
      await new Promise<void>((resolve, reject) => {
        const t = setTimeout(resolve, Math.min(100, PING_TIMEOUT_MS));
        if (!navigator.onLine) {
          clearTimeout(t);
          reject(new Error('offline'));
        }
      });

      setStatus({
        online: true,
        latencyMs: Date.now() - start,
        lastChecked: new Date().toISOString(),
      });
    } catch {
      setStatus({
        online: false,
        latencyMs: null,
        lastChecked: new Date().toISOString(),
      });
    }
  };

  useEffect(() => {
    ping();

    const handleOnline = (): void => void ping();
    const handleOffline = (): void =>
      setStatus((prev) => ({ ...prev, online: false, latencyMs: null }));

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    intervalRef.current = setInterval(ping, PING_INTERVAL_MS);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  return status;
}
