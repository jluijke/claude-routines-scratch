import type { Exercise } from '../../spelling/types'
import { aud, build, family, novel, syl } from '../build'

/**
 * Exercise 24 — the whole of Level 3 pulled together. The child builds long
 * words out of parts they already know, which is the point of the level: a
 * hard word is usually a stack of easy ones.
 */
export const exercise24: Exercise = {
  id: 24,
  title: 'Word Factory',
  level: 3,
  levelName: 'Word Engineers',
  targetMinutes: 10,
  concepts: ['word-families'],
  reviewConcepts: ['suffix-ous', 'suffix-ment', 'suffix-ness', 'prefix-re-un'],
  activities: [
    family(
      'e24-1',
      'word-families',
      'help',
      [
        ['full of help', 'helpful'],
        ['without help', 'helpless'],
        ['not helpful', 'unhelpful'],
      ],
      { prompt: 'One base word, three new ones. Build each from the clue.' },
    ),

    build('e24-2', 'word-families', ['un', 'help', 'ful'], 'unhelpful'),
    build('e24-3', 'word-families', ['help', 'ful', 'ness'], 'helpfulness', { difficulty: 2 }),
    build('e24-4', 'word-families', ['un', 'kind', 'ness'], 'unkindness', { difficulty: 2 }),

    family('e24-5', 'word-families', 'care', [
      ['full of care', 'careful'],
      ['without care', 'careless'],
    ]),

    syl('e24-6', 'word-families', 'unhelpfulness', { difficulty: 3 }),

    aud('e24-7', 'word-families', 'thoughtful', { difficulty: 2 }),
    aud('e24-8', 'word-families', 'thoughtless', { difficulty: 2 }),

    novel(aud('e24-9', 'word-families', 'carelessness', { difficulty: 3 })),
    novel(build('e24-10', 'word-families', ['hope', 'ful', 'ness'], 'hopefulness', { difficulty: 3 })),
  ],
  ruleReveal: {
    title: 'Word Factory',
    text: 'Find the base word first. Prefixes go in front of it and suffixes go after it, and the base word almost always keeps its own spelling. A long word is usually a stack of short ones.',
    examples: ['help → helpful → unhelpful', 'kind → kindness → unkindness', 'care → careless → carelessness'],
  },
}
