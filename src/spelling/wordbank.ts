/**
 * Word bank helpers.
 *
 * Entries are authored as a compact spec string:
 *   "fan-tas-tic"   -> syllables fan / tas / tic
 *   "b[oa]t"        -> the tricky pattern is "oa" at [1, 3)
 *   "ru[n-n]ing"    -> syllables run / ning, pattern "nn" at [2, 4)
 *
 * Hyphens mark syllable breaks, brackets mark the part of the word that the
 * spelling pattern lives in. Hints 4 and 5 blank out exactly that part, so a
 * hint never gives away the letters the child is meant to work out.
 */
import type { WordBank, WordEntry } from './types'

export interface WordSpecOptions {
  /** Spoken context for ambiguous words: "I ate a piece of cake." */
  sentence?: string
  /** Plausible misspellings, used to build the two-way choice at hint level 5. */
  confusions?: string[]
}

export function parseWordSpec(spec: string, options: WordSpecOptions = {}): WordEntry {
  let word = ''
  const boundaries: number[] = []
  let spanStart = -1
  let spanEnd = -1

  for (const ch of spec) {
    if (ch === '-') {
      if (word.length > 0) boundaries.push(word.length)
    } else if (ch === '[') {
      spanStart = word.length
    } else if (ch === ']') {
      spanEnd = word.length
    } else {
      word += ch
    }
  }

  const syllables: string[] = []
  let cursor = 0
  for (const boundary of boundaries) {
    syllables.push(word.slice(cursor, boundary))
    cursor = boundary
  }
  syllables.push(word.slice(cursor))

  const entry: WordEntry = { word, syllables: syllables.filter((s) => s.length > 0) }
  if (spanStart >= 0 && spanEnd > spanStart) entry.patternSpan = [spanStart, spanEnd]
  if (options.sentence) entry.sentence = options.sentence
  if (options.confusions) entry.confusions = options.confusions
  return entry
}

/** Builds a bank from spec strings, keyed by the plain word. */
export function buildWordBank(
  specs: (string | [string, WordSpecOptions])[],
): WordBank {
  const bank = new Map<string, WordEntry>()
  for (const item of specs) {
    const entry = typeof item === 'string'
      ? parseWordSpec(item)
      : parseWordSpec(item[0], item[1])
    bank.set(entry.word.toLowerCase(), entry)
  }
  return bank
}

export function entryOf(word: string, bank: WordBank): WordEntry | undefined {
  return bank.get(word.toLowerCase())
}

const VOWELS = 'aeiouy'

/**
 * Syllables for a word, falling back to a rough split when the bank has no
 * entry. The content validator requires real entries for any word actually
 * used in a syllable activity; this fallback only keeps hints working.
 */
export function syllablesOf(word: string, bank: WordBank): string[] {
  const entry = entryOf(word, bank)
  if (entry) return entry.syllables
  return roughSyllables(word)
}

export function roughSyllables(word: string): string[] {
  const out: string[] = []
  let current = ''
  let seenVowel = false
  for (let i = 0; i < word.length; i++) {
    const ch = word[i] as string
    const isVowel = VOWELS.includes(ch.toLowerCase())
    if (isVowel) {
      // A vowel starting a new group after a consonant closes the last chunk.
      if (seenVowel && current.length > 1 && !VOWELS.includes((word[i - 1] as string).toLowerCase())) {
        out.push(current.slice(0, -1))
        current = current.slice(-1)
      }
      seenVowel = true
    }
    current += ch
  }
  if (current) out.push(current)
  return out.length > 0 ? out : [word]
}

/**
 * The stretch of letters a hint should hide. Falls back to the word's longest
 * vowel run, which is the tricky part of most English spellings.
 */
export function patternSpanOf(word: string, bank: WordBank): [number, number] {
  const entry = entryOf(word, bank)
  if (entry?.patternSpan) return entry.patternSpan
  let best: [number, number] = [0, 0]
  let i = 0
  while (i < word.length) {
    if (VOWELS.includes((word[i] as string).toLowerCase())) {
      let j = i
      while (j < word.length && VOWELS.includes((word[j] as string).toLowerCase())) j++
      if (j - i > best[1] - best[0]) best = [i, j]
      i = j
    } else {
      i++
    }
  }
  return best[1] > best[0] ? best : [0, Math.min(2, word.length)]
}

/** The spoken sentence for a word, when the bank has one. */
export function sentenceOf(word: string, bank: WordBank): string | undefined {
  return entryOf(word, bank)?.sentence
}
