# Furlong — Horse Racing Simulation

An interactive horse racing game built with Vue 3, Pinia, and TypeScript for the Insider One Senior Frontend case.

## Quick start

```bash
npm install
npm run dev          # dev server
npm run build        # production build
npm run lint         # ESLint with FSD boundary checks
npm run typecheck    # vue-tsc strict
npm run test:unit    # Vitest
npm run test:e2e     # Playwright
npm run storybook    # Storybook (visual regression baselines)
```

Requires Node 20+.

## Architecture

The codebase follows **Feature-Sliced Design** with the layer hierarchy enforced by `eslint-plugin-boundaries`:

```
src/
├── app/         → Root setup (Vue, Pinia, providers, global styles)
├── pages/       → Route-level composition (GamePage)
├── widgets/     → Layout-level composition (GameLayout)
├── features/    → User-facing capabilities
│   ├── horse-list/
│   ├── race-schedule/
│   ├── race-track/    ← contains the engine (model/raceEngine.ts + useRaceEngine.ts)
│   └── results/
├── entities/    → Domain state (Pinia stores live here)
│   ├── horse/
│   └── race/
└── shared/      → Config, design tokens, utilities, base UI
```

**Layer rule**: upper layers may import from lower; cross-slice imports within a layer are forbidden. Enforced by lint, not just convention.

This structure is **micro-frontend ready**: each feature has a public `index.ts`, the lint rule prevents internal coupling, and any slice could be remoted via Webpack Module Federation without architectural rework.

## Key decisions

All architectural decisions are recorded as ADRs in [`docs/adr/`](./docs/adr/):

| #    | Decision                                             |
|------|------------------------------------------------------|
| 0001 | Feature-Sliced Design with enforced boundaries       |
| 0002 | Pinia stores live in entities, not features          |
| 0003 | Race engine physiology (condition + stamina + accel) |
| 0004 | useRafFn + CSS transition for animation              |
| 0005 | No third-party animation library                     |
| 0006 | Config-driven tunables in `shared/config`            |
| 0007 | 6-state machine for race flow                        |
| 0008 | Skip Round (no Skip All); pause works in any state   |
| 0009 | Desktop-first, mobile reachable                      |
| 0010 | Two-tier test strategy (case rules + quality)        |
| 0011 | Overall champion via points-based standings          |
| 0012 | Copy centralization in `shared/config/copy.ts`       |

## Race engine — physiology model

Speed per tick is a weighted sum of three attributes, distance-weighted:

```
baseSpeed = condition × 0.5
          + acceleration × (1 - progress) × 0.3
          + stamina × progress × 0.2
```

Plus inertia smoothing, ±15% random noise, anaerobic-energy depletion (high-acceleration horses tire faster), and a final-stretch burst above 75% progress scaled by stamina.

Result: high-condition horses win statistically more often, but lower-condition horses can pull off occasional upsets — and a horse with low stamina can fade in the final stretch even if it leads early.

All tunables live in [`src/shared/config/racing.config.ts`](./src/shared/config/racing.config.ts).

## Design tokens

Visual direction was generated using claude.ai/design as a starting point, then refined into a self-contained token system in [`src/shared/config/tokens.ts`](./src/shared/config/tokens.ts).

The token structure follows **Insider Design System (IDS)** patterns:

- **Palette layer** (primitive scale, raw hex values)
- **Tokens layer** (semantic intent — `text.primary`, `surface.raised`, etc.)

This means a future migration to actual IDS components would be a single mapping swap at the alias layer. See ADR 0001 for the architectural relationship to IDS.

## Tests

Test files split into two categories with distinct intents:

**Case rule coverage** — explicit test names mirror the case brief:

```
✓ generates exactly 20 horses (rule 1)
✓ assigns a unique color to each horse (rule 2)
✓ keeps condition score between 1 and 100 (rule 3)
✓ produces exactly 6 rounds (rule 4)
✓ selects 10 horses per round from the available 20 (rule 5)
✓ uses distances 1200, 1400, 1600, 1800, 2000, 2200 in order (rule 6)
```

**Quality coverage** — engine statistics, state machine, component behavior, E2E flow, visual regression. See ADR 0010.

## Stack

- **Framework**: Vue 3 (Composition API), Vite, TypeScript (strict)
- **State**: Pinia
- **Composables**: VueUse (`useRafFn` for the engine loop)
- **Testing**: Vitest (unit + component), Playwright (E2E), Storybook + Chromatic (visual regression)
- **Linting**: ESLint flat config + `eslint-plugin-boundaries` for FSD enforcement

## Open questions (sent to recruiter on 2026-05-07)

Two domain questions were sent before starting implementation; default assumptions are noted in the relevant ADRs and will be revisited if the answers differ:

1. **Round selection**: independent random per round (current default), or balanced distribution across 6 rounds?
2. **Generate Program re-click**: same horses with new schedule (current default), or regenerate horses too?

If the answers differ from defaults, the changes are localized to `buildSchedule.ts` and `GameLayout.vue` respectively.

## A note on the championship

The case brief is silent on whether to declare an overall winner across the
6-round series. Adding this felt like an obvious user expectation ("who won
the day?"), so a points-based standings panel was added with a clearly
documented formula. See ADR 0011 for the rationale and alternatives. If the
case author intended individual rounds only, the panel is easy to remove.