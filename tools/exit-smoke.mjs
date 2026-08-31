/**
 * Can he walk away from an exercise?
 *
 * A nine-year-old who hits a wall he cannot spell past has to be able to go and
 * do something else. That means: a visible way out, a question before it throws
 * the work away, the barrier still shut afterwards — and crucially, not being
 * grabbed by the same barrier the instant he is back in the world.
 */
import { chromium } from 'playwright'
import { makeAnswerer } from './lib/answer.mjs'

const OUT = '/tmp/claude-0/-home-user-claude-routines-scratch/6df0b2d4-03e5-5006-8fa7-f59d18d1702e/scratchpad'
const browser = await chromium.launch({
  executablePath: process.env.CHROME ?? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
})
const page = await browser.newPage({ viewport: { width: 1000, height: 900 } })
const errors = []
page.on('pageerror', (e) => errors.push(String(e)))

const { answerOne } = makeAnswerer(page)

const failures = []
const check = (name, ok) => { if (!ok) failures.push(name) }

await page.goto(process.env.BASE ?? 'http://localhost:5199/', { waitUntil: 'networkidle' })
await page.evaluate(() => localStorage.removeItem('zsq.save'))
await page.reload({ waitUntil: 'networkidle' })

// The title screen must offer a way in for a parent that no browser can steal.
await page.getByRole('button', { name: /for grown-ups/i }).click()
await page.waitForTimeout(300)
check('the title screen link opens the parent view', Boolean(await page.$('.dashboard')))
await page.getByRole('button', { name: /^close$/i }).click()
await page.waitForTimeout(200)

await page.getByRole('button', { name: /begin your quest/i }).click()
await page.waitForSelector('.game-canvas')

// Walk into the bridge barrier and accept, so there is a real gate in play.
await page.evaluate(() => window.zsq.goTo('river-south', 7, 7))
await page.waitForTimeout(300)
for (let i = 0; i < 12 && !(await page.$('.gate-prompt')); i++) {
  await page.keyboard.down('ArrowUp'); await page.waitForTimeout(140); await page.keyboard.up('ArrowUp')
}
check('the bridge barrier asks', Boolean(await page.$('.gate-prompt')))
await page.getByRole('button', { name: /open it/i }).click()
await page.waitForSelector('.exercise-screen', { timeout: 8000 })

const leave = page.getByRole('button', { name: /leave for now/i })
check('the way out is on screen', await leave.isVisible())
await page.screenshot({ path: `${OUT}/E01-exercise.png` })

// It asks first, and "Keep going" puts him back where he was.
const questionBefore = await page.getAttribute('.activity', 'data-question-id')
await leave.click()
await page.waitForTimeout(250)
check('leaving asks first', await page.locator('.leave-prompt').isVisible())
await page.screenshot({ path: `${OUT}/E02-leave-prompt.png` })
await page.getByRole('button', { name: /keep going/i }).click()
await page.waitForTimeout(250)
check('"keep going" returns to the same question',
  (await page.getAttribute('.activity', 'data-question-id')) === questionBefore)
check('and the buttons come back', await page.getByRole('button', { name: /^check$/i }).isVisible())

// Escape asks the same question.
await page.keyboard.press('Escape')
await page.waitForTimeout(250)
check('Escape asks too', await page.locator('.leave-prompt').isVisible())

// Play far enough to prove a pattern and be paid for it, so leaving has
// something to lose and the second run has something to double-pay.
await page.getByRole('button', { name: /keep going/i }).click()
await page.waitForTimeout(250)
for (let i = 0; i < 12; i++) {
  if (await page.evaluate(() => window.zsq.state.player.rupees) > 0) break
  if (await page.locator('.rule-reveal').count()) break
  if (!(await answerOne())) break
}
const rupeesBefore = await page.evaluate(() => window.zsq.state.player.rupees)
const paidBefore = await page.evaluate(() => [...window.zsq.state.spelling.paidConcepts])
check('proving a pattern pays rupees', rupeesBefore > 0)

await page.getByRole('button', { name: /leave for now/i }).click()
await page.waitForTimeout(200)
await page.getByRole('button', { name: /yes, leave/i }).click()
await page.waitForSelector('.game-canvas', { timeout: 8000 })
await page.waitForTimeout(900)

