/**
 * The integration that matters: walk into a sealed barrier, complete the
 * exercise it demands, and confirm the door actually opens and pays out.
 */
import { chromium } from 'playwright'

const BASE = process.env.BASE ?? 'http://localhost:5199/'
const OUT = '/tmp/claude-0/-home-user-claude-routines-scratch/6df0b2d4-03e5-5006-8fa7-f59d18d1702e/scratchpad'

const browser = await chromium.launch({
  executablePath: process.env.CHROME ?? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
})
const page = await browser.newPage({ viewport: { width: 1000, height: 900 } })
const errors = []
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()) })
page.on('pageerror', (e) => errors.push(String(e)))

await page.goto(BASE, { waitUntil: 'networkidle' })
await page.evaluate(() => localStorage.removeItem('zsq.save'))
await page.reload({ waitUntil: 'networkidle' })

await page.getByRole('button', { name: /begin your quest/i }).click()
await page.waitForSelector('.game-canvas')
await page.waitForTimeout(500)

// Walk to the sealed stone at the north gate.
await page.evaluate(() => window.zsq.goTo('village-north', 7, 3))
await page.waitForTimeout(300)
let prompted = false
for (let i = 0; i < 8 && !prompted; i++) {
  await page.keyboard.down('ArrowUp')
  await page.waitForTimeout(700)
  await page.keyboard.up('ArrowUp')
  await page.waitForTimeout(250)
  prompted = (await page.$('.gate-prompt')) !== null
}
if (!prompted) {
  console.log(JSON.stringify({ stage: 'gate', prompted, errors }, null, 2))
  await browser.close()
  process.exit(1)
}

const before = await page.evaluate(() => ({
  rupees: window.zsq.state.player.rupees,
  opened: [...window.zsq.state.world.openedGates],
}))

await page.getByRole('button', { name: 'Open it' }).click()
await page.waitForSelector('.activity .q')
await page.screenshot({ path: `${OUT}/L01-exercise-from-gate.png` })

// Play the exercise correctly, using the app's own expected answers.
async function expected() {
  return page.evaluate(async () => {
    const [{ expectedAnswer }, { WORD_BANK }] = await Promise.all([
      import('/src/spelling/grading.ts'),
      import('/src/content/words.ts'),
    ])
    const q = window.zsq.currentQuestion()
    return q ? { question: q, answer: expectedAnswer(q, WORD_BANK) } : null
  })
}

let steps = 0
let reachedReveal = false
while (steps++ < 80) {
  if (await page.$('.rule-reveal')) { reachedReveal = true; break }
  const info = await expected()
  if (!info) break
  const { question, answer } = info

  if (question.type === 'wordSort') {
    await page.evaluate((groups) => {
      for (const group of groups) {
        for (const word of group.words) {
          const chip = document.querySelector(`.chip[data-word="${word}"]`)
          const column = [...document.querySelectorAll('.sort-column')].find(
            (c) => c.querySelector('.sort-heading')?.textContent?.trim().endsWith(group.label))
          if (chip && column) { chip.click(); column.click() }
        }
      }
    }, question.groups)
  } else if (question.type === 'syllableSplit') {
    const syllables = answer[0].split('|')
    let index = 0
    for (const syllable of syllables.slice(0, -1)) {
      index += syllable.length
      await page.evaluate((i) => {
        [...document.querySelectorAll('.syllable-word .cut')][i - 1]?.click()
      }, index)
    }
    if (answer.length > 1) await page.fill('.q-syllable input.answer', answer[1])
  } else if (question.type === 'findMistake') {
    await page.evaluate((wrong) => {
      [...document.querySelectorAll('.word-token')]
        .find((n) => n.textContent.replace(/[^A-Za-z']/g, '') === wrong)?.click()
    }, question.wrong)
    await page.fill('.q-mistake input.answer', answer[1])
  } else {
    const choice = await page.$(`.choice[data-choice="${answer[0]}"]`)
    if (choice) await choice.click()
    else {
      const input = await page.$('.activity input.answer, .activity textarea.answer')
      if (!input) break
      await input.fill(answer[0])
    }
  }
  const check = await page.$('button.btn-primary')
  if (check && (await check.isVisible())) await check.click()
  await page.waitForTimeout(560)
}

if (!reachedReveal) {
  console.log(JSON.stringify({ stage: 'exercise', steps, errors }, null, 2))
  await browser.close()
  process.exit(1)
}

await page.getByRole('button', { name: /back to the quest/i }).click()
await page.waitForSelector('.game-canvas')
await page.waitForTimeout(800)
await page.screenshot({ path: `${OUT}/L02-back-in-world.png` })

const after = await page.evaluate(() => ({
  rupees: window.zsq.state.player.rupees,
  opened: [...window.zsq.state.world.openedGates],
  completed: [...window.zsq.state.spelling.completedExercises],
  exerciseSeconds: window.zsq.state.pacing.exerciseSeconds,
  playSeconds: window.zsq.state.pacing.playSeconds,
  screen: window.zsq.world?.currentScreenId(),
}))

// Walk north again: the door should now let us through.
await page.keyboard.down('ArrowUp')
await page.waitForTimeout(2000)
await page.keyboard.up('ArrowUp')
await page.waitForTimeout(400)
const passedThrough = await page.evaluate(() => window.zsq.world?.currentScreenId())
await page.screenshot({ path: `${OUT}/L03-through-the-gate.png` })

console.log(JSON.stringify({
  before, after, passedThrough,
  gateOpened: after.opened.includes('village-north-seal'),
  wentThrough: passedThrough !== 'village-north',
  rupeesGained: after.rupees - before.rupees,
  errors,
}, null, 2))

await browser.close()
process.exit(errors.length === 0 ? 0 : 1)
