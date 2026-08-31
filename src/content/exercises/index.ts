/**
 * The curriculum. Exercises are plain data — adding number 25 or 38 means
 * adding a file here, not touching any application logic.
 */
import type { Exercise } from '../../spelling/types'
import { exercise1 } from './01-chop-the-word'
import { exercise2 } from './02-ee-mystery'
import { exercise3 } from './03-oa-mystery'
import { exercise4 } from './04-more-than-one'
import { exercise5 } from './05-baby-to-babies'
import { exercise6 } from './06-word-lego'
import { exercise7 } from './07-double-trouble'
import { exercise8 } from './08-disappearing-e'

/** The 40-exercise progression, in order. */
export const EXERCISES: Exercise[] = [
  exercise1, exercise2, exercise3, exercise4, exercise5,
  exercise6, exercise7, exercise8,
]

export const TOTAL_EXERCISES = 40

export function exerciseById(id: number): Exercise | undefined {
  return EXERCISES.find((e) => e.id === id)
}

/** The next exercise the child is allowed to start (spec §16: strictly in order). */
export function nextExercise(completed: readonly number[]): Exercise | undefined {
  return EXERCISES.find((e) => !completed.includes(e.id))
}

export function isUnlocked(id: number, completed: readonly number[]): boolean {
  if (id === 1) return true
  return completed.includes(id - 1)
}
