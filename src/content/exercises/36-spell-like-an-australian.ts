import type { Exercise } from '../../spelling/types'
import { aud, cloze, letters, mistake, novel, sort } from '../build'

/**
 * Exercise 36 — Australian spellings. Framed as "which country wrote this?"
 * rather than right and wrong, because he will meet the American forms
 * constantly online and needs to recognise both.
 */
export const exercise36: Exercise = {
  id: 36,
  title: 'Spell Like an Australian',
  level: 5,
  levelName: 'Spelling Detectives',
  targetMinutes: 10,
  concepts: ['australian-spelling'],
  reviewConcepts: ['word-roots', 'tion-ending', 'suffix-ous'],
  activities: [
    sort(
      'e36-1',
      'australian-spelling',
      {
        'Australian': ['colour', 'favourite', 'centre', 'metre'],
        'American': ['color', 'favorite', 'center', 'meter'],
      },
      { prompt: 'Both columns are real spellings — but only one column is how we write in Australia.' },
    ),

    aud('e36-2', 'australian-spelling', 'harbour'),
    aud('e36-3', 'australian-spelling', 'neighbour', { difficulty: 2 }),
    aud('e36-4', 'australian-spelling', 'flavour'),
    letters('e36-5', 'australian-spelling', 'theatre', { difficulty: 2 }),
    letters('e36-6', 'australian-spelling', 'litre'),

    cloze('e36-7', 'australian-spelling', 'My ___ is dark green.', 'colour'),
    cloze('e36-8', 'australian-spelling', 'The pool is fifty ___ long.', 'metres', { difficulty: 2 }),
    mistake('e36-9', 'australian-spelling', 'What is your favorite color?', 'favorite', 'favourite'),

    novel(aud('e36-10', 'australian-spelling', 'realise', { difficulty: 2 })),
    novel(aud('e36-11', 'australian-spelling', 'travelled', { difficulty: 2 })),
  ],
  ruleReveal: {
    title: 'Spell Like an Australian',
    text: 'Australian English keeps the u in "our" words and puts the r before the e in "tre" words, and our verbs usually end in "ise". The American spellings you see online are not wrong — they are just not ours.',
    examples: ['colour, favourite, harbour', 'centre, metre, theatre', 'realise, recognise', 'travelled (two l’s)'],
  },
}
