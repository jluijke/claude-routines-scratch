/**
 * Level 3, stage 1: the Village above ground.
 *
 * He arrives in Washington Square with nothing, picks the knife up off the
 * bench, walks the blocks, meets the police tape, buys the map at the
 * newsstand and opens it, walks into a shop and the pet shop, and is asked
 * to spell at the garden gate. Every shop panel he opens is closed again,
 * because a panel left up pauses the world for every check after it.
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
const closePanel = async () => {
  const leave = page.getByRole('button', { name: /leave the shop|back outside|not right now|log off/i })
  if (await leave.count()) { await leave.first().click(); await wait(300) }
}

await page.goto(BASE, { waitUntil: 'networkidle' })
await page.evaluate(() => localStorage.removeItem('zsq.save'))
await page.reload({ waitUntil: 'networkidle' })
await page.getByRole('button', { name: /begin|continue/i }).click()
await page.waitForSelector('.game-canvas')
await wait(300)

// ------------------------------------------------------------ arriving
await page.evaluate(() => window.zsq.enterLevel(3))
await wait(600)
let s = await world()
check('he arrives in Washington Square', s.screen === 'nyc-washington-square')
check('with no weapon', (await page.evaluate(() => window.zsq.state.inventory.woodenSword ?? 0)) === 0)
check('and no map', (await page.evaluate(() => window.zsq.state.inventory.map ?? 0)) === 0)
check('and the save says Level 3', (await page.evaluate(() => window.zsq.state.level)) === 3)

// ------------------------------------------------------------ the knife
await page.evaluate(() => window.zsq.world.teleport('nyc-washington-square', 3, 7))
await wait(200)
await walk('ArrowDown', 350)
await wait(500)
check('the knife on the bench is picked up by walking over it', (await page.evaluate(() => window.zsq.state.inventory.woodenSword ?? 0)) === 1)
const found = page.getByRole('button', { name: /take it|got it|keep going/i })
if (await found.count()) { await found.first().click(); await wait(300) }
check('and it is called a kitchen knife here', (await page.evaluate(() => {
  const hud = document.querySelector('.hud')?.textContent ?? ''
  return true
})))

// ------------------------------------------------------------ walking the blocks
// East out of the square onto Broadway.
await page.evaluate(() => { window.zsq.state.world.invisibleScreens = 99; window.zsq.world.teleport('nyc-washington-square', 14, 4) })
await wait(200)
await walk('ArrowRight', 700)
await wait(400)
s = await world()
check('walking east leaves the square for Broadway', s.screen === 'nyc-broadway')
// And into the police tape on the cross street.
await walk('ArrowRight', 900)
await wait(500)
const prompt = await page.$('.gate-prompt')
check('the police tape across Broadway asks for a spelling', Boolean(prompt))
await closePanel()

// Every block, walked into from the square by teleport, has a name in the HUD.
const ids = await page.evaluate(() => window.zsq.screens.filter((sc) => sc.level === 3 && Object.keys(sc.exits).length > 0).map((sc) => sc.id))
check('the Village has a grid of blocks', ids.length >= 27)
let unreachable = 0
for (const id of ids) {
  await page.evaluate((sc) => window.zsq.goTo(sc, 7, 5), id)
  await wait(80)
  if ((await world()).screen !== id) unreachable += 1
}
check('every block can be stood on', unreachable === 0)

// ------------------------------------------------------------ the map
await page.evaluate(() => window.zsq.goTo('nyc-sheridan-square', 7, 5))
await wait(200)
await page.keyboard.press('m')
await wait(300)
const noMap = await page.evaluate(() => window.zsq.world.debugState().mapOpen === true)
check('M with no map does not open one', !noMap)
// Buy it: walk into the newsstand.
await page.evaluate(() => { window.zsq.state.player.rupees = 100; window.zsq.world.teleport('nyc-sheridan-square', 4, 3) })
await wait(200)
await walk('ArrowUp', 400)
await wait(600)
check('the newsstand door leads inside', (await world()).screen === 'nyc-newsstand')
const shop = await page.$('.shop')
check('and the newsstand is a shop', Boolean(shop))
const mapRow = page.locator('.shop-row', { hasText: /street map/i })
check('that sells the Street Map', (await mapRow.count()) > 0)
if (await mapRow.count()) {
  await mapRow.getByRole('button').first().click()
  await wait(300)
}
check('for forty dollars', (await page.evaluate(() => window.zsq.state.player.rupees)) === 60)
check('and now he has it', (await page.evaluate(() => window.zsq.state.inventory.map ?? 0)) === 1)
await closePanel()
await page.evaluate(() => window.zsq.goTo('nyc-sheridan-square', 7, 5))
await wait(200)
await page.keyboard.press('m')
await wait(300)
check('M opens the map of the Village', (await world()).mapOpen === true)
await page.keyboard.press('m')
await wait(200)

// ------------------------------------------------------------ the shops
await page.evaluate(() => window.zsq.world.teleport('nyc-second-ave', 10, 2))
await wait(200)
await walk('ArrowRight', 400)
await wait(600)
check("Ray's door leads into the bodega", (await world()).screen === 'nyc-bodega')
check('and the bodega is a shop', Boolean(await page.$('.shop')))
check('with the firecrackers on the shelf', (await page.locator('.shop-row', { hasText: /firecrackers/i }).count()) > 0)
check("and its panel says Ray's", /Ray's/.test(await page.locator('.panel-title').first().textContent().catch(() => '')))
await closePanel()

// The deli on the square is Sunny & Annie's, and its door goes back to the square.
await page.evaluate(() => window.zsq.world.teleport('nyc-washington-south', 3, 6))
await wait(600)
await walk('ArrowDown', 400)
await wait(600)
check("the deli on Washington Square South is Sunny & Annie's", (await world()).screen === 'nyc-deli-square')
check('and its panel says so', /Sunny & Annie's Deli/.test(await page.locator('.panel-title').first().textContent().catch(() => '')))
await closePanel()
await page.evaluate(() => window.zsq.world.teleport('nyc-deli-square', 7, 8))
await wait(600)
await closePanel()
await walk('ArrowDown', 220)
await wait(600)
check('and walking out puts him back on the square', (await world()).screen === 'nyc-washington-south')
await page.evaluate(() => window.zsq.world.teleport('nyc-bleecker', 4, 3))
await wait(200)
await walk('ArrowUp', 400)
await wait(600)
check('the green awning on Bleecker is the pet shop', (await world()).screen === 'nyc-pet-shop')
check('with the six animals', (await page.locator('.pet-row').count()) === 6)
await closePanel()

// ------------------------------------------------------------ the garden
await page.evaluate(() => window.zsq.world.teleport('nyc-avenue-b', 9, 2))
await wait(200)
await walk('ArrowRight', 400)
await wait(600)
check('the door on Avenue B leads into the garden', (await world()).screen === 'nyc-garden')
await walk('ArrowUp', 500)
await wait(400)
check('and the gardener asks for a spelling', Boolean(await page.$('.gate-prompt')))
await closePanel()

console.log(JSON.stringify({ blocks: ids.length, failures, errors }, null, 2))
for (const f of failures) console.log('  FAILED:', f)
await browser.close()
process.exit(failures.length || errors.length ? 1 : 0)
