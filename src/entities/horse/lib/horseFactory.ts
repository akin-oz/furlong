import { RACING_CONFIG, tokens } from '@shared/config'
import type { Horse } from '@entities/horse'

/**
 * Sample human-history names (computer scientists / mathematicians).
 * Uses a wider pool than 20 so re-generations get fresh names.
 */
const NAME_POOL = [
  'Ada Lovelace', 'Grace Hopper', 'Margaret Hamilton', 'Joan Clarke',
  'Hedy Lamarr', 'Katherine Johnson', 'Dorothy Vaughan', 'Mary Jackson',
  'Radia Perlman', 'Frances Allen', 'Barbara Liskov', 'Karen Spärck Jones',
  'Annie Easley', 'Evelyn Boyd', 'Adele Goldberg', 'Jean Bartik',
  'Carol Shaw', 'Sister Keller', 'Erna Hoover', 'Frances Spence',
  'Ruth Lichterman', 'Klara Dan', 'Betty Holberton', 'Marlyn Meltzer',
] as const

const randomInt = (min: number, max: number): number =>
  Math.floor(Math.random() * (max - min + 1)) + min

const sample = <T>(arr: readonly T[], count: number): T[] => {
  const copy = [...arr]
  const result: T[] = []
  for (let i = 0; i < count && copy.length > 0; i++) {
    const idx = Math.floor(Math.random() * copy.length)
    result.push(copy.splice(idx, 1)[0]!)
  }
  return result
}

/**
 * Apply age-based condition modifier.
 *
 * Real horses peak at 4–5 years. Younger horses are still developing,
 * older horses are slowing down. See ADR 0003.
 */
function applyAgeModifier(baseCondition: number, age: number): number {
  const { peakRange, modifiers } = RACING_CONFIG.age
  let factor: number

  if (age >= peakRange.min && age <= peakRange.max) {
    factor = modifiers.peak
  } else if (age < peakRange.min) {
    factor = modifiers.young
  } else {
    factor = modifiers.mature
  }

  const { min, max } = RACING_CONFIG.horses.condition
  return Math.max(min, Math.min(max, Math.round(baseCondition * factor)))
}

/**
 * Generate a fresh roster of horses (case rules 1, 2, 3).
 *
 * - Exactly 20 horses (rule 1)
 * - Each horse has a unique color (rule 2)
 * - Each horse's condition is 1..100 (rule 3)
 *
 * Names are sampled without replacement from a pool larger than 20,
 * so successive generations don't always show the same names.
 */
export function generateHorses(): readonly Horse[] {
  const config = RACING_CONFIG.horses
  const ageRange = RACING_CONFIG.horses.age
  const names = sample(NAME_POOL, config.totalCount)

  const horses: Horse[] = []
  for (let i = 0; i < config.totalCount; i++) {
    const age = randomInt(ageRange.min, ageRange.max)
    const baseCondition = randomInt(config.condition.min, config.condition.max)

    horses.push({
      id: i + 1,
      name: names[i] ?? `Horse ${i + 1}`,
      color: tokens.lane[i] ?? '#000000',
      age,
      condition: applyAgeModifier(baseCondition, age),
      stamina: randomInt(config.stamina.min, config.stamina.max),
      acceleration: randomInt(config.acceleration.min, config.acceleration.max),
    })
  }

  return horses
}
