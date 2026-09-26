/**
 * Level 3, stage 4: the weapons.
 *
 * The knife swings like the wooden sword. The box hammer swings slow, shakes
 * the street and stuns a rat beside it. The pistol fires six and reloads; the
 * rifle fires three and reaches further. The machine gun fires three a press
 * and eats three bullets. A bullet kills a rat. Each weapon is photographed
 * in his hand for the scratchpad.
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
const shot = (name) => page.locator('.game-canvas').screenshot({ path: `${OUT}/weapon-${name}.png` })
const arm = (sword) => page.evaluate((id) => {
  const inv = window.zsq.state.inventory
  for (const s of ['woodenSword', 'metalSword', 'bronzeSword', 'goldenSword']) delete inv[s]
  if (id) inv[id] = 1
  window.zsq.world.equipBest()
  window.zsq.world.refreshFromSave?.()
}, sword)

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
// A corridor to shoot down, emptied of its own rat first.
const ROOM = 'nyc-sub-2av-passage'
const clearRoom = () => page.evaluate(() => window.zsq.world.debugClearEnemies())

// ------------------------------------------------------------ the knife
await arm('woodenSword')
await page.evaluate((r) => window.zsq.world.teleport(r, 6, 5), ROOM)
await clearRoom()
await wait(600)
let s = await world()
check('the wooden sword is a knife in the city', s.weapon === 'knife')
await page.keyboard.press('z')
await wait(60)
s = await world()
check('and it swings rather than shoots', s.shots === 0 && s.sword !== undefined)
await shot('knife')

// ------------------------------------------------------------ the hammer
await arm('metalSword')
await page.evaluate((r) => window.zsq.world.teleport(r, 6, 5), ROOM)
await clearRoom()
await wait(600)
check('the metal sword is a box hammer', (await world()).weapon === 'hammer')
// A rat right beside him.
await page.evaluate(() => { window.zsq.world.debugSpawn?.('chaser', 8, 5) })
await page.keyboard.press('z')
let shook = false
let stunned = false
for (let i = 0; i < 20; i++) {
  s = await world()
  if (s.shake > 0) shook = true
  if (s.stunned > 0) stunned = true
  await wait(30)
}
// And once more for the photograph.
await wait(400)
await page.keyboard.press('z')
await wait(60)
await shot('hammer')
check('the hammer shakes the street when it lands', shook)
check('and stuns the rat beside it', stunned)

// ------------------------------------------------------------ the pistol
await arm('bronzeSword')
await page.evaluate((r) => window.zsq.world.teleport(r, 4, 5), ROOM)
await clearRoom()
await wait(600)
check('the bronze sword is a pistol', (await world()).weapon === 'pistol')
await walk('ArrowRight', 70)
await wait(50)
await page.keyboard.press('z')
await wait(40)
s = await world()
check('the pistol fires a bullet', s.shots === 1)
check('and the magazine counts down', s.magazine?.rounds === 5)
await shot('pistol')
const hudText = await page.evaluate(() => window.zsq.world.debugState().weapon)
check('and the HUD calls it a pistol', hudText === 'pistol')
// Five more, waiting out the trigger between each.
for (let i = 0; i < 5; i++) { await wait(260); await page.keyboard.press('z') }
await wait(60)
s = await world()
check('six shots empty it and start the reload', s.magazine?.rounds === 0 && s.magazine?.reload > 0)
await page.keyboard.press('z')
await wait(40)
const during = await world()
check('nothing fires while it reloads', during.magazine?.reload > 0 && during.magazine?.rounds === 0)
await wait(1300)
s = await world()
check('and after a moment it is full again', s.magazine?.rounds === 6 && s.magazine?.reload === 0)
// Short reach: a bullet from the left wall never reaches the right wall.
await page.evaluate((r) => window.zsq.world.teleport(r, 3, 5), ROOM)
await clearRoom()
await wait(600)
await walk('ArrowRight', 70)
await page.keyboard.press('z')
await wait(200)
let farthest = 0
for (let i = 0; i < 12; i++) {
  s = await world()
  if (s.shots > 0) farthest = i
  await wait(50)
}
check('a pistol bullet drops after a few tiles', farthest < 8)

// ------------------------------------------------------------ the rifle
await arm('goldenSword')
await page.evaluate((r) => window.zsq.world.teleport(r, 3, 5), ROOM)
await clearRoom()
await wait(600)
check('the golden sword is a rifle', (await world()).weapon === 'rifle')
await walk('ArrowRight', 70)
await page.keyboard.press('z')
await wait(40)
s = await world()
check('the rifle fires', s.shots === 1 && s.magazine?.rounds === 2)
await shot('rifle')
// A slower hand: the rifle wants nearly half a second between shots.
await wait(450)
await page.keyboard.press('z')
await wait(450)
await page.keyboard.press('z')
await wait(300)
s = await world()
check('three shots empty the rifle', s.magazine?.rounds === 0 && s.magazine?.reload > 0)

// ------------------------------------------------------------ a bullet kills
await page.evaluate((r) => window.zsq.world.teleport(r, 4, 5), ROOM)
await clearRoom()
await wait(1700)
await page.evaluate(() => { window.zsq.world.debugSpawn?.('chaser', 9, 5) })
const before = (await world()).enemies
await walk('ArrowRight', 70)
for (let i = 0; i < 3; i++) { await page.keyboard.press('z'); await wait(450) }
await wait(300)
check('a rat down the corridor is shot', (await world()).enemies < before)

// ------------------------------------------------------------ the machine gun
await arm('woodenSword')
await page.evaluate((r) => {
  window.zsq.state.inventory.bow = 1
  window.zsq.state.inventory.arrows = 7
  window.zsq.state.player.equippedTool = 'bow'
  window.zsq.world.teleport(r, 4, 5)
  window.zsq.world.debugClearEnemies()
}, ROOM)
await wait(200)
await walk('ArrowRight', 70)
await page.keyboard.press('x')
await wait(40)
s = await world()
check('the machine gun fires three bullets a press', s.shots === 3)
check('and eats three bullets', s.arrows === 4)
await shot('machine-gun')
await wait(300)
await page.keyboard.press('x')
await wait(40)
await page.keyboard.press('x')
await wait(40)
s = await world()
check('with one left it fires one', s.arrows === 0)
await page.keyboard.press('x')
await wait(40)
check('with none left, nothing', (await world()).arrows === 0)

console.log(JSON.stringify({ failures, errors }, null, 2))
for (const f of failures) console.log('  FAILED:', f)
await browser.close()
process.exit(failures.length || errors.length ? 1 : 0)
