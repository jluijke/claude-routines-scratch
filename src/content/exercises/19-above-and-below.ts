import type { Exercise } from '../../spelling/types'
import { aud, build, novel, sort, syl } from '../build'

/**
 * Exercise 19 — prefixes that carry real meaning. The words are longer here,
 * so syllable splitting from Exercise 1 comes back as a working tool.
 */
export const exercise19: Exercise = {
  id: 19,
  title: 'Above and Below',
  level: 3,
  levelName: 'Word Engineers',
  targetMinutes: 10,
  concepts: ['prefix-meaning'],
  reviewConcepts: ['prefix-mis-dis-pre', 'prefix-re-un', 'dge-ge'],
  activities: [
    sort(
      'e19-1',
      'prefix-meaning',
      {
        'means below': ['submarine', 'subway', 'underground'],
        'means undo or against': ['defrost', 'deactivate', 'antivenom'],
      },
      { prompt: 'These front pieces carry real meaning. Sort them by what they tell you.' },
    ),

    syl('e19-2', 'prefix-meaning', 'submarine', { difficulty: 2 }),
    syl('e19-3', 'prefix-meaning', 'underground', { difficulty: 2 }),

    build('e19-4', 'prefix-meaning', ['sub', 'tract'], 'subtract'),
    build('e19-5', 'prefix-meaning', ['under', 'line'], 'underline'),
    build('e19-6', 'prefix-meaning', ['anti', 'venom'], 'antivenom'),

    aud('e19-7', 'prefix-meaning', 'underwater'),
    aud('e19-8', 'prefix-meaning', 'defrost'),

    novel(aud('e19-10', 'prefix-meaning', 'deactivate', { difficulty: 3 })),
    novel(aud('e19-11', 'prefix-meaning', 'understand', { difficulty: 2 })),
  ],
  ruleReveal: {
    title: 'Above and Below',
    text: 'Prefixes carry meaning. "sub-" and "under-" mean below, "de-" means undo or remove, and "anti-" means against. Knowing the meaning helps you spell the word.',
    examples: ['sub + marine → submarine', 'under + ground → underground', 'anti + venom → antivenom'],
  },
}
