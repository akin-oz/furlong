<script setup lang="ts">
import type { Horse } from '@entities/horse'

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
      {{ String(laneNumber).padStart(2, '0') }}
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
