# VelatOS Showcase Case Study (1-Page Recruiter Brief)

## Problem Space
Boutique retail ERP systems have hard constraints that generic SaaS demos rarely capture:
- intermittent connectivity on store tablets
- strict tenant isolation in shared infrastructure
- auditability for operational and financial actions
- role-based access boundaries across cashier, manager, and admin workflows

This repository demonstrates how those constraints are handled through architecture and contracts, without exposing proprietary logic.

## Solution Snapshot
The codebase is organized around explicit boundaries:
- front-end surfaces: POS, Manager Ops, Staff Mobile, Admin
- function pipeline: auth -> tenant guard -> validation -> business logic -> audit
- domain engines: POS FSM, RMA FSM, finance reconciliation gates
- shared primitives: strict TypeScript types, hooks, formatters, translation layer

## What Makes It Enterprise-Relevant
1. Tenant isolation by token claims, not payload trust
2. Offline-first mutation queue with deterministic replay
3. Append-only audit logging for sensitive operations
4. Runtime validation before domain execution
5. Decision capture via ADRs and sequence diagrams

## Technical Proof Signals
- strict TypeScript project configuration
- CI with typecheck and coverage-gated tests
- focused unit tests for access control, validation, and domain helpers
- architecture docs + ADRs + Mermaid flows for reviewer clarity
- GitHub Pages interactive demo to quickly inspect patterns

## Recruiter / Hiring Manager Read Path (10 minutes)
1. Start at README for scope and constraints
2. Scan architecture + multi-tenant + offline docs
3. Review function pipeline and permission guard examples
4. Open RMA and finance modules for domain depth
5. Check test suites and CI workflow for engineering discipline

## Scope and Safety
This is a non-proprietary showcase. It intentionally excludes:
- production schemas and credentials
- real customer or transaction data
- deployable production business rules

## Outcome
The portfolio demonstrates not only coding ability, but system design judgment under real operational constraints: reliability, trust boundaries, and maintainability.
