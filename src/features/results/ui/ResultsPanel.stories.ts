import type { Meta, StoryObj } from '@storybook/vue3-vite'
import ResultsPanel from './ResultsPanel.vue'
import { seedStores } from '@shared/test/storybookSeed'

const meta: Meta<typeof ResultsPanel> = {
  title: 'Features/Results/ResultsPanel',
  component: ResultsPanel,
  decorators: [
    () => ({
      template: `<div style="width: 340px; padding: 24px; background: var(--paper); display: flex;"><story /></div>`,
    }),
  ],
}
export default meta

type Story = StoryObj<typeof ResultsPanel>

function makeStory(completedRounds: number): Story {
  return {
    render: () => ({
      components: { ResultsPanel },
      template: '<ResultsPanel />',
      setup() {
        seedStores({ withSchedule: true, completedRounds })
        return {}
      },
    }),
  }
}

export const Empty: Story = {
  render: () => ({
    components: { ResultsPanel },
    template: '<ResultsPanel />',
    setup() {
      seedStores({})
      return {}
    },
  }),
}

export const SingleRound: Story = makeStory(1)
export const ThreeRounds: Story = makeStory(3)
export const AllSettled: Story = makeStory(6)
