import { defineStore } from 'pinia'
import { ref, readonly } from 'vue'
import type { Horse } from './horse.types'
import { generateHorses } from '@entities/horse'

export const useHorseStore = defineStore('horse', () => {
  const horses = ref<readonly Horse[]>(generateHorses())

  function regenerate(): void {
    horses.value = generateHorses()
  }

  /**
   * Replace the roster with an explicit set of horses.
   * Used by stories and fixture-driven tests to inject deterministic data.
   */
  function setHorses(next: readonly Horse[]): void {
    horses.value = next
  }

  function getById(id: number): Horse | undefined {
    return horses.value.find((h) => h.id === id)
  }

  return {
    horses: readonly(horses),
    regenerate,
    setHorses,
    getById,
  }
})
