import type { Exercise } from '../../spelling/types'
import { mistake, novel, proof } from '../build'

/**
 * Exercise 37 — proofreading paragraphs drawn from every pattern so far.
 * Proofreading is the most expensive activity there is, so this exercise is
 * short in items and long in thinking.
 */
export const exercise37: Exercise = {
  id: 37,
  title: 'Proofreader',
  level: 5,
  levelName: 'Spelling Detectives',
  targetMinutes: 10,
  concepts: ['proofreading'],
  reviewConcepts: ['australian-spelling', 'word-roots', 'homophone-proofreading'],
  activities: [
    proof(
      'e37-1',
      'proofreading',
      'We were runing to the shop when it started raning.',
      [
        ['runing', 'running'],
        ['raning', 'raining'],
      ],
      { prompt: 'Two words are spelled wrongly. Click each one and fix it.' },
    ),

    proof('e37-2', 'proofreading', 'The babys were sleeping quietley in there cots.', [
      ['babys', 'babies'],
      ['quietley', 'quietly'],
      ['there', 'their'],
    ]),

    mistake('e37-3', 'proofreading', 'She was very carefull with the glass.', 'carefull', 'careful'),
    mistake('e37-4', 'proofreading', 'He was the tallist boy in the class.', 'tallist', 'tallest'),

    novel(
      proof('e37-5', 'proofreading', 'My favorite color is the brightest yellow.', [
        ['favorite', 'favourite'],
        ['color', 'colour'],
      ], { difficulty: 2 }),
    ),
  ],
  ruleReveal: {
    title: 'Proofreader',
    text: 'Good spellers reread their own writing and stop at any word they are not sure of. Split it, find its base word, and check it against a pattern you know.',
    examples: ['runing → running (double the n)', 'babys → babies (y becomes ies)', 'color → colour (Australian)'],
  },
}
