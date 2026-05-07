/**
 * Race domain types.
 *
 * - `RaceStatus`: state machine (see ADR 0007)
 * - `RaceRound`: a single round in the schedule
 * - `RoundResult`: completed round with finishing order
 */

import type { Horse } from '@entities/horse'

/**
 * State machine for the race.
 *
 *   idle → ready → running ⇄ paused
 *                    ↓
 *                  between → running (next round)
 *                    ↓
 *                  finished
 */
export type RaceStatus =
  | 'idle'      // page just loaded, no schedule yet
  | 'ready'     // schedule exists, awaiting Start
  | 'running'   // a round is currently racing
  | 'paused'    // round halted by user (or skip-anywhere)
  | 'between'   // round finished, inter-round delay active
  | 'finished'  // all 6 rounds complete

export interface RaceRound {
  /** 1..6, matches RACING_CONFIG.rounds[i].id */
  readonly id: number

  /** Distance in meters, per case rule 6 */
  readonly distance: number

  /** Horses competing in this round (10 per round, case rule 5) */
  readonly horses: readonly Horse[]
}

export interface FinishingPosition {
  readonly position: number   // 1..10
  readonly horseId: number
  readonly horseName: string
  readonly horseColor: string

  /** Tick at which the horse crossed the finish line */
  readonly finishedAtTick: number
}

export interface RoundResult {
  readonly roundId: number
  readonly distance: number
  readonly positions: readonly FinishingPosition[]
}
