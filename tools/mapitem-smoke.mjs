/**
 * The map: finding it, and what it will and will not tell him.
 *
 * The whole point of hiding it behind a bombed boulder is that it is earned, so
 * the chain has to work end to end — buy a bomb, blast the rock, walk in, pick
 * it up. And the whole point of drawing it from `visitedScreens` is that it
 * records where he has been rather than telling him where to go, so the check
 * that matters most is the one asserting it stays quiet about a cave he has
 * never entered.
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
const has = (id) => page.evaluate((i) => (window.zsq.state.inventory[i] ?? 0) > 0, id)

await page.goto(BASE, { waitUntil: 'networkidle' })
await page.evaluate(() => localStorage.removeItem('zsq.save'))
await page.reload({ waitUntil: 'networkidle' })
await page.getByRole('button', { name: /begin|continue/i }).click()
await page.waitForSelector('.game-canvas')
await page.waitForTimeout(400)

// ------------------------------------------------- no map, and M says as much
check('he starts without a map', !(await has('map')))
await page.keyboard.press('m')
await page.waitForTimeout(300)
check('M does not open a map he has not got', (await world()).mapOpen === false)
const told = await page.evaluate(() => window.zsq.world.debugState().message ?? '')
check('but it tells him there is one', /no map/i.test(told))

// ----------------------------------------------------------- M is not music
// It used to be. If that binding came back, pressing M would silently mute the
// game instead of opening the map.
const musicBefore = await page.evaluate(() => window.zsq.music.isMuted())
await page.keyboard.press('m')
await page.waitForTimeout(200)
check('M no longer touches the music', (await page.evaluate(() => window.zsq.music.isMuted())) === musicBefore)
await page.keyboard.press('n')
await page.waitForTimeout(200)
check('N does', (await page.evaluate(() => window.zsq.music.isMuted())) !== musicBefore)
await page.keyboard.press('n')
await page.waitForTimeout(200)

// ------------------------------------------------ bomb the boulder and take it
await page.keyboard.press('Meta+Shift+P')
await page.waitForSelector('.dashboard')
await page.selectOption('.kit-select', 'bomb')
await page.getByRole('button', { name: /give it to him/i }).click()
await page.getByRole('button', { name: /^close$/i }).click()
await page.waitForTimeout(300)
check('the shop sells him bombs', await has('bomb'))

// Stand just above the cracked boulder at col 12, row 3 and drop one.
await page.evaluate(() => window.zsq.goTo('forest-3', 12, 2))
await page.waitForTimeout(400)
check('the Forest Path is two screens from the square', (await world()).screen === 'forest-3')

let blasted = false
for (let attempt = 0; attempt < 6 && !blasted; attempt++) {
  await page.evaluate(() => window.zsq.goTo('forest-3', 12, 2))
  await page.waitForTimeout(350)
  // Face the boulder first: the bomb lands ahead of him, and a bomb dropped
  // facing the wrong way is a bomb thrown at nothing.
  await page.keyboard.down('ArrowDown')
  await page.waitForTimeout(160)
  await page.keyboard.up('ArrowDown')
  await page.keyboard.press('x')
  // The fuse is a hundred frames, so a shade under two seconds.
  await page.waitForTimeout(2600)
  blasted = await page.evaluate(() =>
    window.zsq.state.world.brokenTiles.some((t) => t.startsWith('forest-3:')))
}
check('a bomb opens the cracked boulder', blasted)

// Walk down onto the opened tile — the boulder sits below where he stood.
let inside = false
for (let i = 0; i < 20 && !inside; i++) {
  await page.keyboard.down('ArrowDown')
  await page.waitForTimeout(110)
  await page.keyboard.up('ArrowDown')
  inside = (await world()).screen === 'map-cave'
}
check('the boulder opens onto a cave', inside)

// The map lies on the floor at col 7, row 4; he lands at 7,8 and walks up.
let took = false
for (let i = 0; i < 26 && !took; i++) {
  await page.keyboard.down('ArrowUp')
  await page.waitForTimeout(110)
  await page.keyboard.up('ArrowUp')
  took = await has('map')
}
check('the map is picked up by walking over it', took)

// ---------------------------------------------------------- M opens it now
await page.waitForTimeout(400)
await page.keyboard.press('m')
await page.waitForTimeout(400)
check('M opens the map', (await world()).mapOpen === true)
await page.keyboard.press('Escape')
await page.waitForTimeout(400)
check('Escape closes it', (await world()).mapOpen === false)

await page.keyboard.press('m')
await page.waitForTimeout(300)
await page.keyboard.press('m')
await page.waitForTimeout(300)
check('and M closes it too', (await world()).mapOpen === false)

// The world must actually hold still underneath, or something walks into him
// while he is reading.
await page.evaluate(() => window.zsq.goTo('forest-3', 7, 6))
await page.waitForTimeout(400)
await page.keyboard.press('m')
await page.waitForTimeout(300)
const stillA = await world()
await page.keyboard.down('ArrowLeft')
await page.waitForTimeout(400)
await page.keyboard.up('ArrowLeft')
const stillB = await world()
check('the world holds still while the map is up', stillA.x === stillB.x && stillA.y === stillB.y)
await page.keyboard.press('Escape')
await page.waitForTimeout(300)

// ------------------------------------------- what it shows, and what it hides
const visited = await page.evaluate(() => [...window.zsq.state.world.visitedScreens])
check('it knows where he has been', visited.includes('forest-3') && visited.includes('map-cave'))
check('and not where he has not', !visited.includes('lagoon-island') && !visited.includes('d1-hall'))

// The rule that makes it a record rather than a walkthrough: a door is only
// drawn once its far side has been seen. The village square has a cave mouth
// into the Hollow; he has never been in.
check('a cave he has never entered is not on the map yet', !visited.includes('hollow-cave'))
await page.evaluate(() => window.zsq.goTo('hollow-cave', 7, 8))
await page.waitForTimeout(500)
const after = await page.evaluate(() => [...window.zsq.state.world.visitedScreens])
check('and it is once he has been inside', after.includes('hollow-cave'))

// -------------------------------------------------- the island is on the map
// It is the exception to "places behind a door are not drawn": it sits in open
// water rather than through a doorway, and it is the one place he can strand
// himself, so it belongs on the map — west of the shore he flies from.
const island = await page.evaluate(() => {
  const layout = window.zsq.mapLayout()
  const isle = layout.find((c) => c.id === 'lagoon-island')
  const shore = layout.find((c) => c.id === 'lagoon-shore')
  return { isle, shore }
})
check('the island has a place on the map', Boolean(island.isle))
check('and it is west of the Long Water',
  Boolean(island.isle && island.shore) &&
    island.isle.x === island.shore.x - 1 &&
    island.isle.y === island.shore.y)

console.log(JSON.stringify({ failures, errors }, null, 2))
for (const f of failures) console.log('  FAILED:', f)
await browser.close()
process.exit(failures.length || errors.length ? 1 : 0)
