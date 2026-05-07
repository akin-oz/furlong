import { beforeEach, describe, expect, it } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useHorseStore } from '@entities/horse'
import { useRaceStore } from '@entities/race'
import { RACING_CONFIG } from '@shared/config'
import { seedStores } from '@shared/test/storybookSeed'

describe('seedStores — Storybook fixture pipeline', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('installs deterministic horses', () => {
    seedStores({})
    const horses = useHorseStore().horses
    expect(horses).toHaveLength(20)
    expect(horses[0]!.name).toBe('Ada Lovelace')
  })

  it('respects rosterSize override', () => {
    seedStores({ rosterSize: 8 })
    expect(useHorseStore().horses).toHaveLength(8)
  })

  it('installs a 6-round schedule when withSchedule is true', () => {
    seedStores({ withSchedule: true })
    const race = useRaceStore()
    expect(race.schedule).toHaveLength(6)
    expect(race.status).toBe('ready')
  })

  it('walks through completed rounds via real store actions', () => {
    seedStores({ withSchedule: true, completedRounds: 3 })
    const race = useRaceStore()
    expect(race.results).toHaveLength(3)
    expect(race.currentRoundIndex).toBe(3)
    expect(race.status).toBe('running')
  })

  it('reaches finished after all 6 rounds', () => {
    seedStores({ withSchedule: true, completedRounds: 6 })
    const race = useRaceStore()
    expect(race.results).toHaveLength(RACING_CONFIG.rounds.length)
    expect(race.status).toBe('finished')
  })

  it('honors finalStatus: "paused"', () => {
    seedStores({ withSchedule: true, completedRounds: 2, finalStatus: 'paused' })
    expect(useRaceStore().status).toBe('paused')
  })

  it('resets between calls', () => {
    seedStores({ withSchedule: true, completedRounds: 4 })
    seedStores({}) // re-seed clean
    const race = useRaceStore()
    expect(race.schedule).toHaveLength(0)
    expect(race.results).toHaveLength(0)
    expect(race.status).toBe('idle')
  })
})
