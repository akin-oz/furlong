import { test, expect, type Page } from '@playwright/test'
import { COPY, RACING_CONFIG } from '@shared/config'
import { padRoundId } from '@shared/lib/format'
import { TEST_CONFIG } from '../config/test.config'

/**
 * End-to-end coverage for the full championship flow.
 *
 * Each test starts from a fresh `/` page load. The race engine is real (no
 * mocking) — Skip Round is used to fast-forward each round to completion so
 * the suite stays fast.
 */

const TOTAL_ROUNDS = RACING_CONFIG.rounds.length
const TOTAL_HORSES = RACING_CONFIG.horses.totalCount
const HORSES_PER_ROUND = RACING_CONFIG.horses.perRound
const PODIUM_SIZE = RACING_CONFIG.display.podiumSize
const ROUND_DISTANCES = RACING_CONFIG.rounds.map((r) => r.distance)
const FIRST_ROUND_LABEL = padRoundId(RACING_CONFIG.rounds[0]!.id)
const FIRST_ROUND_TITLE = COPY.track.roundTitle(FIRST_ROUND_LABEL, RACING_CONFIG.rounds[0]!.distance)
const PER_ROUND_TIMEOUT = TEST_CONFIG.e2e.perRoundTimeoutMs
const TRANSITION_TIMEOUT = TEST_CONFIG.e2e.transitionTimeoutMs

const SELECTORS = {
  generate:    `button:has-text("${COPY.actions.generate}")`,
  startResume: `button:has-text("${COPY.actions.start}")`,
  pause:       `button:has-text("${COPY.actions.pause}")`,
  skip:        `button:has-text("${COPY.actions.skip}")`,
  trackPlaceholder: '.track-placeholder',
  programRow:       '.prog-row',
  programDist:      '.prog-row .prog-dist',
  resultCard:       '.res-card',
  standingRow:      '.standing-row',
  standingPodium:   '.standing-row.podium',
  standingPodiumRank: '.standing-row.podium .standing-rank',
  lane: '.lane',
  trackTitle: '.track-col .col-title',
  resultsEyebrow:      `section.col:has(.col-title:has-text("${COPY.panels.results}")) .col-eyebrow`,
  championshipEyebrow: `section.col:has(.col-title:has-text("${COPY.panels.standings}")) .col-eyebrow`,
  programLiveRow: '.prog-row.live',
} as const

async function generateProgram(page: Page): Promise<void> {
  await page.locator(SELECTORS.generate).click()
  await expect(page.locator(SELECTORS.programRow)).toHaveCount(TOTAL_ROUNDS)
}

async function skipNextRound(page: Page): Promise<void> {
  await expect(page.locator(SELECTORS.skip)).toBeEnabled({ timeout: TRANSITION_TIMEOUT })
  await page.locator(SELECTORS.skip).click()
}

async function waitForRoundCount(page: Page, n: number): Promise<void> {
  await expect(page.locator(SELECTORS.resultCard)).toHaveCount(n, {
    timeout: PER_ROUND_TIMEOUT,
  })
}

