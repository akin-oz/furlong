import type { Meta, StoryObj } from '@storybook/vue3-vite'
import StandingsPanel from './StandingsPanel.vue'
import { seedStores } from '@shared/test/storybookSeed'

const meta: Meta<typeof StandingsPanel> = {
  title: 'Features/Standings/StandingsPanel',
  component: StandingsPanel,
  decorators: [
    (story) => ({
      components: { Story: story },
      template: `<div style="width: 360px; padding: 24px; background: var(--paper); display: flex;"><Story /></div>`,
    }),
  ],
}
export default meta

type Story = StoryObj<typeof StandingsPanel>

function makeStory(completedRounds: number): Story {
  return {
    render: () => ({
      components: { StandingsPanel },
      template: '<StandingsPanel />',
      setup() {
        seedStores({ withSchedule: true, completedRounds })
        return {}
      },
    }),
  }
}

export const BeforeFirstRound: Story = {
  render: () => ({
    components: { StandingsPanel },
    template: '<StandingsPanel />',
    setup() {
      seedStores({})
      return {}
    },
  }),
}

export const AfterRoundOne: Story = makeStory(1)
export const MidChampionship: Story = makeStory(3)
export const FinalChampionship: Story = makeStory(6)
