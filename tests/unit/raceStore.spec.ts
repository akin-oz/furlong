/**
 * Race store — state machine.
 *
 * Covers ADR 0007 (Round flow and state machine) and ADR 0008 (Pause/resume
 * and skip semantics). Each test exercises a single transition or guard so
 * regressions point at the exact rule that broke.
 */

import { beforeEach, describe, expect, it } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useRaceStore } from '@entities/race'
import type { RaceRound, RoundResult } from '@entities/race'
import { RACING_CONFIG } from '@shared/config'
import { makeFixtureHorses, makeFixtureRound, makeFixtureResult } from '@shared/test/fixtures'

function buildSchedule(size = RACING_CONFIG.rounds.length): readonly RaceRound[] {
  const horses = makeFixtureHorses()
  return RACING_CONFIG.rounds
    .slice(0, size)
    .map((r) => makeFixtureRound(r.id, r.distance, horses))
}

function buildResult(round: RaceRound): RoundResult {
  return makeFixtureResult(round)
}

beforeEach(() => {
  setActivePinia(createPinia())
})

describe('Race store — initial state', () => {
  it('starts in idle with no schedule and no results', () => {
    const store = useRaceStore()
    expect(store.status).toBe('idle')
    expect(store.schedule).toHaveLength(0)
    expect(store.results).toHaveLength(0)
    expect(store.currentRoundIndex).toBe(0)
    expect(store.currentRound).toBeNull()
  })
})

describe('Race store — setSchedule', () => {
  it('moves idle → ready when a non-empty schedule is set', () => {
    const store = useRaceStore()
    store.setSchedule(buildSchedule())
    expect(store.status).toBe('ready')
    expect(store.schedule).toHaveLength(6)
    expect(store.currentRoundIndex).toBe(0)
    expect(store.currentRound?.id).toBe(1)
  })

  it('stays in idle when set with an empty schedule', () => {
    const store = useRaceStore()
    store.setSchedule([])
    expect(store.status).toBe('idle')
  })

  it('clears prior results when a new schedule is set', () => {
    const store = useRaceStore()
    const schedule = buildSchedule()
    store.setSchedule(schedule)
    store.start()
    store.finishRound(buildResult(schedule[0]!))
    expect(store.results).toHaveLength(1)

    store.setSchedule(buildSchedule())
    expect(store.results).toHaveLength(0)
    expect(store.currentRoundIndex).toBe(0)
  })
})

describe('Race store — start', () => {
  it('moves ready → running', () => {
    const store = useRaceStore()
    store.setSchedule(buildSchedule())
    store.start()
    expect(store.status).toBe('running')
  })

  it('moves paused → running', () => {
    const store = useRaceStore()
    store.setSchedule(buildSchedule())
    store.start()
    store.pause()
    store.start()
    expect(store.status).toBe('running')
  })

  it('moves between → running', () => {
    const store = useRaceStore()
    const schedule = buildSchedule()
    store.setSchedule(schedule)
    store.start()
    store.finishRound(buildResult(schedule[0]!))
    expect(store.status).toBe('between')
    store.start()
    expect(store.status).toBe('running')
  })

  it('does NOT transition out of idle', () => {
    const store = useRaceStore()
    store.start()
    expect(store.status).toBe('idle')
  })

  it('does NOT transition out of finished', () => {
    const store = useRaceStore()
    const schedule = buildSchedule()
    store.setSchedule(schedule)
    for (const round of schedule) {
      store.start()
      store.finishRound(buildResult(round))
      if (store.status === 'between') store.advanceToNextRound()
    }
    expect(store.status).toBe('finished')
    store.start()
    expect(store.status).toBe('finished')
  })
})

describe('Race store — pause', () => {
  it('moves running → paused', () => {
    const store = useRaceStore()
    store.setSchedule(buildSchedule())
    store.start()
    store.pause()
    expect(store.status).toBe('paused')
  })

  it('is a no-op outside running', () => {
    const store = useRaceStore()
    store.pause()
    expect(store.status).toBe('idle')

    store.setSchedule(buildSchedule())
    store.pause()
    expect(store.status).toBe('ready')
  })
})

describe('Race store — finishRound', () => {
  it('appends the result and moves running → between when not last', () => {
    const store = useRaceStore()
    const schedule = buildSchedule()
    store.setSchedule(schedule)
    store.start()
    store.finishRound(buildResult(schedule[0]!))
    expect(store.results).toHaveLength(1)
    expect(store.status).toBe('between')
  })

  it('moves running → finished when last round completes', () => {
    const store = useRaceStore()
    const schedule = buildSchedule()
    store.setSchedule(schedule)
    for (let i = 0; i < schedule.length; i++) {
      store.start()
      store.finishRound(buildResult(schedule[i]!))
      if (i < schedule.length - 1) store.advanceToNextRound()
    }
    expect(store.status).toBe('finished')
    expect(store.results).toHaveLength(schedule.length)
  })

  it('preserves result order across rounds', () => {
    const store = useRaceStore()
    const schedule = buildSchedule()
    store.setSchedule(schedule)
    store.start()
    store.finishRound(buildResult(schedule[0]!))
    store.advanceToNextRound()
    store.finishRound(buildResult(schedule[1]!))
    const ids = store.results.map((r) => r.roundId)
    expect(ids).toEqual([1, 2])
  })
})

