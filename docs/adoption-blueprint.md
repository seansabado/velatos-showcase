# Adoption Blueprint

## Goal
Provide a phased plan for organizations that want to adapt these architecture patterns into an internal ERP initiative.

## Phase 1: Pilot (2-4 weeks)

### Scope
- One branch or one controlled environment
- POS queue + replay pattern
- Core tenant guard + role gating

### Deliverables
- Baseline observability dashboard
- Replay and dead-letter runbook
- Initial contract definitions for key events

### Exit Criteria
- Queue drain time within target
- Dead-letter growth under threshold
- No unresolved tenant boundary violations

## Phase 2: Hardening (4-8 weeks)

### Scope
- Expand to additional branches/environments
- Add persistent queue adapter
- Add stronger contract tests and replay stress tests

### Deliverables
- Idempotency policy enforcement tests
- Security posture review
- Incident response drill and postmortem template

### Exit Criteria
- Replay dedupe behavior validated under load
- Permission denial telemetry stable and explainable
- Incident MTTR trending downward

## Phase 3: Controlled Rollout (8-12 weeks)

### Scope
- Multi-branch rollout with staged gates
- Formal release governance for contracts and docs

### Deliverables
- Change management and rollback strategy
- Adoption metrics by branch
- Production-ready alert thresholds and on-call playbook

### Exit Criteria
- Targeted operational KPIs consistently met
- No critical unresolved dead-letter backlogs
- Leadership sign-off on risk and rollback posture

## Risk Gates

1. Tenant Isolation Gate: Any cross-tenant access defect blocks rollout.
2. Replay Integrity Gate: Duplicate replay side effects block rollout.
3. Ops Gate: Dead-letter and queue SLOs must hold for two consecutive release windows.
4. Security Gate: Permission-denied anomalies must be investigated before expansion.

## KPI Examples

- Queue depth p95
- Replay completion time p95
- Dead-letter rate per 1,000 mutations
- Deduped replay rate
- Permission-denied event rate
- Daily close blocked count
