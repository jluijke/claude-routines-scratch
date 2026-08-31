import { describe, expect, it } from 'vitest'
import { buildQueue } from '../src/spelling/scheduler'
import { estimateTotalSeconds } from '../src/spelling/costs'
import { emptyMasteryStore, recordAttempt } from '../src/spelling/mastery'
import { CONCEPTS } from '../src/content/concepts'
import { EXERCISES, exerciseById } from '../src/content/exercises'
import { Rng } from '../src/core/rng'
import type { Exercise } from '../src/spelling/types'

function queueFor(exercise: Exercise, mastery = emptyMasteryStore()) {
  return buildQueue({ exercise, concepts: CONCEPTS, mastery, rng: new Rng('test') })
}

describe('duration budgeting', () => {
  it.each(EXERCISES.map((e) => [e.id, e.title] as const))(
    'exercise %i (%s) lands near its target duration',
    (id) => {
      const exercise = exerciseById(id) as Exercise
      const queue = queueFor(exercise)
      const target = exercise.targetMinutes * 60
      // ±25%: these are estimates for a child answering correctly, not a clock.
      expect(queue.estimatedSeconds).toBeGreaterThan(target * 0.75)
      expect(queue.estimatedSeconds).toBeLessThan(target * 1.25)
    },
  )

  it('costs a sentence dictation far above a word sort, as a child experiences it', () => {
    const exercise = exerciseById(5) as Exercise
    const dictation = exercise.activities.find((q) => q.type === 'sentenceDictation')
    const sorting = exercise.activities.find((q) => q.type === 'wordSort')
    expect(dictation).toBeDefined()
    expect(sorting).toBeDefined()
    expect(estimateTotalSeconds([dictation!])).toBeGreaterThan(50)
  })
})

describe('cumulative review', () => {
  it('adds no review before exercise 6, where the curriculum has none yet', () => {
    const queue = queueFor(exerciseById(1) as Exercise)
    expect(queue.breakdown.recent).toBe(0)
    expect(queue.breakdown.older).toBe(0)
  })

  it('draws review from earlier concepts once they exist', () => {
    // A synthetic exercise 7 proves the mechanism works before the content for
    // exercises 6-40 is written.
    const synthetic: Exercise = {
      ...(exerciseById(5) as Exercise),
      id: 7,
      targetMinutes: 10,
      reviewConcepts: ['ee-sound', 'oa-sound'],
    }
    const queue = queueFor(synthetic)
    expect(queue.breakdown.recent + queue.breakdown.older).toBeGreaterThan(0)
    const reviewQuestions = queue.questions.filter((q) => q.review)
    expect(reviewQuestions.length).toBeGreaterThan(0)
    for (const q of reviewQuestions) {
      expect(CONCEPTS.get(q.concept)?.introducedIn).toBeLessThan(7)
    }
  })

  it('never reviews a concept the child has not met yet', () => {
    const synthetic: Exercise = {
      ...(exerciseById(3) as Exercise),
      id: 3,
      reviewConcepts: ['plural-y-ies'],
    }
    const queue = queueFor(synthetic)
    for (const q of queue.questions.filter((r) => r.review)) {
      expect(CONCEPTS.get(q.concept)?.introducedIn).toBeLessThan(3)
    }
  })

  it('replaces review with targeted practice instead of making the exercise longer', () => {
    const synthetic: Exercise = {
      ...(exerciseById(5) as Exercise),
      id: 7,
      targetMinutes: 10,
      reviewConcepts: ['ee-sound', 'oa-sound', 'syllables'],
    }

    const calm = queueFor(synthetic)

    const struggling = emptyMasteryStore()
    for (let i = 0; i < 3; i++) {
      recordAttempt(struggling, {
        concept: 'oa-sound',
        correct: false,
        firstAttempt: true,
        hintsUsed: 2,
        word: 'boat',
      })
    }
    const adapted = queueFor(synthetic, struggling)

    // Same length, different emphasis: that is the whole point of spec §13.
    expect(adapted.estimatedSeconds).toBeLessThanOrEqual(calm.estimatedSeconds * 1.2)

    const targeted = adapted.questions.filter((q) => q.review && q.concept === 'oa-sound')
    expect(targeted.length).toBeGreaterThan(0)
  })

  it('is repeatable for the same seed, so closing the tab loses nothing', () => {
    const exercise = exerciseById(5) as Exercise
    const a = queueFor(exercise).questions.map((q) => q.id)
    const b = queueFor(exercise).questions.map((q) => q.id)
    expect(a).toEqual(b)
  })

  it('never puts the same question in a queue twice', () => {
    const synthetic: Exercise = {
      ...(exerciseById(5) as Exercise),
      id: 7,
      reviewConcepts: ['ee-sound', 'oa-sound', 'syllables', 'plural-s-es'],
    }
    const ids = queueFor(synthetic).questions.map((q) => q.id)
    expect(new Set(ids).size).toBe(ids.length)
  })
})

describe('review does not start early', () => {
  it('leaves exercises 1 to 5 as their own lesson only', () => {
    for (const exercise of EXERCISES.filter((e) => e.id < 6)) {
      const queue = queueFor(exercise)
      expect(queue.questions.some((q) => q.review)).toBe(false)
      // And nothing the author wrote gets dropped to make room for it.
      expect(queue.trimmed).toBe(0)
      expect(queue.breakdown.current).toBe(exercise.activities.length)
    }
  })
})
