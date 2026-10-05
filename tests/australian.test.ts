import { describe, expect, it } from 'vitest'
import { CONCEPTS } from '../src/content/concepts'
import { WORD_BANK } from '../src/content/words'
import { EXERCISES } from '../src/content/exercises'

/**
 * He is learning Australian spelling, and a rival spelling on the page —
 * even as "the wrong one" — is a rival spelling learned. So none of these
 * may appear anywhere a child can read: questions, sentences, groups,
 * mistakes, rules, hints or the word bank.
 */
const AMERICAN = [
  /\bcolor/i,
  /\bfavorit/i,
  /\bcenter/i,
  /\bmeters?\b/i,
  /\bliters?\b/i,
  /\btheater/i,
  /\bneighbor/i,
  /\bhonor\b/i,
  /\bharbor/i,
  /\bflavor/i,
  /\brealiz/i,
  /\brecogniz/i,
  /\borganiz/i,
  /\bapologiz/i,
  /\btravel(ed|ing)\b/i,
  /\bjewelry/i,
  /\bgray\b/i,
  /\bmom\b/i,
  /\bcatalog\b/i,
  /\bdefense\b/i,
  /\bpractic(ed|ing)\b/i,
  /\blicense\b/i,
  /\bprogram\b/i,
  /\bpajamas?\b/i,
  /\bairplane/i,
]

function offenders(text: string): string[] {
  return AMERICAN.filter((re) => re.test(text)).map((re) => String(re))
}

describe('Australian spelling only', () => {
  it('keeps American spellings out of every exercise', () => {
    for (const exercise of EXERCISES) {
      const found = offenders(JSON.stringify(exercise))
      expect(found, `exercise ${exercise.id} (${exercise.title})`).toEqual([])
    }
  })

  it('keeps American spellings out of every concept and its review pool', () => {
    for (const concept of CONCEPTS.values()) {
      const found = offenders(JSON.stringify(concept))
      expect(found, `concept ${concept.id}`).toEqual([])
    }
  })

  it('keeps American spellings out of the word bank', () => {
    for (const entry of WORD_BANK.values()) {
      const found = offenders(JSON.stringify(entry))
      expect(found, `word ${entry.word}`).toEqual([])
    }
  })
})
