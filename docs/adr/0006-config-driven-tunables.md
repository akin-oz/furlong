# ADR 0006 — Config-Driven Tunables

## Status
Accepted — 2026-05-07

## Context
Numeric constants govern game behavior: tick rate, attribute weights, fatigue thresholds, age modifiers, inter-round delays, and the round distance sequence (case rule 6).

If these values are scattered across components and stores, tuning the game becomes archeology.

## Decision
All tunables live in `src/shared/config/racing.config.ts`. Components and stores **must read from this config** rather than hardcoding values.

The config is `as const` for literal types, and a sibling `RacingConfig` type is exported.

## Consequences
- Tweaking game feel is a one-file change
- Reviewer can read the config file to understand the entire game's parameter space
- Tests can override specific values with type safety

## Alternatives considered
- Inline constants per component: untraceable
- Environment variables: overkill for a single-app constant set
- Runtime configuration via UI controls: out of scope (would be the next iteration)
