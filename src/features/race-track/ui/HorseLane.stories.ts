import type { Meta, StoryObj } from '@storybook/vue3-vite'
import HorseLane from './HorseLane.vue'
import { makeFixtureHorses } from '@shared/test/fixtures'

const horses = makeFixtureHorses()

const meta: Meta<typeof HorseLane> = {
  title: 'Features/Race Track/HorseLane',
  component: HorseLane,
  argTypes: {
    progress: { control: { type: 'range', min: 0, max: 1, step: 0.01 } },
    laneNumber: { control: { type: 'number', min: 1, max: 10 } },
  },
  decorators: [
    (story) => ({
      components: { Story: story },
      template: `
        <div style="width: 600px; height: 46px; padding: 0 60px 0 0; background: var(--paper);">
          <Story />
        </div>
      `,
    }),
  ],
}
export default meta

type Story = StoryObj<typeof HorseLane>

export const AtStart: Story = {
  args: { horse: horses[0]!, laneNumber: 1, progress: 0 },
}

export const Midway: Story = {
  args: { horse: horses[1]!, laneNumber: 2, progress: 0.5 },
}

export const NearFinish: Story = {
  args: { horse: horses[2]!, laneNumber: 3, progress: 0.92 },
}
