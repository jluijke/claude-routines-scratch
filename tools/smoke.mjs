/**
 * End-to-end check: boots the game in a real browser and plays Exercise 1
 * through to the rule reveal, driving the actual UI the child uses.
 *
 * Answers come from the app's own grading module via the dev hook, so this
 * tests the interface rather than re-implementing the content.
 */
import { chromium } from 'playwright'

const BASE = process.env.BASE ?? 'http://localhost:5199/'
const OUT = '/tmp/claude-0/-home-user-claude-routines-scratch/6df0b2d4-03e5-5006-8fa7-f59d18d1702e/scratchpad'
const shot = (name) => `${OUT}/${name}.png`
const EXERCISE = Number(process.env.EXERCISE ?? 1)

const browser = await chromium.launch({
  executablePath: process.env.CHROME ?? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
})
const page = await browser.newPage({ viewport: { width: 900, height: 800 } })

const errors = []
page.on('console', (m) => {
  if (m.type() === 'error') errors.push(m.text())
})
page.on('pageerror', (e) => errors.push(String(e)))

await page.goto(BASE, { waitUntil: 'networkidle' })
await page.screenshot({ path: shot('01-title') })

await page.getByRole('button', { name: /begin your quest|continue/i }).click()
await page.waitForSelector('.exercise-screen')
await page.screenshot({ path: shot('02-menu') })

await page.evaluate((id) => window.zsq.startExercise(id), EXERCISE)
await page.waitForSelector('.activity .q')
await page.waitForTimeout(500)
await page.screenshot({ path: shot('03-exercise') })

/** Reads the expected answer for whatever is on screen right now. */
async function expected() {
  return page.evaluate(async () => {
    const [{ expectedAnswer }, { WORD_BANK }] = await Promise.all([
      import('/src/spelling/grading.ts'),
      import('/src/content/words.ts'),
    ])
    const q = window.zsq.currentQuestion()
    if (!q) return null
    return { question: q, answer: expectedAnswer(q, WORD_BANK) }
  })
}

const seen = new Set()
let steps = 0
let completed = false

while (steps++ < 80) {
  if (await page.$('.rule-reveal')) {
    completed = true
    break
  }
  const info = await expected()
  if (!info) break
  seen.add(info.question.type)
  const { question, answer } = info

  switch (question.type) {
    case 'wordSort': {
      await page.evaluate((groups) => {
        for (const group of groups) {
          for (const word of group.words) {
            const chip = document.querySelector(`.chip[data-word="${word}"]`)
            const column = [...document.querySelectorAll('.sort-column')].find(
              (c) => c.querySelector('.sort-heading')?.textContent?.trim().endsWith(group.label),
            )
            if (chip && column) {
              chip.click()
              column.click()
            }
          }
        }
      }, question.groups)
      break
    }
    case 'syllableSplit': {
      const syllables = answer[0].split('|')
      let index = 0
      for (const syllable of syllables.slice(0, -1)) {
        index += syllable.length
        await page.evaluate((i) => {
          const cuts = [...document.querySelectorAll('.syllable-word .cut')]
          cuts[i - 1]?.click()
        }, index)
      }
      if (answer.length > 1) await page.fill('.q-syllable input.answer', answer[1])
      break
    }
    case 'findMistake': {
      await page.evaluate((wrong) => {
        const token = [...document.querySelectorAll('.word-token')].find(
          (n) => n.textContent.replace(/[^A-Za-z']/g, '') === wrong,
        )
        token?.click()
      }, question.wrong)
      await page.fill('.q-mistake input.answer', answer[1])
      break
    }
    case 'proofread': {
      for (let i = 0; i < question.errors.length; i++) {
        const error = question.errors[i]
        await page.evaluate((wrong) => {
          const token = [...document.querySelectorAll('.word-token')].find(
            (n) => n.textContent.replace(/[^A-Za-z']/g, '') === wrong,
          )
          token?.click()
        }, error.wrong)
        const inputs = await page.$$('.fix-list input.answer')
        await inputs[inputs.length - 1]?.fill(error.right)
      }
      break
    }
    case 'wordFamily': {
      const inputs = await page.$$('.q-family input.answer')
      for (let i = 0; i < answer.length; i++) await inputs[i]?.fill(answer[i])
      break
    }
    case 'visualMemory': {
      await page.waitForSelector('.memory-input:not([hidden]) input.answer', { timeout: 6000 })
      await page.fill('.q-memory input.answer', answer[0])
      break
    }
    default: {
      const choice = await page.$(`.choice[data-choice="${answer[0]}"]`)
      if (choice) {
        await choice.click()
        break
      }
      const input = await page.$('.activity input.answer, .activity textarea.answer')
      if (!input) {
        console.error('no input for', question.type)
        steps = 999
        break
      }
      await input.fill(answer[0])
    }
  }

  const check = await page.$('button.btn-primary')
  if (check && (await check.isVisible())) await check.click()
  await page.waitForTimeout(600)
}

await page.screenshot({ path: shot('04-end') })
if (completed) {
  await page.screenshot({ path: shot('05-rule-reveal') })
}

const state = await page.evaluate(() => window.zsq.state)
console.log(
  JSON.stringify(
    {
      completed,
      steps,
      questionTypesSeen: [...seen],
      rupees: state.player.rupees,
      completedExercises: state.spelling.completedExercises,
      errors,
    },
    null,
    2,
  ),
)
await browser.close()
process.exit(completed && errors.length === 0 ? 0 : 1)
