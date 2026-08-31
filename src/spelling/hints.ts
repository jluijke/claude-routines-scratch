/**
 * Progressive hints — spec §3.
 *
 * Hints are generated from the concept registry and the word bank rather than
 * written per question, so a new exercise needs no new hint code. A question
 * can still override any level via its `hints` field.
 *
 * The ladder never hands over the spelling: even at level 5 the child sees two
 * possibilities for the tricky part and must type the whole word themselves.
 */
import type { Concept, HintLevel, Question, WordBank } from './types'
import { patternSpanOf, syllablesOf, sentenceOf, entryOf } from './wordbank'
import { expectedAnswer } from './grading'
import type { Rng } from '../core/rng'

export type HintKind = 'replay' | 'text' | 'mask' | 'choices'

export interface Hint {
  level: HintLevel
  kind: HintKind
  text: string
  /** For 'mask': the word with the tricky part blanked, e.g. "ru__ing". */
  mask?: string
  /** For 'choices': two candidate spellings of the tricky part. */
  choices?: string[]
}

export interface HintParams {
  question: Question
  bank: WordBank
  concept?: Concept
  level: HintLevel
  /** Which part of a multi-part question the child is stuck on. */
  focusIndex?: number
  rng: Rng
}

/** True when the question has audio the child can replay. */
export function hasAudio(q: Question): boolean {
  return (
    q.type === 'audioDictation' ||
    q.type === 'sentenceDictation' ||
    q.type === 'missingLetters' ||
    q.type === 'syllableSplit' ||
    (q.type === 'cloze' && q.speakSentence === true)
  )
}

/** The single word a hint should be about, for the part in focus. */
export function focusWord(q: Question, bank: WordBank, focusIndex = 0): string {
  switch (q.type) {
    case 'audioDictation':
    case 'missingLetters':
    case 'missingPattern':
    case 'visualMemory':
    case 'syllableSplit':
      return q.word
    case 'cloze':
      return q.answer
    case 'wordBuild':
      return q.answer
    case 'wordFamily':
      return q.targets[focusIndex]?.answer ?? q.targets[0]?.answer ?? q.base
    case 'findMistake':
      return q.right
    case 'proofread':
      return q.errors[focusIndex]?.right ?? q.errors[0]?.right ?? ''
    case 'sentenceDictation':
      return q.targetWord ?? hardestWord(q.sentence, bank)
    case 'wordSort':
      return q.groups[0]?.words[0] ?? ''
  }
}

