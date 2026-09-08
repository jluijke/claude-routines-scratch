/**
 * The animal, and the food that makes it fight.
 *
 * He chooses one in the cave off the North Gate and keeps it. It walks with him
 * above ground and waits behind when he goes under it. Every four screens a
 * sack of food turns up; four questions about one grammar rule earn it, and
 * then — and only then — the animal fights for him.
 *
 * The ones that matter most are the ones a child would be upset by: the animal
 * must not vanish, changing his mind must actually change the animal, an unfed
 * animal must not be quietly doing the fighting for him, and none of them may
 * ever touch a dungeon guardian.
 */
import { chromium } from 'playwright'
import { makeAnswerer } from './lib/answer.mjs'

const BASE = process.env.BASE ?? 'http://localhost:5199/'
const browser = await chromium.launch({
  executablePath: process.env.CHROME ?? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
})
const page = await browser.newPage({ viewport: { width: 1000, height: 900 } })
const errors = []
page.on('pageerror', (e) => errors.push(String(e)))

const { answerOne } = makeAnswerer(page)
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

// Hearts enough to stand still in a room full of monsters for a few seconds at
// a time. This check watches what the animal does; being carried home on three
// hearts halfway through is a different test.
await page.evaluate(() => {
  for (let i = 0; i < 12; i++) window.zsq.world.grantHeartContainer()
  window.zsq.world.heal(12)
})

// ------------------------------------------------------- nothing to start with
check('he starts with no animal', (await world()).pet === undefined)
await goTo('forest-1', 7, 6)
check('and none turns up on its own', (await world()).pet === undefined)

// --------------------------------------------------------------- the pet cave
// Walked to, not teleported: the mouth in the rocks by the North Gate has to be
// something a child can actually reach.
await goTo('village-north', 3, 6)
await page.keyboard.down('ArrowUp')
await page.waitForTimeout(500)
await page.keyboard.up('ArrowUp')
await page.waitForTimeout(700)
check('the mouth in the rocks leads to the pet cave', (await world()).screen === 'pet-cave')
check('and the keeper is waiting', Boolean(await page.$('.pet-shop')))
check('with all six animals', (await page.locator('.pet-row').count()) === 6)

await page.locator('.pet-row', { hasText: 'Wombat' }).getByRole('button').click()
await page.waitForTimeout(200)
check('choosing one keeps it', await page.evaluate(() => window.zsq.state.world.pet) === 'wombat')
await page.getByRole('button', { name: /back outside/i }).click()
await page.waitForTimeout(400)

// He can change his mind, which is the point of being able to come back.
await goTo('pet-cave', 7, 8)
await page.waitForSelector('.pet-shop')
await page.locator('.pet-row', { hasText: 'Kangaroo' }).getByRole('button').click()
await page.waitForTimeout(200)
check('and he can come back and swap', await page.evaluate(() => window.zsq.state.world.pet) === 'kangaroo')
await page.getByRole('button', { name: /back outside/i }).click()
await page.waitForTimeout(500)

// ------------------------------------------------------ it comes, and it waits
await goTo('village-north', 7, 6)
const out = await world()
check('it is at his heel above ground', Boolean(out.pet))
check('and it is the one he chose', out.pet?.kind === 'kangaroo')

await goTo('hollow-cave', 7, 8)
check('it waits outside a cave rather than following him down', (await world()).pet === undefined)
await goTo('village-square', 7, 6)
check('and is back when he comes out', Boolean((await world()).pet))

// ----------------------------------------------------------- unfed, it is calm
// The important half of the rule. An unfed animal that quietly kills things
// would make the food — and the grammar behind it — pointless.
await page.evaluate(() => { window.zsq.state.world.petFedScreens = 0 })
await goTo('forest-1', 7, 6)
await page.waitForTimeout(300)
const health = (list) => list.reduce((sum, m) => sum + m.hp, 0)
const before = (await world()).monsters ?? []
check('there is something it could attack', before.length > 0)
const calm = await page.evaluate(() => new Promise((resolve) => {
  let sawHunt = false
  let ticks = 0
  const timer = setInterval(() => {
    const s = window.zsq.world.debugState()
    if (s.pet?.hunting) sawHunt = true
    if (++ticks > 200) { clearInterval(timer); resolve({ sawHunt, hp: (s.monsters ?? []).reduce((n, m) => n + m.hp, 0) }) }
  }, 16)
}))
check('unfed, it never picks a fight', !calm.sawHunt)
check('and nothing loses any health to it', calm.hp >= health(before))

// ---------------------------------------------------------------- the food
// The village square, which has no barrier on it. Deep Forest has two, and a
// sack that lands near one puts the barrier's prompt over the food's. The
// wooden sword lies in the square, though, and stepping on that throws its own
// "you found" sign over everything — so it is out of the way first.
await page.evaluate(() => {
  window.zsq.state.world.screensSinceFood = 3
  window.zsq.state.world.takenChests.push('village-sword')
  window.zsq.state.inventory.woodenSword = 1
})
await goTo('village-square', 7, 6)
const arrived = await world()
check('a sack turns up on the fourth screen', Boolean(arrived.food))
check('and the count starts again', arrived.screensSinceFood === 0)

