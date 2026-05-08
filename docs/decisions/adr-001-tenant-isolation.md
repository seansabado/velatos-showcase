# ADR-001: Tenant Isolation at the Function Layer

**Status:** Accepted  
**Date:** 2026-04-01  
**Author:** Sean Raynon

---

## Context

The platform serves multiple independent tenants (retail companies) from shared infrastructure. The core security requirement is that Tenant A can never read or write Tenant B's data, even in the presence of bugs or malicious input.

There are two common approaches to enforcing this:
1. **Client-side enforcement** — the client builds requests scoped to its tenant, and the database rules verify the tenant ID in the request payload.
2. **Function-layer enforcement** — a dedicated server-side step extracts the tenant ID from the verified auth token and uses it to scope all data access, ignoring any tenant ID in the payload.

---

## Decision

**Tenant isolation is enforced at the function layer, using the tenant ID from the verified auth token — never from the request payload.**

The flow is:
1. Auth token is verified by the runtime (cannot be forged by the client).
2. `tenantId` claim is extracted from the verified token.
3. The tenant guard compares this to the `tenantId` in the request and rejects if they differ.
4. All subsequent data access uses the token-derived `tenantId` to build paths.

---

## Consequences

**Positive:**
- Even if the database security rules have a bug, a client cannot access another tenant's data by spoofing the `tenantId` in the payload.
- The tenant boundary is enforced in one place (`verifyTenantAccess`) that every function must call. Code review can verify this.
- The pattern is auditable: every function call that mutates data has a fixed structure that reviewers can check.

**Negative:**
- Every new function must explicitly call `verifyTenantAccess`. Forgetting to call it is a security bug. This is mitigated by code review checklists and (ideally) a lint rule.
- Functions cannot act on behalf of another tenant even when that would be legitimate (e.g., super-admin operations). This is handled by the `requireSuperAdmin` bypass, which has its own audit trail.

---

## Alternatives Considered

**Database rules only (rejected):** Rules are powerful but complex. As the schema grows, rule coverage becomes harder to audit. A misconfigured rule can silently open a cross-tenant path. Function-layer enforcement adds a defense-in-depth layer.

**Separate database per tenant (deferred):** True physical isolation eliminates cross-tenant risk entirely. However, it increases operational complexity (N databases to maintain, back up, and monitor) and makes cross-tenant admin queries harder. May be revisited if regulatory requirements demand it.
