import type { Exercise } from '../../spelling/types'
import { aud, letters, novel, pat, sort } from '../build'

/** Exercise 53 — wh for questions, ph for an /f/ that is not an f. */
export const exercise53: Exercise = {
  id: 53,
  title: 'Whistle Phone',
  level: 6,
  levelName: 'City Spellers',
  targetMinutes: 6,
  concepts: ['wh-ph'],
  reviewConcepts: ['tricky-words', 'silent-letters', 'c-k-ck'],
  activities: [
    sort(
      'e53-1',
      'wh-ph',
      {
        'wh (a question word)': ['what', 'when', 'where'],
        'wh (not a question)': ['white', 'wheel', 'whale'],
        'ph (sounds like f)': ['phone', 'photo', 'dolphin'],
      },
      { prompt: 'Sort the words by their special letters.' },
    ),

    pat('e53-2', 'wh-ph', 'why', { choices: ['wh', 'w', 'wr'] }),
    pat('e53-3', 'wh-ph', 'phone', { choices: ['ph', 'f', 'ff'], span: [0, 2] }),
    pat('e53-4', 'wh-ph', 'white', { choices: ['wh', 'w', 'wr'] }),

    aud('e53-5', 'wh-ph', 'when'),
    aud('e53-6', 'wh-ph', 'where', { withSentence: false }),
    letters('e53-7', 'wh-ph', 'dolphin'),
    letters('e53-8', 'wh-ph', 'wheel'),

    novel(aud('e53-9', 'wh-ph', 'elephant', { difficulty: 2 })),
    novel(aud('e53-10', 'wh-ph', 'alphabet', { difficulty: 2 })),
  ],
  ruleReveal: {
    title: 'Whistle Phone',
    text: 'Question words start with "wh": what, when, where, which, why. A few other words do too, like white and whale. In some words, "ph" makes the /f/ sound: phone, photo, dolphin.',
    examples: ['what, when, where → wh', 'white, whale → wh', 'phone, photo → ph says f'],
  },
}
