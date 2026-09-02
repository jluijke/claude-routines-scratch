import type { Exercise } from '../../spelling/types'
import { aud, dictate, letters, mistake, novel, sort } from '../build'

/**
 * Exercise 4 — plural -s and -es. The sort makes the child hear *why* some
 * words need the extra syllable before the rule is ever stated.
 */
export const exercise4: Exercise = {
  id: 4,
  title: 'More Than One',
  level: 1,
  levelName: 'Sound Detectives',
  // Seven, not eight: the type-the-missing-word questions came out and this
  // lesson is honestly shorter for it, rather than padded back up with filler.
  targetMinutes: 7,
  concepts: ['plural-s-es'],
  reviewConcepts: [],
  activities: [
    sort(
      'e4-1',
      'plural-s-es',
      {
        'just add s': ['cats', 'books', 'trees', 'hands'],
        'add es': ['buses', 'boxes', 'brushes', 'watches'],
      },
      { prompt: 'Say each word out loud. Which ones grew an extra beat when they became more than one?' },
    ),

    aud('e4-2', 'plural-s-es', 'foxes'),
    aud('e4-3', 'plural-s-es', 'dishes'),
    aud('e4-4', 'plural-s-es', 'chairs'),
    aud('e4-5', 'plural-s-es', 'glasses'),
    letters('e4-6', 'plural-s-es', 'benches'),
    letters('e4-7', 'plural-s-es', 'wishes'),

    mistake('e4-12', 'plural-s-es', 'We washed all the dishs after dinner.', 'dishs', 'dishes'),
    mistake('e4-13', 'plural-s-es', 'The dog watchs the birds every morning.', 'watchs', 'watches', {
      difficulty: 2,
    }),

    dictate('e4-14', 'plural-s-es', 'The foxes ran past the benches.', { targetWord: 'benches' }),

    novel(aud('e4-15', 'plural-s-es', 'churches', { difficulty: 2 })),
    novel(aud('e4-16', 'plural-s-es', 'buzzes', { difficulty: 3 })),
  ],
  ruleReveal: {
    title: 'More Than One',
    text: 'Most words just add "s". But if a word already ends in a hissing or buzzing sound — s, sh, ch, x or z — it needs "es" so you can still say it.',
    examples: ['cat → cats', 'bus → buses', 'box → boxes', 'brush → brushes'],
  },
}
