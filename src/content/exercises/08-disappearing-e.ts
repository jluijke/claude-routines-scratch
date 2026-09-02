import type { Exercise } from '../../spelling/types'
import { aud, build, mistake, novel, sort } from '../build'

/**
 * Exercise 8 — the silent e that disappears. Sits straight after doubling on
 * purpose: the two patterns are easy to confuse, so they are taught back to
 * back and then reviewed against each other.
 */
export const exercise8: Exercise = {
  id: 8,
  title: 'The Disappearing E',
  level: 1,
  levelName: 'Sound Detectives',
  targetMinutes: 10,
  concepts: ['drop-silent-e'],
  reviewConcepts: ['consonant-doubling', 'compound-words', 'plural-s-es'],
  activities: [
    sort(
      'e8-1',
      'drop-silent-e',
      {
        'the e vanished': ['making', 'hoping', 'writing', 'riding'],
        'nothing changed': ['jumping', 'playing', 'reading', 'looking'],
      },
      { prompt: 'Each base word added -ing. Which ones lost a letter along the way?' },
    ),

    build('e8-2', 'drop-silent-e', ['make', '+ing'], 'making'),
    build('e8-3', 'drop-silent-e', ['hope', '+ing'], 'hoping'),
    build('e8-4', 'drop-silent-e', ['write', '+ing'], 'writing'),
    build('e8-5', 'drop-silent-e', ['dance', '+ing'], 'dancing'),

    aud('e8-6', 'drop-silent-e', 'baking'),
    aud('e8-7', 'drop-silent-e', 'smiling'),
    aud('e8-8', 'drop-silent-e', 'closing'),

    mistake('e8-10', 'drop-silent-e', 'We are makeing a cake for Nan.', 'makeing', 'making'),

    novel(build('e8-11', 'drop-silent-e', ['shine', '+ing'], 'shining', { difficulty: 2 })),
    novel(aud('e8-12', 'drop-silent-e', 'saving', { difficulty: 2 })),
  ],
  ruleReveal: {
    title: 'The Disappearing E',
    text: 'A silent e at the end of a word is usually dropped before an ending that starts with a vowel. The e has done its job, so it steps aside.',
    examples: ['make → making', 'hope → hoping', 'write → writing'],
  },
}
