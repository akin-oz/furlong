<script setup lang="ts">
import { computed } from 'vue'
import { useHorseStore } from '@entities/horse'
import { useRaceStore } from '@entities/race'
import { RACING_CONFIG } from '@shared/config'
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
  if (n === 0) return '05 — championship'
  if (isChampionship.value) return '05 — final'
  return `05 — after round ${n} of ${totalRounds}`
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
          Championship
        </div>
        <div class="col-caption">
          Points across all rounds. Long races (≥ 1800 m) count double.
        </div>
      </div>
      <div class="col-eyebrow">
        {{ eyebrow }}
      </div>
    </div>

    <template v-if="raceStore.results.length === 0">
      <div class="res-empty">
        Standings appear after the first round.
        Each finish earns points (1st = 10, last = 1); long races double the score.
      </div>
    </template>

    <template v-else>
      <div class="standings-head">
        <span>Rank</span>
        <span />
        <span>Horse</span>
        <span class="standings-head-finishes">Top {{ podiumSize }} finishes</span>
        <span class="num">Pts</span>
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
                <span class="standing-finishes-empty">—</span>
              </template>
              <template v-else>
                <span
                  v-if="entry.firsts > 0"
                  class="finish-chip gold"
                  :title="`Won ${entry.firsts} race${entry.firsts === 1 ? '' : 's'}`"
                >
                  {{ entry.firsts }}× {{ podiumLabels[0] }}
                </span>
                <span
                  v-if="entry.seconds > 0"
                  class="finish-chip silver"
                  :title="`Finished ${podiumLabels[1]} in ${entry.seconds} race${entry.seconds === 1 ? '' : 's'}`"
                >
                  {{ entry.seconds }}× {{ podiumLabels[1] }}
                </span>
                <span
                  v-if="entry.thirds > 0"
                  class="finish-chip bronze"
                  :title="`Finished ${podiumLabels[2]} in ${entry.thirds} race${entry.thirds === 1 ? '' : 's'}`"
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
