/**
 * The exercise runner — spec §2, the strictest requirement in the brief.
 *
 * "A corrected mistake does NOT count as mastery. The child must later
 *  demonstrate the same concept independently."
 *
 * So the queue is dynamic, not a fixed list. Getting something wrong schedules
 * a fresh question on the same concept, using a different word, later in the
 * exercise. The exercise cannot finish until every concept it teaches has been
 * answered right first time with no hints.
 */
import type {
  Concept,
  ConceptId,
  Exercise,
  GradeResult,
  HintLevel,
  Question,
  Response,
  WordBank,
} from './types'
import { grade } from './grading'
import { buildHint, maxHintLevel, type Hint } from './hints'
import { isMastered } from './mastery'
import { patternSpanOf, syllablesOf } from './wordbank'
import { focusWord } from './hints'
import { recordAttempt, type MasteryStore } from './mastery'
import { buildQueue } from './scheduler'
import { Rng } from '../core/rng'

export interface EngineDeps {
  exercise: Exercise
  concepts: ReadonlyMap<ConceptId, Concept>
  bank: WordBank
  mastery: MasteryStore
  seed?: number | string
}

export interface SubmitResult {
  grade: GradeResult
  /** True when the child may move on to the next question. */
  advance: boolean
  /** Set when this answer proved a concept independently — worth a reward. */
  provedConcept?: ConceptId
  /** Set when a fresh question on this concept has been queued for later. */
  remediationQueued?: ConceptId
  exerciseComplete: boolean
}

export interface EngineProgress {
  /** Questions answered, over the number currently queued. Never a timer. */
  answered: number
  total: number
  conceptsProved: number
  conceptsRequired: number
}

/** How many times we will re-test one concept before easing off. */
const MAX_REMEDIATIONS_PER_CONCEPT = 4

/**
 * The help a question comes with while its pattern is still being learned.
 *
 * Three things, none of them a hint in the ladder's sense: the rule in plain
 * words, a few words that use the same pattern, and — for a "hear it and
 * type it" question — the start of the word written in, so he finishes it
 * rather than conjuring the whole thing. The rule and the words stay for the
 * whole of the exercise that teaches a pattern, and on review until it is
 * mastered. The start of the word is scaffolding: it is there every other
 * time until he has typed a whole word on the pattern unaided, and again
 * after a wrong answer, and an answer given with it does not count as
 * proving the pattern, so the next question on it comes plain and gives him
 * the chance to.
 */
export interface Support {
  /** The pattern, said simply. */
  rule: string
  /** Up to three words that spell the same way, never the one being asked. */
  siblings: string[]
  /** The opening letters, shown and not typed over. Only on audio questions. */
  stem?: string
}

/** How many sibling words a support card shows. */
export const SIBLING_COUNT = 3

interface RunState {
  lastWrong: boolean
  lastStemmed: boolean
  typedUnaided: boolean
}

export class ExerciseEngine {
  readonly exercise: Exercise
  private readonly concepts: ReadonlyMap<ConceptId, Concept>
  private readonly bank: WordBank
  private readonly mastery: MasteryStore
  private readonly rng: Rng

  private queue: Question[]
  private index = 0
  private attempts = 0
  private hintsUsed = 0
  private hintLevel = 0

  /** Concepts answered right first time, unaided, during this exercise. */
  private readonly proved = new Set<ConceptId>()
  /** Question ids already used in this exercise. */
  private readonly usedQuestionIds = new Set<string>()
  /**
   * Words already put in front of the child. Re-testing a concept has to use a
   * word they have not just seen, or "prove it independently" is really just
   * "remember what you were shown a minute ago" — so this is tracked by word,
   * not only by question id, since content may reuse a word across pools.
   */
  private readonly usedWords = new Set<string>()
  private readonly remediationCount = new Map<ConceptId, number>()
  private tailFilled = false
  /**
   * Per concept, this run: whether the last first-go answer on it was wrong,
   * whether the last hear-and-type question on it came with its start written
   * in, and whether he has yet typed a whole word on it unaided. Between them
   * these decide when the start of a word is written in for him.
   */
  private readonly runState = new Map<ConceptId, RunState>()
  /** The support worked out for the question at this index, so it holds still while he looks at it. */
  private supportCache: { index: number; support: Support | undefined } | undefined

