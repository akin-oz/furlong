/**
 * Case rule coverage — horse generation.
 *
 * Each test name carries a "(rule N)" suffix corresponding to the case brief.
 */

import { describe, it, expect } from 'vitest'
import { generateHorses } from '@entities/horse'
import { RACING_CONFIG } from '@shared/config'

describe('Horse generation — Case rules', () => {
  it('generates exactly 20 horses (rule 1)', () => {
    const horses = generateHorses()
    expect(horses).toHaveLength(20)
  })

  it('assigns a unique color to each horse (rule 2)', () => {
    const horses = generateHorses()
    const colors = new Set(horses.map((h) => h.color))
    expect(colors.size).toBe(horses.length)
  })

  it('keeps condition score between 1 and 100 (rule 3)', () => {
    const horses = generateHorses()
    const { min, max } = RACING_CONFIG.horses.condition

    for (const h of horses) {
      expect(h.condition).toBeGreaterThanOrEqual(min)
      expect(h.condition).toBeLessThanOrEqual(max)
    }
  })
})

describe('Horse generation — additional invariants', () => {
  it('assigns a unique id to each horse', () => {
    const horses = generateHorses()
    const ids = new Set(horses.map((h) => h.id))
    expect(ids.size).toBe(horses.length)
  })

  it('keeps stamina and acceleration within configured bounds', () => {
    const horses = generateHorses()
    const { stamina, acceleration } = RACING_CONFIG.horses

    for (const h of horses) {
      expect(h.stamina).toBeGreaterThanOrEqual(stamina.min)
      expect(h.stamina).toBeLessThanOrEqual(stamina.max)
      expect(h.acceleration).toBeGreaterThanOrEqual(acceleration.min)
      expect(h.acceleration).toBeLessThanOrEqual(acceleration.max)
    }
  })

  it('assigns ages within configured range', () => {
    const horses = generateHorses()
    const { min, max } = RACING_CONFIG.horses.age

    for (const h of horses) {
      expect(h.age).toBeGreaterThanOrEqual(min)
      expect(h.age).toBeLessThanOrEqual(max)
    }
  })
})
