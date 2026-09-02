import type { Exercise } from '../../spelling/types'
import { aud, dictate, letters, memory, mistake, novel, sort } from '../build'

/**
 * Exercise 5 — the first full ten-minute exercise. Consonant + y becomes ies,
 * but vowel + y just adds s: the contrast is the whole lesson, so both kinds
 * appear side by side from the very first activity.
 */
export const exercise5: Exercise = {
  id: 5,
  title: 'Baby to Babies',
  level: 1,
  levelName: 'Sound Detectives',
  targetMinutes: 10,
  concepts: ['plural-y-ies'],
  reviewConcepts: [],
  activities: [
    sort(
      'e5-1',
      'plural-y-ies',
      {
        'y became ies': ['babies', 'cherries', 'stories', 'puppies', 'cities', 'ladies'],
        'just added s': ['keys', 'monkeys', 'days', 'toys', 'valleys', 'boys'],
      },
      {
        prompt:
          'These all end in y when there is one of them. Look at the letter just before the y — what happened to each word?',
      },
    ),

    aud('e5-2', 'plural-y-ies', 'parties'),
    aud('e5-3', 'plural-y-ies', 'pennies'),
    aud('e5-4', 'plural-y-ies', 'donkeys'),
    aud('e5-5', 'plural-y-ies', 'families', { difficulty: 2 }),
    letters('e5-6', 'plural-y-ies', 'berries'),
    letters('e5-7', 'plural-y-ies', 'chimneys', { difficulty: 2 }),
    letters('e5-8', 'plural-y-ies', 'ponies'),

    mistake('e5-14', 'plural-y-ies', 'The butterflys landed on the flowers.', 'butterflys', 'butterflies'),
    mistake('e5-15', 'plural-y-ies', 'Two puppys were chasing the ball.', 'puppys', 'puppies'),
    mistake('e5-16', 'plural-y-ies', 'The monkies swung through the trees.', 'monkies', 'monkeys', {
      difficulty: 2,
    }),

    dictate('e5-17', 'plural-y-ies', 'The ladies carried the babies past the chimneys.', { difficulty: 3 }),
    memory('e5-18', 'plural-y-ies', 'countries', { difficulty: 2 }),

    novel(aud('e5-19', 'plural-y-ies', 'armies', { difficulty: 2 })),
    novel(aud('e5-20', 'plural-y-ies', 'turkeys', { difficulty: 2 })),
  ],
  ruleReveal: {
    title: 'Baby to Babies',
    text: 'Look at the letter just before the y. If it is a consonant, change the y to i and add "es". If it is a vowel, just add "s".',
    examples: ['baby → babies', 'cherry → cherries', 'key → keys', 'monkey → monkeys'],
  },
}
