/**
 * The teleporter behind the plate, and the quiet square it leads to.
 *
 * The whole point of the place is that nothing in it can go wrong, so this
 * checks the ways it could: that the pad stays hidden until the plate is
 * blown, that stepping on it plays the dissolve rather than cutting, that he
 * arrives in the old world with the ship's pack still on his back, that the
 * square has no way out but the pad, and that the pad sends him home.
 */
import { chromium } from 'playwright'

const BASE = process.env.BASE ?? 'http://localhost:5199/'
const browser = await chromium.launch({
  executablePath: process.env.CHROME ?? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
})
const page = await browser.newPage({ viewport: { width: 1000, height: 900 } })
const errors = []
page.on('pageerror', (e) => errors.push(String(e)))

const failures = []
const check = (name, ok) => { if (!ok) failures.push(name) }
const world = () => page.evaluate(() => window.zsq.world.debugState())
const wait = (ms) => page.waitForTimeout(ms)
const goTo = async (id, col, row) => {
  await page.evaluate(([s, c, r]) => window.zsq.goTo(s, c, r), [id, col, row])
  await wait(400)
}
/** Walks him hard into a direction, the way a child leaning on a key does. */
const press = async (key, ms) => {
  await page.keyboard.down(key)
  await wait(ms)
  await page.keyboard.up(key)
}

await page.goto(BASE, { waitUntil: 'networkidle' })
await page.evaluate(() => localStorage.removeItem('zsq.save'))
await page.reload({ waitUntil: 'networkidle' })
await page.getByRole('button', { name: /begin|continue/i }).click()
await page.waitForSelector('.game-canvas')
await wait(300)
await page.evaluate(() => window.zsq.enterLevel(2))
await wait(600)

// -------------------------------------------- the engineer tells him to look
await goTo('ship-lab-1', 4, 7)
const hint = await page.evaluate(() => {
  const s = window.zsq.world.debugState()
  const screen = window.zsq.world.currentScreen?.() ?? null
  return { screen: s.screen, talk: screen ? (screen.props ?? []).map((p) => p.talk).join(' ') : '' }
})
check('the hint lives one screen below the plate', hint.screen === 'ship-lab-1')
check('and it says where to look', /lab above|back wall|cracked/i.test(hint.talk))

// ------------------------------------------ the pad is not there until it is
await goTo('ship-lab-2', 11, 3)
const sealed = await world()
check('the plate starts unbroken', !(sealed.brokenHere ?? []).includes('11,1'))
check('and he cannot walk through it', sealed.screen === 'ship-lab-2')

// Blow it open, holding the key so he is right up against the plate.
await page.evaluate(() => { window.zsq.state.inventory.bomb = 5 })
for (let i = 0; i < 12; i++) {
  if ((await page.evaluate(() => window.zsq.world.selectedTool())) === 'bomb') break
  await page.keyboard.press('c')
  await wait(110)
}
check('the charge is in his hand', (await page.evaluate(() => window.zsq.world.selectedTool())) === 'bomb')
await press('ArrowUp', 400)
await page.keyboard.press('x')
// The fuse is a hundred frames — a second and two thirds — so a shorter wait
// here reports a plate that opened perfectly well as unbroken.
await wait(2400)
check('the charge opens the plate', ((await world()).brokenHere ?? []).includes('11,1'))

// ----------------------------------------------------- and it takes him away
await goTo('ship-lab-2', 11, 3)
const packBefore = await page.evaluate(() => ({ ...window.zsq.state.inventory }))
await press('ArrowUp', 500)
const mid = await world()
check('stepping on the pad starts the dissolve rather than cutting', mid.beaming === true)
check('and he is still on the ship while it runs', mid.screen === 'ship-lab-2')

await wait(2400)
const arrived = await world()
check('it puts him down in the old world', arrived.screen === 'haven-square')
check('and the dissolve is over', arrived.beaming === false)

// ------------------------------------------------------------- the square
check('there is nothing in here that can hurt him', arrived.enemies === 0)
check('five hearts are laid out', (arrived.drops ?? 0) >= 5)
check('and it is still Level 2 underneath', arrived.level === 2)
const packAfter = await page.evaluate(() => ({ ...window.zsq.state.inventory }))
check('the ship pack came with him', packAfter.bomb === packBefore.bomb)

// The rabbit crosses the grass on its own.
const bunnyStart = arrived.greeter
await wait(1800)
const bunnyNow = (await world()).greeter
check(
  'the old rabbit comes over to him',
  Boolean(bunnyStart && bunnyNow && Math.hypot(bunnyNow.x - bunnyStart.x, bunnyNow.y - bunnyStart.y) > 8),
)

// Leaning on every key must leave him exactly where he is.
for (const key of ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight']) await press(key, 900)
const stillHere = await world()
check('there is no way to walk out of the square', stillHere.screen === 'haven-square')

// And the hearts can be picked up, because a sanctuary that does not heal is
// not a sanctuary.
await page.evaluate(() => { window.zsq.world.debugHurt?.(4) })
const hurt = await world()
await goTo('haven-square', 5, 4)
await press('ArrowUp', 700)
await wait(300)
const healed = await world()
check('the hearts on the grass heal him', healed.hearts > hurt.hearts)

// ------------------------------------------------------------ and home again
await goTo('haven-square', 13, 3)
await press('ArrowUp', 500)
await wait(2600)
const home = await world()
check('the pad in the corner sends him back to the ship', home.screen === 'ship-lab-2')
check('and he arrives standing, not mid-dissolve', home.beaming === false)

console.log(JSON.stringify({ failures, errors }, null, 2))
for (const f of failures) console.log('  FAILED:', f)
await browser.close()
process.exit(failures.length || errors.length ? 1 : 0)
