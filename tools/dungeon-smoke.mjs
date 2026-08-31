/** Walks every dungeon room, checking each renders and its enemies behave. */
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
await page.evaluate(() => {
  const s = window.zsq.state
  s.player.maxHearts = 12
  s.player.hearts = 12
  s.inventory.blueCandle = 1
})

const rooms = await page.evaluate(async () => {
  const { SCREENS } = await import('/src/game/world/screens.ts')
  return SCREENS.filter((s) => s.id.startsWith('d3-') || s.id.startsWith('d4-')).map((s) => s.id)
})

const report = []
for (const id of rooms) {
  await page.evaluate((room) => window.zsq.goTo(room, 7, 8), id)
  await page.waitForTimeout(700)
  const s = await page.evaluate(() => window.zsq.world.debugState())
  report.push({ room: id, enemies: s.enemies, screen: s.screen })
  if (id === 'd3-hall' || id === 'd4-boss-room') {
    await page.screenshot({ path: `${OUT}/D-${id}.png` })
  }
}

// Let a caster room run for a few seconds: it should blink and shoot.
await page.evaluate(() => window.zsq.goTo('d3-hall', 7, 8))
await page.waitForTimeout(4000)
const casterRoom = await page.evaluate(() => window.zsq.world.debugState())
await page.screenshot({ path: `${OUT}/D-caster.png` })

console.log(JSON.stringify({
  rooms: report,
  wrongScreen: report.filter((r) => r.room !== r.screen),
  emptyRooms: report.filter((r) => r.enemies === 0).map((r) => r.room),
  afterCasterRun: { hearts: casterRoom.hearts, enemies: casterRoom.enemies },
  errors,
}, null, 2))
await browser.close()
process.exit(errors.length === 0 ? 0 : 1)
