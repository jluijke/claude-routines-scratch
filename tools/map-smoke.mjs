/**
 * Walks the map in a real browser.
 *
 * For every exit, this puts the hero exactly where the game would put him
 * after crossing, then checks he can actually move. That is the check nothing
 * else was doing — every other browser test drives exercises rather than
 * walking the world — and it is the check that would have caught a child being
 * stranded in the middle of a river.
 */
import { chromium } from 'playwright'

const BASE = process.env.BASE ?? 'http://localhost:5199/'
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

// The mountain will kill a three-heart hero while he is being walked around,
// and once the defeat screen appears every later crossing looks stuck. Give
// him enough life to survive the tour.
await page.evaluate(() => {
  for (let i = 0; i < 18; i++) window.zsq.world.grantHeartContainer()
})

// Every crossing the game can make, and where it puts you.
const crossings = await page.evaluate(async () => {
  const [{ SCREENS, screenById }, { workingLines }] = await Promise.all([
    import('/src/game/world/screens.ts'),
    import('/src/game/world/analysis.ts'),
  ])
  const LAND = { right: 1, left: 14, up: 9, down: 1 }
  const out = []
  for (const screen of SCREENS) {
    for (const [direction, target] of Object.entries(screen.exits ?? {})) {
      const to = screenById(target)
      if (!to) continue
      for (const line of workingLines(screen, direction, to)) {
        const horizontal = direction === 'left' || direction === 'right'
        out.push({
          from: screen.id,
          direction,
          to: target,
          col: horizontal ? LAND[direction] : line,
          row: horizontal ? line : LAND[direction],
        })
      }
    }
  }
  return out
})

const stuck = []
for (const c of crossings) {
  // Clear anything that stole the input, and top him up.
  const overlay = await page.locator('.overlay button').first()
  if (await page.locator('.overlay').count()) await overlay.click().catch(() => {})
  await page.evaluate(() => window.zsq.world.heal(99))

  await page.evaluate(({ to, col, row }) => window.zsq.goTo(to, col, row), c)
  // loadScreen holds a short transition during which input is ignored.
  await page.waitForTimeout(320)
  const before = await page.evaluate(() => {
    const s = window.zsq.world.debugState()
    return [s.x, s.y]
  })

  // Try every direction; at least one has to get him somewhere.
  let moved = false
  for (const key of ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight']) {
    await page.keyboard.down(key)
    await page.waitForTimeout(180)
    await page.keyboard.up(key)

    // Walking into a barrier raises its prompt and pauses the game. That is
    // the hero finding something to do, not being stuck — dismiss it and move
    // on, or every screen with a seal on it looks like a trap.
    if (await page.locator('.gate-prompt').count()) {
      await page.getByRole('button', { name: 'Not right now' }).click().catch(() => {})
      await page.waitForTimeout(150)
      moved = true
      break
    }

    const after = await page.evaluate(() => {
      const s = window.zsq.world.debugState()
      return [s.x, s.y, s.screen]
    })
    if (after[2] !== c.to || Math.abs(after[0] - before[0]) > 2 || Math.abs(after[1] - before[1]) > 2) {
      moved = true
      break
    }
  }
  if (!moved) stuck.push(`${c.from} --${c.direction}--> ${c.to} lands at ${c.col},${c.row} and cannot move`)
  process.stdout.write(moved ? '.' : 'X')
}

console.log('\n')
stuck.forEach((s) => console.log('  STUCK  ' + s))
console.log(`${crossings.length - stuck.length} of ${crossings.length} crossings leave the hero able to move.`)
if (errors.length) console.log(`Page errors: ${errors.length}\n${errors.slice(0, 3).join('\n')}`)

await browser.close()
process.exit(stuck.length === 0 && errors.length === 0 ? 0 : 1)
