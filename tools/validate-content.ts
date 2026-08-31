/**
 * Content validator.
 *
 * The safety net that makes forty exercises and a thirty-screen world
 * tractable: it checks the things that are easy to get wrong when writing data
 * by hand, and that would otherwise only show up as a confusing moment for a
 * nine-year-old halfway through an exercise.
 *
 * Run with: npm run validate:content
 */
import { EXERCISES, TOTAL_EXERCISES } from '../src/content/exercises'
import { CONCEPTS } from '../src/content/concepts'
import { WORD_BANK } from '../src/content/words'
import { SCREENS, screenById } from '../src/game/world/screens'
import { SCREEN_COLS, SCREEN_ROWS, TILES, type TileChar } from '../src/game/world/tiles'
import { allGates, gateById, majorGateCount, totalGateCount } from '../src/game/gates'
import {
  brokenExits,
  bypassableBarriers,
  layoutConflicts,
  unreachableDoors,
} from '../src/game/world/analysis'
import { ITEMS, SECRET_SHOP, VILLAGE_SHOP } from '../src/game/items'
import { buildQueue } from '../src/spelling/scheduler'
import { emptyMasteryStore } from '../src/spelling/mastery'
import { expectedAnswer } from '../src/spelling/grading'
import { Rng } from '../src/core/rng'
import type { Question } from '../src/spelling/types'

const problems: string[] = []
const warnings: string[] = []

const fail = (message: string) => problems.push(message)
const warn = (message: string) => warnings.push(message)

// ---------------------------------------------------------------- curriculum

const seenQuestionIds = new Set<string>()

for (const exercise of EXERCISES) {
  const where = `Exercise ${exercise.id} (${exercise.title})`

  if (exercise.activities.length === 0) fail(`${where}: has no activities`)
  if (exercise.concepts.length === 0) fail(`${where}: teaches no concepts`)

  for (const concept of exercise.concepts) {
    if (!CONCEPTS.has(concept)) fail(`${where}: unknown concept "${concept}"`)
  }

  // Every concept needs a question the child can be re-tested on, or the
  // engine cannot enforce "prove it independently".
  for (const concept of exercise.concepts) {
    const pool = CONCEPTS.get(concept)?.reviewPool ?? []
    if (pool.length < 6) {
      fail(`${where}: concept "${concept}" has only ${pool.length} pool questions; needs at least 6 so remediation never repeats a word`)
    }
  }

  // A child must apply the pattern to something they were not shown (spec §18).
  if (!exercise.activities.some((q) => q.novel)) {
    fail(`${where}: has no novel-transfer question`)
  }

  // Review begins at Exercise 6.
  if (exercise.id >= 6 && exercise.reviewConcepts.length === 0) {
    warn(`${where}: declares no review concepts; the scheduler will pick them automatically`)
  }
  for (const concept of exercise.reviewConcepts) {
    const introduced = CONCEPTS.get(concept)?.introducedIn
    if (introduced === undefined) fail(`${where}: reviews unknown concept "${concept}"`)
    else if (introduced >= exercise.id) {
      fail(`${where}: reviews "${concept}", which is not introduced until Exercise ${introduced}`)
    }
  }

  // Rule reveal shape (spec §16).
  if (exercise.ruleReveal.examples.length < 2 || exercise.ruleReveal.examples.length > 4) {
    fail(`${where}: rule reveal has ${exercise.ruleReveal.examples.length} examples; the brief asks for 2 to 4`)
  }
  if (!exercise.ruleReveal.text.trim()) fail(`${where}: rule reveal has no text`)

  // Duration: the queue must land near the target the brief sets.
  const queue = buildQueue({
    exercise,
    concepts: CONCEPTS,
    mastery: emptyMasteryStore(),
    rng: new Rng(`validate-${exercise.id}`),
  })
  const target = exercise.targetMinutes * 60
  const ratio = queue.estimatedSeconds / target
  if (ratio < 0.75 || ratio > 1.25) {
    fail(
      `${where}: estimated ${Math.round(queue.estimatedSeconds / 60 * 10) / 10} min against a ${exercise.targetMinutes} min target`,
    )
  }
  if (queue.trimmed > 0) {
    warn(`${where}: ${queue.trimmed} authored activities did not fit and were trimmed to make room for review`)
  }

  // Words used must exist in the bank, so hints and audio have something to
  // work with.
  for (const question of exercise.activities) {
    checkQuestion(question, where)
  }
}

