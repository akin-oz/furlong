# ADR 0004 — Animation Strategy

## Status
Accepted — 2026-05-07

## Context
The case requires animated horse movement during races. Several approaches are possible: setInterval, requestAnimationFrame, CSS transitions, JS animation libraries (GSAP, anime.js), or Vue-native `<Transition>`.

## Decision
**Race track:** `useRafFn` (VueUse) drives ticks at 50ms intervals. Each tick the engine updates a reactive `progress` value per horse. The `HorseLane.vue` component renders progress via CSS `transform: translateX()` with `transition: transform 50ms linear`. Engine knows nothing about DOM.

**Results panel:** Native Vue `<TransitionGroup>` for new round entry and reordering. Round results are list items entering and reordering — exactly what TransitionGroup is designed for.

## Consequences
- Engine is unit-testable without mounting any DOM
- Animation is GPU-accelerated (CSS transform)
- Smooth perceived motion: tick rate (50ms) matches CSS transition duration
- Two animation paradigms are mixed (imperative for track, declarative for results) — but each fits its use case

## Alternatives considered
- See ADR 0005 for why third-party animation libraries were rejected
- Vue `<Transition>` for the track: not applicable, horses don't enter/leave DOM
- `setInterval` instead of `useRafFn`: works but isn't tied to the browser's render cycle and continues running on inactive tabs
