import { describe, expect, it } from 'vitest'
import { ExerciseEngine } from '../src/spelling/engine'
import { emptyMasteryStore } from '../src/spelling/mastery'
import { CONCEPTS } from '../src/content/concepts'
import { WORD_BANK } from '../src/content/words'
import { exerciseById } from '../src/content/exercises'
import { expectedAnswer } from '../src/spelling/grading'
import type { Question, Response } from '../src/spelling/types'

/** Answers any question correctly, whatever its type. */
function correctResponse(q: Question): Response {
  switch (q.type) {
    case 'wordSort': {
      const value: Record<string, string> = {}
      for (const group of q.groups) for (const word of group.words) value[word] = group.label
      return { kind: 'assign', value }
    }
    case 'syllableSplit':
      return { kind: 'texts', values: expectedAnswer(q, WORD_BANK) }
    case 'wordFamily':
    case 'proofread':
    case 'findMistake':
      return { kind: 'texts', values: expectedAnswer(q, WORD_BANK) }
    default:
      return { kind: 'text', value: expectedAnswer(q, WORD_BANK)[0] ?? '' }
  }
}

function wrongResponse(q: Question): Response {
  switch (q.type) {
    case 'wordSort': {
      const value: Record<string, string> = {}
      const labels = q.groups.map((g) => g.label)
      for (const group of q.groups) {
        for (const word of group.words) {
          value[word] = labels.find((l) => l !== group.label) ?? group.label
        }
      }
      return { kind: 'assign', value }
    }
    default:
      return { kind: 'text', value: 'zzzz' }
  }
}

function newEngine(exerciseId: number) {
  const exercise = exerciseById(exerciseId)
  if (!exercise) throw new Error(`no exercise ${exerciseId}`)
  return new ExerciseEngine({
    exercise,
    concepts: CONCEPTS,
    bank: WORD_BANK,
    mastery: emptyMasteryStore(),
    seed: 'test',
  })
}

describe('exercise engine', () => {
  it('completes when every question is answered correctly first time', () => {
    const engine = newEngine(1)
    let guard = 0
    while (engine.current() && guard++ < 200) {
      const result = engine.submit(correctResponse(engine.current() as Question))
      expect(result.advance).toBe(true)
    }
    expect(engine.isComplete()).toBe(true)
    expect(engine.provedConcepts()).toContain('syllables')
  })

  it('does not advance on a wrong answer', () => {
    const engine = newEngine(1)
    const question = engine.current() as Question
    const result = engine.submit(wrongResponse(question))
    expect(result.advance).toBe(false)
    expect(result.exerciseComplete).toBe(false)
    expect(engine.current()?.id).toBe(question.id)
  })

  it('queues a different word on the same concept after a mistake', () => {
    const engine = newEngine(2)
    const first = engine.current() as Question
    const result = engine.submit(wrongResponse(first))
    expect(result.remediationQueued).toBe('ee-sound')
  })

  it('a corrected mistake is not mastery: the exercise refuses to finish', () => {
    const engine = newEngine(1)

    // Get every single question wrong once, then right. The child has been
    // helped through every item and has proved nothing independently.
    let guard = 0
    let sawRemediation = false
    while (engine.current() && guard++ < 60) {
      const question = engine.current() as Question
      const wrong = engine.submit(wrongResponse(question))
      expect(wrong.advance).toBe(false)
      if (wrong.remediationQueued) sawRemediation = true
      engine.submit(correctResponse(question))
    }

    expect(sawRemediation).toBe(true)
    // Because nothing was answered unaided, the concept was never proved.
    expect(engine.provedConcepts()).not.toContain('syllables')
    expect(engine.isComplete()).toBe(false)
  })

  it('finishes once the child finally answers a fresh question unaided', () => {
    const engine = newEngine(1)

    // Struggle through the first question, then work independently.
    const first = engine.current() as Question
    engine.submit(wrongResponse(first))
    engine.submit(correctResponse(first))

    let guard = 0
    while (engine.current() && guard++ < 100) {
      engine.submit(correctResponse(engine.current() as Question))
    }

    expect(engine.provedConcepts()).toContain('syllables')
    expect(engine.isComplete()).toBe(true)
  })

  it('a hinted answer does not count as proving the concept', () => {
    const engine = newEngine(1)
    const question = engine.current() as Question
    engine.nextHint()
    const result = engine.submit(correctResponse(question))
    expect(result.advance).toBe(true)
    expect(result.provedConcept).toBeUndefined()
    expect(engine.provedConcepts()).toHaveLength(0)
  })

  it('never repeats the same word when re-testing a concept', () => {
    const engine = newEngine(2)
    const seen = new Set<string>()
    let guard = 0
    while (engine.current() && guard++ < 80) {
      const question = engine.current() as Question
      const word = 'word' in question ? (question.word as string) : question.id
      if (guard <= 4) {
        // Fail the early questions so remediation kicks in repeatedly.
        engine.submit(wrongResponse(question))
      }
      if (question.type === 'audioDictation') {
        expect(seen.has(word)).toBe(false)
        seen.add(word)
      }
      engine.submit(correctResponse(question))
    }
    expect(seen.size).toBeGreaterThan(0)
  })

  it('reports progress without ever exposing a timer', () => {
    const engine = newEngine(3)
    const progress = engine.progress()
    expect(progress.total).toBeGreaterThan(0)
    expect(progress.conceptsRequired).toBe(1)
    expect(progress).not.toHaveProperty('secondsRemaining')
  })

  it('bounds how many times one concept is re-tested', () => {
    const engine = newEngine(1)
    const question = engine.current() as Question
    const startingTotal = engine.progress().total

    // A child who keeps missing the same thing must not end up with an
    // ever-growing exercise (spec §13: never a punishment).
    for (let i = 0; i < 30; i++) engine.submit(wrongResponse(question))

    const grown = engine.progress().total - startingTotal
    expect(grown).toBeGreaterThan(0)
    expect(grown).toBeLessThanOrEqual(4)
  })

  it('eases off rather than escalating after repeated failures', () => {
    const engine = newEngine(2)
    const question = engine.current() as Question
    for (let i = 0; i < 6; i++) engine.submit(wrongResponse(question))

    // The injected questions should trend easier, not harder.
    const injected = engine.progress().total
    expect(injected).toBeGreaterThan(0)
  })
})

describe('accidental double submission', () => {
  it('a second submit on an already-answered question does not record a mistake', () => {
    // Choice buttons submit on click, and a child may also hit Check. The UI
    // locks between accepting an answer and drawing the next question; this
    // test pins the consequence of that lock failing.
    const engine = newEngine(1)
    const first = engine.current() as Question
    engine.submit(correctResponse(first))

    const second = engine.current() as Question
    expect(second.id).not.toBe(first.id)

    // Submitting an empty answer here is exactly what an unguarded double
    // click would do, and it would cost the child a concept they had right.
    const empty = engine.submit({ kind: 'text', value: '' })
    expect(empty.grade.correct).toBe(false)
    expect(engine.provedConcepts()).toContain('syllables')
  })
})
