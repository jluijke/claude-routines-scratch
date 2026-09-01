/**
 * The first five minutes.
 *
 * A child who opens this game should have something to do before he is asked to
 * spell anything: someone tells him what is going on, there is a sword in the
 * grass, and a cave he cannot see inside. Only then does the shopkeeper ask him
 * for two words. This walks that whole sequence in order.
 */
import { chromium } from 'playwright'
import { makeAnswerer } from './lib/answer.mjs'

const OUT = '/tmp/claude-0/-home-user-claude-routines-scratch/6df0b2d4-03e5-5006-8fa7-f59d18d1702e/scratchpad'
const BASE = process.env.BASE ?? 'http://localhost:5199/'
const browser = await chromium.launch({
  executablePath: process.env.CHROME ?? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
})
const page = await browser.newPage({ viewport: { width: 900, height: 820 } })
const errors = []
page.on('pageerror', (e) => errors.push(String(e)))

const { answerOne } = makeAnswerer(page)
const failures = []
const check = (name, ok) => { if (!ok) failures.push(name) }
const state = () => page.evaluate(() => window.zsq.world.debugState())

async function walk(key, times, ms = 130) {
  for (let i = 0; i < times; i++) {
    await page.keyboard.down(key)
    await page.waitForTimeout(ms)
    await page.keyboard.up(key)
  }
}

await page.goto(BASE, { waitUntil: 'networkidle' })
await page.evaluate(() => localStorage.removeItem('zsq.save'))
await page.reload({ waitUntil: 'networkidle' })
await page.getByRole('button', { name: /begin your quest/i }).click()
await page.waitForSelector('.game-canvas')
await page.waitForTimeout(500)

// --------------------------------------------------------- he starts with nothing
const start = await page.evaluate(() => ({
  sword: window.zsq.state.player.equippedSword,
  inventory: Object.keys(window.zsq.state.inventory),
  rupees: window.zsq.state.player.rupees,
}))
check('he starts with no sword', start.sword === undefined)
check('and no candle', !start.inventory.includes('blueCandle'))
check('and no rupees', start.rupees === 0)
// The HUD reads ITEMS[sword] every frame; a missing one used to crash the loop.
check('the game still renders without a sword', errors.length === 0)

await page.evaluate(() => { for (let i = 0; i < 20; i++) window.zsq.world.grantHeartContainer() })

/**
 * Stands under the shooter on East Road, faces it and swings. The same spot is
 * used armed and unarmed, so the pair actually proves something: bare hands
 * must fail exactly where a sword succeeds.
 */
async function swingAtTheShooter(times) {
  await page.evaluate(() => window.zsq.world.teleport('village-east', 9, 7))
  await page.waitForTimeout(350)
  const before = (await state()).enemies
  for (let i = 0; i < times; i++) {
    // Aim each time: the shooter wanders, so a blind swing at a fixed spot
    // misses often enough to make this check flaky rather than informative.
    const s = await state()
    const target = s.monsters[0]
    if (!target) break
    const dx = target.x + 7 - (s.x + 6)
    const dy = target.y + 7 - (s.y + 6)
    const key = Math.abs(dx) > Math.abs(dy)
      ? (dx < 0 ? 'ArrowLeft' : 'ArrowRight')
      : (dy < 0 ? 'ArrowUp' : 'ArrowDown')
    await page.keyboard.down(key)
    await page.waitForTimeout(Math.hypot(dx, dy) > 22 ? 120 : 45)
    await page.keyboard.up(key)
    await page.keyboard.press('z')
    await page.waitForTimeout(200)
  }
  return (await state()).enemies - before
}

check('bare hands kill nothing', (await swingAtTheShooter(10)) === 0)

// ------------------------------------------------------------- the villager speaks
await page.evaluate(() => window.zsq.world.teleport('village-square', 8, 5))
await page.waitForTimeout(400)
const away = await page.evaluate(() => window.zsq.world.talkingProp())
check('nobody talks from across the square', away === undefined)

await page.evaluate(() => window.zsq.world.teleport('village-square', 4, 5))
await page.waitForTimeout(400)
const near = await page.evaluate(() => window.zsq.world.talkingProp())
check('the villager speaks when you stand by him', typeof near === 'string')
check('and says what he was given to say', (near ?? '').includes('save our princess'))
await page.screenshot({ path: `${OUT}/O01-villager.png` })

