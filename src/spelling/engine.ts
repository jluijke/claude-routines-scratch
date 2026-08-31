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

    const unaided = firstAttempt && this.hintLevel === 0
    recordAttempt(this.mastery, {
      concept: question.concept,
      correct: result.correct,
      firstAttempt,
      hintsUsed: firstAttempt ? this.hintLevel : 0,
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
