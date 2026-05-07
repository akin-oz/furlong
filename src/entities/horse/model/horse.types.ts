/**
 * Horse domain types.
 *
 * `Horse` is a plain data shape — no behavior. Engine logic that operates
 * on horses lives in features/race-track/model/useRaceEngine.
 */

export interface Horse {
  /** Stable identifier 1..20 */
  readonly id: number

  /** Display name */
  readonly name: string

  /** Unique color hex (case rule 2) */
  readonly color: string

  /** Horse age in years, 3..7 */
  readonly age: number

  /** General form, 1..100 (case rule 3, plus age modifier) */
  readonly condition: number

  /** Aerobic capacity, 1..100 — dominant in long distances */
  readonly stamina: number

  /** Anaerobic energy, 1..100 — dominant early, depletes over time */
  readonly acceleration: number
}

/** Live state of a horse during a single round */
export interface HorseRaceState {
  readonly horseId: number

  /** 0..1, how far along the track this horse is */
  progress: number

  /** Current per-tick speed before applying noise */
  speed: number

  /** Remaining anaerobic energy, 1..0 */
  anaerobicEnergy: number

  /** Whether the final-stretch burst has fired */
  hasBursted: boolean

  /** Tick at which the horse crossed the finish line, null while still racing */
  finishedAtTick: number | null
}
