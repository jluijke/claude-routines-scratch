import type { Exercise } from '../../spelling/types'
import { aud, build, mistake, novel, sort } from '../build'

/**
 * Exercise 13 — the -ly ending, which quietly reuses the y-to-i rule from the
 * exercise before it.
 */
export const exercise13: Exercise = {
  id: 13,
  title: 'Happily Ever After',
  level: 2,
  levelName: 'Pattern Hunters',
  targetMinutes: 10,
  concepts: ['ly-suffix'],
  reviewConcepts: ['y-to-i', 'er-est', 'ed-endings'],
  activities: [
    sort(
      'e13-1',
      'ly-suffix',
      {
        'just added ly': ['quickly', 'slowly', 'kindly'],
        'y became i first': ['happily', 'angrily', 'easily'],
      },
      { prompt: 'All of these tell us how something happened. Look at what changed before the ly.' },
    ),

    build('e13-2', 'ly-suffix', ['quick', '+ly'], 'quickly'),
    build('e13-3', 'ly-suffix', ['safe', '+ly'], 'safely'),
    build('e13-4', 'ly-suffix', ['happy', '+ly'], 'happily'),
    build('e13-5', 'ly-suffix', ['angry', '+ly'], 'angrily'),

    aud('e13-6', 'ly-suffix', 'loudly'),
    aud('e13-7', 'ly-suffix', 'bravely'),
    aud('e13-8', 'ly-suffix', 'quietly'),

    mistake('e13-10', 'ly-suffix', 'She sang happyly all the way home.', 'happyly', 'happily'),

    novel(build('e13-11', 'ly-suffix', ['easy', '+ly'], 'easily', { difficulty: 2 })),
    novel(aud('e13-12', 'ly-suffix', 'carefully', { difficulty: 2 })),
  ],
  ruleReveal: {
    title: 'Happily Ever After',
    text: '"ly" turns a describing word into one that tells us how something happens. Keep the base word whole — unless it ends in consonant + y, which becomes i first.',
    examples: ['quick → quickly', 'slow → slowly', 'happy → happily'],
  },
}
