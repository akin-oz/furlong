<script setup lang="ts">
import { useRaceStore } from '@entities/race'
import { COPY } from '@shared/config'
import { categorizeDistance, padRoundId } from '@shared/lib/format'

const raceStore = useRaceStore()

function isLiveRow(index: number): boolean {
  return (
    index === raceStore.currentRoundIndex &&
    raceStore.status !== 'idle' &&
    raceStore.status !== 'finished'
  )
}
</script>

<template>
  <section class="col">
    <div class="col-head">
      <div class="col-title">
        {{ COPY.panels.programme }}
      </div>
      <div class="col-eyebrow">
        {{ COPY.eyebrows.programme }}
      </div>
    </div>

    <div class="prog-list">
      <template v-if="raceStore.schedule.length === 0">
        <div class="res-empty">
          {{ COPY.empty.program }}
        </div>
      </template>

      <template v-else>
        <div
          v-for="(round, i) in raceStore.schedule"
          :key="round.id"
          class="prog-row"
          :class="{
            done: i < raceStore.currentRoundIndex,
            live: isLiveRow(i),
          }"
        >
          <div class="prog-idx">
            {{ COPY.programme.rowPrefix(padRoundId(round.id)) }}
          </div>
          <div class="prog-name">
            {{ categorizeDistance(round.distance) }}<template v-if="isLiveRow(i)">
              {{ COPY.programme.activeSuffix }}
            </template><template v-else-if="i < raceStore.currentRoundIndex">
              {{ COPY.programme.settledSuffix }}
            </template>
          </div>
          <div class="prog-dist">
            {{ round.distance }} m
          </div>
        </div>
      </template>
    </div>
  </section>
</template>
