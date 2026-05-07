<script setup lang="ts">
import { computed } from 'vue'
import type { Horse } from '@entities/horse'

interface Props {
  horse: Horse
  laneNumber: number
  progress: number
}

const props = defineProps<Props>()

const transformStyle = computed(() => ({
  transform: `translateX(${props.progress * 100}%)`,
}))
</script>

<template>
  <div class="lane">
    <div class="lane-num mono">{{ String(laneNumber).padStart(2, '0') }}</div>
    <div class="lane-strip">
      <div class="lane-rule" />
      <div
        class="horse-mark"
        :style="{ background: horse.color, ...transformStyle }"
      />
    </div>
    <div class="lane-meta mono">
      <span class="swatch sm" :style="{ background: horse.color }" />
      <span class="ellip">{{ horse.name.split(' ')[0] }}</span>
    </div>
  </div>
</template>

<style scoped>
.horse-mark {
  transition: transform 50ms linear;
}
</style>
