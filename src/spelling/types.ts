/**
 * The data model for the whole spelling curriculum.
 *
 * Design rule: adding Exercise 25 or 38 must be *data entry only*. Nothing in
 * here may require new application logic to support a new exercise — hints,
 * grading, review selection and duration budgeting are all driven from these
 * structures plus the concept registry and word bank.
 */

export type ConceptId = string

export type QuestionType =
  | 'audioDictation'
  | 'sentenceDictation'
  | 'missingLetters'
  | 'missingPattern'
  | 'wordSort'
  | 'syllableSplit'
  | 'wordBuild'
  | 'wordFamily'
  | 'cloze'
  | 'findMistake'
  | 'proofread'
  | 'visualMemory'

export type HintLevel = 1 | 2 | 3 | 4 | 5

/** Fields every question shares, whatever its type. */
export interface QuestionBase {
  id: string
  concept: ConceptId
  /** Instruction shown above the activity. Defaults per type when omitted. */
  prompt?: string
  /** A word the child has not been shown before — spec §18 transfer testing. */
  novel?: boolean
  /** Drawn from an earlier exercise rather than the current lesson. */
  review?: boolean
  /**
   * Must be answered correctly on the first attempt with no hints for the
   * concept to count as mastered. Set by content, or by the engine when it
   * injects a remediation question.
   */
  masteryRequired?: boolean
  difficulty: 1 | 2 | 3
  /**
   * 'select' offers choices, 'type' demands recall. Content shifts to 'type'
   * for most mastery questions from Exercise 15 on (spec §10).
   */
  inputMode?: 'select' | 'type'
  capitalMatters?: boolean
  punctuationMatters?: boolean
  /** Overrides for the generated hint at a given level. */
  hints?: Partial<Record<HintLevel, string>>
}

/** The computer says a word; the child types it. */
export interface AudioDictationQuestion extends QuestionBase {
  type: 'audioDictation'
  word: string
  /** Also offer the word inside a sentence — required for homophones. */
  withSentence?: boolean
}

/** The computer reads a sentence; the child types it, or the missing word. */
export interface SentenceDictationQuestion extends QuestionBase {
  type: 'sentenceDictation'
  sentence: string
  /** When set, only this word is typed rather than the whole sentence. */
  targetWord?: string
}

/** b _ _ t — audio says "boat", the child completes the word. */
export interface MissingLettersQuestion extends QuestionBase {
  type: 'missingLetters'
  word: string
  /** Zero-based indices of the hidden letters. Defaults to the pattern span. */
  blanks?: number[]
}

/** sn __ with choices "oa" / "ow", or typed once the child is ready. */
export interface MissingPatternQuestion extends QuestionBase {
  type: 'missingPattern'
  word: string
  /** [start, end) of the missing segment. Defaults to the word's pattern span. */
  span?: [number, number]
  /** Offered when inputMode is 'select'. Must contain the correct segment. */
  choices?: string[]
}

/** Sort words into columns: EE | EA | Y. */
export interface WordSortQuestion extends QuestionBase {
  type: 'wordSort'
  groups: { label: string; words: string[] }[]
}

/** fan | tas | tic, then spell the whole word. */
export interface SyllableSplitQuestion extends QuestionBase {
  type: 'syllableSplit'
  word: string
  /** Require the full word to be typed after splitting. Default true. */
  thenSpell?: boolean
}

/** help + ful = helpful */
export interface WordBuildQuestion extends QuestionBase {
  type: 'wordBuild'
  parts: string[]
  answer: string
}

/** From "help", build helpful / helpless / unhelpful. */
export interface WordFamilyQuestion extends QuestionBase {
  type: 'wordFamily'
  base: string
  /** Each target gets a meaning clue so it is a spelling task, not a guess. */
  targets: { clue: string; answer: string }[]
}

