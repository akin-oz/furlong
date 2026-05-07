/**
 * Schedule builder — pure function, framework-agnostic.
 *
 * Generates a 6-round schedule from the global horse pool, picking 10 horses
 * per round at random with replacement (current default — pending Berfu's
 * confirmation per the email sent on 2026-05-07).
 *
 * If the response specifies "balanced distribution across 6 rounds", swap to
 * a balanced sampler without changing the public signature.
 *
 * See ADR 0007 for round flow semantics.
 */

import { RACING_CONFIG } from '@shared/config'
import type { Horse } from '@entities/horse'
import type { RaceRound } from '@entities/race'

function pickRandom<T>(pool: readonly T[], count: number): T[] {
  const copy = [...pool]
  const picked: T[] = []
  for (let i = 0; i < count && copy.length > 0; i++) {
    const idx = Math.floor(Math.random() * copy.length)
    picked.push(copy.splice(idx, 1)[0]!)
  }
  return picked
}

/**
 * Build a 6-round schedule (case rule 4) with the configured distance
 * sequence (case rule 6). Each round samples 10 horses (case rule 5)
 * independently from the 20-horse pool.
 */
export function buildSchedule(horses: readonly Horse[]): readonly RaceRound[] {
  return RACING_CONFIG.rounds.map((round) => ({
    id: round.id,
    distance: round.distance,
    horses: pickRandom(horses, RACING_CONFIG.horses.perRound),
  }))
}