test.describe('Furlong dashboard — full championship flow', () => {
  test('initial state shows awaiting program and empty side panels', async ({ page }) => {
    await page.goto('/')

    await expect(page.locator(SELECTORS.trackPlaceholder)).toBeVisible()
    await expect(page.locator(SELECTORS.trackPlaceholder)).toContainText(COPY.empty.track)

    await expect(page.locator(SELECTORS.programRow)).toHaveCount(0)
    await expect(page.locator(SELECTORS.resultCard)).toHaveCount(0)
    await expect(page.locator(SELECTORS.standingRow)).toHaveCount(0)

    await expect(page.locator(SELECTORS.generate)).toBeEnabled()
    await expect(page.locator(SELECTORS.skip)).toBeDisabled()
  })

  test('generating a program populates the schedule and reveals the track', async ({ page }) => {
    await page.goto('/')
    await generateProgram(page)

    const distances = (await page.locator(SELECTORS.programDist).allTextContents()).map(
      (s) => s.trim(),
    )
    expect(distances).toEqual(ROUND_DISTANCES.map((d) => `${d} m`))

    await expect(page.locator(SELECTORS.trackPlaceholder)).toBeHidden()
    await expect(page.locator(SELECTORS.lane)).toHaveCount(HORSES_PER_ROUND)
    await expect(page.locator(SELECTORS.trackTitle)).toContainText(FIRST_ROUND_TITLE)

    await expect(page.locator(SELECTORS.skip)).toBeDisabled()
    await expect(page.locator(SELECTORS.startResume)).toBeEnabled()
  })

  test('completes every round end-to-end and produces final standings', async ({ page }) => {
    await page.goto('/')
    await generateProgram(page)

    await page.locator(SELECTORS.startResume).click()
    await expect(page.locator(SELECTORS.pause)).toBeVisible()

    for (let round = 1; round <= TOTAL_ROUNDS; round++) {
      await skipNextRound(page)
      await waitForRoundCount(page, round)

      if (round < TOTAL_ROUNDS) {
        const nextRound = RACING_CONFIG.rounds[round]!
        await expect(page.locator(SELECTORS.trackTitle)).toContainText(
          COPY.track.roundTitle(padRoundId(nextRound.id), nextRound.distance),
          { timeout: TRANSITION_TIMEOUT },
        )
      }
    }

    await expect(page.locator(SELECTORS.resultCard)).toHaveCount(TOTAL_ROUNDS)
    await expect(page.locator(SELECTORS.championshipEyebrow)).toContainText(
      COPY.eyebrows.standingsFinal,
    )

    await expect(page.locator(SELECTORS.standingRow)).toHaveCount(TOTAL_HORSES)
    await expect(page.locator(SELECTORS.standingPodium)).toHaveCount(PODIUM_SIZE)

    const podiumRanks = await page.locator(SELECTORS.standingPodiumRank).allTextContents()
    const expectedPodiumRanks = Array.from({ length: PODIUM_SIZE }, (_, i) => String(i + 1))
    const normalised = podiumRanks.map((r) => r.replace(/^T/, '').trim())
    expect(normalised).toEqual(expectedPodiumRanks)

    await expect(page.locator(SELECTORS.generate)).toBeEnabled()
    await expect(page.locator(SELECTORS.skip)).toBeDisabled()
  })

  test('pause halts the running race and resume restarts it', async ({ page }) => {
    await page.goto('/')
    await generateProgram(page)
    await page.locator(SELECTORS.startResume).click()

    await expect(page.locator(SELECTORS.pause)).toBeVisible()
    await page.locator(SELECTORS.pause).click()

    await expect(page.locator(SELECTORS.startResume)).toBeVisible()
    await expect(page.locator(SELECTORS.skip)).toBeEnabled()
    await expect(page.locator(SELECTORS.generate)).toBeDisabled()

    await page.locator(SELECTORS.startResume).click()
    await expect(page.locator(SELECTORS.pause)).toBeVisible()
  })

  test('results and standings update incrementally after each round', async ({ page }) => {
    await page.goto('/')
    await generateProgram(page)
    await page.locator(SELECTORS.startResume).click()

    await skipNextRound(page)
    await waitForRoundCount(page, 1)
    await expect(page.locator(SELECTORS.standingRow)).toHaveCount(TOTAL_HORSES)
    await expect(page.locator(SELECTORS.resultsEyebrow)).toContainText(
      COPY.eyebrows.resultsSettled(1),
    )

    await skipNextRound(page)
    await waitForRoundCount(page, 2)
    await expect(page.locator(SELECTORS.resultsEyebrow)).toContainText(
      COPY.eyebrows.resultsSettled(2),
    )

    const thirdRound = RACING_CONFIG.rounds[2]!
    const liveRowPrefix = COPY.programme.rowPrefix(padRoundId(thirdRound.id))
    await expect(page.locator(SELECTORS.programLiveRow)).toContainText(liveRowPrefix, {
      timeout: TRANSITION_TIMEOUT,
    })
  })

  test('regenerating the program resets results and standings', async ({ page }) => {
    await page.goto('/')
    await generateProgram(page)
    await page.locator(SELECTORS.startResume).click()
    await skipNextRound(page)
    await waitForRoundCount(page, 1)

    for (let round = 2; round <= TOTAL_ROUNDS; round++) {
      await skipNextRound(page)
      await waitForRoundCount(page, round)
    }

    await expect(page.locator(SELECTORS.generate)).toBeEnabled()
    await page.locator(SELECTORS.generate).click()

    await expect(page.locator(SELECTORS.programRow)).toHaveCount(TOTAL_ROUNDS)
    await expect(page.locator(SELECTORS.resultCard)).toHaveCount(0)
    await expect(page.locator(SELECTORS.trackTitle)).toContainText(FIRST_ROUND_TITLE)
  })
})
