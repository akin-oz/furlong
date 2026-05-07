<script setup lang="ts">
import { watch } from 'vue'
import { useRaceStore } from '@entities/race'
import { useRaceEngine } from '@features/race-track'
import HorseLane from './HorseLane.vue'

const raceStore = useRaceStore()

const engine = useRaceEngine({
  onRoundComplete: (result) => {
    raceStore.finishRound(result)
  },
})

// React to status transitions
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
    // Wait, then advance to next round
    setTimeout(() => raceStore.advanceToNextRound(), 1500)
  }
})

defineExpose({ skipRound: engine.skipRound })
</script>

<template>
  <div class="track-panel panel">
    <div class="panel-head">
      <div>
        <div class="ph-eyebrow">
          Track
        </div>
        <div class="ph-title">
          <template v-if="raceStore.currentRound">
            Round {{ String(raceStore.currentRound.id).padStart(2, '0') }} —
            {{ raceStore.currentRound.distance }} m
          </template>
          <template v-else>
            Awaiting program
          </template>
        </div>
      </div>
    </div>

    <div class="track-body">
      <div
        v-if="raceStore.currentRound"
        class="lanes"
      >
        <HorseLane
          v-for="(horse, i) in raceStore.currentRound.horses"
          :key="horse.id"
          :horse="horse"
          :lane-number="i + 1"
          :progress="engine.horseProgress.value[horse.id] ?? 0"
        />
        <div class="finish-flag mono">
          FINISH
        </div>
      </div>
      <div
        v-else
        class="track-placeholder"
      >
        Generate a program to begin.
      </div>
    </div>
  </div>
</template>
