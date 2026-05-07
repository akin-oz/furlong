/**
 * Deterministic fixtures for stories and tests.
 *
 * Generates horses and round results without relying on Math.random() so
 * stories render the same on every load.
 */

import { tokens } from '@shared/config'
import type { Horse } from '@entities/horse'
import type { FinishingPosition, RaceRound, RoundResult } from '@entities/race'

const NAMES = [
  'Ada Lovelace', 'Grace Hopper', 'Margaret Hamilton', 'Joan Clarke',
  'Hedy Lamarr', 'Katherine Johnson', 'Dorothy Vaughan', 'Mary Jackson',
  'Radia Perlman', 'Frances Allen', 'Barbara Liskov', 'Karen Spärck Jones',
  'Annie Easley', 'Evelyn Boyd', 'Adele Goldberg', 'Jean Bartik',
  'Carol Shaw', 'Sister Keller', 'Erna Hoover', 'Frances Spence',
] as const

function pseudoRandom(seed: number): () => number {
  let s = seed
  return () => {
    s = (s * 9301 + 49297) % 233280
    return s / 233280
  }
}

export function makeFixtureHorses(count = 20, seed = 42): readonly Horse[] {
  const r = pseudoRandom(seed)
  return Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    name: NAMES[i] ?? `Horse ${i + 1}`,
    color: tokens.lane[i] ?? '#000000',
    age: 3 + Math.floor(r() * 5),
    condition: 35 + Math.floor(r() * 60),
    stamina: 40 + Math.floor(r() * 55),
    acceleration: 40 + Math.floor(r() * 55),
  }))
}

export function makeFixtureRound(
  id: number,
  distance: number,
  horses: readonly Horse[],
  size = 10,
): RaceRound {
  return { id, distance, horses: horses.slice(0, size) }
}

export function makeFixtureResult(
  round: RaceRound,
  seed = round.id * 7,
): RoundResult {
  const r = pseudoRandom(seed)
  const ranked = [...round.horses]
    .map((h) => ({
      h,
      score: h.condition * 0.5 + h.stamina * 0.3 + h.acceleration * 0.2 + r() * 30,
    }))
    .sort((a, b) => b.score - a.score)

  const positions: FinishingPosition[] = ranked.map((x, i) => ({
    position: i + 1,
    horseId: x.h.id,
    horseName: x.h.name,
    horseColor: x.h.color,
    finishedAtTick: 1200 + round.id * 200 + i * 12,
  }))

  return { roundId: round.id, distance: round.distance, positions }
}
