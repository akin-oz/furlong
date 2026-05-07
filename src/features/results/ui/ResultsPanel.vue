<script setup lang="ts">
import { useRaceStore } from '@entities/race'

const raceStore = useRaceStore()
</script>

<template>
  <div class="results-panel panel">
    <div class="panel-head">
      <div>
        <div class="ph-eyebrow">
          Results
        </div>
        <div class="ph-title">
          Settled rounds
        </div>
      </div>
    </div>

    <div class="results-list">
      <template v-if="raceStore.results.length === 0">
        <div class="results-empty">
          No rounds completed yet.
        </div>
      </template>

      <TransitionGroup
        v-else
        name="result"
        tag="div"
        class="results-stack"
      >
        <div
          v-for="result in raceStore.results"
          :key="result.roundId"
          class="result-card"
        >
          <div class="result-head">
            <div class="result-round mono">
              R{{ String(result.roundId).padStart(2, '0') }}
            </div>
            <div class="result-distance mono">
              {{ result.distance }} m
            </div>
          </div>

          <div class="podium">
            <div
              v-for="position in result.positions.slice(0, 3)"
              :key="position.horseId"
              class="podium-row"
            >
              <span class="pos-num mono">{{ position.position }}</span>
              <span
                class="swatch sm"
                :style="{ background: position.horseColor }"
              />
              <span class="pos-name ellip">{{ position.horseName }}</span>
            </div>
          </div>
        </div>
      </TransitionGroup>
    </div>
  </div>
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
