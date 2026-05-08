<script setup lang="ts">
import { computed, watch } from 'vue'
import { useRaceStore } from '@entities/race'
import { useRaceEngine } from '@features/race-track'
import { COPY, RACING_CONFIG } from '@shared/config'
import { formatRaceTime, padRoundId, ticksToSeconds } from '@shared/lib/format'
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

const elapsedSeconds = computed(() => ticksToSeconds(engine.tickCount.value))

const totalRounds = RACING_CONFIG.rounds.length
</script>

<template>
  <section class="col track-col">
    <div class="col-head">
      <div class="col-title">
        <template v-if="raceStore.currentRound">
          {{ COPY.track.roundTitle(padRoundId(raceStore.currentRound.id), raceStore.currentRound.distance) }}
        </template>
        <template v-else>
          {{ COPY.empty.trackAwaiting }}
        </template>
      </div>
      <div class="col-eyebrow">
        {{ raceStore.status === 'running'
          ? COPY.eyebrows.trackLive
          : COPY.eyebrows.trackStatus(raceStore.status) }}
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
        {{ COPY.track.finishLabel }}
      </div>
    </div>
    <div
      v-else
      class="track-placeholder"
    >
      {{ COPY.empty.track }}
    </div>

    <div class="statusbar">
      <div class="status-cell">
        <div class="status-label">
          {{ COPY.track.statusRound }}
        </div>
        <div class="status-value">
          {{ raceStore.currentRound ? padRoundId(raceStore.currentRound.id) : COPY.empty.finishesDash }}
          <span class="of">/ {{ padRoundId(totalRounds) }}</span>
        </div>
      </div>
      <div class="status-cell">
        <div class="status-label">
          {{ COPY.track.statusDistance }}
        </div>
        <div class="status-value">
          {{ raceStore.currentRound ? `${raceStore.currentRound.distance} m` : COPY.empty.finishesDash }}
        </div>
      </div>
      <div class="status-cell right">
        <div class="status-label">
          {{ COPY.track.statusElapsed }}
        </div>
        <div class="status-value mono accent">
          {{ formatRaceTime(elapsedSeconds) }}
        </div>
      </div>
    </div>
  </section>
</template>
