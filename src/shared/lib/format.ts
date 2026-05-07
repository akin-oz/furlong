/**
 * Formatting helpers — all widths and bases come from RACING_CONFIG.formatting.
 */

import { RACING_CONFIG } from '@shared/config'

const F = RACING_CONFIG.formatting

export function formatRaceTime(seconds: number): string {
  const minutes = Math.floor(seconds / F.secondsPerMinute)
  const remainder = (seconds % F.secondsPerMinute)
    .toFixed(F.timeFractionDigits)
    .padStart(F.timeSecondsPad, '0')
  return `${minutes}:${remainder}`
}

export function ticksToSeconds(ticks: number): number {
  return (ticks * RACING_CONFIG.engine.tickIntervalMs) / F.msPerSecond
}

export function padRoundId(id: number): string {
  return String(id).padStart(F.roundIdPad, '0')
}

export function padLaneNumber(lane: number): string {
  return String(lane).padStart(F.lanePad, '0')
}

export function categorizeDistance(distance: number): string {
  for (const category of RACING_CONFIG.display.distanceCategories) {
    if (distance < category.maxExclusive) return category.label
  }
  // distanceCategories is non-empty by construction; final entry uses Infinity.
  return RACING_CONFIG.display.distanceCategories[
    RACING_CONFIG.display.distanceCategories.length - 1
  ]!.label
}
