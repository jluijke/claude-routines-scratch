/**
 * Arriving somewhere new in the city.
 *
 * He walks along the road over the edge of one block into the next, again
 * and again, in every direction the grid allows. Each time he must come out
 * on the sidewalk, never in the traffic lane, and no rat may be waiting
 * within a few tiles of him. Then a rat that has just bitten him must run
 * off rather than stand on him.
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
  window.zsq.world.heal(15)
})

// Crossings along the road: [screen, col, row, key]. Each starts in a lane
// a tile from the edge, so one step takes him over it.
const CROSSINGS = [
  ['nyc-bleecker', 14, 5, 'ArrowRight'],
  ['nyc-washington-south', 1, 4, 'ArrowLeft'],
  ['nyc-st-marks', 14, 4, 'ArrowRight'],
  ['nyc-second-ave-north', 1, 5, 'ArrowLeft'],
  ['nyc-sixth-ave', 7, 9, 'ArrowDown'],
  ['nyc-sixth-ave', 8, 1, 'ArrowUp'],
  ['nyc-broadway', 7, 1, 'ArrowUp'],
  ['nyc-second-ave', 8, 9, 'ArrowDown'],
  ['nyc-w10th', 14, 4, 'ArrowRight'],
  ['nyc-christopher-st', 14, 5, 'ArrowRight'],
]
let crossed = 0
for (const [id, col, row, key] of CROSSINGS) {
  // The hoodie keeps the rats on the screen he starts from off him while he
  // takes the step; the screen he steps onto is the one being checked.
  await page.evaluate(([sid, c, r]) => { window.zsq.state.world.invisibleScreens = 99; window.zsq.world.teleport(sid, c, r) }, [id, col, row])
  await wait(300)
  await page.evaluate(() => { window.zsq.state.world.invisibleScreens = 0 })
  let s = await world()
  await page.keyboard.down(key)
  for (let i = 0; i < 20; i++) {
    await wait(40)
    const now = await world()
    if (now.screen !== id) { s = now; break }
  }
  await page.keyboard.up(key)
  if (s.screen === id) { failures.push(`${id} ${key}: did not cross`); continue }
  crossed += 1
  const tile = await page.evaluate(({ x, y }) => {
    const sc = window.zsq.world.debugState().screen
    const screen = window.zsq.screens.find((q) => q.id === sc)
    const col = Math.floor((x + 6) / 16)
    const row = Math.floor((y + 6) / 16)
    return (screen.rows[row] ?? '')[col]
  }, { x: s.x, y: s.y })
  check(`${id} ${key} → ${s.screen}: lands on the sidewalk, not "${tile}"`, tile === '.' || tile === ',')
  const me = { x: s.x + 6, y: s.y + 6 }
  const nearest = Math.min(...(s.enemyCentres ?? []).map((e) => Math.hypot(e.x - me.x, e.y - me.y)), 999)
  check(`${id} ${key} → ${s.screen}: no rat within four tiles (nearest ${Math.round(nearest)})`, nearest >= 64)
}
check('every crossing crossed', crossed === CROSSINGS.length)

// ------------------------------------------------------------ a bite, then off
await page.evaluate(() => {
  window.zsq.state.world.invisibleScreens = 0
  window.zsq.world.teleport('nyc-washington-square', 7, 8)
  window.zsq.world.debugClearEnemies()
  window.zsq.world.debugSpawn('chaser', 9, 8)
})
let bitten = false
let gap = 0
const before = (await world()).hearts
for (let i = 0; i < 60; i++) {
  await wait(60)
  const s = await world()
  if (!bitten && s.hearts < before) bitten = true
  if (bitten) {
    const me = { x: s.x + 6, y: s.y + 6 }
    const rat = s.enemyCentres?.[0]
    if (rat) gap = Math.max(gap, Math.hypot(rat.x - me.x, rat.y - me.y))
  }
}
check('a rat bites', bitten)
check('and a bite costs one heart', before - (await world()).hearts <= 2)
check('then it runs off', gap > 30)

console.log(JSON.stringify({ crossed, failures, errors }, null, 2))
for (const f of failures) console.log('  FAILED:', f)
await browser.close()
process.exit(failures.length || errors.length ? 1 : 0)
