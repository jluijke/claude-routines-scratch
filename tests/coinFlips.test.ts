/**
 * No question in the game may offer a choice of two.
 *
 * He was answering the grammar questions without reading them, and he was
 * right to: two buttons pay out half the time for no effort at all, and four
 * of them bought a sack of animal food. A hundred and ten questions were built
 * that way — twenty spelling-pattern ones, six homophone sentences, and every
 * single question in five of the six grammar rules.
 *
 * They are now written rather than clicked. What could not sensibly be typed —
 * where a comma belongs inside a phrase — was given a genuine third option
 * instead, so there is nothing left anywhere to flip a coin on.
 */
import { describe, expect, it } from 'vitest'
import { EXERCISES } from '../src/content/exercises'
import { INTRO_CANDLE } from '../src/content/exercises/intro-candle'
import { CONCEPTS } from '../src/content/concepts'
import { GRAMMAR_RULES } from '../src/content/grammar'
import { hasAudio } from '../src/spelling/hints'
import { matches } from '../src/spelling/normalise'
import type { Question } from '../src/spelling/types'

/** Every question a child can be shown, wherever it is authored. */
const ALL: Question[] = [
  ...INTRO_CANDLE.activities,
  ...EXERCISES.flatMap((e) => e.activities),
  ...[...CONCEPTS.values()].flatMap((c) => c.reviewPool),
  ...GRAMMAR_RULES.flatMap((r) => r.questions),
]

const choicesOf = (q: Question): string[] => (q as { choices?: string[] }).choices ?? []

describe('nothing in the game is a coin flip', () => {
  it('has the whole content set to look at', () => {
    expect(ALL.length).toBeGreaterThan(800)
  })

  it('offers no question with exactly two options', () => {
    const coins = ALL.filter((q) => choicesOf(q).length === 2).map((q) => q.id)
    expect(coins).toEqual([])
  })

  it('offers at least three wherever it offers any', () => {
    for (const q of ALL) {
      const n = choicesOf(q).length
      if (n > 0) expect(n).toBeGreaterThanOrEqual(3)
    }
  })

  it('never leaves a question claiming to be a choice with nothing to choose from', () => {
    // inputMode and choices are set from the same place, but they are separate
    // fields, and a select question with no buttons renders an empty row.
    for (const q of ALL) {
      if ((q as { inputMode?: string }).inputMode === 'select') {
        expect(choicesOf(q).length).toBeGreaterThanOrEqual(3)
      }
    }
  })
})

describe('what replaced them is answerable', () => {
  const typedCloze = ALL.filter(
    (q) => q.type === 'cloze' && (q as { inputMode?: string }).inputMode === 'type',
  )
  const typedPattern = ALL.filter(
    (q) => q.type === 'missingPattern' && (q as { inputMode?: string }).inputMode === 'type',
  )

  it('converted the ones that were coins', () => {
    expect(typedCloze.length).toBeGreaterThan(70)
    expect(typedPattern.length).toBeGreaterThan(20)
  })

  it('says the word aloud for every typed pattern question', () => {
    // "tr__" with no audio is not a question with one answer: tray, trip and
    // true all fit the frame.
    for (const q of typedPattern) expect(hasAudio(q)).toBe(true)
  })

  it('reads the sentence aloud for every typed gap', () => {
    for (const q of typedCloze) expect(hasAudio(q)).toBe(true)
  })

  it('tells the child which word to work from', () => {
    // An open gap in an ordinary sentence has several honest answers — "the
    // garden is full of ___" is flowers as happily as bushes — so a typed gap
    // without a prompt naming the base word is a question with no answer.
    for (const q of typedCloze) {
      expect(q.prompt, q.id).toBeTruthy()
      // And names it in so many words, rather than gesturing at it.
      expect(q.prompt, q.id).toMatch(/"[^"]+"/)
    }
  })

  it('can still tell an apostrophe apart once the buttons are gone', () => {
    // Grading forgives capitals and stray full stops. It must not forgive
    // these, or half the apostrophe rule would mark either answer correct.
    expect(matches('its', 'it’s')).toBe(false)
    expect(matches('brothers', 'brother’s')).toBe(false)
    expect(matches('dogs', 'dogs’')).toBe(false)
    expect(matches('your', "you're")).toBe(false)
    // And it must still forgive the straight apostrophe a keyboard produces.
    expect(matches("it's", 'it’s')).toBe(true)
    expect(matches('IT’S', 'it’s')).toBe(true)
  })

  it('can still tell a comma apart, which the comma rule lives on', () => {
    const commas = GRAMMAR_RULES.find((r) => r.id === 'grammar-commas')
    expect(commas).toBeDefined()
    for (const q of commas?.questions ?? []) {
      // Without punctuationMatters, normalising strips commas and every option
      // in a list question becomes the same string.
      if (choicesOf(q).some((c) => c.includes(','))) {
        expect((q as { punctuationMatters?: boolean }).punctuationMatters, q.id).toBe(true)
      }
    }
    expect(matches('bread cheese and apples', 'bread, cheese and apples', { punctuationMatters: true })).toBe(false)
    expect(matches('After lunch.', 'After lunch,', { punctuationMatters: true })).toBe(false)
  })

  it('counts the commas in a list of four correctly', () => {
    // Four items take a comma after the first two and "and" in place of the
    // last: apples, pears, figs and plums. This question asked for three,
    // which is the Oxford comma the rule above tells him not to use.
    const q = GRAMMAR_RULES.flatMap((r) => r.questions).find((x) => x.id === 'gr-com-7')
    expect((q as { answer?: string } | undefined)?.answer).toBe('two')
  })
})