for (const concept of CONCEPTS.values()) {
  for (const question of concept.reviewPool) {
    checkQuestion(question, `Concept "${concept.id}" pool`)
  }
  if (concept.introducedIn < 1 || concept.introducedIn > TOTAL_EXERCISES) {
    fail(`Concept "${concept.id}": introducedIn ${concept.introducedIn} is outside the curriculum`)
  }
}

function checkQuestion(question: Question, where: string): void {
  if (seenQuestionIds.has(question.id)) fail(`${where}: duplicate question id "${question.id}"`)
  seenQuestionIds.add(question.id)

  if (!CONCEPTS.has(question.concept)) {
    fail(`${where}: question "${question.id}" uses unknown concept "${question.concept}"`)
  }

  const answers = expectedAnswer(question, WORD_BANK)
  if (answers.length === 0 || answers.some((a) => !a)) {
    fail(`${where}: question "${question.id}" has an empty expected answer`)
  }

  // Syllable activities need real syllables, not the rough fallback.
  if (question.type === 'syllableSplit') {
    const entry = WORD_BANK.get(question.word.toLowerCase())
    if (!entry) fail(`${where}: "${question.word}" is not in the word bank but is used for syllable splitting`)
    else if (entry.syllables.length < 2) {
      fail(`${where}: "${question.word}" has no syllable breaks in the word bank`)
    }
  }

  // Hints 4 and 5 need a pattern span to hide.
  if (question.type === 'missingPattern' || question.type === 'missingLetters') {
    const word = question.word.toLowerCase()
    const entry = WORD_BANK.get(word)
    if (!entry) warn(`${where}: "${question.word}" is not in the word bank; hints will fall back to a guessed pattern`)
    else if (!entry.patternSpan) {
      warn(`${where}: "${question.word}" has no marked pattern span; hints will guess which letters to hide`)
    }
  }

  // A choice list that does not contain the right answer is unwinnable.
  if (question.type === 'missingPattern' && question.choices) {
    const correct = expectedAnswer(question, WORD_BANK)[0] as string
    if (!question.choices.includes(correct)) {
      fail(`${where}: question "${question.id}" offers choices that do not include "${correct}"`)
    }
  }
  if (question.type === 'cloze' && question.choices && !question.choices.includes(question.answer)) {
    fail(`${where}: question "${question.id}" offers choices that do not include "${question.answer}"`)
  }

  // A cloze sentence needs somewhere for the answer to go.
  if (question.type === 'cloze' && !question.sentence.includes('___')) {
    fail(`${where}: cloze "${question.id}" has no ___ gap in its sentence`)
  }

  // The mistake being fixed has to actually appear in the sentence.
  if (question.type === 'findMistake') {
    if (!question.sentence.includes(question.wrong)) {
      fail(`${where}: "${question.id}" says "${question.wrong}" is wrong, but it is not in the sentence`)
    }
    if (question.wrong === question.right) {
      fail(`${where}: "${question.id}" says "${question.wrong}" is wrong, but its correction is the same word`)
    }
  }
  if (question.type === 'proofread') {
    for (const error of question.errors) {
      if (!question.text.includes(error.wrong)) {
        fail(`${where}: "${question.id}" lists "${error.wrong}" as a mistake, but it is not in the paragraph`)
      }
      // A "mistake" whose correction is the same word is unanswerable: the
      // child is asked to fix something that is already right.
      if (error.wrong === error.right) {
        fail(`${where}: "${question.id}" lists "${error.wrong}" as a mistake, but its correction is the same word`)
      }
    }
  }
  if (question.type === 'sentenceDictation' && question.targetWord) {
    if (!question.sentence.includes(question.targetWord)) {
      fail(`${where}: "${question.id}" targets "${question.targetWord}", which is not in the sentence`)
    }
  }
}

// --------------------------------------------------------------------- world

const gateUsage = new Map<string, string[]>()

