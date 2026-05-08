# ADR 0011 — Overall Champion Determination

## Status

Accepted — 2026-05-07

## Context

The case requires 6 rounds with 10 horses per round, drawn from a pool of 20.
The brief is silent on how to determine an "overall champion" across the
6-round series — only individual round results are explicitly required.

Adding overall standings is a value-additive scope expansion: it answers a
question every user will ask ("who won the day?") without changing the case's
core flow.

Real horse racing series use points-based systems. Researched precedents:

- **Breeders' Cup Grade I**: top 3 only (10/6/4 points)
- **Kentucky Derby — Road to**: top 5 (50/25/15/10/5), with distance multipliers
  on later prep races
- **NASCAR Cup Series**: every finishing position scores; bonus for fastest lap
- **iRacing**: points scaled by field strength and size

## Decision

**Points formula** — every position scores, with a distance multiplier
favoring later (longer) rounds:

```
points = (11 - position) × distanceMultiplier

where distanceMultiplier =
  1.0  for rounds 1–3 (1200m, 1400m, 1600m)
  2.0  for rounds 4–6 (1800m, 2000m, 2200m)
```

Example for a single round:
- 1st place: 10 base points × multiplier
- 10th place: 1 base point × multiplier

A horse not selected for a given round simply earns 0 for that round.

**Tie-breakers** (applied in order):

1. Most 1st-place finishes
2. Most 2nd-place finishes
3. Most 3rd-place finishes
4. Highest sum of condition (proxy for "stronger horse on paper")

If still tied after all criteria, both horses share the position with a "Tied
for Nth" label — celebrating the rare draw rather than picking arbitrarily.

**Display**:

A new "Overall Standings" panel renders below results. Updates after every
round finishes. When the 6th round completes, the panel highlights the top 3
as the season podium with subtle emphasis (no balloons, no fanfare — editorial
restraint per the design language).

## Rationale for these choices

**Why every position scores (NASCAR-style) rather than top-3 (Breeders'
Cup-style)?**
With 20 horses in the pool but only 10 per round selected at random, a horse
might race fewer rounds than another. A top-3-only system over-rewards horses
that get lucky in their few appearances. Linear scoring spreads reward across
participation.

**Why a 2x multiplier on later rounds rather than uniform points?**
Kentucky Derby precedent: later races carry more weight. Mechanically, this
also makes the championship undecided until late, raising tension. Without
the multiplier, leaders established early would coast to victory.

**Why a 2x cliff at round 4 rather than a smooth multiplier per round?**
Two reasons: (a) the cliff makes "the back half" a clear narrative beat,
which is good UX for a 6-round game; (b) a smooth `1 + roundIndex / 6`
multiplier would feel arbitrary and require explanation. Cliffs are
explainable.

**Why include condition as the final tie-breaker?**
After head-to-head records exhaust, a tie-break needs *some* signal. Total
condition reflects the horse's underlying form and is consistent with the
physiology model (ADR 0003).

## Consequences

- Implementation is purely additive: a derived selector on existing
  `raceStore.results` produces the standings. No new state, no new store.
- All tunables (multiplier threshold, multiplier value) live in
  `RACING_CONFIG.standings` per ADR 0006.
- Standings panel is a new feature slice (`features/standings/`), preserving
  FSD boundaries.
- The Skip Round flow (ADR 0008) works without change — points are computed
  from final positions, regardless of whether the round was watched or skipped.

## Alternatives considered

- **Top-3-only points (10/6/4)**: rejected as over-rewarding selection luck.
- **Uniform multiplier across rounds**: rejected — championship would be
  decided too early.
- **Bonus for "won every round entered"**: tempting but adds complexity to
  the UI for a rare edge case.
- **Show standings only at the end**: rejected — watching standings shift
  round-by-round is more engaging than a single end-screen reveal.
- **Skip standings entirely**: rejected — every user will ask "who won the
  day?" The case is silent, but the question is implicit.

## Open question

Notified Berfu of this addition? No — this is a quality-of-experience
extension that doesn't conflict with the brief. If the case author intended
"no overall winner, just individual rounds", the panel is easy to remove.
The default presence signals product thinking.
