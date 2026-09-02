/**
 * The island: the one place you leave on purpose with no way back.
 *
 * A line of stakes on the shore costs half an exercise. The water costs the
 * Wings — they carry you over once and tear doing it. What is on the island
 * pays for the ride home, and the castaway under it charges for the privilege.
 *
 * The thing this really checks is that a child cannot be stranded there.
 */
import { chromium } from 'playwright'
import { makeAnswerer } from './lib/answer.mjs'

const OUT = '/tmp/claude-0/-home-user-claude-routines-scratch/6df0b2d4-03e5-5006-8fa7-f59d18d1702e/scratchpad'
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
const save = () => page.evaluate(() => ({
  wings: window.zsq.state.inventory.wings ?? 0,
  rupees: window.zsq.state.player.rupees,
  gates: [...window.zsq.state.world.openedGates],
  chests: [...window.zsq.state.world.takenChests],
  done: window.zsq.state.spelling.completedExercises.length,
}))

async function walk(key, times, ms = 130) {
  for (let i = 0; i < times; i++) {
    await page.keyboard.down(key); await page.waitForTimeout(ms); await page.keyboard.up(key)
  }
}

/** Plays whatever exercise is on screen to the end. */
async function playChallenge(limit = 30) {
  await page.waitForSelector('.exercise-screen', { timeout: 10000 })
  // The dots are one per question in the queue — the honest length. Counting
  // submissions instead would count a retry twice.
  const total = await page.locator('.progress-dots .dot').count()
  let asked = 0
  for (let i = 0; i < limit; i++) {
    if (await page.locator('.rule-reveal').count()) break
    if (!(await answerOne())) break
    asked++
  }
  await page.getByRole('button', { name: /back to the quest/i }).click()
  await page.waitForSelector('.game-canvas', { timeout: 10000 })
  await page.waitForTimeout(400)
  return total
}

await page.goto(process.env.BASE ?? 'http://localhost:5199/', { waitUntil: 'networkidle' })
await page.evaluate(() => localStorage.removeItem('zsq.save'))
await page.reload({ waitUntil: 'networkidle' })
await page.getByRole('button', { name: /begin your quest/i }).click()
await page.waitForSelector('.game-canvas')
// Far into the game: gear, a few exercises done, and a pair of Wings.
await page.evaluate(() => {
  const s = window.zsq.state
  for (let i = 0; i < 20; i++) window.zsq.world.grantHeartContainer()
  s.inventory.woodenSword = 1
  s.inventory.wings = 1
  s.player.rupees = 0
  s.spelling.completedExercises = [1, 2, 3]
  window.zsq.world.equipBest()
})

// ------------------------------------------------------------- the stakes
await page.evaluate(() => window.zsq.world.teleport('lagoon-shore', 12, 5))
await page.waitForTimeout(400)
await walk('ArrowLeft', 5)
check('the stakes stop him', Boolean(await page.$('.gate-prompt')))
check('and ask for a short challenge',
  (await page.locator('.gate-exercise').textContent()) === 'A short challenge')
await page.getByRole('button', { name: /take the challenge/i }).click()
const shoreLength = await playChallenge()
// Measured against the exercise it is built from, rather than a guessed band.
const full = await page.evaluate(async () => {
  const { EXERCISES } = await import('/src/content/exercises/index.ts')
  const done = window.zsq.state.spelling.completedExercises
  const learned = EXERCISES.filter((e) => done.includes(e.id))
  return (learned[learned.length - 1] ?? EXERCISES[0]).activities.length
})
check('the crossing costs half an exercise, not a whole one',
  shoreLength === Math.max(2, Math.ceil(full / 2)))
const afterStakes = await save()
check('and does not spend a curriculum exercise', afterStakes.done === 3)

// -------------------------------------------------------------- the water
await page.evaluate(() => window.zsq.world.teleport('lagoon-shore', 7, 5))
await page.waitForTimeout(400)
await walk('ArrowLeft', 6)
await page.waitForTimeout(500)
const landed = await state()
check('the Wings carry him across', landed.screen === 'lagoon-island')
const afterFlight = await save()
check('and tear doing it — one way only', afterFlight.wings === 0)

