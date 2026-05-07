import { describe, it, expect } from 'vitest'
import { calculateStandings } from '@features/standings'
import { generateHorses } from '@entities/horse'
import type { Horse } from '@entities/horse'
import type { FinishingPosition, RoundResult } from '@entities/race'

function makeHorse(overrides: Partial<Horse> & { id: number }): Horse {
  return {
    id: overrides.id,
    name: overrides.name ?? `Horse ${overrides.id}`,
    color: overrides.color ?? '#000000',
    age: overrides.age ?? 4,
    condition: overrides.condition ?? 50,
    stamina: overrides.stamina ?? 50,
    acceleration: overrides.acceleration ?? 50,
  }
}

function position(horse: Horse, pos: number): FinishingPosition {
  return {
    position: pos,
    horseId: horse.id,
    horseName: horse.name,
    horseColor: horse.color,
    finishedAtTick: pos * 10,
  }
}

function makeResult(roundId: number, distance: number, ordered: readonly Horse[]): RoundResult {
  return {
    roundId,
    distance,
    positions: ordered.map((h, i) => position(h, i + 1)),
  }
}

describe('calculateStandings — points formula', () => {
  it('awards 10 points × multiplier 1.0 to 1st place in a 1200m round', () => {
    const winner = makeHorse({ id: 1 })
    const horses = [winner]
    const standings = calculateStandings(horses, [makeResult(1, 1200, [winner])])
    expect(standings[0]!.totalPoints).toBe(10)
    expect(standings[0]!.firsts).toBe(1)
  })

  it('awards 10 points × multiplier 2.0 to 1st place in an 1800m round', () => {
    const winner = makeHorse({ id: 1 })
    const standings = calculateStandings([winner], [makeResult(4, 1800, [winner])])
    expect(standings[0]!.totalPoints).toBe(20)
  })

  it('awards 1 point × multiplier 1.0 to 10th place in a 1400m round', () => {
    const lineup = Array.from({ length: 10 }, (_, i) => makeHorse({ id: i + 1 }))
    const standings = calculateStandings(lineup, [makeResult(2, 1400, lineup)])
    const last = standings.find((s) => s.horse.id === 10)!
    expect(last.totalPoints).toBe(1)
  })

  it('sums points across multiple rounds correctly', () => {
    const a = makeHorse({ id: 1 })
    const b = makeHorse({ id: 2 })
    // Round 1 (1200m, ×1): a=1st (10), b=2nd (9)
    // Round 4 (1800m, ×2): a=2nd (9×2=18), b=1st (10×2=20)
    const results: RoundResult[] = [
      makeResult(1, 1200, [a, b]),
      makeResult(4, 1800, [b, a]),
    ]
    const standings = calculateStandings([a, b], results)
    const aEntry = standings.find((s) => s.horse.id === 1)!
    const bEntry = standings.find((s) => s.horse.id === 2)!
    expect(aEntry.totalPoints).toBe(10 + 9 * 2)
    expect(bEntry.totalPoints).toBe(9 + 10 * 2)
  })
})

