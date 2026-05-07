import type { Meta, StoryObj } from '@storybook/vue3-vite'
import RaceTrack from './RaceTrack.vue'
import { seedStores, type SeedOptions } from '@shared/test/storybookSeed'

const meta: Meta<typeof RaceTrack> = {
  title: 'Features/Race Track/RaceTrack',
  component: RaceTrack,
  decorators: [
    (story) => ({
      components: { Story: story },
      template: `<div style="width: 880px; height: 640px; padding: 24px; background: var(--paper); display: flex;"><Story /></div>`,
    }),
  ],
}
export default meta

type Story = StoryObj<typeof RaceTrack>

function makeStory(seed: SeedOptions): Story {
  return {
    render: () => ({
      components: { RaceTrack },
      template: '<RaceTrack />',
      setup() {
        seedStores(seed)
        return {}
      },
    }),
  }
}

export const AwaitingProgram: Story = makeStory({})
export const RoundReady: Story = makeStory({ withSchedule: true, completedRounds: 0 })
export const MidRace: Story = makeStory({
  withSchedule: true,
  completedRounds: 2,
  finalStatus: 'paused',
})
export const FinalRound: Story = makeStory({
  withSchedule: true,
  completedRounds: 5,
  finalStatus: 'paused',
})
