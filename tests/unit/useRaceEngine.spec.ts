/**
 * useRaceEngine — Vue composable wrapper around the pure tick logic.
 *
 * RAF is mocked manually because happy-dom's requestAnimationFrame is not
 * driven by vi's fake timers. Tests focus on synchronous control surfaces
 * (startRound, skipRound, pause, resume) plus a single reactive-tick smoke
 * test that proves the RAF wiring engages — full simulations live in
 * raceEngine.spec.ts.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { effectScope } from 'vue'
import { useRaceEngine } from '@/features/race-track/model/useRaceEngine'
import { RACING_CONFIG } from '@shared/config'
import type { Horse } from '@entities/horse'
import type { RoundResult } from '@entities/race'

// ─── Fixtures ────────────────────────────────────────────────────

function makeHorse(overrides: Partial<Horse> & { id: number }): Horse {
  return {
    id: overrides.id,
    name: overrides.name ?? `Horse ${overrides.id}`,
    color: overrides.color ?? '#000000',
    age: overrides.age ?? 4,
    condition: overrides.condition ?? 60,
    stamina: overrides.stamina ?? 60,
    acceleration: overrides.acceleration ?? 60,
  }
}

function makeRound(distance = RACING_CONFIG.rounds[2]!.distance) {
  const horses = Array.from({ length: RACING_CONFIG.horses.perRound }, (_, i) =>
    makeHorse({ id: i + 1 }),
  )
  return { id: 1, distance, horses }
}

// ─── Manual RAF harness ──────────────────────────────────────────

let rafCallbacks: FrameRequestCallback[] = []
let rafId = 0

function tickRAF(timestamp: number): void {
  const callbacks = rafCallbacks
  rafCallbacks = []
  for (const cb of callbacks) cb(timestamp)
}

// Wraps composable in an effect scope so reactive cleanup is bounded.
function withScope<T>(fn: () => T): { result: T; dispose: () => void } {
  const scope = effectScope()
  const result = scope.run(fn)!
  return { result, dispose: () => scope.stop() }
}

// ─── Setup ───────────────────────────────────────────────────────

beforeEach(() => {
  setActivePinia(createPinia())
  rafCallbacks = []
  rafId = 0
  vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
    rafCallbacks.push(cb)
    return ++rafId
  })
  vi.stubGlobal('cancelAnimationFrame', () => {})
  // Deterministic noise so we don't fight the RNG in coverage assertions.
  vi.spyOn(Math, 'random').mockReturnValue(0.5)
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

// ─── Tests ───────────────────────────────────────────────────────

describe('useRaceEngine — startRound', () => {
  it('initializes state for all 10 horses with progress 0', () => {
    const { result, dispose } = withScope(() =>
      useRaceEngine({ onRoundComplete: () => {} }),
    )
    const round = makeRound()
    result.startRound(round)

    const progress = result.horseProgress.value
    expect(Object.keys(progress)).toHaveLength(round.horses.length)
    for (const horse of round.horses) {
      expect(progress[horse.id]).toBe(0)
    }
    expect(result.tickCount.value).toBe(0)
    dispose()
  })

  it('resets tickCount when a new round starts', () => {
    const { result, dispose } = withScope(() =>
      useRaceEngine({ onRoundComplete: () => {} }),
    )
    result.startRound(makeRound())
    result.skipRound() // pushes tickCount way up
    expect(result.tickCount.value).toBeGreaterThan(0)

    result.startRound(makeRound())
    expect(result.tickCount.value).toBe(0)
    dispose()
  })
})

describe('useRaceEngine — skipRound', () => {
  it('runs synchronously and emits a round result with all positions', () => {
    const onRoundComplete = vi.fn<(result: RoundResult) => void>()
    const { result, dispose } = withScope(() => useRaceEngine({ onRoundComplete }))

    const round = makeRound()
    result.startRound(round)
    result.skipRound()

    expect(onRoundComplete).toHaveBeenCalledTimes(1)
    const emitted = onRoundComplete.mock.calls[0]![0]
    expect(emitted.roundId).toBe(round.id)
    expect(emitted.distance).toBe(round.distance)
    expect(emitted.positions).toHaveLength(round.horses.length)
    const positionsInOrder = emitted.positions.map((p) => p.position)
    expect(positionsInOrder).toEqual(
      Array.from({ length: round.horses.length }, (_, i) => i + 1),
    )
    dispose()
  })

  it('respects the safety guard when horses cannot make progress', () => {
    const onRoundComplete = vi.fn<(result: RoundResult) => void>()
    const { result, dispose } = withScope(() => useRaceEngine({ onRoundComplete }))

    // Zero-attribute horses produce zero baseline speed; with inertia they stay
    // at 0 forever. The skipSafetyTickLimit must terminate the loop.
    const horses = Array.from({ length: RACING_CONFIG.horses.perRound }, (_, i) =>
      makeHorse({ id: i + 1, condition: 0, stamina: 0, acceleration: 0 }),
    )
    result.startRound({ id: 9, distance: RACING_CONFIG.rounds[0]!.distance, horses })
    result.skipRound()

    expect(onRoundComplete).toHaveBeenCalledTimes(1)
    expect(result.tickCount.value).toBeGreaterThanOrEqual(
      RACING_CONFIG.engine.skipSafetyTickLimit,
    )
    // No horse finished — emitted positions list is empty (nothing crossed).
    const emitted = onRoundComplete.mock.calls[0]![0]
    expect(emitted.positions).toHaveLength(0)
    dispose()
  })
})

describe('useRaceEngine — pause / resume', () => {
  it('pause sets isRunning to false', () => {
    const { result, dispose } = withScope(() =>
      useRaceEngine({ onRoundComplete: () => {} }),
    )
    result.startRound(makeRound())
    expect(result.isRunning.value).toBe(true)

    result.pause()
    expect(result.isRunning.value).toBe(false)
    dispose()
  })

  it('resume restarts the RAF loop', () => {
    const { result, dispose } = withScope(() =>
      useRaceEngine({ onRoundComplete: () => {} }),
    )
    result.startRound(makeRound())
    result.pause()
    expect(result.isRunning.value).toBe(false)

    result.resume()
    expect(result.isRunning.value).toBe(true)
    dispose()
  })
})

describe('useRaceEngine — RAF-driven tick', () => {
  it('horseProgress updates after a RAF tick at or above the tick interval', () => {
    const { result, dispose } = withScope(() =>
      useRaceEngine({ onRoundComplete: () => {} }),
    )
    result.startRound(makeRound())

    // First RAF at t=0 establishes the lastTickAt baseline (no work).
    tickRAF(0)
    // Second RAF after the configured interval triggers a tick.
    tickRAF(RACING_CONFIG.engine.tickIntervalMs)

    expect(result.tickCount.value).toBeGreaterThan(0)
    const progress = result.horseProgress.value
    const moved = Object.values(progress).some((p) => p > 0)
    expect(moved).toBe(true)
    dispose()
  })
})
