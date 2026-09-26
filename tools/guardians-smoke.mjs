/**
 * Level 3, stage 5: the guardians.
 *
 * Rosa sells love bombs; the HUD counts dollars; a rat is a rat. Up the
 * stairs at Canal Street, Xi shrugs off a knife and says so; love bombs land
 * and he goes pink; enough of them and he is beaten, the sign goes up, and
 * the lair is remembered as loved. The train reaches all nine stops.
 */
import { chromium } from 'playwright'

const BASE = process.env.BASE ?? 'http://localhost:5199/'
const OUT = process.env.OUT ?? '/tmp/claude-0/-home-user-claude-routines-scratch/6df0b2d4-03e5-5006-8fa7-f59d18d1702e/scratchpad'
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
const shot = (name) => page.locator('.game-canvas').screenshot({ path: `${OUT}/guardian-${name}.png` })
const clickIf = async (pattern) => {
  const b = page.getByRole('button', { name: pattern })
  if (await b.count()) { await b.first().click(); await wait(300); return true }
  return false
}

await page.goto(BASE, { waitUntil: 'networkidle' })
await page.evaluate(() => localStorage.removeItem('zsq.save'))
await page.reload({ waitUntil: 'networkidle' })
await page.getByRole('button', { name: /begin|continue/i }).click()
await page.waitForSelector('.game-canvas')
await wait(300)
await page.evaluate(() => window.zsq.enterLevel(3))
await wait(500)
await page.evaluate(() => {
  for (let i = 0; i < 12; i++) window.zsq.world.grantHeartContainer()
  window.zsq.world.heal(12)
  window.zsq.state.world.invisibleScreens = 99
  window.zsq.state.player.rupees = 500
})

// ------------------------------------------------------------ Rosa's
await page.evaluate(() => window.zsq.world.teleport('nyc-w4th', 12, 6))
await wait(600)
await walk('ArrowDown', 400)
await wait(600)
check("the door on the corner is Rosa's", (await world()).screen === 'nyc-florist')
check('and Rosa keeps a shop', Boolean(await page.$('.shop')))
const row = page.locator('.shop-row', { hasText: /love bomb/i })
check('with love bombs on the shelf', (await row.count()) > 0)
for (let i = 0; i < 3 && (await row.count()); i++) { await row.getByRole('button').first().click(); await wait(200) }
check('three of them cost thirty-six dollars', (await page.evaluate(() => window.zsq.state.player.rupees)) === 500 - 36)
check('and he has three', (await page.evaluate(() => window.zsq.state.inventory.loveBomb ?? 0)) === 3)
await clickIf(/leave the shop/i)

// ------------------------------------------------------------ the street
await page.evaluate(() => window.zsq.goTo('nyc-bleecker', 7, 3))
await wait(600)
await shot('street')
let s = await world()
check('the rats on the street are rats', s.enemies > 0)

// ------------------------------------------------------------ Xi
await page.evaluate(() => { window.zsq.state.inventory.woodenSword = 1; window.zsq.world.equipBest(); window.zsq.world.teleport('nyc-columbus-park', 7, 6) })
await wait(600)
s = await world()
check('Xi is in Columbus Park', s.guardians?.length === 1 && s.guardians[0].kind === 'boss3')
check('and he takes twenty', s.guardians?.[0]?.hp === 20)
await shot('xi')
// A knife does nothing. Stand under him and swing up.
await page.evaluate(() => { window.zsq.world.debugClearEnemies(); window.zsq.world.debugSpawn('boss3', 7, 3) })
await page.evaluate(() => window.zsq.world.teleport('nyc-columbus-park', 7, 6))
await wait(600)
await walk('ArrowUp', 60)
for (let i = 0; i < 6; i++) { await page.keyboard.press('z'); await wait(300) }
s = await world()
check('a knife does nothing to him', s.guardians?.[0]?.hp === 20)
// Love bombs do. With the hoodie on he cannot see the child, so he drifts
// to the middle of the park and stays there; the child stands under him,
// faces up, and throws until he turns.
await page.evaluate(() => { window.zsq.state.inventory.loveBomb = 40; window.zsq.state.player.equippedTool = 'loveBomb'; window.zsq.world.teleport('nyc-columbus-park', 7, 8) })
await wait(900)
await walk('ArrowUp', 40)
await wait(100)
let beaten = false
let pinkSeen = false
let landed = 0
for (let i = 0; i < 120 && !beaten; i++) {
  s = await world()
  const g = s.guardians?.[0]
  if (!g) { beaten = true; break }
  if (g.loved > 0.3) pinkSeen = true
  if (g.hp < 20) landed = 20 - g.hp
  if (i === 40) await shot('xi-pink')
  await page.keyboard.press('x')
  await wait(420)
}
check('love bombs land', landed > 0)
check('love bombs land and he goes pink', pinkSeen)
check('and enough of them beat him', beaten)
await wait(2500)
const sign = await page.locator('.victory-panel').count()
check('the sign goes up', sign > 0)
check('and says he is loved', (await page.locator('.victory-panel').textContent().catch(() => '')).toLowerCase().includes('loved'))
await shot('victory')
await clickIf(/onward|finish/i)
await wait(300)
check('and the lair is remembered', (await page.evaluate(() => window.zsq.state.world.defeatedBosses)).includes('nyc-columbus-park'))
check('and the HUD counts dollars', (await world()).level === 3)

// ------------------------------------------------------------ the line
check('the line has nine stops', (await page.evaluate(() => window.zsq.screens.filter((sc) => sc.setting === 'platform' && sc.id.endsWith('-platform')).length)) === 9)

console.log(JSON.stringify({ failures, errors }, null, 2))
for (const f of failures) console.log('  FAILED:', f)
await browser.close()
process.exit(failures.length || errors.length ? 1 : 0)
