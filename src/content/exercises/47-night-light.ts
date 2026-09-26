import type { Exercise } from '../../spelling/types'
import { aud, letters, novel, pat, sort } from '../build'

/** Exercise 47 — the /igh/ sound three ways. */
export const exercise47: Exercise = {
  id: 47,
  title: 'Night Light',
  level: 6,
  levelName: 'City Spellers',
  targetMinutes: 6,
  concepts: ['igh-sound'],
  reviewConcepts: ['ai-ay-sound', 'drop-silent-e', 'compound-weather'],
  activities: [
    sort(
      'e47-1',
      'igh-sound',
      {
        igh: ['night', 'light', 'bright'],
        y: ['fly', 'sky', 'cry'],
        'i with an e': ['bike', 'time', 'kite'],
      },
      { prompt: 'All of these have the /igh/ sound. Put each word with its spelling.' },
    ),

    pat('e47-2', 'igh-sound', 'fight', { choices: ['igh', 'y', 'i'] }),
    pat('e47-3', 'igh-sound', 'dry', { choices: ['igh', 'y', 'ie'] }),
    pat('e47-4', 'igh-sound', 'slide', { choices: ['igh', 'y', 'i'] }),

    aud('e47-5', 'igh-sound', 'night'),
    aud('e47-6', 'igh-sound', 'sky'),
    letters('e47-7', 'igh-sound', 'bright'),
    letters('e47-8', 'igh-sound', 'high'),

    novel(aud('e47-9', 'igh-sound', 'flight', { difficulty: 2 })),
    novel(aud('e47-10', 'igh-sound', 'lightning', { difficulty: 2 })),
  ],
  ruleReveal: {
    title: 'Night Light',
    text: '"igh" is common in the middle of a word, often right before a t. A short word that ends with the sound usually ends in y. Otherwise, try an i with a silent e at the end.',
    examples: ['night, bright → igh', 'fly, sky → y', 'bike, kite → i and e'],
  },
}
