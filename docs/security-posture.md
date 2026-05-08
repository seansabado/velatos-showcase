# Security Posture (Threat Model Lite)

## Scope
This is a non-proprietary architecture showcase, not a production deployment. The goal of this document is to show security reasoning and trust boundaries used in enterprise ERP design.

## Trust Boundaries
1. Client UI (POS/Manager/Staff/Admin) is untrusted input surface.
2. Function pipeline is the first trusted enforcement boundary.
3. Tenant-scoped data access is derived from verified auth claims.
4. Audit trail is append-only and treated as evidence stream.

## Threat Assumptions
- Attackers may control client payloads.
- Attackers may replay previously captured mutations.
- Legitimate users may attempt privilege escalation.
- Network instability can cause duplicate submissions and partial processing.

## Key Controls
- Auth verification before any business logic.
- Tenant guard using token claims, never payload tenantId.
- Role-gated actions via permission matrix and UI guard.
- Runtime payload validation to block malformed input.
- Idempotency keys in sync engine to prevent duplicate apply on replay.
- Dead-letter queue for non-recoverable sync failures.
- Append-only audit logging for sensitive actions.

## Threat Scenarios
### Tenant breakout attempt
- Scenario: caller sends payload with another tenantId.
- Detection: tenant guard mismatch check.
- Mitigation: reject with permission-denied.
- Residual risk: misconfigured guard call in new function.

### Replay submission (duplicate mutation)
- Scenario: same mutation resent after timeout/connection flap.
- Detection: idempotency key already processed.
- Mitigation: return deduped success without re-applying side effects.
- Residual risk: inconsistent key strategy across modules.

### Privilege escalation attempt
- Scenario: cashier invokes manager-only action.
- Detection: role hierarchy check.
- Mitigation: block operation and log denied attempt metadata.
- Residual risk: action matrix drift if not reviewed.

### Offline sync storm
- Scenario: prolonged outage creates large queue and repeated failures.
- Detection: sync status error + dead-letter growth.
- Mitigation: backoff retry policy and manual requeue controls.
- Residual risk: queue persistence/storage limits.

## Security Tradeoffs
- Favoring offline continuity increases sync-path complexity.
- Append-only logging increases storage but improves forensics.
- Strict boundaries reduce accidental coupling but require discipline in new modules.

## Future Hardening
1. Signed mutation envelopes and nonce windows.
2. Automatic idempotency key policy validation tests per module.
3. Security regression checklist in CI for high-risk files.
4. Structured denial telemetry dashboard.
