import type { Exercise } from '../../spelling/types'
import { aud, letters, mistake, novel, syl } from '../build'

/**
 * Exercise 31 — the schwa. The lesson is uncomfortable on purpose: here is a
 * whole class of words your ears genuinely cannot spell for you.
 */
export const exercise31: Exercise = {
  id: 31,
  title: 'The Lazy Vowel',
  level: 4,
  levelName: 'Meaning Masters',
  targetMinutes: 10,
  concepts: ['schwa'],
  reviewConcepts: ['contractions', 'homophone-proofreading', 'suffix-ous'],
  activities: [
    letters('e31-1', 'schwa', 'about', {
      prompt: 'Listen carefully. That first sound is a lazy "uh" — but which vowel is actually written?',
    }),
    letters('e31-2', 'schwa', 'garden'),
    letters('e31-3', 'schwa', 'parent'),

    syl('e31-4', 'schwa', 'problem'),
    syl('e31-5', 'schwa', 'animal', { difficulty: 2 }),

    aud('e31-6', 'schwa', 'support'),
    aud('e31-7', 'schwa', 'different', { difficulty: 2 }),
    aud('e31-8', 'schwa', 'general', { difficulty: 2 }),
    aud('e31-9', 'schwa', 'memory'),

    mistake('e31-11', 'schwa', 'That is a diffrent problem entirely.', 'diffrent', 'different'),

    novel(aud('e31-12', 'schwa', 'separate', { difficulty: 3 })),
    novel(aud('e31-13', 'schwa', 'vegetable', { difficulty: 3 })),
  ],
  ruleReveal: {
    title: 'The Lazy Vowel',
    text: 'An unstressed vowel often collapses into a weak "uh", and it can be almost any letter. When that happens you cannot spell the word just by listening — say it slowly and deliberately, or think of a related word where the vowel is clear.',
    examples: ['about (a, not u)', 'problem (e, not u)', 'animal (a in the middle)'],
  },
}
