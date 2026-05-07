import { defineStore } from 'pinia'
import { ref, computed, readonly } from 'vue'
import type { RaceRound, RaceStatus, RoundResult } from './race.types'

/**
 * Race store — owns schedule, current round pointer, status, and results.
 *
 * Engine logic does NOT live here. The race-track feature drives ticks via
 * useRaceEngine and reports back through finishRound().
 *
 * See ADR 0002 (Pinia store boundaries) and ADR 0007 (state machine).
 */
export const useRaceStore = defineStore('race', () => {
  const schedule = ref<readonly RaceRound[]>([])
  const currentRoundIndex = ref(0)
  const status = ref<RaceStatus>('idle')
  const results = ref<readonly RoundResult[]>([])

  // ─── Derived state ────────────────────────────────────────────
  const currentRound = computed<RaceRound | null>(() => {
    if (schedule.value.length === 0) return null
    return schedule.value[currentRoundIndex.value] ?? null
  })

  const isLastRound = computed(() =>
    currentRoundIndex.value === schedule.value.length - 1
  )

  const canStart = computed(() =>
    status.value === 'ready' ||
    status.value === 'paused' ||
    status.value === 'between'
  )

  const canPause = computed(() => status.value === 'running')

  const canSkip = computed(() =>
    status.value === 'running' || status.value === 'paused'
  )

  const canGenerate = computed(() =>
    status.value === 'idle' ||
    status.value === 'ready' ||
    status.value === 'finished'
  )

  // ─── State transitions ────────────────────────────────────────

  function setSchedule(newSchedule: readonly RaceRound[]): void {
    schedule.value = newSchedule
    currentRoundIndex.value = 0
    results.value = []
    status.value = newSchedule.length > 0 ? 'ready' : 'idle'
  }

  function start(): void {
    if (canStart.value) status.value = 'running'
  }

  function pause(): void {
    if (canPause.value) status.value = 'paused'
  }

  function finishRound(result: RoundResult): void {
    results.value = [...results.value, result]

    if (isLastRound.value) {
      status.value = 'finished'
    } else {
      status.value = 'between'
    }
  }

  function advanceToNextRound(): void {
    if (status.value !== 'between') return
    currentRoundIndex.value += 1
    status.value = 'running'
  }

  function reset(): void {
    schedule.value = []
    currentRoundIndex.value = 0
    results.value = []
    status.value = 'idle'
  }

  return {
    // State (read-only externally)
    schedule:           readonly(schedule),
    currentRoundIndex:  readonly(currentRoundIndex),
    status:             readonly(status),
    results:            readonly(results),

    // Derived
    currentRound,
    isLastRound,
    canStart,
    canPause,
    canSkip,
    canGenerate,

    // Actions
    setSchedule,
    start,
    pause,
    finishRound,
    advanceToNextRound,
    reset,
  }
})
