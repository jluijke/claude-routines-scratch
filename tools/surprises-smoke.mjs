/**
 * Level 3, stage 6: the surprises.
 *
 * The purple car on Fifth Avenue takes him somewhere on its list and never
 * back where he got in; a firecracker beside a hydrant sends the water up
 * and over; a pigeon flies up when he walks at it; the train stops at City
 * Hall, which the map did not show, and the hall is a haven with hearts and
 * a chest. Screenshots to the scratchpad.
 */
import { chromium } from 'playwright'

const BASE = process.env.BASE ?? 'http://localhost:5199/'
const OUT = process.env.OUT ?? '/tmp/claude-0/-home-user-claude-routines-scratch/6df0b2d4-03e5-5006-8fa7-f59d18d1702e/scratchpad'
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
const walk = async (key, ms) => { await page.keyboard.down(key); await wait(ms); await page.keyboard.up(key) }
const shot = (name) => page.locator('.game-canvas').screenshot({ path: `${OUT}/surprise-${name}.png` })
const clickIf = async (pattern) => {
  const b = page.getByRole('button', { name: pattern })
  if (await b.count()) { await b.first().click(); await wait(300); return true }
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
  window.zsq.state.world.invisibleScreens = 99
})

// ------------------------------------------------------------ the purple car
const rides = new Set()
for (let n = 0; n < 4; n++) {
  await page.evaluate(() => window.zsq.world.teleport('nyc-fifth-ave', 5, 3))
  await wait(700)
  await walk('ArrowUp', 500)
  await wait(200)
  let s = await world()
  check(`ride ${n + 1}: stepping into the car starts a ride`, s.beaming === true)
  for (let i = 0; i < 40 && s.beaming; i++) { await wait(100); s = await world() }
  check(`ride ${n + 1}: and it lets him out somewhere else`, s.screen !== 'nyc-fifth-ave')
  rides.add(s.screen)
  if (n === 0) await shot('purple-arrival')
}
check('the car does not always go to the same place', rides.size >= 2)
// Times Square is reached only by the car; force the dice by trying until it lands there.
let atTimes = false
for (let n = 0; n < 12 && !atTimes; n++) {
  await page.evaluate(() => window.zsq.world.teleport('nyc-fifth-ave', 5, 3))
  await wait(700)
  await walk('ArrowUp', 500)
  let s = await world()
  for (let i = 0; i < 40 && s.beaming; i++) { await wait(100); s = await world() }
  atTimes = s.screen === 'nyc-times-square'
}
check('sooner or later it goes to Times Square', atTimes)
if (atTimes) {
  await shot('times-square')
  const before = await page.evaluate(() => window.zsq.state.player.rupees)
  await page.evaluate(() => window.zsq.world.teleport('nyc-times-square', 4, 3))
  await wait(700)
  await walk('ArrowLeft', 300)
  await wait(300)
  check('and the wallet in the middle of it pays', (await page.evaluate(() => window.zsq.state.player.rupees)) === before + 150)
  await page.evaluate(() => window.zsq.world.teleport('nyc-times-square', 12, 6))
  await wait(700)
  await walk('ArrowDown', 400)
  let s = await world()
  check('the car in Times Square is the way out', s.beaming === true)
  for (let i = 0; i < 40 && s.beaming; i++) { await wait(100); s = await world() }
  check('and it goes somewhere that is not Times Square', s.screen !== 'nyc-times-square')
}

// ------------------------------------------------------------ the hydrant
await page.evaluate(() => {
  window.zsq.state.inventory.bomb = 3
  window.zsq.state.player.equippedTool = 'bomb'
  window.zsq.world.teleport('nyc-sixth-ave', 5, 2)
})
await wait(700)
// The hydrant on Sixth Avenue is at 5,1; stand under it, face up, and light one.
await walk('ArrowUp', 40)
await page.keyboard.press('x')
let s = await world()
for (let i = 0; i < 40 && !s.spray; i++) { await wait(100); s = await world() }
check('a firecracker by the hydrant blows the cap off', s.spray !== undefined && s.spray.col === 5 && s.spray.row === 1)
await shot('hydrant')
await wait(5500)
check('and after a while the water stops', (await world()).spray === undefined)

// ------------------------------------------------------------ the pigeons
await page.evaluate(() => window.zsq.world.teleport('nyc-sheridan-square', 6, 3))
await wait(700)
await walk('ArrowDown', 750)
await wait(100)
s = await world()
check('a pigeon he walks at flies up', s.scaredPigeons > 0)
await shot('pigeon')
await wait(1800)
check('and comes back down', (await world()).scaredPigeons === 0)

// ------------------------------------------------------------ City Hall
await page.evaluate(() => { window.zsq.state.inventory.subwayMap = 1; window.zsq.world.teleport('nyc-sub-canal-platform', 7, 4) })
await wait(700)
await page.keyboard.press('m')
await wait(300)
await shot('map-before')
await page.keyboard.press('m')
await wait(300)
for (let i = 0; i < 8 && !(await page.locator('.ride-prompt').count()); i++) { await walk('ArrowDown', 200); await wait(200) }
check('at Canal Street the way downtown is into the dark', (await page.getByRole('button', { name: /downtown to the dark/i }).count()) === 1)
await clickIf(/downtown to the dark/i)
let arrived = false
for (let i = 0; i < 80 && !arrived; i++) {
  await wait(100)
  s = await world()
  if (s.ride?.phase === 'doors') arrived = true
}
check('the train stops at City Hall', arrived && s.ride?.index === 7)
await page.evaluate(() => window.zsq.world.teleport('nyc-train-car', 4, 8))
await wait(100)
await walk('ArrowDown', 400)
await wait(400)
s = await world()
check('and he can get off there', s.screen === 'nyc-sub-cityhall-platform')
await page.evaluate(() => window.zsq.world.teleport('nyc-sub-cityhall-platform', 7, 3))
await wait(700)
await walk('ArrowUp', 700)
await wait(400)
s = await world()
check('the hall is up from the platform', s.screen === 'nyc-sub-cityhall-hall')
check('with hearts laid out', (s.drops ?? 0) >= 5)
check('and the rabbit', s.greeter !== undefined)
await shot('city-hall')
await page.keyboard.press('m')
await wait(300)
await shot('map-after')
await page.keyboard.press('m')
await wait(200)
check('the map has it now', (await page.evaluate(() => window.zsq.state.world.visitedScreens)).includes('nyc-sub-cityhall-platform'))

console.log(JSON.stringify({ rides: [...rides], failures, errors }, null, 2))
for (const f of failures) console.log('  FAILED:', f)
await browser.close()
process.exit(failures.length || errors.length ? 1 : 0)
