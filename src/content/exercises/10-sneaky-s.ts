import type { Exercise } from '../../spelling/types'
import { aud, letters, mistake, novel, sort } from '../build'

/**
 * Exercise 10 — the same trick as Exercise 9, applied to plurals: the ending
 * changes its sound without changing how it is written.
 */
export const exercise10: Exercise = {
  id: 10,
  title: 'Sneaky S',
  level: 2,
  levelName: 'Pattern Hunters',
  targetMinutes: 10,
  concepts: ['plural-sounds'],
  reviewConcepts: ['ed-endings', 'drop-silent-e', 'plural-y-ies'],
  activities: [
    sort(
      'e10-1',
      'plural-sounds',
      {
        'sounds like /s/': ['cats', 'clocks', 'lamps'],
        'sounds like /z/': ['dogs', 'beds', 'birds'],
        'sounds like /iz/': ['buses', 'roses', 'horses'],
      },
      { prompt: 'All of these mean more than one. Listen to the very end of each word.' },
    ),

    aud('e10-2', 'plural-sounds', 'snakes'),
    aud('e10-3', 'plural-sounds', 'tables'),
    aud('e10-4', 'plural-sounds', 'roses'),
    letters('e10-5', 'plural-sounds', 'horses'),
    letters('e10-6', 'plural-sounds', 'clocks'),

    mistake('e10-9', 'plural-sounds', 'Two horsez stood by the gate.', 'horsez', 'horses'),

    novel(aud('e10-10', 'plural-sounds', 'glasses', { difficulty: 2 })),
    novel(aud('e10-11', 'plural-sounds', 'birds')),
  ],
  ruleReveal: {
    title: 'Sneaky S',
    text: 'The plural ending can sound like /s/, /z/ or /iz/, but you still spell it the ordinary way: "s", or "es" after a hissing sound.',
    examples: ['cat → cats (/s/)', 'dog → dogs (/z/)', 'rose → roses (/iz/)'],
  },
}
