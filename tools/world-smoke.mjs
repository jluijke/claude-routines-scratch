/**
 * Drives the game world in a real browser: walks the hero around, checks the
 * screen renders, and confirms a barrier raises its prompt.
 */
import { chromium } from 'playwright'

const BASE = process.env.BASE ?? 'http://localhost:5199/'
const OUT = '/tmp/claude-0/-home-user-claude-routines-scratch/6df0b2d4-03e5-5006-8fa7-f59d18d1702e/scratchpad'

const browser = await chromium.launch({
  executablePath: process.env.CHROME ?? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
})
const page = await browser.newPage({ viewport: { width: 1000, height: 900 } })
const errors = []
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()) })
page.on('pageerror', (e) => errors.push(String(e)))

await page.goto(BASE, { waitUntil: 'networkidle' })
await page.getByRole('button', { name: /begin your quest|continue/i }).click()
await page.waitForSelector('.game-canvas')
await page.waitForTimeout(700)
await page.screenshot({ path: `${OUT}/w01-village.png` })

const info = async () => page.evaluate(() => ({
  ...window.zsq.world?.debugState(),
  rupees: window.zsq.state.player.rupees,
  play: window.zsq.state.pacing.playSeconds,
}))

// Walk north into the sealed stone at the village north gate.
await page.keyboard.down('ArrowUp')
await page.waitForTimeout(2200)
await page.keyboard.up('ArrowUp')
await page.waitForTimeout(400)
const afterNorth = await info()
await page.screenshot({ path: `${OUT}/w02-north.png` })

// Keep pushing up until the barrier prompt appears.
let prompted = false
for (let i = 0; i < 6 && !prompted; i++) {
  await page.keyboard.down('ArrowUp')
  await page.waitForTimeout(1200)
  await page.keyboard.up('ArrowUp')
  await page.waitForTimeout(300)
  prompted = (await page.$('.gate-prompt')) !== null
}
if (prompted) await page.screenshot({ path: `${OUT}/w03-gate.png` })

const gateText = prompted ? await page.textContent('.gate-message') : null

// Decline, then try the shop.
if (prompted) {
  await page.getByRole('button', { name: 'Not right now' }).click()
  await page.waitForTimeout(300)
}

// Attack a few times to check the sword renders and enemies react.
await page.keyboard.press('z')
await page.waitForTimeout(120)
await page.screenshot({ path: `${OUT}/w04-sword.png` })

// Jump straight to a dungeon screen to check dark rooms and bosses draw.
await page.evaluate(() => window.zsq.goTo('d1-boss-room', 7, 7))
await page.waitForTimeout(900)
await page.screenshot({ path: `${OUT}/w05-boss.png` })

const final = await info()
console.log(JSON.stringify({ afterNorth, prompted, gateText, final, errors }, null, 2))
await browser.close()
process.exit(errors.length === 0 ? 0 : 1)