/** Picks the word in a sentence most likely to be the spelling challenge. */
function hardestWord(sentence: string, bank: WordBank): string {
  const candidates = sentence
    .split(/[^A-Za-z']+/)
    .filter((w) => w.length > 2)
  let best = candidates[0] ?? ''
  let bestScore = -1
  for (const candidate of candidates) {
    const known = entryOf(candidate, bank) ? 2 : 0
    const score = candidate.length + known
    if (score > bestScore) {
      bestScore = score
      best = candidate
    }
  }
  return best
}

/**
 * The stretch of letters this concept's hints should hide. Falls back to the
 * span marked in the word bank.
 */
export function spanFor(
  word: string,
  bank: WordBank,
  concept: Concept | undefined,
): [number, number] {
  const syllables = syllablesOf(word, bank)
  if (concept?.maskFrom === 'lastPart' && syllables.length > 1) {
    const last = syllables[syllables.length - 1] as string
    return [word.length - last.length, word.length]
  }
  if (concept?.maskFrom === 'firstPart' && syllables.length > 1) {
    return [0, (syllables[0] as string).length]
  }
  return patternSpanOf(word, bank)
}

/** Replaces the pattern span with underscores: running -> ru__ing. */
export function maskPattern(word: string, bank: WordBank, concept?: Concept): string {
  const [start, end] = spanFor(word, bank, concept)
  return word.slice(0, start) + '_'.repeat(end - start) + word.slice(end)
}

/**
 * Two spellings for the tricky part: the right one plus a plausible rival,
 * shuffled. Drawn from the word's own confusions first, then the concept's
 * alternatives, then a generic vowel swap.
 */
export function patternChoices(
  word: string,
  bank: WordBank,
  concept: Concept | undefined,
  rng: Rng,
): string[] {
  const [start, end] = spanFor(word, bank, concept)
  const correct = word.slice(start, end)
  const entry = entryOf(word, bank)

  const rivals: string[] = []
  for (const confusion of entry?.confusions ?? []) {
    // A confusion is a whole misspelling; take the letters at the same place.
    const rival = confusion.slice(start, start + Math.max(1, confusion.length - word.length + (end - start)))
    if (rival && rival !== correct) rivals.push(rival)
  }
  for (const alternative of concept?.alternatives ?? []) {
    if (alternative !== correct) rivals.push(alternative)
  }
  if (rivals.length === 0) rivals.push(genericRival(correct))

  const rival = rng.pick(rivals) ?? genericRival(correct)
  return rng.shuffle([correct, rival])
}

function genericRival(segment: string): string {
  const swaps: Record<string, string> = {
    ee: 'ea', ea: 'ee', oa: 'ow', ow: 'oa', ai: 'ay', ay: 'ai',
    ie: 'ei', ei: 'ie', y: 'ey', ey: 'y', es: 's', s: 'es',
  }
  const lower = segment.toLowerCase()
  if (swaps[lower]) return swaps[lower] as string
  // Double it, or halve it — the commonest slip in English spelling.
  if (segment.length === 2 && segment[0] === segment[1]) return segment[0] as string
  if (segment.length === 1) return segment + segment
  return segment.split('').reverse().join('')
}

export function buildHint(params: HintParams): Hint {
  const { question, bank, concept, level, focusIndex, rng } = params

  const override = question.hints?.[level]
  if (override) return { level, kind: 'text', text: override }

  const word = focusWord(question, bank, focusIndex)

  switch (level) {
    case 1: {
      if (hasAudio(question)) {
        return { level, kind: 'replay', text: 'Have another listen.' }
      }
      const sentence = sentenceOf(word, bank)
      return {
        level,
        kind: 'text',
        text: sentence
          ? `Read it again: "${sentence}"`
          : 'Read the question again, slowly, and say the word out loud.',
      }
    }

    case 2: {
      const syllables = syllablesOf(word, bank)
      if (syllables.length > 1) {
        return {
          level,
          kind: 'text',
          text: `Say it in beats: ${syllables.join(' / ')}. Spell one beat at a time.`,
        }
      }
      return {
        level,
        kind: 'text',
        text: 'It is a one-beat word. Say it slowly and listen to each sound.',
      }
    }

    case 3:
      return {
        level,
        kind: 'text',
        text: concept?.patternReminder ?? 'Think about the spelling pattern this word uses.',
      }

    case 4:
      return {
        level,
        kind: 'mask',
        text: 'Here is the word with the tricky part hidden. What goes in the gap?',
        mask: maskPattern(word, bank, concept),
      }

    case 5: {
      // Two spellings to choose between only makes sense where there is a real
      // rival spelling. Where there is not — a compound word, say — narrowing
      // the gap teaches more than an invented wrong answer.
      const hasRival =
        (concept?.alternatives?.length ?? 0) > 0 || (entryOf(word, bank)?.confusions?.length ?? 0) > 0
      if (!hasRival) {
        const [start, end] = spanFor(word, bank, concept)
        const hidden = word.slice(start, end)
        return {
          level,
          kind: 'mask',
          text: `The hidden part has ${hidden.length} letters and starts with "${hidden[0]}". Now type the whole word.`,
          mask: maskPattern(word, bank, concept),
        }
      }
      const choices = patternChoices(word, bank, concept, rng)
      return {
        level,
        kind: 'choices',
        text: 'The missing part is one of these. Now type the whole word yourself.',
        choices,
      }
    }
  }
}

/** The highest hint level worth offering for a question. */
export function maxHintLevel(q: Question): HintLevel {
  // Sorting and building activities have no single "tricky part" to mask.
  if (q.type === 'wordSort' || q.type === 'wordBuild') return 3
  return 5
}

/** Used only when a child is completely stuck; never counts toward mastery. */
export function revealAnswer(q: Question, bank: WordBank): string {
  return expectedAnswer(q, bank).join(', ')
}
