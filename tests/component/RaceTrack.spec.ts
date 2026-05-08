/**
 * RaceTrack component — covers the watch block that reacts to race-store
 * status transitions: starting/pausing/skipping the engine and queuing the
 * inter-round delay.
 *
 * Engine ticks are kept manual (mocked RAF) so tests stay fast and assert on
 * observable store state and rendered output, never on RAF callback timing.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { nextTick } from 'vue'
import RaceTrack from '@features/race-track/ui/RaceTrack.vue'
import { useRaceStore, type RoundResult } from '@entities/race'
import { RACING_CONFIG, COPY } from '@shared/config'
import {
  makeFixtureHorses,
  makeFixtureRound,
  makeFixtureResult,
} from '@shared/test/fixtures'

// ─── RAF + timer harness ─────────────────────────────────────────

let rafCallbacks: FrameRequestCallback[] = []
let rafId = 0

beforeEach(() => {
  setActivePinia(createPinia())
  vi.useFakeTimers()
  rafCallbacks = []
  rafId = 0
  vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
    rafCallbacks.push(cb)
    return ++rafId
  })
  vi.stubGlobal('cancelAnimationFrame', () => {})
  vi.spyOn(Math, 'random').mockReturnValue(0.5)
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.useRealTimers()
  vi.restoreAllMocks()
})

let wrapper: VueWrapper | null = null
afterEach(() => {
  wrapper?.unmount()
  wrapper = null
})

function buildSchedule() {
  const horses = makeFixtureHorses()
  return RACING_CONFIG.rounds.map((r) => makeFixtureRound(r.id, r.distance, horses))
}

// ─── Tests ───────────────────────────────────────────────────────

describe('RaceTrack — empty / awaiting state', () => {
  it('renders the awaiting placeholder when no schedule exists', () => {
    wrapper = mount(RaceTrack)
    expect(wrapper.find('.track-placeholder').exists()).toBe(true)
    expect(wrapper.text()).toContain(COPY.empty.track)
    expect(wrapper.find('.lanes').exists()).toBe(false)
  })
})

describe('RaceTrack — populated state', () => {
  it('renders one lane per horse for the current round', async () => {
    wrapper = mount(RaceTrack)
    const race = useRaceStore()
    race.setSchedule(buildSchedule())
    await nextTick()

    const lanes = wrapper.findAll('.lane')
    expect(lanes).toHaveLength(RACING_CONFIG.horses.perRound)
    expect(wrapper.text()).toContain(
      COPY.track.roundTitle(
        String(RACING_CONFIG.rounds[0]!.id).padStart(2, '0'),
        RACING_CONFIG.rounds[0]!.distance,
      ),
    )
  })
})

describe('RaceTrack — status transitions drive the engine', () => {
  it('pause → resume keeps the round active and lanes still mounted', async () => {
    wrapper = mount(RaceTrack)
    const race = useRaceStore()
    race.setSchedule(buildSchedule())
    await nextTick()

    race.start()
    await nextTick()
    expect(wrapper.findAll('.lane')).toHaveLength(RACING_CONFIG.horses.perRound)

    race.pause()
    await nextTick()
    expect(race.status).toBe('paused')

    race.start()
    await nextTick()
    expect(race.status).toBe('running')
  })

  it('triggers advanceToNextRound after the configured inter-round delay', async () => {
    wrapper = mount(RaceTrack)
    const race = useRaceStore()
    const schedule = buildSchedule()
    race.setSchedule(schedule)
    await nextTick()

    race.start()
    await nextTick()

    // Simulate the engine completing round 1 by calling finishRound directly —
    // this is the observable path the watch reacts to.
    const round1Result: RoundResult = makeFixtureResult(schedule[0]!)
    race.finishRound(round1Result)
    await nextTick()
    expect(race.status).toBe('between')
    expect(race.currentRoundIndex).toBe(0)

    // The watch schedules advanceToNextRound after interRoundDelayMs.
    vi.advanceTimersByTime(RACING_CONFIG.flow.interRoundDelayMs)
    await nextTick()

    expect(race.currentRoundIndex).toBe(1)
    expect(race.status).toBe('running')
  })

  it('does not advance past the final round when the championship finishes', async () => {
    wrapper = mount(RaceTrack)
    const race = useRaceStore()
    const schedule = buildSchedule()
    race.setSchedule(schedule)
    await nextTick()

    // Walk through rounds 1..5 (status enters 'between' then auto-advances).
    for (let i = 0; i < schedule.length - 1; i++) {
      race.start()
      await nextTick()
      race.finishRound(makeFixtureResult(schedule[i]!))
      await nextTick()
      vi.advanceTimersByTime(RACING_CONFIG.flow.interRoundDelayMs)
      await nextTick()
    }
    // Final round.
    race.start()
    await nextTick()
    race.finishRound(makeFixtureResult(schedule[schedule.length - 1]!))
    await nextTick()

    expect(race.status).toBe('finished')
    expect(race.results).toHaveLength(schedule.length)
  })
})

describe('RaceTrack — exposed skipRound', () => {
  it('exposes engine.skipRound to the parent via defineExpose', async () => {
    wrapper = mount(RaceTrack)
    const race = useRaceStore()
    race.setSchedule(buildSchedule())
    await nextTick()
    race.start()
    await nextTick()

    // The component must expose skipRound — calling it drives the engine
    // synchronously and produces a result.
    const exposed = wrapper.vm as unknown as { skipRound?: () => void }
    expect(typeof exposed.skipRound).toBe('function')
    exposed.skipRound!()
    await nextTick()

    expect(race.results.length).toBe(1)
    expect(race.status).toBe('between')
  })
})
