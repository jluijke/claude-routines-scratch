/**
 * Plays every exercise in the curriculum through to its rule reveal, in one
 * browser session, answering everything correctly.
 *
 * This catches content that is unanswerable as authored, which no amount of
 * static validation can. It drives the same UI a child does, and takes its
 * answers from the app's own grading module rather than re-implementing the
 * content.
 */
import { chromium } from 'playwright'
import { makeAnswerer } from './lib/answer.mjs'

const BASE = process.env.BASE ?? 'http://localhost:5199/'
const ONLY = process.env.EXERCISE ? Number(process.env.EXERCISE) : undefined

const browser = await chromium.launch({
  executablePath: process.env.CHROME ?? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
})
const page = await browser.newPage({ viewport: { width: 900, height: 800 } })
const pageErrors = []
page.on('pageerror', (e) => pageErrors.push(String(e)))

await page.goto(BASE, { waitUntil: 'networkidle' })
await page.evaluate(() => localStorage.removeItem('zsq.save'))
await page.reload({ waitUntil: 'networkidle' })
await page.getByRole('button', { name: /begin your quest|continue/i }).click()
await page.waitForSelector('.game-canvas')

const total = await page.evaluate(async () => {
  const mod = await import('/src/content/exercises/index.ts')
  return mod.EXERCISES.length
})

const { expected, answerQuestion } = makeAnswerer(page)

const results = []
const from = ONLY ?? 1
const to = ONLY ?? total

for (let id = from; id <= to; id++) {
  await page.evaluate((n) => window.zsq.startExercise(n), id)
  await page.locator('.activity .q').first().waitFor({ timeout: 15000 })

  const types = new Set()
  let steps = 0
  let completed = false
  let stalled = null

  while (steps++ < 90) {
    if (await page.locator('.rule-reveal').count()) {
      completed = true
      break
    }
    const info = await expected()
    if (!info) break
    const { question, answer } = info
    types.add(question.type)

    try {
      await answerQuestion(question, answer)
    } catch (error) {
      stalled = `${question.id} (${question.type}): ${String(error).split('\n').slice(0, 3).join(' ')}`
      break
    }
    await page.getByRole('button', { name: 'Check' }).click({ timeout: 5000 }).catch(() => {})

    // The app holds its feedback for half a second before drawing the next
    // question, so wait for the question to change rather than guess a delay.
    const moved = await page
      .waitForFunction(
        (previous) =>
          document.querySelector('.rule-reveal') !== null ||
          (document.querySelector('.activity')?.dataset?.questionId ?? null) !== previous,
        info.shownId,
        { timeout: 5000 },
      )
      .then(() => true)
      .catch(() => false)

    if (!moved) {
      const feedback = await page.locator('.feedback').textContent().catch(() => '')
      stalled = `${question.id} (${question.type}) expected=${JSON.stringify(answer)} — ${feedback}`
      break
    }
  }

  results.push({ id, completed, steps, types: [...types].sort(), stalled })
  process.stdout.write(completed ? '.' : 'X')

  if (completed) {
    await page.getByRole('button', { name: /back to the quest/i }).click()
  } else {
    await page.evaluate(() => window.zsq.enterWorld())
  }
  await page.locator('.game-canvas').waitFor({ timeout: 15000 })
}

console.log('\n')
const failed = results.filter((r) => !r.completed)
for (const r of failed) console.log(`Exercise ${r.id}: ${r.stalled ?? `unfinished after ${r.steps} steps`}`)

const allTypes = new Set(results.flatMap((r) => r.types))
console.log(`\n${results.length - failed.length} of ${results.length} exercises completed.`)
console.log(`Question types exercised: ${[...allTypes].sort().join(', ')}`)
if (pageErrors.length) console.log(`\nPage errors: ${pageErrors.length}\n${pageErrors.slice(0, 5).join('\n')}`)

await browser.close()
process.exit(failed.length === 0 && pageErrors.length === 0 ? 0 : 1)
