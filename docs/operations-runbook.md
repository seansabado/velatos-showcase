# Operations Runbook: Offline Replay and Dead-Letter Triage

## Purpose
This runbook describes how to diagnose and stabilize offline replay issues in the POS sync path when queues, retries, or dead-letter entries spike.

## Scope
- POS offline queue replay
- Retry/backoff behavior
- Idempotency dedupe behavior
- Dead-letter queue recovery workflow

## Signals to Watch
1. `syncStatus` remains `error` for more than 5 minutes.
2. Dead-letter queue count grows over consecutive replay cycles.
3. Repeated conflict-like errors on the same mutation type.
4. Duplicate replay events without deduped success markers.
5. Shift-close blocked due to unsynced queue.

## Triage Checklist
1. Confirm current online status and recent network flaps.
2. Inspect queue size, dead-letter size, and next retry windows.
3. Identify top failing mutation type (`CREATE_ORDER`, `VOID_ORDER`, etc.).
4. Verify idempotency keys are present and deterministic.
5. Check if failures are transient (retryable) or permanent (validation/contract).

## Recovery Procedure
1. Pause manual close attempts while queue is non-empty.
2. Trigger replay once connectivity is stable.
3. If a mutation repeatedly fails, move it to dead-letter queue.
4. Review dead-letter payload for obvious contract issues.
5. Requeue dead-letter entries after correction or stabilization.
6. Confirm deduped success for duplicate replays.
7. Verify queue drains to zero and status returns to `idle`.

## Severity Guide
- SEV-3: Small queue growth, no dead-letter accumulation, business flow continues.
- SEV-2: Queue growth + dead-letter entries, delayed reconciliation, no sales outage.
- SEV-1: Prolonged replay failure blocks operations across multiple registers.

## Escalation
Escalate when any condition is met:
- Dead-letter queue keeps growing after two controlled requeue attempts.
- Same mutation fails > 3 replay cycles across multiple branches.
- Shift-close blocked for > 30 minutes in active trading window.

## Post-Incident Actions
1. Add or refine idempotency key policy for affected mutation type.
2. Add regression scenario test reproducing the failure path.
3. Record a short incident note (symptom -> root cause -> fix).
4. Update runbook if triage steps changed.

## Related Artifacts
- Incident example: `docs/incident-walkthrough.md`
- Security controls: `docs/security-posture.md`
- Replay scenario test: `src/example-pos/__tests__/offlineReplayScenario.test.ts`
