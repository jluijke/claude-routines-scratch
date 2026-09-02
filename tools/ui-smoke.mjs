/** Checks the shop and the parent dashboard render and behave. */
import { chromium } from 'playwright'
import { makeAnswerer } from './lib/answer.mjs'
const OUT = '/tmp/claude-0/-home-user-claude-routines-scratch/6df0b2d4-03e5-5006-8fa7-f59d18d1702e/scratchpad'
const browser = await chromium.launch({
  executablePath: process.env.CHROME ?? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
})
const page = await browser.newPage({ viewport: { width: 1000, height: 950 } })
const { answerOne } = makeAnswerer(page)
const errors = []
page.on('pageerror', (e) => errors.push(String(e)))

const failures = []
const check = (name, ok) => { if (!ok) failures.push(name) }

await page.goto(process.env.BASE ?? 'http://localhost:5199/', { waitUntil: 'networkidle' })
await page.evaluate(() => localStorage.removeItem('zsq.save'))
await page.reload({ waitUntil: 'networkidle' })
await page.getByRole('button', { name: /begin your quest/i }).click()
await page.waitForSelector('.game-canvas')

// Give him some rupees and some progress, then open the shop.
await page.evaluate(() => {
  const s = window.zsq.state
  s.player.rupees = 420
  s.spelling.completedExercises = [1, 2, 3, 4]
  s.pacing.playSeconds = 900
  s.pacing.exerciseSeconds = 800
  s.spelling.mastery.concepts = {
    syllables: { concept: 'syllables', attempted: 9, independentCorrect: 8, hintsUsed: 1, repeatMistakes: 0, status: 'mastered', missedWords: [] },
    'ee-sound': { concept: 'ee-sound', attempted: 11, independentCorrect: 4, hintsUsed: 6, repeatMistakes: 2, status: 'shaky', missedWords: ['beach', 'monkey', 'valley'] },
    'oa-sound': { concept: 'oa-sound', attempted: 10, independentCorrect: 9, hintsUsed: 0, repeatMistakes: 0, status: 'mastered', missedWords: [] },
  }
})
await page.evaluate(() => window.zsq.goTo('shop-interior', 7, 6))
await page.waitForSelector('.shop', { timeout: 8000 })
await page.screenshot({ path: `${OUT}/S01-shop.png` })

const shopRows = await page.locator('.shop-row').count()
const buyable = await page.locator('.shop-row button:not([disabled])').count()

// Buy the metal sword and check it equips.
const before = await page.evaluate(() => window.zsq.state.player.rupees)
await page.locator('.shop-row', { hasText: 'Metal Sword' }).getByRole('button', { name: 'Buy' }).click()
await page.waitForTimeout(300)
const after = await page.evaluate(() => ({
  rupees: window.zsq.state.player.rupees,
  sword: window.zsq.state.player.equippedSword,
  owns: window.zsq.state.inventory.metalSword,
}))

// A gated item should ask for a spelling challenge rather than sell.
const gatedLabel = await page.locator('.shop-row', { hasText: 'Wings' }).locator('button').textContent()

await page.getByRole('button', { name: /leave the shop/i }).click()
await page.waitForTimeout(300)

// Parent dashboard.
await page.keyboard.press('Control+Shift+P')
await page.waitForSelector('.dashboard', { timeout: 8000 })
await page.screenshot({ path: `${OUT}/S02-dashboard.png`, fullPage: true })
const dashRows = await page.locator('.mastery-table tbody tr').count()
const balance = await page.locator('.dashboard p').nth(1).textContent()
const shakyShown = await page.locator('tr.mastery-shaky .missed').first().textContent()

const dashActions = await page.locator('.dash-actions').count()

// ----------------------------------------------------------- the testing kit
//
// For a parent checking the game works without playing the whole curriculum.
const beforeKit = await page.evaluate(() => ({
  wings: window.zsq.state.inventory.wings ?? 0,
  gates: window.zsq.state.world.openedGates.length,
}))
await page.selectOption('.kit-select', 'wings')
await page.getByRole('button', { name: /give it to him/i }).click()
await page.waitForTimeout(250)
const granted = await page.evaluate(() => ({
  wings: window.zsq.state.inventory.wings ?? 0,
  // The Wings are behind a shopkeeper's barrier; granting them should unseal it.
  wingsGate: window.zsq.state.world.openedGates.includes('shop-wings'),
}))
check('one item can be handed over', granted.wings === beforeKit.wings + 1)
check('and its shopkeeper barrier is unsealed with it', granted.wingsGate)

