/**
 * Can he actually kill things?
 *
 * Every other browser check drives exercises or walks the map. None of them
 * ever tried to hit a monster, which is how a sword whose blade stuck out
 * seven pixels — less than half a tile — reached a real child who then could
 * not kill anything with it.
 *
 * This hunts each ordinary enemy the way a player does: walk to it, face it,
 * swing. It fails if one takes more than a reasonable number of swings.
 */
import { chromium } from 'playwright'

const BASE = process.env.BASE ?? 'http://localhost:5199/'
const SWING_BUDGET = 14
const SECONDS_BUDGET = 25
// Within this many pixels an axis counts as lined up, so the hunt turns to
// close the other one instead of overshooting.
const ALIGNED = 10

const browser = await chromium.launch({
  executablePath: process.env.CHROME ?? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
})
const page = await browser.newPage({ viewport: { width: 900, height: 820 } })
const errors = []
page.on('pageerror', (e) => errors.push(String(e)))

await page.goto(BASE, { waitUntil: 'networkidle' })
await page.evaluate(() => localStorage.removeItem('zsq.save'))
await page.reload({ waitUntil: 'networkidle' })
await page.getByRole('button', { name: /begin/i }).click()
await page.waitForSelector('.game-canvas')
// Enough life to finish the tour; this measures the sword, not survival.
await page.evaluate(() => {
  for (let i = 0; i < 30; i++) window.zsq.world.grantHeartContainer()
})

const KEY = { up: 'ArrowUp', down: 'ArrowDown', left: 'ArrowLeft', right: 'ArrowRight' }
const state = () => page.evaluate(() => window.zsq.world.debugState())

async function step(direction, ms) {
  await page.keyboard.down(KEY[direction])
  await page.waitForTimeout(ms)
  await page.keyboard.up(KEY[direction])
}

/** Walks to the nearest monster and swings until one of them dies. */
async function hunt(screen, col, row, label) {
  await page.evaluate(([s, c, r]) => window.zsq.goTo(s, c, r), [screen, col, row])
  await page.evaluate(() => window.zsq.world.heal(99))
  await page.waitForTimeout(350)

  const start = await state()
  const began = Date.now()
  let swings = 0

  while (Date.now() - began < SECONDS_BUDGET * 1000 && swings < SWING_BUDGET * 3) {
    const s = await state()
    if (s.enemies < start.enemies) break
    const target = s.monsters
      .map((m) => ({ ...m, d: Math.hypot(m.x + 7 - (s.x + 6), m.y + 7 - (s.y + 6)) }))
      .sort((a, b) => a.d - b.d)[0]
    if (!target) break

    const dx = target.x + 7 - (s.x + 6)
    const dy = target.y + 7 - (s.y + 6)

    if (target.d <= 20) {
      const dir = Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? 'left' : 'right') : dy < 0 ? 'up' : 'down'
      await step(dir, 40)
      await page.keyboard.press('z')
      swings++
      await page.waitForTimeout(150)
      continue
    }

    // Close the axis that is still misaligned, longest gap first, and only
    // hold an axis while it has ground left to cover. Walking one axis until
    // a wall stops it deadlocks against anything that keeps its distance: the
    // hero ping-pongs past the monster's column, forever a tile below it, and
    // the check reports a perfectly killable monster as immortal.
    const axis =
      Math.abs(dx) <= ALIGNED ? 'y' : Math.abs(dy) <= ALIGNED ? 'x' : Math.abs(dx) >= Math.abs(dy) ? 'x' : 'y'
    const primary = axis === 'x' ? (dx < 0 ? 'left' : 'right') : dy < 0 ? 'up' : 'down'
    await step(primary, 110)
    const after = await state()
    if (Math.abs(after.x - s.x) < 1 && Math.abs(after.y - s.y) < 1) {
      // Wall in the way: go round it on the other axis.
      const detour = axis === 'x' ? (dy < 0 ? 'up' : 'down') : dx < 0 ? 'left' : 'right'
      await step(detour, 110)
    }
  }

  const end = await state()
  return {
    label,
    killed: end.enemies < start.enemies,
    swings,
    seconds: Math.round((Date.now() - began) / 1000),
    heartsLost: start.hearts - end.hearts,
  }
}

const results = []
results.push(await hunt('village-west', 4, 5, 'shooter'))
results.push(await hunt('village-east', 4, 6, 'shooter'))
results.push(await hunt('forest-2', 7, 4, 'chaser and flyer'))
results.push(await hunt('graveyard-1', 7, 4, 'flyers'))
results.push(await hunt('d3-hall', 7, 8, 'casters'))

const failures = results.filter((r) => !r.killed || r.swings > SWING_BUDGET)
for (const r of results) {
  const verdict = !r.killed ? 'NEVER DIED' : r.swings > SWING_BUDGET ? 'TOO MANY SWINGS' : 'ok'
  console.log(
    `  ${verdict.padEnd(16)} ${r.label.padEnd(18)} ${String(r.swings).padStart(3)} swings, ${r.seconds}s, ${r.heartsLost} hearts lost`,
  )
}
console.log(`\n${results.length - failures.length} of ${results.length} within ${SWING_BUDGET} swings.`)
if (errors.length) console.log(`Page errors: ${errors.length}\n${errors.slice(0, 3).join('\n')}`)

await browser.close()
process.exit(failures.length === 0 && errors.length === 0 ? 0 : 1)
