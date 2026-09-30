/**
 * Everything he can own, he can reach — in all three worlds.
 *
 * The parent panel hands over the whole kit; then C is pressed until the
 * B slot has come round, and every tool he owns must have been offered on
 * the way; and Q is pressed until the weapon has come round, and every
 * weapon he owns must have been in his hand. Then every tool is used once
 * with X, and nothing may break. Then the things that come into his hands
 * one at a time: the sword on the grass, a knife on a bench, a weapon
 * bought over a counter, a tool bought for the first time, a single item
 * from the parent panel — each must be in his hand the moment he has it.
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
const wait = (ms) => page.waitForTimeout(ms)
const world = () => page.evaluate(() => window.zsq.world.debugState())
const walk = async (key, ms) => { await page.keyboard.down(key); await wait(ms); await page.keyboard.up(key) }
const inventory = () => page.evaluate(() => ({ ...window.zsq.state.inventory }))
const lists = () => page.evaluate(() => ({ tools: window.zsq.toolSlot, weapons: window.zsq.weaponOrder }))
const fresh = async (level) => {
  await page.goto(BASE, { waitUntil: 'networkidle' })
  await page.evaluate(() => localStorage.removeItem('zsq.save'))
  await page.reload({ waitUntil: 'networkidle' })
  await page.getByRole('button', { name: /begin|continue/i }).click()
  await page.waitForSelector('.game-canvas')
  await wait(300)
  if (level !== 1) {
    await page.evaluate((l) => window.zsq.enterLevel(l), level)
    await wait(600)
  }
}
const openDashboard = async () => {
  await page.keyboard.press('Control+Shift+P')
  await wait(500)
  check('the parent panel opens', (await page.locator('.dashboard').count()) === 1)
}
const closeDashboard = async () => {
  await page.getByRole('button', { name: /^close$/i }).first().click()
  await wait(300)
}
const dismissAny = async () => {
  for (let i = 0; i < 4; i++) {
    const b = page.getByRole('button', { name: /take it|ok|got it|onward|→|continue/i })
    if (!(await b.count())) break
    await b.first().click()
    await wait(250)
  }
}

for (const level of [1, 2, 3]) {
  await fresh(level)
  await openDashboard()
  await page.getByRole('button', { name: /give him everything/i }).click()
  await wait(300)
  await closeDashboard()
  const inv = await inventory()
  const { tools, weapons } = await lists()
  const ownedTools = tools.filter((id) => (inv[id] ?? 0) > 0)
  const ownedWeapons = weapons.filter((id) => (inv[id] ?? 0) > 0)
  check(`L${level}: the kit is a real kit`, ownedTools.length >= 5 && ownedWeapons.length >= 3)

  // C, all the way round.
  const seenTools = new Set([(await world()).tool])
  for (let i = 0; i < ownedTools.length + 2; i++) {
    await page.keyboard.press('c')
    await wait(90)
    seenTools.add((await world()).tool)
  }
  for (const id of ownedTools) check(`L${level}: C reaches the ${id}`, seenTools.has(id))
  check(`L${level}: C offers nothing he does not own`, [...seenTools].every((id) => ownedTools.includes(id)))

  // Q, all the way round.
  const seenWeapons = new Set([(await world()).held])
  for (let i = 0; i < ownedWeapons.length + 2; i++) {
    await page.keyboard.press('q')
    await wait(90)
    seenWeapons.add((await world()).held)
  }
  for (const id of ownedWeapons) check(`L${level}: Q reaches the ${id}`, seenWeapons.has(id))
  check(`L${level}: Q holds nothing he does not own`, [...seenWeapons].every((id) => ownedWeapons.includes(id)))

  // Every tool used once. Nothing may throw.
  const before = errors.length
  for (let i = 0; i < ownedTools.length; i++) {
    await page.keyboard.press('c')
    await wait(90)
    await page.keyboard.press('x')
    await wait(250)
    await dismissAny()
  }
  check(`L${level}: every tool can be used without breaking`, errors.length === before)
  // And every weapon swung or fired once.
  for (let i = 0; i < ownedWeapons.length; i++) {
    await page.keyboard.press('q')
    await wait(90)
    await page.keyboard.press('z')
    await wait(200)
  }
  check(`L${level}: every weapon can be swung without breaking`, errors.length === before)
}

// ------------------------------------------------------------ one at a time
// The sword on the grass in the village.
await fresh(1)
await page.evaluate(() => window.zsq.world.teleport('village-square', 12, 7))
await wait(300)
await walk('ArrowDown', 500)
await wait(1500)
await dismissAny()
check('the wooden sword is in his hand the moment it is found', (await world()).held === 'woodenSword')

// A weapon bought over the counter goes into his hand; the old one is a key away.
await page.evaluate(() => { window.zsq.state.player.rupees = 999; window.zsq.world.teleport('shop-interior', 7, 7) })
await wait(600)
let buy = page.locator('.shop-row', { hasText: /metal sword/i }).getByRole('button', { name: /buy/i })
check('the village shop sells the metal sword', (await buy.count()) === 1)
await buy.first().click()
await wait(300)
check('bought, it is in his hand', (await world()).held === 'metalSword')
await page.getByRole('button', { name: /leave the shop/i }).click()
await wait(300)
await page.keyboard.press('q')
await wait(100)
check('and Q brings the wooden one back', (await world()).held === 'woodenSword')
await page.keyboard.press('q')
await wait(100)
check('and Q again the metal one', (await world()).held === 'metalSword')

// A tool bought for the first time goes into the B slot; restocking it does not move the slot.
await page.evaluate(() => window.zsq.world.teleport('shop-interior', 7, 7))
await wait(600)
buy = page.locator('.shop-row', { hasText: /^(?!.*sword).*bombs/i }).getByRole('button', { name: /buy/i })
await buy.first().click()
await wait(300)
check('the first bombs go into the B slot', (await world()).tool === 'bomb')
buy = page.locator('.shop-row', { hasText: /bait/i }).getByRole('button', { name: /buy/i })
await buy.first().click()
await wait(300)
check('the first bait goes into the B slot', (await world()).tool === 'bait')
buy = page.locator('.shop-row', { hasText: /^(?!.*sword).*bombs/i }).getByRole('button', { name: /buy/i })
await buy.first().click()
await wait(300)
check('more bombs leave the bait where it was', (await world()).tool === 'bait')
await page.getByRole('button', { name: /leave the shop/i }).click()
await wait(300)

// A single weapon from the parent panel, weaker than the one in his hand.
await fresh(3)
await page.evaluate(() => { window.zsq.state.inventory.metalSword = 1; window.zsq.world.equipBest() })
await wait(100)
check('holding the hammer', (await world()).held === 'metalSword')
await openDashboard()
await page.locator('select.kit-select').selectOption('taser')
await page.getByRole('button', { name: /give it to him/i }).click()
await wait(200)
await closeDashboard()
check('the taser from the parent panel is in his hand at once', (await world()).held === 'taser')
await page.keyboard.press('q')
await wait(100)
check('and Q swaps back to the hammer', (await world()).held === 'metalSword')
await page.keyboard.press('q')
await wait(100)
check('and Q again to the taser', (await world()).held === 'taser')

// The knife on the bench in Washington Square.
await fresh(3)
await page.evaluate(() => { window.zsq.world.teleport('nyc-washington-square', 3, 6); window.zsq.world.debugClearEnemies() })
await wait(300)
await walk('ArrowDown', 500)
await wait(1500)
await dismissAny()
check('the knife is in his hand the moment it is found', (await world()).held === 'woodenSword')

console.log(JSON.stringify({ failures, errors }, null, 2))
for (const f of failures) console.log('  FAILED:', f)
await browser.close()
process.exit(failures.length || errors.length ? 1 : 0)
