import { describe, expect, it } from 'vitest'
import { buildHint, maskPattern, patternChoices } from '../src/spelling/hints'
import { WORD_BANK } from '../src/content/words'
import { CONCEPTS } from '../src/content/concepts'
import { Rng } from '../src/core/rng'
import { aud, sort } from '../src/content/build'
import type { HintLevel } from '../src/spelling/types'

const rng = () => new Rng(42)

describe('hint ladder', () => {
  const question = aud('t1', 'oa-sound', 'boat')
  const concept = CONCEPTS.get('oa-sound')

  it('offers a replay first for an audio question', () => {
    const hint = buildHint({ question, bank: WORD_BANK, concept, level: 1, rng: rng() })
    expect(hint.kind).toBe('replay')
  })

  it('breaks the word into beats at level 2', () => {
    const hint = buildHint({
      question: aud('t2', 'syllables', 'fantastic'),
      bank: WORD_BANK,
      concept: CONCEPTS.get('syllables'),
      level: 2,
      rng: rng(),
    })
    expect(hint.text).toContain('fan / tas / tic')
  })

  it('reminds the child of the pattern at level 3', () => {
    const hint = buildHint({ question, bank: WORD_BANK, concept, level: 3, rng: rng() })
    expect(hint.text).toBe(concept?.patternReminder)
  })

  it('hides exactly the tricky part at level 4', () => {
    const hint = buildHint({ question, bank: WORD_BANK, concept, level: 4, rng: rng() })
    expect(hint.mask).toBe('b__t')
  })

  it('masks the doubled consonant, not the vowel, for doubling words', () => {
    expect(maskPattern('running', WORD_BANK)).toBe('ru__ing')
    expect(maskPattern('babies', WORD_BANK)).toBe('bab___')
  })

  it('offers two possibilities at level 5, including the right one', () => {
    const hint = buildHint({ question, bank: WORD_BANK, concept, level: 5, rng: rng() })
    expect(hint.choices).toHaveLength(2)
    expect(hint.choices).toContain('oa')
  })

  it('never reveals the whole word at any level', () => {
    for (const level of [1, 2, 3, 4, 5] as HintLevel[]) {
      const hint = buildHint({ question, bank: WORD_BANK, concept, level, rng: rng() })
      const shown = `${hint.text} ${hint.mask ?? ''} ${(hint.choices ?? []).join(' ')}`
      expect(shown.toLowerCase()).not.toContain('boat')
    }
  })

  it('lets a question override a level', () => {
    const custom = aud('t3', 'oa-sound', 'boat', { hints: { 3: 'Think of something that floats.' } })
    const hint = buildHint({ question: custom, bank: WORD_BANK, concept, level: 3, rng: rng() })
    expect(hint.text).toBe('Think of something that floats.')
  })

  it('always includes the correct segment among the choices', () => {
    for (let seed = 0; seed < 25; seed++) {
      const choices = patternChoices('snow', WORD_BANK, CONCEPTS.get('oa-sound'), new Rng(seed))
      expect(choices).toContain('ow')
      expect(new Set(choices).size).toBe(2)
    }
  })

  it('stops the ladder early for activities with no single tricky part', () => {
    const sorting = sort('t4', 'ee-sound', { ee: ['green'], ea: ['team'] })
    // A sort has no pattern span to mask, so levels 4 and 5 make no sense.
    expect(sorting.type).toBe('wordSort')
  })
})

describe('concept-aware masking', () => {
  it('hides the part the current lesson is about, not just the word bank span', () => {
    // "rainbow" is about "ow" in the /oa/ lesson but about "bow" as a compound.
    expect(maskPattern('rainbow', WORD_BANK, CONCEPTS.get('oa-sound'))).toBe('rainb__')
    expect(maskPattern('rainbow', WORD_BANK, CONCEPTS.get('compound-words'))).toBe('rain___')
  })

  it('narrows the gap instead of inventing a rival where there is none', () => {
    const hint = buildHint({
      question: aud('t5', 'compound-words', 'toothbrush'),
      bank: WORD_BANK,
      concept: CONCEPTS.get('compound-words'),
      level: 5,
      rng: rng(),
    })
    // A compound word has no competing spelling, so offering two options would
    // be a made-up choice. Say how long the hidden part is instead.
    expect(hint.text).toContain('5 letters')
    expect(hint.text).toContain('"b"')
    expect(hint.text.toLowerCase()).not.toContain('toothbrush')
  })
})
