/**
 * Every doorway, from every footing.
 *
 * The bug this exists for: leaving a screen asked for the player's centre to
 * be within five pixels of the screen edge, and collision stops his body two
 * pixels short of it. That left a window about one pixel wide, crossed at a
 * pixel a frame, so whether a doorway worked depended on where his stride
 * happened to land. It failed on all four edges in both worlds, and only
 * sometimes, which is the worst way for a thing to fail.
 *
 * So this does not test one crossing. It walks him at each doorway from a
 * spread of starting positions along and across it, and every one of them has
 * to get through.
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
const wait = (ms) => page.waitForTimeout(ms)
const world = () => page.evaluate(() => window.zsq.world.debugState())
const check = (name, ok) => { if (!ok) failures.push(name) }

await page.goto(BASE, { waitUntil: 'networkidle' })
await page.evaluate(() => localStorage.removeItem('zsq.save'))
await page.reload({ waitUntil: 'networkidle' })
await page.getByRole('button', { name: /begin|continue/i }).click()
await page.waitForSelector('.game-canvas')
await page.waitForTimeout(300)

const KEY = { up: 'ArrowUp', down: 'ArrowDown', left: 'ArrowLeft', right: 'ArrowRight' }

/**
 * Screens with a clear run at a doorway in each direction, one per world, with
 * nothing in between to stop him. Both the open edge and the cross-axis are
 * swept: the cross-axis positions cover the whole two-tile gap, and the along-
 * axis positions cover a full stride, which is what the phase bug turned on.
 */
const CASES = [
  { screen: 'river-bridge', dir: 'down', along: [150, 152, 154, 156, 157, 158, 160], across: [110, 116, 122, 128, 133] },
  { screen: 'river-bridge', dir: 'up', along: [26, 24, 22, 20, 18, 16, 14], across: [110, 116, 122, 128, 133] },
  { screen: 'village-square', dir: 'left', along: [26, 24, 22, 20, 18, 16, 14], across: [46, 52, 58, 62] },
  { screen: 'village-square', dir: 'right', along: [228, 230, 232, 234, 236, 238, 240], across: [46, 52, 58, 62] },
  { screen: 'ship-corridor-1', dir: 'down', along: [150, 152, 154, 156, 157, 158, 160], across: [110, 116, 122, 128, 133] },
  { screen: 'ship-corridor-1', dir: 'up', along: [26, 24, 22, 20, 18, 16, 14], across: [110, 116, 122, 128, 133] },
  // A one-tile doorway (row 4 only), so the body's eight usable pixels are
  // the whole of it: y 62..69 and no more. Sweeping outside that would be
  // testing that he cannot walk through a wall.
  { screen: 'ship-corridor-2', dir: 'left', along: [26, 24, 22, 20, 18, 16, 14], across: [62, 65, 69] },
  { screen: 'ship-corridor-1', dir: 'right', along: [228, 230, 232, 234, 236, 238, 240], across: [62, 68, 74, 78] },
]

for (const item of CASES) {
  const vertical = item.dir === 'up' || item.dir === 'down'
  let tried = 0
  const stuck = []
  for (const along of item.along) {
    for (const across of item.across) {
      const x = vertical ? across : along
      const y = vertical ? along : across
      const placed = await page.evaluate(
        ([id, px, py]) => {
          window.zsq.state.world.invisibleScreens = 99
          window.zsq.goTo(id, 7, 5)
          window.zsq.world.debugPlace(px, py)
          const s = window.zsq.world.debugState()
          return { screen: s.screen, inside: window.zsq.world.insideWall() }
        },
        [item.screen, x, y],
      )
      // Starting positions that are inside scenery prove nothing.
      if (placed.inside || placed.screen !== item.screen) continue
      tried += 1

      await page.keyboard.down(KEY[item.dir])
      await page.waitForTimeout(900)
      await page.keyboard.up(KEY[item.dir])
      const after = await page.evaluate(() => window.zsq.world.debugState())
      if (after.screen === item.screen) stuck.push(`${x},${y}`)
    }
  }
  const label = `${item.screen} ${item.dir}`
  if (tried === 0) failures.push(`${label}: no usable starting positions — the check proves nothing`)
  else if (stuck.length) failures.push(`${label}: stuck at ${stuck.length}/${tried} footings (${stuck.slice(0, 4).join(' ')})`)
  console.log(`${label.padEnd(26)} ${tried - stuck.length}/${tried} crossings`)
}

// ------------------------------------------ both tiles of an interior door
// Almost every room in the game is left through a two-tile gap in its outer
// wall with the door authored on one of the two. Standing on the other and
// walking into the wall used to do nothing at all — eighty-four doorways
// across both worlds. Both tiles have to work.
const ROOMS = [
  ['bomb-shop', 'village-east'],
  ['d4-treasury', 'd4-hall'],
  ['airlock-1', 'ship-corridor-2'],
  ['airlock-4', 'ship-reactor'],
  ['ship-smugglers-hold', 'ship-lower-deck'],
  ['ship-maintenance-bay', 'ship-lab-3'],
  ['rock-1-vein', 'rock-1-crater'],
  ['outpost-hold', 'outpost-deck'],
]
for (const [room, beyond] of ROOMS) {
  // The land's rooms are walked in the land, the ship's on the ship: dropping
  // into a Level 1 cave with the save switched to Level 2 does not place him.
  const needsShip = !['bomb-shop', 'd4-treasury'].includes(room)
  await page.evaluate((ship) => {
    if (ship && window.zsq.state.level !== 2) window.zsq.enterLevel(2)
    if (!ship && window.zsq.state.level !== 1) window.zsq.enterLevel(1)
  }, needsShip)
  await wait(500)
  for (const col of [7, 8]) {
    await page.evaluate(([id, c]) => {
      window.zsq.state.world.invisibleScreens = 99
      window.zsq.goTo(id, c, 8)
    }, [room, col])
    await wait(350)
    // Some rooms are shops, and arriving opens the counter and pauses the
    // world. Left up, it pauses every room tested after it too.
    const leave = page.getByRole('button', { name: /leave the shop|log off/i })
    if (await leave.count()) {
      await leave.first().click()
      await wait(300)
    }
    if ((await world()).screen !== room) { failures.push(`${room}: could not be reached to test`); continue }
    // Held only long enough to reach the doorway, then read at once: keep the
    // key down and he walks back in through the hatch on the other side.
    await page.keyboard.down('ArrowDown')
    let left = false
    for (let i = 0; i < 8 && !left; i++) {
      await wait(110)
      if ((await world()).screen === beyond) left = true
    }
    await page.keyboard.up('ArrowDown')
    check(`${room} lets him out on col ${col}`, left)
  }
}

console.log(JSON.stringify({ failures, errors }, null, 2))
for (const f of failures) console.log('  FAILED:', f)
await browser.close()
process.exit(failures.length || errors.length ? 1 : 0)
