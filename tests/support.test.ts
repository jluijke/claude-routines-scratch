import { describe, expect, it } from 'vitest'
import { ExerciseEngine, SIBLING_COUNT, stemOf, wordsOf } from '../src/spelling/engine'
import { emptyMasteryStore, recordAttempt } from '../src/spelling/mastery'
import { focusWord } from '../src/spelling/hints'
import { CONCEPTS } from '../src/content/concepts'
import { WORD_BANK } from '../src/content/words'
import { EXERCISES } from '../src/content/exercises'
import { aud, letters } from '../src/content/build'
import { expectedAnswer } from '../src/spelling/grading'
import type { Exercise, Question, Response } from '../src/spelling/types'

const CONCEPT = 'australian-spelling'

/** A lesson of nothing but "hear it, type it" questions on one pattern. */
const LESSON: Exercise = {
  id: 999,
  title: 'Support test',
  level: 5,
  levelName: 'Test',
  targetMinutes: 3,
  concepts: [CONCEPT],
  reviewConcepts: [],
  activities: [
    aud('s-1', CONCEPT, 'harbour'),
    aud('s-2', CONCEPT, 'flavour'),
    aud('s-3', CONCEPT, 'colour'),
    aud('s-4', CONCEPT, 'neighbour'),
  ],
  ruleReveal: { title: 'Test', text: 'Test', examples: ['colour'] },
}

function correctResponse(q: Question): Response {
  switch (q.type) {
    case 'wordSort': {
      const value: Record<string, string> = {}
      for (const group of q.groups) for (const word of group.words) value[word] = group.label
      return { kind: 'assign', value }
    }
    case 'syllableSplit':
    case 'wordFamily':
    case 'proofread':
    case 'findMistake':
      return { kind: 'texts', values: expectedAnswer(q, WORD_BANK) }
    default:
      return { kind: 'text', value: expectedAnswer(q, WORD_BANK)[0] ?? '' }
  }
}

function newEngine(exercise: Exercise = LESSON, mastery = emptyMasteryStore()) {
  return new ExerciseEngine({ exercise, concepts: CONCEPTS, bank: WORD_BANK, mastery, seed: 'support' })
}

