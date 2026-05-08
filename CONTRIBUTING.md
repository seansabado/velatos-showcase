# Contributing to velatos-showcase

This is primarily a portfolio and architectural reference repository. Contributions are welcome in the form of:

- Corrections to documentation or code comments
- Additional architecture pattern examples that are safe and non-proprietary
- Improved TypeScript type definitions
- Additional tests

---

## What This Repo Is (and Isn't)

This repo demonstrates **architectural patterns** — not a deployable application. Before contributing, read the `README.md` to understand the scope.

**Do not submit PRs that:**
- Include real database schemas from any production system
- Include API keys, credentials, or real environment variables
- Include real business logic that would expose proprietary information
- Claim to deploy or connect to any real system

---

## Development Setup

```bash
npm install
npm run typecheck    # TypeScript — must pass with zero errors
npm test             # Jest unit tests
```

All tests must pass and `tsc --noEmit` must be clean before a PR is merged.

---

## Code Style

- **TypeScript strict mode** — no `any`, no `@ts-ignore` without a comment explaining why
- **No external runtime dependencies** — this is a pattern showcase, not a framework. Keep `dependencies` empty; `devDependencies` only.
- **JSDoc on exported symbols** — brief comment explaining the purpose and any non-obvious design decisions
- **Fake data stays fake** — all `fake*.ts` files must only contain obviously synthetic, non-PII data

---

## Adding a New Module

1. Create `src/example-{module}/` with at minimum:
   - `{module}Types.ts` — domain types
   - `fake{Module}.ts` — fake data
   - `use{Module}.ts` — primary hook demonstrating the pattern
2. Add a `docs/` entry explaining the pattern and design decisions
3. Add tests under `src/example-{module}/__tests__/`
4. Update the `README.md` navigation table

---

## Commit Messages

Use [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add example-rma FSM module
fix: correct role hierarchy in tenantGuard
docs: add ADR-003 for locale strategy
test: add tenantGuard unit tests
chore: update tsconfig strict settings
```

---

## License

By submitting a PR you agree that your contribution will be licensed under the MIT license.
