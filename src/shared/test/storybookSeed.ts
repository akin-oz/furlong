/**
 * Shared seeding helpers for Storybook stories.
 *
 * Each helper expects to be called inside a story's `setup()` function so
 * `useHorseStore()` and `useRaceStore()` resolve to the app-installed Pinia
 * (the one mounted by `.storybook/preview.ts`).
 *
 * Stories share a single Pinia across the iframe; helpers always reset before
 * applying their fixture state to keep stories independent.
 */

import { useHorseStore } from '@entities/horse'
import { useRaceStore } from '@entities/race'
import { RACING_CONFIG } from '@shared/config'
import {
  makeFixtureHorses,
  makeFixtureRound,
  makeFixtureResult,
} from './fixtures'

export interface SeedOptions {
  /** Number of horses in the roster (default 20). */
  rosterSize?: number
  /** Whether to install a 6-round schedule. */
  withSchedule?: boolean
  /** Number of completed rounds (auto-runs setSchedule + start + finishRound × N). */
  completedRounds?: number
  /** Final status to leave the race in. */
  finalStatus?: 'idle' | 'ready' | 'running' | 'paused' | 'finished'
}

export function seedStores(options: SeedOptions = {}): void {
  const {
    rosterSize = RACING_CONFIG.horses.totalCount,
    withSchedule = false,
    completedRounds = 0,
    finalStatus,
  } = options

  const horseStore = useHorseStore()
  const raceStore = useRaceStore()

  const horses = makeFixtureHorses(rosterSize)
  horseStore.setHorses(horses)
  raceStore.reset()

  if (!withSchedule && completedRounds === 0) {
    return
  }

  const schedule = RACING_CONFIG.rounds.map((r) =>
    makeFixtureRound(r.id, r.distance, horses),
  )
  raceStore.setSchedule(schedule)

  // Walk through completed rounds using the public state machine.
  for (let i = 0; i < completedRounds; i++) {
    raceStore.start()
    const round = schedule[i]!
    raceStore.finishRound(makeFixtureResult(round))
    if (i < schedule.length - 1) {
      raceStore.advanceToNextRound()
    }
  }

  if (finalStatus === 'paused' && raceStore.canPause) {
    raceStore.start()
    raceStore.pause()
  } else if (finalStatus === 'running' && raceStore.canStart) {
    raceStore.start()
  }
}
