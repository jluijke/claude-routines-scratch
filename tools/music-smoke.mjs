/**
 * Checks the music actually starts, changes with the room, goes quiet during
 * an exercise, and can be muted.
 */
import { chromium } from 'playwright'

const browser = await chromium.launch({
  executablePath: process.env.CHROME ?? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
  args: ['--autoplay-policy=no-user-gesture-required'],
})
const page = await browser.newPage({ viewport: { width: 900, height: 820 } })
const errors = []
page.on('pageerror', (e) => errors.push(String(e)))

await page.goto(process.env.BASE ?? 'http://localhost:5199/', { waitUntil: 'networkidle' })
await page.evaluate(() => localStorage.removeItem('zsq.save'))
await page.reload({ waitUntil: 'networkidle' })

const playing = () => page.evaluate(() => window.zsq.music.playing())

await page.getByRole('button', { name: /begin/i }).click()
await page.waitForSelector('.game-canvas')
await page.waitForTimeout(400)
const inWorld = await playing()

await page.evaluate(() => window.zsq.goTo('d1-hall', 7, 8))
await page.waitForTimeout(300)
const inDungeon = await playing()

await page.evaluate(() => window.zsq.goTo('d1-boss-room', 7, 8))
await page.waitForTimeout(300)
const atBoss = await playing()

await page.evaluate(() => window.zsq.goTo('forest-grotto', 7, 6))
await page.waitForTimeout(300)
const inCave = await playing()

// An exercise must run in silence: he has to hear the words.
await page.evaluate(() => window.zsq.startExercise(1))
await page.waitForSelector('.activity .q')
await page.waitForTimeout(300)
// JSON.stringify drops undefined, so state this as a boolean or "silent
// during the exercise" would simply vanish from the report.
const silentDuringExercise = (await playing()) === undefined

// And the mute toggle sticks.
await page.evaluate(() => window.zsq.enterWorld())
await page.waitForSelector('.game-canvas')
await page.waitForTimeout(300)
await page.evaluate(() => window.zsq.toggleMusic())
const mutedFlag = await page.evaluate(() => window.zsq.music.isMuted())
const stored = await page.evaluate(() => localStorage.getItem('zsq.music'))

console.log(JSON.stringify(
  { inWorld, inDungeon, atBoss, inCave, silentDuringExercise, mutedFlag, stored, errors },
  null,
  2,
))
await browser.close()
process.exit(errors.length === 0 ? 0 : 1)
