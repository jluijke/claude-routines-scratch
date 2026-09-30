/**
 * Level 3, the districts: Midtown, the museum, Chinatown, the harbour, the roof.
 *
 * The lift goes up and Trump is at the top. The T-Rex statue comes alive and
 * comes after him; the falcon leaves its perch and crosses the room; the
 * vault pays. The cabinet in Wu's kitchen shifts for a firecracker and Xi is
 * behind it. The binoculars show her in the crown; the ferry refuses him
 * without a ticket and takes him with one; walking up to her ends the quest.
 * The fire escape goes up to a roof with a rifle on it, and the rifle, at
 * the tripod, is a round of rats and squirrels. Screenshots to the scratchpad.
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
const shot = (name) => page.locator('.game-canvas').screenshot({ path: `${OUT}/district-${name}.png` })
// A teleport skips the arrival that clears the rats from round him, so the
// checks clear them themselves: what is being checked is the doors, not the rats.
const go = (screen, col, row) => page.evaluate(([s, c, r]) => { window.zsq.world.teleport(s, c, r); window.zsq.world.debugClearEnemies() }, [screen, col, row])
const settled = async () => { for (let i = 0; i < 80 && (await world()).ferrying; i++) await wait(100) }
const dismiss = async () => {
  for (let i = 0; i < 6; i++) {
    const b = page.getByRole('button', { name: /next|onward|→|continue|back to|finish|ferry|city/i })
    if (!(await b.count())) break
    await b.first().click()
    await wait(250)
  }
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
})

// ------------------------------------------------------------ the tower
await go('nyc-trump-green', 14, 4)
await wait(400)
await walk('ArrowRight', 500)
await wait(300)
let s = await world()
check('the green opens east onto Fifth Avenue', s.screen === 'nyc-fifth-ave-midtown')
await go('nyc-fifth-ave-midtown', 10, 7)
await wait(300)
await walk('ArrowDown', 300)
await wait(200)
s = await world()
check('the doorman stands in the way of the front door', s.screen === 'nyc-fifth-ave-midtown' && /service door/i.test((await page.evaluate(() => window.zsq.world.talkingProp())) ?? ''))
await go('nyc-56th-street', 12, 6)
await wait(300)
await walk('ArrowDown', 350)
await wait(400)
s = await world()
check('the service door on 56th is the way into the lobby', s.screen === 'nyc-trump-lobby')
await go('nyc-trump-lobby', 7, 2)
await wait(200)
await walk('ArrowUp', 250)
await wait(200)
s = await world()
check('stepping into the lift starts the ride', s.lifting !== undefined && s.lifting.to === 'nyc-trump-penthouse')
await wait(1200)
await shot('lift')
for (let i = 0; i < 40 && (await world()).lifting; i++) await wait(100)
s = await world()
check('and the doors open on the penthouse', s.screen === 'nyc-trump-penthouse')
check('where Trump is', s.guardians?.some((g) => g.kind === 'boss1'))
await shot('penthouse')

// ------------------------------------------------------------ the museum
await page.evaluate(() => window.zsq.world.teleport('nyc-museum-dinosaurs', 1, 4))
await wait(300)
s = await world()
check('the T-Rex is a statue to begin with', s.enemies === 0 && s.awake.length === 0)
await shot('trex-statue')
for (let i = 0; i < 60 && (await world()).awake.length === 0; i++) await wait(100)
s = await world()
check('and after a moment it is not', s.awake.length === 1 && s.enemies === 1)
await wait(300)
await shot('trex-awake')
const before = (await world()).enemyCentres?.[0]
await wait(1200)
const after = (await world()).enemyCentres?.[0]
check('and it comes after him', before && after && after.x < before.x - 10)
// Leaving and coming back, it is a statue again.
await go('nyc-museum-hall', 14, 4)
await wait(200)
await page.evaluate(() => window.zsq.world.teleport('nyc-museum-dinosaurs', 1, 4))
await wait(200)
check('leave and come back and it is stone again', (await world()).enemies === 0)

await page.evaluate(() => window.zsq.world.teleport('nyc-museum-birds', 2, 6))
await wait(300)
for (let i = 0; i < 50 && (await world()).awake.length === 0; i++) await wait(100)
s = await world()
check('the falcon wakes on its perch', s.awake.length === 1 && s.enemies === 1)
let crossed = false
let lowLeft = false
for (let i = 0; i < 40; i++) {
  await wait(50)
  const c = (await world()).enemyCentres?.[0]
  if (c && c.x < 120 && c.y > 90) lowLeft = true
  if (lowLeft && c && c.x > 180 && c.y < 60) crossed = true
}
check('and dives down and to the left, then goes back', lowLeft && crossed)
await shot('falcon')

await go('nyc-museum-vault', 9, 3)
await wait(300)
const purse = await page.evaluate(() => window.zsq.state.player.rupees)
await walk('ArrowRight', 350)
await wait(300)
check('the vault has a chest that pays', (await page.evaluate(() => window.zsq.state.player.rupees)) > purse)
await shot('vault')

// ------------------------------------------------------------ Chinatown
await page.evaluate(() => {
  window.zsq.state.inventory.bomb = 3
  window.zsq.state.player.equippedTool = 'bomb'
  window.zsq.world.teleport('nyc-restaurant-kitchen', 13, 7)
})
await wait(300)
await walk('ArrowRight', 300)
await wait(200)
check('the cabinet does not move for a shove', (await world()).screen === 'nyc-restaurant-kitchen')
await walk('ArrowRight', 40)
await page.keyboard.press('x')
await wait(2600)
s = await world()
check('a firecracker blows the wall behind the cabinet', s.brokenHere?.length > 0)
await shot('cabinet-blown')
await go('nyc-restaurant-kitchen', 13, 7)
await wait(200)
await walk('ArrowRight', 400)
await wait(400)
s = await world()
check('and behind it is the back room, and Xi', s.screen === 'nyc-xi-backroom' && s.guardians?.some((g) => g.kind === 'boss3'))
await shot('backroom')

// ------------------------------------------------------------ the harbour
await go('nyc-battery-park', 7, 3)
await wait(300)
await page.keyboard.press('x')
await wait(300)
s = await world()
check('the binoculars show the statue', s.viewing === 'liberty')
await shot('binoculars')
await page.keyboard.press('x')
await wait(200)
check('and any key puts them down', (await world()).viewing === undefined)

await go('nyc-battery-park', 14, 5)
await wait(300)
await walk('ArrowDown', 500)
await wait(300)
s = await world()
check('the ferry will not take him without a ticket', s.screen === 'nyc-battery-park' && !s.ferrying)
const refused = await page.evaluate(() => window.zsq.world.debugState().message ?? '')
check('and says so', /ticket/i.test(refused))

// The ticket comes from the last guardian: two are already loved, the third falls now.
await page.evaluate(() => {
  window.zsq.state.world.defeatedBosses.push('nyc-trump-penthouse', 'nyc-boardwalk')
  window.zsq.state.inventory.loveBomb = 40
  window.zsq.state.player.equippedTool = 'loveBomb'
  window.zsq.world.teleport('nyc-xi-backroom', 7, 8)
})
await wait(600)
check('no ticket yet', (await world()).ticket === 0)
await walk('ArrowUp', 40)
await wait(100)
// Standing still and throwing, he would be bitten to death before the
// twentieth bomb; the check is about the ticket, so he is kept whole.
for (let i = 0; i < 120; i++) {
  const g = (await world()).guardians?.[0]
  if (!g) break
  await page.evaluate(() => window.zsq.world.heal(15))
  await page.keyboard.press('x')
  await wait(420)
}
await wait(2500)
await wait(600)
s = await world()
check('the last guardian loved gives him the ticket', s.ticket === 1)
await shot('ticket-story')
await dismiss()
await wait(300)

await go('nyc-battery-park', 14, 5)
await wait(300)
await walk('ArrowDown', 500)
await wait(300)
s = await world()
check('with the ticket, the ferry takes him', s.ferrying === true)
await wait(1200)
await shot('ferry')
for (let i = 0; i < 60 && (await world()).ferrying; i++) await wait(100)
s = await world()
check('to the island', s.screen === 'nyc-liberty-island')
await settled()
await shot('island')
await go('nyc-liberty-island', 8, 4)
await wait(200)
await walk('ArrowUp', 300)
await wait(400)
s = await world()
check('the door in the base goes up to the crown', s.screen === 'nyc-liberty-crown')
await walk('ArrowUp', 1500)
await wait(600)
s = await world()
check('and walking up to her saves her', s.princessSaved === true)
check('and the finale begins: the room dark, and fireworks', s.finale !== undefined)
check('and no story yet — the fireworks come first', (await page.locator('.story-panel').count()) === 0)
await wait(2200)
s = await world()
check('rockets have burst over the crown', (s.finale?.bursts ?? 0) >= 2 && (s.finale?.sparks ?? 0) > 0)
await shot('finale')
// Four seconds in, a key moves it on.
await wait(2000)
await page.keyboard.press('z')
await wait(500)
check('and then the story of it', (await page.locator('.story-panel').count()) === 1)
await shot('princess')
await dismiss()
await wait(300)
check('and the fireworks carry on after the story', ((await world()).skyShow?.bursts ?? 0) >= 1)
await wait(300)
await go('nyc-liberty-island', 1, 6)
await wait(200)
await walk('ArrowLeft', 400)
await wait(300)
check('the ferry back needs no ticket', (await world()).ferrying === true)
await settled()

// ------------------------------------------------------------ the roof
await page.evaluate(() => { delete window.zsq.state.inventory.sniperRifle })
await go('nyc-avenue-a', 6, 8)
await wait(300)
await walk('ArrowLeft', 300)
await wait(400)
s = await world()
check('the fire escape on Avenue A goes up to the roof', s.screen === 'nyc-rooftop-a')
await go('nyc-rooftop-a', 7, 2)
await wait(200)
await page.keyboard.press('x')
await wait(300)
check('without the rifle, the tripod is only a view', (await world()).sniper === undefined)
await go('nyc-rooftop-a', 3, 6)
await wait(200)
await walk('ArrowUp', 500)
await wait(1500)
check('the rifle is on the roof', (await page.evaluate(() => window.zsq.state.inventory.sniperRifle ?? 0)) === 1)
await page.getByRole('button', { name: /ok|got it|continue|onward|→/i }).first().click().catch(() => {})
await wait(300)
await go('nyc-rooftop-a', 7, 2)
await wait(200)
await page.keyboard.press('x')
await wait(300)
s = await world()
check('at the tripod, the round begins', s.sniper !== undefined && !s.sniper.done)
await wait(2500)
await shot('scope')
// Shoot the first rat that shows itself, with a click.
let hitRat = false
for (let i = 0; i < 80 && !hitRat; i++) {
  const st = (await world()).sniper
  if (!st) break
  const rat = st.critters.find((c) => c.kind === 'rat' && !c.shot)
  if (rat) {
    const box = await page.locator('.game-canvas').boundingBox()
    const scale = box.width / 256
    await page.mouse.click(box.x + rat.x * scale, box.y + (rat.y + 40) * scale)
    await wait(120)
    if ((await world()).sniper?.rats > 0) hitRat = true
  }
  await wait(100)
}
check('a rat can be shot', hitRat)
s = await world()
check('and it pays thirty', s.sniper?.earned === 30)
await page.keyboard.press('Escape')
await wait(400)
s = await world()
check('escape ends the round', s.sniper?.done === true)
const paid = await page.evaluate(() => window.zsq.state.player.rupees)
check('and the money is in the pocket', paid >= 30)

// ------------------------------------------------------------ the parent's button
await go('nyc-washington-square', 7, 6)
await wait(300)
await page.keyboard.press('Control+Shift+P')
await wait(500)
const rooftop = page.getByRole('button', { name: /rooftop/i })
check('the parent dashboard offers the rooftop', (await rooftop.count()) === 1)
await rooftop.first().click()
await wait(600)
s = await world()
check('and one click puts him on the roof with the rifle, mid-round', s.screen === 'nyc-rooftop-a' && s.sniper !== undefined && !s.sniper.done)
await page.keyboard.press('Escape')
await wait(300)

console.log(JSON.stringify({ failures, errors }, null, 2))
for (const f of failures) console.log('  FAILED:', f)
await browser.close()
process.exit(failures.length || errors.length ? 1 : 0)
