/**
 * Terse constructors for exercise content.
 *
 * Writing Exercise 25 should feel like filling in a table, not like
 * programming. Every helper defaults difficulty to 1 and lets a question be
 * written on one line.
 */
import type {
  AudioDictationQuestion,
  ClozeQuestion,
  ConceptId,
  FindMistakeQuestion,
  MissingLettersQuestion,
  MissingPatternQuestion,
  ProofreadQuestion,
  Question,
  SentenceDictationQuestion,
  SyllableSplitQuestion,
  VisualMemoryQuestion,
  WordBuildQuestion,
  WordFamilyQuestion,
  WordSortQuestion,
} from '../spelling/types'

type Common = Partial<
  Pick<
    Question,
    | 'prompt'
    | 'novel'
    | 'review'
    | 'masteryRequired'
    | 'difficulty'
    | 'inputMode'
    | 'capitalMatters'
    | 'punctuationMatters'
    | 'hints'
  >
>

function common(c: Common = {}) {
  return { difficulty: 1 as const, ...c }
}

/** The computer says a word; the child types it. */
export function aud(
  id: string,
  concept: ConceptId,
  word: string,
  c: Common & { withSentence?: boolean } = {},
): AudioDictationQuestion {
  const { withSentence, ...rest } = c
  return { id, concept, type: 'audioDictation', word, ...common(rest), ...(withSentence ? { withSentence } : {}) }
}

/** Sentence read aloud; the child types the whole thing or one target word. */
export function dictate(
  id: string,
  concept: ConceptId,
  sentence: string,
  c: Common & { targetWord?: string } = {},
): SentenceDictationQuestion {
  const { targetWord, ...rest } = c
  return { id, concept, type: 'sentenceDictation', sentence, ...common(rest), ...(targetWord ? { targetWord } : {}) }
}

/** b _ _ t, with the audio saying "boat". */
export function letters(
  id: string,
  concept: ConceptId,
  word: string,
  c: Common & { blanks?: number[] } = {},
): MissingLettersQuestion {
  const { blanks, ...rest } = c
  return { id, concept, type: 'missingLetters', word, ...common(rest), ...(blanks ? { blanks } : {}) }
}

/** sn__ — choose or type the missing spelling pattern. */
export function pat(
  id: string,
  concept: ConceptId,
  word: string,
  c: Common & { choices?: string[]; span?: [number, number] } = {},
): MissingPatternQuestion {
  const { choices, span, ...rest } = c
  return {
    id,
    concept,
    type: 'missingPattern',
    word,
    inputMode: choices ? 'select' : 'type',
    ...common(rest),
    ...(choices ? { choices } : {}),
    ...(span ? { span } : {}),
  }
}

/** Sort words into labelled groups. */
export function sort(
  id: string,
  concept: ConceptId,
  groups: Record<string, string[]>,
  c: Common = {},
): WordSortQuestion {
  return {
    id,
    concept,
    type: 'wordSort',
    groups: Object.entries(groups).map(([label, words]) => ({ label, words })),
    ...common(c),
  }
}

/** Split into syllables, then spell the whole word. */
export function syl(
  id: string,
  concept: ConceptId,
  word: string,
  c: Common & { thenSpell?: boolean } = {},
): SyllableSplitQuestion {
  const { thenSpell, ...rest } = c
  return {
    id,
    concept,
    type: 'syllableSplit',
    word,
    ...common(rest),
    ...(thenSpell === false ? { thenSpell } : {}),
  }
}

/** help + ful = helpful */
export function build(
  id: string,
  concept: ConceptId,
  parts: string[],
  answer: string,
  c: Common = {},
): WordBuildQuestion {
  return { id, concept, type: 'wordBuild', parts, answer, ...common(c) }
}

/** From one base word, build a family of related words. */
export function family(
  id: string,
  concept: ConceptId,
  base: string,
  targets: [clue: string, answer: string][],
  c: Common = {},
): WordFamilyQuestion {
  return {
    id,
    concept,
    type: 'wordFamily',
    base,
    targets: targets.map(([clue, answer]) => ({ clue, answer })),
    ...common(c),
  }
}

/** A sentence with "___" for the missing word. */
export function cloze(
  id: string,
  concept: ConceptId,
  sentence: string,
  answer: string,
  c: Common & { choices?: string[]; speakSentence?: boolean } = {},
): ClozeQuestion {
  const { choices, speakSentence, ...rest } = c
  return {
    id,
    concept,
    type: 'cloze',
    sentence,
    answer,
    inputMode: choices ? 'select' : 'type',
    ...common(rest),
    ...(choices ? { choices } : {}),
    ...(speakSentence ? { speakSentence } : {}),
  }
}

/** One misspelled word in a sentence: find it, then fix it. */
export function mistake(
  id: string,
  concept: ConceptId,
  sentence: string,
  wrong: string,
  right: string,
  c: Common = {},
): FindMistakeQuestion {
  return { id, concept, type: 'findMistake', sentence, wrong, right, ...common(c) }
}

/** A paragraph with several misspellings to find and fix. */
export function proof(
  id: string,
  concept: ConceptId,
  text: string,
  errors: [wrong: string, right: string][],
  c: Common = {},
): ProofreadQuestion {
  return {
    id,
    concept,
    type: 'proofread',
    text,
    errors: errors.map(([wrong, right]) => ({ wrong, right })),
    ...common(c),
  }
}

/** Flash a word, hide it, ask for it. Used sparingly. */
export function memory(
  id: string,
  concept: ConceptId,
  word: string,
  c: Common & { showMs?: number } = {},
): VisualMemoryQuestion {
  const { showMs, ...rest } = c
  return { id, concept, type: 'visualMemory', word, ...common(rest), ...(showMs ? { showMs } : {}) }
}

/** Marks a question as testing a word the child has not been shown. */
export function novel<T extends Question>(q: T): T {
  return { ...q, novel: true, masteryRequired: true }
}
