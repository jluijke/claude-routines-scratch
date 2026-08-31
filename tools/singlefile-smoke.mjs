/**
 * Opens the double-click build the way a person would — from a file:// URL —
 * and plays through it. This is where ES modules, audio and localStorage all
 * behave differently from a dev server, so it has to be tested as delivered.
 */
import { chromium } from 'playwright'
import { pathToFileURL } from 'node:url'
import { resolve } from 'node:path'

const file = pathToFileURL(resolve('dist-single/zelda-spelling-quest.html')).href
const OUT = '/tmp/claude-0/-home-user-claude-routines-scratch/6df0b2d4-03e5-5006-8fa7-f59d18d1702e/scratchpad'

const browser = await chromium.launch({
  executablePath: process.env.CHROME ?? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
})
const page = await browser.newPage({ viewport: { width: 900, height: 820 } })
const errors = []
page.on('pageerror', (e) => errors.push(String(e)))
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()) })

await page.goto(file)
await page.waitForSelector('.title-screen', { timeout: 10000 })
const title = await page.locator('.exercise-title').textContent()

await page.getByRole('button', { name: /begin your quest|continue/i }).click()
await page.waitForSelector('.game-canvas', { timeout: 10000 })
await page.waitForTimeout(700)
await page.screenshot({ path: `${OUT}/F01-file-world.png` })

// Move around, then run an exercise the whole way through.
await page.keyboard.down('ArrowUp')
await page.waitForTimeout(700)
await page.keyboard.up('ArrowUp')

await page.evaluate(() => window.zsq.startExercise(1))
await page.waitForSelector('.activity .q', { timeout: 10000 })
await page.screenshot({ path: `${OUT}/F02-file-exercise.png` })

// Does saving work from file://? Some browsers restrict storage there.
const storageWorks = await page.evaluate(() => {
  try {
    localStorage.setItem('zsq.probe', 'yes')
    const ok = localStorage.getItem('zsq.probe') === 'yes'
    localStorage.removeItem('zsq.probe')
    return ok
  } catch (error) {
    return `blocked: ${String(error)}`
  }
})

// Does the browser offer a voice? (Headless Chromium usually has none, which
// is expected — it tells us the code path is reached without throwing.)
const voice = await page.evaluate(() => {
  try {
    return { supported: 'speechSynthesis' in window, voices: window.speechSynthesis?.getVoices()?.length ?? 0 }
  } catch (error) {
    return { error: String(error) }
  }
})

// Play Exercise 1 all the way to its rule reveal, in the delivered file.
let steps = 0
let completed = false
while (steps++ < 60) {
  if (await page.locator('.rule-reveal').count()) { completed = true; break }
  const info = await page.evaluate(() => window.zsq.expected())
  if (!info) break
  const { question, answer, shownId } = info

  if (question.type === 'syllableSplit') {
    const parts = answer[0].split('|')
    let index = 0
    for (const part of parts.slice(0, -1)) {
      index += part.length
      await page.evaluate((n) => {
        document.querySelectorAll('.syllable-word .cut')[n - 1]?.click()
      }, index)
    }
    if (answer.length > 1) await page.locator('.q-syllable input.answer').fill(answer[1])
  } else {
    await page.locator('.activity input.answer, .activity textarea.answer').first().fill(answer[0])
  }

  await page.getByRole('button', { name: 'Check' }).click({ timeout: 4000 }).catch(() => {})
  await page
    .waitForFunction(
      (prev) =>
        document.querySelector('.rule-reveal') !== null ||
        (document.querySelector('.activity')?.dataset?.questionId ?? null) !== prev,
      shownId,
      { timeout: 5000 },
    )
    .catch(() => {})
}
await page.screenshot({ path: `${OUT}/F03-file-complete.png` })

// And does the reward reach the save, from a file:// page?
const saved = await page.evaluate(() => ({
  rupees: window.zsq.state.player.rupees,
  stored: localStorage.getItem('zsq.save') !== null,
}))

console.log(JSON.stringify({ file, title: title?.trim(), storageWorks, voice, completed, steps, saved, errors }, null, 2))
await browser.close()
process.exit(errors.length === 0 ? 0 : 1)
