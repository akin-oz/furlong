<script setup lang="ts">
import { useRaceStore } from '@entities/race'
import { RACING_CONFIG } from '@shared/config'

const raceStore = useRaceStore()

const POS_LABELS = ['1st', '2nd', '3rd'] as const

function formatFinishTime(tick: number): string {
  const seconds = (tick * RACING_CONFIG.engine.tickIntervalMs) / 1000
  const m = Math.floor(seconds / 60)
  const s = (seconds % 60).toFixed(2).padStart(5, '0')
  return `${m}:${s}`
}
</script>

<template>
  <section class="col">
    <div class="col-head">
      <div class="col-title">
        Results
      </div>
      <div class="col-eyebrow">
        04 — {{ raceStore.results.length }} settled
      </div>
    </div>

    <div class="res-list">
      <template v-if="raceStore.results.length === 0">
        <div class="res-empty">
          No rounds completed yet.
        </div>
      </template>

      <TransitionGroup
        v-else
        name="result"
        tag="div"
      >
        <div
          v-for="result in raceStore.results"
          :key="result.roundId"
          class="res-card"
        >
          <div class="res-head">
            <div class="res-title">
              Round {{ String(result.roundId).padStart(2, '0') }} — {{ result.distance }} m
            </div>
            <div class="res-meta">
              {{ formatFinishTime(result.positions[0]?.finishedAtTick ?? 0) }}
            </div>
          </div>
          <div class="podium">
            <div
              v-for="(position, i) in result.positions.slice(0, 3)"
              :key="position.horseId"
              class="podium-row"
              :class="`p${i + 1}`"
            >
              <div class="podium-pos">
                {{ POS_LABELS[i] }}
              </div>
              <div class="podium-name">
                <span
                  class="swatch"
                  :style="{ background: position.horseColor, justifySelf: 'auto' }"
                />
                <span class="ellip">{{ position.horseName }}</span>
              </div>
            </div>
          </div>
        </div>
      </TransitionGroup>
    </div>
  </section>
</template>

<style scoped>
.result-enter-active,
.result-leave-active {
  transition: all 250ms cubic-bezier(0.4, 0, 0.2, 1);
}
.result-enter-from {
  opacity: 0;
  transform: translateY(-8px);
}
.result-leave-to {
  opacity: 0;
}
.result-move {
  transition: transform 250ms cubic-bezier(0.4, 0, 0.2, 1);
}
</style>
