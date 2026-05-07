/**
 * Case rule coverage — race schedule.
 *
 * Tests cover rules 4, 5, and 6 from the case brief.
 */

import { describe, it, expect } from 'vitest'
import { buildSchedule } from '@features/race-schedule'
import { generateHorses } from '@entities/horse'

describe('Race schedule — Case rules', () => {
  it('produces exactly 6 rounds (rule 4)', () => {
    const schedule = buildSchedule(generateHorses())
    expect(schedule).toHaveLength(6)
  })

  it('selects 10 horses per round from the available 20 (rule 5)', () => {
    const horses = generateHorses()
    const schedule = buildSchedule(horses)
    const horseIds = new Set(horses.map((h) => h.id))

    for (const round of schedule) {
      expect(round.horses).toHaveLength(10)
      // All selected horses must come from the source pool
      for (const h of round.horses) {
        expect(horseIds.has(h.id)).toBe(true)
      }
    }
  })

  it('uses distances 1200, 1400, 1600, 1800, 2000, 2200 in order (rule 6)', () => {
    const schedule = buildSchedule(generateHorses())
    const distances = schedule.map((r) => r.distance)
    expect(distances).toEqual([1200, 1400, 1600, 1800, 2000, 2200])
  })
})

describe('Race schedule — additional invariants', () => {
  it('selects horses without duplication within a single round', () => {
    const horses = generateHorses()
    const schedule = buildSchedule(horses)

    for (const round of schedule) {
      const ids = new Set(round.horses.map((h) => h.id))
      expect(ids.size).toBe(round.horses.length)
    }
  })

  it('numbers rounds sequentially starting at 1', () => {
    const schedule = buildSchedule(generateHorses())
    const ids = schedule.map((r) => r.id)
    expect(ids).toEqual([1, 2, 3, 4, 5, 6])
  })
})
