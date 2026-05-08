/**
 * COPY — single source of truth for every user-facing string.
 *
 * No literal English strings should appear in `.vue` templates, UI helpers, or
 * test specs. Reference `COPY.<group>.<key>` instead. See ADR 0012 for rationale
 * and migration path to vue-i18n.
 *
 * Grouping is by surface (where the user sees the string), not by feature, so
 * editorial review can scan all button labels, all panel titles, etc. side by
 * side.
 *
 * Engine status values like `'running'` / `'paused'` are domain enums, not copy,
 * and intentionally do not appear here — see `RaceStatus` in entities/race.
 */

export const COPY = {
  app: {
    title:    'Furlong',
    subtitle: 'Racing Simulation',
  },

  actions: {
    generate: 'Generate Program',
    start:    'Start',
    pause:    'Pause',
    resume:   'Resume',
    skip:     'Skip Round',
    /** Composite "Start / Resume" label shown when start and resume are interchangeable */
    startOrResume: 'Start / Resume',
  },

  panels: {
    stable:       'Stable',
    track:        'Track',
    programme:    'Programme',
    results:      'Results',
    standings:    'Championship',
    /** Sub-caption under the Championship title */
    standingsCaption: 'Points across all rounds. Long races (≥ 1800 m) count double.',
  },

  // Eyebrow labels — small uppercase metadata above each panel title.
  eyebrows: {
    stableCount:        (count: number) => `01 — ${count} horses`,
    trackLive:          '02 — Live',
    /** Eyebrow when the track is showing some non-running status (idle/ready/paused/etc.) */
    trackStatus:        (status: string) => `02 — ${status}`,
    programme:          '03',
    resultsSettled:     (count: number) => `04 — ${count} settled`,
    standingsBeforeRun: '05 — championship',
    standingsAfter:     (n: number, total: number) => `05 — after round ${n} of ${total}`,
    standingsFinal:     '05 — final',
  },

  // Race programme row badges (per round).
  states: {
    settled:  'Settled',
    active:   'Active',
    upcoming: 'Upcoming',
    /** Live-status word shown in the track eyebrow when status === 'running' */
    live:     'Live',
  },

  empty: {
    program:   'No programme generated.',
    results:   'No rounds completed yet.',
    standings: 'Standings appear after the first round. Each finish earns points (1st = 10, last = 1); long races double the score.',
    /** Track placeholder when no schedule has been generated yet */
    track:     'Generate a program to begin.',
    /** Track title before the first round is active */
    trackAwaiting: 'Awaiting program',
    /** Standing row when a horse has no top-3 finishes */
    finishesDash: '—',
  },

  // Roster table column headers.
  roster: {
    name:         'Name',
    age:          'Age',
    condition:    'Cond.',
    stamina:      'Stam.',
    acceleration: 'Accl.',
  },

  // Standings table column headers.
  standings: {
    rank:        'Rank',
    horse:       'Horse',
    points:      'Pts',
    /** "Top N finishes" header — N comes from RACING_CONFIG.display.podiumSize */
    topFinishes: (podiumSize: number) => `Top ${podiumSize} finishes`,
    /** Tooltip on a finish chip — uses singular/plural automatically */
    finishesTooltip: (count: number, place: string) =>
      `Finished ${place} in ${count} race${count === 1 ? '' : 's'}`,
    /** Tooltip on the gold/1st chip uses verb "Won" */
    winsTooltip: (count: number) =>
      `Won ${count} race${count === 1 ? '' : 's'}`,
  },

  // Race-track / status bar labels.
  track: {
    finishLabel:   'FINISH',
    finishLine:    'Finish line',
    statusRound:   'Round',
    statusDistance:'Distance',
    statusElapsed: 'Elapsed',
    /** "Round NN — D m" used as the panel title once a round is active */
    roundTitle: (paddedId: string, distance: number) =>
      `Round ${paddedId} — ${distance} m`,
  },

  // Result card title formatting.
  results: {
    /** "Round NN — D m" used in the settled-rounds list */
    cardTitle: (paddedId: string, distance: number) =>
      `Round ${paddedId} — ${distance} m`,
  },

  // Programme list row formatting (category + status suffix).
  programme: {
    /** "R01" prefix for a row */
    rowPrefix: (paddedId: string) => `R${paddedId}`,
    /** Suffix appended to the category name on the active round */
    activeSuffix:   ' · Active',
    /** Suffix appended to the category name on a settled round */
    settledSuffix:  ' · Settled',
  },
} as const

export type Copy = typeof COPY
