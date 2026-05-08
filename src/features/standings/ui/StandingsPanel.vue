<script setup lang="ts">
import { computed } from 'vue'
import { useHorseStore } from '@entities/horse'
import { useRaceStore } from '@entities/race'
import { COPY, RACING_CONFIG } from '@shared/config'
import { calculateStandings } from '@features/standings'

const horseStore = useHorseStore()
const raceStore = useRaceStore()

const standings = computed(() =>
  calculateStandings(horseStore.horses, raceStore.results),
)

const totalRounds = RACING_CONFIG.rounds.length
const podiumSize = RACING_CONFIG.display.podiumSize
const podiumLabels = RACING_CONFIG.display.podiumLabels

const isChampionship = computed(
  () => raceStore.results.length === totalRounds,
)

const eyebrow = computed(() => {
  const n = raceStore.results.length
  if (n === 0) return COPY.eyebrows.standingsBeforeRun
  if (isChampionship.value) return COPY.eyebrows.standingsFinal
  return COPY.eyebrows.standingsAfter(n, totalRounds)
})

function formatPoints(points: number): string {
  return Number.isInteger(points) ? String(points) : points.toFixed(1)
}
</script>

<template>
  <section class="col">
    <div class="col-head">
      <div>
        <div class="col-title">
          {{ COPY.panels.standings }}
        </div>
        <div class="col-caption">
          {{ COPY.panels.standingsCaption }}
        </div>
      </div>
      <div class="col-eyebrow">
        {{ eyebrow }}
      </div>
    </div>

    <template v-if="raceStore.results.length === 0">
      <div class="res-empty">
        {{ COPY.empty.standings }}
      </div>
    </template>

    <template v-else>
      <div class="standings-head">
        <span>{{ COPY.standings.rank }}</span>
        <span />
        <span>{{ COPY.standings.horse }}</span>
        <span class="standings-head-finishes">{{ COPY.standings.topFinishes(podiumSize) }}</span>
        <span class="num">{{ COPY.standings.points }}</span>
      </div>

      <div class="standings-list">
        <TransitionGroup
          name="result"
          tag="div"
        >
          <div
            v-for="entry in standings"
            :key="entry.horse.id"
            class="standing-row"
            :class="{
              podium: isChampionship && entry.rank <= podiumSize,
              zero: entry.totalPoints === 0,
            }"
          >
            <span class="standing-rank mono">
              {{ entry.isTied ? 'T' : '' }}{{ entry.rank }}
            </span>
            <span
              class="swatch"
              :style="{ background: entry.horse.color, justifySelf: 'auto' }"
            />
            <span class="standing-name ellip">{{ entry.horse.name }}</span>
            <span class="standing-finishes">
              <template v-if="entry.firsts + entry.seconds + entry.thirds === 0">
                <span class="standing-finishes-empty">{{ COPY.empty.finishesDash }}</span>
              </template>
              <template v-else>
                <span
                  v-if="entry.firsts > 0"
                  class="finish-chip gold"
                  :title="COPY.standings.winsTooltip(entry.firsts)"
                >
                  {{ entry.firsts }}× {{ podiumLabels[0] }}
                </span>
                <span
                  v-if="entry.seconds > 0"
                  class="finish-chip silver"
                  :title="COPY.standings.finishesTooltip(entry.seconds, podiumLabels[1])"
                >
                  {{ entry.seconds }}× {{ podiumLabels[1] }}
                </span>
                <span
                  v-if="entry.thirds > 0"
                  class="finish-chip bronze"
                  :title="COPY.standings.finishesTooltip(entry.thirds, podiumLabels[2])"
                >
                  {{ entry.thirds }}× {{ podiumLabels[2] }}
                </span>
              </template>
            </span>
            <span class="standing-points mono">
              {{ formatPoints(entry.totalPoints) }}
            </span>
          </div>
        </TransitionGroup>
      </div>
    </template>
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
