/**
 * How floaty is floaty?
 *
 * A measurement, not a check. Zero gravity is a delight right up to the point
 * where a nine-year-old cannot dodge a charging mech, and the difference
 * between the two is a number: how far he coasts after letting go, and how
 * long he takes to get moving. This reports both, on a rock and on a deck, so
 * the two can be compared and the rock can be tuned against the ship.
 */
import { chromium } from 'playwright'

const BASE = process.env.BASE ?? 'http://localhost:5199/'
const browser = await chromium.launch({
  executablePath: process.env.CHROME ?? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
})
const page = await browser.newPage({ viewport: { width: 900, height: 820 } })
const errors = []
page.on('pageerror', (e) => errors.push(String(e)))

await page.goto(BASE, { waitUntil: 'networkidle' })
await page.evaluate(() => localStorage.removeItem('zsq.save'))
await page.reload({ waitUntil: 'networkidle' })
await page.getByRole('button', { name: /begin|continue/i }).click()
await page.waitForSelector('.game-canvas')
await page.waitForTimeout(300)
await page.evaluate(() => window.zsq.enterLevel(2))
await page.waitForTimeout(600)

const at = async () => {
  const s = await page.evaluate(() => window.zsq.world.debugState())
  return { x: s.x, y: s.y }
}

const results = {}
for (const [label, screen, col, row] of [
  ['deck (Engineering)', 'ship-engine-1', 4, 5],
  ['rock (Grey landing)', 'rock-1-landing', 4, 5],
]) {
  // Nothing wandering about while this is measured.
  await page.evaluate(([id, c, r]) => {
    window.zsq.state.world.invisibleScreens = 99
    window.zsq.goTo(id, c, r)
  }, [screen, col, row])
  await page.waitForTimeout(500)

  // How far does half a second of holding right get him?
  const before = await at()
  await page.keyboard.down('ArrowRight')
  await page.waitForTimeout(500)
  const atRelease = await at()
  await page.keyboard.up('ArrowRight')
  // And how much further does he go once the key is up?
  await page.waitForTimeout(900)
  const settled = await at()

  results[label] = {
    travelledWhileHeld: Math.round(atRelease.x - before.x),
    coastedAfterRelease: Math.round(settled.x - atRelease.x),
    coastInTiles: Number(((settled.x - atRelease.x) / 16).toFixed(2)),
  }
}

console.log(JSON.stringify({ results, errors }, null, 2))
await browser.close()
