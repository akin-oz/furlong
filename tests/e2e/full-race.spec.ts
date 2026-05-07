import { test, expect, type Page } from '@playwright/test'

/**
 * End-to-end coverage for the full championship flow.
 *
 * Each test starts from a fresh `/` page load. The race engine is real (no
 * mocking) — Skip Round is used to fast-forward each round to completion so
 * the suite stays fast.
 */

const SELECTORS = {
  generate: 'button:has-text("Generate Program")',
  startResume: 'button:has-text("Start")',
  pause: 'button:has-text("Pause")',
  skip: 'button:has-text("Skip Round")',
  trackPlaceholder: '.track-placeholder',
  programRow: '.prog-row',
  resultCard: '.res-card',
  standingRow: '.standing-row',
  standingPodium: '.standing-row.podium',
  lane: '.lane',
  trackTitle: '.track-col .col-title',
  resultsEyebrow: 'section.col:has(.col-title:has-text("Results")) .col-eyebrow',
  championshipEyebrow: 'section.col:has(.col-title:has-text("Championship")) .col-eyebrow',
  programLiveRow: '.prog-row.live',
  finishLabel: '.finish-label',
} as const

async function generateProgram(page: Page): Promise<void> {
  await page.locator(SELECTORS.generate).click()
  await expect(page.locator(SELECTORS.programRow)).toHaveCount(6)
}

async function skipNextRound(page: Page): Promise<void> {
  // Skip is only enabled while the round is running or paused.
  await expect(page.locator(SELECTORS.skip)).toBeEnabled()
  await page.locator(SELECTORS.skip).click()
}

async function waitForRoundCount(page: Page, n: number): Promise<void> {
  await expect(page.locator(SELECTORS.resultCard)).toHaveCount(n, { timeout: 10_000 })
}

