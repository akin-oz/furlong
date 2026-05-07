# ADR 0009 — Responsive and Viewport Strategy

## Status
Accepted — 2026-05-07

## Context
The case mockup is desktop-first: three columns side by side (horse list, track, program/results). On mobile this layout collapses.

## Decision
**Desktop-first**, with graceful degradation:

- ≥ 1280px: optimal three-column layout
- 1024–1280px: same layout, narrower side columns
- 768–1024px: track stays primary; meta strip in topbar collapses
- < 768px: columns stack vertically; all features remain reachable

No feature is gated by viewport. Animations, controls, and data display work at every breakpoint, just less polished below 1024px.

## Consequences
- Reviewer can preview on phone without seeing a "use a bigger screen" message
- Layout shifts are CSS-only; component logic doesn't branch on viewport

## Alternatives considered
- **Mobile-first redesign**: would require redesigning the dashboard concept; out of scope
- **Mobile blocker message**: low effort but signals "didn't think about responsive" and feels unprofessional
