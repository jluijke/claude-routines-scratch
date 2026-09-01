/**
 * Which voice reads the spelling words.
 *
 * The old rule took the first voice tagged en-AU. On a Mac that list starts
 * with Apple's novelty voices — Grandma, Grandpa, Rocko — in every English
 * locale, so a child could have his spelling words read to him by a joke voice.
 *
 * Headless Chromium has no voices at all, so this stubs the list Chrome on
 * macOS actually reports and checks what the game does with it.
 */
import { chromium } from 'playwright'

const OUT = '/tmp/claude-0/-home-user-claude-routines-scratch/6df0b2d4-03e5-5006-8fa7-f59d18d1702e/scratchpad'
const BASE = process.env.BASE ?? 'http://localhost:5199/'
const browser = await chromium.launch({
  executablePath: process.env.CHROME ?? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
})
const page = await browser.newPage({ viewport: { width: 1000, height: 950 } })
const errors = []
page.on('pageerror', (e) => errors.push(String(e)))

const failures = []
const check = (name, ok) => { if (!ok) failures.push(name) }

// Exactly what Chrome on macOS reports, in the order it reports it.
await page.addInitScript(() => {
  const fake = [
    ['Eddy (Australian English)', 'en-AU', true],
    ['Flo (Australian English)', 'en-AU', true],
    ['Grandma (Australian English)', 'en-AU', true],
    ['Grandpa (Australian English)', 'en-AU', true],
    ['Rocko (Australian English)', 'en-AU', true],
    ['Karen', 'en-AU', true],
    ['Daniel', 'en-GB', true],
    ['Samantha', 'en-US', true],
    ['Zarvox', 'en-US', true],
    ['Google UK English Female', 'en-GB', false],
    ['Google UK English Male', 'en-GB', false],
    ['Google US English', 'en-US', false],
    ['Google Deutsch', 'de-DE', false],
  ].map(([name, lang, localService]) => ({
    name, lang, localService, default: false, voiceURI: name,
  }))
  window.speechSynthesis.getVoices = () => fake
})

await page.goto(BASE, { waitUntil: 'networkidle' })
await page.evaluate(() => { localStorage.removeItem('zsq.save'); localStorage.removeItem('zsq.voice') })
await page.reload({ waitUntil: 'networkidle' })
await page.getByRole('button', { name: /begin your quest/i }).click()
await page.waitForSelector('.game-canvas')
await page.waitForTimeout(300)

const chosen = await page.evaluate(() => window.zsq.speech.chosenVoiceName())
check('it does not pick a joke voice', !/grandma|grandpa|rocko|eddy|flo|zarvox/i.test(chosen ?? ''))
check('it picks the clearest voice, not the first Australian one', chosen === 'Google UK English Female')

// The picker itself.
await page.keyboard.press('Control+Shift+P')
await page.waitForSelector('.dashboard', { timeout: 8000 })
const options = await page.locator('.voice-select option').allTextContents()
check('the picker lists the usable voices', options.length > 0)
check('best first', (options[0] ?? '').startsWith('Google UK English Female'))
check('and hides the joke voices entirely', !options.some((o) => /grandma|rocko|zarvox/i.test(o)))
check('and the German one', !options.some((o) => /deutsch/i.test(o)))
check('there is a way to hear it', await page.getByRole('button', { name: /hear it/i }).isVisible())
await page.screenshot({ path: `${OUT}/V01-voice-picker.png`, fullPage: true })

// Choosing by ear sticks, per device, and survives a reload.
await page.selectOption('.voice-select', 'Karen')
await page.waitForTimeout(200)
check('choosing a voice takes effect at once',
  (await page.evaluate(() => window.zsq.speech.chosenVoiceName())) === 'Karen')
check('and is remembered', (await page.evaluate(() => localStorage.getItem('zsq.voice'))) === 'Karen')

await page.reload({ waitUntil: 'networkidle' })
await page.getByRole('button', { name: /continue|begin/i }).click()
await page.waitForSelector('.game-canvas')
await page.waitForTimeout(300)
check('and honoured after a reload, over the default',
  (await page.evaluate(() => window.zsq.speech.chosenVoiceName())) === 'Karen')

console.log(JSON.stringify({ chosen, options, failures, errors }, null, 2))
for (const f of failures) console.log(`  FAILED: ${f}`)
await browser.close()
process.exit(failures.length === 0 && errors.length === 0 ? 0 : 1)
