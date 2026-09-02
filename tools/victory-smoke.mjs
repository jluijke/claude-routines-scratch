/**
 * Killing a dungeon guardian should be an event.
 *
 * And it should stay killed. Until now the respawn guard named boss1 and boss2
 * by hand, so the guardians of the Ember Vault and the Sunless Spire came back
 * every time the room was re-entered — already recorded as defeated, with the
 * music already switched off the boss track. That is checked here for d3
 * specifically, because d3 is the one that was broken.
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

await page.goto(BASE, { waitUntil: 'networkidle' })
await page.evaluate(() => localStorage.removeItem('zsq.save'))
await page.reload({ waitUntil: 'networkidle' })
await page.getByRole('button', { name: /begin|continue/i }).click()
await page.waitForSelector('.game-canvas')
await page.waitForTimeout(300)

// Everything from the parent's testing kit: the best sword, and the hearts to
// survive long enough to use it.
await page.keyboard.press('Meta+Shift+P')
await page.waitForSelector('.dashboard')
await page.getByRole('button', { name: /give him everything/i }).click()
await page.getByRole('button', { name: /^close$/i }).click()
await page.waitForTimeout(300)

/** Chase the boss down and swing until it stops moving. */
async function killTheBossIn(screen) {
  await page.evaluate((s) => window.zsq.goTo(s, 7, 8), screen)
  await page.waitForTimeout(400)
  for (let swing = 0; swing < 400; swing++) {
    const state = await world()
    if (state.paused) return true
    const boss = state.monsters?.[0]
    if (!boss) return true
    // Close the bigger gap first, then the other, so a miss on one axis does
    // not leave the checker walking into a wall forever.
    const dx = boss.x - state.x
    const dy = boss.y - state.y
    const key = Math.abs(dx) > Math.abs(dy)
      ? (dx > 0 ? 'ArrowRight' : 'ArrowLeft')
      : (dy > 0 ? 'ArrowDown' : 'ArrowUp')
    await page.keyboard.down(key)
    await page.waitForTimeout(70)
    await page.keyboard.up(key)
    await page.keyboard.press('z')
    await page.waitForTimeout(40)
  }
  return false
}

// ------------------------------------------------------------- the first one
check('the first guardian can be killed', await killTheBossIn('d1-boss-room'))
await page.waitForSelector('.victory-panel', { timeout: 6000 })
check('the sign goes up', Boolean(await page.$('.victory-panel')))
const title = await page.textContent('.victory-title')
check('it says which level was completed', /Quest Level 1 Completed/.test(title ?? ''))
const progress = await page.textContent('.victory-progress')
check('and how many are left', /Defeat all 4 to reach the next world/.test(progress ?? ''))
check('with one crest filled in', (await page.locator('.victory-crowns li.won').count()) === 1)
check('out of four', (await page.locator('.victory-crowns li').count()) === 4)

await page.getByRole('button', { name: /onward/i }).click()
await page.waitForTimeout(400)
check('dismissing it hands the game back', (await world()).paused === false)
check('and the sign is gone', (await page.locator('.victory-panel').count()) === 0)
check('and he can move again', await (async () => {
  const before = (await world()).y
  await page.keyboard.down('ArrowDown'); await page.waitForTimeout(250); await page.keyboard.up('ArrowDown')
  return (await world()).y !== before
})())

// -------------------------------------------------- a dead boss stays dead
await page.evaluate(() => window.zsq.goTo('d1-hall', 7, 8))
await page.waitForTimeout(300)
await page.evaluate(() => window.zsq.goTo('d1-boss-room', 7, 8))
await page.waitForTimeout(500)
check('the first guardian does not come back', ((await world()).monsters ?? []).length === 0)
check('and the sign does not go up again', (await page.locator('.victory-panel').count()) === 0)

// ------------------------------- the third one, which used to respawn forever
check('the third guardian can be killed', await killTheBossIn('d3-boss-room'))
await page.waitForSelector('.victory-panel', { timeout: 6000 })
const third = await page.textContent('.victory-title')
check('the third dungeon is level 3', /Quest Level 3 Completed/.test(third ?? ''))
check('now two crests are filled', (await page.locator('.victory-crowns li.won').count()) === 2)
const thirdProgress = await page.textContent('.victory-progress')
check('and it counts down', /2 to go/.test(thirdProgress ?? ''))
await page.getByRole('button', { name: /onward/i }).click()
await page.waitForTimeout(400)

await page.evaluate(() => window.zsq.goTo('d3-hall', 7, 8))
await page.waitForTimeout(300)
await page.evaluate(() => window.zsq.goTo('d3-boss-room', 7, 8))
await page.waitForTimeout(500)
check('the THIRD guardian stays dead too', ((await world()).monsters ?? []).length === 0)

console.log(JSON.stringify({ failures, errors }, null, 2))
for (const f of failures) console.log('  FAILED:', f)
await browser.close()
process.exit(failures.length || errors.length ? 1 : 0)