test.describe('Furlong dashboard — full championship flow', () => {
  test('initial state shows awaiting program and empty side panels', async ({ page }) => {
    await page.goto('/')

    await expect(page.locator(SELECTORS.trackPlaceholder)).toBeVisible()
    await expect(page.locator(SELECTORS.trackPlaceholder)).toContainText('Generate a program')

    // Programme list is empty.
    await expect(page.locator(SELECTORS.programRow)).toHaveCount(0)
    await expect(page.locator(SELECTORS.resultCard)).toHaveCount(0)
    await expect(page.locator(SELECTORS.standingRow)).toHaveCount(0)

    // Generate is enabled, Skip and Start are disabled in idle.
    await expect(page.locator(SELECTORS.generate)).toBeEnabled()
    await expect(page.locator(SELECTORS.skip)).toBeDisabled()
  })

  test('generating a program populates the schedule and reveals the track', async ({ page }) => {
    await page.goto('/')
    await generateProgram(page)

    // 6 programme rows with the expected distance sequence.
    const distances = (await page.locator('.prog-row .prog-dist').allTextContents()).map(
      (s) => s.trim(),
    )
    expect(distances).toEqual([
      '1200 m',
      '1400 m',
      '1600 m',
      '1800 m',
      '2000 m',
      '2200 m',
    ])

    // Track now shows 10 lanes for the first round.
    await expect(page.locator(SELECTORS.trackPlaceholder)).toBeHidden()
    await expect(page.locator(SELECTORS.lane)).toHaveCount(10)
    await expect(page.locator(SELECTORS.trackTitle)).toContainText('Round 01')
    await expect(page.locator(SELECTORS.trackTitle)).toContainText('1200 m')

    // Skip is still disabled in 'ready'; Start should be enabled.
    await expect(page.locator(SELECTORS.skip)).toBeDisabled()
    await expect(page.locator(SELECTORS.startResume)).toBeEnabled()
  })

  test('completes all 6 rounds end-to-end and produces final standings', async ({ page }) => {
    await page.goto('/')
    await generateProgram(page)

    // Start the championship.
    await page.locator(SELECTORS.startResume).click()
    await expect(page.locator(SELECTORS.pause)).toBeVisible()

    // Skip through every round. After each skip the status enters 'between'
    // for ~1.5s before auto-advancing — the next skip waits for re-enable.
    for (let round = 1; round <= 6; round++) {
      await skipNextRound(page)
      await waitForRoundCount(page, round)

      if (round < 6) {
        // Track header should advance to the next round once 'between' resolves.
        await expect(page.locator(SELECTORS.trackTitle)).toContainText(
          `Round ${String(round + 1).padStart(2, '0')}`,
          { timeout: 5_000 },
        )
      }
    }

    // Championship complete.
    await expect(page.locator(SELECTORS.resultCard)).toHaveCount(6)
    await expect(page.locator(SELECTORS.championshipEyebrow)).toContainText('final')

    // Standings list every horse and emphasises the top 3.
    await expect(page.locator(SELECTORS.standingRow)).toHaveCount(20)
    await expect(page.locator(SELECTORS.standingPodium)).toHaveCount(3)

    // Podium ranks read 1, 2, 3 (no ties expected with seeded fixtures —
    // the assertion accepts either '1' or 'T1' style prefixes).
    const podiumRanks = await page
      .locator('.standing-row.podium .standing-rank')
      .allTextContents()
    const normalised = podiumRanks.map((r) => r.replace(/^T/, '').trim())
    expect(normalised).toEqual(['1', '2', '3'])

    // After finished, generate becomes available again, skip is locked out.
    await expect(page.locator(SELECTORS.generate)).toBeEnabled()
    await expect(page.locator(SELECTORS.skip)).toBeDisabled()
  })

  test('pause halts the running race and resume restarts it', async ({ page }) => {
    await page.goto('/')
    await generateProgram(page)
    await page.locator(SELECTORS.startResume).click()

    // Pause appears once running.
    await expect(page.locator(SELECTORS.pause)).toBeVisible()
    await page.locator(SELECTORS.pause).click()

    // Paused state: Start visible, Skip still enabled.
    await expect(page.locator(SELECTORS.startResume)).toBeVisible()
    await expect(page.locator(SELECTORS.skip)).toBeEnabled()

    // Generate is locked while a round is in flight.
    await expect(page.locator(SELECTORS.generate)).toBeDisabled()

    // Resume → Pause re-appears.
    await page.locator(SELECTORS.startResume).click()
    await expect(page.locator(SELECTORS.pause)).toBeVisible()
  })

  test('results and standings update incrementally after each round', async ({ page }) => {
    await page.goto('/')
    await generateProgram(page)
    await page.locator(SELECTORS.startResume).click()

    // Round 1
    await skipNextRound(page)
    await waitForRoundCount(page, 1)
    await expect(page.locator(SELECTORS.standingRow)).toHaveCount(20)
    await expect(page.locator(SELECTORS.resultsEyebrow)).toContainText('1 settled')

    // Round 2 — programme should mark round 1 as settled, round 2 as live.
    await expect(page.locator(SELECTORS.skip)).toBeEnabled({ timeout: 5_000 })
    await skipNextRound(page)
    await waitForRoundCount(page, 2)
    await expect(page.locator(SELECTORS.resultsEyebrow)).toContainText('2 settled')

    // The live row in the programme should be Round 03 once we advance.
    await expect(page.locator(SELECTORS.programLiveRow)).toContainText('R03', {
      timeout: 5_000,
    })
  })

  test('regenerating the program resets results and standings', async ({ page }) => {
    await page.goto('/')
    await generateProgram(page)
    await page.locator(SELECTORS.startResume).click()
    await skipNextRound(page)
    await waitForRoundCount(page, 1)

    // Wait through all 6 rounds so the championship is finished and
    // Generate becomes enabled again.
    for (let round = 2; round <= 6; round++) {
      await expect(page.locator(SELECTORS.skip)).toBeEnabled({ timeout: 5_000 })
      await skipNextRound(page)
      await waitForRoundCount(page, round)
    }

    // Regenerate.
    await expect(page.locator(SELECTORS.generate)).toBeEnabled()
    await page.locator(SELECTORS.generate).click()

    await expect(page.locator(SELECTORS.programRow)).toHaveCount(6)
    await expect(page.locator(SELECTORS.resultCard)).toHaveCount(0)
    await expect(page.locator(SELECTORS.trackTitle)).toContainText('Round 01')
  })
})
