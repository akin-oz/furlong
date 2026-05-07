/**
 * useRaceEngine — Vue composable wrapper around the pure race engine.
 *
 * Drives ticks via useRafFn (VueUse), maintains per-horse race state in a
 * reactive Map, and exposes start/pause/skip controls.
 *
 * The component using this composable receives reactive `progress` values
 * and renders them via CSS transform. See ADR 0004 (Animation strategy).
 */

import { ref, computed, type Ref } from 'vue'
import { useRafFn } from '@vueuse/core'
import { RACING_CONFIG } from '@shared/config'
import type { Horse, HorseRaceState } from '@entities/horse'
import type { FinishingPosition, RoundResult } from '@entities/race'
import {
  computeTick,
  createInitialState,
  speedToProgressDelta,
} from './raceEngine'

export interface UseRaceEngineOptions {
  /**
   * Called once when all horses in the round have finished.
   * Provides the final round result with positions ordered.
   */
  onRoundComplete: (result: RoundResult) => void
}

export function useRaceEngine(options: UseRaceEngineOptions) {
  const horses = ref<readonly Horse[]>([])
  const distance = ref(0)
  const roundId = ref(0)

  const states = ref(new Map<number, HorseRaceState>())
  const tickCount = ref(0)
  const lastTickAt = ref(0)

  let finishingOrder: FinishingPosition[] = []

  // ─── Tick loop ────────────────────────────────────────────────
  const rafLoop = useRafFn(
    ({ timestamp }) => {
      const { tickIntervalMs } = RACING_CONFIG.engine
      if (timestamp - lastTickAt.value < tickIntervalMs) return
      lastTickAt.value = timestamp

      tickCount.value += 1
      runTick()
    },
    { immediate: false },
  )

  function runTick(): void {
    const allFinished = stepAllHorses()
    if (allFinished) {
      rafLoop.pause()
      emitRoundComplete()
    }
  }

  function stepAllHorses(): boolean {
    let allFinished = true

    for (const horse of horses.value) {
      const state = states.value.get(horse.id)
      if (!state) continue

      // Already finished — don't update
      if (state.finishedAtTick !== null) continue

      const { newSpeed, newAnaerobicEnergy, hasBursted } = computeTick({
        state,
        horse,
        progress: state.progress,
      })

      const delta = speedToProgressDelta(newSpeed, distance.value)
      const newProgress = Math.min(1, state.progress + delta)

      state.speed = newSpeed
      state.anaerobicEnergy = newAnaerobicEnergy
      state.hasBursted = hasBursted
      state.progress = newProgress

      if (newProgress >= 1) {
        state.finishedAtTick = tickCount.value
        finishingOrder.push({
          position: finishingOrder.length + 1,
          horseId: horse.id,
          horseName: horse.name,
          horseColor: horse.color,
          finishedAtTick: tickCount.value,
        })
      } else {
        allFinished = false
      }
    }

    return allFinished
  }

  function emitRoundComplete(): void {
    const result: RoundResult = {
      roundId: roundId.value,
      distance: distance.value,
      positions: [...finishingOrder],
    }
    options.onRoundComplete(result)
  }

  // ─── Public controls ──────────────────────────────────────────

  function startRound(round: { id: number; distance: number; horses: readonly Horse[] }): void {
    horses.value = round.horses
    distance.value = round.distance
    roundId.value = round.id

    states.value = new Map(
      round.horses.map((h) => [h.id, createInitialState(h)] as const),
    )
    tickCount.value = 0
    finishingOrder = []
    rafLoop.resume()
  }

  function pause(): void {
    rafLoop.pause()
  }

  function resume(): void {
    rafLoop.resume()
  }

  /**
   * Skip the current round to completion without animation.
   * Runs ticks synchronously until all horses finish.
   */
  function skipRound(): void {
    rafLoop.pause()
    while (true) {
      tickCount.value += 1
      const allFinished = stepAllHorses()
      if (allFinished) break

      // Safety guard against infinite loops if a horse stalls
      if (tickCount.value > 50_000) break
    }
    emitRoundComplete()
  }

  // ─── Reactive readouts for UI ─────────────────────────────────
  const horseProgress: Ref<Record<number, number>> = computed(() => {
    const out: Record<number, number> = {}
    for (const [id, state] of states.value) {
      out[id] = state.progress
    }
    return out
  })

  const isRunning = computed(() => rafLoop.isActive.value)

  return {
    startRound,
    pause,
    resume,
    skipRound,
    horseProgress,
    isRunning,
    tickCount,
  }
}