/** There are ___ dogs in the park.  (two / to / too) */
export interface ClozeQuestion extends QuestionBase {
  type: 'cloze'
  /** Sentence containing "___" where the answer belongs. */
  sentence: string
  answer: string
  choices?: string[]
  /** Read the sentence aloud with the blank spoken as "blank". */
  speakSentence?: boolean
}

/** "I am realy happy today." -> realy becomes really */
export interface FindMistakeQuestion extends QuestionBase {
  type: 'findMistake'
  sentence: string
  wrong: string
  right: string
}

/** A short paragraph with several misspellings to find and fix. */
export interface ProofreadQuestion extends QuestionBase {
  type: 'proofread'
  text: string
  errors: { wrong: string; right: string }[]
}

/** Show a word briefly, hide it, ask for it. Used sparingly (spec §6). */
export interface VisualMemoryQuestion extends QuestionBase {
  type: 'visualMemory'
  word: string
  showMs?: number
}

export type Question =
  | AudioDictationQuestion
  | SentenceDictationQuestion
  | MissingLettersQuestion
  | MissingPatternQuestion
  | WordSortQuestion
  | SyllableSplitQuestion
  | WordBuildQuestion
  | WordFamilyQuestion
  | ClozeQuestion
  | FindMistakeQuestion
  | ProofreadQuestion
  | VisualMemoryQuestion

/** What the child produced, shaped by the question type. */
export type Response =
  | { kind: 'text'; value: string }
  | { kind: 'texts'; values: string[] }
  | { kind: 'assign'; value: Record<string, string> }
  | { kind: 'segments'; value: string[] }

export interface GradeResult {
  correct: boolean
  /** Per-part correctness for multi-part types, so the UI can mark them up. */
  parts?: boolean[]
  /** Short, specific, encouraging note. Never discouraging (spec §14). */
  note?: string
}

// ---------------------------------------------------------------------------
// Exercises
// ---------------------------------------------------------------------------

export interface RuleReveal {
  title: string
  text: string
  /** 2 to 4 examples, per spec §16. */
  examples: string[]
}

export interface Exercise {
  id: number
  title: string
  level: 1 | 2 | 3 | 4 | 5
  levelName: string
  targetMinutes: number
  /** Concepts this exercise teaches. Each needs an unaided correct answer. */
  concepts: ConceptId[]
  /** Current-lesson questions, roughly 60% of the queue. */
  activities: Question[]
  /**
   * Concepts to pull review questions for. Empty before Exercise 6.
   * The scheduler draws actual questions from each concept's review pool.
   */
  reviewConcepts: ConceptId[]
  ruleReveal: RuleReveal
}

// ---------------------------------------------------------------------------
// Concept registry and word bank
// ---------------------------------------------------------------------------

export interface Concept {
  id: ConceptId
  /** Child-facing name, e.g. "Doubling the last consonant". */
  label: string
  /** Hint level 3: reminds the child of the pattern without giving the word. */
  patternReminder: string
  /**
   * The competing spellings for this sound or pattern, e.g. ee / ea / y / ey.
   * Hint level 5 offers the correct one alongside one of these.
   */
  alternatives?: string[]
  /** Exercise that introduces it — the scheduler never reviews ahead of this. */
  introducedIn: number
  /**
   * Extra questions for cumulative review and for remediation when the child
   * gets this concept wrong. Must be deep enough that a repeated failure
   * always draws a word the child has not just seen.
   */
  reviewPool: Question[]
}

export interface WordEntry {
  word: string
  /** Drives hint level 2 and the syllable-splitting activity. */
  syllables: string[]
  /** Spoken context for ambiguous words, e.g. "I ate a piece of cake." */
  sentence?: string
  /** [start, end) of the tricky part, driving hints 4 and 5 and the blanks. */
  patternSpan?: [number, number]
  /** Plausible wrong spellings, used to offer the level-5 choice. */
  confusions?: string[]
}

export type WordBank = ReadonlyMap<string, WordEntry>
