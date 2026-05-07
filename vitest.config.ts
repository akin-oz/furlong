import { defineConfig, mergeConfig } from 'vitest/config'
import viteConfig from './vite.config'

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      environment: 'happy-dom',
      globals: true,
      include: [
        'tests/unit/**/*.spec.ts',
        'tests/component/**/*.spec.ts',
      ],
      coverage: {
        provider: 'v8',
        reporter: ['text', 'html', 'lcov'],
        include: ['src/**/*.{ts,vue}'],
        exclude: [
          'src/**/*.stories.ts',
          'src/**/index.ts',
          'src/app/**',
        ],
      },
    },
  }),
)