await page.getByRole('button', { name: /give him everything/i }).click()
await page.waitForTimeout(300)
const everything = await page.evaluate(() => {
  const s = window.zsq.state
  return {
    sword: s.player.equippedSword,
    candle: s.inventory.blueCandle ?? 0,
    ring: s.inventory.blueRing ?? 0,
    rupees: s.player.rupees,
    gates: s.world.openedGates.length,
  }
})
check('everything means everything', everything.candle > 0 && everything.ring > 0)
check('and the best of it is equipped', everything.sword === 'goldenSword')
check('with rupees to spend', everything.rupees >= 999)
check('and every shop barrier opened', everything.gates > beforeKit.gates)

// --------------------------------------------------------------- the voice
//
// Headless Chromium offers no speech voices at all, so this is the degraded
// case: it must say so plainly rather than showing an empty dropdown that
// looks broken.
const voiceText = (await page.locator('.dashboard').textContent()) ?? ''
if ((await page.locator('.voice-select').count()) === 0) {
  check('with no voices, it says so rather than showing an empty picker',
    voiceText.includes('no speech voices'))
} else {
  check('the voice picker lists something', (await page.locator('.voice-select option').count()) > 0)
  check('and offers a way to hear it', await page.getByRole('button', { name: /hear it/i }).isVisible())
}

// A voice chosen by ear is remembered per device, never in the save file.
await page.evaluate(() => localStorage.setItem('zsq.voice', 'Google UK English Female'))
const savedVoice = await page.evaluate(() => ({
  stored: localStorage.getItem('zsq.voice'),
  inSave: JSON.stringify(JSON.parse(localStorage.getItem('zsq.save') ?? '{}')).includes('Google UK'),
}))
check('the chosen voice is remembered', savedVoice.stored === 'Google UK English Female')
check('and kept out of the progress file', savedVoice.inSave === false)

await page.getByRole('button', { name: /close/i }).click()
await page.waitForTimeout(250)

// ---------------------------------------------------------------- the help
//
// Control used to swing the sword. It now opens the controls, and the two
// must not both happen: a child asking what the keys are should not attack.



await page.keyboard.press('Control')
await page.waitForTimeout(250)
check('Control opens the help panel', Boolean(await page.$('.help-panel')))
await page.screenshot({ path: `${OUT}/S03-help.png` })
const helpRows = await page.locator('.help-grid .help-what').count()
check('the help panel lists every binding', helpRows >= 8)

await page.keyboard.press('Escape')
await page.waitForTimeout(250)
check('Escape closes it', !(await page.$('.help-panel')))

await page.keyboard.press('Escape')
await page.waitForTimeout(250)
check('Escape opens it too', Boolean(await page.$('.help-panel')))
await page.keyboard.press('Escape')
await page.waitForTimeout(250)

// Held as a modifier, Control belongs to the combination, not to the help.
await page.keyboard.down('Control')
await page.keyboard.down('Shift')
await page.keyboard.press('P')
await page.keyboard.up('Shift')
await page.keyboard.up('Control')
await page.waitForTimeout(350)
check('Ctrl+Shift+P still reaches the dashboard', Boolean(await page.$('.dashboard')))
check('and does not flash the help panel', !(await page.$('.help-panel')))

// --------------------------------------------------------------- the reset

await page.getByRole('button', { name: /start a new quest/i }).click()
await page.waitForTimeout(250)
check('the reset refuses without the word', Boolean(await page.$('.dashboard')))

await page.fill('.reset-field', 'NEW')
await page.getByRole('button', { name: /start a new quest/i }).click()
await page.waitForTimeout(500)
const fresh = await page.evaluate(() => ({
  rupees: window.zsq.state.player.rupees,
  done: window.zsq.state.spelling.completedExercises.length,
  sword: window.zsq.state.player.equippedSword,
  storedRupees: JSON.parse(localStorage.getItem('zsq.save') ?? '{}')?.player?.rupees,
  dashboardGone: !document.querySelector('.dashboard'),
}))
check('the reset clears rupees', fresh.rupees === 0)
check('the reset clears progress', fresh.done === 0)
// A new quest starts empty-handed; the sword is lying in the village square.
check('the reset takes the bought sword away', fresh.sword === undefined)
// The world holds the old save and writes it back when it stops, so a reset
// that tears down in the wrong order resurrects the old rupees on disk.
check('the old save does not come back', fresh.storedRupees === 0)
check('the dashboard closes behind it', fresh.dashboardGone)
check('the title screen offers a fresh start',
  (await page.getByRole('button', { name: /begin your quest/i }).count()) === 1)

