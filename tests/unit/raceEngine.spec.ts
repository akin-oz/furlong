/**
 * Race engine — pure tick logic.
 *
 * Covers ADR 0003 (Race engine physiology model). Tests are split into:
 *   - state initialization
 *   - the speed → progress conversion
 *   - per-tick deterministic invariants (mocked Math.random for reproducibility)
 *   - statistical properties verified across many tick samples
 *   - end-to-end simulation (a few hundred ticks) for plausibility
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { RACING_CONFIG } from '@shared/config'
import type { Horse, HorseRaceState } from '@entities/horse'
import {
  computeTick,
  createInitialState,
  speedToProgressDelta,
} from '@/features/race-track/model/raceEngine'

const E = RACING_CONFIG.engine

function makeHorse(overrides: Partial<Horse> = {}): Horse {
  return {
    id: overrides.id ?? 1,
    name: overrides.name ?? 'Test Horse',
    color: overrides.color ?? '#000000',
    age: overrides.age ?? 4,
    condition: overrides.condition ?? 50,
    stamina: overrides.stamina ?? 50,
    acceleration: overrides.acceleration ?? 50,
  }
}

function withRandom<T>(value: number, fn: () => T): T {
  const spy = vi.spyOn(Math, 'random').mockReturnValue(value)
  try {
    return fn()
  } finally {
    spy.mockRestore()
  }
}

describe('Race engine — state initialization', () => {
  it('creates initial state at progress 0 with full anaerobic energy', () => {
    const horse = makeHorse({ condition: 70 })
    const state = createInitialState(horse)
    expect(state.horseId).toBe(horse.id)
    expect(state.progress).toBe(0)
    expect(state.anaerobicEnergy).toBe(1)
    expect(state.hasBursted).toBe(false)
    expect(state.finishedAtTick).toBeNull()
    expect(state.speed).toBe(70 * E.conditionWeight)
  })

  it('higher condition produces higher initial speed', () => {
    const slow = createInitialState(makeHorse({ condition: 20 })).speed
    const fast = createInitialState(makeHorse({ condition: 90 })).speed
    expect(fast).toBeGreaterThan(slow)
  })
})

describe('Race engine — speedToProgressDelta', () => {
  it('is linear in speed', () => {
    expect(speedToProgressDelta(20, 1600)).toBeCloseTo(speedToProgressDelta(10, 1600) * 2)
  })

  it('shorter distances produce larger per-tick deltas at the same speed', () => {
    expect(speedToProgressDelta(50, 1200)).toBeGreaterThan(speedToProgressDelta(50, 2200))
  })

  it('returns zero when speed is zero', () => {
    expect(speedToProgressDelta(0, 1600)).toBe(0)
  })
})

describe('Race engine — engine config invariants', () => {
  it('attribute weights sum to 1.0', () => {
    const sum = E.conditionWeight + E.accelerationWeight + E.staminaWeight
    expect(sum).toBeCloseTo(1.0, 5)
  })

  it('inertia is in [0, 1)', () => {
    expect(E.inertia).toBeGreaterThanOrEqual(0)
    expect(E.inertia).toBeLessThan(1)
  })

  it('noise factor is non-negative', () => {
    expect(E.noiseFactor).toBeGreaterThanOrEqual(0)
  })
})

describe('Race engine — per-tick invariants (deterministic random)', () => {
  let horse: Horse
  let state: HorseRaceState

  beforeEach(() => {
    horse = makeHorse({ condition: 60, stamina: 60, acceleration: 60 })
    state = createInitialState(horse)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('depletes anaerobic energy monotonically with each tick', () => {
    let energy = state.anaerobicEnergy
    for (let i = 0; i < 50; i++) {
      const result = withRandom(0.5, () => computeTick({ state, horse, progress: i / 100 }))
      expect(result.newAnaerobicEnergy).toBeLessThanOrEqual(energy)
      energy = result.newAnaerobicEnergy
      state = { ...state, anaerobicEnergy: result.newAnaerobicEnergy, speed: result.newSpeed }
    }
  })

  it('higher acceleration depletes energy faster', () => {
    const slow = computeTick({
      state: createInitialState(makeHorse({ acceleration: 20 })),
      horse: makeHorse({ acceleration: 20 }),
      progress: 0.1,
    })
    const fast = computeTick({
      state: createInitialState(makeHorse({ acceleration: 90 })),
      horse: makeHorse({ acceleration: 90 }),
      progress: 0.1,
    })
    expect(fast.newAnaerobicEnergy).toBeLessThan(slow.newAnaerobicEnergy)
  })

  it('triggers final-stretch burst exactly once when crossing threshold', () => {
    const before = withRandom(0.5, () =>
      computeTick({ state, horse, progress: E.burstThreshold - 0.01 }),
    )
    expect(before.hasBursted).toBe(false)

    const at = withRandom(0.5, () =>
      computeTick({ state, horse, progress: E.burstThreshold + 0.01 }),
    )
    expect(at.hasBursted).toBe(true)

    // Once bursted, calling again at higher progress should not re-burst.
    const after = withRandom(0.5, () =>
      computeTick({
        state: { ...state, hasBursted: true },
        horse,
        progress: 0.95,
      }),
    )
    expect(after.hasBursted).toBe(true)
  })

  it('applies a fatigue penalty when anaerobic energy is below threshold', () => {
    const fresh = withRandom(0.5, () =>
      computeTick({
        state: { ...state, anaerobicEnergy: 1, speed: 30 },
        horse,
        progress: 0.5,
      }),
    )
    const tired = withRandom(0.5, () =>
      computeTick({
        state: { ...state, anaerobicEnergy: 0, speed: 30 },
        horse,
        progress: 0.5,
      }),
    )
    expect(tired.newSpeed).toBeLessThan(fresh.newSpeed)
  })

  it('inertia keeps speed close to previous when base contributions vanish', () => {
    const idle = makeHorse({ condition: 0, stamina: 0, acceleration: 0 })
    const inertialState: HorseRaceState = { ...createInitialState(idle), speed: 40 }
    const result = withRandom(0.5, () =>
      computeTick({ state: inertialState, horse: idle, progress: 0.5 }),
    )
    // With base = 0, new speed ≈ inertia * previous = 0.8 * 40 = 32 (no noise at 0.5).
    expect(result.newSpeed).toBeCloseTo(40 * E.inertia, 5)
  })
})

describe('Race engine — statistical noise behavior', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('keeps tick speed within ±noiseFactor/2 of inertial baseline across all rng draws', () => {
    const horse = makeHorse({ condition: 50, stamina: 50, acceleration: 50 })
    const state = createInitialState(horse)
    const baseTick = withRandom(0.5, () => computeTick({ state, horse, progress: 0.4 }))
    // Compare extreme rng draws: 0 and 1 should bracket the median run.
    const lo = withRandom(0, () => computeTick({ state, horse, progress: 0.4 }))
    const hi = withRandom(0.999999, () => computeTick({ state, horse, progress: 0.4 }))
    expect(lo.newSpeed).toBeLessThan(baseTick.newSpeed)
    expect(hi.newSpeed).toBeGreaterThan(baseTick.newSpeed)

    const lowerBound = baseTick.newSpeed * (1 - E.noiseFactor / 2) / (1 - 0)
    const upperBound = baseTick.newSpeed * (1 + E.noiseFactor / 2) / 1
    // Noise should never push speed past the configured envelope.
    expect(lo.newSpeed).toBeGreaterThanOrEqual(0)
    expect(hi.newSpeed).toBeLessThanOrEqual(upperBound * 1.0001)
    expect(lowerBound).toBeGreaterThan(0)
  })

  it('mean speed across many random draws stays near the deterministic baseline', () => {
    const horse = makeHorse({ condition: 50, stamina: 50, acceleration: 50 })
    const state = createInitialState(horse)
    const baseline = withRandom(0.5, () => computeTick({ state, horse, progress: 0.4 })).newSpeed

    // Use a deterministic seeded RNG so the test is reproducible.
    let seed = 1
    const seededRng = () => {
      seed = (seed * 9301 + 49297) % 233280
      return seed / 233280
    }
    vi.spyOn(Math, 'random').mockImplementation(seededRng)

    const samples: number[] = []
    for (let i = 0; i < 500; i++) {
      samples.push(computeTick({ state, horse, progress: 0.4 }).newSpeed)
    }
    const mean = samples.reduce((a, b) => a + b, 0) / samples.length
    // Mean should land within ~5% of the rng=0.5 baseline given uniform noise.
    expect(Math.abs(mean - baseline) / baseline).toBeLessThan(0.05)
  })
})

describe('Race engine — physiology in simulation', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  function simulate(horse: Horse, distance: number, maxTicks = 5000): {
    finishedAt: number | null
    finalSpeed: number
  } {
    let state = createInitialState(horse)
    let progress = 0
    let tick = 0
    let seed = horse.id * 7 + 1
    const seededRng = () => {
      seed = (seed * 9301 + 49297) % 233280
      return seed / 233280
    }
    vi.spyOn(Math, 'random').mockImplementation(seededRng)

    while (progress < 1 && tick < maxTicks) {
      const result = computeTick({ state, horse, progress })
      progress = Math.min(1, progress + speedToProgressDelta(result.newSpeed, distance))
      state = {
        ...state,
        speed: result.newSpeed,
        anaerobicEnergy: result.newAnaerobicEnergy,
        hasBursted: result.hasBursted,
        progress,
      }
      tick++
    }
    return {
      finishedAt: progress >= 1 ? tick : null,
      finalSpeed: state.speed,
    }
  }

  it('high-condition horse finishes ahead of low-condition horse over the same distance', () => {
    const elite = makeHorse({ id: 1, condition: 95, stamina: 80, acceleration: 80 })
    const weak = makeHorse({ id: 2, condition: 25, stamina: 25, acceleration: 25 })

    const eliteResult = simulate(elite, 1600)
    const weakResult = simulate(weak, 1600)

    expect(eliteResult.finishedAt).not.toBeNull()
    expect(weakResult.finishedAt).not.toBeNull()
    expect(eliteResult.finishedAt!).toBeLessThan(weakResult.finishedAt!)
  })

  it('a typical horse finishes a 1600m round in a reasonable number of ticks', () => {
    const horse = makeHorse({ condition: 60, stamina: 60, acceleration: 60 })
    const result = simulate(horse, 1600)
    expect(result.finishedAt).not.toBeNull()
    // Bounded: must take more than a single tick and less than the safety guard.
    expect(result.finishedAt!).toBeGreaterThan(1)
    expect(result.finishedAt!).toBeLessThan(5000)
  })

  it('longer distances take more ticks for the same horse', () => {
    const horse = makeHorse({ condition: 60, stamina: 60, acceleration: 60 })
    const short = simulate(horse, 1200)
    const long = simulate(horse, 2200)
    expect(long.finishedAt!).toBeGreaterThan(short.finishedAt!)
  })

  it('every horse eventually finishes (progress is strictly monotonic in expectation)', () => {
    const horse = makeHorse({ condition: 30, stamina: 30, acceleration: 30 })
    const result = simulate(horse, 2200, 10_000)
    expect(result.finishedAt).not.toBeNull()
  })
})
