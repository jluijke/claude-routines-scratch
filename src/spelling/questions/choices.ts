/**
 * The order the choice buttons are laid out in.
 *
 * Content is written with the right answer first — that is the natural way to
 * author a question, and it is how all but six of the ninety-five choice
 * questions in this game were written. Rendered in that order, the left-hand
 * button is always correct, and a child works that out in about four questions
 * and stops reading them. He can then finish an exercise, open a barrier and
 * earn a sack of animal food without spelling anything.
 *
 * So the shuffle lives here, at the point the buttons are drawn, rather than
 * being something eighty-nine questions each have to remember to do. Grading
 * never looks at this order; it compares against the authored answer.
 *
 * Seeded from the question, for the same reason the word-sort tiles are: the
 * order must not change under his hands when he gets one wrong and tries
 * again. Re-tests of the same concept carry a different id (`@r3`, `#fix1`), so
 * they lay out differently anyway.
 */
import { Rng } from '../../core/rng'

export function choiceOrder(choices: readonly string[], seed: string): string[] {
  if (choices.length < 2) return [...choices]
  return new Rng(`choices-${seed}`).shuffle(choices)
}
