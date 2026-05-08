# Known Limits and Contract Versioning

## Known Limits (Intentional)

This repository is a portfolio architecture showcase, not a production deployment. The following limits are intentional:

1. Data and workflows are synthetic.
2. Queue and replay examples are simulated, not connected to live infra.
3. Security controls are demonstrated at pattern level, not hardened with production identity/secret infrastructure.
4. Financial and audit examples are educational and non-regulatory.
5. UI flows illustrate architecture behavior, not complete product UX.

## Why These Limits Increase Credibility

Being explicit about simulation boundaries prevents over-claiming and helps reviewers assess engineering judgment honestly.

## Contract Versioning Policy

### Versioning Model

- Contract namespace: eventType + version
- Example: order.created.v1, sync.dead_lettered.v1

### Compatibility Rules

1. Patch-level updates can add optional fields only.
2. Minor version updates can add non-breaking fields with defaults.
3. Major version updates can break shape/semantics and require migration notes.

### Deprecation Window

- Deprecated contract versions remain supported for one defined migration window (example: 90 days) before removal.

### Change Process

1. Propose change and classify as patch/minor/major.
2. Update contract docs and affected tests.
3. Add migration notes if any field is renamed or removed.
4. Publish in changelog/release note summary.

### Governance Checklist

- Tenant and branch identifiers are preserved.
- UTC timestamp fields remain stable.
- No sensitive PII in audit-adjacent contracts.
- Backward compatibility verified in tests.
