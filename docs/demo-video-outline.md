# Demo Video Outline (90 Seconds)

## Goal
Provide a short walkthrough that helps recruiters and hiring managers understand the portfolio in under two minutes.

## Shot List
### 0:00 - 0:12
Open the repository README.
- show Executive Summary
- show Quick Proof Snapshot
- say: "This repo demonstrates enterprise ERP architecture patterns with reliability, security, and operational depth."

### 0:12 - 0:28
Open the live Pages demo.
- show scenario mode buttons
- click `Replay Storm`
- highlight queued -> retrying -> deduped -> resolved timeline

### 0:28 - 0:42
Scroll the live demo slightly.
- show Permission Gate example
- show Runbook Summary card
- say: "The demo is intentionally static, but it mirrors the operational stories represented in the code and docs."

### 0:42 - 0:58
Open code for replay protection.
- show `src/example-pos/syncEngine.ts`
- mention idempotency keys and deduped success behavior
- show test file for replay scenario proof

### 0:58 - 1:12
Open docs.
- show `docs/security-posture.md`
- show `docs/incident-walkthrough.md`
- show `docs/operations-runbook.md`
- say: "This is where the repo goes beyond scaffolding into operational thinking."

### 1:12 - 1:30
Show GitHub Actions badges / workflow page.
- point out CI, coverage, Pages
- close with: "The portfolio is designed to show not just implementation, but judgment under production constraints."

## Optional Narration Hooks
- "Offline continuity matters more than perfect connectivity in store operations."
- "Tenant boundaries are enforced from verified claims, not payload trust."
- "The goal is not just happy-path design, but replay-safe, auditable behavior."

## Assets to Show
- README
- Pages demo
- `src/example-pos/syncEngine.ts`
- `src/example-pos/__tests__/offlineReplayScenario.test.ts`
- `docs/security-posture.md`
- `docs/incident-walkthrough.md`
- GitHub Actions workflow pages
