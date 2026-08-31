import type { Exercise } from '../../spelling/types'
import { aud, build, dictate, novel, proof, syl } from '../build'

/**
 * Exercise 40 — the final mixed mastery test.
 *
 * Deliberately unlabelled: the child is never told which pattern any question
 * is about. That is the whole point of finishing — by now they should be able
 * to work out which tool a word needs without being handed it.
 */
export const exercise40: Exercise = {
  id: 40,
  title: 'The Spelling Mystery',
  level: 5,
  levelName: 'Spelling Detectives',
  targetMinutes: 10,
  concepts: ['mixed-mastery'],
  reviewConcepts: [
    'spellcheck-limits',
    'sentence-dictation',
    'australian-spelling',
    'tion-ending',
    'word-families',
    'homophones-there',
    'consonant-doubling',
    'syllables',
  ],
  activities: [
    aud('e40-1', 'mixed-mastery', 'celebration', {
      prompt: 'No clues this time. Work out which pattern it needs.',
      difficulty: 3,
    }),
    syl('e40-2', 'mixed-mastery', 'extraordinary', { difficulty: 3 }),
    build('e40-3', 'mixed-mastery', ['un', 'believe', 'able'], 'unbelievable', { difficulty: 3 }),
    aud('e40-4', 'mixed-mastery', 'neighbour', { difficulty: 3 }),

    proof('e40-5', 'mixed-mastery', 'Their neighbor was very unhelpfull.', [
      ['neighbor', 'neighbour'],
      ['unhelpfull', 'unhelpful'],
    ], { difficulty: 3 }),

    novel(dictate('e40-6', 'mixed-mastery', "It's too late to catch the earlier train.", { difficulty: 3 })),
    novel(aud('e40-7', 'mixed-mastery', 'imagination', { difficulty: 3 })),
  ],
  ruleReveal: {
    title: 'You are a Spelling Detective',
    text: 'Great spellers use five clues: sounds, syllables, spelling patterns, word parts, and meaning. You have every one of them now.',
    examples: [
      '1. sounds  2. syllables  3. patterns',
      '4. word parts  5. meaning',
      'When a word is hard, try all five.',
    ],
  },
}
