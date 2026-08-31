import type { Exercise } from '../../spelling/types'
import { aud, cloze, letters, mistake, novel, sort } from '../build'

/**
 * Exercise 14 — silent letters. Ears are no help here, which is the point: the
 * child has to learn to distrust sound alone, ready for the homophone work in
 * Level 4.
 */
export const exercise14: Exercise = {
  id: 14,
  title: 'Invisible Letters',
  level: 2,
  levelName: 'Pattern Hunters',
  targetMinutes: 10,
  concepts: ['silent-letters'],
  reviewConcepts: ['ly-suffix', 'y-to-i', 'consonant-doubling'],
  activities: [
    sort(
      'e14-1',
      'silent-letters',
      {
        'starts with kn': ['knee', 'know', 'knock'],
        'starts with wr': ['write', 'wrong', 'wrap'],
        'ends with mb': ['thumb', 'climb', 'lamb'],
      },
      { prompt: 'Say each word. There is a letter in every one of them that you never hear.' },
    ),

    letters('e14-2', 'silent-letters', 'knife'),
    letters('e14-3', 'silent-letters', 'wrist'),
    letters('e14-4', 'silent-letters', 'crumb'),

    aud('e14-5', 'silent-letters', 'knot'),
    aud('e14-6', 'silent-letters', 'wreck'),
    aud('e14-7', 'silent-letters', 'numb'),

    cloze('e14-8', 'silent-letters', 'I hurt my ___ falling off the swing.', 'knee'),
    cloze('e14-9', 'silent-letters', 'Please ___ your name at the top.', 'write'),
    mistake('e14-10', 'silent-letters', 'He got the answer rong again.', 'rong', 'wrong'),

    novel(aud('e14-11', 'silent-letters', 'knight', { difficulty: 2 })),
    novel(aud('e14-12', 'silent-letters', 'wrinkle', { difficulty: 3 })),
  ],
  ruleReveal: {
    title: 'Invisible Letters',
    text: 'Some spelling patterns contain letters we never say. Watch for "kn" and "wr" at the start of a word, and "mb" at the end.',
    examples: ['knee, know, knock', 'write, wrong, wrap', 'thumb, climb, lamb'],
  },
}
