/**
 * The Wings crossing.
 *
 * The point of the animation is that it is only an animation: the wings are
 * spent, the screen loaded and the hero placed before a single frame of it is
 * drawn. So the two things worth checking are that it looks like flying at all,
 * and that a tab closed in mid-air still comes back to a consistent game —
 * which is the failure mode an animation like this invites.
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
const wings = () => page.evaluate(() => window.zsq.state.inventory.wings ?? 0)

async function newGameWithWings() {
  await page.evaluate(() => localStorage.removeItem('zsq.save'))
  await page.reload({ waitUntil: 'networkidle' })
  await page.getByRole('button', { name: /begin|continue/i }).click()
  await page.waitForSelector('.game-canvas')
  await page.waitForTimeout(300)
  // Straight from the parent's testing kit, rather than playing to 300 rupees.
  await page.keyboard.press('Meta+Shift+P')
  await page.waitForSelector('.dashboard')
  await page.selectOption('.kit-select', 'wings')
  await page.getByRole('button', { name: /give it to him/i }).click()
  await page.getByRole('button', { name: /^close$/i }).click()
  await page.waitForTimeout(300)
}

/** Walk onto the shore's flight portal at col 5, row 5. */
async function stepOntoTheWater() {
  await page.evaluate(() => window.zsq.goTo('lagoon-shore', 7, 5))
  await page.waitForTimeout(350)
  for (let i = 0; i < 30; i++) {
    if ((await world()).flying) return true
    await page.keyboard.down('ArrowLeft')
    await page.waitForTimeout(90)
    await page.keyboard.up('ArrowLeft')
  }
  return false
}

await page.goto(BASE, { waitUntil: 'networkidle' })
await newGameWithWings()
check('the testing kit hands over the Wings', (await wings()) > 0)

// ------------------------------------------------------------ it really flies
const took = await stepOntoTheWater()
check('stepping into the water starts a flight', took)

const midAir = await world()
check('he is over the island, not the shore', midAir.screen === 'lagoon-island')
check('and he is in the air', midAir.flying === true)
check('the Wings are already spent', (await wings()) === 0)

// Nothing may move while he is in the air — no damage, no being bounced back
// through the portal he just came out of.
const heartsAloft = midAir.hearts
await page.keyboard.down('ArrowRight')
await page.waitForTimeout(200)
await page.keyboard.up('ArrowRight')
const stillAloft = await world()
check('holding a key does not walk him mid-flight',
  !stillAloft.flying || (stillAloft.x === midAir.x && stillAloft.y === midAir.y))
check('and he cannot be hurt up there', stillAloft.hearts === heartsAloft)

// ------------------------------------------------------------- and he lands
await page.waitForFunction(() => !window.zsq.world.debugState().flying, { timeout: 5000 })
const landed = await world()
check('he lands', landed.flying === false)
check('on the island', landed.screen === 'lagoon-island')
// The spawn tile is col 10, row 5.
check('on the tile the portal named', Math.round(landed.x / 16) === 10 && Math.round(landed.y / 16) === 5)
check('and he can walk again', await (async () => {
  const before = (await world()).x
  await page.keyboard.down('ArrowLeft'); await page.waitForTimeout(220); await page.keyboard.up('ArrowLeft')
  return (await world()).x < before
})())

// ---------------------------------------- a tab closed in mid-air is still sane
// The crossing is committed before the animation begins, so a reload during it
// must find him on the island with no wings — never on the shore having paid.
await newGameWithWings()
check('flying again', await stepOntoTheWater())
await page.reload({ waitUntil: 'networkidle' })
await page.getByRole('button', { name: /begin|continue/i }).click()
await page.waitForSelector('.game-canvas')
await page.waitForTimeout(400)
const after = await world()
check('a reload mid-flight leaves him on the island', after.screen === 'lagoon-island')
check('with the Wings spent exactly once', (await wings()) === 0)
check('and not in a flight that never ends', after.flying === false)

console.log(JSON.stringify({ failures, errors }, null, 2))
for (const f of failures) console.log('  FAILED:', f)
await browser.close()
process.exit(failures.length || errors.length ? 1 : 0)
