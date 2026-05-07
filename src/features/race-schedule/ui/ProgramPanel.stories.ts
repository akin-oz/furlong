import type { Meta, StoryObj } from '@storybook/vue3-vite'
import ProgramPanel from './ProgramPanel.vue'
import { seedStores } from '@shared/test/storybookSeed'

const meta: Meta<typeof ProgramPanel> = {
  title: 'Features/Race Schedule/ProgramPanel',
  component: ProgramPanel,
  decorators: [
    (story) => ({
      components: { Story: story },
      template: `<div style="width: 320px; padding: 24px; background: var(--paper); display: flex;"><Story /></div>`,
    }),
  ],
}
export default meta

type Story = StoryObj<typeof ProgramPanel>

function makeStory(seed: Parameters<typeof seedStores>[0]): Story {
  return {
    render: () => ({
      components: { ProgramPanel },
      template: '<ProgramPanel />',
      setup() {
        seedStores(seed)
        return {}
      },
    }),
  }
}

export const Empty: Story = makeStory({})
export const RoundOneLive: Story = makeStory({ withSchedule: true, completedRounds: 0 })
export const MidChampionship: Story = makeStory({ withSchedule: true, completedRounds: 2 })
export const Finished: Story = makeStory({ withSchedule: true, completedRounds: 6 })
