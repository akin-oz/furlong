<script setup lang="ts">
import type { Horse } from '@entities/horse'
import { padLaneNumber } from '@shared/lib/format'

interface Props {
  horse: Horse
  laneNumber: number
  progress: number
}

defineProps<Props>()
</script>

<template>
  <div class="lane">
    <div class="lane-num">
      {{ padLaneNumber(laneNumber) }}
    </div>
    <div class="lane-strip">
      <div class="lane-rule" />
      <div
        class="horse"
        :style="{ left: `${progress * 100}%` }"
      >
        <div
          class="horse-mark"
          :style="{ background: horse.color }"
        />
      </div>
    </div>
  </div>
</template>
