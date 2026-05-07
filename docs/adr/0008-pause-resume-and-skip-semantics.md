# ADR 0008 — Pause, Resume, and Skip Semantics

## Status
Accepted — 2026-05-07

## Context
The case mentions "Start / Pause" but not Skip. Pause behavior across all states (running vs between vs paused) is undefined.

## Decision
**Pause** is permitted from any state where time would otherwise advance:
- `running` → `paused` (engine ticking halts)
- `between` → `paused` (the 1500ms delay's countdown halts)

Resume continues from the exact tick or remaining-delay where pause was triggered. No progress is lost.

**Skip Round** is added as a third button. It fast-forwards the current round to completion *without animation* and emits the result immediately. The next round then starts via the normal `between` transition.

**Skip All** is intentionally NOT added. It would short-circuit the experience and brings no architectural insight.

## Consequences
- Users in a hurry can skip a round; users who want to watch can let it play
- Engine can run synchronously when needed (skip) — same code path as the RAF loop
- State machine remains coherent: skip is just "tick to completion, then transition"

## Alternatives considered
- **Skip All**: diminishing return; same code as Skip Round in a `for` loop
- **Pause only during `running`**: arbitrary; users in `between` can't take a phone call
