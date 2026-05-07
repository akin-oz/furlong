<script setup lang="ts">
import { ref } from 'vue'
import { useHorseStore } from '@entities/horse'
import { useRaceStore } from '@entities/race'
import { HorseTable } from '@features/horse-list'
import { ProgramPanel, buildSchedule } from '@features/race-schedule'
import { RaceTrack } from '@features/race-track'
import { ResultsPanel } from '@features/results'

const horseStore = useHorseStore()
const raceStore = useRaceStore()
const trackRef = ref<InstanceType<typeof RaceTrack> | null>(null)

function onGenerate() {
  raceStore.setSchedule(buildSchedule(horseStore.horses))
}

function onStartPause() {
  if (raceStore.status === 'running') {
    raceStore.pause()
  } else {
    raceStore.start()
  }
}

function onSkip() {
  trackRef.value?.skipRound()
}
</script>

<template>
  <div class="app">
    <header class="topbar">
      <div class="brand">
        Furlong
      </div>

      <div class="actions">
        <button
          class="btn"
          :disabled="!raceStore.canGenerate"
          @click="onGenerate"
        >
          Generate Program
        </button>
        <button
          class="btn"
          :disabled="!raceStore.canSkip"
          @click="onSkip"
        >
          Skip Round
        </button>
        <button
          class="btn btn-primary"
          :disabled="!(raceStore.canStart || raceStore.canPause)"
          @click="onStartPause"
        >
          {{ raceStore.status === 'running' ? 'Pause' : 'Start' }} / Resume
        </button>
      </div>
    </header>

    <main class="grid">
      <HorseTable />
      <RaceTrack ref="trackRef" />
      <aside class="side">
        <ProgramPanel />
        <ResultsPanel />
      </aside>
    </main>
  </div>
</template>
