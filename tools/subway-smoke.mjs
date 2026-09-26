/**
 * Level 3, stage 3: the subway.
 *
 * Down the stairs at Sheridan Square, the turnstile asks for the fare and —
 * with nothing learned yet — waves him through; the passage, the platform,
 * M with no subway map; onto the train, a change of mind, then a ride
 * uptown to West 4th and off through the doors; the free map on the West
 * 4th mezzanine and the subway map it opens; up the stairs at the end of
 * the line to Union Square and its chest; and a save closed on the train,
 * which reopens on a platform. Screenshots of each go to the scratchpad.
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
const shot = (name) => page.locator('.game-canvas').screenshot({ path: `${OUT}/subway-${name}.png` })
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

// ------------------------------------------------------------ down the stairs
await page.evaluate(() => window.zsq.world.teleport('nyc-sheridan-square', 3, 6))
await wait(200)
await walk('ArrowLeft', 350)
await wait(500)
let s = await world()
check('the stairs on Sheridan Square go down to Christopher Street', s.screen === 'nyc-sub-christopher-mezz')

// ------------------------------------------------------------ the turnstile
await walk('ArrowDown', 900)
await wait(400)
let prompt = page.locator('.gate-prompt')
check('the turnstile asks for the fare', (await prompt.count()) > 0)
check('and the fare is three words', (await prompt.textContent().catch(() => '')).includes('Three words'))
await clickIf(/pay the fare/i)
// Nothing learned yet: the attendant waves him through.
await clickIf(/^ok$/i)
await wait(300)
s = await world()
check('with nothing learned yet, the first ride is free', (s.turnstilePasses ?? []).includes('nyc-turnstile-christopher'))
check('and the turnstile is not remembered as opened', !(await page.evaluate(() => window.zsq.state.world.openedGates.includes('nyc-turnstile-christopher'))))
await shot('mezzanine')
await walk('ArrowDown', 1400)
await wait(400)
s = await world()
check('through the turnstile and down into the passage', s.screen === 'nyc-sub-christopher-passage')
await page.evaluate(() => window.zsq.world.teleport('nyc-sub-christopher-passage', 7, 8))
await wait(100)
await walk('ArrowDown', 900)
await wait(400)
s = await world()
check('and the platform is a screen further on', s.screen === 'nyc-sub-christopher-platform')
await shot('platform')

// Coming back up, the turnstile lets him out without asking.
await page.evaluate(() => window.zsq.world.teleport('nyc-sub-christopher-mezz', 7, 8))
await wait(100)
await walk('ArrowUp', 700)
await wait(300)
s = await world()
check('from the platform side the turnstile lets him out free', (s.turnstilePasses ?? []).includes('nyc-turnstile-christopher') && !(await page.locator('.gate-prompt').count()))
// And once he leaves the screen, the pass is gone.
await page.evaluate(() => window.zsq.world.teleport('nyc-sub-christopher-passage', 7, 5))
await wait(100)
await page.evaluate(() => window.zsq.world.teleport('nyc-sub-christopher-mezz', 7, 3))
await wait(100)
s = await world()
check('leaving the mezzanine spends the pass', (s.turnstilePasses ?? []).length === 0)

// ------------------------------------------------------------ no map yet
await page.evaluate(() => window.zsq.world.teleport('nyc-sub-christopher-platform', 7, 3))
await wait(200)
await page.keyboard.press('m')
await wait(300)
check('M on the platform with no subway map opens nothing', (await world()).mapOpen !== true)

// ------------------------------------------------------------ the train
await page.evaluate(() => window.zsq.world.teleport('nyc-sub-christopher-platform', 7, 4))
await wait(100)
await walk('ArrowDown', 600)
await wait(400)
check('stepping onto the train asks which way', (await page.locator('.ride-prompt').count()) > 0)
check('and Christopher Street is the end of the line: uptown only', (await page.getByRole('button', { name: /uptown to west 4th/i }).count()) === 1 && (await page.getByRole('button', { name: /downtown/i }).count()) === 0)
await clickIf(/stay on the platform/i)
s = await world()
check('staying puts him back on the platform', s.screen === 'nyc-sub-christopher-platform' && !s.ride)
await walk('ArrowDown', 600)
await wait(400)
check('stepping on again asks again', (await page.locator('.ride-prompt').count()) > 0)
await clickIf(/uptown to west 4th/i)
await wait(300)
s = await world()
check('choosing uptown puts him on the train', s.screen === 'nyc-train-car')
check('and the train is moving', s.ride?.phase === 'moving' && s.ride?.dir === -1)
await wait(1200)
await shot('train')
// The doors open at West 4th.
let arrived = false
for (let i = 0; i < 80 && !arrived; i++) {
  await wait(100)
  s = await world()
  if (s.ride?.phase === 'doors') arrived = true
}
check('after a while the doors open at the next stop', arrived && s.ride?.index === 3)
// Step through a door.
await page.evaluate(() => window.zsq.world.teleport('nyc-train-car', 4, 8))
await wait(100)
await walk('ArrowDown', 400)
await wait(400)
s = await world()
check('stepping through the open doors gets him off at West 4th', s.screen === 'nyc-sub-w4-platform' && !s.ride)

// ------------------------------------------------------------ the subway map
await page.evaluate(() => window.zsq.world.teleport('nyc-sub-w4-mezz', 3, 3))
await wait(200)
await walk('ArrowDown', 300)
await wait(600)
check('the subway map on the West 4th mezzanine is picked up by walking over it', (await page.evaluate(() => window.zsq.state.inventory.subwayMap ?? 0)) === 1)
await page.waitForSelector('.found-panel', { timeout: 4000 }).catch(() => {})
await clickIf(/take it|got it|keep going/i)
await wait(200)
await page.keyboard.press('m')
await wait(300)
check('M underground opens the subway map', (await world()).mapOpen === true)
await shot('subway-map')
await page.keyboard.press('m')
await wait(200)
// Above ground the same key opens the street map, which he has not got.
await page.evaluate(() => window.zsq.goTo('nyc-sixth-ave', 5, 2))
await wait(200)
await page.keyboard.press('m')
await wait(300)
check('M on the street still wants the street map', (await world()).mapOpen !== true)

// ------------------------------------------------------------ Union Square
await page.evaluate(() => window.zsq.world.teleport('nyc-sub-union-mezz', 7, 8))
await wait(100)
await walk('ArrowUp', 2400)
await wait(500)
s = await world()
check('up the stairs at the end of the line is Union Square', s.screen === 'nyc-union-square')
const before = await page.evaluate(() => window.zsq.state.player.rupees)
await page.evaluate(() => window.zsq.world.teleport('nyc-union-square', 3, 7))
await wait(100)
await walk('ArrowDown', 300)
await wait(300)
check('and the chest under the bench pays for the ride', (await page.evaluate(() => window.zsq.state.player.rupees)) === before + 80)
await shot('union-square')
// Back down: the turnstile wants paying again.
await page.evaluate(() => window.zsq.world.teleport('nyc-union-square', 7, 8))
await wait(100)
await walk('ArrowDown', 300)
await wait(400)
s = await world()
check('the stairs in the square go back down to the station', s.screen === 'nyc-sub-union-mezz')
await walk('ArrowDown', 900)
await wait(400)
check('and the turnstile asks for the fare again', (await page.locator('.gate-prompt').count()) > 0)
await clickIf(/not right now/i)

// ------------------------------------------------------------ paying the fare
// With an exercise finished, the turnstile runs three questions and no more.
await page.evaluate(() => { window.zsq.state.spelling.completedExercises = [1]; window.zsq.world.teleport('nyc-sub-w4-mezz', 7, 3) })
await wait(200)
await walk('ArrowDown', 900)
await wait(400)
check('with an exercise learned, the turnstile still asks', (await page.locator('.gate-prompt').count()) > 0)
await clickIf(/pay the fare/i)
await wait(600)
check('and paying runs a spelling challenge', (await page.locator('.exercise-screen').count()) > 0)
check('titled for the fare', (await page.locator('.exercise-title').textContent().catch(() => '')).includes('Three words'))
check('of exactly three questions', (await page.locator('.progress-dots > *').count()) === 3)
await clickIf(/leave for now/i)
await clickIf(/yes, leave/i)
await page.waitForSelector('.game-canvas')
await wait(400)
s = await world()
check('leaving the challenge puts him back on the mezzanine, unpaid', s.screen === 'nyc-sub-w4-mezz' && (s.turnstilePasses ?? []).length === 0)

// ------------------------------------------------------------ closed on the train
await page.evaluate(() => {
  const save = JSON.parse(localStorage.getItem('zsq.save'))
  save.player.screenId = 'nyc-train-car'
  localStorage.setItem('zsq.save', JSON.stringify(save))
})
await page.reload({ waitUntil: 'networkidle' })
await page.getByRole('button', { name: /begin|continue/i }).click()
await page.waitForSelector('.game-canvas')
await wait(400)
s = await world()
check('a save closed on the train wakes on the West 4th platform', s.screen === 'nyc-sub-w4-platform' && !s.ride)

console.log(JSON.stringify({ failures, errors }, null, 2))
for (const f of failures) console.log('  FAILED:', f)
await browser.close()
process.exit(failures.length || errors.length ? 1 : 0)