for (const screen of SCREENS) {
  const where = `Screen "${screen.id}"`

  if (screen.rows.length !== SCREEN_ROWS) {
    fail(`${where}: has ${screen.rows.length} rows, expected ${SCREEN_ROWS}`)
  }
  screen.rows.forEach((row, index) => {
    if (row.length !== SCREEN_COLS) {
      fail(`${where}: row ${index} is ${row.length} tiles wide, expected ${SCREEN_COLS}`)
    }
    for (const char of row) {
      if (!(char in TILES)) fail(`${where}: row ${index} uses unknown tile "${char}"`)
    }
  })

  for (const [direction, target] of Object.entries(screen.exits)) {
    if (!screenById(target)) fail(`${where}: exit ${direction} leads to unknown screen "${target}"`)
  }

  for (const portal of screen.portals ?? []) {
    if (!screenById(portal.to)) fail(`${where}: portal leads to unknown screen "${portal.to}"`)
    const target = screenById(portal.to)
    if (target) {
      const tile = target.rows[portal.spawnRow]?.[portal.spawnCol] as TileChar | undefined
      if (tile && TILES[tile]?.solid) {
        fail(`${where}: portal to "${portal.to}" would drop the player inside a solid tile`)
      }
      // Returning the player onto the doorway they just used sends them
      // straight back through it.
      const back = (target.portals ?? []).find(
        (p) => p.to === screen.id && p.col === portal.spawnCol && p.row === portal.spawnRow,
      )
      if (back) {
        fail(`${where}: portal to "${portal.to}" lands on that screen's way back, trapping the player in a loop`)
      }
    }
  }

  for (const placement of screen.gates ?? []) {
    if (!gateById(placement.gateId)) fail(`${where}: unknown barrier "${placement.gateId}"`)
    const list = gateUsage.get(placement.gateId) ?? []
    list.push(screen.id)
    gateUsage.set(placement.gateId, list)

    if (placement.col < 0 || placement.col >= SCREEN_COLS || placement.row < 0 || placement.row >= SCREEN_ROWS) {
      fail(`${where}: barrier "${placement.gateId}" is placed off the screen`)
    }
  }

  for (const spawn of screen.spawns ?? []) {
    const tile = screen.rows[spawn.row]?.[spawn.col] as TileChar | undefined
    if (tile && TILES[tile]?.solid) {
      fail(`${where}: a ${spawn.kind} would spawn inside a solid tile at ${spawn.col},${spawn.row}`)
    }
  }
}

// --- how the screens join up ---------------------------------------------
//
// Every bug that actually reached the child was in the seams between screens
// rather than inside one: exits that dropped him in a river, a shop door
// walled in on four sides, barriers he could stroll around. None of it is
// visible looking at one screen at a time.

for (const problem of brokenExits()) {
  fail(`Exit: ${problem}`)
}
for (const problem of layoutConflicts()) {
  fail(`Map layout: ${problem}`)
}
for (const problem of unreachableDoors()) {
  fail(`Door: ${problem}`)
}
for (const problem of bypassableBarriers()) {
  fail(`Barrier: ${problem}`)
}

for (const [gateId, screens] of gateUsage) {
  if (screens.length > 1) fail(`Barrier "${gateId}" is placed on more than one screen: ${screens.join(', ')}`)
}
for (const gate of allGates()) {
  if (!gateUsage.has(gate.id)) {
    // Shop and smith barriers live in the shop UI rather than on a tile.
    if (gate.kind !== 'shop' && gate.kind !== 'smith') {
      warn(`Barrier "${gate.id}" is defined but never placed in the world`)
    }
  }
}

// The whole point of the barrier design: never run out of doors.
const major = majorGateCount()
if (major < TOTAL_EXERCISES) {
  fail(`Only ${major} exercise-consuming barriers for ${TOTAL_EXERCISES} exercises — some exercises would have no door to open`)
}

// ---------------------------------------------------------------------- shop

for (const id of [...VILLAGE_SHOP, ...SECRET_SHOP]) {
  const item = ITEMS[id]
  if (!item) fail(`Shop lists unknown item "${id}"`)
  else if (item.price === undefined) fail(`Shop sells "${id}", which has no price`)
}
for (const item of Object.values(ITEMS)) {
  if (item.requires && !ITEMS[item.requires]) fail(`Item "${item.id}" requires unknown item "${item.requires}"`)
  if (item.gate && !gateById(item.gate)) fail(`Item "${item.id}" is gated by unknown barrier "${item.gate}"`)
}

// -------------------------------------------------------------------- report

const exercisesWritten = EXERCISES.length
console.log(`Curriculum: ${exercisesWritten} of ${TOTAL_EXERCISES} exercises written`)
console.log(`Concepts:   ${CONCEPTS.size}  ·  word bank: ${WORD_BANK.size} words`)
console.log(`World:      ${SCREENS.length} screens  ·  ${totalGateCount()} barriers (${major} consume an exercise)`)
console.log('')

for (const warning of warnings) console.log(`  warn  ${warning}`)
for (const problem of problems) console.log(`  FAIL  ${problem}`)

if (problems.length > 0) {
  console.log(`\n${problems.length} problem${problems.length === 1 ? '' : 's'} found.`)
  process.exit(1)
}
console.log(`No problems.${warnings.length > 0 ? ` ${warnings.length} warning${warnings.length === 1 ? '' : 's'}.` : ''}`)
