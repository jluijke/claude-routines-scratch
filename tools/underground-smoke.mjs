/**
 * The last of the city: the third rail, the express, the busker, Coney Island.
 *
 * He climbs down into the pit at the end of the Christopher Street platform
 * and the third rail bites; he waits on the far track and the express throws
 * him back up; he walks up to the busker at Union Square and the music
 * changes, and walks away and it changes back; he takes the express and it
 * skips a stop; and at Coney Island the three of them are only there once
 * all three have been loved.
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
const shot = (name) => page.locator('.game-canvas').screenshot({ path: `${OUT}/underground-${name}.png` })
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
  window.zsq.world.heal(15)
  window.zsq.state.world.invisibleScreens = 99
})

// ------------------------------------------------------------ the third rail
await page.evaluate(() => window.zsq.world.teleport('nyc-sub-christopher-platform', 0, 4))
await wait(700)
await page.evaluate(() => window.zsq.world.debugClearEnemies())
let before = (await world()).hearts
let deepest = 0
let s = await world()
await page.keyboard.down('ArrowDown')
for (let i = 0; i < 12; i++) { await wait(80); s = await world(); deepest = Math.max(deepest, s.y) }
await page.keyboard.up('ArrowDown')
check('he can climb down into the pit at the end of the platform', deepest >= 6 * 16 - 4)
check('and the third rail bites', s.hearts < before)
await shot('third-rail')

// ------------------------------------------------------------ the express
await page.evaluate(() => window.zsq.world.heal(15))
// Wait for the warning, then stand on the far track and let it come.
for (let i = 0; i < 200; i++) {
  s = await world()
  if (s.express === 'warning') break
  await wait(100)
}
check('the express announces itself', s.express === 'warning')
await clickIf(/stay on the platform/i)
// At the open end of the pit, clear of the standing train, and held off the
// rail for a moment so it is the express that moves him and nothing else.
await page.evaluate(() => { window.zsq.world.teleport('nyc-sub-christopher-platform', 0, 8); window.zsq.world.player.invulnerable = 9999 })
await wait(900)
await shot('headlight')
let thrown = false
before = (await world()).hearts
for (let i = 0; i < 60 && !thrown; i++) {
  s = await world()
  if (s.express === 'passing' && i % 3 === 0) await shot('express')
  if (s.y < 6 * 16) thrown = true
  await wait(50)
}
check('the express throws him back up onto the platform', thrown)
check('and it costs him', (await world()).hearts < before)

// ------------------------------------------------------------ the busker
await clickIf(/stay on the platform/i)
await page.evaluate(() => { window.zsq.world.player.invulnerable = 0; window.zsq.world.heal(15); window.zsq.world.teleport('nyc-sub-union-passage', 8, 8) })
await wait(700)
check('far from the busker, no sax', (await world()).nearBusker === false)
await page.evaluate(() => window.zsq.world.teleport('nyc-sub-union-passage', 5, 4))
let heard = false
for (let i = 0; i < 20 && !heard; i++) { await wait(100); heard = (await world()).nearBusker === true }
check('near the busker, the music is his', heard)
await shot('busker')
await page.evaluate(() => window.zsq.world.teleport('nyc-sub-union-passage', 7, 9))
await wait(400)
check('walking away, it goes', (await world()).nearBusker === false)

// ------------------------------------------------------------ the express ride
await page.evaluate(() => window.zsq.world.teleport('nyc-sub-w4-platform', 7, 4))
await wait(700)
for (let i = 0; i < 8 && !(await page.locator('.ride-prompt').count()); i++) { await walk('ArrowDown', 200); await wait(200) }
check('West 4th offers the express both ways', (await page.getByRole('button', { name: /^express uptown/i }).count()) === 1 && (await page.getByRole('button', { name: /^express downtown/i }).count()) === 1)
await clickIf(/^express downtown/i)
await wait(300)
s = await world()
check('the express is two stops a leg', s.ride?.step === 2)
let arrived = false
for (let i = 0; i < 80 && !arrived; i++) {
  await wait(100)
  s = await world()
  if (s.ride?.phase === 'doors') arrived = true
}
check('and the doors open two stops on, at Canal Street', arrived && s.ride?.index === 6)

// ------------------------------------------------------------ Coney Island
await page.evaluate(() => window.zsq.world.teleport('nyc-coney-island', 7, 8))
await wait(700)
s = await world()
check('the Wonder Wheel is at Coney Island', s.props.includes('wonderWheel'))
check('and the three of them are not, yet', !s.props.includes('guardianGold'))
await shot('coney-before')
await page.evaluate(() => {
  window.zsq.state.world.defeatedBosses.push('nyc-trump-green', 'nyc-columbus-park', 'nyc-boardwalk')
  window.zsq.world.teleport('nyc-coney-island', 7, 8)
})
await wait(700)
s = await world()
check('once all three are loved, they are all here', ['guardianGold', 'guardianGrey', 'guardianDark'].every((g) => s.props.includes(g)))
await page.evaluate(() => window.zsq.world.teleport('nyc-coney-island', 5, 8))
await wait(300)
check('and they have something to say', /pierogi/i.test(String(await page.evaluate(() => window.zsq.world.talkingProp()))))
await shot('coney-finale')

console.log(JSON.stringify({ failures, errors }, null, 2))
for (const f of failures) console.log('  FAILED:', f)
await browser.close()
process.exit(failures.length || errors.length ? 1 : 0)
