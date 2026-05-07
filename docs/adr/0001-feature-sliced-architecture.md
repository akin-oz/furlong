# ADR 0001 — Feature-Sliced Design Architecture

## Status

Accepted — 2026-05-07

## Context

The case asks for "clean and maintainable practices, as if for a large-scale
project". The screening interview also surfaced micro-frontend readiness as a
relevant concern at Insider — confirmed by IDS public docs noting that several
product repos have already migrated to MFE architecture.

## Decision

Use Feature-Sliced Design (FSD) with the following layer hierarchy:

```
app → pages → widgets → features → entities → shared
```

Upper layers may import from lower layers. Imports against this direction —
or across slices within the same layer (feature-A → feature-B) — are
**forbidden** and enforced by `eslint-plugin-boundaries`.

Each feature/entity exposes a `index.ts` public API. Cross-slice imports must
go through this public API, never through internal paths.

## Consequences

- Every feature is independently buildable and could be remoted via Webpack
  Module Federation without architectural rework.
- Cross-cutting concerns are pushed down to `entities` (domain state) or
  `shared` (utilities, config, design system).
- New engineers can locate code by domain concept without knowing internal
  module layout.

## Alternatives considered

- **Atomic Design**: well-suited to component libraries but does not address
  state ownership or feature boundaries.
- **Domain-driven folders without enforcement**: relies on convention; in a
  growing codebase boundaries erode silently.
- **Single `src` flat layout**: works for a small case but does not signal
  large-scale readiness, which the brief explicitly asks for.
