/**
 * The grown-up's skip: Cmd/Ctrl+Shift+X finishes the exercise on screen.
 *
 * Three things have to hold, and the third is the one worth writing a check
 * for. It has to work at all; it has to open the door behind it; and it has to
 * leave the mastery record untouched, because that record is the whole reason
 * the parent screen exists. A skip that wrote perfect answers into it would
 * make the program lie about the child.
 *
 * It also proves the stale-listener case: the exercise screen's key listener
 * lived on the window and was never removed, so after one exercise a second
 * press used to re-fire the *first* screen's completion.
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
const save = () => page.evaluate(() => window.zsq.state)

await page.goto(BASE, { waitUntil: 'networkidle' })
await page.evaluate(() => localStorage.removeItem('zsq.save'))
await page.reload({ waitUntil: 'networkidle' })
await page.getByRole('button', { name: /begin your quest/i }).click()
await page.waitForSelector('.game-canvas')
await page.waitForTimeout(300)

// ------------------------------------------------- into a real, gated exercise
await page.evaluate(() => window.zsq.goTo('river-south', 7, 7))
await page.waitForTimeout(300)
for (let i = 0; i < 12 && !(await page.$('.gate-prompt')); i++) {
  await page.keyboard.down('ArrowUp'); await page.waitForTimeout(140); await page.keyboard.up('ArrowUp')
}
check('the bridge barrier asks', Boolean(await page.$('.gate-prompt')))
await page.getByRole('button', { name: /open it/i }).click()
await page.waitForSelector('.exercise-screen', { timeout: 8000 })

const before = await save()
const gate = await page.evaluate(() => window.zsq.state.spelling.inProgress)
check('the exercise is really running', typeof gate === 'number')

// --------------------------------------------------------------------- skip it
await page.keyboard.press('Meta+Shift+X')
await page.waitForSelector('.game-canvas', { timeout: 8000 })
await page.waitForTimeout(400)

const after = await save()
check('the skip ends the exercise', (await page.locator('.exercise-screen').count()) === 0)
check('and puts him back in the world', Boolean(await page.$('.game-canvas')))
check('the exercise counts as complete',
  after.spelling.completedExercises.length === before.spelling.completedExercises.length + 1)
check('nothing is left in progress', after.spelling.inProgress === undefined)
check('the barrier is open', after.world.openedGates.length > before.world.openedGates.length)

// The point of the whole check: the parent's record is untouched.
const attempts = (s) => Object.values(s.spelling.mastery ?? {})
  .reduce((n, m) => n + (m.attempts ?? 0) + (m.correctFirstTry ?? 0), 0)
check('no answers are recorded against him', attempts(after) === attempts(before))
check('no patterns are marked proved', JSON.stringify(after.spelling.mastery) === JSON.stringify(before.spelling.mastery))
// The door's own reward still lands — that is what opening it means, and it is
// what makes the skip useful for testing what lies beyond. What must not
// happen is being paid for spelling he did not do.
check('no pattern is paid out',
  JSON.stringify(after.spelling.paidConcepts) === JSON.stringify(before.spelling.paidConcepts))

// ------------------------------------------- the stale listener, twice over
// Back in the world with no exercise on screen, the chord must do nothing at
// all. The old screen's listener stayed on the window and would have completed
// its exercise again, against a door that closed long ago.
const idle = await save()
await page.keyboard.press('Meta+Shift+X')
await page.waitForTimeout(400)
const stillIdle = await save()
check('the chord does nothing outside an exercise',
  JSON.stringify(stillIdle.spelling.completedExercises) === JSON.stringify(idle.spelling.completedExercises))
check('and does not open a door on its own',
  stillIdle.world.openedGates.length === idle.world.openedGates.length)

// It works a second time, on a different barrier.
await page.evaluate(() => window.zsq.goTo('river-south', 7, 7))
await page.waitForTimeout(300)
for (let i = 0; i < 14 && !(await page.$('.gate-prompt')); i++) {
  await page.keyboard.down('ArrowUp'); await page.waitForTimeout(140); await page.keyboard.up('ArrowUp')
  await page.keyboard.down('ArrowRight'); await page.waitForTimeout(120); await page.keyboard.up('ArrowRight')
}
if (await page.$('.gate-prompt')) {
  await page.getByRole('button', { name: /open it/i }).click()
  await page.waitForSelector('.exercise-screen', { timeout: 8000 })
  const n = (await save()).spelling.completedExercises.length
  await page.keyboard.press('Control+Shift+X')
  await page.waitForSelector('.game-canvas', { timeout: 8000 })
  await page.waitForTimeout(400)
  const done = (await save()).spelling.completedExercises.length
  check('Ctrl+Shift+X works too, on the next barrier', done === n + 1)
}

console.log(JSON.stringify({ failures, errors }, null, 2))
for (const f of failures) console.log('  FAILED:', f)
await browser.close()
process.exit(failures.length || errors.length ? 1 : 0)
