# ADR 0005 — No Third-Party Animation Library

## Status
Accepted — 2026-05-07

## Context
Libraries like GSAP, anime.js, motion.dev, and `@vueuse/motion` could animate horse movement. They offer richer easing, timelines, and orchestration than CSS transitions.

## Decision
Do not introduce a third-party animation library for this case.

## Rationale
- The animation requirement is one-axis linear motion driven by tick data. CSS transition `transform 50ms linear` covers it with zero dependency cost.
- Adding a library raises the question "why?" for a reviewer. There's no good answer for this scope.
- Engine/UI separation is preserved. A library would tempt mixing imperative animation calls into the engine, breaking the pure-logic boundary.

## When this would change
If the brief required choreographed sequences (multiple horses entering staggered, camera pans, replay scrubbing), GSAP or motion.dev would earn its place.

## Alternatives noted in README
For production, the same architecture admits GSAP without rework: replace the `transform: translateX` CSS rule in `HorseLane.vue` with a GSAP timeline driven by the same `progress` ref.
