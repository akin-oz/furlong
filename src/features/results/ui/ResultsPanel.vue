<script setup lang="ts">
import { useRaceStore } from '@entities/race'
import { RACING_CONFIG } from '@shared/config'
import {
  formatRaceTime,
  padRoundId,
  ticksToSeconds,
} from '@shared/lib/format'

const raceStore = useRaceStore()

const POS_LABELS = RACING_CONFIG.display.podiumLabels
const PODIUM_SIZE = RACING_CONFIG.display.podiumSize

function formatFinishTime(tick: number): string {
  return formatRaceTime(ticksToSeconds(tick))
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
              Round {{ padRoundId(result.roundId) }} — {{ result.distance }} m
            </div>
            <div class="res-meta">
              {{ formatFinishTime(result.positions[0]?.finishedAtTick ?? 0) }}
            </div>
          </div>
          <div class="podium">
            <div
              v-for="(position, i) in result.positions.slice(0, PODIUM_SIZE)"
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
