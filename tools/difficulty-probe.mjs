/** How much punishment does a room hand out to a child who freezes? */
import { chromium } from 'playwright'
const browser = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
})
const page = await browser.newPage({ viewport: { width: 900, height: 820 } })
await page.goto('http://localhost:5199/', { waitUntil: 'networkidle' })
await page.evaluate(() => localStorage.removeItem('zsq.save'))
await page.reload({ waitUntil: 'networkidle' })
await page.getByRole('button', { name: /begin/i }).click()
await page.waitForSelector('.game-canvas')

// Hearts must be granted through the real path: writing them onto the save
// object leaves the live player untouched, so he dies at three and respawns,
// and every room appears to do the same damage.
const HEARTS = 16
const out = {}
for (const [room, label] of [
  ['d3-hall', 'two casters'],
  ['d4-approach', 'two casters + chaser'],
  ['d4-boss-room', 'boss 4'],
  ['d1-hall', 'two flyers'],
  ['village-west', 'one shooter'],
]) {
  await page.evaluate((n) => {
    for (let i = 0; i < n; i++) window.zsq.world.grantHeartContainer()
  }, HEARTS)
  await page.evaluate((r) => window.zsq.goTo(r, 7, 8), room)
  await page.evaluate(() => window.zsq.world.heal(99))
  const start = await page.evaluate(() => window.zsq.world.debugState().hearts)
  await page.waitForTimeout(8000)
  const s = await page.evaluate(() => window.zsq.world.debugState())
  out[room] = `${label}: ${start - s.hearts} of ${start} hearts lost in 8s standing still`
}
console.log(JSON.stringify(out, null, 2))
await browser.close()
