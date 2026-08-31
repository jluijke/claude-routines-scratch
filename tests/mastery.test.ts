import { describe, expect, it } from 'vitest'
import {
  emptyMasteryStore,
  isMastered,
  masteredCount,
  recordAttempt,
  strugglingConcepts,
} from '../src/spelling/mastery'

describe('mastery tracking', () => {
  it('counts only an unaided first-attempt answer as mastery', () => {
    const store = emptyMasteryStore()
    recordAttempt(store, { concept: 'ee-sound', correct: true, firstAttempt: true, hintsUsed: 0 })
    expect(isMastered(store, 'ee-sound')).toBe(true)
  })

  it('does not count a hinted answer as mastery', () => {
    const store = emptyMasteryStore()
    recordAttempt(store, { concept: 'ee-sound', correct: true, firstAttempt: true, hintsUsed: 2 })
    expect(isMastered(store, 'ee-sound')).toBe(false)
  })

  it('does not count a second-attempt answer as mastery', () => {
    const store = emptyMasteryStore()
    recordAttempt(store, { concept: 'oa-sound', correct: false, firstAttempt: true, hintsUsed: 0, word: 'boat' })
    recordAttempt(store, { concept: 'oa-sound', correct: true, firstAttempt: false, hintsUsed: 0 })
    expect(isMastered(store, 'oa-sound')).toBe(false)
    expect(store.concepts['oa-sound']?.status).toBe('shaky')
  })

  it('restores mastery once the child answers a fresh question unaided', () => {
    const store = emptyMasteryStore()
    recordAttempt(store, { concept: 'oa-sound', correct: false, firstAttempt: true, hintsUsed: 0, word: 'boat' })
    recordAttempt(store, { concept: 'oa-sound', correct: true, firstAttempt: false, hintsUsed: 0 })
    recordAttempt(store, { concept: 'oa-sound', correct: true, firstAttempt: true, hintsUsed: 0 })
    expect(isMastered(store, 'oa-sound')).toBe(true)
  })

  it('drops back to shaky when a mastered concept is missed later', () => {
    const store = emptyMasteryStore()
    recordAttempt(store, { concept: 'syllables', correct: true, firstAttempt: true, hintsUsed: 0 })
    recordAttempt(store, { concept: 'syllables', correct: false, firstAttempt: true, hintsUsed: 0, word: 'picnic' })
    expect(store.concepts['syllables']?.status).toBe('shaky')
  })

  it('remembers the words a child keeps missing, for the parent view', () => {
    const store = emptyMasteryStore()
    recordAttempt(store, { concept: 'ee-sound', correct: false, firstAttempt: true, hintsUsed: 0, word: 'beach' })
    recordAttempt(store, { concept: 'ee-sound', correct: false, firstAttempt: true, hintsUsed: 0, word: 'monkey' })
    expect(store.concepts['ee-sound']?.missedWords).toEqual(['beach', 'monkey'])
    expect(store.concepts['ee-sound']?.repeatMistakes).toBe(1)
  })

  it('ranks struggling concepts so review can target the worst first', () => {
    const store = emptyMasteryStore()
    recordAttempt(store, { concept: 'ee-sound', correct: false, firstAttempt: true, hintsUsed: 0, word: 'beach' })
    for (let i = 0; i < 3; i++) {
      recordAttempt(store, { concept: 'oa-sound', correct: false, firstAttempt: true, hintsUsed: 1, word: 'boat' })
    }
    expect(strugglingConcepts(store)[0]).toBe('oa-sound')
  })

  it('counts mastered patterns for the progress screen', () => {
    const store = emptyMasteryStore()
    recordAttempt(store, { concept: 'a', correct: true, firstAttempt: true, hintsUsed: 0 })
    recordAttempt(store, { concept: 'b', correct: true, firstAttempt: true, hintsUsed: 0 })
    recordAttempt(store, { concept: 'c', correct: false, firstAttempt: true, hintsUsed: 0 })
    expect(masteredCount(store)).toBe(2)
  })
})
