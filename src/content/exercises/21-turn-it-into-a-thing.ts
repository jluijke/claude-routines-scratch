import type { Exercise } from '../../spelling/types'
import { aud, build, cloze, mistake, novel, sort } from '../build'

/**
 * Exercise 21 — -ness, which quietly needs the y-to-i rule from Exercise 12
 * for "happy" and "lazy".
 */
export const exercise21: Exercise = {
  id: 21,
  title: 'Turn It Into a Thing',
  level: 3,
  levelName: 'Word Engineers',
  targetMinutes: 10,
  concepts: ['suffix-ness'],
  reviewConcepts: ['suffix-ful-less', 'y-to-i', 'prefix-re-un'],
  activities: [
    sort(
      'e21-1',
      'suffix-ness',
      {
        'base word unchanged': ['kindness', 'darkness', 'sadness'],
        'y became i first': ['happiness', 'laziness'],
      },
      { prompt: 'All of these added ness. Two of the base words had to change first — which?' },
    ),

    build('e21-2', 'suffix-ness', ['kind', 'ness'], 'kindness'),
    build('e21-3', 'suffix-ness', ['dark', 'ness'], 'darkness'),
    build('e21-4', 'suffix-ness', ['happy', 'ness'], 'happiness'),
    build('e21-5', 'suffix-ness', ['good', 'ness'], 'goodness'),

    aud('e21-6', 'suffix-ness', 'illness'),
    aud('e21-7', 'suffix-ness', 'fitness'),
    aud('e21-8', 'suffix-ness', 'weakness'),

    cloze('e21-9', 'suffix-ness', 'We waited in the ___ for our eyes to adjust.', 'darkness'),
    mistake('e21-10', 'suffix-ness', 'Her happyness was obvious to everyone.', 'happyness', 'happiness'),

    novel(aud('e21-11', 'suffix-ness', 'brightness', { difficulty: 2 })),
    novel(build('e21-12', 'suffix-ness', ['lazy', 'ness'], 'laziness', { difficulty: 3 })),
  ],
  ruleReveal: {
    title: 'Turn It Into a Thing',
    text: '"ness" turns a describing word into a thing or a quality. Keep the base word whole — unless it ends in consonant + y, which becomes i first.',
    examples: ['kind → kindness', 'dark → darkness', 'happy → happiness'],
  },
}
