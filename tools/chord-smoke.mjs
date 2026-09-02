/**
 * The parent chord, and the child's controls panel, are different things.
 *
 * They were not. "P" was in the game's help keys, and the game's key handler
 * never looked at whether Cmd or Ctrl was held — so Cmd+Shift+P meant both
 * "open the parent dashboard" and "open the controls", and which you got
 * depended on which window listener happened to run first. On one machine that
 * is the dashboard; on another it is the controls panel.
 */
import { chromium } from 'playwright'

const BASE = process.env.BASE ?? 'http://localhost:5199/'
const browser = await chromium.launch({
  executablePath: process.env.CHROME ?? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
})
const page = await browser.newPage({ viewport: { width: 900, height: 820 } })
const errors = []
page.on('pageerror', (e) => errors.push(String(e)))

const failures = []
const check = (name, ok) => { if (!ok) failures.push(name) }
const panels = async () => {
  await page.waitForTimeout(350)
  return {
    dashboard: await page.locator('.dashboard').count(),
    help: await page.locator('.help-panel').count(),
  }
}
async function closeEverything() {
  for (const label of [/back to the quest/i, /^close$/i, /leave the shop/i]) {
    const button = page.getByRole('button', { name: label })
    while (await button.count()) {
      await button.first().click()
      await page.waitForTimeout(250)
    }
  }
}

await page.goto(BASE, { waitUntil: 'networkidle' })
await page.evaluate(() => localStorage.removeItem('zsq.save'))
await page.reload({ waitUntil: 'networkidle' })
await page.getByRole('button', { name: /begin your quest/i }).click()
await page.waitForSelector('.game-canvas')
await page.waitForTimeout(400)

// ---------------------------------------------------- the chord, both ways
for (const chord of ['Meta+Shift+P', 'Control+Shift+P']) {
  await page.keyboard.press(chord)
  const seen = await panels()
  check(`${chord} opens the parent dashboard`, seen.dashboard === 1)
  check(`${chord} does not open the child's controls`, seen.help === 0)
  await closeEverything()
}

// Opening and closing repeatedly must not wedge it: the "is it open?" answer
// used to be a remembered flag, and a stuck flag disables the chord silently.
for (let round = 0; round < 4; round++) {
  await page.keyboard.press('Meta+Shift+P')
  await page.waitForTimeout(300)
  await closeEverything()
}
await page.keyboard.press('Meta+Shift+P')
check('the chord still works after several rounds', (await panels()).dashboard === 1)
await page.keyboard.press('Meta+Shift+P')
check('and never stacks two panels', (await panels()).dashboard === 1)
await closeEverything()

// ------------------------------------------- modified keys are not controls
// Every game key, pressed as part of an application chord, must be ignored.
// The decisive one. Cmd+P is an application chord — a print dialog, say — and
// the game must not read it as a game key. "P" used to be a help key, so this
// opened the child's controls in the middle of whatever the parent was doing.
await page.keyboard.press('Meta+p')
check('Cmd+P is not a game control', (await panels()).help === 0)
await closeEverything()

await page.keyboard.press('Control+h')
check('Ctrl+H is not a game control either', (await panels()).help === 0)
await closeEverything()

// And a held arrow with a modifier must not walk him across the screen.
const before = await page.evaluate(() => window.zsq.world.debugState())
await page.keyboard.down('Meta')
await page.keyboard.down('ArrowRight')
await page.waitForTimeout(500)
await page.keyboard.up('ArrowRight')
await page.keyboard.up('Meta')
await page.waitForTimeout(200)
const after = await page.evaluate(() => window.zsq.world.debugState())
check('a held modified arrow does not walk him', Math.abs(after.x - before.x) < 3)

// -------------------------------------------------- the controls still open
await page.keyboard.press('Escape')
check('Escape still opens the controls', (await panels()).help === 1)
await page.keyboard.press('Escape')
await page.waitForTimeout(250)
await page.keyboard.press('h')
check('and so does H', (await panels()).help === 1)
await closeEverything()

console.log(JSON.stringify({ failures, errors }, null, 2))
for (const f of failures) console.log(`  FAILED: ${f}`)
await browser.close()
process.exit(failures.length === 0 && errors.length === 0 ? 0 : 1)
