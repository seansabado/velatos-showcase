# Incident Walkthrough: POS Offline Replay Spike

## Incident Summary
- Date (simulated): 2026-05-08
- Surface: POS tablet sync engine
- Severity: SEV-2 (sales continuity maintained, reconciliation delayed)
- Duration: 34 minutes

## Customer Impact
- Cashiers could continue accepting orders offline.
- Manager dashboards showed delayed transaction counts.
- Shift close was blocked for affected registers until queue replay completed.

## Symptoms Observed
1. `syncStatus` stayed in `error` for multiple registers.
2. Dead-letter queue size increased after repeated replay attempts.
3. Duplicate mutations appeared in network traces after intermittent connectivity.

## Initial Hypotheses
1. API endpoint instability causing repeated replay failures.
2. Queue processor retry policy too aggressive for unstable links.
3. Duplicate client replays causing conflict errors after reconnect.

## Investigation Timeline
1. Checked action logs for `VOID_ORDER` conflicts and replay frequency.
2. Reviewed mutation attempts and `nextRetryAt` patterns.
3. Compared idempotency keys for duplicated payloads.
4. Verified whether dedupe was applied before side effects.

## Root Cause
A reconnect storm triggered repeated submissions of the same queued mutation. Without deterministic idempotency handling at replay-time, duplicate attempts created conflict-like behavior and excess dead-letter entries.

## Mitigation Applied
1. Added idempotency-key based dedupe in sync engine.
2. Returned `ok + deduped` response semantics for replayed keys.
3. Preserved backoff schedule (1s / 3s / 8s) and dead-letter fallback.
4. Kept shift-close gate to prevent closing with unsynced work.

## Validation
- Added end-to-end scenario test showing:
  - offline queue creation
  - reconnect replay
  - duplicate replay dedupe
  - audit-style timeline output
- Re-ran full suite and coverage gate in CI.

## Prevention Actions
1. Add dashboard metric for deduped replay count per register.
2. Alert on dead-letter growth rate, not just absolute size.
3. Add contract test requiring stable idempotency key policy for new mutation types.
4. Add operational runbook step for replay storm diagnosis.

## What This Demonstrates
The system prioritizes revenue continuity under network instability while retaining reconciliation integrity through explicit queue gates, retries, dedupe, and auditability.
