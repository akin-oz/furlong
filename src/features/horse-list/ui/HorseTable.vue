<script setup lang="ts">
import { useHorseStore } from '@entities/horse'

const horseStore = useHorseStore()
</script>

<template>
  <div class="horse-table panel">
    <div class="panel-head">
      <div>
        <div class="ph-eyebrow">
          Stable
        </div>
        <div class="ph-title">
          All horses
        </div>
        <div class="ph-sub">
          {{ horseStore.horses.length }} entries
        </div>
      </div>
    </div>

    <div class="roster-table">
      <div class="roster-head">
        <div />
        <div>Name</div>
        <div class="num">
          Age
        </div>
        <div class="num">
          Cond.
        </div>
        <div class="num">
          Stam.
        </div>
        <div class="num">
          Accl.
        </div>
      </div>

      <div class="roster-body">
        <div
          v-for="(horse, i) in horseStore.horses"
          :key="horse.id"
          class="roster-row"
        >
          <div class="roster-num">
            {{ String(i + 1).padStart(2, '0') }}
          </div>
          <div class="roster-name">
            <span
              class="swatch"
              :style="{ background: horse.color }"
            />
            <span class="ellip">{{ horse.name }}</span>
          </div>
          <div class="num mono">
            {{ horse.age }}
          </div>
          <div class="num mono">
            {{ horse.condition }}
          </div>
          <div class="num mono">
            {{ horse.stamina }}
          </div>
          <div class="num mono">
            {{ horse.acceleration }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
