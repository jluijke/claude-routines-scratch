/**
 * Builds the question queue for one exercise — spec §4, §11, §12, §13.
 *
 * Shape of a queue:
 *   - the exercise's own activities, in the order the content author wrote
 *     them (discover, then apply)
 *   - a review block: ~25% recent lessons, ~15% older material
 *
 * Adaptive practice replaces review slots with targeted questions for concepts
 * the child keeps missing. It never appends extra questions, so a struggling
 * child does not get a longer exercise (spec §13).
 */
import type { Concept, ConceptId, Exercise, Question } from './types'
import type { MasteryStore } from './mastery'
import { strugglingConcepts } from './mastery'
import { estimateSeconds, estimateTotalSeconds } from './costs'
import type { Rng } from '../core/rng'

/** Share of the time budget given to review, once review starts (Exercise 6). */
const REVIEW_SHARE = 0.4
/** What is left for the current lesson — spec §12's 60%. */
const CURRENT_SHARE = 1 - REVIEW_SHARE
/** Of that review time, how much goes to the previous 5-8 exercises. */
const RECENT_SHARE = 0.625
/** How many exercises back still counts as "recent". */
const RECENT_WINDOW = 8

export interface ScheduleParams {
  exercise: Exercise
  concepts: ReadonlyMap<ConceptId, Concept>
  mastery: MasteryStore
  rng: Rng
}

export interface ScheduledQueue {
  questions: Question[]
  estimatedSeconds: number
  /** For the content validator and tests. */
  breakdown: { current: number; recent: number; older: number }
  /** Activities the budget could not fit. The validator warns when non-zero. */
  trimmed: number
}

/**
 * Keeps the current lesson inside its share of the budget so review always has
 * room. Questions that carry the exercise — the opening discovery activity, and
 * anything marked as a mastery or transfer test — are never dropped; ordinary
 * practice items go first.
 */
function trimToBudget(activities: Question[], budgetSeconds: number): {
  kept: Question[]
  trimmed: number
} {
  if (estimateTotalSeconds(activities) <= budgetSeconds) {
    return { kept: activities, trimmed: 0 }
  }

  const protectedIndexes = new Set<number>()
  if (activities.length > 0) protectedIndexes.add(0)
  activities.forEach((q, i) => {
    if (q.masteryRequired || q.novel) protectedIndexes.add(i)
  })

  const kept = activities.slice()
  // Drop optional practice from the end until the lesson fits.
  for (let i = activities.length - 1; i >= 0; i--) {
    if (estimateTotalSeconds(kept.filter(Boolean)) <= budgetSeconds) break
    if (protectedIndexes.has(i)) continue
    kept[i] = undefined as unknown as Question
  }

  const result = kept.filter(Boolean)
  return { kept: result, trimmed: activities.length - result.length }
}

function markReview(q: Question, index: number): Question {
  return { ...q, id: `${q.id}@r${index}`, review: true }
}

/**
 * Concepts eligible for review at this point in the curriculum, split into
 * those from the last few exercises and everything older.
 */
function reviewCandidates(
  exercise: Exercise,
  concepts: ReadonlyMap<ConceptId, Concept>,
): { recent: Concept[]; older: Concept[] } {
  const recent: Concept[] = []
  const older: Concept[] = []
  const named = new Set(exercise.reviewConcepts)

  for (const concept of concepts.values()) {
    if (concept.introducedIn >= exercise.id) continue
    if (concept.reviewPool.length === 0) continue
    const isRecent = named.has(concept.id) || concept.introducedIn >= exercise.id - RECENT_WINDOW
    if (isRecent) recent.push(concept)
    else older.push(concept)
  }
  return { recent, older }
}

/**
 * Draws questions from a set of concepts until the seconds budget is used,
 * preferring concepts the child is struggling with and never repeating a word.
 */
function drawReview(
  pool: Concept[],
  budgetSeconds: number,
  struggling: ReadonlySet<ConceptId>,
  used: Set<string>,
  rng: Rng,
  startIndex: number,
): Question[] {
  if (pool.length === 0 || budgetSeconds <= 0) return []

  // Struggling concepts go to the front: their questions replace ordinary
  // review rather than being added on top of it.
  const ordered = [
    ...rng.shuffle(pool.filter((c) => struggling.has(c.id))),
    ...rng.shuffle(pool.filter((c) => !struggling.has(c.id))),
  ]

  const drawn: Question[] = []
  let spent = 0
  let guard = 0

  while (spent < budgetSeconds && guard < 200) {
    guard += 1
    let addedThisPass = false

    for (const concept of ordered) {
      if (spent >= budgetSeconds) break
      const available = concept.reviewPool.filter((q) => !used.has(q.id))
      const question = rng.pick(available)
      if (!question) continue

      const cost = estimateSeconds(question)
      // Allow a small overshoot rather than leaving a big gap unfilled.
      if (spent + cost > budgetSeconds * 1.15) continue

      used.add(question.id)
      drawn.push(markReview(question, startIndex + drawn.length))
      spent += cost
      addedThisPass = true
    }

    if (!addedThisPass) break
  }

  return drawn
}

export function buildQueue(params: ScheduleParams): ScheduledQueue {
  const { exercise, concepts, mastery, rng } = params

  const budgetSeconds = exercise.targetMinutes * 60
  const current = exercise.activities.slice()
  const currentSeconds = estimateTotalSeconds(current)

  const { recent, older } = reviewCandidates(exercise, concepts)
  const hasReview = recent.length > 0 || older.length > 0

  if (!hasReview) {
    return {
      questions: current,
      estimatedSeconds: currentSeconds,
      breakdown: { current: current.length, recent: 0, older: 0 },
      trimmed: 0,
    }
  }

  // Review is not optional once the curriculum has material to revisit, so the
  // current lesson is held to its 60% share rather than crowding review out.
  const { kept, trimmed } = trimToBudget(current, budgetSeconds * CURRENT_SHARE)
  const reviewBudget = Math.max(0, budgetSeconds - estimateTotalSeconds(kept))

  const struggling = new Set(strugglingConcepts(mastery))
  const used = new Set(kept.map((q) => q.id))

  const recentQuestions = drawReview(
    recent,
    reviewBudget * RECENT_SHARE,
    struggling,
    used,
    rng,
    0,
  )
  const olderQuestions = drawReview(
    older.length > 0 ? older : recent,
    reviewBudget * (1 - RECENT_SHARE),
    struggling,
    used,
    rng,
    recentQuestions.length,
  )

  const questions = [...kept, ...recentQuestions, ...olderQuestions]
  return {
    questions,
    estimatedSeconds: estimateTotalSeconds(questions),
    breakdown: {
      current: kept.length,
      recent: recentQuestions.length,
      older: olderQuestions.length,
    },
    trimmed,
  }
}
