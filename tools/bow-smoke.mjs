/**
 * The bow, and the blaster it becomes.
 *
 * It was bought, it was paid for, and it did nothing: the bow was never in
 * the item slot, so C walked straight past it and X had no idea what it was.
 * This is the check that would have caught that — and it is deliberately run
 * with no sword in the pack, so anything that loses health on these screens
 * can only have been shot.
 *
 * What matters: he can reach it by pressing C, it fires the way he is facing,
 * it costs an arrow, it hurts what it hits, rock stops it, only one is ever
 * in the air, and running out says so rather than doing nothing.
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
const inventory = () => page.evaluate(() => ({ ...window.zsq.state.inventory }))
const goTo = async (id, col, row) => {
  await page.evaluate(([s, c, r]) => window.zsq.goTo(s, c, r), [id, col, row])
  await page.waitForTimeout(350)
}
const face = async (key) => {
  await page.keyboard.down(key)
  await page.waitForTimeout(70)
  await page.keyboard.up(key)
}
/** Cycles the B slot until the named item is in hand, or gives up. */
const hold = async (id) => {
  for (let i = 0; i < 10; i++) {
    if ((await page.evaluate(() => window.zsq.world.selectedTool())) === id) return true
    await page.keyboard.press('c')
    await page.waitForTimeout(110)
  }
  return (await page.evaluate(() => window.zsq.world.selectedTool())) === id
}

await page.goto(BASE, { waitUntil: 'networkidle' })
await page.evaluate(() => localStorage.removeItem('zsq.save'))
await page.reload({ waitUntil: 'networkidle' })
await page.getByRole('button', { name: /begin|continue/i }).click()
await page.waitForSelector('.game-canvas')
await page.waitForTimeout(300)

// Bought and paid for — and nothing else. No sword, so every point of damage
// below has to have come out of the bow.
await page.evaluate(() => {
  window.zsq.state.inventory.bow = 1
  window.zsq.state.inventory.arrows = 12
  for (let i = 0; i < 6; i++) window.zsq.world.grantHeartContainer()
})

// ------------------------------------------------------- he can reach it
check('pressing C reaches the bow', await hold('bow'))
const label = await page.evaluate(() => {
  const w = window.zsq.world.debugState()
  return w
})
check('and the slot counts arrows rather than bows', label.arrows === 12)

// ------------------------------------------------------------- it fires
await goTo('village-east', 4, 6)
await face('ArrowRight')
await page.keyboard.press('x')
await page.waitForTimeout(90)
check('the item key looses an arrow', (await world()).shots === 1)
check('and it costs one', (await inventory()).arrows === 11)

// A second press changes nothing while the first is still in the air.
await page.keyboard.press('x')
await page.waitForTimeout(60)
check('only one arrow is ever in the air', (await world()).shots === 1)
check('and the second press costs nothing', (await inventory()).arrows === 11)
await page.waitForTimeout(1800)
check('it does not hang there forever', (await world()).shots === 0)

// ----------------------------------------------------------- it hurts them
// Arriving on a screen puts its robots back where they spawn, so the line-up
// is read *after* the arrival, never before it.
let damaged = false
for (let attempt = 0; attempt < 8 && !damaged; attempt++) {
  await goTo('village-east', 4, 6)
  const before = await world()
  const target = before.monsters?.[0]
  if (!target) break
  // Stand on its row, a few tiles to its left, and loose one down the line.
  await page.evaluate(
    ([c, r]) => window.zsq.world.teleport('village-east', c, r),
    [Math.max(1, Math.round(target.x / 16) - 4), Math.round(target.y / 16)],
  )
  await page.waitForTimeout(200)
  const aimed = await world()
  const mark = aimed.monsters?.[0]
  if (!mark) break
  const totalBefore = aimed.monsters.reduce((sum, m) => sum + m.hp, 0)
  const count = aimed.monsters.length
  await face('ArrowRight')
  await page.keyboard.press('x')
  await page.waitForTimeout(800)
  const after = await world()
  const totalAfter = (after.monsters ?? []).reduce((sum, m) => sum + m.hp, 0)
  if (after.monsters.length < count || totalAfter < totalBefore) damaged = true
}
check('an arrow takes health off what it hits', damaged)

// --------------------------------------------------------- rock stops it
// Fired point-blank into the rocks in the middle of this screen. An arrow
// crossing open ground is still in the air a quarter of a second later.
await page.evaluate(() => { window.zsq.state.inventory.arrows = 6 })
await goTo('village-east', 7, 4)
await face('ArrowUp')
await page.keyboard.press('x')
await page.waitForTimeout(260)
const intoRock = (await world()).shots
await goTo('village-east', 4, 9)
await face('ArrowRight')
await page.keyboard.press('x')
await page.waitForTimeout(260)
const intoTheOpen = (await world()).shots
check('rock stops an arrow', intoRock === 0)
check('while open ground does not', intoTheOpen === 1)

// ------------------------------------------------------- running out says so
await page.evaluate(() => { window.zsq.state.inventory.arrows = 0 })
await page.waitForTimeout(1600)
await page.keyboard.press('x')
await page.waitForTimeout(200)
const dry = await world()
check('with none left, nothing is fired', dry.shots === 0)
check('and it says why', /no arrows/i.test(dry.message ?? ''))
check('and the bow is still in his hand', (await page.evaluate(() => window.zsq.world.selectedTool())) === 'bow')

// --------------------------------------------------------- and in the future
await page.evaluate(() => window.zsq.enterLevel(2))
await page.waitForTimeout(600)
await page.evaluate(() => {
  window.zsq.state.inventory.bow = 1
  window.zsq.state.inventory.arrows = 9
})
check('the blaster is reachable on the ship', await hold('bow'))
await goTo('ship-corridor-1', 4, 6)
await face('ArrowRight')
await page.keyboard.press('x')
await page.waitForTimeout(90)
const fired = await world()
check('and it fires a bolt', fired.shots === 1)
check('which costs a power cell', (await inventory()).arrows === 8)
const dryShip = await page.evaluate(async () => {
  window.zsq.state.inventory.arrows = 0
  await new Promise((r) => setTimeout(r, 1600))
  window.dispatchEvent(new KeyboardEvent('keydown', { key: 'x' }))
  window.dispatchEvent(new KeyboardEvent('keyup', { key: 'x' }))
  await new Promise((r) => setTimeout(r, 200))
  return window.zsq.world.debugState().message
})
check('and out of cells it says so in the ship\'s words', /power cells/i.test(dryShip ?? ''))

console.log(JSON.stringify({ failures, errors }, null, 2))
for (const f of failures) console.log('  FAILED:', f)
await browser.close()
process.exit(failures.length || errors.length ? 1 : 0)
