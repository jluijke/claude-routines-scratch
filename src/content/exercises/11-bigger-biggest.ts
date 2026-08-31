import type { Exercise } from '../../spelling/types'
import { aud, build, cloze, mistake, novel, sort } from '../build'

/**
 * Exercise 11 — comparing. This is where doubling from Exercise 7 comes back
 * in a new job, which is exactly the transfer the brief asks for.
 */
export const exercise11: Exercise = {
  id: 11,
  title: 'Bigger, Biggest',
  level: 2,
  levelName: 'Pattern Hunters',
  targetMinutes: 10,
  concepts: ['er-est'],
  reviewConcepts: ['plural-sounds', 'ed-endings', 'consonant-doubling'],
  activities: [
    sort(
      'e11-1',
      'er-est',
      {
        'just added the ending': ['faster', 'tallest', 'slower'],
        'doubled the last letter first': ['bigger', 'hottest', 'thinner'],
      },
      { prompt: 'Look at the base word inside each one. Which ones grew an extra letter?' },
    ),

    build('e11-2', 'er-est', ['fast', '+er'], 'faster'),
    build('e11-3', 'er-est', ['tall', '+est'], 'tallest'),
    build('e11-4', 'er-est', ['big', '+er'], 'bigger'),
    build('e11-5', 'er-est', ['hot', '+est'], 'hottest'),

    aud('e11-6', 'er-est', 'quickest'),
    aud('e11-7', 'er-est', 'strongest'),
    aud('e11-8', 'er-est', 'thinner'),

    cloze('e11-9', 'er-est', 'That is the ___ tree in the whole park.', 'tallest'),
    mistake('e11-10', 'er-est', 'Today is hoter than yesterday.', 'hoter', 'hotter'),

    novel(build('e11-11', 'er-est', ['thin', '+est'], 'thinnest', { difficulty: 2 })),
    novel(aud('e11-12', 'er-est', 'slower')),
  ],
  ruleReveal: {
    title: 'Bigger, Biggest',
    text: 'Use "er" when you compare two things and "est" for the most of all. If the word is short with one vowel and one consonant, double that consonant first — the same trick as Double Trouble.',
    examples: ['fast → faster → fastest', 'big → bigger → biggest', 'hot → hotter → hottest'],
  },
}
