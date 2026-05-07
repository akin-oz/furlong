import { tokens, typography, spacing, layout, motion } from '@shared/config'

const cssVars: Record<string, string> = {
  '--paper': tokens.surface.base,
  '--paper-2': tokens.surface.hover,
  '--ink': tokens.text.primary,
  '--ink-2': tokens.text.secondary,
  '--muted': tokens.text.tertiary,
  '--muted-2': tokens.text.quiet,
  '--rule': tokens.border.default,
  '--subtle': tokens.border.subtle,
  '--row-alt': tokens.surface.rowAlt,
  '--accent': tokens.text.accent,

  '--display': typography.family.display,
  '--ui': typography.family.body,
  '--mono': typography.family.mono,

  '--row-pad': layout.rowPadding,
  '--lane-h': layout.laneHeight,
  '--app-max-width': layout.appMaxWidth,

  '--space-1': spacing[1],
  '--space-2': spacing[2],
  '--space-3': spacing[3],
  '--space-4': spacing[4],
  '--space-5': spacing[5],
  '--space-6': spacing[6],
  '--space-7': spacing[7],
  '--space-8': spacing[8],

  '--motion-fast': motion.duration.fast,
  '--motion-base': motion.duration.base,
  '--motion-medium': motion.duration.medium,
  '--motion-easing': motion.easing.standard,
}

export function applyDesignTokens(target: HTMLElement = document.documentElement): void {
  for (const [name, value] of Object.entries(cssVars)) {
    target.style.setProperty(name, value)
  }
  tokens.lane.forEach((hex, i) => {
    target.style.setProperty(`--lane-${i + 1}`, hex)
  })
}
