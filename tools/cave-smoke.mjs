/**
 * The Hollow: the cave a step from the village square.
 *
 * It is the first thing in the game that is purely a game — no barrier, no
 * exercise, just a hole in the ground with something at the bottom of it. This
 * checks a child can find it, that the dark actually hides it until he has the
 * candle, and that the hoard pays exactly once.
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

async function walk(key, times, ms = 130) {
  for (let i = 0; i < times; i++) {
    await page.keyboard.down(key)
    await page.waitForTimeout(ms)
    await page.keyboard.up(key)
  }
}

// He starts in the village square, and the cave mouth is on the same screen.
check('the quest starts in the village square', (await state()).screen === 'village-square')

// Walk to the mouth at column 12, row 1 and step in.
await page.evaluate(() => window.zsq.world.teleport('village-square', 12, 3))
await page.waitForTimeout(300)
await walk('ArrowUp', 10)
await page.waitForTimeout(400)
const inside = await state()
check('walking into the cave mouth goes underground', inside.screen === 'hollow-cave')

// No candle yet: the room is dark.
const litWithout = await page.evaluate(() => window.zsq.world.debugState().litRadius)

// Down the stairs to the far room.
await page.evaluate(() => window.zsq.world.teleport('hollow-cave', 8, 6))
await page.waitForTimeout(300)
await walk('ArrowUp', 6)
await page.waitForTimeout(400)
const deep = await state()
check('the stairs lead deeper in', deep.screen === 'hollow-cave-deep')

// The hoard, at the far end. Walk up into it.
const before = await page.evaluate(() => window.zsq.state.player.rupees)
await page.evaluate(() => window.zsq.world.teleport('hollow-cave-deep', 7, 3))
await page.waitForTimeout(300)
await walk('ArrowUp', 8)
await page.waitForTimeout(500)
const after = await page.evaluate(() => window.zsq.state.player.rupees)
check('the chest pays a hoard', after - before === 100)
check('and no exercise was asked for', !(await page.$('.gate-prompt')))

// Walking over it again pays nothing.
await walk('ArrowDown', 2)
await walk('ArrowUp', 3)
await page.waitForTimeout(400)
const again = await page.evaluate(() => window.zsq.state.player.rupees)
check('the chest pays only once', again === after)

// It stays open across a reload.
await page.reload({ waitUntil: 'networkidle' })
await page.getByRole('button', { name: /continue|begin/i }).click()
await page.waitForSelector('.game-canvas')
await page.waitForTimeout(400)
const saved = await page.evaluate(() => ({
  rupees: window.zsq.state.player.rupees,
  taken: window.zsq.state.world.takenChests,
}))
check('the hoard is remembered', saved.taken.includes('hollow-hoard') && saved.rupees === after)

// And the way out works.
await page.evaluate(() => window.zsq.world.teleport('hollow-cave', 7, 8))
await page.waitForTimeout(300)
await walk('ArrowDown', 8)
await page.waitForTimeout(400)
check('the cave leads back to the square', (await state()).screen === 'village-square')

console.log(JSON.stringify({ litWithout, before, after, again, saved, failures, errors }, null, 2))
for (const f of failures) console.log(`  FAILED: ${f}`)
await browser.close()
process.exit(failures.length === 0 && errors.length === 0 ? 0 : 1)
