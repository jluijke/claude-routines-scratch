import type { Exercise } from '../../spelling/types'
import { aud, letters, novel, pat, sort } from '../build'

/** Exercise 51 — the /k/ sound: c, k and ck. */
export const exercise51: Exercise = {
  id: 51,
  title: 'Quick Kick',
  level: 6,
  levelName: 'City Spellers',
  targetMinutes: 6,
  concepts: ['c-k-ck'],
  reviewConcepts: ['or-aw-sound', 'consonant-doubling', 'soft-c-g'],
  activities: [
    sort(
      'e51-1',
      'c-k-ck',
      {
        'c before a, o, u': ['cat', 'cot', 'cup'],
        'k before e, i': ['kite', 'kettle', 'king'],
        'ck after a short vowel': ['duck', 'sock', 'black'],
      },
      { prompt: 'Look at the letter next to the /k/ sound in each word.' },
    ),

    pat('e51-2', 'c-k-ck', 'clock', { choices: ['c', 'k', 'ck'], span: [3, 5] }),
    pat('e51-3', 'c-k-ck', 'kitten', { choices: ['c', 'k', 'ck'] }),
    pat('e51-4', 'c-k-ck', 'cake', { choices: ['c', 'k', 'ck'] }),

    aud('e51-5', 'c-k-ck', 'duck'),
    aud('e51-6', 'c-k-ck', 'kite'),
    letters('e51-7', 'c-k-ck', 'trick'),
    letters('e51-8', 'c-k-ck', 'stick'),

    novel(aud('e51-9', 'c-k-ck', 'pocket', { difficulty: 2 })),
    novel(aud('e51-10', 'c-k-ck', 'rocket', { difficulty: 2 })),
  ],
  ruleReveal: {
    title: 'Quick Kick',
    text: 'Use "ck" straight after a short vowel sound: back, duck. Use "k" before an e or an i: kite, kettle. Use "c" before a, o and u: cat, cot, cup.',
    examples: ['duck, sock → ck', 'kite, kettle → k', 'cat, cup → c'],
  },
}
