import type { Exercise } from '../../spelling/types'
import { aud, letters, mistake, novel, sort } from '../build'

/**
 * Exercise 36 — Australian spellings. The three patterns that mark our
 * spelling out — our, tre, ise — taught as patterns, with only our own
 * spellings on the page: a rival spelling shown is a rival spelling learned.
 */
export const exercise36: Exercise = {
  id: 36,
  title: 'Spell Like an Australian',
  level: 5,
  levelName: 'Spelling Detectives',
  targetMinutes: 6,
  concepts: ['australian-spelling'],
  reviewConcepts: ['word-roots', 'tion-ending', 'suffix-ous'],
  activities: [
    sort(
      'e36-1',
      'australian-spelling',
      {
        'our': ['colour', 'harbour', 'favourite', 'flavour'],
        'tre': ['centre', 'metre', 'theatre', 'litre'],
        'ise': ['realise', 'recognise', 'organise'],
      },
      { prompt: 'Three Australian endings. Sort each word by the way it finishes.' },
    ),

    aud('e36-2', 'australian-spelling', 'harbour'),
    aud('e36-3', 'australian-spelling', 'neighbour', { difficulty: 2 }),
    aud('e36-4', 'australian-spelling', 'flavour'),
    letters('e36-5', 'australian-spelling', 'theatre', { difficulty: 2 }),
    letters('e36-6', 'australian-spelling', 'litre'),

    mistake('e36-9', 'australian-spelling', 'What is your favrite colour?', 'favrite', 'favourite'),

    novel(aud('e36-10', 'australian-spelling', 'realise', { difficulty: 2 })),
    novel(aud('e36-11', 'australian-spelling', 'travelled', { difficulty: 2 })),
  ],
  ruleReveal: {
    title: 'Spell Like an Australian',
    text: 'Australian English keeps the u in "our" words, puts the r before the e in "tre" words, and ends its verbs in "ise". Three endings to remember, and a lot of words fall into line.',
    examples: ['colour, favourite, harbour', 'centre, metre, theatre', 'realise, recognise', 'travelled (two l’s)'],
  },
}
