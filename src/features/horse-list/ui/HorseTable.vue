<script setup lang="ts">
import { useHorseStore } from '@entities/horse'
import { COPY } from '@shared/config'

const horseStore = useHorseStore()
</script>

<template>
  <section class="col">
    <div class="col-head">
      <div class="col-title">
        {{ COPY.panels.stable }}
      </div>
      <div class="col-eyebrow">
        {{ COPY.eyebrows.stableCount(horseStore.horses.length) }}
      </div>
    </div>

    <div class="roster-table">
      <div class="roster-head">
        <span>{{ COPY.roster.name }}</span>
        <span class="num">{{ COPY.roster.age }}</span>
        <span class="num">{{ COPY.roster.condition }}</span>
        <span class="num">{{ COPY.roster.stamina }}</span>
        <span class="num">{{ COPY.roster.acceleration }}</span>
        <span />
      </div>
      <div class="roster-body">
        <div
          v-for="horse in horseStore.horses"
          :key="horse.id"
          class="roster-row"
        >
          <span class="name ellip">{{ horse.name }}</span>
          <span class="num">{{ horse.age }}</span>
          <span class="num">{{ horse.condition }}</span>
          <span class="num">{{ horse.stamina }}</span>
          <span class="num">{{ horse.acceleration }}</span>
          <span
            class="swatch"
            :style="{ background: horse.color }"
          />
        </div>
      </div>
    </div>
  </section>
</template>
