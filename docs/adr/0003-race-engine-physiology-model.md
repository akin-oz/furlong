# ADR 0003 — Race Engine Physiology Model

## Status
Accepted — 2026-05-07

## Context
The case requires "horses visibly move during each race" with condition scores 1–100. A naive `Math.random()` approach feels arcade-like and doesn't reward the engineering thought the case asks for.

Real horse racing performance depends on aerobic capacity (stamina), anaerobic energy (acceleration), general form (condition), and age. Scientific literature distinguishes early-race anaerobic burn from late-race aerobic endurance.

## Decision
Each horse has four attributes:

- `condition` (1–100): general form, applied to all distances
- `acceleration` (1–100): anaerobic energy, dominant early, depletes over time
- `stamina` (1–100): aerobic capacity, dominant late, fatigue resistance
- `age` (3–7): peak years 4–5 give a small condition bonus; young (3) and mature (6–7) get a small penalty

Per-tick speed:

```
baseSpeed = condition * 0.5
          + acceleration * (1 - progress) * 0.3
          + stamina * progress * 0.2
```

Plus:
- **Inertia** (0.8): smooths tick-to-tick variation
- **Noise** (±15%): keeps races nondeterministic
- **Anaerobic depletion**: high-acceleration horses lose energy faster; below threshold a fatigue penalty applies
- **Final-stretch burst** (after 75% progress): high-stamina horses kick at the end

## Consequences
- Races are believable: front-runners can fade, dark horses can come from behind
- Higher-condition horses still win statistically, but not deterministically
- The engine is fully deterministic given a seeded RNG — useful for visual regression tests
- All tunables live in `racing.config.ts` (see ADR 0006)

## Alternatives considered
- Pure `Math.random()`: simple, but the brief asks for large-scale-ready thinking
- Markov chain over speed states: too complex for the brief
- Single-attribute model (condition only): doesn't reward physiologically interesting traits
