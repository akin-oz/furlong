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
  // Per assumption (pending Berfu): horses persist, only schedule regenerates.
  // If response says "regenerate horses too": call horseStore.regenerate() first.
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
        <div class="brand-mark" :style="{ background: 'var(--accent)' }" />
        <div>
          <div class="brand-title">Furlong</div>
          <div class="brand-sub">Racing Simulation</div>
        </div>
      </div>

      <div class="meta">
        <div class="meta-cell">
          <span class="meta-label">Round</span>
          <span class="meta-value mono">
            {{ String((raceStore.currentRoundIndex ?? 0) + 1).padStart(2, '0') }}
            / 06
          </span>
        </div>
        <div class="meta-cell">
          <span class="meta-label">Status</span>
          <span class="meta-value">{{ raceStore.status }}</span>
        </div>
      </div>

      <div class="actions">
        <button
          class="btn"
          :disabled="!raceStore.canGenerate"
          @click="onGenerate"
        >
          Generate program
        </button>
        <button
          class="btn"
          :disabled="!raceStore.canSkip"
          @click="onSkip"
        >
          Skip round
        </button>
        <button
          class="btn btn-primary"
          :disabled="!(raceStore.canStart || raceStore.canPause)"
          @click="onStartPause"
        >
          {{ raceStore.status === 'running' ? 'Pause' : 'Start' }} race
        </button>
      </div>
    </header>

    <main class="grid">
      <HorseTable />
      <RaceTrack ref="trackRef" />
      <div class="right-stack">
        <ProgramPanel />
        <ResultsPanel />
      </div>
    </main>
  </div>
</template>
