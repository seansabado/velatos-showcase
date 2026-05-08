# Observability Model

## Goal
Demonstrate how this architecture would be monitored in a production-style environment.

## Golden Signals
1. Traffic: mutation replay volume per register / branch
2. Errors: failed sync attempts, dead-letter insertions, denied actions
3. Latency: replay completion time, queue drain time
4. Saturation: queue depth, dead-letter depth, retries per mutation

## Core Metrics
- `sync.queue_depth`
- `sync.dead_letter_depth`
- `sync.retry_count`
- `sync.deduped_replay_count`
- `sync.replay_duration_ms`
- `auth.permission_denied_count`
- `reconciliation.close_blocked_count`

## Alert Thresholds
- Queue depth > 20 for 10 minutes: warning
- Dead-letter depth > 5 for 5 minutes: critical
- Deduped replay count spike > 3x baseline: investigate reconnect storm
- Permission denied spike > 2x baseline: review privilege misuse or UI drift

## Example Dashboards
1. Register Health
   - queue depth by register
   - replay duration p95
   - dead-letter growth trend
2. Security & Control
   - permission denied events
   - tenant mismatch rejects
   - deduped replay count
3. Finance Ops
   - blocked daily close count
   - reconciliation variance distribution

## Operational Questions This Answers
- Are offline queues draining fast enough after reconnect?
- Are we seeing duplicate replay storms?
- Which branches are accumulating dead-letter entries?
- Are permission failures a user behavior issue or a contract issue?
