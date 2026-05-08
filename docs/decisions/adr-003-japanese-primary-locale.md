# ADR-003: Japanese as Primary Locale

**Status:** Accepted  
**Date:** 2026-04-01  
**Author:** Sean Raynon

---

## Context

The platform's primary users are Japanese retail staff and managers. English-speaking developers and back-office administrators also use the system.

We need to decide how to handle the JA/EN split at the architecture level.

---

## Decision

**Japanese is the default locale for all customer-facing, staff-facing, and manager-facing UI. English is provided for admin/developer surfaces.**

Specific rules:
1. Translation keys are structural identifiers (`pos.shift.open_button`), not English sentences. This prevents accidental English leakage into the JA UI.
2. Missing JA translations surface the key identifier, not the English fallback. Missing strings become visible during QA rather than silently showing English.
3. Stored data is language-neutral (ISO codes, numeric IDs, UTC timestamps). Localization is presentation-only.
4. All timestamps are stored in UTC, displayed in JST (`Asia/Tokyo`). No local time is ever stored.
5. Currency is JPY with no decimal places. No EUR/USD formatting is used in the JA UI.

---

## Consequences

**Positive:**
- Staff and managers see a fully Japanese UI without English leakage.
- QA can verify 100% translation coverage by checking for key identifiers in the rendered output.
- Adding a third locale (e.g., Chinese for inbound tourism) requires only a new JSON file and adding the locale to the type union.

**Negative:**
- Developer onboarding requires basic familiarity with the JA translation file to understand UI labels.
- The key-generation step (generating the `TranslationKey` type union from the JA JSON at build time) adds CI complexity.

---

## Alternatives Considered

**English-first with JA overrides (rejected):** Common in SaaS tools, but leads to English text appearing in the JA UI wherever a key is missing. Unacceptable for a staff-facing retail product.

**Single bilingual strings (rejected):** Storing `{ ja: "シフト開始", en: "Open Shift" }` as a structured value in the JSON. More flexible but adds nesting complexity and makes the translation files harder to audit.
