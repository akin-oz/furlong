/**
 * Race engine — pure logic, framework-agnostic.
 *
 * Computes tick-by-tick progress for a set of horses based on the physiology
 * model in ADR 0003.
 *
 * Knows nothing about Vue, DOM, or animation. The race-track feature wraps
 * this in a Vue composable (useRaceEngine) that drives ticks via useRafFn.
 */

import { RACING_CONFIG } from '@shared/config'
import type { Horse, HorseRaceState } from '@entities/horse'

// ─────────────────────────────────────────────────────────────────
// PUBLIC TYPES
// ─────────────────────────────────────────────────────────────────

export interface EngineConfig {
  readonly distance: number
  readonly horses: readonly Horse[]
}

export interface TickInput {
  readonly state: HorseRaceState
  readonly horse: Horse
  /** 0..1 — how far the horse currently is along the track */
  readonly progress: number
}

// ─────────────────────────────────────────────────────────────────
// TICK COMPUTATION
// ─────────────────────────────────────────────────────────────────

/**
 * Compute one tick of motion for a single horse.
 *
 * Speed model:
 *   baseSpeed = condition * Wc
 *             + acceleration * (1 - progress) * Wa
 *             + stamina * progress * Ws
 *
 * Then:
 *   - inertia smooths against previous tick speed
 *   - noise adds ±noiseFactor/2 random variation
 *   - fatigue penalty applies if anaerobic energy is depleted
 *   - final-stretch burst kicks in once past burstThreshold
 */
export function computeTick(input: TickInput): {
  newSpeed: number
  newAnaerobicEnergy: number
  hasBursted: boolean
} {
  const { state, horse, progress } = input
  const e = RACING_CONFIG.engine

  // 1. Base speed from attributes (distance-weighted)
  const conditionContribution = horse.condition * e.conditionWeight
  const accelContribution = horse.acceleration * (1 - progress) * e.accelerationWeight
  const staminaContribution = horse.stamina * progress * e.staminaWeight

  let baseSpeed = conditionContribution + accelContribution + staminaContribution

  // 2. Final-stretch burst (high-stamina horses kick at the end)
  let hasBursted = state.hasBursted
  if (progress > e.burstThreshold && !state.hasBursted) {
    const burstMultiplier = 1 + (horse.stamina / e.attributeScale) * e.burstStaminaFactor
    baseSpeed *= burstMultiplier
    hasBursted = true
  }

  // 3. Anaerobic energy depletion (high-acceleration horses tire faster)
  const tickCost = e.anaerobicTickCost * (horse.acceleration / e.attributeScale)
  const newAnaerobicEnergy = Math.max(0, state.anaerobicEnergy - tickCost)

  // 4. Fatigue penalty when anaerobic energy is critically low
  if (newAnaerobicEnergy < e.fatigueThreshold) {
    const deficit = e.fatigueThreshold - newAnaerobicEnergy
    const penalty = deficit * e.fatiguePenaltyFactor
    baseSpeed *= (1 - penalty)
  }

  // 5. Inertia (smooths tick-to-tick variation)
  const inertialSpeed = state.speed * e.inertia + baseSpeed * (1 - e.inertia)

  // 6. Noise (adds nondeterministic variation: ±noiseFactor/2)
  const noiseMultiplier = 1 - e.noiseFactor / 2 + Math.random() * e.noiseFactor

  const newSpeed = inertialSpeed * noiseMultiplier

  return {
    newSpeed,
    newAnaerobicEnergy,
    hasBursted,
  }
}

// ─────────────────────────────────────────────────────────────────
// STATE INITIALIZATION
// ─────────────────────────────────────────────────────────────────

export function createInitialState(horse: Horse): HorseRaceState {
  const e = RACING_CONFIG.engine
  return {
    horseId: horse.id,
    progress: 0,
    speed: horse.condition * e.conditionWeight,
    anaerobicEnergy: e.maxAnaerobicEnergy,
    hasBursted: false,
    finishedAtTick: null,
  }
}

// ─────────────────────────────────────────────────────────────────
// PROGRESS UPDATE
// ─────────────────────────────────────────────────────────────────

/**
 * Convert tick speed to a normalized progress increment.
 *
 * Speeds are in arbitrary "speed units"; we normalize so a typical condition-50
 * horse covers the full track in a reasonable wall-clock time. Calibration
 * constants live in RACING_CONFIG.engine.
 */
export function speedToProgressDelta(speed: number, distance: number): number {
  const { progressPerSpeedUnit, referenceDistance } = RACING_CONFIG.engine
  const distanceFactor = referenceDistance / distance  // longer races = slower per-tick
  return speed * progressPerSpeedUnit * distanceFactor
}