describe('Race store — advanceToNextRound', () => {
  it('moves between → running and increments the round index', () => {
    const store = useRaceStore()
    const schedule = buildSchedule()
    store.setSchedule(schedule)
    store.start()
    store.finishRound(buildResult(schedule[0]!))
    store.advanceToNextRound()
    expect(store.currentRoundIndex).toBe(1)
    expect(store.status).toBe('running')
    expect(store.currentRound?.id).toBe(2)
  })

  it('is a no-op when status is not "between"', () => {
    const store = useRaceStore()
    store.setSchedule(buildSchedule())
    store.advanceToNextRound()
    expect(store.currentRoundIndex).toBe(0)
    expect(store.status).toBe('ready')
  })
})

describe('Race store — reset', () => {
  it('returns the store to idle and clears all state', () => {
    const store = useRaceStore()
    const schedule = buildSchedule()
    store.setSchedule(schedule)
    store.start()
    store.finishRound(buildResult(schedule[0]!))
    store.reset()
    expect(store.status).toBe('idle')
    expect(store.schedule).toHaveLength(0)
    expect(store.results).toHaveLength(0)
    expect(store.currentRoundIndex).toBe(0)
    expect(store.currentRound).toBeNull()
  })
})

describe('Race store — guard computeds', () => {
  it('canGenerate is true in idle, ready, and finished only', () => {
    const store = useRaceStore()
    // idle
    expect(store.canGenerate).toBe(true)
    // ready
    store.setSchedule(buildSchedule())
    expect(store.canGenerate).toBe(true)
    // running
    store.start()
    expect(store.canGenerate).toBe(false)
    // paused
    store.pause()
    expect(store.canGenerate).toBe(false)
    // between
    store.start()
    store.finishRound(buildResult(store.currentRound!))
    expect(store.canGenerate).toBe(false)
    // finished
    while (store.status !== 'finished') {
      if (store.status === 'between') store.advanceToNextRound()
      store.start()
      store.finishRound(buildResult(store.currentRound!))
    }
    expect(store.canGenerate).toBe(true)
  })

  it('canStart is true in ready, paused, and between only', () => {
    const store = useRaceStore()
    expect(store.canStart).toBe(false) // idle

    const schedule = buildSchedule()
    store.setSchedule(schedule)
    expect(store.canStart).toBe(true) // ready

    store.start()
    expect(store.canStart).toBe(false) // running

    store.pause()
    expect(store.canStart).toBe(true) // paused

    store.start()
    store.finishRound(buildResult(schedule[0]!))
    expect(store.canStart).toBe(true) // between
  })

  it('canPause is true only while running', () => {
    const store = useRaceStore()
    expect(store.canPause).toBe(false)
    store.setSchedule(buildSchedule())
    expect(store.canPause).toBe(false) // ready
    store.start()
    expect(store.canPause).toBe(true) // running
    store.pause()
    expect(store.canPause).toBe(false) // paused
  })

  it('canSkip is true while running or paused', () => {
    const store = useRaceStore()
    expect(store.canSkip).toBe(false) // idle
    store.setSchedule(buildSchedule())
    expect(store.canSkip).toBe(false) // ready
    store.start()
    expect(store.canSkip).toBe(true) // running
    store.pause()
    expect(store.canSkip).toBe(true) // paused
  })

  it('isLastRound is true only at the final scheduled round', () => {
    const store = useRaceStore()
    const schedule = buildSchedule()
    store.setSchedule(schedule)
    expect(store.isLastRound).toBe(false)
    for (let i = 0; i < schedule.length - 1; i++) {
      store.start()
      store.finishRound(buildResult(schedule[i]!))
      store.advanceToNextRound()
    }
    expect(store.isLastRound).toBe(true)
  })
})

describe('Race store — full championship walkthrough', () => {
  it('completes 6 rounds and ends in finished with all results recorded', () => {
    const store = useRaceStore()
    const schedule = buildSchedule()
    store.setSchedule(schedule)

    for (let i = 0; i < schedule.length; i++) {
      store.start()
      expect(store.currentRoundIndex).toBe(i)
      store.finishRound(buildResult(schedule[i]!))
      if (i < schedule.length - 1) {
        expect(store.status).toBe('between')
        store.advanceToNextRound()
      }
    }

    expect(store.status).toBe('finished')
    expect(store.results.map((r) => r.roundId)).toEqual([1, 2, 3, 4, 5, 6])
  })
})
