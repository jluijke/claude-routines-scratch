/**
 * Can he always still move?
 *
 * A child spent a session standing inside a rock in Forest Hollow. Opening a
 * barrier shoved him ten pixels with no collision check, in the direction he
 * was "facing" — which resets when the world is rebuilt after an exercise — and
 * the movement code only ever asked whether the destination was legal, never
 * whether he was already stuck. Every direction was refused, permanently.
 *
 * This opens barriers from the awkward side and checks he can still walk, and
 * that a save written with him already inside a wall releases him on load.
 */
import { chromium } from 'playwright'

const BASE = process.env.BASE ?? 'http://localhost:5199/'
const browser = await chromium.launch({
  executablePath: process.env.CHROME ?? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
})
const page = await browser.newPage({ viewport: { width: 900, height: 820 } })
const errors = []
page.on('pageerror', (e) => errors.push(String(e)))

const failures = []
const check = (name, ok) => { if (!ok) failures.push(name) }

await page.goto(BASE, { waitUntil: 'networkidle' })
await page.evaluate(() => localStorage.removeItem('zsq.save'))
await page.reload({ waitUntil: 'networkidle' })
await page.getByRole('button', { name: /begin your quest/i }).click()
await page.waitForSelector('.game-canvas')
await page.evaluate(() => { for (let i = 0; i < 20; i++) window.zsq.world.grantHeartContainer() })

const state = () => page.evaluate(() => window.zsq.world.debugState())

/** Walks a little in each direction and reports whether anything moved. */
async function canMove() {
  const before = await state()
  for (const key of ['ArrowDown', 'ArrowRight', 'ArrowUp', 'ArrowLeft']) {
    await page.keyboard.down(key)
    await page.waitForTimeout(160)
    await page.keyboard.up(key)
    const now = await state()
    if (Math.abs(now.x - before.x) > 1 || Math.abs(now.y - before.y) > 1) return true
  }
  return false
}

// 1. The reported case: open the hermit's barrier in Forest Hollow standing to
//    its right, which is where the old shove pushed him into the rock.
await page.evaluate(() => {
  window.zsq.world.teleport('forest-4', 5, 5)
  window.zsq.state.spelling.completedExercises = [1, 2, 3]
})
await page.waitForTimeout(300)
await page.evaluate(() => {
  const gate = window.zsq.gateById('forest-hermit')
  if (gate) window.zsq.world.openGate(gate)
})
await page.waitForTimeout(300)
const afterOpen = await state()
check('opening the hermit barrier does not land him in a wall', await canMove())

// 2. Every barrier in the game, opened from every side, still leaves him free.
const trapped = await page.evaluate(() => {
  const world = window.zsq.world
  const bad = []
  for (const screen of window.zsq.screens) {
    for (const placement of screen.gates ?? []) {
      for (const [dc, dr] of [[0, 1], [0, -1], [1, 0], [-1, 0]]) {
        const col = placement.col + dc
        const row = placement.row + dr
        if (col < 0 || row < 0 || col > 15 || row > 10) continue
        world.teleport(screen.id, col, row)
        const before = world.debugState()
        // Only judge from somewhere he could actually have been standing.
        if (Math.abs(before.x - (col * 16 + 2)) > 8) continue
        const gate = window.zsq.gateById(placement.gateId)
        if (!gate) continue
        world.openGate(gate)
        if (world.insideWall()) bad.push(`${screen.id}/${placement.gateId} from ${col},${row}`)
      }
    }
  }
  return bad
})
check('no barrier in the game leaves him inside a wall', trapped.length === 0)

// 3. A save already written with him in a rock — his actual save — releases him.
await page.evaluate(() => {
  const save = JSON.parse(localStorage.getItem('zsq.save') ?? '{}')
  save.player.screenId = 'forest-4'
  save.player.x = 74
  save.player.y = 68
  localStorage.setItem('zsq.save', JSON.stringify(save))
})
await page.reload({ waitUntil: 'networkidle' })
await page.getByRole('button', { name: /continue|begin/i }).click()
await page.waitForSelector('.game-canvas')
await page.waitForTimeout(500)
const rescued = await page.evaluate(() => ({ inside: window.zsq.world.insideWall(), ...window.zsq.world.debugState() }))
check('a save that put him inside a rock releases him on load', rescued.inside === false)
check('and he can walk once released', await canMove())

console.log(JSON.stringify({ afterOpen, trapped: trapped.slice(0, 5), trappedCount: trapped.length, rescued, failures, errors }, null, 2))
for (const f of failures) console.log(`  FAILED: ${f}`)
await browser.close()
process.exit(failures.length === 0 && errors.length === 0 ? 0 : 1)