const afterLeaving = await page.evaluate(() => ({
  prompt: Boolean(document.querySelector('.gate-prompt')),
  openedGates: window.zsq.state.world.openedGates.length,
  inProgress: window.zsq.state.spelling.inProgress,
  screen: window.zsq.world.debugState().screen,
}))
// This is the trap: the world rebuilds him against the door he just left.
check('the barrier does not grab him again', !afterLeaving.prompt)
check('the barrier stays shut', afterLeaving.openedGates === 0)
check('nothing is left marked in progress', afterLeaving.inProgress === undefined)
await page.screenshot({ path: `${OUT}/E03-back-in-world.png` })

// And he can actually leave: walk away and change screen.
for (let i = 0; i < 16; i++) {
  await page.keyboard.down('ArrowDown'); await page.waitForTimeout(120); await page.keyboard.up('ArrowDown')
}
const movedAway = await page.evaluate(() => window.zsq.world.debugState().screen)
check('he can walk away and explore elsewhere', movedAway !== afterLeaving.screen)

// Walking back in restarts the exercise from the first question.
await page.evaluate(() => window.zsq.goTo('river-south', 7, 7))
await page.waitForTimeout(300)
for (let i = 0; i < 12 && !(await page.$('.gate-prompt')); i++) {
  await page.keyboard.down('ArrowUp'); await page.waitForTimeout(140); await page.keyboard.up('ArrowUp')
}
const cameBack = Boolean(await page.$('.gate-prompt'))
check('the barrier asks again once he comes back', cameBack)
if (!cameBack) {
  console.log('DEBUG', JSON.stringify(await page.evaluate(() => window.zsq.world.debugState())))
  await page.screenshot({ path: `${OUT}/E04-no-prompt.png` })
  await browser.close()
  process.exit(1)
}
await page.getByRole('button', { name: /open it/i }).click()
await page.waitForSelector('.exercise-screen', { timeout: 8000 })
const answered = await page.evaluate(() => document.querySelectorAll('.dot.done').length)
check('it starts again at the first question', answered === 0)

// Prove the same patterns again on this second run. They must not pay twice —
// otherwise leaving and restarting is a rupee printer.
for (let i = 0; i < 12; i++) {
  if (await page.locator('.rule-reveal').count()) break
  if (!(await answerOne())) break
  const paidNow = await page.evaluate(() => window.zsq.state.spelling.paidConcepts.length)
  if (paidNow > paidBefore.length) break
}
const rupeesAfter = await page.evaluate(() => window.zsq.state.player.rupees)
const paidAfter = await page.evaluate(() => [...window.zsq.state.spelling.paidConcepts])
const repaid = paidBefore.filter((c) => paidAfter.filter((p) => p === c).length > 1)
check('a pattern is never paid for twice', repaid.length === 0)
check('re-proving an already-paid pattern earns nothing',
  rupeesAfter - rupeesBefore < 10 * paidBefore.length || paidAfter.length > paidBefore.length)

// The run may have ended in the rule reveal rather than mid-question; either
// ending has to land him back in the world.
if (await page.locator('.rule-reveal').count()) {
  await page.getByRole('button', { name: /back to the quest/i }).click()
} else {
  await page.getByRole('button', { name: /leave for now/i }).click()
  await page.waitForTimeout(200)
  await page.getByRole('button', { name: /yes, leave/i }).click()
}
await page.waitForSelector('.game-canvas', { timeout: 8000 })

// The Mac chord, and no stacking.
await page.keyboard.press('Meta+Shift+P')
await page.waitForTimeout(350)
check('Cmd+Shift+P opens the parent view', Boolean(await page.$('.dashboard')))
await page.keyboard.press('Meta+Shift+P')
await page.keyboard.press('Control+Shift+P')
await page.waitForTimeout(300)
check('pressing it again does not stack panels', (await page.locator('.dashboard').count()) === 1)
await page.getByRole('button', { name: /^close$/i }).click()
await page.waitForTimeout(200)
await page.keyboard.press('Control+Shift+P')
await page.waitForTimeout(300)
check('Ctrl+Shift+P still works', Boolean(await page.$('.dashboard')))

console.log(JSON.stringify({ rupeesBefore, rupeesAfter, paidBefore, paidAfter, afterLeaving, movedAway, failures, errors }, null, 2))
for (const f of failures) console.log(`  FAILED: ${f}`)
await browser.close()
process.exit(failures.length === 0 && errors.length === 0 ? 0 : 1)
