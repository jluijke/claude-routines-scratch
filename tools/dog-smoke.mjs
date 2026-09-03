/**
 * The dogs.
 *
 * There are two, in two places, met independently. Each joins whoever says
 * hello, walks along for a couple of screens biting things, and then goes for
 * good. The ones that matter most are the ones a child would be upset by: a dog
 * must not come back after leaving, meeting one must not use up the other, and
 * neither may touch a dungeon guardian — a dog chipping away at a boss takes
 * the fight off the child.
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
const goTo = async (id, col, row) => {
  await page.evaluate(([s, c, r]) => window.zsq.goTo(s, c, r), [id, col, row])
  await page.waitForTimeout(400)
}

await page.goto(BASE, { waitUntil: 'networkidle' })
await page.evaluate(() => localStorage.removeItem('zsq.save'))
await page.reload({ waitUntil: 'networkidle' })
await page.getByRole('button', { name: /begin|continue/i }).click()
await page.waitForSelector('.game-canvas')
await page.waitForTimeout(400)

// ------------------------------------------------------------- both are there
await goTo('village-north', 11, 6)
check('the first dog is waiting on the North Gate', Boolean((await world()).dog))
check('and is not following anyone yet', (await world()).dogScreensLeft === 0)
await goTo('river-north', 12, 5)
check('the second is out on the North Bank', Boolean((await world()).dog))
await goTo('village-north', 11, 6)

// ------------------------------------------------------- saying hello to him
let met = false
for (let i = 0; i < 12 && !met; i++) {
  await page.keyboard.down('ArrowDown')
  await page.waitForTimeout(140)
  await page.keyboard.up('ArrowDown')
  met = (await world()).dogScreensLeft > 0
}
check('walking up to him makes friends', met)
check('and he says so', /follow/i.test((await world()).message ?? ''))

// ----------------------------------------------------- he comes along, and bites
// Every change of screen spends one of his — including the ones this check
// makes, so it takes the short way to somewhere with monsters in it.
await goTo('forest-1', 7, 4)
const onNext = await world()
check('he follows onto the next screen', Boolean(onNext.dog))
check('with a screen still to go', onNext.dogScreensLeft >= 1)
await page.waitForTimeout(300)
// Total health across the room, which does not care about array order — the
// monsters move, and the list shifts the moment one of them dies.
const health = (list) => list.reduce((sum, m) => sum + m.hp, 0)
const before = (await world()).monsters ?? []
check('there is something for him to bite', before.length > 0)
// Stand on top of a monster so the dog closes on it.
await page.evaluate((m) => window.zsq.world.teleport('forest-1', Math.round(m.x / 16), Math.round(m.y / 16)), before[0])
await page.waitForTimeout(5000)
const after = (await world()).monsters ?? []
check('the dog bites what comes near', health(after) < health(before))

// ------------------------------------------------------------- and then he goes
// Two screens after the one they met on, he leaves — and stays gone.
for (let i = 0; i < 4; i++) {
  await goTo(i % 2 === 0 ? 'village-east' : 'village-square', 7, 6)
}
const later = await world()
check('he runs out of screens', later.dogScreensLeft === 0)
await page.waitForTimeout(2500)
check('and is gone from the screen', !(await world()).dog)

await goTo('village-square', 7, 6)
check('he does not come back', !(await world()).dog)
await goTo('village-north', 11, 6)
check('nor is he back where they met', !(await world()).dog)

// But the other one is untouched — that is the whole point of two of them.
await goTo('river-north', 12, 5)
check('the second dog is still waiting, further out', Boolean((await world()).dog))

let metAgain = false
for (let i = 0; i < 14 && !metAgain; i++) {
  await page.keyboard.down('ArrowUp')
  await page.waitForTimeout(140)
  await page.keyboard.up('ArrowUp')
  metAgain = (await world()).dogScreensLeft > 0
}
check('and can be made friends with in his own right', metAgain)

// --------------------------------------------- he leaves the guardians alone
// A fresh save, so there is a dog to bring, and a boss for him to ignore.
await page.evaluate(() => localStorage.removeItem('zsq.save'))
await page.reload({ waitUntil: 'networkidle' })
await page.getByRole('button', { name: /begin|continue/i }).click()
await page.waitForSelector('.game-canvas')
await page.waitForTimeout(400)
await page.evaluate(() => {
  // Straight to following, without walking the whole way there.
  window.zsq.state.world.dogScreensLeft = 3
  window.zsq.state.player.maxHearts = 20
  window.zsq.state.player.hearts = 20
})
await goTo('d1-boss-room', 7, 8)
await page.waitForTimeout(300)
const bossBefore = (await world()).monsters ?? []
check('there is a guardian to leave alone', bossBefore.length > 0)
check('and a dog in the room', Boolean((await world()).dog))
await page.waitForTimeout(4000)
const bossAfter = (await world()).monsters ?? []
check('the dog never touches a dungeon guardian',
  bossAfter.length === bossBefore.length &&
    bossAfter.every((m, i) => !bossBefore[i] || m.hp >= bossBefore[i].hp))

console.log(JSON.stringify({ failures, errors }, null, 2))
for (const f of failures) console.log('  FAILED:', f)
await browser.close()
process.exit(failures.length || errors.length ? 1 : 0)
