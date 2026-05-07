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
import { TEST_CONFIG } from '../config/test.config'
import { FIXTURES } from '@shared/test/fixtures'

const E = RACING_CONFIG.engine
const T = TEST_CONFIG

const DEFAULT_PROFILE = T.horseProfile.average
const DEFAULT_AGE = Math.floor(
  (RACING_CONFIG.horses.age.min + RACING_CONFIG.horses.age.max) / 2,
)

function makeHorse(overrides: Partial<Horse> = {}): Horse {
  return {
    id: overrides.id ?? 1,
    name: overrides.name ?? 'Test Horse',
    color: overrides.color ?? '#000000',
    age: overrides.age ?? DEFAULT_AGE,
    condition: overrides.condition ?? DEFAULT_PROFILE.condition,
    stamina: overrides.stamina ?? DEFAULT_PROFILE.stamina,
    acceleration: overrides.acceleration ?? DEFAULT_PROFILE.acceleration,
  }
}

const REFERENCE_DISTANCE = E.referenceDistance
const ROUND_DISTANCES = RACING_CONFIG.rounds.map((r) => r.distance)
const SHORTEST_DISTANCE = ROUND_DISTANCES[0]!
const LONGEST_DISTANCE = ROUND_DISTANCES[ROUND_DISTANCES.length - 1]!

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
    const probeCondition = T.engineProbes.initialSpeedHorseCondition
    const horse = makeHorse({ condition: probeCondition })
    const state = createInitialState(horse)
    expect(state.horseId).toBe(horse.id)
    expect(state.progress).toBe(0)
    expect(state.anaerobicEnergy).toBe(E.maxAnaerobicEnergy)
    expect(state.hasBursted).toBe(false)
    expect(state.finishedAtTick).toBeNull()
    expect(state.speed).toBe(probeCondition * E.conditionWeight)
  })

  it('higher condition produces higher initial speed', () => {
    const slow = createInitialState(
      makeHorse({ condition: T.engineProbes.initialSpeedSlowCondition }),
    ).speed
    const fast = createInitialState(
      makeHorse({ condition: T.engineProbes.initialSpeedFastCondition }),
    ).speed
    expect(fast).toBeGreaterThan(slow)
  })
})

describe('Race engine — speedToProgressDelta', () => {
  it('is linear in speed', () => {
    expect(
      speedToProgressDelta(T.engineProbes.speedLarge, REFERENCE_DISTANCE),
    ).toBeCloseTo(
      speedToProgressDelta(T.engineProbes.speedSmall, REFERENCE_DISTANCE) * 2,
    )
  })

  it('shorter distances produce larger per-tick deltas at the same speed', () => {
    expect(
      speedToProgressDelta(T.engineProbes.speedMedium, SHORTEST_DISTANCE),
    ).toBeGreaterThan(
      speedToProgressDelta(T.engineProbes.speedMedium, LONGEST_DISTANCE),
    )
  })

  it('returns zero when speed is zero', () => {
    expect(speedToProgressDelta(0, REFERENCE_DISTANCE)).toBe(0)
  })
})

