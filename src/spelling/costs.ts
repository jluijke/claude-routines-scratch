/**
 * How long each question takes a child who is answering correctly.
 *
 * The scheduler fills an exercise to its time budget using these estimates
 * rather than counting questions — spec §11. A sentence dictation is worth
 * three word sorts, so raw counts would never hold the 10-minute target.
 */
import type { Question } from './types'

const DIFFICULTY_MULTIPLIER: Record<1 | 2 | 3, number> = {
  1: 1,
  2: 1.15,
  3: 1.3,
}

export function baseSeconds(q: Question): number {
  switch (q.type) {
    case 'audioDictation':
      return q.withSentence ? 24 : 20
    case 'sentenceDictation':
      return q.targetWord ? 30 : 65
    case 'missingLetters':
      return 18
    case 'missingPattern':
      return q.inputMode === 'type' ? 20 : 14
    case 'wordSort':
      return 10 + q.groups.reduce((sum, g) => sum + g.words.length, 0) * 8
    case 'syllableSplit':
      return q.thenSpell === false ? 18 : 30
    case 'wordBuild':
      return 20
    case 'wordFamily':
      return 10 + q.targets.length * 25
    case 'cloze':
      return q.inputMode === 'type' ? 22 : 15
    case 'findMistake':
      return 30
    case 'proofread':
      return 20 + q.errors.length * 25
    case 'visualMemory':
      return 22
  }
}

export function estimateSeconds(q: Question): number {
  return Math.round(baseSeconds(q) * DIFFICULTY_MULTIPLIER[q.difficulty])
}

export function estimateTotalSeconds(questions: readonly Question[]): number {
  return questions.reduce((sum, q) => sum + estimateSeconds(q), 0)
}
