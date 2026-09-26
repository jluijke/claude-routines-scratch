import type { Exercise } from '../../spelling/types'
import { aud, build, novel, pat, sort } from '../build'

/** Exercise 58 — people words: -er mostly, -or sometimes. */
export const exercise58: Exercise = {
  id: 58,
  title: 'Teacher, Actor',
  level: 6,
  levelName: 'City Spellers',
  targetMinutes: 6,
  concepts: ['er-or-people'],
  reviewConcepts: ['possessive-apostrophe', 'drop-silent-e', 'er-ir-ur'],
  activities: [
    build('e58-1', 'er-or-people', ['teach', 'er'], 'teacher', {
      prompt: 'Add an ending to make the person who does it.',
    }),
    build('e58-2', 'er-or-people', ['farm', 'er'], 'farmer'),
    build('e58-3', 'er-or-people', ['paint', 'er'], 'painter'),
    build('e58-4', 'er-or-people', ['act', 'or'], 'actor'),

    sort(
      'e58-5',
      'er-or-people',
      {
        '-er': ['teacher', 'singer', 'player'],
        '-or': ['actor', 'doctor', 'sailor'],
      },
      { prompt: 'Sort the people by their ending.' },
    ),

    pat('e58-6', 'er-or-people', 'driver', { choices: ['er', 'or', 'ar'] }),
    pat('e58-7', 'er-or-people', 'visitor', { choices: ['er', 'or', 'ar'] }),
    aud('e58-8', 'er-or-people', 'singer'),
    aud('e58-9', 'er-or-people', 'doctor'),

    novel(aud('e58-10', 'er-or-people', 'baker', { difficulty: 2 })),
  ],
  ruleReveal: {
    title: 'Teacher, Actor',
    text: 'To name the person who does something, we usually add "er": teacher, farmer. A small number of words use "or" instead, and those ones have to be remembered.',
    examples: ['teach → teacher', 'farm → farmer', 'act → actor', 'doctor, sailor → or'],
  },
}
