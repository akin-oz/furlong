<script setup lang="ts">
import { useRaceStore } from '@entities/race'

const raceStore = useRaceStore()
</script>

<template>
  <div class="program-panel panel">
    <div class="panel-head">
      <div>
        <div class="ph-eyebrow">
          Programme
        </div>
        <div class="ph-title">
          Today's card
        </div>
      </div>
    </div>

    <div class="program-list">
      <template v-if="raceStore.schedule.length === 0">
        <div class="program-empty">
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
            live: i === raceStore.currentRoundIndex && raceStore.status === 'running',
            upcoming: i > raceStore.currentRoundIndex,
          }"
        >
          <div class="prog-idx mono">
            R{{ String(round.id).padStart(2, '0') }}
          </div>
          <div class="prog-meta">
            <div class="prog-title">
              Round {{ round.id }}
            </div>
            <div class="prog-sub">
              {{ round.distance }} m
            </div>
          </div>
          <span
            v-if="i < raceStore.currentRoundIndex"
            class="tag done"
          >
            Settled
          </span>
          <span
            v-else-if="i === raceStore.currentRoundIndex && raceStore.status === 'running'"
            class="tag live"
          >
            Live
          </span>
          <span
            v-else
            class="tag up"
          >Upcoming</span>
        </div>
      </template>
    </div>
  </div>
</template>
