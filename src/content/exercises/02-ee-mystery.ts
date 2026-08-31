import type { Exercise } from '../../spelling/types'
import { aud, letters, novel, pat, sort } from '../build'

/**
 * Exercise 2 — the /ee/ sound. The sort comes first so the child notices where
 * each spelling likes to sit before anyone names the pattern.
 */
export const exercise2: Exercise = {
  id: 2,
  title: 'The /ee/ Mystery',
  level: 1,
  levelName: 'Sound Detectives',
  targetMinutes: 5,
  concepts: ['ee-sound'],
  reviewConcepts: [],
  activities: [
    sort(
      'e2-1',
      'ee-sound',
      {
        ee: ['green', 'sleep', 'three'],
        ea: ['team', 'beach', 'leaf'],
        y: ['happy', 'funny', 'city'],
      },
      { prompt: 'All of these have the /ee/ sound. Put each word with its spelling.' },
    ),

    pat('e2-2', 'ee-sound', 'tree', { choices: ['ee', 'ea'] }),
    pat('e2-3', 'ee-sound', 'clean', { choices: ['ea', 'ee'] }),
    pat('e2-4', 'ee-sound', 'lady', { choices: ['y', 'ee'] }),

    aud('e2-5', 'ee-sound', 'keep'),
    aud('e2-6', 'ee-sound', 'seat'),
    aud('e2-7', 'ee-sound', 'sunny'),
    letters('e2-8', 'ee-sound', 'queen'),
    letters('e2-9', 'ee-sound', 'dream'),

    novel(aud('e2-10', 'ee-sound', 'monkey', { difficulty: 2 })),
  ],
  ruleReveal: {
    title: 'The /ee/ Mystery',
    text: 'The /ee/ sound can be spelled in different ways. "ee" and "ea" are common inside a word, and "y" or "ey" usually turn up at the end.',
    examples: ['green, sleep → ee', 'team, beach → ea', 'happy, city → y', 'monkey, valley → ey'],
  },
}