  readonly startedAt = Date.now()

  constructor(deps: EngineDeps) {
    this.exercise = deps.exercise
    this.concepts = deps.concepts
    this.bank = deps.bank
    this.mastery = deps.mastery
    this.rng = new Rng(deps.seed ?? `exercise-${deps.exercise.id}`)

    const scheduled = buildQueue({
      exercise: deps.exercise,
      concepts: deps.concepts,
      mastery: deps.mastery,
      rng: this.rng,
    })
    this.queue = scheduled.questions
    for (const q of this.queue) this.markUsed(q)
  }

  current(): Question | undefined {
    return this.queue[this.index]
  }

  /** The help the current question comes with, or none once its pattern is mastered. */
  support(): Support | undefined {
    if (this.supportCache?.index === this.index) return this.supportCache.support
    const support = this.buildSupport()
    this.supportCache = { index: this.index, support }
    return support
  }

  private buildSupport(): Support | undefined {
    const question = this.current()
    if (!question) return undefined
    // A pattern this exercise teaches is supported all the way through it; a
    // pattern that only comes up for review is supported until it is mastered.
    const taught = this.exercise.concepts.includes(question.concept)
    if (!taught && isMastered(this.mastery, question.concept)) return undefined
    const concept = this.concepts.get(question.concept)
    if (!concept) return undefined

    const target = focusWord(question, this.bank)
    const siblings = this.siblingWords(concept, target)
    // The start is written in after a miss, and otherwise every other time
    // until he has typed one whole word on the pattern unaided.
    const state = this.runState.get(question.concept)
    const scaffold =
      question.type === 'audioDictation' &&
      (state?.lastWrong === true || (!state?.typedUnaided && !state?.lastStemmed))
    const stem = scaffold ? stemOf(question.word, this.bank) : undefined
    return { rule: concept.patternReminder, siblings, ...(stem ? { stem } : {}) }
  }

