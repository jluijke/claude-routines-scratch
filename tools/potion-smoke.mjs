/**
 * The two vanishing potions.
 *
 * Each sits inside a tree, with only the neck of the bottle showing. The candle
 * burns the tree away; drinking what is inside makes him unseeable for three
 * places — above ground and below it — and while it holds, monsters and the
 * things they fire go straight through him.
 *
 * The ones that matter: he must not be able to reach a potion without burning
 * for it, the bottle must not be sitting in plain sight beforehand, and — the
 * whole point — nothing may take a heart off him while it lasts.
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
const goTo = async (id, col, row) => {
  await page.evaluate(([s, c, r]) => window.zsq.goTo(s, c, r), [id, col, row])
  await page.waitForTimeout(400)
}

await page.goto(BASE, { waitUntil: 'networkidle' })
await page.evaluate(() => localStorage.removeItem('zsq.save'))
await page.reload({ waitUntil: 'networkidle' })
await page.getByRole('button', { name: /begin|continue/i }).click()
await page.waitForSelector('.game-canvas')
await page.waitForTimeout(400)

/** Where the two of them are, asked of the world rather than written down. */
const homes = await page.evaluate(async () => {
  const { SCREENS } = await import('/src/game/world/screens.ts')
  return SCREENS.filter((s) => s.pickup?.item === 'potion').map((s) => ({
    screen: s.id,
    id: s.pickup.id,
    region: s.region,
    col: s.pickup.col,
    row: s.pickup.row,
    char: s.rows[s.pickup.row][s.pickup.col],
  }))
})
check('there are two potions in the world', homes.length === 2)
check('each is inside a tree that burns', homes.every((h) => h.char === 'p'))
check('and they are not on the same screen', homes[0]?.screen !== homes[1]?.screen)
check('nor in the same region, so finding one is no help with the other',
  homes[0]?.region !== homes[1]?.region)

// --------------------------------------------------------- sealed until burned
for (const home of homes) {
  await goTo(home.screen, 7, 6)
  const solid = await page.evaluate(
    ([c, r]) => window.zsq.world.debugSolidAt(c, r),
    [home.col, home.row],
  )
  check(`the tree on ${home.screen} cannot be walked through`, solid === true)
}

// The bottle must not be drawn on top of the tree it is hidden in — the whole
// point is that it takes looking for.
const before = await page.evaluate(() => window.zsq.world.debugPickupShown())
check('and the bottle is not sitting in plain sight', before === false)

// ------------------------------------------------------------------ burning it
const home = homes[0]
await page.evaluate(() => {
  window.zsq.state.inventory.blueCandle = 1
  window.zsq.state.inventory.woodenSword = 1
  for (let i = 0; i < 12; i++) window.zsq.world.grantHeartContainer()
  window.zsq.world.equipBest()
})

// Standing right against the tree, with the bottle one tile away through solid
// wood. Collecting used to be pure overlap, so this took the potion straight
// through the tree and the whole hiding place cost nothing.
await goTo(home.screen, home.col, home.row + 1)
await page.waitForTimeout(1200)
check('standing against the tree does not take the bottle through it',
  (await page.evaluate((id) => window.zsq.state.world.takenChests.includes(id), home.id)) === false)
check('and nothing has been drunk', (await page.evaluate(() => window.zsq.state.world.invisibleScreens)) === 0)
check('and no sign has gone up', !(await page.$('.found-panel')))

// Back to the foot of the tree before lighting anything: this screen has
// monsters on it, and one shoving him a tile sideways during the wait above
// meant the flame went past the tree entirely.
await page.evaluate(([s, c, r]) => window.zsq.world.teleport(s, c, r), [home.screen, home.col, home.row + 1])
await page.waitForTimeout(250)

// Face the tree, hold the candle, and light it.
await page.keyboard.down('ArrowUp'); await page.waitForTimeout(90); await page.keyboard.up('ArrowUp')
let tool = await page.evaluate(() => window.zsq.world.selectedTool())
for (let i = 0; i < 8 && tool !== 'blueCandle'; i++) {
  await page.keyboard.press('c')
  await page.waitForTimeout(120)
  tool = await page.evaluate(() => window.zsq.world.selectedTool())
}
check('the candle can be held', tool === 'blueCandle')
await page.keyboard.press('x')
await page.waitForTimeout(500)
check('the flame says a tree burned, not a bush', /tree burns away|found/i.test((await world()).message ?? '') || Boolean(await page.$('.found-panel')))
check('and the tree is gone for good',
  (await page.evaluate(([c, r]) => window.zsq.world.debugSolidAt(c, r), [home.col, home.row])) === false)

