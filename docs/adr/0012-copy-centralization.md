# ADR 0012 — Copy Centralization

## Status
Accepted — 2026-05-08

## Context
User-facing strings — button labels, panel titles, status badges, empty-state copy — are scattered across `.vue` templates, helper functions, and test selectors. Today the same word ("Programme", "Standings", "Awaiting program") appears in:

- the component that renders it,
- the unit test that asserts on its rendered output,
- the Playwright e2e selector that targets the button by visible text,
- and occasionally a test description string.

Three problems compound the longer this goes on:

1. **Drift.** Renaming "Skip round" → "Skip race" requires touching the component plus every selector, fixture, and snapshot referencing it. Anything missed silently breaks tests or — worse — divergence between PR review and production.
2. **No editorial review surface.** A copywriter or PM cannot grep `*.vue` to audit voice, capitalization, or terminology consistency. The copy is interleaved with markup.
3. **i18n migration blocked.** Adding a second locale today requires first finding every string, which is exactly the work this ADR avoids.

This is the same class of problem ADR 0006 solved for numeric tunables. We're applying the same shape to text.

## Decision
All user-facing strings live in **`src/shared/config/copy.ts`** as a single `as const` tree exported as `COPY`, with a sibling `Copy` type.

Components import `COPY` and reference it in templates: `{{ COPY.actions.generate }}`. Tests (unit and e2e) import the same constants for assertions and selectors. **No literal user-facing string is allowed in `.vue` templates, `.ts` UI helpers, or test specs** — lint review for new strings flags any literal that should have been a `COPY.*` reference.

The tree is shallow and grouped by surface (`app`, `actions`, `panels`, `states`, `empty`, `eyebrows`, `prompts`) rather than by feature, so a copywriter scanning the file sees all button labels next to each other, all empty states next to each other, etc.

Engine-internal strings (status enum values like `'running'`, error messages thrown from pure logic) are **not** copy and stay where they are — they're API contracts, not editorial content.

## Consequences
**Positives**
- One file to grep when reviewing voice, casing, or terminology.
- Renaming any label is a one-line change; tests follow automatically.
- Type-safe references — `COPY.actions.generate` autocompletes; typos fail at compile.
- i18n migration becomes a mechanical swap: replace `COPY` with a `t()` call wired to the chosen library (vue-i18n / @intlify / FormatJS). The shape of the tree maps cleanly to a translation key namespace.
- Tests no longer break when copy is reworded — they assert against the same constant the component renders, so the relationship is locked.

**Trade-offs**
- One extra import in every Vue file. Acceptable: the alternative is silent drift.
- Test failures no longer show the literal English string; they show `COPY.actions.skip`. We accept this — the constant points to the source of truth, and `cmd-click` jumps to the value.

## Alternatives considered
- **vue-i18n from day one.** Rejected: introduces a runtime, a build step for locale files, and a `t()` indirection for what is currently a single-locale app. ADR exit ramp documented above; we'll adopt it the day a second locale lands.
- **Constants colocated per feature** (`src/features/race-track/copy.ts`, etc.). Rejected: editorial review wants one file to scan, not seven. FSD's `shared/config` is the right home.
- **String tables via JSON.** Same shape, less type safety. `as const` TypeScript wins here.

## Migration notes
- Tests reference `COPY.*` directly so assertions and component output cannot drift.
- Playwright selectors that previously matched on visible text use the same constant: `button:has-text("${COPY.actions.generate}")`.
- Test description strings (e.g. `it('shows the start button …')`) are *not* migrated — those are developer-facing, not user-facing.

When the second locale lands, the migration is:
1. Wire vue-i18n with messages keyed off `COPY`'s shape.
2. Replace `COPY.x.y` references with `t('x.y')`.
3. Move the English `COPY` tree to `locales/en.ts`; add `locales/<other>.ts`.

The shape stays. Only the indirection changes.
