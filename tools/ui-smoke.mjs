/** Checks the shop and the parent dashboard render and behave. */
import { chromium } from 'playwright'
const OUT = '/tmp/claude-0/-home-user-claude-routines-scratch/6df0b2d4-03e5-5006-8fa7-f59d18d1702e/scratchpad'
const browser = await chromium.launch({
  executablePath: process.env.CHROME ?? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
})
const page = await browser.newPage({ viewport: { width: 1000, height: 950 } })
const errors = []
page.on('pageerror', (e) => errors.push(String(e)))

await page.goto(process.env.BASE ?? 'http://localhost:5199/', { waitUntil: 'networkidle' })
await page.evaluate(() => localStorage.removeItem('zsq.save'))
await page.reload({ waitUntil: 'networkidle' })
await page.getByRole('button', { name: /begin your quest/i }).click()
await page.waitForSelector('.game-canvas')

// Give him some rupees and some progress, then open the shop.
await page.evaluate(() => {
  const s = window.zsq.state
  s.player.rupees = 420
  s.spelling.completedExercises = [1, 2, 3, 4]
  s.pacing.playSeconds = 900
  s.pacing.exerciseSeconds = 800
  s.spelling.mastery.concepts = {
    syllables: { concept: 'syllables', attempted: 9, independentCorrect: 8, hintsUsed: 1, repeatMistakes: 0, status: 'mastered', missedWords: [] },
    'ee-sound': { concept: 'ee-sound', attempted: 11, independentCorrect: 4, hintsUsed: 6, repeatMistakes: 2, status: 'shaky', missedWords: ['beach', 'monkey', 'valley'] },
    'oa-sound': { concept: 'oa-sound', attempted: 10, independentCorrect: 9, hintsUsed: 0, repeatMistakes: 0, status: 'mastered', missedWords: [] },
  }
})
await page.evaluate(() => window.zsq.goTo('shop-interior', 7, 6))
await page.waitForSelector('.shop', { timeout: 8000 })
await page.screenshot({ path: `${OUT}/S01-shop.png` })

const shopRows = await page.locator('.shop-row').count()
const buyable = await page.locator('.shop-row button:not([disabled])').count()

// Buy the metal sword and check it equips.
const before = await page.evaluate(() => window.zsq.state.player.rupees)
await page.locator('.shop-row', { hasText: 'Metal Sword' }).getByRole('button', { name: 'Buy' }).click()
await page.waitForTimeout(300)
const after = await page.evaluate(() => ({
  rupees: window.zsq.state.player.rupees,
  sword: window.zsq.state.player.equippedSword,
  owns: window.zsq.state.inventory.metalSword,
}))

// A gated item should ask for a spelling challenge rather than sell.
const gatedLabel = await page.locator('.shop-row', { hasText: 'Wings' }).locator('button').textContent()

await page.getByRole('button', { name: /leave the shop/i }).click()
await page.waitForTimeout(300)

// Parent dashboard.
await page.keyboard.press('Control+Shift+P')
await page.waitForSelector('.dashboard', { timeout: 8000 })
await page.screenshot({ path: `${OUT}/S02-dashboard.png`, fullPage: true })
const dashRows = await page.locator('.mastery-table tbody tr').count()
const balance = await page.locator('.dashboard p').nth(1).textContent()
const shakyShown = await page.locator('tr.mastery-shaky .missed').first().textContent()

console.log(JSON.stringify({
  shopRows, buyable,
  purchase: { spent: before - after.rupees, equipped: after.sword, owns: after.owns },
  gatedLabel: gatedLabel?.trim(),
  dashboard: { rows: dashRows, balance: balance?.trim(), shakyWords: shakyShown?.trim() },
  errors,
}, null, 2))

await browser.close()
process.exit(errors.length === 0 ? 0 : 1)
