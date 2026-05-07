import type { Meta, StoryObj } from '@storybook/vue3-vite'
import GameLayout from './GameLayout.vue'
import { seedStores, type SeedOptions } from '@shared/test/storybookSeed'

const meta: Meta<typeof GameLayout> = {
  title: 'Widgets/GameLayout',
  component: GameLayout,
  parameters: { layout: 'fullscreen' },
}
export default meta

type Story = StoryObj<typeof GameLayout>

function makeStory(seed: SeedOptions): Story {
  return {
    render: () => ({
      components: { GameLayout },
      template: '<GameLayout />',
      setup() {
        seedStores(seed)
        return {}
      },
    }),
  }
}

export const Idle: Story = makeStory({})

export const Ready: Story = makeStory({ withSchedule: true })

export const MidChampionship: Story = makeStory({
  withSchedule: true,
  completedRounds: 2,
  finalStatus: 'paused',
})

export const Finished: Story = makeStory({
  withSchedule: true,
  completedRounds: 6,
})
