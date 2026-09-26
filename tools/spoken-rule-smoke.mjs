/**
 * The rule is read aloud: at the end of an exercise, and before a sack of
 * food. Checks that the panel asks the speech engine for the rule when it
 * appears, that the Hear-it button asks again, and that leaving cancels it.
 */
import { chromium } from 'playwright'
import { makeAnswerer } from './lib/answer.mjs'
const browser = await chromium.launch({ executablePath: process.env.CHROME ?? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' })
const page = await browser.newPage({ viewport: { width: 900, height: 760 } })
const errors = []
page.on('pageerror', (e) => errors.push(String(e)))
const { answerOne } = makeAnswerer(page)
const failures = []
const check = (name, ok) => { if (!ok) failures.push(name) }

await page.goto(process.env.BASE ?? 'http://localhost:5199/', { waitUntil: 'networkidle' })
await page.evaluate(() => localStorage.removeItem('zsq.save'))
await page.reload({ waitUntil: 'networkidle' })
await page.getByRole('button', { name: /begin|continue/i }).click()
await page.waitForSelector('.game-canvas')
// Tap the engine so we can see what it is asked to say.
await page.evaluate(() => {
  const s = window.zsq.speech
  window.__spoken = []
  const seq = s.speakSequence.bind(s)
  s.speakSequence = (parts, opts) => { window.__spoken.push(parts.join(' | ')); return seq(parts, opts) }
  const cancel = s.cancel.bind(s)
  window.__cancelled = 0
  s.cancel = () => { window.__cancelled += 1; return cancel() }
})

// ---- the reveal at the end of exercise 1
await page.evaluate(() => window.zsq.startExercise(1))
await page.waitForSelector('.exercise-screen .activity', { timeout: 10000 })
for (let i = 0; i < 16; i++) {
  if (await page.locator('.rule-reveal').count()) break
  if (!(await answerOne())) break
}
await page.waitForSelector('.rule-reveal', { timeout: 10000 })
await page.waitForTimeout(600)
const spoken = await page.evaluate(() => window.__spoken)
check('the rule is read aloud when the reveal appears', spoken.length >= 1)
check('and what is read is the rule, spelled out for the ear', /E, E|becomes|sound/.test(spoken[0] ?? ''))
check('and it does not contain a slash for the voice to trip on', !/\/[a-z]{1,4}\//.test(spoken[0] ?? ''))
await page.getByRole('button', { name: /hear the rule/i }).click()
await page.waitForTimeout(150)
check('the Hear-the-rule button reads it again', (await page.evaluate(() => window.__spoken.length)) >= 2)
const before = await page.evaluate(() => window.__cancelled)
await page.getByRole('button', { name: /back to the quest/i }).click()
await page.waitForTimeout(400)
check('leaving the reveal stops the voice', (await page.evaluate(() => window.__cancelled)) > before)

console.log(JSON.stringify({ spoken: spoken.map((s) => s.slice(0, 120)), failures, errors }, null, 2))
for (const f of failures) console.log('  FAILED:', f)
await browser.close()
process.exit(failures.length || errors.length ? 1 : 0)
