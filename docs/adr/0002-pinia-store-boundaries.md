# ADR 0002 — Pinia Store Boundaries

## Status
Accepted — 2026-05-07

## Context
FSD has multiple plausible homes for state: a feature, an entity, or shared.

## Decision
Pinia stores live in the **entities** layer. Features consume entity stores via the public `index.ts` API. Features may have their own composables (e.g. `useRaceEngine`) but those wrap stateless logic, not application state.

Two stores defined:
- `useHorseStore` (entities/horse) — owns the 20-horse roster
- `useRaceStore` (entities/race) — owns schedule, current round pointer, race status, results

## Consequences
- State ownership is independent of state usage. The same horse data is consumed by `horse-list`, `race-track`, and `results` without coupling those features.
- Stores can be unit-tested in isolation without mounting any UI.
- Migration to a different state library would touch only entities.

## Alternatives considered
- Stores in features: tightly couples state to a single feature; cross-feature reads become awkward.
- Stores in shared: violates FSD's guidance that shared should be domain-agnostic.
