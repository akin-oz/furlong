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
  },

  // ─── Round flow ──────────────────────────────────────────────
  // See ADR 0007 (Round flow and state machine)
  flow: {
    interRoundDelayMs: 1500,
  },
} as const

export type RacingConfig = typeof RACING_CONFIG
