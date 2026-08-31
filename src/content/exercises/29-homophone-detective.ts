import type { Exercise } from '../../spelling/types'
import { cloze, mistake, novel, proof } from '../build'

/**
 * Exercise 29 — a whole paragraph where every word is real and several are the
 * wrong one. This is the exercise that teaches the child not to trust a page
 * just because nothing looks misspelled.
 */
export const exercise29: Exercise = {
  id: 29,
  title: 'Homophone Detective',
  level: 4,
  levelName: 'Meaning Masters',
  targetMinutes: 10,
  concepts: ['homophone-proofreading'],
  reviewConcepts: ['homophones-more', 'apostrophe-pairs', 'homophones-there'],
  activities: [
    proof(
      'e29-1',
      'homophone-proofreading',
      'Their going too the park with there friends.',
      [
        ['Their', "They're"],
        ['too', 'to'],
        ['there', 'their'],
      ],
      { prompt: 'Every word here is a real word. Three of them are the wrong one. Find all three.' },
    ),

    proof('e29-2', 'homophone-proofreading', 'I no you can here me from over their.', [
      ['no', 'know'],
      ['here', 'hear'],
      ['their', 'there'],
    ]),

    mistake('e29-3', 'homophone-proofreading', 'We one the game by to points.', 'one', 'won'),

    cloze('e29-7', 'homophone-proofreading', 'We need ___ for the cake.', 'flour', { difficulty: 3 }),

    novel(
      proof('e29-9', 'homophone-proofreading', 'Its to cold to swim, and the water is to deep.', [
        ['Its', "It's"],
        ['to', 'too'],
      ], { difficulty: 3 }),
    ),
  ],
  ruleReveal: {
    title: 'Homophone Detective',
    text: 'Sound alone cannot solve a homophone. You need the meaning as well — which is why reading your own writing back, slowly, catches mistakes nothing else will.',
    examples: ["Their going → They're going", 'too the park → to the park', 'can you here me → hear me'],
  },
}