// -------------------------------------------------------- the sword in the grass
await page.evaluate(() => window.zsq.world.teleport('village-square', 12, 7))
await page.waitForTimeout(300)
await page.screenshot({ path: `${OUT}/O02-sword-on-grass.png` })
await walk('ArrowDown', 6)
await page.waitForTimeout(400)
const armed = await page.evaluate(() => ({
  sword: window.zsq.state.player.equippedSword,
  owned: window.zsq.state.inventory.woodenSword,
}))
check('walking over the sword picks it up', armed.owned === 1)
check('and equips it', armed.sword === 'woodenSword')

// And now the very same swing kills.
check('the found sword actually kills', (await swingAtTheShooter(10)) < 0)

// ------------------------------------------------------------- the cave is black
await page.evaluate(() => window.zsq.world.teleport('hollow-cave', 7, 6))
await page.waitForTimeout(400)
const dark = await state()
check('the cave is pitch black without a candle', dark.litRadius <= 24)
await page.screenshot({ path: `${OUT}/O03-cave-black.png` })

// ------------------------------------------------ the shopkeeper asks two words
await page.evaluate(() => window.zsq.world.teleport('village-square', 4, 3))
await page.waitForTimeout(300)
await walk('ArrowUp', 6)
await page.waitForSelector('.shop', { timeout: 8000 })
const candleRow = page.locator('.shop-row', { hasText: 'Blue Candle' })
check('the candle is not simply for sale', (await candleRow.locator('button').textContent()) === 'Prove it')
await candleRow.getByRole('button', { name: /prove it/i }).click()
await page.waitForTimeout(400)
check('the prompt promises something short', (await page.locator('.gate-exercise').textContent()) === 'Two quick words')
await page.getByRole('button', { name: /take the challenge/i }).click()
await page.waitForSelector('.exercise-screen', { timeout: 8000 })
await page.screenshot({ path: `${OUT}/O04-two-questions.png` })

let asked = 0
for (let i = 0; i < 6; i++) {
  if (await page.locator('.rule-reveal').count()) break
  if (!(await answerOne())) break
  asked++
}
check('it asks exactly two questions', asked === 2)
await page.getByRole('button', { name: /back to the quest/i }).click()
await page.waitForSelector('.game-canvas', { timeout: 8000 })
await page.waitForTimeout(400)

const paid = await page.evaluate(() => ({
  rupees: window.zsq.state.player.rupees,
  done: window.zsq.state.spelling.completedExercises.length,
  opened: window.zsq.state.world.openedGates.includes('shop-candle'),
}))
check('proving it pays enough for the candle', paid.rupees >= 60)
check('the shopkeeper will now sell it', paid.opened)
// The whole point of keeping it out of EXERCISES.
check('and it does not count as a curriculum exercise', paid.done === 0)

// --------------------------------------------------------------- buy, and see
// He is put back at the counter with the shop still open, so the candle is
// right there — no walking out and in again to collect what he just earned.
check('the shop is waiting for him afterwards', (await page.locator('.shop').count()) === 1)
// The panel is built before the reward lands, so without a refresh it still
// reads "Prove it" and no rupees until he walks out and back in.
const candleLabel = await page.locator('.shop-row', { hasText: 'Blue Candle' }).locator('button').textContent()
check('and the candle is on sale in it, not still asking', candleLabel === 'Buy')
if (candleLabel === 'Buy') {
  await page.locator('.shop-row', { hasText: 'Blue Candle' }).getByRole('button', { name: /buy/i }).click()
  await page.waitForTimeout(300)
}
await page.getByRole('button', { name: /leave the shop/i }).first().click()
await page.waitForTimeout(400)
check('he owns a candle', await page.evaluate(() => window.zsq.state.inventory.blueCandle === 1))

await page.evaluate(() => window.zsq.world.teleport('hollow-cave', 7, 6))
await page.waitForTimeout(400)
const lit = await state()
check('and now the cave has light', lit.litRadius > dark.litRadius)
await page.screenshot({ path: `${OUT}/O05-cave-lit.png` })

console.log(JSON.stringify({ start, armed, paid, dark: dark.litRadius, lit: lit.litRadius, asked, failures, errors }, null, 2))
for (const f of failures) console.log(`  FAILED: ${f}`)
await browser.close()
process.exit(failures.length === 0 && errors.length === 0 ? 0 : 1)
