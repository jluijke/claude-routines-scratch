/**
 * Can the four mechs actually be beaten, and what does it cost?
 *
 * Not a pass/fail check — a measurement, to answer the only question that
 * matters about a boss for a nine-year-old: is it winnable by someone playing
 * reasonably, and does the second phase turn it from a fight into a wall?
 *
 * The bot here is deliberately mediocre. It walks at the mech, swings on a
 * timer, and backs off when it is hurt. It does not dodge charges, it does not
 * wait for the ice mech's shield, it does not read a wind-up. If *this* can
 * get there or close to it, a child who is actually paying attention will.
 */
import { chromium } from 'playwright'

const BASE = process.env.BASE ?? 'http://localhost:5199/'
const HEARTS = Number(process.env.HEARTS ?? 12)
/** Which blade the bot brings: the endgame Scythe by default. */
const SWORD = process.env.SWORD ?? 'goldenSword'
const browser = await chromium.launch({
  executablePath: process.env.CHROME ?? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
})
const page = await browser.newPage({ viewport: { width: 900, height: 820 } })
const errors = []
page.on('pageerror', (e) => errors.push(String(e)))

await page.goto(BASE, { waitUntil: 'networkidle' })
await page.evaluate(() => localStorage.removeItem('zsq.save'))
await page.reload({ waitUntil: 'networkidle' })
await page.getByRole('button', { name: /begin|continue/i }).click()
await page.waitForSelector('.game-canvas')
await page.waitForTimeout(300)
await page.evaluate((sword) => { window.__sword = sword }, SWORD)
await page.evaluate(() => window.zsq.enterLevel(2))
await page.waitForTimeout(600)

const CORES = { 1: 'rock-1-core', 2: 'rock-2-core', 3: 'rock-3-core', 4: 'rock-4-core' }
const KEYS = { left: 'ArrowLeft', right: 'ArrowRight', up: 'ArrowUp', down: 'ArrowDown' }
const results = {}

for (const n of [1, 2, 3, 4]) {
  await page.evaluate(
    ([id, hearts]) => {
      window.zsq.state.world.defeatedBosses = []
      for (const id of Object.keys(window.zsq.state.inventory)) {
        if (/Sword$/.test(id)) delete window.zsq.state.inventory[id]
      }
      window.zsq.state.inventory[window.__sword] = 1
      window.zsq.state.inventory.magicalShield = 1
      window.zsq.world.equipBest()
      window.zsq.goTo(id, 7, 9)
      // Full health each round, and no stacking containers between them —
      // the first pass of this file ended a fight with twenty-four hearts.
      const w = window.zsq.world.debugState()
      for (let i = w.hearts; i < hearts; i++) window.zsq.world.grantHeartContainer()
      window.zsq.world.debugHeal?.()
    },
    [CORES[n], HEARTS],
  )
  await page.waitForTimeout(500)

  const start = await page.evaluate(() => window.zsq.world.debugState())
  let held = null
  let sawRage = false
  let lowest = start.hearts
  let won = false
  const began = Date.now()

  // Sixty seconds of honest effort, a swing every third step.
  for (let tick = 0; tick < 500 && !won; tick++) {
    const s = await page.evaluate(() => window.zsq.world.debugState())
    if (s.screen !== CORES[n]) break // died and was carried out
    if ((s.mechs ?? []).some((m) => m.enraged)) sawRage = true
    lowest = Math.min(lowest, s.hearts)
    if ((s.defeatedBosses ?? []).includes(CORES[n])) { won = true; break }

    const target = (s.monsters ?? [])[0]
    if (!target) { won = (s.defeatedBosses ?? []).includes(CORES[n]); break }

    // Walk at it, favouring the longer axis.
    const dx = target.x - s.x
    const dy = target.y - s.y
    const want = Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? 'left' : 'right') : dy < 0 ? 'up' : 'down'
    if (held !== want) {
      if (held) await page.keyboard.up(KEYS[held])
      await page.keyboard.down(KEYS[want])
      held = want
    }
    await page.waitForTimeout(120)
    if (tick % 3 === 0) await page.keyboard.press('z')
  }
  if (held) { await page.keyboard.up(KEYS[held]); held = null }

  const end = await page.evaluate(() => window.zsq.world.debugState())
  results[`rock ${n}`] = {
    won: won || (end.defeatedBosses ?? []).includes(CORES[n]),
    survived: end.screen === CORES[n],
    heartsLost: start.hearts - lowest,
    heartsLeft: end.hearts,
    reachedSecondPhase: sawRage || n === 2,
    seconds: Math.round((Date.now() - began) / 1000),
  }
  // Clear the field before the next one.
  await page.evaluate(() => window.zsq.goTo('ship-bridge', 7, 6))
  await page.waitForTimeout(400)
}

console.log(JSON.stringify({ sword: SWORD, heartsCarried: HEARTS, results, errors }, null, 2))
await browser.close()
