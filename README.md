# velatos-showcase

![CI](https://github.com/seansabado/velatos-showcase/actions/workflows/ci.yml/badge.svg)

---

Created by  
**Sean Raynon**  
Founder & CTO — VelatOS  
https://m-msilver.co.jp  
https://www.linkedin.com/in/seanraynon/

---

## Overview

This repository is a **safe, non-proprietary showcase** of enterprise ERP architecture patterns used in production retail operations software. It demonstrates engineering decisions, module boundaries, offline strategies, multi-tenant isolation, and cloud function patterns — without exposing any real business logic, schemas, or proprietary code.

Think of this as an architectural portfolio: the kind of thinking that goes into a serious, production-grade ERP platform targeting Japanese boutique retail.

![VelatOS Architecture Banner](docs/assets/architecture-banner.svg)

Quick read for hiring review: [One-Page Case Study](docs/case-study.md)

---

## Hiring Signals

- CI-enforced quality gates: typecheck + coverage tests on push and PR
- Enterprise architecture depth: multi-tenant isolation, offline-first queueing, and append-only audit trail
- Production-style domain modeling: POS state machine, RMA lifecycle FSM, and finance reconciliation gates
- Security posture by design: token-claim tenant boundary + runtime payload validation before business logic
- Reviewable engineering artifacts: ADRs, sequence diagrams, and an interactive GitHub Pages demo

---

## What This Repo Demonstrates

| Area | Pattern |
|---|---|
| **Module boundaries** | POS, Manager Ops, Staff, Admin as isolated vertical slices |
| **Machine state** | XState-style offline-capable FSM for shift sessions and order lifecycle |
| **RMA lifecycle** | 9-state FSM with transition guards for return/repair/exchange flows |
| **Multi-tenancy** | Tenant guard at the function layer; per-tenant data isolation |
| **Internationalization** | JA/EN dual-language strategy with type-safe translation keys |
| **Offline-first** | Local queue + reconciliation pattern for unreliable connectivity |
| **Audit logging** | Append-only audit trail with actor, action, tenant, and timestamp |
| **Cloud functions** | Callable function patterns: auth → tenant guard → business logic → audit |
| **Permission model** | Action-level role gates with declarative React PermissionGate component |
| **Runtime validation** | Boundary payload parsing for untrusted input before business logic |
| **Finance operations** | Daily close and till reconciliation variance-gate pattern |
| **Architecture decisions** | ADRs documenting the "why" behind key design choices |
| **Unit tests** | Jest tests covering FSM guards and tenant isolation logic |
| **Shared infrastructure** | Typed hooks, utilities, and domain types used across all surfaces |

---

## What This Repo Does NOT Contain

- Real database schemas or Firestore collections from any production system
- Real API keys, service account credentials, or environment secrets
- Real business logic, pricing rules, or operational workflows
- Real customer, employee, or transaction data
- Any code that could be directly deployed to a production system

All data, IDs, and logic in this repo are **fabricated for demonstration purposes only**.

---

## How To Navigate

```
docs/                   Architecture and design decision records
  case-study.md         One-page recruiter-focused architecture brief
  assets/               Visual assets for README and docs
    architecture-banner.svg
  architecture.md       High-level system diagram and surface map
  module-design.md      How modules are bounded and composed
  i18n-strategy.md      Dual-language (JA/EN) approach
  offline-mode.md       Offline-first patterns and sync strategy
  multi-tenant-erp.md   Tenant isolation and data partitioning
  data-governance.md    Audit logging, access control, PII boundaries
  cloud-functions-patterns.md  Server-side callable function patterns
  decisions/            Architecture Decision Records (ADRs)
    adr-001-tenant-isolation.md
    adr-002-offline-first.md
    adr-003-japanese-primary-locale.md
  sequence-diagrams/    Mermaid sequence diagrams for key flows
    pos-order-flow.md
    offline-sync-flow.md
    rma-lifecycle.md

src/
  example-pos/          Fake POS surface: machine state, shift, orders
  example-manager/      Fake manager dashboard: branch metrics, approvals
  example-staff/        Fake staff panel: punch-in/out, schedule view
  example-rma/          Fake RMA module: 9-state FSM, line inspection
  example-finance/      Fake finance module: till reconciliation + daily close
  example-functions/    Fake Cloud Functions: auth, tenant guard, audit
    __tests__/          Unit tests for tenant guard and callable patterns
  shared/auth/          Permission utilities + React PermissionGate
  i18n/                 Fake JA/EN translation files + loader
  shared/               Cross-surface hooks, utils, and TypeScript types

site/
  index.html            GitHub Pages static interactive portfolio demo
```

Start with [`docs/architecture.md`](docs/architecture.md) for the big picture, then explore the `src/` modules to see the patterns in action.

---

## Running the Examples

These are TypeScript/React examples — they illustrate patterns, not a deployable app.

```bash
npm install
npm run typecheck   # zero-error TypeScript check
npm test            # Jest unit tests
npm run test:ci     # Coverage thresholds (used by CI)
```

---

## License

MIT — feel free to reference these patterns in your own work.

---

> "The architecture of a retail ERP is ultimately about trust boundaries: between cashiers and managers, between branches and head office, between connected and offline states."
