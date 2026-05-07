import type { Meta, StoryObj } from '@storybook/vue3-vite'
import HorseTable from './HorseTable.vue'
import { useHorseStore } from '@entities/horse'
import { makeFixtureHorses } from '@shared/test/fixtures'

const meta: Meta<typeof HorseTable> = {
  title: 'Features/Horse List/HorseTable',
  component: HorseTable,
  decorators: [
    (story) => ({
      components: { Story: story },
      template: `<div style="width: 320px; height: 480px; padding: 24px; background: var(--paper); display: flex;"><Story /></div>`,
    }),
  ],
}
export default meta

type Story = StoryObj<typeof HorseTable>

function makeStory(rosterSize: number): Story {
  return {
    render: () => ({
      components: { HorseTable },
      template: '<HorseTable />',
      setup() {
        const horseStore = useHorseStore()
        horseStore.setHorses(makeFixtureHorses(rosterSize))
        return {}
      },
    }),
  }
}

export const FullRoster: Story = makeStory(20)
export const ShortRoster: Story = makeStory(8)
