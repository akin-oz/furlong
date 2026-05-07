<script setup lang="ts">
import { useHorseStore } from '@entities/horse'

const horseStore = useHorseStore()
</script>

<template>
  <section class="col">
    <div class="col-head">
      <div class="col-title">
        Stable
      </div>
      <div class="col-eyebrow">
        01 — {{ horseStore.horses.length }} horses
      </div>
    </div>

    <div class="roster-table">
      <div class="roster-head">
        <span>Name</span>
        <span class="num">Age</span>
        <span class="num">Cond.</span>
        <span class="num">Stam.</span>
        <span class="num">Accl.</span>
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
