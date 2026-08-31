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

/**
 * The question the UI is showing right now. The engine's own pointer advances
 * the moment an answer is accepted, half a second before the screen redraws,
 * so reading it directly would race the render.
 */
async function expected() {
  return page.evaluate(async () => {
    const [{ expectedAnswer }, { WORD_BANK }, { EXERCISES }, { CONCEPTS }] = await Promise.all([
      import('/src/spelling/grading.ts'),
      import('/src/content/words.ts'),
      import('/src/content/exercises/index.ts'),
      import('/src/content/concepts.ts'),
    ])
    const shown = document.querySelector('.activity')?.dataset?.questionId
    if (!shown) return null

    // The engine tags reused questions with @review and #fix suffixes.
    const base = shown.split(/[@#]/)[0]
    const pool = [
      ...EXERCISES.flatMap((e) => e.activities),
      ...[...CONCEPTS.values()].flatMap((c) => c.reviewPool),
    ]
    const question = pool.find((q) => q.id === base)
    if (!question) return null
    return { question, answer: expectedAnswer(question, WORD_BANK), shownId: shown }
  })
}

/** Clicks the word token matching `word`, comparing the way the app does. */
async function clickToken(word) {
  await page.evaluate((w) => {
    const norm = (t) => t.replace(/[^A-Za-z'’-]/g, '').replace(/’/g, "'").toLowerCase()
    const token = [...document.querySelectorAll('.word-token')].find((n) => norm(n.textContent) === norm(w))
    token?.click()
  }, word)
}

async function answerQuestion(question, answer) {
  const activity = page.locator('.activity .q')
  await activity.first().waitFor({ state: 'visible', timeout: 8000 })

  switch (question.type) {
    case 'wordSort':
      await page.evaluate((groups) => {
        for (const group of groups) {
          for (const word of group.words) {
            const chip = document.querySelector(`.chip[data-word="${CSS.escape(word)}"]`)
            const column = document.querySelector(`.sort-column[data-label="${CSS.escape(group.label)}"]`)
            if (chip && column) {
              chip.click()
              column.click()
            }
          }
        }
      }, question.groups)
      return

    case 'syllableSplit': {
      const parts = answer[0].split('|')
      let index = 0
      for (const part of parts.slice(0, -1)) {
        index += part.length
        await page.evaluate((n) => {
          document.querySelectorAll('.syllable-word .cut')[n - 1]?.click()
        }, index)
      }
      if (answer.length > 1) await page.locator('.q-syllable input.answer').fill(answer[1])
      return
    }

    case 'findMistake':
      await clickToken(question.wrong)
      await page.locator('.q-mistake input.answer').fill(answer[1])
      return

    case 'proofread':
      for (const error of question.errors) {
        await clickToken(error.wrong)
        await page.locator('.fix-list input.answer').last().fill(error.right)
      }
      return

    case 'wordFamily': {
      const inputs = page.locator('.q-family input.answer')
      for (let i = 0; i < answer.length; i++) await inputs.nth(i).fill(answer[i])
      return
    }

    case 'visualMemory':
      await page.locator('.memory-input:not([hidden]) input.answer').waitFor({ timeout: 8000 })
      await page.locator('.q-memory input.answer').fill(answer[0])
      return

    default: {
      const choice = page.locator('.choice').filter({ hasText: new RegExp(`^${escapeRegex(answer[0])}$`) })
      if (await choice.count()) {
        await choice.first().click()
        return
      }
      const field = page.locator('.activity input.answer, .activity textarea.answer').first()
      if (!(await field.count())) {
        const html = await page.locator('.activity').innerHTML().catch(() => '')
        throw new Error(
          `no way to answer ${question.id} (${question.type}); expected ${JSON.stringify(answer)}\n${html.slice(0, 400)}`,
        )
      }
      await field.fill(answer[0])
    }
  }
}

function escapeRegex(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

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
