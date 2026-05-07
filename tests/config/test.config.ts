/**
 * Test tunables — single source of truth for thresholds, sample sizes, and
 * timeouts used across unit and e2e suites.
 *
 * Production game constants live in src/shared/config/racing.config.ts.
 * This file holds *only* values that govern the test harness itself.
 */

export const TEST_CONFIG = {
  // ─── Statistical engine tests ────────────────────────────────
  statistical: {
    /** Samples drawn from the seeded RNG when checking mean noise behavior */
    sampleCount: 500,
    /** Allowed deviation between sample mean and deterministic baseline */
    meanToleranceRatio: 0.05,
    /** Iterations of the monotonic-energy invariant loop */
    monotonicSampleCount: 50,
  },

  // ─── Engine simulation bounds ────────────────────────────────
  simulation: {
    /** Upper bound for runaway protection in default sims */
    maxTicks: 5_000,
    /** Upper bound for the slowest-attribute sim ("must finish") */
    longMaxTicks: 10_000,
    /** Lower bound — finishing in 1 tick would indicate a calibration bug */
    minTicks: 1,
  },

  // ─── Playwright e2e ──────────────────────────────────────────
  e2e: {
    /** Wait for `.res-card` count to update after a Skip Round click */
    perRoundTimeoutMs: 10_000,
    /** Wait for the next round to start (between → running auto-advance) */
    transitionTimeoutMs: 5_000,
  },

  // ─── Tolerances ──────────────────────────────────────────────
  /** Default toBeCloseTo precision (digits after decimal) */
  defaultPrecision: 5,

  // ─── Reusable horse attribute profiles ───────────────────────
  // Built so condition/stamina/acceleration map to a recognizable archetype.
  horseProfile: {
    average:  { condition: 50, stamina: 50, acceleration: 50 },
    typical:  { condition: 60, stamina: 60, acceleration: 60 },
    idle:     { condition: 0,  stamina: 0,  acceleration: 0  },
    elite:    { condition: 95, stamina: 80, acceleration: 80 },
    weak:     { condition: 25, stamina: 25, acceleration: 25 },
    slow:     { condition: 30, stamina: 30, acceleration: 30 },
    lowAccel: { condition: 50, stamina: 50, acceleration: 20 },
    hiAccel:  { condition: 50, stamina: 50, acceleration: 90 },
  },

  // ─── Engine probe values ─────────────────────────────────────
  engineProbes: {
    /** Mid-race progress used in tick-invariant tests */
    midProgress:        0.4,
    /** Half-track progress used in fatigue/inertia tests */
    halfProgress:       0.5,
    /** Early-race progress for energy-depletion checks */
    earlyProgress:      0.1,
    /** Late-race progress just past the burst threshold */
    lateProgress:       0.95,
    /** Step used when sweeping progress through tick loops */
    progressDivisor:    100,
    /** ε offset around the burst threshold */
    burstEpsilon:       0.01,
    /** Median rng draw used for "deterministic" tick assertions */
    medianRngDraw:      0.5,
    /** Max rng draw used for upper-bound noise checks */
    maxRngDraw:         0.999999,
    /** Min rng draw used for lower-bound noise checks */
    minRngDraw:         0,
    /** Initial horse speed seeded for inertia tests */
    inertialBaseSpeed:  40,
    /** Speed used when comparing fresh vs tired horses */
    fatigueProbeSpeed:  30,
    /** Spare-energy attribute value used in baseline checks */
    spareEnergy:        1,
    /** Empty-energy value used in fatigue checks */
    depletedEnergy:     0,
    /** Floating-point tolerance for upper-bound noise envelope */
    upperBoundEpsilon:  1.0001,
    /** Speed pair used in linearity test (smaller vs doubled) */
    speedSmall:         10,
    speedLarge:         20,
    speedMedium:        50,
    /** Probe condition values for "higher condition → higher initial speed" */
    initialSpeedHorseCondition: 70,
    initialSpeedSlowCondition:  20,
    initialSpeedFastCondition:  90,
  },
} as const

export type TestConfig = typeof TEST_CONFIG