await page.evaluate((f) => window.zsq.world.teleport('village-square', f.col, f.row), arrived.food)
await page.waitForTimeout(600)
check('walking onto it asks first', Boolean(await page.$('.gate-prompt')))

// Saying no leaves it where it is, which matters on one heart.
await page.getByRole('button', { name: /not right now/i }).click()
await page.waitForTimeout(400)
check('saying no leaves the sack there', Boolean((await world()).food))

// Stepping off it and back on is what makes it ask again — otherwise the
// prompt would come straight back up on the tile he just said no on. Well
// clear of it, since the sack lands somewhere different every run.
await page.evaluate((f) => {
  window.zsq.world.teleport('village-square', f.col > 7 ? 2 : 13, f.row > 5 ? 2 : 8)
}, arrived.food)
await page.waitForTimeout(400)
await page.evaluate((f) => window.zsq.world.teleport('village-square', f.col, f.row), arrived.food)
await page.waitForTimeout(600)
check('walking back onto it asks again', Boolean(await page.$('.gate-prompt')))
await page.getByRole('button', { name: /take the challenge/i }).click()

// ------------------------------------------------- the rule, then the questions
await page.waitForSelector('.rule-preview', { timeout: 10000 })
check('the rule is explained before anything is asked', Boolean(await page.$('.reveal-text')))
await page.getByRole('button', { name: /i am ready/i }).click()
await page.waitForSelector('.exercise-screen .activity', { timeout: 10000 })
check('and then four questions, no more', (await page.locator('.progress-dots .dot').count()) === 4)

for (let i = 0; i < 8; i++) {
  if (await page.$('.found-panel')) break
  if (!(await answerOne())) break
}
await page.waitForTimeout(900)
check('answering them holds the sack up like a treasure', Boolean(await page.$('.found-panel')))
// Never a curriculum exercise: the forty are the forty.
check('and it does not count as one of the forty',
  (await page.evaluate(() => window.zsq.state.spelling.completedExercises.length)) === 0)
await page.getByRole('button', { name: /take it/i }).first().click()
await page.waitForTimeout(500)

const fed = await world()
check('the sack is gone once taken', fed.food === undefined)
check('and the animal is fed', fed.petFedScreens > 0)

// --------------------------------------------------------------- fed, it fights
await goTo('forest-1', 7, 6)
// Measured the instant he arrives, before anything else. A fed animal clears
// a small room in a couple of seconds, and a baseline taken after that is a
// baseline of an empty room.
const beforeFight = (await world()).monsters ?? []
check('there is something for a fed animal to fight', beforeFight.length > 0)
// Nothing is moved into place first. Teleporting him next to a monster
// reloads the screen, which respawns the room at full health — so the animal's
// work would be undone before it could be measured. It hunts from the moment
// it arrives; the sampler just has to watch.
const fight = await page.evaluate(() => new Promise((resolve) => {
  let sawHunt = false
  let farthest = 0
  let ticks = 0
  const timer = setInterval(() => {
    const s = window.zsq.world.debugState()
    if (s.pet) {
      if (s.pet.hunting) sawHunt = true
      farthest = Math.max(farthest, Math.hypot(s.pet.x + 6 - s.x, s.pet.y + 8 - s.y))
    }
    if (++ticks > 400) { clearInterval(timer); resolve({ sawHunt, farthest, hp: (s.monsters ?? []).reduce((n, m) => n + m.hp, 0) }) }
  }, 16)
}))
// The pair of these is what proves the food is doing the work: the same
// animal, on the same screen, with the same monsters, does nothing at all
// until it has been fed.
check('fed, it goes looking for a fight', fight.sawHunt)
check('and something loses health for it', fight.hp < health(beforeFight))
// Deliberately not asserted: how far it strays. It closes on whatever it has
// picked, but the monsters come to the hero as often as not, and how far the
// animal had to travel to reach one is the monsters' business.

// ------------------------------------------------------------ and then it lapses
await goTo('village-east', 7, 6)
check('the food is spent by the screen after next', (await world()).petFedScreens === 0)
check('but the animal is still with him', Boolean((await world()).pet))

// ------------------------------------------- it leaves the guardians alone
await page.evaluate(() => {
  window.zsq.state.world.petFedScreens = 4
  window.zsq.state.player.maxHearts = 20
  window.zsq.state.player.hearts = 20
})
await goTo('d1-boss-room', 7, 8)
await page.waitForTimeout(300)
const bossBefore = (await world()).monsters ?? []
check('there is a guardian to leave alone', bossBefore.length > 0)
await page.waitForTimeout(4000)
const bossAfter = (await world()).monsters ?? []
check('a fed animal never touches a dungeon guardian',
  bossAfter.length === bossBefore.length &&
    bossAfter.every((m, i) => !bossBefore[i] || m.hp >= bossBefore[i].hp))

console.log(JSON.stringify({ failures, errors }, null, 2))
for (const f of failures) console.log('  FAILED:', f)
await browser.close()
process.exit(failures.length || errors.length ? 1 : 0)
