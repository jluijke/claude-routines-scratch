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
import { exercise9 } from './09-three-sounds'
import { exercise10 } from './10-sneaky-s'
import { exercise11 } from './11-bigger-biggest'
import { exercise12 } from './12-happy-happier'
import { exercise13 } from './13-happily-ever-after'
import { exercise14 } from './14-invisible-letters'
import { exercise15 } from './15-bridge-or-huge'
import { exercise16 } from './16-catch-the-t'
import { exercise17 } from './17-build-it-again'
import { exercise18 } from './18-something-went-wrong'
import { exercise19 } from './19-above-and-below'
import { exercise20 } from './20-full-or-empty'
import { exercise21 } from './21-turn-it-into-a-thing'
import { exercise22 } from './22-action-becomes-a-noun'
import { exercise23 } from './23-full-of-something'
import { exercise24 } from './24-word-factory'
import { exercise25 } from './25-there-their-theyre'
import { exercise26 } from './26-to-too-two'
import { exercise27 } from './27-your-youre'
import { exercise28 } from './28-hear-it-here'
import { exercise29 } from './29-homophone-detective'
import { exercise30 } from './30-missing-letters'
import { exercise31 } from './31-the-lazy-vowel'
import { exercise32 } from './32-break-it-two-ways'
import { exercise33 } from './33-soft-c-soft-g'
import { exercise34 } from './34-shun-ending'
import { exercise35 } from './35-ancient-word-pieces'
import { exercise36 } from './36-spell-like-an-australian'
import { exercise37 } from './37-proofreader'
import { exercise38 } from './38-listen-and-write'
import { exercise39 } from './39-dont-trust-spellcheck'
import { exercise40 } from './40-the-spelling-mystery'

/** The 40-exercise progression, in order. */
export const EXERCISES: Exercise[] = [
  exercise1, exercise2, exercise3, exercise4, exercise5,
  exercise6, exercise7, exercise8,
  exercise9, exercise10, exercise11, exercise12,
  exercise13, exercise14, exercise15, exercise16,
  exercise17, exercise18, exercise19, exercise20,
  exercise21, exercise22, exercise23, exercise24,
  exercise25, exercise26, exercise27, exercise28,
  exercise29, exercise30, exercise31, exercise32,
  exercise33, exercise34, exercise35, exercise36,
  exercise37, exercise38, exercise39, exercise40,
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
