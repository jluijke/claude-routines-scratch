/**
 * The four mechs, fought in a real browser.
 *
 * The unit tests drive the enemy object directly, which proves the rules but
 * not that the game is wired to them. This walks into each of the four cores
 * with a live world running and checks the fight that actually happens: that
 * the grey one charges and knocks itself out, that the red one turns into two
 * enemies, that the ice one cannot be touched until it shoots, that the black
 * one moves without walking there — and that killing the first half of the red
 * one does not hand him the rock.
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

const CORES = {
  1: 'rock-1-core',
  2: 'rock-2-core',
  3: 'rock-3-core',
  4: 'rock-4-core',
}

/** Drops him into a core room, kitted out, with the mech alive. */
/**
 * Drops him into a core room with the mech alive.
 *
 * `unseen` puts him under the potion, which is how a check survives standing
 * in a boss room for six seconds — the first run of this file died to the
 * black mech and reported that it had never blinked. It is not free, though:
 * under the potion a mech fights the middle of the room rather than the hero,
 * and the charger will not charge at something it is already standing next to.
 * So the one fight that is about closing distance is fought for real, with a
 * deep stack of hearts instead.
 */
const enterCore = async (n, { unseen = true } = {}) => {
  await page.evaluate(([id, hide]) => {
    // A fresh slate each time: a rock already banked would despawn its mech.
    window.zsq.state.world.defeatedBosses = []
    window.zsq.goTo(id, 7, 9)
    window.zsq.state.world.invisibleScreens = hide ? 99 : 0
  }, [CORES[n], unseen])
  await wait(500)
}

await page.goto(BASE, { waitUntil: 'networkidle' })
await page.evaluate(() => localStorage.removeItem('zsq.save'))
await page.reload({ waitUntil: 'networkidle' })
await page.getByRole('button', { name: /begin|continue/i }).click()
await page.waitForSelector('.game-canvas')
await wait(300)

await page.evaluate(() => {
  window.zsq.enterLevel(2)
})
await wait(600)
await page.evaluate(() => {
  window.zsq.state.inventory.goldenSword = 1
  for (let i = 0; i < 12; i++) window.zsq.world.grantHeartContainer()
})

// ------------------------------------------------- they are four, not one
const seen = []
for (const n of [1, 2, 3, 4]) {
  await enterCore(n)
  const state = await world()
  const mech = (state.monsters ?? [])[0]
  seen.push({ n, hp: mech?.hp, kind: mech?.kind, sprite: (state.mechs ?? [])[0]?.sprite })
  check(`rock ${n} still has a mech in it`, mech !== undefined)
}
check('the four mechs are not one health bar four times', new Set(seen.map((s) => s.hp)).size > 2)
check(
  'each rock draws a different machine',
  new Set(seen.map((s) => s.sprite)).size === 4,
)

// -------------------------------------------------------- grey: it charges
await enterCore(1, { unseen: false })
// Stand still in the corner and let it come. It should wind up, cross the
// room, hit the wall and be dazed — all without him touching it.
let sawWindUp = false
let sawDaze = false
let sawShake = false
for (let i = 0; i < 40; i++) {
  const s = await world()
  if (s.screen !== CORES[1]) break
  const m = (s.mechs ?? [])[0]
  if (m?.windingUp) sawWindUp = true
  if (m?.dazed) sawDaze = true
  if (s.shaking) sawShake = true
  await wait(120)
}
check('the grey mech winds up before it moves', sawWindUp)
check('it knocks itself out on the wall', sawDaze)
check('and the room shakes when it lands', sawShake)
const greyShots = await page.evaluate(() => window.zsq.world.debugState().projectiles)
check('the charger does not also shoot at him', greyShots === 0)

// --------------------------------------------------------- red: it splits
await enterCore(2)
const before = (await world()).monsters.length
// Beat on it until it comes apart, without dying to it.
let split = false
for (let i = 0; i < 90 && !split; i++) {
  await page.evaluate(() => {
    const w = window.zsq.world
    w.debugHitBoss(3)
  })
  await wait(60)
  const now = await world()
  if (now.monsters.length > before) split = true
  // Never let the fight end before it splits.
  if (now.monsters.length === 0) break
}
check('the red mech breaks in two', split)
const halves = await world()
check('and both halves are smaller than it was', (halves.mechs ?? []).every((m) => m.half))
check('and the rock is not won yet', !(halves.defeatedBosses ?? []).includes('rock-2-core'))

// Kill one half; the room must still be held by the other.
await page.evaluate(() => window.zsq.world.debugHitBoss(99))
await wait(400)
const oneLeft = await world()
check('killing one half leaves the other', oneLeft.monsters.length === 1)
check(
  'and still does not hand him the rock',
  !(oneLeft.defeatedBosses ?? []).includes('rock-2-core'),
)
await page.evaluate(() => window.zsq.world.debugHitBoss(99))
await wait(600)
const done = await world()
check('the second half finishes it', (done.defeatedBosses ?? []).includes('rock-2-core'))

// ------------------------------------------------------- ice: it shields
await enterCore(3)
const iceStart = (await world()).monsters[0].hp
await page.evaluate(() => window.zsq.world.debugHitBoss(5))
await wait(80)
check('the ice mech shrugs off a blow behind its shield', (await world()).monsters[0].hp === iceStart)

// Wait for it to fire, then hit it in the open window.
let hurtIt = false
for (let i = 0; i < 60 && !hurtIt; i++) {
  const s = await world()
  if ((s.mechs ?? [])[0]?.shielded === false) {
    await page.evaluate(() => window.zsq.world.debugHitBoss(5))
    await wait(60)
    if ((await world()).monsters[0].hp < iceStart) hurtIt = true
  }
  await wait(70)
}
check('but the shield drops when it fires, and then it can be hurt', hurtIt)

// ------------------------------------------------------ black: it phases
await enterCore(4)
let jumped = false
let last = (await world()).monsters[0]
for (let i = 0; i < 50 && !jumped; i++) {
  await wait(120)
  const now = (await world()).monsters[0]
  if (!now) break
  if (Math.hypot(now.x - last.x, now.y - last.y) > 24) jumped = true
  last = now
}
check('the black mech is somewhere it did not walk to', jumped)

console.log(JSON.stringify({ failures, errors, seen }, null, 2))
for (const f of failures) console.log('  FAILED:', f)
await browser.close()
process.exit(failures.length || errors.length ? 1 : 0)
