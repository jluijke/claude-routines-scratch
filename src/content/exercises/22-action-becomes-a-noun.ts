import type { Exercise } from '../../spelling/types'
import { aud, build, mistake, novel, syl } from '../build'

/**
 * Exercise 22 — -ment. Worth contrasting with the silent-e rule: "ment" starts
 * with a consonant, so "excite" keeps its e where "exciting" loses it.
 */
export const exercise22: Exercise = {
  id: 22,
  title: 'Action Becomes a Thing',
  level: 3,
  levelName: 'Word Engineers',
  targetMinutes: 10,
  concepts: ['suffix-ment'],
  reviewConcepts: ['suffix-ness', 'suffix-ful-less', 'drop-silent-e'],
  activities: [
    build('e22-1', 'suffix-ment', ['enjoy', 'ment'], 'enjoyment', {
      prompt: 'Add "ment" and see what the action turns into.',
    }),
    build('e22-2', 'suffix-ment', ['pay', 'ment'], 'payment'),
    build('e22-3', 'suffix-ment', ['treat', 'ment'], 'treatment'),
    build('e22-4', 'suffix-ment', ['excite', 'ment'], 'excitement', {
      prompt: 'This base word ends in a silent e. Does it keep it this time?',
      difficulty: 2,
    }),

    syl('e22-5', 'suffix-ment', 'measurement', { difficulty: 3 }),

    aud('e22-6', 'suffix-ment', 'movement'),
    aud('e22-7', 'suffix-ment', 'agreement'),
    aud('e22-8', 'suffix-ment', 'equipment'),

    mistake('e22-10', 'suffix-ment', 'The excitment was too much for the dog.', 'excitment', 'excitement'),

    novel(aud('e22-11', 'suffix-ment', 'argument', { difficulty: 3 })),
    novel(build('e22-12', 'suffix-ment', ['move', 'ment'], 'movement', { difficulty: 2 })),
  ],
  ruleReveal: {
    title: 'Action Becomes a Thing',
    text: '"ment" turns an action into a thing or a result. It begins with a consonant, so unlike "-ing" it lets a silent e stay: excite becomes excitement.',
    examples: ['enjoy → enjoyment', 'move → movement', 'excite → excitement'],
  },
}
