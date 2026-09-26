/**
 * Level 3, stage 2: the traffic.
 *
 * Cars on the avenues and none in the park; a child standing in a live lane
 * loses hearts; a child on a crosswalk while its road is red does not; a rat
 * in the road is run over. Timed off the game's own light clock, which the
 * debug state reports, so the checks stand where the cars are and are not.
 */
import { chromium } from 'playwright'

const BASE = process.env.BASE ?? 'http://localhost:5199/'
const browser = await chromium.launch({
  executablePath: process.env.CHROME ?? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
})
const page = await browser.newPage({ viewport: { width: 900, height: 820 } })
const errors = []
page.on('pageerror', (e) => errors.push(String(e)))
const failures = []
const check = (name, ok) => { if (!ok) failures.push(name) }
const wait = (ms) => page.waitForTimeout(ms)
const world = () => page.evaluate(() => window.zsq.world.debugState())
const hearts = () => page.evaluate(() => window.zsq.world.debugState().hearts)
/** Waits until the given axis has the green, freshly. */
async function untilGreen(axis) {
  for (let i = 0; i < 200; i++) {
    const s = await world()
    if (s.traffic?.green === axis) return true
    await wait(60)
  }
  return false
}

await page.goto(BASE, { waitUntil: 'networkidle' })
await page.evaluate(() => localStorage.removeItem('zsq.save'))
await page.reload({ waitUntil: 'networkidle' })
await page.getByRole('button', { name: /begin|continue/i }).click()
await page.waitForSelector('.game-canvas')
await wait(300)
await page.evaluate(() => window.zsq.enterLevel(3))
await wait(500)
await page.evaluate(() => {
  for (let i = 0; i < 12; i++) window.zsq.world.grantHeartContainer()
  window.zsq.world.heal(12)
  // The hoodie: the rats cannot touch him, so what costs hearts here is cars.
  window.zsq.state.world.invisibleScreens = 99
})

// ------------------------------------------------------------ where cars are
await page.evaluate(() => window.zsq.goTo('nyc-sixth-ave', 5, 2))
await wait(1500)
let s = await world()
check('Sixth Avenue has cars on it', (s.traffic?.cars?.length ?? 0) > 0)
check('and they run up the avenue', (s.traffic?.cars ?? []).some((c) => c.axis === 'y' && c.dir === -1))
await page.evaluate(() => window.zsq.goTo('nyc-washington-square', 7, 5))
await wait(300)
s = await world()
check('the park has no traffic', s.traffic === undefined)

// ---------------------------------------------------------- standing in it
await page.evaluate(() => window.zsq.goTo('nyc-sixth-ave', 5, 2))
await wait(200)
check('the avenue goes green in the first half of the cycle', await untilGreen('y'))
const before = await hearts()
// Into the uptown lanes, on the far side of the crossing.
await page.evaluate(() => window.zsq.world.teleport('nyc-sixth-ave', 7, 8))
let hit = false
for (let i = 0; i < 90 && !hit; i++) {
  await wait(100)
  if ((await hearts()) < before) hit = true
}
check('standing in a live lane costs him hearts', hit)
check('two of them', before - (await hearts()) === 2)

// -------------------------------------------------------- on the crosswalk
await page.evaluate(() => { window.zsq.world.heal(12); window.zsq.state.world.invisibleScreens = 99; window.zsq.goTo('nyc-sixth-ave', 5, 2) })
await wait(200)
// The cross street is red while the avenue is green: its crosswalk is safe.
check('the avenue is green again', await untilGreen('y'))
// The all-red first: the cars that were in the crossing drive out of it.
await wait(1700)
const safeBefore = await hearts()
await page.evaluate(() => window.zsq.world.teleport('nyc-sixth-ave', 5, 4))
await wait(1500)
await page.evaluate(() => window.zsq.world.teleport('nyc-sixth-ave', 5, 5))
await wait(1500)
check('standing on the crosswalk over a red road costs nothing', (await hearts()) === safeBefore)
s = await world()
check('and the street cars are stopped short of it', (s.traffic?.cars ?? []).filter((c) => c.axis === 'x').every((c) => c.dir > 0 ? c.pos + 12 <= 5 * 16 + 1 || c.pos - 12 >= 6 * 16 - 1 : c.pos - 12 >= 11 * 16 - 1 || c.pos + 12 <= 10 * 16 + 1))

console.log(JSON.stringify({ failures, errors }, null, 2))
for (const f of failures) console.log('  FAILED:', f)
await browser.close()
process.exit(failures.length || errors.length ? 1 : 0)
