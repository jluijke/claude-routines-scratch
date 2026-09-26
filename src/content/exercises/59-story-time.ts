import type { Exercise } from '../../spelling/types'
import { dictate, novel } from '../build'

/**
 * Exercise 59 — longer dictation, built out of the pack: squashed words,
 * joined words, and the vowel teams from the middle of it.
 */
export const exercise59: Exercise = {
  id: 59,
  title: 'Story Time',
  level: 6,
  levelName: 'City Spellers',
  targetMinutes: 6,
  concepts: ['dictation-story'],
  reviewConcepts: ['dictation-short', 'contractions-not', 'compound-weather'],
  activities: [
    dictate('e59-1', 'dictation-story', "It's raining, so we'll stay inside today.", {
      prompt: 'Listen to the whole sentence. Then write it in chunks of three or four words.',
      difficulty: 2,
    }),
    dictate('e59-2', 'dictation-story', 'Somebody left a raincoat on the playground.', { difficulty: 2 }),
    dictate('e59-3', 'dictation-story', 'The brown owl flew away into the night.', { difficulty: 2 }),

    novel(dictate('e59-4', 'dictation-story', "My friend said she doesn't like thunder.", { difficulty: 2 })),
  ],
  ruleReveal: {
    title: 'Story Time',
    text: 'A long sentence is easier in chunks. Say three or four words, write them, then say the next chunk. Listen for squashed words, because they need an apostrophe.',
    examples: ["It's raining / so we'll stay / inside today", 'Somebody left / a raincoat'],
  },
}
