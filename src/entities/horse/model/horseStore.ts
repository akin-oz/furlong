import { defineStore } from 'pinia'
import { ref, readonly } from 'vue'
import type { Horse } from './horse.types'
import { generateHorses } from '@entities/horse'

export const useHorseStore = defineStore('horse', () => {
  const horses = ref<readonly Horse[]>(generateHorses())

  function regenerate(): void {
    horses.value = generateHorses()
  }

  function getById(id: number): Horse | undefined {
    return horses.value.find((h) => h.id === id)
  }

  return {
    horses: readonly(horses),
    regenerate,
    getById,
  }
})
