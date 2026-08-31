import type { Exercise } from '../../spelling/types'
import { aud, build, cloze, mistake, novel, sort } from '../build'

/**
 * Exercise 7 — doubling. The contrast with "hope → hoping" is in from the
 * start, because the pattern is only useful if the child can tell when it does
 * *not* apply.
 */
export const exercise7: Exercise = {
  id: 7,
  title: 'Double Trouble',
  level: 1,
  levelName: 'Sound Detectives',
  targetMinutes: 10,
  concepts: ['consonant-doubling'],
  reviewConcepts: ['compound-words', 'plural-y-ies', 'ee-sound'],
  activities: [
    sort(
      'e7-1',
      'consonant-doubling',
      {
        'doubled the letter': ['running', 'hopping', 'sitting', 'stopped'],
        'kept it single': ['hoping', 'making', 'jumping', 'playing'],
      },
      { prompt: 'Each of these added an ending. Which ones grew an extra letter?' },
    ),

    build('e7-2', 'consonant-doubling', ['run', '+ing'], 'running'),
    build('e7-3', 'consonant-doubling', ['hop', '+ing'], 'hopping'),
    build('e7-4', 'consonant-doubling', ['stop', '+ed'], 'stopped'),
    build('e7-5', 'consonant-doubling', ['sit', '+ing'], 'sitting'),

    aud('e7-6', 'consonant-doubling', 'swimming'),
    aud('e7-7', 'consonant-doubling', 'shopping'),
    aud('e7-8', 'consonant-doubling', 'planned'),

    cloze('e7-9', 'consonant-doubling', 'The rain kept ___ on the tin roof.', 'dropping', { difficulty: 2 }),
    mistake('e7-10', 'consonant-doubling', 'The bus stoped at the corner.', 'stoped', 'stopped'),

    novel(build('e7-11', 'consonant-doubling', ['drum', '+ing'], 'drumming', { difficulty: 2 })),
    novel(aud('e7-12', 'consonant-doubling', 'grabbing', { difficulty: 2 })),
  ],
  ruleReveal: {
    title: 'Double Trouble',
    text: 'For many short words ending in one vowel and one consonant, double that last consonant before adding an ending that starts with a vowel.',
    examples: ['run → running', 'hop → hopping', 'sit → sitting', 'but: hope → hoping'],
  },
}
