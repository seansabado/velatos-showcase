// src/example-functions/auditLogger.ts
// Fake audit logger — demonstrates the append-only audit pattern

import type { AuthClaims } from '../shared/types/tenant';
import type { AuditAction, AuditEntry } from '../shared/types/audit';
import { generateId } from '../shared/utils/id';

/**
 * Appends a single audit log entry.
 *
 * Design rules enforced here:
 * 1. This function is ALWAYS called — there is no code path that mutates
 *    data without also calling logAudit. This is enforced by code review.
 * 2. The function is fire-and-forget from the caller's perspective.
 *    It must never throw in a way that blocks the response to the client.
 * 3. metadata must never contain PII. The caller is responsible for this.
 *    In production: a PII scanner runs in CI to catch violations.
 *
 * @param claims     - Verified auth claims of the actor
 * @param action     - The action being logged (from the AuditAction enum)
 * @param resourceType - Type of the affected resource ("order", "shift", etc.)
 * @param resourceId - ID of the affected resource
 * @param result     - Whether the operation succeeded or failed
 * @param metadata   - Non-PII contextual data (counts, flags, status codes)
 */
export async function logAudit(
  claims: AuthClaims,
  action: AuditAction,
  resourceType: string,
  resourceId: string,
  result: 'success' | 'failure',
  metadata: Record<string, string | number | boolean> = {}
): Promise<void> {
  const entry: AuditEntry = {
    id: generateId(),
    tenantId: claims.tenantId,
    actorId: claims.uid,
    actorRole: claims.role,
    branchId: claims.branchId ?? null,
    action,
    resourceType,
    resourceId,
    result,
    metadata,
    occurredAt: new Date().toISOString(),
  };

  try {
    // In production: write to append-only audit collection in data store.
    // Here: log to console for demonstration.
    console.log('[AUDIT]', JSON.stringify(entry));
  } catch (err) {
    // Audit failure must never block the response.
    // In production: report to internal alerting (e.g., Sentry, PagerDuty).
    console.error('[AUDIT ERROR]', err);
  }
}

/**
 * Convenience wrapper for logging a failed operation with an error code.
 */
export async function logAuditFailure(
  claims: AuthClaims,
  action: AuditAction,
  resourceType: string,
  resourceId: string,
  errorCode: string
): Promise<void> {
  return logAudit(claims, action, resourceType, resourceId, 'failure', { errorCode });
}
