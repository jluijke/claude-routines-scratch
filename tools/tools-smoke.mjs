/**
 * Bombs and the candle: does blowing a cracked wall open actually reveal the
 * cave behind it, does burning a bush reveal the stairs under it, and do both
 * stay cleared after the game is closed and reopened?
 */
import { chromium } from 'playwright'

const BASE = process.env.BASE ?? 'http://localhost:5199/'
const OUT = '/tmp/claude-0/-home-user-claude-routines-scratch/6df0b2d4-03e5-5006-8fa7-f59d18d1702e/scratchpad'

const browser = await chromium.launch({
  executablePath: process.env.CHROME ?? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
})
const context = await browser.newContext({ viewport: { width: 900, height: 820 } })
const page = await context.newPage()
const errors = []
page.on('pageerror', (e) => errors.push(String(e)))

await page.goto(BASE, { waitUntil: 'networkidle' })
await page.evaluate(() => localStorage.removeItem('zsq.save'))
await page.reload({ waitUntil: 'networkidle' })
await page.getByRole('button', { name: /begin your quest/i }).click()
await page.waitForSelector('.game-canvas')

await page.evaluate(() => {
  const s = window.zsq.state
  s.player.rupees = 900
  s.inventory.bomb = 5
  s.inventory.blueCandle = 1
})

const state = () => page.evaluate(() => ({
  ...window.zsq.world.debugState(),
  broken: [...window.zsq.state.world.brokenTiles],
  bombs: window.zsq.state.inventory.bomb,
  tool: window.zsq.world.selectedTool(),
}))

// --- cycling the item slot ------------------------------------------------
const toolA = (await state()).tool
await page.click('.game-canvas', { position: { x: 5, y: 5 } })
await page.keyboard.press('c')
await page.waitForTimeout(150)
const toolB = (await state()).tool

// --- bomb a cracked wall in the village -----------------------------------
await page.evaluate(() => window.zsq.goTo('village-east', 11, 8))
await page.waitForTimeout(400)
// Face up toward the cracked wall at (11,7), then drop a bomb.
await page.keyboard.down('ArrowUp')
await page.waitForTimeout(120)
await page.keyboard.up('ArrowUp')
await page.evaluate(() => {
  // Make sure bombs are the selected tool whatever the cycle landed on.
  window.zsq.state.player.equippedTool = 'bomb'
})
await page.keyboard.press('x')
await page.screenshot({ path: `${OUT}/T01-bomb-lit.png` })
await page.waitForTimeout(2200)
await page.screenshot({ path: `${OUT}/T02-wall-open.png` })

const afterBomb = await state()

// Walk into the hole; it should lead to the blasted-open cave.
await page.keyboard.down('ArrowUp')
await page.waitForTimeout(1200)
await page.keyboard.up('ArrowUp')
await page.waitForTimeout(600)
const reachedCave = (await state()).screen
const shopOpen = await page.locator('.shop').count()
await page.screenshot({ path: `${OUT}/T03-bomb-shop.png` })
if (shopOpen) await page.getByRole('button', { name: /leave the shop/i }).click()

// --- burn a bush in the forest -------------------------------------------
await page.evaluate(() => {
  window.zsq.state.player.equippedTool = 'blueCandle'
  window.zsq.goTo('forest-1', 8, 9)
})
await page.waitForTimeout(400)
const beforeBurnScreen = await state()

// Step onto the hidden stairs first: it must NOT trigger while the bush stands.
await page.keyboard.down('ArrowUp')
await page.waitForTimeout(500)
await page.keyboard.up('ArrowUp')
await page.waitForTimeout(300)
const walkedOverBush = (await state()).screen

// Now burn it: stand one tile below and face up, without walking onto it.
await page.evaluate(() => window.zsq.goTo('forest-1', 8, 9))
await page.waitForTimeout(300)
await page.keyboard.down('ArrowUp')
await page.waitForTimeout(40)
await page.keyboard.up('ArrowUp')
await page.waitForTimeout(80)
await page.keyboard.press('x')
await page.waitForTimeout(600)
await page.screenshot({ path: `${OUT}/T04-bush-burned.png` })
const afterBurn = await state()

// Walking onto the revealed stairs. Forest Edge has a flyer in it that can
// knock him a few pixels sideways off the stairway, so line up and retry
// rather than treating a monster doing its job as a failure.
let reachedGrotto = (await state()).screen
for (let attempt = 0; attempt < 4 && reachedGrotto === 'forest-1'; attempt++) {
  await page.evaluate(() => window.zsq.goTo('forest-1', 8, 9))
  await page.waitForTimeout(200)
  await page.keyboard.down('ArrowUp')
  await page.waitForTimeout(700)
  await page.keyboard.up('ArrowUp')
  await page.waitForTimeout(400)
  reachedGrotto = (await state()).screen
}

// --- does it all survive a reload? ---------------------------------------
const brokenBefore = (await state()).broken
await page.close()
const page2 = await context.newPage()
page2.on('pageerror', (e) => errors.push(String(e)))
await page2.goto(BASE, { waitUntil: 'networkidle' })
await page2.getByRole('button', { name: /continue your quest/i }).click()
await page2.waitForSelector('.game-canvas')
const brokenAfter = await page2.evaluate(() => [...window.zsq.state.world.brokenTiles])

console.log(JSON.stringify({
  itemCycle: { from: toolA, to: toolB, changed: toolA !== toolB },
  bomb: { used: 5 - afterBomb.bombs, brokeTiles: afterBomb.broken, reachedCave, shopOpened: shopOpen === 1 },
  candle: {
    stairsHiddenWhileBushStood: walkedOverBush === 'forest-1',
    burnedTiles: afterBurn.broken.filter((k) => k.startsWith('forest-1')),
    burnedTheStairsBush: afterBurn.broken.includes('forest-1:8,8'),
    playerAtBurn: [afterBurn.x, afterBurn.y, afterBurn.facing],
    reachedGrotto,
  },
  persistence: { before: brokenBefore, after: brokenAfter, survived: JSON.stringify(brokenBefore) === JSON.stringify(brokenAfter) },
  startScreen: beforeBurnScreen.screen,
  errors,
}, null, 2))

await browser.close()
