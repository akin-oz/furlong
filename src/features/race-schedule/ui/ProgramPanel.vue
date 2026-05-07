<script setup lang="ts">
import { useRaceStore } from '@entities/race'
import { categorizeDistance, padRoundId } from '@shared/lib/format'

const raceStore = useRaceStore()
</script>

<template>
  <section class="col">
    <div class="col-head">
      <div class="col-title">
        Programme
      </div>
      <div class="col-eyebrow">
        03
      </div>
    </div>

    <div class="prog-list">
      <template v-if="raceStore.schedule.length === 0">
        <div class="res-empty">
          No programme generated.
        </div>
      </template>

      <template v-else>
        <div
          v-for="(round, i) in raceStore.schedule"
          :key="round.id"
          class="prog-row"
          :class="{
            done: i < raceStore.currentRoundIndex,
            live: i === raceStore.currentRoundIndex && raceStore.status !== 'idle' && raceStore.status !== 'finished',
          }"
        >
          <div class="prog-idx">
            R{{ padRoundId(round.id) }}
          </div>
          <div class="prog-name">
            {{ categorizeDistance(round.distance) }}<template v-if="i === raceStore.currentRoundIndex && raceStore.status !== 'idle' && raceStore.status !== 'finished'">
              · Active
            </template><template v-else-if="i < raceStore.currentRoundIndex">
              · Settled
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
