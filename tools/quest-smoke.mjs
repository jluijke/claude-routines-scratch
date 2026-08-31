/** Reads back what each kind of barrier actually says to the child. */
import { chromium } from 'playwright'
const OUT = '/tmp/claude-0/-home-user-claude-routines-scratch/6df0b2d4-03e5-5006-8fa7-f59d18d1702e/scratchpad'
const browser = await chromium.launch({
  executablePath: process.env.CHROME ?? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
})
const page = await browser.newPage({ viewport: { width: 900, height: 820 } })
const errors = []
page.on('pageerror', (e) => errors.push(String(e)))

await page.goto(process.env.BASE ?? 'http://localhost:5199/', { waitUntil: 'networkidle' })
await page.evaluate(() => localStorage.removeItem('zsq.save'))
await page.reload({ waitUntil: 'networkidle' })
await page.getByRole('button', { name: /begin your quest/i }).click()
await page.waitForSelector('.game-canvas')

// One representative of each barrier kind, walked into for real.
const spots = [
  ['river-bridge', 7, 5, 'up', 'bridge'],
  ['village-north', 7, 3, 'up', 'seal'],
  ['forest-hollow-chest', 0, 0, '', 'chest'],
]

const seen = []

async function approach(screen, col, row, dir) {
  await page.evaluate(([s, c, r]) => window.zsq.goTo(s, c, r), [screen, col, row])
  await page.waitForTimeout(350)
  const key = dir === 'up' ? 'ArrowUp' : 'ArrowDown'
  for (let i = 0; i < 6; i++) {
    if (await page.locator('.gate-prompt').count()) break
    await page.keyboard.down(key)
    await page.waitForTimeout(650)
    await page.keyboard.up(key)
    await page.waitForTimeout(200)
  }
  if (!(await page.locator('.gate-prompt').count())) return null
  const kind = await page.locator('.gate-kind').textContent()
  const message = await page.locator('.gate-message').textContent()
  const exercise = await page.locator('.gate-exercise').textContent()
  const reward = await page.locator('.gate-reward').textContent().catch(() => '')
  return { kind: kind?.trim(), message: message?.trim(), exercise: exercise?.trim(), reward: reward?.trim() }
}

const bridge = await approach('river-bridge', 7, 5, 'up')
if (bridge) {
  seen.push(bridge)
  await page.screenshot({ path: `${OUT}/Q01-bridge.png` })
  await page.getByRole('button', { name: 'Not right now' }).click()
  await page.waitForTimeout(300)
}

const seal = await approach('village-north', 7, 3, 'up')
if (seal) {
  seen.push(seal)
  await page.getByRole('button', { name: 'Not right now' }).click()
  await page.waitForTimeout(300)
}

// A dungeon "build a walkway" barrier.
const planks = await approach('d1-entrance', 7, 7, 'up')
if (planks) {
  seen.push(planks)
  await page.screenshot({ path: `${OUT}/Q02-planks.png` })
}

console.log(JSON.stringify({ seen, errors }, null, 2))
await browser.close()
