import type { Exercise } from '../../spelling/types'
import { aud, letters, novel, sort, syl } from '../build'

/** Exercise 54 — words that end in -le. */
export const exercise54: Exercise = {
  id: 54,
  title: 'Table Top',
  level: 6,
  levelName: 'City Spellers',
  targetMinutes: 6,
  concepts: ['le-ending'],
  reviewConcepts: ['wh-ph', 'consonant-doubling', 'syllables'],
  activities: [
    sort(
      'e54-1',
      'le-ending',
      {
        'double letter before le': ['apple', 'little', 'middle'],
        'one letter before le': ['table', 'candle', 'jungle'],
      },
      { prompt: 'Look at the letter just before "le". Is it doubled?' },
    ),

    syl('e54-2', 'le-ending', 'bottle'),
    syl('e54-3', 'le-ending', 'candle'),

    aud('e54-4', 'le-ending', 'table'),
    aud('e54-5', 'le-ending', 'apple'),
    aud('e54-6', 'le-ending', 'little'),
    letters('e54-7', 'le-ending', 'turtle'),
    letters('e54-8', 'le-ending', 'jungle'),

    novel(aud('e54-9', 'le-ending', 'puzzle', { difficulty: 2 })),
    novel(aud('e54-10', 'le-ending', 'beetle', { difficulty: 2 })),
  ],
  ruleReveal: {
    title: 'Table Top',
    text: 'The /ul/ sound at the end of a word is usually spelled "le". Clap the beats: if the first beat has a short vowel, the letter before "le" is usually doubled.',
    examples: ['ta-ble, can-dle', 'ap-ple, lit-tle → doubled', 'puz-zle → doubled'],
  },
}
