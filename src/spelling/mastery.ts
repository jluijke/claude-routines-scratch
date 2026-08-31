/**
 * Per-concept mastery tracking — spec §13.
 *
 * The rule that shapes everything: a corrected mistake is not mastery. Only an
 * answer that is right on the first attempt, with no hints used, counts as the
 * child demonstrating the concept independently.
 */
import type { ConceptId } from './types'

export type MasteryStatus = 'unseen' | 'learning' | 'shaky' | 'mastered'

export interface ConceptRecord {
  concept: ConceptId
  attempted: number
  /** Right first time with no hints. The only thing that proves mastery. */
  independentCorrect: number
  hintsUsed: number
  /** Times the child got this concept wrong after already missing it once. */
  repeatMistakes: number
  lastSuccessAt?: number
  lastSeenAt?: number
  status: MasteryStatus
  /** Words missed on this concept, newest last. Feeds the parent dashboard. */
  missedWords: string[]
}

export interface MasteryStore {
  concepts: Record<ConceptId, ConceptRecord>
}

export function emptyMasteryStore(): MasteryStore {
  return { concepts: {} }
}

export function recordFor(store: MasteryStore, concept: ConceptId): ConceptRecord {
  let record = store.concepts[concept]
  if (!record) {
    record = {
      concept,
      attempted: 0,
      independentCorrect: 0,
      hintsUsed: 0,
      repeatMistakes: 0,
      status: 'unseen',
      missedWords: [],
    }
    store.concepts[concept] = record
  }
  return record
}

export interface AttemptOutcome {
  concept: ConceptId
  correct: boolean
  /** False once the child has already tried this question. */
  firstAttempt: boolean
  hintsUsed: number
  /** The word involved, recorded when missed so a parent can see the pattern. */
  word?: string
  at?: number
}

/** Applies one answered attempt to the store and returns the updated record. */
export function recordAttempt(store: MasteryStore, outcome: AttemptOutcome): ConceptRecord {
  const record = recordFor(store, outcome.concept)
  const at = outcome.at ?? Date.now()
  record.lastSeenAt = at

  if (outcome.firstAttempt) record.attempted += 1
  record.hintsUsed += outcome.hintsUsed

  if (outcome.correct) {
    const independent = outcome.firstAttempt && outcome.hintsUsed === 0
    if (independent) {
      record.independentCorrect += 1
      record.lastSuccessAt = at
      record.status = 'mastered'
    } else if (record.status === 'unseen') {
      record.status = 'learning'
    }
    // A hinted or second-attempt success leaves 'shaky' in place on purpose:
    // the child still owes an independent answer on this concept.
    return record
  }

  if (record.status === 'shaky' || record.missedWords.length > 0) {
    record.repeatMistakes += 1
  }
  record.status = 'shaky'
  if (outcome.word) {
    record.missedWords.push(outcome.word)
    if (record.missedWords.length > 20) record.missedWords.shift()
  }
  return record
}

export function isMastered(store: MasteryStore, concept: ConceptId): boolean {
  return store.concepts[concept]?.status === 'mastered'
}

/** Concepts the child keeps missing, worst first — drives adaptive review. */
export function strugglingConcepts(store: MasteryStore): ConceptId[] {
  return Object.values(store.concepts)
    .filter((r) => r.status === 'shaky' || r.repeatMistakes > 0)
    .sort((a, b) => {
      const byRepeat = b.repeatMistakes - a.repeatMistakes
      if (byRepeat !== 0) return byRepeat
      return b.hintsUsed - a.hintsUsed
    })
    .map((r) => r.concept)
}

export function masteredCount(store: MasteryStore): number {
  return Object.values(store.concepts).filter((r) => r.status === 'mastered').length
}
