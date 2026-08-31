import type { Exercise } from '../../spelling/types'
import { aud, letters, novel, syl } from '../build'

/**
 * Exercise 1 — the child's first five minutes. Deliberately short and easy so
 * nothing feels intimidating (spec §1), and the pattern is discovered by doing
 * rather than explained first (spec §5).
 */
export const exercise1: Exercise = {
  id: 1,
  title: 'Chop the Word',
  level: 1,
  levelName: 'Sound Detectives',
  targetMinutes: 5,
  concepts: ['syllables'],
  reviewConcepts: [],
  activities: [
    // Discover: hear a long word, feel that it comes apart into beats.
    syl('e1-1', 'syllables', 'rabbit', { prompt: 'Listen, then chop the word into its beats.' }),
    syl('e1-2', 'syllables', 'window'),
    syl('e1-3', 'syllables', 'sandwich'),
    syl('e1-4', 'syllables', 'fantastic', { difficulty: 2 }),
    syl('e1-5', 'syllables', 'elephant', { difficulty: 2 }),

    // Apply: no chopping tool this time, just spell the whole word.
    aud('e1-6', 'syllables', 'basket', { prompt: 'Say it in beats in your head, then type it.' }),
    aud('e1-7', 'syllables', 'jumper'),
    letters('e1-8', 'syllables', 'picnic'),

    // Transfer: a word the child has not been shown in this exercise.
    novel(aud('e1-9', 'syllables', 'crocodile', { difficulty: 2 })),
  ],
  ruleReveal: {
    title: 'Chop the Word',
    text: 'Long words are much easier when you split them into beats. Spell one beat at a time, then put the beats back together.',
    examples: ['rab / bit → rabbit', 'sand / wich → sandwich', 'fan / tas / tic → fantastic'],
  },
}