// Onto the ash. He may already be standing on it the moment the tree goes, so
// the nudges stop as soon as the sign is coming — and it is waited for rather
// than counted, because he holds the bottle up for a good two seconds first.
for (let i = 0; i < 12 && !(await page.$('.found-panel')); i++) {
  await page.keyboard.down('ArrowUp'); await page.waitForTimeout(120); await page.keyboard.up('ArrowUp')
}
await page.waitForSelector('.found-panel', { timeout: 8000 }).catch(() => {})
check('walking into the ash finds the potion', Boolean(await page.$('.found-panel')))
await page.getByRole('button', { name: /take it/i }).first().click({ timeout: 8000 }).catch(() => {})
await page.waitForTimeout(400)
check('drinking it makes him unseeable for three places',
  (await page.evaluate(() => window.zsq.state.world.invisibleScreens)) === 3)

// ------------------------------------------------------- nothing can touch him
// A room with monsters in it, and he stands in the middle of them.
await goTo('forest-2', 7, 3)
await page.waitForTimeout(200)
const monsters = (await world()).monsters ?? []
check('there are monsters to walk through', monsters.length > 0)
if (monsters[0]) {
  await page.evaluate(
    (m) => window.zsq.world.teleport('forest-2', Math.round(m.x / 16), Math.round(m.y / 16)),
    monsters[0],
  )
}
const startHearts = (await world()).hearts
await page.waitForTimeout(4000)
const afterHearts = (await world()).hearts
check('standing inside a monster costs nothing at all', afterHearts === startHearts)

// Their shots, too. A shooter's room, stood right in front of it.
const shots = await page.evaluate(() => new Promise((resolve) => {
  let passed = 0
  let ticks = 0
  const timer = setInterval(() => {
    const s = window.zsq.world.debugState()
    passed = Math.max(passed, s.projectiles ?? 0)
    if (++ticks > 240) { clearInterval(timer); resolve({ passed, hearts: s.hearts }) }
  }, 16)
}))
check('their shots fly on through him', shots.hearts === startHearts)

// ------------------------------------------------------------- three places
check('one place used so far', (await world()).invisibleScreens === 2)
await goTo('forest-1', 7, 6)
check('two', (await world()).invisibleScreens === 1)
// Underground counts as one of the three, which is the point of saying so.
await goTo('hollow-cave', 7, 8)
const under = await world()
check('and going underground spends the third', under.invisibleScreens === 0)
check('and it says so when it wears off', /wears off/i.test(under.message ?? ''))

// And now he is solid again.
await goTo('forest-2', 7, 3)
await page.waitForTimeout(200)
const back = (await world()).monsters ?? []
if (back[0]) {
  await page.evaluate(
    (m) => window.zsq.world.teleport('forest-2', Math.round(m.x / 16), Math.round(m.y / 16)),
    back[0],
  )
}
const solidHearts = (await world()).hearts
await page.waitForTimeout(2500)
check('once it has worn off, monsters hurt him again', (await world()).hearts < solidHearts)

// --------------------------------------------------------------- the second one
// Taken once and only once: a burned tree stays burned and a drunk potion stays
// drunk, so a second visit is not a second potion.
await goTo(home.screen, 7, 6)
check('the first tree stays burned', (await page.evaluate(([c, r]) => window.zsq.world.debugSolidAt(c, r), [home.col, home.row])) === false)
await page.evaluate(() => { window.zsq.state.world.invisibleScreens = 0 })
await goTo(home.screen, home.col, home.row)
await page.waitForTimeout(400)
check('and drinking it again is not possible',
  (await page.evaluate(() => window.zsq.state.world.invisibleScreens)) === 0)

console.log(JSON.stringify({ homes, failures, errors }, null, 2))
for (const f of failures) console.log('  FAILED:', f)
await browser.close()
process.exit(failures.length || errors.length ? 1 : 0)
