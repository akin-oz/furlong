/**
 * Deterministic fixtures for stories and tests.
 *
 * Generates horses and round results without relying on Math.random() so
 * stories render the same on every load. All tunables live in `FIXTURES`
 * below — never inline literals at call sites.
 */

import { RACING_CONFIG, tokens } from '@shared/config'
import type { Horse } from '@entities/horse'
import type { FinishingPosition, RaceRound, RoundResult } from '@entities/race'

const NAMES = [
  'Ada Lovelace', 'Grace Hopper', 'Margaret Hamilton', 'Joan Clarke',
  'Hedy Lamarr', 'Katherine Johnson', 'Dorothy Vaughan', 'Mary Jackson',
  'Radia Perlman', 'Frances Allen', 'Barbara Liskov', 'Karen Spärck Jones',
  'Annie Easley', 'Evelyn Boyd', 'Adele Goldberg', 'Jean Bartik',
  'Carol Shaw', 'Sister Keller', 'Erna Hoover', 'Frances Spence',
] as const

const FALLBACK_COLOR = '#000000'

/**
 * Tunables for fixture data — kept separate from RACING_CONFIG which governs
 * production game behavior. Adjust here when stories need different shapes.
 */
export const FIXTURES = {
  defaultSeed: 42,
  perRoundResultSeedFactor: 7,
  // Mulberry-style LCG constants — well-known PRNG parameters; safe to inline.
  lcg: {
    multiplier: 9301,
    increment:  49297,
    modulus:    233280,
  },
  horse: {
    ageOffset:           3,
    ageRange:            5,
    conditionOffset:     35,
    conditionRange:      60,
    staminaOffset:       40,
    staminaRange:        55,
    accelerationOffset:  40,
    accelerationRange:   55,
  },
  result: {
    // Score weights used to rank fixture horses; mirror engine weights.
    conditionWeight:      RACING_CONFIG.engine.conditionWeight,
    accelerationWeight:   RACING_CONFIG.engine.accelerationWeight,
    staminaWeight:        RACING_CONFIG.engine.staminaWeight,
    noiseAmplitude:       30,
    finishedAtTickBase:   1200,
    finishedAtTickPerRound: 200,
    finishedAtTickPerPosition: 12,
  },
} as const

function pseudoRandom(seed: number): () => number {
  const { multiplier, increment, modulus } = FIXTURES.lcg
  let s = seed
  return () => {
    s = (s * multiplier + increment) % modulus
    return s / modulus
  }
}

export function makeFixtureHorses(
  count: number = RACING_CONFIG.horses.totalCount,
  seed: number = FIXTURES.defaultSeed,
): readonly Horse[] {
  const r = pseudoRandom(seed)
  const h = FIXTURES.horse
  return Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    name: NAMES[i] ?? `Horse ${i + 1}`,
    color: tokens.lane[i] ?? FALLBACK_COLOR,
    age: h.ageOffset + Math.floor(r() * h.ageRange),
    condition: h.conditionOffset + Math.floor(r() * h.conditionRange),
    stamina: h.staminaOffset + Math.floor(r() * h.staminaRange),
    acceleration: h.accelerationOffset + Math.floor(r() * h.accelerationRange),
  }))
}

export function makeFixtureRound(
  id: number,
  distance: number,
  horses: readonly Horse[],
  size: number = RACING_CONFIG.horses.perRound,
): RaceRound {
  return { id, distance, horses: horses.slice(0, size) }
}

export function makeFixtureResult(
  round: RaceRound,
  seed: number = round.id * FIXTURES.perRoundResultSeedFactor,
): RoundResult {
  const r = pseudoRandom(seed)
  const w = FIXTURES.result
  const ranked = [...round.horses]
    .map((h) => ({
      h,
      score:
        h.condition * w.conditionWeight +
        h.stamina * w.staminaWeight +
        h.acceleration * w.accelerationWeight +
        r() * w.noiseAmplitude,
    }))
    .sort((a, b) => b.score - a.score)

  const positions: FinishingPosition[] = ranked.map((x, i) => ({
    position: i + 1,
    horseId: x.h.id,
    horseName: x.h.name,
    horseColor: x.h.color,
    finishedAtTick:
      w.finishedAtTickBase +
      round.id * w.finishedAtTickPerRound +
      i * w.finishedAtTickPerPosition,
  }))

  return { roundId: round.id, distance: round.distance, positions }
}
