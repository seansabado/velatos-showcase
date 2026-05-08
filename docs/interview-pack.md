# System Design Interview Pack

## 1. Why function-layer tenant isolation instead of trusting payloads?
- Verified auth claims are harder to spoof than client payloads.
- Keeps the trust boundary explicit and reviewable.
- Adds defense in depth even if downstream rules drift.

## 2. Why offline-first instead of graceful degradation?
- Retail operations cannot stop during connectivity loss.
- Queue + replay preserves business continuity.
- Tradeoff: more sync complexity and failure handling.

## 3. How do you prevent duplicate replays?
- Deterministic idempotency keys per mutation.
- Replay runtime tracks processed keys.
- Duplicate replays return deduped success without reapplying side effects.

## 4. Why append-only audit logs?
- Preserves evidence quality and operational traceability.
- Simpler forensic reasoning than mutable logs.
- Tradeoff: more storage and retention planning.

## 5. How do you think about role-based access?
- Explicit role hierarchy.
- Action-level permission map.
- UI gating is convenience only; server-side enforcement remains authoritative.

## 6. Why strict TypeScript and runtime validation together?
- TypeScript protects trusted code paths.
- Runtime validation protects untrusted inputs at boundaries.
- Together they reduce both developer mistakes and malformed requests.

## 7. What would you monitor first in production?
- queue depth
- dead-letter growth
- deduped replay spikes
- permission denied spikes
- replay latency

## 8. What tradeoff did you make intentionally?
- Accepted more operational complexity in the sync path to preserve store continuity under poor networking.

## 9. What would you improve next?
- persistent queue adapters
- richer scenario flows
- automated coverage badge generation
- stronger contract tests per mutation type

## 10. Why is this a credible architecture portfolio and not just scaffolding?
- It includes docs, ADRs, CI, tests, reliability controls, and incident/runbook artifacts in addition to code structure.
