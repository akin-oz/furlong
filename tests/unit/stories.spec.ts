/**
 * Smoke tests — every story file's render functions mount without throwing
 * and produce non-empty DOM. Catches regressions like broken store seeding,
 * missing imports, and Vue template errors.
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import type { StoryObj } from '@storybook/vue3-vite'

import * as HorseTableStories from '@features/horse-list/ui/HorseTable.stories'
import * as HorseLaneStories from '@features/race-track/ui/HorseLane.stories'
import * as RaceTrackStories from '@features/race-track/ui/RaceTrack.stories'
import * as ProgramStories from '@features/race-schedule/ui/ProgramPanel.stories'
import * as ResultsStories from '@features/results/ui/ResultsPanel.stories'
import * as StandingsStories from '@features/standings/ui/StandingsPanel.stories'
import * as GameLayoutStories from '@widgets/game-layout/ui/GameLayout.stories'

interface AnyStory {
  render?: () => unknown
  args?: Record<string, unknown>
  component?: unknown
}

interface StoryModule {
  default: { component?: unknown }
  [key: string]: unknown
}

function collectStories(mod: StoryModule): Array<{ name: string; story: AnyStory }> {
  const out: Array<{ name: string; story: AnyStory }> = []
  for (const key of Object.keys(mod)) {
    if (key === 'default') continue
    const story = (mod as Record<string, unknown>)[key] as StoryObj | undefined
    if (story && typeof story === 'object') {
      out.push({ name: key, story: story as AnyStory })
    }
  }
  return out
}

const modules: Array<{ title: string; mod: StoryModule }> = [
  { title: 'HorseTable', mod: HorseTableStories as unknown as StoryModule },
  { title: 'HorseLane', mod: HorseLaneStories as unknown as StoryModule },
  { title: 'RaceTrack', mod: RaceTrackStories as unknown as StoryModule },
  { title: 'ProgramPanel', mod: ProgramStories as unknown as StoryModule },
  { title: 'ResultsPanel', mod: ResultsStories as unknown as StoryModule },
  { title: 'StandingsPanel', mod: StandingsStories as unknown as StoryModule },
  { title: 'GameLayout', mod: GameLayoutStories as unknown as StoryModule },
]

let wrapper: VueWrapper | null = null

beforeEach(() => {
  setActivePinia(createPinia())
})

afterEach(() => {
  wrapper?.unmount()
  wrapper = null
})

for (const { title, mod } of modules) {
  describe(`${title} stories`, () => {
    const stories = collectStories(mod)
    const meta = mod.default

    for (const { name, story } of stories) {
      it(`${name} renders without throwing`, () => {
        const Component = (story.component ?? meta.component) as unknown
        let descriptor: unknown

        if (typeof story.render === 'function') {
          descriptor = story.render()
        } else if (Component) {
          descriptor = { components: { C: Component }, template: '<C v-bind="$attrs" />' }
        } else {
          throw new Error('Story has neither render nor component')
        }

        wrapper = mount(descriptor as Parameters<typeof mount>[0], {
          props: (story.args ?? {}) as Record<string, unknown>,
          global: { plugins: [createPinia()] },
        })

        expect(wrapper.html().length).toBeGreaterThan(0)
        // Stories should produce at least one element with meaningful content.
        expect(wrapper.element.children.length).toBeGreaterThan(0)
      })
    }
  })
}