// ------------------------------------------------- Control must not attack
//
// Stand next to a monster, tap Control twenty times, and check nothing died.

await page.getByRole('button', { name: /begin your quest/i }).click()
await page.waitForSelector('.game-canvas')
await page.evaluate(() => {
  for (let i = 0; i < 20; i++) window.zsq.world.grantHeartContainer()
  // This check is about the Control key, not about finding a sword.
  window.zsq.state.inventory.woodenSword = 1
  window.zsq.world.equipBest()
})
await page.evaluate(() => window.zsq.goTo('d3-hall', 5, 6))
await page.waitForTimeout(400)
const monstersBefore = (await page.evaluate(() => window.zsq.world.debugState())).enemies
for (let i = 0; i < 20; i++) {
  await page.keyboard.press('Control')
  await page.waitForTimeout(40)
  if (await page.$('.help-panel')) await page.keyboard.press('Escape')
  await page.waitForTimeout(40)
}
const monstersAfterControl = (await page.evaluate(() => window.zsq.world.debugState())).enemies
check('tapping Control never swings the sword', monstersAfterControl === monstersBefore)

// Face the monster before swinging, or this proves nothing about the key.
for (let i = 0; i < 6; i++) {
  await page.keyboard.down('ArrowUp')
  await page.waitForTimeout(50)
  await page.keyboard.up('ArrowUp')
  await page.keyboard.press('z')
  await page.waitForTimeout(220)
}
const monstersAfterZ = (await page.evaluate(() => window.zsq.world.debugState())).enemies
check('Z still swings it', monstersAfterZ < monstersBefore)

// ------------------------------------------------- the sorting tiles are shuffled
// They used to be laid out box one's words then box two's, which is the answer
// key read left to right. And the wrong-tile highlighting is index-aligned with
// the *authored* order, so this is exactly where shuffling could break grading.
await page.evaluate(() => window.zsq.startExercise(6))
await page.waitForSelector('.exercise-screen')
let sortSeen = false
for (let i = 0; i < 14; i++) {
  if (await page.locator('.sort-pool .chip').count()) { sortSeen = true; break }
  const done = await answerOne()
  if (!done) break
  await page.waitForTimeout(120)
}
check('a sorting activity comes up', sortSeen)
if (sortSeen) {
  const shown = await page.$$eval('.sort-pool .chip', (nodes) => nodes.map((n) => n.dataset.word))
  const groups = await page.evaluate(() => {
    const q = window.zsq.currentQuestion()
    return q && q.type === 'wordSort' ? q.groups.map((g) => ({ label: g.label, words: g.words })) : undefined
  })
  const authored = (groups ?? []).flatMap((g) => g.words)
  check('every word is on screen exactly once',
    JSON.stringify([...shown].sort()) === JSON.stringify([...authored].sort()))
  check('the tiles are not in answer order', JSON.stringify(shown) !== JSON.stringify(authored))
  const where = new Map()
  for (const [i, g] of (groups ?? []).entries()) for (const w of g.words) where.set(w, i)
  const indices = shown.map((w) => where.get(w))
  check('and the two boxes are not still clumped together',
    !indices.every((n, i) => i === 0 || n >= indices[i - 1]))

  // Sorting it correctly must still be marked correct, shuffled or not.
  for (const g of groups ?? []) {
    for (const w of g.words) {
      await page.click(`.sort-pool .chip[data-word="${w}"], .chip[data-word="${w}"]`)
      await page.click(`.sort-column[data-label="${g.label}"]`)
    }
  }
  await page.getByRole('button', { name: /^check$/i }).click()
  await page.waitForTimeout(500)
  const feedback = await page.textContent('.feedback')
  check('a correctly sorted answer is still accepted', !/not quite/i.test(feedback ?? ''))
  check('and no tile is marked wrong', (await page.locator('.chip-wrong').count()) === 0)
}
await page.evaluate(() => window.zsq.enterWorld())
await page.waitForSelector('.game-canvas')

console.log(JSON.stringify({
  shopRows, buyable,
  purchase: { spent: before - after.rupees, equipped: after.sword, owns: after.owns },
  gatedLabel: gatedLabel?.trim(),
  dashboard: { rows: dashRows, actionRows: dashActions, balance: balance?.trim(), shakyWords: shakyShown?.trim() },
  help: { rows: helpRows },
  reset: fresh,
  combat: { monstersBefore, monstersAfterControl, monstersAfterZ },
  failures,
  errors,
}, null, 2))

for (const failure of failures) console.log(`  FAILED: ${failure}`)

await browser.close()
process.exit(failures.length === 0 && errors.length === 0 ? 0 : 1)
