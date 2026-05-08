/**
 * GameLayout widget — exercises the topbar handlers (onGenerate, onStartPause,
 * onSkip) which were 0% function-covered before this file existed. We click
 * through real buttons rather than calling handlers directly so the wiring
 * between template and setup-script is locked too.
 *
 * RAF and inter-round timers are mocked because GameLayout mounts RaceTrack,
 * which spins up the race engine via useRafFn the moment a round starts.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { nextTick } from 'vue'
import GameLayout from '@widgets/game-layout/ui/GameLayout.vue'
import { useRaceStore } from '@entities/race'
import { useHorseStore } from '@entities/horse'
import { COPY, RACING_CONFIG } from '@shared/config'

// ─── RAF + timer harness ─────────────────────────────────────────

beforeEach(() => {
  setActivePinia(createPinia())
  vi.useFakeTimers()
  vi.stubGlobal('requestAnimationFrame', () => 1)
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

// ─── Helpers ─────────────────────────────────────────────────────

function findButtonByText(w: VueWrapper, text: string) {
  return w.findAll('button').find((b) => b.text().includes(text))
}

function generateButton(w: VueWrapper) {
  return findButtonByText(w, COPY.actions.generate)!
}
function skipButton(w: VueWrapper) {
  return findButtonByText(w, COPY.actions.skip)!
}
/** The Start/Pause button — text flips with status. */
function primaryButton(w: VueWrapper) {
  return w.find('button.btn-primary')
}

// ─── Tests ───────────────────────────────────────────────────────

describe('GameLayout — Generate program', () => {
  it('populates the schedule with all configured rounds', async () => {
    wrapper = mount(GameLayout)
    const race = useRaceStore()
    expect(race.schedule).toHaveLength(0)

    await generateButton(wrapper).trigger('click')
    await nextTick()

    expect(race.schedule).toHaveLength(RACING_CONFIG.rounds.length)
    expect(race.status).toBe('ready')
  })

  it('seeds horses on first generation via the horse store', () => {
    wrapper = mount(GameLayout)
    const horses = useHorseStore()
    // Horse store auto-generates 20 horses on first instantiation.
    expect(horses.horses).toHaveLength(RACING_CONFIG.horses.totalCount)
  })
})

describe('GameLayout — Start / Pause toggle', () => {
  it('clicking the primary button after generate transitions to running', async () => {
    wrapper = mount(GameLayout)
    const race = useRaceStore()
    await generateButton(wrapper).trigger('click')
    await nextTick()

    await primaryButton(wrapper).trigger('click')
    await nextTick()

    expect(race.status).toBe('running')
  })

  it('clicking the primary button while running pauses the race', async () => {
    wrapper = mount(GameLayout)
    const race = useRaceStore()

    await generateButton(wrapper).trigger('click')
    await primaryButton(wrapper).trigger('click') // start
    await nextTick()
    expect(race.status).toBe('running')

    await primaryButton(wrapper).trigger('click') // pause
    await nextTick()
    expect(race.status).toBe('paused')
  })

  it('primary button label flips between Start/Resume and Pause based on status', async () => {
    wrapper = mount(GameLayout)
    await generateButton(wrapper).trigger('click')
    await nextTick()

    expect(primaryButton(wrapper).text()).toBe(COPY.actions.startOrResume)

    await primaryButton(wrapper).trigger('click')
    await nextTick()
    expect(primaryButton(wrapper).text()).toBe(COPY.actions.pause)
  })
})

describe('GameLayout — Skip round', () => {
  it('is disabled in idle and ready, enabled while running', async () => {
    wrapper = mount(GameLayout)

    expect(skipButton(wrapper).attributes('disabled')).toBeDefined()

    await generateButton(wrapper).trigger('click')
    await nextTick()
    // Still disabled — canSkip requires running||paused.
    expect(skipButton(wrapper).attributes('disabled')).toBeDefined()

    await primaryButton(wrapper).trigger('click')
    await nextTick()
    expect(skipButton(wrapper).attributes('disabled')).toBeUndefined()
  })

  it('clicking Skip while running drives the round to completion', async () => {
    wrapper = mount(GameLayout)
    const race = useRaceStore()

    await generateButton(wrapper).trigger('click')
    await primaryButton(wrapper).trigger('click') // start
    await nextTick()

    await skipButton(wrapper).trigger('click')
    await nextTick()

    expect(race.results.length).toBe(1)
    // Status enters 'between' before the inter-round timer fires.
    expect(['between', 'running']).toContain(race.status)
  })
})

describe('GameLayout — Generate disabled while a round is in flight', () => {
  it('generate is locked while running', async () => {
    wrapper = mount(GameLayout)
    await generateButton(wrapper).trigger('click')
    await primaryButton(wrapper).trigger('click') // start
    await nextTick()

    expect(generateButton(wrapper).attributes('disabled')).toBeDefined()
  })

  it('generate is locked while paused', async () => {
    wrapper = mount(GameLayout)
    await generateButton(wrapper).trigger('click')
    await primaryButton(wrapper).trigger('click') // start
    await primaryButton(wrapper).trigger('click') // pause
    await nextTick()

    expect(generateButton(wrapper).attributes('disabled')).toBeDefined()
  })
})

describe('GameLayout — header content', () => {
  it('renders the brand wordmark', () => {
    wrapper = mount(GameLayout)
    expect(wrapper.find('.brand').text()).toBe(COPY.app.title)
  })
})