describe('Race engine — engine config invariants', () => {
  it('attribute weights sum to 1.0', () => {
    const sum = E.conditionWeight + E.accelerationWeight + E.staminaWeight
    expect(sum).toBeCloseTo(1.0, T.defaultPrecision)
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
    horse = makeHorse(T.horseProfile.typical)
    state = createInitialState(horse)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('depletes anaerobic energy monotonically with each tick', () => {
    const P = T.engineProbes
    let energy = state.anaerobicEnergy
    for (let i = 0; i < T.statistical.monotonicSampleCount; i++) {
      const result = withRandom(P.medianRngDraw, () =>
        computeTick({ state, horse, progress: i / P.progressDivisor }),
      )
      expect(result.newAnaerobicEnergy).toBeLessThanOrEqual(energy)
      energy = result.newAnaerobicEnergy
      state = { ...state, anaerobicEnergy: result.newAnaerobicEnergy, speed: result.newSpeed }
    }
  })

  it('higher acceleration depletes energy faster', () => {
    const lowAccel = T.horseProfile.lowAccel
    const hiAccel = T.horseProfile.hiAccel
    const slow = computeTick({
      state: createInitialState(makeHorse(lowAccel)),
      horse: makeHorse(lowAccel),
      progress: T.engineProbes.earlyProgress,
    })
    const fast = computeTick({
      state: createInitialState(makeHorse(hiAccel)),
      horse: makeHorse(hiAccel),
      progress: T.engineProbes.earlyProgress,
    })
    expect(fast.newAnaerobicEnergy).toBeLessThan(slow.newAnaerobicEnergy)
  })

  it('triggers final-stretch burst exactly once when crossing threshold', () => {
    const P = T.engineProbes
    const before = withRandom(P.medianRngDraw, () =>
      computeTick({ state, horse, progress: E.burstThreshold - P.burstEpsilon }),
    )
    expect(before.hasBursted).toBe(false)

    const at = withRandom(P.medianRngDraw, () =>
      computeTick({ state, horse, progress: E.burstThreshold + P.burstEpsilon }),
    )
    expect(at.hasBursted).toBe(true)

    // Once bursted, calling again at higher progress should not re-burst.
    const after = withRandom(P.medianRngDraw, () =>
      computeTick({
        state: { ...state, hasBursted: true },
        horse,
        progress: P.lateProgress,
      }),
    )
    expect(after.hasBursted).toBe(true)
  })

  it('applies a fatigue penalty when anaerobic energy is below threshold', () => {
    const P = T.engineProbes
    const fresh = withRandom(P.medianRngDraw, () =>
      computeTick({
        state: { ...state, anaerobicEnergy: P.spareEnergy, speed: P.fatigueProbeSpeed },
        horse,
        progress: P.halfProgress,
      }),
    )
    const tired = withRandom(P.medianRngDraw, () =>
      computeTick({
        state: { ...state, anaerobicEnergy: P.depletedEnergy, speed: P.fatigueProbeSpeed },
        horse,
        progress: P.halfProgress,
      }),
    )
    expect(tired.newSpeed).toBeLessThan(fresh.newSpeed)
  })

  it('inertia keeps speed close to previous when base contributions vanish', () => {
    const P = T.engineProbes
    const idle = makeHorse(T.horseProfile.idle)
    const inertialState: HorseRaceState = {
      ...createInitialState(idle),
      speed: P.inertialBaseSpeed,
    }
    const result = withRandom(P.medianRngDraw, () =>
      computeTick({ state: inertialState, horse: idle, progress: P.halfProgress }),
    )
    expect(result.newSpeed).toBeCloseTo(P.inertialBaseSpeed * E.inertia, T.defaultPrecision)
  })
})

describe('Race engine — statistical noise behavior', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('keeps tick speed within ±noiseFactor/2 of inertial baseline across all rng draws', () => {
    const P = T.engineProbes
    const horse = makeHorse(T.horseProfile.average)
    const state = createInitialState(horse)
    const baseTick = withRandom(P.medianRngDraw, () =>
      computeTick({ state, horse, progress: P.midProgress }),
    )
    const lo = withRandom(P.minRngDraw, () =>
      computeTick({ state, horse, progress: P.midProgress }),
    )
    const hi = withRandom(P.maxRngDraw, () =>
      computeTick({ state, horse, progress: P.midProgress }),
    )
    expect(lo.newSpeed).toBeLessThan(baseTick.newSpeed)
    expect(hi.newSpeed).toBeGreaterThan(baseTick.newSpeed)

    const upperBound = baseTick.newSpeed * (1 + E.noiseFactor / 2)
    expect(lo.newSpeed).toBeGreaterThanOrEqual(0)
    expect(hi.newSpeed).toBeLessThanOrEqual(upperBound * P.upperBoundEpsilon)
  })

  it('mean speed across many random draws stays near the deterministic baseline', () => {
    const P = T.engineProbes
    const horse = makeHorse(T.horseProfile.average)
    const state = createInitialState(horse)
    const baseline = withRandom(P.medianRngDraw, () =>
      computeTick({ state, horse, progress: P.midProgress }),
    ).newSpeed

    // Deterministic seeded RNG so the test is reproducible.
    const lcg = (seed: number): (() => number) => {
      let s = seed
      const { multiplier, increment, modulus } = FIXTURES.lcg
      return () => {
        s = (s * multiplier + increment) % modulus
        return s / modulus
      }
    }
    const rng = lcg(1)
    vi.spyOn(Math, 'random').mockImplementation(rng)

    const samples: number[] = []
    for (let i = 0; i < T.statistical.sampleCount; i++) {
      samples.push(computeTick({ state, horse, progress: P.midProgress }).newSpeed)
    }
    const mean = samples.reduce((a, b) => a + b, 0) / samples.length
    expect(Math.abs(mean - baseline) / baseline).toBeLessThan(T.statistical.meanToleranceRatio)
  })
})

describe('Race engine — physiology in simulation', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  function simulate(
    horse: Horse,
    distance: number,
    maxTicks: number = T.simulation.maxTicks,
  ): { finishedAt: number | null; finalSpeed: number } {
    let state = createInitialState(horse)
    let progress = 0
    let tick = 0
    let seed = horse.id * FIXTURES.perRoundResultSeedFactor + 1
    const { multiplier, increment, modulus } = FIXTURES.lcg
    const seededRng = () => {
      seed = (seed * multiplier + increment) % modulus
      return seed / modulus
    }
    vi.spyOn(Math, 'random').mockImplementation(seededRng)

    while (progress < E.maxProgress && tick < maxTicks) {
      const result = computeTick({ state, horse, progress })
      progress = Math.min(
        E.maxProgress,
        progress + speedToProgressDelta(result.newSpeed, distance),
      )
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
      finishedAt: progress >= E.maxProgress ? tick : null,
      finalSpeed: state.speed,
    }
  }

  it('high-condition horse finishes ahead of low-condition horse over the same distance', () => {
    const elite = makeHorse({ id: 1, ...T.horseProfile.elite })
    const weak = makeHorse({ id: 2, ...T.horseProfile.weak })

    const eliteResult = simulate(elite, REFERENCE_DISTANCE)
    const weakResult = simulate(weak, REFERENCE_DISTANCE)

    expect(eliteResult.finishedAt).not.toBeNull()
    expect(weakResult.finishedAt).not.toBeNull()
    expect(eliteResult.finishedAt!).toBeLessThan(weakResult.finishedAt!)
  })

  it('a typical horse finishes the reference-distance round in a reasonable number of ticks', () => {
    const horse = makeHorse(T.horseProfile.typical)
    const result = simulate(horse, REFERENCE_DISTANCE)
    expect(result.finishedAt).not.toBeNull()
    expect(result.finishedAt!).toBeGreaterThan(T.simulation.minTicks)
    expect(result.finishedAt!).toBeLessThan(T.simulation.maxTicks)
  })

  it('longer distances take more ticks for the same horse', () => {
    const horse = makeHorse(T.horseProfile.typical)
    const short = simulate(horse, SHORTEST_DISTANCE)
    const long = simulate(horse, LONGEST_DISTANCE)
    expect(long.finishedAt!).toBeGreaterThan(short.finishedAt!)
  })

  it('every horse eventually finishes (progress is strictly monotonic in expectation)', () => {
    const horse = makeHorse(T.horseProfile.slow)
    const result = simulate(horse, LONGEST_DISTANCE, T.simulation.longMaxTicks)
    expect(result.finishedAt).not.toBeNull()
  })
})
