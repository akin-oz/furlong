# ADR 0010 — Test Strategy

## Status
Accepted — 2026-05-07

## Context
The case lists three bonus categories: unit, E2E, and visual tests. Coverage approach affects what reviewers can verify quickly.

## Decision
Tests split into two categories with distinct purposes:

### 1. Case rule coverage
Each rule from the brief gets an explicitly-named test with a `(rule N)` suffix. CI gates on these:

```
horseFactory.spec.ts
  ✓ generates exactly 20 horses (rule 1)
  ✓ assigns a unique color to each horse (rule 2)
  ✓ keeps condition score between 1 and 100 (rule 3)

buildSchedule.spec.ts
  ✓ produces exactly 6 rounds (rule 4)
  ✓ selects 10 horses per round from the available 20 (rule 5)
  ✓ uses distances 1200, 1400, 1600, 1800, 2000, 2200 in order (rule 6)
```

A reviewer scanning test output sees `case rule X passes` immediately.

### 2. Quality coverage
Tests that signal senior craftsmanship beyond strict requirements:

- **Engine — statistical**: 100 simulations confirm high condition wins more often, high acceleration leads early, high stamina dominates long distances, fatigue penalty fires below threshold
- **State machine**: every transition is valid; cannot start without schedule; skip produces immediate result
- **Component**: roster renders all horses; results panel transitions on new entry
- **E2E**: full-race flow (generate → start → 6 rounds → results)
- **Visual**: Storybook stories per component, Chromatic snapshots gated on PR

### Determinism
Engine is intentionally nondeterministic via random noise. Statistical tests cope with this. Visual tests mock `Math.random` with a seedable PRNG so snapshots remain stable.

## Consequences
- Reviewer can see "all case rules pass" within seconds
- Engine quality is verifiable without expecting deterministic behavior
- Visual diffs only fail on intentional UI changes

## Alternatives considered
- **Single test category**: loses the "case rules pass" signal
- **Deterministic engine**: would require seeding all randomness — possible, but the case asks for engineering judgment, not maximum testability