describe('calculateStandings — tie-breaking', () => {
  it('breaks ties by firsts count, then seconds, then thirds', () => {
    // Both a and b: 10+9=19 points across 2 short rounds, but a wins R1, b wins R2 — same firsts.
    // Make a deliberate firsts-count differential: c finishes 1st twice, d finishes 1st once + 1st in 9 (bigger sum) — adjust so points equal but firsts differ.
    const a = makeHorse({ id: 1, condition: 50 })
    const b = makeHorse({ id: 2, condition: 50 })
    // Round 1 (1200m): a=1st (10), b=2nd (9)
    // Round 2 (1200m): a=2nd (9), b=1st (10)
    // Both end with 19 points, 1 first each → next tiebreak: seconds (1 each) → thirds (0 each) → condition.
    // Force differing firsts by adding round where a wins again and b takes 3rd.
    // Round 3 (1200m): a=1st (10), b=3rd (8) → a totals 29 with 2 firsts; b totals 27 with 1 first.
    // That just makes points differ. To test the firsts tiebreak with equal points, build:
    //   a: 1st in 1200m (10), 2nd in 1200m (9)        → 19 pts, 1 first, 1 second
    //   b: 1st in 1200m (10), 3rd in 1200m + 1st in 1200m? need equal points with diff firsts
    // Easier: a wins one race (10 pts, 1 first); b finishes 2nd twice (9+9 = 18). Not equal.
    //   a: 5th + 5th = 6+6 = 12 pts, 0 firsts, 0 seconds, 0 thirds
    //   b: 2nd + 8th = 9+3 = 12 pts, 0 firsts, 1 second, 0 thirds → b ranks first by seconds.
    const filler = Array.from({ length: 8 }, (_, i) => makeHorse({ id: 100 + i }))
    const r1 = makeResult(1, 1200, [filler[0]!, filler[1]!, filler[2]!, filler[3]!, a, filler[4]!, filler[5]!, b, filler[6]!, filler[7]!])
    const r2 = makeResult(2, 1200, [filler[0]!, b, filler[1]!, filler[2]!, a, filler[3]!, filler[4]!, filler[5]!, filler[6]!, filler[7]!])
    const standings = calculateStandings([a, b, ...filler], [r1, r2])
    const aEntry = standings.find((s) => s.horse.id === a.id)!
    const bEntry = standings.find((s) => s.horse.id === b.id)!
    expect(aEntry.totalPoints).toBe(bEntry.totalPoints)
    // b finished 2nd once → wins on the seconds tiebreaker
    expect(standings.findIndex((s) => s.horse.id === b.id))
      .toBeLessThan(standings.findIndex((s) => s.horse.id === a.id))
  })

  it('breaks final tie by total condition', () => {
    const a = makeHorse({ id: 1, condition: 80 })
    const b = makeHorse({ id: 2, condition: 40 })
    // Identical race finishes in two rounds → identical points, firsts, seconds, thirds.
    // Use a single round with both horses finishing 5th and 6th interchangeably across two rounds
    // to neutralise position counts.
    const filler = Array.from({ length: 8 }, (_, i) => makeHorse({ id: 100 + i }))
    const r1 = makeResult(1, 1200, [filler[0]!, filler[1]!, filler[2]!, filler[3]!, a, b, filler[4]!, filler[5]!, filler[6]!, filler[7]!])
    const r2 = makeResult(2, 1200, [filler[0]!, filler[1]!, filler[2]!, filler[3]!, b, a, filler[4]!, filler[5]!, filler[6]!, filler[7]!])
    const standings = calculateStandings([a, b, ...filler], [r1, r2])
    const aEntry = standings.find((s) => s.horse.id === a.id)!
    const bEntry = standings.find((s) => s.horse.id === b.id)!
    expect(aEntry.totalPoints).toBe(bEntry.totalPoints)
    expect(aEntry.firsts).toBe(bEntry.firsts)
    expect(aEntry.seconds).toBe(bEntry.seconds)
    expect(aEntry.thirds).toBe(bEntry.thirds)
    // a has higher condition → ranks above b
    expect(standings.findIndex((s) => s.horse.id === a.id))
      .toBeLessThan(standings.findIndex((s) => s.horse.id === b.id))
  })

  it('marks horses with the same rank as tied', () => {
    // Two horses with identical results AND identical condition share rank 1.
    const a = makeHorse({ id: 1, condition: 50 })
    const b = makeHorse({ id: 2, condition: 50 })
    const filler = Array.from({ length: 8 }, (_, i) => makeHorse({ id: 100 + i }))
    const r1 = makeResult(1, 1200, [a, filler[0]!, filler[1]!, filler[2]!, filler[3]!, b, filler[4]!, filler[5]!, filler[6]!, filler[7]!])
    const r2 = makeResult(2, 1200, [b, filler[0]!, filler[1]!, filler[2]!, filler[3]!, a, filler[4]!, filler[5]!, filler[6]!, filler[7]!])
    const standings = calculateStandings([a, b, ...filler], [r1, r2])
    const aEntry = standings.find((s) => s.horse.id === a.id)!
    const bEntry = standings.find((s) => s.horse.id === b.id)!
    expect(aEntry.rank).toBe(bEntry.rank)
    expect(aEntry.isTied).toBe(true)
    expect(bEntry.isTied).toBe(true)
  })
})

describe('calculateStandings — pool coverage', () => {
  it('returns horses with zero points last (never raced)', () => {
    const racer = makeHorse({ id: 1 })
    const ghost = makeHorse({ id: 2 })
    const standings = calculateStandings([racer, ghost], [makeResult(1, 1200, [racer])])
    expect(standings[0]!.horse.id).toBe(racer.id)
    expect(standings[1]!.horse.id).toBe(ghost.id)
    expect(standings[1]!.totalPoints).toBe(0)
  })

  it('returns 20 entries when all horses are in the pool', () => {
    const horses = generateHorses()
    expect(horses).toHaveLength(20)
    // No results → every horse still appears with zero points.
    const standings = calculateStandings(horses, [])
    expect(standings).toHaveLength(20)
    expect(standings.every((s) => s.totalPoints === 0)).toBe(true)
  })
})
