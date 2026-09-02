import type { Exercise } from '../../spelling/types'
import { aud, build, letters, novel, sort } from '../build'

/**
 * Exercise 6 — compound words, and the first exercise with cumulative review
 * (spec §12). Activities are written to about 60% of the ten-minute budget so
 * the scheduler has room for the review block.
 */
export const exercise6: Exercise = {
  id: 6,
  title: 'Word Lego',
  level: 1,
  levelName: 'Sound Detectives',
  targetMinutes: 10,
  concepts: ['compound-words'],
  reviewConcepts: ['plural-y-ies', 'plural-s-es', 'oa-sound'],
  activities: [
    build('e6-1', 'compound-words', ['rain', 'bow'], 'rainbow', {
      prompt: 'Two small words have been stuck together. What do they make?',
    }),
    build('e6-2', 'compound-words', ['tooth', 'brush'], 'toothbrush'),
    build('e6-3', 'compound-words', ['bed', 'room'], 'bedroom'),
    build('e6-4', 'compound-words', ['foot', 'ball'], 'football'),

    sort(
      'e6-5',
      'compound-words',
      {
        'starts with a place': ['bedroom', 'playground', 'seaside'],
        'starts with a thing': ['toothpaste', 'cupcake', 'snowman'],
      },
      { prompt: 'Look at the first small word inside each one.' },
    ),

    aud('e6-6', 'compound-words', 'birthday'),
    aud('e6-7', 'compound-words', 'sunflower'),
    letters('e6-8', 'compound-words', 'weekend'),

    novel(aud('e6-10', 'compound-words', 'strawberry', { difficulty: 2 })),
    novel(build('e6-11', 'compound-words', ['sky', 'scraper'], 'skyscraper', { difficulty: 2 })),
  ],
  ruleReveal: {
    title: 'Word Lego',
    text: 'A compound word is two smaller words joined together. Each small word almost always keeps its own spelling, so find them and spell one at a time.',
    examples: ['rain + bow → rainbow', 'tooth + brush → toothbrush', 'foot + ball → football'],
  },
}
