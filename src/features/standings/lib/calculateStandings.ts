/**
 * Overall standings calculator — pure function, framework-agnostic.
 *
 * Aggregates round results into a championship leaderboard using the
 * points formula configured in RACING_CONFIG.standings. See ADR 0011
 * (Overall champion determination).
 */

import { RACING_CONFIG } from '@shared/config'
import type { Horse } from '@entities/horse'
import type { RoundResult } from '@entities/race'

export interface StandingEntry {
  readonly horse: Horse
  readonly totalPoints: number
  readonly firsts: number
  readonly seconds: number
  readonly thirds: number
  /** 1-indexed; ties share the same rank */
  readonly rank: number
  /** True when this horse is tied with at least one other at the same rank */
  readonly isTied: boolean
}

interface Aggregate {
  horse: Horse
  totalPoints: number
  firsts: number
  seconds: number
  thirds: number
}

function distanceMultiplier(distance: number): number {
  const { standings } = RACING_CONFIG
  return distance >= standings.distanceMultiplierThreshold
    ? standings.distanceMultiplierBoost
    : standings.distanceMultiplierBase
}

export function calculateStandings(
  horses: readonly Horse[],
  results: readonly RoundResult[],
): readonly StandingEntry[] {
  const { standings } = RACING_CONFIG

  const aggregates = new Map<number, Aggregate>(
    horses.map((h) => [
      h.id,
      { horse: h, totalPoints: 0, firsts: 0, seconds: 0, thirds: 0 },
    ]),
  )

  for (const result of results) {
    const multiplier = distanceMultiplier(result.distance)
    for (const position of result.positions) {
      const agg = aggregates.get(position.horseId)
      if (!agg) continue

      agg.totalPoints += standings.positionPoints(position.position) * multiplier
      if (position.position === 1) agg.firsts += 1
      else if (position.position === 2) agg.seconds += 1
      else if (position.position === 3) agg.thirds += 1
    }
  }

  const sorted = [...aggregates.values()].sort((a, b) => {
    if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints
    if (b.firsts !== a.firsts) return b.firsts - a.firsts
    if (b.seconds !== a.seconds) return b.seconds - a.seconds
    if (b.thirds !== a.thirds) return b.thirds - a.thirds
    return b.horse.condition - a.horse.condition
  })

  // Assign ranks with ties sharing the same number (1, 1, 3, 4, ...).
  // The loop bounds guarantee every index access is defined, so the non-null
  // assertions below are sound under `noUncheckedIndexedAccess`.
  const ranks: number[] = sorted.map((_, i) => i + 1)
  for (let i = 1; i < sorted.length; i++) {
    if (entriesAreTied(sorted[i - 1]!, sorted[i]!)) {
      ranks[i] = ranks[i - 1]!
    }
  }

  const rankCounts = new Map<number, number>()
  for (const r of ranks) rankCounts.set(r, (rankCounts.get(r) ?? 0) + 1)

  return sorted.map((agg, i) => {
    const rank = ranks[i]!
    return {
      horse: agg.horse,
      totalPoints: agg.totalPoints,
      firsts: agg.firsts,
      seconds: agg.seconds,
      thirds: agg.thirds,
      rank,
      isTied: (rankCounts.get(rank) ?? 0) > 1,
    }
  })
}

function entriesAreTied(a: Aggregate, b: Aggregate): boolean {
  return (
    a.totalPoints === b.totalPoints &&
    a.firsts === b.firsts &&
    a.seconds === b.seconds &&
    a.thirds === b.thirds &&
    a.horse.condition === b.horse.condition
  )
}
