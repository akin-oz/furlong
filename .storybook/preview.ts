import type { Preview } from '@storybook/vue3-vite'
import { setup } from '@storybook/vue3-vite'
import { createPinia } from 'pinia'
import { applyDesignTokens } from '../src/app/styles/applyTokens'
import '../src/app/styles/main.css'

applyDesignTokens()

setup((app) => {
  app.use(createPinia())
})

const preview: Preview = {
  parameters: {
    backgrounds: {
      default: 'paper',
      values: [
        { name: 'paper', value: '#F4F1EB' },
        { name: 'ink', value: '#1A1815' },
      ],
    },
    layout: 'fullscreen',
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
  },
}

export default preview
