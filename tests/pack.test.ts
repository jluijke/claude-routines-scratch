/**
 * The second spelling pack, exercises 41 to 60.
 *
 * What was asked for: contractions, compound words and dictation; Year 3
 * mostly, Year 4 sometimes, never Year 5. The first three are checked by
 * the concepts the pack teaches. The last cannot be proved by a test, but a
 * Year 5 word is almost always a long one, so no single word the child is
 * asked to spell in this pack runs past twelve letters.
 */
import { describe, expect, it } from 'vitest'
import { EXERCISES, TOTAL_EXERCISES } from '../src/content/exercises'
import { CONCEPTS } from '../src/content/concepts'
import type { Question } from '../src/spelling/types'

const pack = EXERCISES.filter((e) => e.id >= 41)

/** Every word the child has to produce in a question, sentences split into words. */
function wordsAsked(q: Question): string[] {
  switch (q.type) {
    case 'audioDictation':
    case 'missingLetters':
    case 'missingPattern':
    case 'syllableSplit':
    case 'visualMemory':
      return [q.word]
    case 'wordBuild':
      return [q.answer]
    case 'cloze':
      return [q.answer]
    case 'findMistake':
      return [q.right]
    case 'proofread':
      return q.errors.map((e) => e.right)
    case 'sentenceDictation':
      return q.sentence.split(/[^A-Za-z']+/).filter(Boolean)
    case 'wordSort':
      return q.groups.flatMap((g) => g.words)
    case 'wordFamily':
      return q.targets.map((t) => t.answer)
  }
}

describe('the second pack', () => {
  it('makes sixty exercises, numbered in order', () => {
    expect(TOTAL_EXERCISES).toBe(60)
    expect(EXERCISES.map((e) => e.id)).toEqual(Array.from({ length: 60 }, (_, i) => i + 1))
    expect(pack).toHaveLength(20)
  })

  it('is its own level', () => {
    for (const e of pack) {
      expect(e.level).toBe(6)
      expect(e.levelName).toBe('City Spellers')
    }
  })

  it('teaches contractions, compound words and dictation, as asked', () => {
    const taught = new Set(pack.flatMap((e) => e.concepts))
    for (const id of ['contractions-more', 'contractions-not', 'compound-some-every', 'compound-weather', 'dictation-short', 'dictation-story']) {
      expect(taught.has(id), id).toBe(true)
    }
  })

  it('introduces each new concept in the exercise that teaches it', () => {
    for (const e of pack) {
      for (const id of e.concepts) expect(CONCEPTS.get(id)?.introducedIn, id).toBe(e.id)
    }
  })

  it('never asks for a word longer than twelve letters', () => {
    for (const e of pack) {
      const questions = [...e.activities, ...e.concepts.flatMap((c) => CONCEPTS.get(c)?.reviewPool ?? [])]
      for (const q of questions) {
        for (const word of wordsAsked(q)) expect(word.replace(/'/g, '').length, `${q.id}: ${word}`).toBeLessThanOrEqual(12)
      }
    }
  })

  it('reviews only what has already been taught', () => {
    for (const e of pack) {
      for (const id of e.reviewConcepts) expect(CONCEPTS.get(id)?.introducedIn ?? 99, `${e.id} reviews ${id}`).toBeLessThan(e.id)
    }
  })
})
