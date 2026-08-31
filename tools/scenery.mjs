/** Screenshots one screen from each region, to look at the scenery. */
import { chromium } from 'playwright'
const OUT = '/tmp/claude-0/-home-user-claude-routines-scratch/6df0b2d4-03e5-5006-8fa7-f59d18d1702e/scratchpad'
const browser = await chromium.launch({
  executablePath: process.env.CHROME ?? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
})
const page = await browser.newPage({ viewport: { width: 820, height: 760 } })
page.on('pageerror', (e) => console.error('PAGEERROR', String(e)))
await page.goto(process.env.BASE ?? 'http://localhost:5199/', { waitUntil: 'networkidle' })
await page.evaluate(() => localStorage.removeItem('zsq.save'))
await page.reload({ waitUntil: 'networkidle' })
await page.getByRole('button', { name: /begin/i }).click()
await page.waitForSelector('.game-canvas')
// Light every room so the scenery is visible in the shots.
await page.evaluate(() => { window.zsq.state.inventory.blueCandle = 1 })

const shots = process.env.SCREENS
  ? process.env.SCREENS.split(',')
  : ['village-square', 'forest-2', 'river-bridge', 'mountain-1', 'graveyard-1', 'd1-hall', 'd3-hall', 'forest-grotto']

for (const id of shots) {
  await page.evaluate((s) => window.zsq.goTo(s, 7, 8), id)
  await page.waitForTimeout(500)
  const canvas = await page.locator('.game-canvas')
  await canvas.screenshot({ path: `${OUT}/scene-${id}.png` })
}
console.log('shot', shots.join(', '))
await browser.close()
