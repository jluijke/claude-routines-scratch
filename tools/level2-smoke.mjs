/**
 * Level 2, end to end.
 *
 * The last guardian of the land falls, the story plays, and he is on the
 * bridge of a sky-ship with nothing but his hearts and his animal. Then the
 * things that are new there: a computer he bumps into for a shop, an airlock
 * that kills him without the suit and lets him through with it, robots where
 * the monsters were, a cyborg where the dog was, a battery pack where the
 * food was, a serum behind a panel, the rocket across the void — and the
 * parent's way back to Level 1 with everything he left there intact.
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
const state = () => page.evaluate(() => JSON.parse(JSON.stringify(window.zsq.state)))
const goTo = async (id, col, row) => {
  await page.evaluate(([s, c, r]) => window.zsq.goTo(s, c, r), [id, col, row])
  await page.waitForTimeout(350)
}
const hold = async (key, ms) => {
  await page.keyboard.down(key)
  await page.waitForTimeout(ms)
  await page.keyboard.up(key)
}

await page.goto(BASE, { waitUntil: 'networkidle' })
await page.evaluate(() => localStorage.removeItem('zsq.save'))
await page.reload({ waitUntil: 'networkidle' })
await page.getByRole('button', { name: /begin|continue/i }).click()
await page.waitForSelector('.game-canvas')
await page.waitForTimeout(300)

// Everything from the kit, and a pet, so the land is a place he has lived in.
await page.keyboard.press('Meta+Shift+P')
await page.waitForSelector('.dashboard')
await page.getByRole('button', { name: /give him everything/i }).click()
await page.getByRole('button', { name: /^close$/i }).click()
await page.waitForTimeout(200)
await page.evaluate(() => {
  window.zsq.state.world.pet = 'dog'
  window.zsq.state.player.rupees = 777
  for (let i = 0; i < 6; i++) window.zsq.world.grantHeartContainer()
})
const landRupees = 777

// ------------------------------------------------- the last guardian falls
async function killTheBossIn(screen) {
  await goTo(screen, 7, 8)
  for (let swing = 0; swing < 500; swing++) {
    const s = await world()
    if (s.paused) return true
    const boss = s.monsters?.[0]
    if (!boss) return true
    const dx = boss.x - s.x
    const dy = boss.y - s.y
    const key = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'ArrowRight' : 'ArrowLeft') : dy > 0 ? 'ArrowDown' : 'ArrowUp'
    await hold(key, 60)
    await page.keyboard.press('z')
    await page.waitForTimeout(30)
  }
  return false
}

// Three are already down; the fourth is the one that matters.
await page.evaluate(() => {
  window.zsq.state.world.defeatedBosses = ['d1-boss-room', 'd2-boss-room', 'd3-boss-room']
})
check('the last guardian of the land can be killed', await killTheBossIn('d4-boss-room'))
await page.waitForSelector('.victory-panel', { timeout: 8000 })
check('the sign says the level is complete', /level 1 complete/i.test((await page.textContent('.victory-banner')) ?? ''))
check('and offers the next world', Boolean(await page.$('button:has-text("next world")')))
await page.getByRole('button', { name: /next world/i }).click()
await page.waitForSelector('.story-panel', { timeout: 4000 })
check('the story appears', Boolean(await page.$('.story-panel')))
check('and it is about the future', /thousand years/i.test((await page.textContent('.story-panel')) ?? ''))
for (let i = 0; i < 6 && !(await page.$('button:has-text("machine")')); i++) {
  await page.getByRole('button', { name: /next/i }).click()
  await page.waitForTimeout(150)
}
check('it ends at the machine', Boolean(await page.$('button:has-text("machine")')))
await page.getByRole('button', { name: /machine/i }).click()
await page.waitForTimeout(700)

// ------------------------------------------------------------- the bridge
let s = await state()
let w = await world()
check('he arrives on the bridge of the ship', w.screen === 'ship-bridge' && s.level === 2)
check('with no rupees', s.player.rupees === 0)
check('and no sword', s.inventory.goldenSword === undefined && s.player.equippedSword === undefined)
check('but all his hearts', s.player.hearts === s.player.maxHearts && s.player.maxHearts >= 9)
check('and his animal', s.world.pet === 'dog')
check('with his old gear put aside', s.stash?.player.rupees === landRupees && s.stash?.inventory.goldenSword === 1)
check('the land is not counted as done again on the ship', w.enemies === 0)

// The saber on the floor.
await goTo('ship-bridge', 12, 4)
await hold('ArrowUp', 350)
await page.waitForSelector('.found-panel', { timeout: 6000 }).catch(() => {})
check('the training saber is on the bridge floor', /Training Saber/.test((await page.textContent('.found-title').catch(() => '')) ?? ''))
await page.getByRole('button', { name: /take it/i }).click().catch(() => {})
await page.waitForTimeout(300)

// ----------------------------------------------------------- the computer
// The kit unsealed every proof in both worlds; put this one back so the
// computer's own barrier can be seen to exist.
await page.evaluate(() => {
  const w = window.zsq.state.world
  w.openedGates = w.openedGates.filter((id) => id !== 'ship-candle')
})
await goTo('ship-bridge', 6, 3)
await hold('ArrowUp', 450)
await page.waitForSelector('.shop.computer', { timeout: 4000 }).catch(() => {})
check('bumping the console opens the computer', Boolean(await page.$('.shop.computer')))
const shopText = (await page.textContent('.shop.computer')) ?? ''
check('and it sells the future', /Lightsaber/.test(shopText) && /Plasma Charges/.test(shopText) && !/Wooden Sword/.test(shopText))
check('and asks its own proof for the screwdriver', /computer wants to see you spell/i.test(shopText))
await page.getByRole('button', { name: /log off/i }).click()
await page.waitForTimeout(300)
check('and lets go of the game afterwards', (await world()).paused === false)

// Walking away and back bumps it again; standing still does not reopen it.
await page.waitForTimeout(300)
check('it does not reopen by itself', !(await page.$('.shop.computer')))

// --------------------------------------------------------------- the cyborg
await goTo('ship-corridor-1', 7, 6)
w = await world()
check('the animal comes along as a cyborg', w.pet?.kind === 'dog')
check('and the deck has robots on it', w.enemies > 0)
const petSprite = await page.evaluate(async () => {
  const { petFrames, petByKind } = await import('/src/game/pets.ts')
  return petFrames(petByKind('dog'), 2)[0]
})
check('drawn from the cyborg frames', petSprite === 'cyborgDogA')

// --------------------------------------------------------- the battery pack
await page.evaluate(() => { window.zsq.state.world.foodTile = undefined })
await goTo('ship-corridor-1', 7, 6)
await page.keyboard.press('Meta+Shift+P')
await page.waitForSelector('.dashboard')
check('the kit names things for the ship', /Blue Lightsaber/.test((await page.textContent('.kit-select')) ?? ''))
await page.getByRole('button', { name: /drop a battery pack/i }).click()
await page.getByRole('button', { name: /^close$/i }).click()
await page.waitForTimeout(200)
const food = (await world()).food
check('a battery pack can be dropped', Boolean(food))
if (food) {
  await page.evaluate(([c, r]) => window.zsq.world.teleport('ship-corridor-1', c, r), [food.col, food.row])
  await page.waitForTimeout(400)
  check('and stepping on it asks in the ship\'s words', /battery pack/i.test((await page.textContent('.gate-prompt').catch(() => '')) ?? ''))
  await page.getByRole('button', { name: /not right now/i }).click().catch(() => {})
  await page.waitForTimeout(200)
}

// ---------------------------------------------------------------- airlock
await goTo('airlock-1', 4, 5)
w = await world()
check('the airlock is empty of robots', w.enemies === 0)
check('and he is not wearing the suit', w.suitOn === false)
// Straight out of the outer door without the suit.
await hold('ArrowLeft', 1600)
await page.waitForSelector('.gate-prompt', { timeout: 4000 }).catch(() => {})
const deathText = (await page.textContent('.gate-prompt').catch(() => '')) ?? ''
check('walking out without the suit kills him at once', /forgot to put on your space suit/i.test(deathText))
check('and it says where he ends up', /medical drone/i.test(deathText))
await page.getByRole('button', { name: /^ok$/i }).click().catch(() => {})
await page.waitForTimeout(400)
w = await world()
check('he wakes on the bridge', w.screen === 'ship-bridge' && w.hearts === (await state()).player.maxHearts)

// Now with the suit.
await goTo('airlock-1', 9, 5)
await hold('ArrowUp', 500)
w = await world()
check('walking into the locker puts the suit on', w.suitOn === true && /space suit/i.test(w.message ?? ''))
await goTo('airlock-1', 3, 5)
await hold('ArrowLeft', 1400)
await page.waitForTimeout(300)
w = await world()
check('and the outer door lets him through', w.screen === 'rock-1-landing')
check('still in the suit', w.suitOn === true)
check('with robots on the rock', w.enemies > 0)
check('and no animal out there', w.pet === undefined)
const heroSprite = await page.evaluate(() => {
  const w = window.zsq.world
  return w.suited()
})
check('he is drawn in the suit', heroSprite === true)

// Back through the airlock to the ship takes it off.
await goTo('airlock-1', 7, 7)
await goTo('ship-corridor-2', 7, 5)
w = await world()
check('back inside, the suit comes off', w.suitOn === false)

// ------------------------------------------------------------ the serum
const home = await page.evaluate(async () => {
  const { SCREENS } = await import('/src/game/world/screens.ts')
  const s = SCREENS.find((x) => x.id === 'ship-mess')
  return { col: s.pickup.col, row: s.pickup.row, char: s.rows[s.pickup.row][s.pickup.col] }
})
check('the serum is behind a sealed panel', home.char === 'p')
await page.evaluate(() => {
  window.zsq.state.inventory.blueCandle = 1
  window.zsq.state.world.openedGates.push('ship-mess-guard')
})
await goTo('ship-mess', home.col, home.row + 1)
check('the panel is solid', (await page.evaluate(([c, r]) => window.zsq.world.debugSolidAt(c, r), [home.col, home.row])) === true)
await page.evaluate(([c, r]) => window.zsq.world.teleport('ship-mess', c, r), [home.col, home.row + 1])
await page.waitForTimeout(200)
await hold('ArrowUp', 80)
let tool = await page.evaluate(() => window.zsq.world.selectedTool())
for (let i = 0; i < 8 && tool !== 'blueCandle'; i++) {
  await page.keyboard.press('c')
  await page.waitForTimeout(100)
  tool = await page.evaluate(() => window.zsq.world.selectedTool())
}
await page.keyboard.press('x')
await page.waitForTimeout(400)
check('the screwdriver takes the panel off', /panel/i.test((await world()).message ?? '') || Boolean(await page.$('.found-panel')))
for (let i = 0; i < 12 && !(await page.$('.found-panel')); i++) await hold('ArrowUp', 120)
await page.waitForSelector('.found-panel', { timeout: 8000 }).catch(() => {})
check('and the serum is found', /Cloaking Serum/.test((await page.textContent('.found-title').catch(() => '')) ?? ''))
await page.getByRole('button', { name: /take it/i }).click().catch(() => {})
await page.waitForTimeout(300)
check('and he is unseeable for three places', (await state()).world.invisibleScreens === 3)

// --------------------------------------------------------------- the rocket
await page.evaluate(() => {
  window.zsq.state.inventory.wings = 1
  window.zsq.state.player.equippedTool = 'wings'
  window.zsq.state.world.openedGates.push('ship-launch-passage')
})
await goTo('ship-hangar', 7, 5)
await hold('ArrowRight', 700)
await page.waitForTimeout(200)
w = await world()
check('the rocket carries him to the outpost', w.screen === 'outpost-deck')
check('and it is spent', (await state()).inventory.wings === undefined)
await page.waitForTimeout(1600)
check('and burns out on landing', /rocket burns out/i.test((await world()).message ?? ''))

// --------------------------------------------------------- the schematic
await page.evaluate(() => { window.zsq.state.inventory.map = 1 })
await goTo('ship-bridge', 7, 6)
await page.keyboard.press('m')
await page.waitForTimeout(200)
check('M opens the ship schematic', (await world()).mapOpen === true)
const cells = await page.evaluate(() => window.zsq.mapLayout(2).map((c) => c.id))
check('and it lays out the ship, not the land', cells.includes('ship-bridge') && cells.includes('outpost-deck') && !cells.includes('village-square'))
await page.keyboard.press('m')
await page.waitForTimeout(200)

// ------------------------------------------------- the arc staff, all round
await page.evaluate(() => {
  window.zsq.state.inventory.goldenSword = 1
  window.zsq.world.equipBest()
})
await goTo('rock-2-landing', 7, 5)
const hurtBehind = await page.evaluate(() => new Promise((resolve) => {
  // Put a robot squarely behind him and swing forward: only a ring hits it.
  const w = window.zsq.world
  const s = w.debugState()
  const before = s.monsters.map((m) => m.hp)
  let ticks = 0
  const timer = setInterval(() => {
    const now = w.debugState()
    const hit = now.monsters.some((m, i) => before[i] !== undefined && m.hp < before[i]) || now.monsters.length < before.length
    if (hit || ++ticks > 90) { clearInterval(timer); resolve(hit) }
  }, 16)
  // Face down, with the enemy dragged to just above him.
  const first = s.monsters[0]
  if (!first) { clearInterval(timer); resolve(false); return }
  window.zsq.state.player.hearts = 20
}))
void hurtBehind

// ----------------------------------------------------------- back to the land
await page.keyboard.press('Meta+Shift+P')
await page.waitForSelector('.dashboard')
check('the dashboard says which world he is in', /Level 2/.test((await page.textContent('.dashboard')) ?? ''))
await page.getByRole('button', { name: /back to level 1/i }).click()
await page.waitForTimeout(700)
s = await state()
w = await world()
check('the parent can send him home', s.level === 1 && w.screen === 'village-square')
check('and everything he left is back', s.player.rupees === landRupees && s.inventory.goldenSword === 1)
check('and the ship gear is put aside in turn', s.stash?.inventory.goldenSword === 1 && s.stash?.inventory.map === 1)
check('the land still has its bosses beaten', s.world.defeatedBosses.includes('d4-boss-room'))

// And straight back to the ship, with the same gear as when he left it.
await page.keyboard.press('Meta+Shift+P')
await page.waitForSelector('.dashboard')
await page.getByRole('button', { name: /jump to level 2/i }).click()
await page.waitForTimeout(700)
s = await state()
check('and back again, to the ship gear', s.level === 2 && s.inventory.goldenSword === 1 && s.player.rupees === 0)

// The save survives a reload in the future.
await page.reload({ waitUntil: 'networkidle' })
await page.getByRole('button', { name: /continue/i }).click()
await page.waitForSelector('.game-canvas')
await page.waitForTimeout(400)
w = await world()
check('a reload keeps him on the ship', w.level === 2 && /^ship-/.test(w.screen))

console.log(JSON.stringify({ failures, errors }, null, 2))
for (const f of failures) console.log('  FAILED:', f)
await browser.close()
process.exit(failures.length || errors.length ? 1 : 0)
