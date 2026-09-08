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

/**
 * The most questions one exercise may ask.
 *
 * The binding constraint, ahead of the time budget below. Cumulative review
 * used to push a late exercise past twenty-five questions, which is a long sit
 * for a nine-year-old however well judged each question is — and a child who
 * has stopped caring by question twenty is not learning from questions twenty
 * to twenty-eight. Everything else here divides this number up.
 *
 * Getting one wrong can still add a question, because proving a pattern
 * unaided is the point of the whole engine; the cap is on what is asked for
 * up front.
 */
export const MAX_QUESTIONS = 14

/** Share of the time budget given to review, once review starts (Exercise 6). */
const REVIEW_SHARE = 0.4
/** What is left for the current lesson — spec §12's 60%. */
const CURRENT_SHARE = 1 - REVIEW_SHARE
/** Of that review time, how much goes to the previous 5-8 exercises. */
const RECENT_SHARE = 0.625
/** The fewest review questions an exercise may end up with once review starts. */
const REVIEW_FLOOR = 2
/** How many exercises back still counts as "recent". */
const RECENT_WINDOW = 8
/**
 * Cumulative review begins at Exercise 6 (spec §4C). Before that the child is
 * still meeting their first few patterns, and an exercise is only its own
 * lesson.
 */
const REVIEW_STARTS_AT = 6

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
 * Keeps the current lesson inside its share of the exercise so review always
 * has room — its share of the questions, and of the time. Questions that carry
 * the exercise — the opening discovery activity, and anything marked as a
 * mastery or transfer test — are never dropped; ordinary practice items go
 * first.
 */
function trimToBudget(activities: Question[], budgetSeconds: number, maxCount: number): {
  kept: Question[]
  trimmed: number
} {
  const fits = (list: Question[]): boolean =>
    list.length <= maxCount && estimateTotalSeconds(list) <= budgetSeconds

  if (fits(activities)) return { kept: activities, trimmed: 0 }

  const protectedIndexes = new Set<number>()
  if (activities.length > 0) protectedIndexes.add(0)
  activities.forEach((q, i) => {
    if (q.masteryRequired || q.novel) protectedIndexes.add(i)
  })

  const kept = activities.slice()
  // Drop optional practice from the end until the lesson fits.
  for (let i = activities.length - 1; i >= 0; i--) {
    if (fits(kept.filter(Boolean))) break
    if (protectedIndexes.has(i)) continue
    kept[i] = undefined as unknown as Question
  }

  // An exercise whose protected questions alone overrun the cap keeps the ones
  // it meets first. Rare, and better than an exercise that ignores the cap.
  let result = kept.filter(Boolean)
  if (result.length > maxCount) result = result.slice(0, maxCount)

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
  maxCount: number,
  struggling: ReadonlySet<ConceptId>,
  used: Set<string>,
  rng: Rng,
  startIndex: number,
): Question[] {
  if (pool.length === 0 || budgetSeconds <= 0 || maxCount <= 0) return []

  // Struggling concepts go to the front: their questions replace ordinary
  // review rather than being added on top of it.
  const ordered = [
    ...rng.shuffle(pool.filter((c) => struggling.has(c.id))),
    ...rng.shuffle(pool.filter((c) => !struggling.has(c.id))),
  ]

  const drawn: Question[] = []
  let spent = 0
  let guard = 0

  while (spent < budgetSeconds && drawn.length < maxCount && guard < 200) {
    guard += 1
    let addedThisPass = false

    for (const concept of ordered) {
      if (spent >= budgetSeconds || drawn.length >= maxCount) break
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

  const { recent, older } = reviewCandidates(exercise, concepts)
  const hasReview = exercise.id >= REVIEW_STARTS_AT && (recent.length > 0 || older.length > 0)

  if (!hasReview) {
    // The early exercises are their own lesson and nothing else, but the cap
    // is the cap: Exercise 5 authored fifteen activities.
    const { kept, trimmed } = trimToBudget(current, budgetSeconds, MAX_QUESTIONS)
    return {
      questions: kept,
      estimatedSeconds: estimateTotalSeconds(kept),
      breakdown: { current: kept.length, recent: 0, older: 0 },
      trimmed,
    }
  }

  // Review is not optional once the curriculum has material to revisit, so the
  // current lesson is held to its 60% share of the questions rather than
  // crowding review out.
  //
  // By count, not by the clock. The lesson's own questions are the ones an
  // author chose deliberately, and holding them to 60% of the *minutes* as
  // well cut two of the four questions out of the exercises whose activities
  // are long ones — spending the lesson to buy review of older material.
  const currentCap = Math.round(MAX_QUESTIONS * CURRENT_SHARE)
  const { kept, trimmed } = trimToBudget(current, budgetSeconds, currentCap)
  // A lesson made of long questions — four proofreads, say — can spend the
  // whole budget on its own. Cumulative review still gets a footing: it is the
  // thing that keeps Exercise 12 alive at Exercise 39, and an exercise that
  // quietly drops it is worse than one that runs half a minute over.
  const reviewFloorSeconds = REVIEW_FLOOR * 30
  const reviewBudget = Math.max(
    budgetSeconds - estimateTotalSeconds(kept),
    reviewFloorSeconds,
  )
  // Whatever the lesson did not use goes to review, so a short lesson still
  // fills the exercise rather than ending early.
  const reviewCap = Math.max(0, MAX_QUESTIONS - kept.length)
  const recentCap = Math.round(reviewCap * RECENT_SHARE)

  const struggling = new Set(strugglingConcepts(mastery))
  const used = new Set(kept.map((q) => q.id))

  const recentQuestions = drawReview(
    recent,
    reviewBudget * RECENT_SHARE,
    recentCap,
    struggling,
    used,
    rng,
    0,
  )
  // Counted against what recent actually drew, not what it was allowed, so a
  // thin recent pool does not shorten the exercise.
  const olderQuestions = drawReview(
    older.length > 0 ? older : recent,
    reviewBudget * (1 - RECENT_SHARE),
    reviewCap - recentQuestions.length,
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