// He cannot simply turn round and fly home.
await walk('ArrowRight', 3)
await page.waitForTimeout(400)
check('he cannot fly back without wings', (await state()).screen === 'lagoon-island')

// ---------------------------------------------------------------- the cave
await page.evaluate(() => window.zsq.world.teleport('lagoon-island', 7, 5))
await page.waitForTimeout(300)
await walk('ArrowUp', 4)
await page.waitForTimeout(500)
check('the island has a cave', (await state()).screen === 'lagoon-cave')

await page.evaluate(() => window.zsq.world.teleport('lagoon-cave', 7, 3))
await page.waitForTimeout(300)
await walk('ArrowUp', 5)
await page.waitForTimeout(500)
const afterChest = await save()
check('the sea chest holds a fortune', afterChest.rupees - afterStakes.rupees === 500)
await page.screenshot({ path: `${OUT}/L01-hold.png` })

// -------------------------------------------------------------- the toll
await page.evaluate(() => window.zsq.world.teleport('lagoon-cave', 8, 6))
await page.waitForTimeout(300)
await walk('ArrowUp', 4)
check('the castaway calls up through the passage', Boolean(await page.$('.gate-prompt')))
await page.getByRole('button', { name: /take the challenge/i }).click()
const tollLength = await playChallenge()
check('and asks for half an exercise too', tollLength === Math.max(2, Math.ceil(full / 2)))

// --------------------------------------------------------------- the shop
await page.evaluate(() => window.zsq.world.teleport('lagoon-cave', 8, 6))
await page.waitForTimeout(300)
await walk('ArrowUp', 4)
await page.waitForSelector('.shop', { timeout: 10000 })
await page.screenshot({ path: `${OUT}/L02-castaway.png` })
const beforeBuy = await save()
check('he can always afford the ride home', beforeBuy.rupees >= 300)
const wingsRow = page.locator('.shop-row', { hasText: 'Wings' })
check('the castaway sells wings', (await wingsRow.locator('button').textContent()) === 'Buy')
await wingsRow.getByRole('button', { name: /buy/i }).click()
await page.waitForTimeout(300)
await page.getByRole('button', { name: /leave the shop/i }).first().click()
await page.waitForTimeout(400)
check('and he has wings again', (await save()).wings === 1)

// --------------------------------------------------------------- the way home
await page.evaluate(() => window.zsq.world.teleport('lagoon-island', 10, 5))
await page.waitForTimeout(300)

// He is holding the candle he found on the sand, so the water turns him back
// until he swaps to the Wings — the same swap a child has to make, and the
// reason the refusal names the button to press.
await walk('ArrowRight', 2)
await page.waitForTimeout(400)
check('holding the candle, the water will not take him', (await state()).screen === 'lagoon-island')

// Step off the crossing before swapping. Cycling while stood on it flies him
// the instant the Wings come round — correct, but it makes the swap itself
// impossible to watch.
await page.evaluate(() => window.zsq.world.teleport('lagoon-island', 8, 7))
await page.waitForTimeout(300)
let holdingWings = false
for (let i = 0; i < 8 && !holdingWings; i++) {
  await page.keyboard.press('c')
  await page.waitForTimeout(160)
  holdingWings = (await page.evaluate(() => window.zsq.world.selectedTool())) === 'wings'
}
check('C reaches the Wings', holdingWings)

await page.evaluate(() => window.zsq.world.teleport('lagoon-island', 10, 5))
await page.waitForTimeout(300)
await walk('ArrowRight', 2)
await page.waitForTimeout(500)
check('and flies home', (await state()).screen === 'lagoon-shore')
check('those wings are spent too', (await save()).wings === 0)

const finish = await save()
console.log(JSON.stringify({ full, shoreLength, tollLength, afterStakes, afterFlight, finish, failures, errors }, null, 2))
for (const f of failures) console.log(`  FAILED: ${f}`)
await browser.close()
process.exit(failures.length === 0 && errors.length === 0 ? 0 : 1)
