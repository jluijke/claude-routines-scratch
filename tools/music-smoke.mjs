/**
 * Does music actually come out?
 *
 * The old version of this check could not tell. It launched Chromium with
 * --autoplay-policy=no-user-gesture-required, which switches off the exact
 * browser rule the game was falling foul of, and then read music.playing() —
 * a field the old code set whether or not a single note was audible. It printed
 * seven values for a human to look at and asserted nothing at all. The game was
 * silent for weeks with this passing.
 *
 * So: the real autoplay policy, and the audio clock as the witness. A suspended
 * AudioContext has a frozen currentTime; one that is genuinely running does not.
 * That is the one thing a state field cannot fake.
 */
import { chromium } from 'playwright'

const BASE = process.env.BASE ?? 'http://localhost:5199/'
// Deliberately no --autoplay-policy flag: the child's browser will not have one.
const browser = await chromium.launch({
  executablePath: process.env.CHROME ?? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
})
const page = await browser.newPage({ viewport: { width: 900, height: 820 } })
const errors = []
page.on('pageerror', (e) => errors.push(String(e)))

const failures = []
const check = (name, ok) => { if (!ok) failures.push(name) }
const status = () => page.evaluate(() => window.zsq.music.status())

/** True if the audio clock moves — i.e. sound is really being produced. */
async function clockRuns() {
  const first = await status()
  await page.waitForTimeout(320)
  const second = await status()
  return second.clock > first.clock
}

await page.goto(BASE, { waitUntil: 'networkidle' })
await page.evaluate(() => localStorage.removeItem('zsq.save'))
await page.evaluate(() => localStorage.removeItem('zsq.music'))
await page.reload({ waitUntil: 'networkidle' })
await page.waitForTimeout(300)

// ---------------------------------------------------- before the first click
// Nothing has been touched, so nothing may claim to be playing. The title tune
// is *wanted*, and that is a different thing.
const cold = await status()
// The decisive one, and it does not depend on how strict this browser is about
// autoplay: no audio context may exist at all yet. The old code built one at
// page load, the browser suspended it, and nothing could ever revive it — which
// is why the game was silent on a real Mac but fine in a lenient headless run.
check('no audio context is built before the child clicks', cold.state === 'none')
check('no track is playing before the child clicks', cold.track === undefined)
check('the title tune is queued up, though',
  (await page.evaluate(() => window.zsq.music.requested())) === 'title')

// ------------------------------------------------------- and after the click
await page.getByRole('button', { name: /begin/i }).click()
await page.waitForSelector('.game-canvas')
await page.waitForTimeout(500)

const warm = await status()
check('the audio context is running once he has clicked', warm.state === 'running')
check('a track is playing', typeof warm.track === 'string')
check('and the audio clock is actually advancing', await clockRuns())

// ------------------------------------------------------ it follows the rooms
const trackAt = async (screen, col, row) => {
  await page.evaluate(([s, c, r]) => window.zsq.goTo(s, c, r), [screen, col, row])
  await page.waitForTimeout(320)
  return (await status()).track
}
const overworld = await trackAt('village-square', 7, 6)
const dungeon = await trackAt('d1-hall', 7, 8)
const boss = await trackAt('d1-boss-room', 7, 8)
const cave = await trackAt('forest-grotto', 7, 6)
check('the overworld has a tune', overworld === 'overworld')
check('a dungeon sounds different from the overworld', dungeon === 'dungeon')
check('a boss room sounds different again', boss === 'boss')
check('and a cave different from all of them', cave === 'cave')

// ------------------------------------------------- silence during a spelling
// He has to hear the word being read out; a tune under it makes that harder for
// exactly the child who needs it clearest.
await page.evaluate(() => window.zsq.startExercise(1))
await page.waitForSelector('.exercise-screen')
await page.waitForTimeout(300)
check('an exercise runs in silence', (await status()).track === undefined)

await page.evaluate(() => window.zsq.enterWorld())
await page.waitForSelector('.game-canvas')
await page.waitForTimeout(400)
check('and the music comes back afterwards', (await status()).track !== undefined)
check('really back, not just claiming to be', await clockRuns())

// -------------------------------------------- the review-challenge dead end
// An optional barrier, touched before he has finished a single exercise, used
// to stop the music and then bail out with nothing on that path to start it
// again. Driven through the real prompt, not a back door.
await page.evaluate(() => window.zsq.goTo('forest-4', 7, 5))
await page.waitForTimeout(350)
for (let i = 0; i < 14 && !(await page.$('.gate-prompt')); i++) {
  await page.keyboard.down('ArrowUp'); await page.waitForTimeout(130); await page.keyboard.up('ArrowUp')
}
check('the optional chest asks', Boolean(await page.$('.gate-prompt')))
await page.getByRole('button', { name: /take the challenge|open it/i }).first().click()
await page.waitForTimeout(400)
// He has learned nothing yet, so it declines and sends him back to the world.
const ok = page.getByRole('button', { name: /^ok$/i })
if (await ok.count()) await ok.first().click()
await page.waitForTimeout(500)
check('the music survives a barrier he cannot yet attempt', (await status()).track !== undefined)
check('and is still really sounding', await clockRuns())

// --------------------------------------------------------- mute, and it stays
await page.evaluate(() => window.zsq.toggleMusic())
await page.waitForTimeout(200)
check('m mutes', await page.evaluate(() => window.zsq.music.isMuted()))
check('and the choice is remembered', (await page.evaluate(() => localStorage.getItem('zsq.music'))) === 'off')

await page.reload({ waitUntil: 'networkidle' })
await page.getByRole('button', { name: /begin|continue/i }).click()
await page.waitForSelector('.game-canvas')
await page.waitForTimeout(400)
check('and it survives a reload', await page.evaluate(() => window.zsq.music.isMuted()))

await page.evaluate(() => window.zsq.toggleMusic())
await page.waitForTimeout(300)
check('unmuting brings it back', !(await page.evaluate(() => window.zsq.music.isMuted())))
check('audibly', await clockRuns())

console.log(JSON.stringify({ failures, errors }, null, 2))
for (const f of failures) console.log('  FAILED:', f)
await browser.close()
process.exit(failures.length || errors.length ? 1 : 0)
