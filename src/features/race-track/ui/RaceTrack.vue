<script setup lang="ts">
import { computed, watch } from 'vue'
import { useRaceStore } from '@entities/race'
import { useRaceEngine } from '@features/race-track'
import { RACING_CONFIG } from '@shared/config'
import HorseLane from './HorseLane.vue'

const raceStore = useRaceStore()

const engine = useRaceEngine({
  onRoundComplete: (result) => {
    raceStore.finishRound(result)
  },
})

watch(() => raceStore.status, (status) => {
  if (status === 'running' && raceStore.currentRound) {
    if (engine.isRunning.value) {
      engine.resume()
    } else {
      engine.startRound(raceStore.currentRound)
    }
  } else if (status === 'paused') {
    engine.pause()
  } else if (status === 'between') {
    globalThis.setTimeout(() => raceStore.advanceToNextRound(), RACING_CONFIG.flow.interRoundDelayMs)
  }
})

defineExpose({ skipRound: engine.skipRound })

const elapsedSeconds = computed(
  () => engine.tickCount.value * RACING_CONFIG.engine.tickIntervalMs / 1000,
)

function formatTime(t: number): string {
  const m = Math.floor(t / 60)
  const s = (t % 60).toFixed(2).padStart(5, '0')
  return `${m}:${s}`
}

const totalRounds = RACING_CONFIG.rounds.length
</script>

<template>
  <section class="col track-col">
    <div class="col-head">
      <div class="col-title">
        <template v-if="raceStore.currentRound">
          Round {{ String(raceStore.currentRound.id).padStart(2, '0') }} —
          {{ raceStore.currentRound.distance }} m
        </template>
        <template v-else>
          Awaiting program
        </template>
      </div>
      <div class="col-eyebrow">
        02 — {{ raceStore.status === 'running' ? 'Live' : raceStore.status }}
      </div>
    </div>

    <div
      v-if="raceStore.currentRound"
      class="track"
    >
      <div class="lanes">
        <HorseLane
          v-for="(horse, i) in raceStore.currentRound.horses"
          :key="horse.id"
          :horse="horse"
          :lane-number="i + 1"
          :progress="engine.horseProgress.value[horse.id] ?? 0"
        />
      </div>
      <div class="finish" />
      <div class="finish-label">
        FINISH
      </div>
    </div>
    <div
      v-else
      class="track-placeholder"
    >
      Generate a program to begin.
    </div>

    <div class="statusbar">
      <div class="status-cell">
        <div class="status-label">
          Round
        </div>
        <div class="status-value">
          {{ raceStore.currentRound
            ? String(raceStore.currentRound.id).padStart(2, '0')
            : '—' }}
          <span class="of">/ {{ String(totalRounds).padStart(2, '0') }}</span>
        </div>
      </div>
      <div class="status-cell">
        <div class="status-label">
          Distance
        </div>
        <div class="status-value">
          {{ raceStore.currentRound ? `${raceStore.currentRound.distance} m` : '—' }}
        </div>
      </div>
      <div class="status-cell right">
        <div class="status-label">
          Elapsed
        </div>
        <div class="status-value mono accent">
          {{ formatTime(elapsedSeconds) }}
        </div>
      </div>
    </div>
  </section>
</template>
