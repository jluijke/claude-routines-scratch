/**
 * Does progress actually survive closing the game?
 *
 * Buys an item, opens a barrier, moves to another screen, then reloads the
 * page from scratch and checks everything came back — including the purchase,
 * the equipped gear, the opened door and where he was standing.
 */
import { chromium } from 'playwright'

const BASE = process.env.BASE ?? 'http://localhost:5199/'
const browser = await chromium.launch({
  executablePath: process.env.CHROME ?? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
})
const context = await browser.newContext({ viewport: { width: 900, height: 800 } })
const page = await context.newPage()
const errors = []
page.on('pageerror', (e) => errors.push(String(e)))

await page.goto(BASE, { waitUntil: 'networkidle' })
await page.evaluate(() => localStorage.removeItem('zsq.save'))
await page.reload({ waitUntil: 'networkidle' })

// --- first session --------------------------------------------------------
await page.getByRole('button', { name: /begin your quest/i }).click()
await page.waitForSelector('.game-canvas')

await page.evaluate(() => {
  const s = window.zsq.state
  s.player.rupees = 500
  s.spelling.completedExercises = [1, 2]
})

// Buy something in the shop.
await page.evaluate(() => window.zsq.goTo('shop-interior', 7, 6))
await page.waitForSelector('.shop')
await page.locator('.shop-row', { hasText: 'Metal Sword' }).getByRole('button', { name: 'Buy' }).click()
await page.locator('.shop-row', { hasText: 'Blue Candle' }).getByRole('button', { name: 'Buy' }).click()
await page.waitForTimeout(200)
await page.getByRole('button', { name: /leave the shop/i }).click()
await page.waitForTimeout(300)

// Open a barrier the honest way is slow, so mark one open and move screens.
await page.evaluate(() => {
  window.zsq.state.world.openedGates.push('village-north-seal')
  window.zsq.world.grantHeartContainer()
  window.zsq.world.grantHeartContainer()
})
await page.evaluate(() => window.zsq.goTo('village-square', 6, 6))
await page.waitForTimeout(600)

const before = await page.evaluate(() => {
  const s = window.zsq.state
  return {
    rupees: s.player.rupees,
    sword: s.player.equippedSword,
    inventory: { ...s.inventory },
    screen: s.player.screenId,
    x: Math.round(s.player.x),
    y: Math.round(s.player.y),
    hearts: s.player.hearts,
    maxHearts: s.player.maxHearts,
    opened: [...s.world.openedGates],
    completed: [...s.spelling.completedExercises],
    playSeconds: s.pacing.playSeconds,
  }
})

// --- close the game entirely and come back --------------------------------
await page.close()
const page2 = await context.newPage()
const errors2 = []
page2.on('pageerror', (e) => errors2.push(String(e)))
await page2.goto(BASE, { waitUntil: 'networkidle' })

const titleButton = await page2.getByRole('button', { name: /continue your quest|begin your quest/i }).textContent()
await page2.getByRole('button', { name: /continue your quest|begin your quest/i }).click()
await page2.waitForSelector('.game-canvas')
await page2.waitForTimeout(400)

const after = await page2.evaluate(() => {
  const s = window.zsq.state
  const live = window.zsq.world?.debugState()
  return {
    rupees: s.player.rupees,
    sword: s.player.equippedSword,
    inventory: { ...s.inventory },
    screen: live?.screen,
    x: live?.x,
    y: live?.y,
    hearts: live?.hearts,
    maxHearts: s.player.maxHearts,
    opened: [...s.world.openedGates],
    completed: [...s.spelling.completedExercises],
    playSeconds: s.pacing.playSeconds,
  }
})

// Export / import round trip through the parent dashboard.
await page2.keyboard.press('Control+Shift+P')
await page2.waitForSelector('.dashboard')
const exported = await page2.evaluate(async () => {
  const { serialise } = await import('/src/core/save.ts')
  return serialise(window.zsq.state)
})
const hasExportButton = await page2.getByRole('button', { name: /download progress file/i }).count()
const hasImport = await page2.locator('input[type="file"]').count()

const reimported = await page2.evaluate(async (text) => {
  const { deserialise } = await import('/src/core/save.ts')
  const restored = deserialise(text)
  return {
    rupees: restored.player.rupees,
    inventory: { ...restored.inventory },
    opened: [...restored.world.openedGates],
    completed: [...restored.spelling.completedExercises],
  }
}, exported)

console.log(JSON.stringify({
  titleButton: titleButton?.trim(),
  before,
  after,
  survived: {
    rupees: before.rupees === after.rupees,
    purchases: JSON.stringify(before.inventory) === JSON.stringify(after.inventory),
    equipped: before.sword === after.sword,
    screen: before.screen === after.screen,
    position: Math.abs(before.x - after.x) < 3 && Math.abs(before.y - after.y) < 3,
    hearts: before.hearts === after.hearts && before.maxHearts === after.maxHearts,
    openedGates: JSON.stringify(before.opened) === JSON.stringify(after.opened),
    exercises: JSON.stringify(before.completed) === JSON.stringify(after.completed),
  },
  fileExport: { button: hasExportButton === 1, importField: hasImport === 1, roundTrip: reimported },
  errors: [...errors, ...errors2],
}, null, 2))

await browser.close()
