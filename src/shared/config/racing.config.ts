/**
 * Racing engine configuration — single source of truth for all tunables.
 *
 * All numeric constants that govern game behavior live here. Components and
 * stores must read from this config rather than hardcoding values.
 *
 * See ADR 0006 (Config-driven tunables) for rationale.
 */

export const RACING_CONFIG = {
  // ─── Horses ──────────────────────────────────────────────────
  horses: {
    totalCount: 20,        // Case rule 1
    perRound:   10,        // Case rule 5

    age: { min: 3, max: 7 },

    // Each attribute is rolled independently in 1..100 (case rule 3)
    condition:    { min: 1, max: 100 },
    stamina:      { min: 1, max: 100 },
    acceleration: { min: 1, max: 100 },
  },

  // ─── Age modifiers ───────────────────────────────────────────
  // Real horses peak at 4–5; younger and older horses race at a slight disadvantage
  age: {
    peakRange: { min: 4, max: 5 },
    modifiers: {
      young:  0.92,  // age 3
      peak:   1.08,  // age 4–5
      mature: 0.96,  // age 6–7
    },
  },

  // ─── Rounds ──────────────────────────────────────────────────
  // Case rule 4 (6 rounds) and rule 6 (specific distance sequence)
  rounds: [
    { id: 1, distance: 1200 },
    { id: 2, distance: 1400 },
    { id: 3, distance: 1600 },
    { id: 4, distance: 1800 },
    { id: 5, distance: 2000 },
    { id: 6, distance: 2200 },
  ],

  // ─── Race engine physiology ──────────────────────────────────
  // Speed = condition (always) + acceleration (early) + stamina (late) + noise
  // See ADR 0003 (Race engine physiology model)
  engine: {
    tickIntervalMs: 50,

    // Attribute weights — must sum to 1.0
    conditionWeight:    0.5,
    accelerationWeight: 0.3,
    staminaWeight:      0.2,

    // Random multiplier per tick: 1 ± noiseFactor/2
    noiseFactor: 0.3,

    // Inertia — current speed depends on previous tick (smooths motion)
    inertia: 0.8,

    // Final-stretch burst — kicks in above this progress, scaled by stamina
    burstThreshold:     0.75,
    burstStaminaFactor: 0.25,

    // Anaerobic energy depletion — high-acceleration horses tire late
    fatigueThreshold:    0.2,
    fatiguePenaltyFactor: 0.5,
    anaerobicTickCost:   0.02,

    // Calibration — empirical constants tuning wall-clock pacing
    referenceDistance:    1600,    // distances normalized against this
    progressPerSpeedUnit: 0.0008,  // raw speed → per-tick progress delta

    // Boundary values — game limits, not tunables but kept here for reuse
    maxProgress:          1,    // finish-line progress
    maxAnaerobicEnergy:   1,    // initial energy reserve
    attributeScale:       100,  // attributes (condition/stamina/accel) ∈ [1, 100]

    // Safety guard — caps synchronous skip-round loops
    skipSafetyTickLimit:  50_000,
  },

  // ─── Round flow ──────────────────────────────────────────────
  // See ADR 0007 (Round flow and state machine)
  flow: {
    interRoundDelayMs: 1500,
  },

  // ─── Overall standings ───────────────────────────────────────
  // Points-based championship across all rounds.
  // See ADR 0011 (Overall champion determination).
  standings: {
    // Position points before multiplier: 1st place = 10, 10th place = 1
    positionPoints: (position: number) => 11 - position,

    // Distance multiplier — rounds with distance ≥ this threshold get the boost
    distanceMultiplierThreshold: 1800,
    distanceMultiplierBoost: 2.0,
    distanceMultiplierBase: 1.0,
  },

  // ─── Display / presentation ──────────────────────────────────
  // UI labels and category mappings derived from the game model.
  display: {
    podiumSize: 3,
    podiumLabels: ['1st', '2nd', '3rd'] as const,

    // Race-name categories — first matching `maxExclusive` wins.
    distanceCategories: [
      { maxExclusive: 1500,     label: 'Sprint'      },
      { maxExclusive: 1900,     label: 'Mile'        },
      { maxExclusive: Infinity, label: 'Long Course' },
    ],
  },

  // ─── Formatting ──────────────────────────────────────────────
  // String/number formatting widths used in the dashboard.
  formatting: {
    msPerSecond:        1000,
    secondsPerMinute:   60,
    timeFractionDigits: 2,   // m:ss.NN
    timeSecondsPad:     5,   // "ss.NN" → 5 chars after padStart
    roundIdPad:         2,   // "01" .. "06"
    lanePad:            2,   // "01" .. "10"
  },
} as const

export type RacingConfig = typeof RACING_CONFIG
