import { defineConfig } from 'eslint/config'
import js from '@eslint/js'
import tseslint from 'typescript-eslint'
import pluginVue from 'eslint-plugin-vue'
import boundariesPlugin from 'eslint-plugin-boundaries'

/**
 * Feature-Sliced Design layer hierarchy enforced by eslint-plugin-boundaries.
 *
 * Hierarchy (top to bottom — upper layers may import from lower):
 *   app → pages → widgets → features → entities → shared
 *
 * Cross-layer imports against this direction are forbidden.
 * Cross-slice imports within the same layer (e.g. feature-A → feature-B) are forbidden.
 *
 * See ADR 0001 (Feature-Sliced Architecture) for rationale.
 */

export default defineConfig([
  js.configs.recommended,
  tseslint.configs.recommended,
  pluginVue.configs['flat/recommended'],

  {
    plugins: {
      boundaries: boundariesPlugin,
    },

    settings: {
      'boundaries/elements': [
        { type: 'app',      pattern: 'src/app/**' },
        { type: 'pages',    pattern: 'src/pages/*',     mode: 'folder', capture: ['page'] },
        { type: 'widgets',  pattern: 'src/widgets/*',   mode: 'folder', capture: ['widget'] },
        { type: 'features', pattern: 'src/features/*',  mode: 'folder', capture: ['feature'] },
        { type: 'entities', pattern: 'src/entities/*',  mode: 'folder', capture: ['entity'] },
        { type: 'shared',   pattern: 'src/shared/**' },
      ],
      'boundaries/include': ['src/**/*'],
    },

    rules: {
      'boundaries/element-types': [
        'error',
        {
          default: 'disallow',
          rules: [
            // app may import from anywhere below
            { from: 'app', allow: ['app', 'pages', 'widgets', 'features', 'entities', 'shared'] },

            // pages may import widgets, features, entities, shared
            { from: 'pages', allow: ['widgets', 'features', 'entities', 'shared'] },

            // widgets may import features, entities, shared (no other widget)
            { from: 'widgets', allow: ['features', 'entities', 'shared'] },

            // features may import entities, shared — but NOT other features
            { from: 'features', allow: ['entities', 'shared'] },

            // entities may import other entities and shared
            { from: 'entities', allow: ['entities', 'shared'] },

            // shared can only import from itself
            { from: 'shared', allow: ['shared'] },
          ],
        },
      ],

      // Force imports go through public API (index.ts)
      'boundaries/no-private': ['error', { allowUncles: false }],
    },
  },

  {
    files: ['**/*.vue'],
    languageOptions: {
      parserOptions: {
        parser: tseslint.parser,
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
    },
    rules: {
      'vue/multi-word-component-names': 'off',
      'vue/no-v-html': 'off',
    },
  },

  {
    files: ['tests/**/*.ts', '**/*.stories.ts', '**/*.spec.ts'],
    rules: {
      'boundaries/element-types': 'off',
      'boundaries/no-private': 'off',
    },
  },

  {
    ignores: ['dist/**', 'node_modules/**', 'storybook-static/**', 'coverage/**', 'playwright-report/**'],
  },
])