  /**
   * Words that spell the same way as the one being asked: drawn from the
   * concept's own questions, those sharing its tricky letters first, never
   * the word itself, and in an order fixed by the question so the card holds
   * still.
   */
  private siblingWords(concept: Concept, target: string): string[] {
    const pool = [
      ...concept.reviewPool,
      ...this.exercise.activities.filter((q) => q.concept === concept.id),
    ]
    const seen = new Set<string>([target.toLowerCase()])
    const words: string[] = []
    for (const q of pool) {
      for (const word of wordsOf(q)) {
        const key = word.toLowerCase()
        if (seen.has(key) || !/^[a-z']+$/i.test(word)) continue
        seen.add(key)
        words.push(word)
      }
    }
    const [s, e] = patternSpanOf(target, this.bank)
    const letters = target.slice(s, e).toLowerCase()
    const same = (w: string): boolean => {
      const [a, b] = patternSpanOf(w, this.bank)
      return w.slice(a, b).toLowerCase() === letters
    }
    const rng = new Rng(`siblings-${this.exercise.id}-${target}`)
    const alike = rng.shuffle(words.filter(same))
    const rest = rng.shuffle(words.filter((w) => !same(w)))
    return [...alike, ...rest].slice(0, SIBLING_COUNT)
  }

  progress(): EngineProgress {
    return {
      answered: this.index,
      total: this.queue.length,
      conceptsProved: this.exercise.concepts.filter((c) => this.proved.has(c)).length,
      conceptsRequired: this.exercise.concepts.length,
    }
  }

  /** Seconds the child has spent in this exercise, for the pacing governor. */
  elapsedSeconds(): number {
    return Math.round((Date.now() - this.startedAt) / 1000)
  }

  hintsTaken(): number {
    return this.hintsUsed
  }

  currentHintLevel(): number {
    return this.hintLevel
  }

  canHint(): boolean {
    const question = this.current()
    if (!question) return false
    return this.hintLevel < maxHintLevel(question)
  }

  /** Advances the hint ladder one step and returns the new hint. */
  nextHint(focusIndex?: number): Hint | undefined {
    const question = this.current()
    if (!question || !this.canHint()) return undefined
    this.hintLevel += 1
    this.hintsUsed += 1
    return buildHint({
      question,
      bank: this.bank,
      concept: this.concepts.get(question.concept),
      level: this.hintLevel as HintLevel,
      focusIndex,
      rng: this.rng,
    })
  }

  submit(response: Response): SubmitResult {
    const question = this.current()
    if (!question) {
      return { grade: { correct: false }, advance: false, exerciseComplete: this.isComplete() }
    }

    const firstAttempt = this.attempts === 0
    this.attempts += 1
    const result = grade(question, response, this.bank)

    // The start of the word written in is help, and an answer given with it
    // is not an unaided one: it moves him on, and the next question on the
    // pattern comes plain so he can prove it.
    const stemmed = this.support()?.stem !== undefined
    const unaided = firstAttempt && this.hintLevel === 0 && !stemmed
    // A corrected retry is still a miss as far as the next question is
    // concerned: only a first-go answer says whether the stem is needed again.
    const state = this.runState.get(question.concept) ?? {
      lastWrong: false,
      lastStemmed: false,
      typedUnaided: false,
    }
    if (firstAttempt) {
      state.lastWrong = !result.correct
      if (question.type === 'audioDictation') {
        state.lastStemmed = stemmed
        if (result.correct && unaided) state.typedUnaided = true
      }
    }
    this.runState.set(question.concept, state)
    recordAttempt(this.mastery, {
      concept: question.concept,
      correct: result.correct,
      firstAttempt,
      hintsUsed: firstAttempt ? Math.max(this.hintLevel, stemmed ? 1 : 0) : 0,
      word: result.correct ? undefined : focusWord(question, this.bank),
    })

    if (!result.correct) {
      const remediationQueued = this.queueRemediation(question.concept)
      return {
        grade: result,
        advance: false,
        remediationQueued,
        exerciseComplete: false,
      }
    }

    let provedConcept: ConceptId | undefined
    if (unaided) {
      if (!this.proved.has(question.concept)) provedConcept = question.concept
      this.proved.add(question.concept)
    }

    this.index += 1
    this.attempts = 0
    this.hintLevel = 0

    // Out of questions but a concept is still unproven: keep going until the
    // child has shown it without help.
    if (this.index >= this.queue.length) this.fillTail()

    const complete = this.isComplete()
    return {
      grade: result,
      advance: true,
      ...(provedConcept ? { provedConcept } : {}),
      exerciseComplete: complete,
    }
  }

  /**
   * The child got this concept wrong. Queue a *different* word on the same
   * concept later in the exercise, which they must then answer unaided.
   */
  private queueRemediation(concept: ConceptId): ConceptId | undefined {
    const taken = this.remediationCount.get(concept) ?? 0
    if (taken >= MAX_REMEDIATIONS_PER_CONCEPT) return undefined

    const question = this.pickFreshQuestion(concept, taken >= 2)
    if (!question) return undefined

    this.remediationCount.set(concept, taken + 1)
    this.markUsed(question)
    // Place it a few questions ahead, so the child does the same concept again
    // only after some space — not as an immediate second guess.
    const gap = Math.min(3, Math.max(1, this.queue.length - this.index - 1))
    this.queue.splice(this.index + gap, 0, {
      ...question,
      id: `${question.id}#fix${taken + 1}`,
      masteryRequired: true,
      review: false,
    })
    return concept
  }

  /**
   * A question on this concept using a word the child has not just seen.
   * When they have missed it repeatedly, drop to the easiest available item
   * rather than making the exercise harder (spec §13: never a punishment).
   */
  private pickFreshQuestion(concept: ConceptId, preferEasy: boolean): Question | undefined {
    const pool = this.concepts.get(concept)?.reviewPool ?? []
    const unused = pool.filter(
      (q) => !this.usedQuestionIds.has(baseId(q.id)) && !this.usedWords.has(this.wordOf(q)),
    )
    // Only fall back to a seen word when the pool genuinely has nothing left.
    const fallback = pool.filter((q) => !this.usedQuestionIds.has(baseId(q.id)))
    const source = unused.length > 0 ? unused : fallback

    if (source.length === 0) return undefined
    if (preferEasy) {
      const sorted = source.slice().sort((a, b) => a.difficulty - b.difficulty)
      return sorted[0]
    }
    return this.rng.pick(source)
  }

  /**
   * Called when the authored queue runs out. Adds one question for each
   * concept the child has not yet proved unaided.
   */
  private fillTail(): void {
    const outstanding = this.exercise.concepts.filter((c) => !this.proved.has(c))
    if (outstanding.length === 0) return

    // Guard against looping forever if a concept has no pool to draw from.
    if (this.tailFilled && this.queue.length > this.index) return

    for (const concept of outstanding) {
      const question = this.pickFreshQuestion(concept, false)
      if (!question) continue
      this.markUsed(question)
      this.queue.push({
        ...question,
        id: `${question.id}#final-${concept}`,
        masteryRequired: true,
      })
    }
    this.tailFilled = true
  }

  isComplete(): boolean {
    if (this.index < this.queue.length) return false
    return this.exercise.concepts.every((c) => this.proved.has(c) || !this.canTest(c))
  }

  /** A concept with no questions left anywhere cannot block completion. */
  private canTest(concept: ConceptId): boolean {
    const pool = this.concepts.get(concept)?.reviewPool ?? []
    return pool.length > 0
  }

  private markUsed(question: Question): void {
    this.usedQuestionIds.add(baseId(question.id))
    const word = this.wordOf(question)
    if (word) this.usedWords.add(word)
  }

  private wordOf(question: Question): string {
    return focusWord(question, this.bank).toLowerCase()
  }

  /** Concepts proved unaided this run — the exercise's reward payload. */
  provedConcepts(): ConceptId[] {
    return [...this.proved]
  }
}

/** Strips the suffixes the engine adds when it reuses a pool question. */
function baseId(id: string): string {
  return id.split(/[@#]/)[0] as string
}

/** Every word a question asks the child to spell, whatever its shape. */
export function wordsOf(q: Question): string[] {
  switch (q.type) {
    case 'audioDictation':
    case 'missingLetters':
    case 'missingPattern':
    case 'visualMemory':
    case 'syllableSplit':
      return [q.word]
    case 'cloze':
    case 'wordBuild':
      return [q.answer]
    case 'wordFamily':
      return q.targets.map((t) => t.answer)
    case 'findMistake':
      return [q.right]
    case 'proofread':
      return q.errors.map((e) => e.right)
    case 'wordSort':
      return q.groups.flatMap((g) => g.words)
    case 'sentenceDictation':
      return q.targetWord ? [q.targetWord] : []
  }
}

/**
 * The opening of a word that is written in for him when a pattern is new:
 * its first beat when it has more than one ("mit" of mitten), otherwise the
 * letters before the tricky part. Always shows at least one letter and
 * always leaves at least two to spell, so there is still a word to finish.
 */
export function stemOf(word: string, bank: WordBank): string {
  if (word.length < 3) return ''
  const syllables = syllablesOf(word, bank)
  let length = syllables.length > 1 ? (syllables[0] as string).length : patternSpanOf(word, bank)[0]
  length = Math.max(1, Math.min(length, word.length - 2))
  return word.slice(0, length)
}
