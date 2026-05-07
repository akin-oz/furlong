/**
 * Design tokens — extracted from claude.ai/design output (editorial direction)
 *
 * Two-layer structure mirroring Insider Design System (IDS) pattern:
 *   - palette: primitive scale (raw hex values)
 *   - tokens:  semantic intent (alias layer using palette)
 *
 * Migration to actual IDS would be a single mapping swap at the alias layer.
 * Color values originate from claude.ai/design; structure follows IDS.
 */

// ─────────────────────────────────────────────────────────────────
// PALETTE — primitive scale (raw values from design)
// ─────────────────────────────────────────────────────────────────

const palette = {
  // Warm paper neutrals — the editorial foundation
  paper: {
    base:    '#F4F1EB',  // page background
    base2:   '#EDE8DD',  // hover state for rows
    rowAlt:  '#EFEAE0',  // alternating row background
    subtle:  '#E8E2D4',  // hairline rules between rows
    rule:    '#D8D2C4',  // borders, dividers
    muted:   '#807A6E',  // secondary text, labels
    muted2:  '#A7A095',  // tertiary text
    ink:     '#1A1815',  // primary text, dark surfaces
    ink2:    '#3A3530',  // secondary ink (numerics)
  },

  // Brand accent — vermillion
  brand: {
    accent: '#B5462A',   // active states, live indicator, finish line
  },

  // Lane colors — 20 unique hues, muted editorial palette
  lane: [
    '#B5462A', '#2F5D8C', '#C49B3F', '#3F7F5D', '#7B4A8E',
    '#A33A4A', '#1F6F8B', '#B86B26', '#4A6B3A', '#5B3A8E',
    '#8E2A4F', '#0F4C5C', '#A37734', '#2B7A4B', '#6E3F8E',
    '#A04545', '#356E9A', '#C66E3F', '#3D6B45', '#5C4E8E',
  ],
} as const

// ─────────────────────────────────────────────────────────────────
// TOKENS — semantic intent (IDS-style alias layer)
// ─────────────────────────────────────────────────────────────────

export const tokens = {
  text: {
    primary:   palette.paper.ink,
    secondary: palette.paper.ink2,
    tertiary:  palette.paper.muted,
    quiet:     palette.paper.muted2,
    inverse:   palette.paper.base,
    accent:    palette.brand.accent,
  },

  surface: {
    base:     palette.paper.base,    // page background
    raised:   palette.paper.base,    // columns (flat — no panel borders)
    hover:    palette.paper.base2,   // row hover
    sunken:   palette.paper.subtle,  // table headers
    rowAlt:   palette.paper.rowAlt,
    inverse:  palette.paper.ink,     // primary buttons, dark surfaces
  },

  border: {
    default: palette.paper.rule,
    subtle:  palette.paper.subtle,
    focus:   palette.brand.accent,
  },

  state: {
    live:     palette.brand.accent,  // active round, live status
    settled:  palette.paper.muted,   // completed round (de-emphasized)
    upcoming: palette.paper.muted,   // future round
  },

  lane: palette.lane,
} as const

// ─────────────────────────────────────────────────────────────────
// TYPOGRAPHY
// ─────────────────────────────────────────────────────────────────

export const typography = {
  family: {
    display: '"Newsreader", "Times New Roman", serif',
    body:    '"Inter", system-ui, sans-serif',
    mono:    '"JetBrains Mono", ui-monospace, monospace',
  },

  size: {
    micro:   '9.5px',   // eyebrow labels, uppercase metadata
    xs:      '10.5px',  // small mono numerics, captions
    sm:      '11px',    // panel sub-titles
    base:    '13px',    // body default
    md:      '14px',    // body emphasized
    lg:      '20px',    // panel titles (display font)
    xl:      '26px',    // brand wordmark (display font)
  },

  weight: {
    regular:  400,
    medium:   500,
    semibold: 600,
  },

  lineHeight: {
    tight:   1.1,
    base:    1.45,
  },

  letterSpacing: {
    tight:   '-0.01em',  // display font
    normal:  '0',
    wide:    '0.08em',   // brand sub
    wider:   '0.1em',    // pills, eyebrows
    widest:  '0.14em',   // panel eyebrows
  },

  // Font feature settings — used in body for stylistic alternates
  features: {
    body: '"ss01", "cv11"',
    mono: '"tnum"',  // tabular numerics
  },
} as const

// ─────────────────────────────────────────────────────────────────
// SPACING
// ─────────────────────────────────────────────────────────────────

export const spacing = {
  0:  '0',
  1:  '4px',
  2:  '8px',
  3:  '12px',
  4:  '14px',  // panel padding default
  5:  '16px',
  6:  '18px',
  7:  '22px',  // app padding
  8:  '28px',  // section gaps
  9:  '32px',
} as const

// ─────────────────────────────────────────────────────────────────
// LAYOUT
// ─────────────────────────────────────────────────────────────────

export const layout = {
  appMaxWidth: '1680px',
  laneHeight:  '46px',
  rowPadding:  '9px 14px',

  // Three-column grid (desktop default)
  gridColumns: {
    desktop: '280px minmax(0, 1fr) 320px',
    tablet:  '240px minmax(0, 1fr) 280px',
    mobile:  '1fr',
  },
} as const

// ─────────────────────────────────────────────────────────────────
// BORDERS & RADIUS
// ─────────────────────────────────────────────────────────────────

export const radius = {
  none: '0',
  sm:   '1px',   // pills (intentionally minimal)
  md:   '2px',   // small accents
  full: '9999px', // swatches (circular dots)
} as const

export const borders = {
  width: '1px',
  style: 'solid',
} as const

// ─────────────────────────────────────────────────────────────────
// MOTION
// ─────────────────────────────────────────────────────────────────

export const motion = {
  duration: {
    fast:    '80ms',   // hover states
    base:    '150ms',
    medium:  '250ms',
    slow:    '500ms',
  },
  easing: {
    standard: 'cubic-bezier(0.4, 0.0, 0.2, 1)',
    linear:   'linear',  // race tick animation
  },
} as const

// ─────────────────────────────────────────────────────────────────
// TYPE EXPORTS
// ─────────────────────────────────────────────────────────────────

export type Tokens = typeof tokens
export type Typography = typeof typography
export type Spacing = typeof spacing
export type Layout = typeof layout