describe('support while a pattern is being learned', () => {
  it('shows the rule and a few words like it on an unmastered pattern', () => {
    const engine = newEngine()
    const support = engine.support()
    expect(support).toBeDefined()
    expect(support?.rule).toBe(CONCEPTS.get(CONCEPT)?.patternReminder)
    expect(support?.siblings.length).toBeGreaterThan(0)
    expect(support?.siblings.length).toBeLessThanOrEqual(SIBLING_COUNT)
    expect(support?.siblings).not.toContain('harbour')
    // Words sharing the tricky letters come first.
    for (const word of support?.siblings ?? []) expect(word).toMatch(/our$/)
  })

  it('writes in the start of the word on the first audio question of a pattern', () => {
    const engine = newEngine()
    const stem = engine.support()?.stem
    expect(stem).toBe('har')
    expect('harbour'.startsWith(stem as string)).toBe(true)
  })

  it('holds the support still while the child looks at one question', () => {
    const engine = newEngine()
    expect(engine.support()).toBe(engine.support())
  })

  it('does not count an answer finished from a stem as proof, then offers a plain question to prove it', () => {
    const mastery = emptyMasteryStore()
    const engine = newEngine(LESSON, mastery)
    expect(engine.support()?.stem).toBeDefined()
    const first = engine.submit(correctResponse(engine.current() as Question))
    expect(first.advance).toBe(true)
    expect(first.provedConcept).toBeUndefined()
    expect(mastery.concepts[CONCEPT]?.status).toBe('learning')

    // Second question on the pattern: rule and words stay, the stem goes.
    const support = engine.support()
    expect(support?.rule).toBeTruthy()
    expect(support?.siblings.length).toBeGreaterThan(0)
    expect(support?.stem).toBeUndefined()

    const second = engine.submit(correctResponse(engine.current() as Question))
    expect(second.provedConcept).toBe(CONCEPT)
    expect(mastery.concepts[CONCEPT]?.status).toBe('mastered')
  })

  it('brings the stem back on the next question after a miss', () => {
    const engine = newEngine()
    engine.submit(correctResponse(engine.current() as Question)) // stemmed, fine
    expect(engine.support()?.stem).toBeUndefined()
    engine.submit({ kind: 'text', value: 'zzzz' }) // a miss
    engine.submit(correctResponse(engine.current() as Question)) // retry, moves on
    expect(engine.support()?.stem).toBeDefined()
  })

  it('keeps the rule and words up for the whole lesson that teaches the pattern', () => {
    const mastery = emptyMasteryStore()
    const engine = newEngine(LESSON, mastery)
    engine.submit(correctResponse(engine.current() as Question)) // stemmed
    engine.submit(correctResponse(engine.current() as Question)) // plain, proves it
    expect(mastery.concepts[CONCEPT]?.status).toBe('mastered')
    expect(engine.support()?.rule).toBeTruthy()
    expect(engine.support()?.stem).toBeUndefined()
  })

  it('stops writing in the start once he has typed one whole word unaided', () => {
    const engine = newEngine()
    expect(engine.support()?.stem).toBeDefined()
    engine.submit(correctResponse(engine.current() as Question))
    expect(engine.support()?.stem).toBeUndefined()
    engine.submit(correctResponse(engine.current() as Question))
    expect(engine.support()?.stem).toBeUndefined()
    engine.submit(correctResponse(engine.current() as Question))
    expect(engine.support()?.stem).toBeUndefined()
  })

  it('offers no support on a review question whose pattern is already mastered', () => {
    const review: Exercise = { ...LESSON, activities: [aud('r-1', 'ee-sound', 'green')] }
    const mastery = emptyMasteryStore()
    recordAttempt(mastery, { concept: 'ee-sound', correct: true, firstAttempt: true, hintsUsed: 0 })
    const engine = newEngine(review, mastery)
    expect(engine.current()?.concept).toBe('ee-sound')
    expect(engine.support()).toBeUndefined()
  })

  it('supports a review question whose pattern is not yet mastered', () => {
    const review: Exercise = { ...LESSON, activities: [aud('r-1', 'ee-sound', 'green')] }
    const engine = newEngine(review, emptyMasteryStore())
    expect(engine.support()?.rule).toBe(CONCEPTS.get('ee-sound')?.patternReminder)
    expect(engine.support()?.stem).toBe('gr')
  })

  it('only writes in the start on hear-and-type questions', () => {
    const lesson: Exercise = { ...LESSON, activities: [letters('s-l', CONCEPT, 'theatre'), aud('s-a', CONCEPT, 'litre')] }
    const engine = newEngine(lesson)
    expect(engine.current()?.type).toBe('missingLetters')
    expect(engine.support()?.stem).toBeUndefined()
    expect(engine.support()?.rule).toBeTruthy()
  })

  it('never lists the word being asked, across every exercise', () => {
    for (const exercise of EXERCISES) {
      const engine = newEngine(exercise)
      let guard = 0
      while (engine.current() && guard++ < 120) {
        const question = engine.current() as Question
        const support = engine.support()
        if (support) {
          expect(support.siblings.length).toBeLessThanOrEqual(SIBLING_COUNT)
          const target = focusWord(question, WORD_BANK).toLowerCase()
          expect(support.siblings.map((w) => w.toLowerCase())).not.toContain(target)
          if (support.stem !== undefined) {
            expect(question.type).toBe('audioDictation')
            const word = (question as { word: string }).word
            expect(word.startsWith(support.stem)).toBe(true)
            expect(support.stem.length).toBeLessThanOrEqual(word.length - 2)
          }
        }
        engine.submit(correctResponse(question))
      }
    }
  })
})

describe('stemOf', () => {
  it('gives the first beat of a word with more than one', () => {
    expect(stemOf('harbour', WORD_BANK)).toBe('har')
    expect(stemOf('neighbour', WORD_BANK)).toBe('neigh')
  })

  it('gives the letters before the tricky part of a one-beat word', () => {
    expect(stemOf('boat', WORD_BANK)).toBe('b')
  })

  it('always leaves at least two letters to spell and shows at least one', () => {
    expect(stemOf('to', WORD_BANK)).toBe('')
    expect(stemOf('eat', WORD_BANK)).toBe('e')
    for (const word of WORD_BANK.keys()) {
      const stem = stemOf(word, WORD_BANK)
      if (word.length < 3) continue
      expect(stem.length).toBeGreaterThanOrEqual(1)
      expect(stem.length).toBeLessThanOrEqual(word.length - 2)
    }
  })
})

describe('wordsOf', () => {
  it('lists every word a question asks for', () => {
    expect(wordsOf(aud('x', CONCEPT, 'colour'))).toEqual(['colour'])
    expect(
      wordsOf({
        id: 'x',
        concept: CONCEPT,
        type: 'wordSort',
        difficulty: 1,
        groups: [
          { label: 'a', words: ['colour', 'flavour'] },
          { label: 'b', words: ['centre'] },
        ],
      }),
    ).toEqual(['colour', 'flavour', 'centre'])
  })
})
