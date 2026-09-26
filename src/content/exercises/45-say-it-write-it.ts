import type { Exercise } from '../../spelling/types'
import { dictate, novel } from '../build'

/**
 * Exercise 45 — short dictation. Only words he has already met, so the job
 * is holding a sentence in his head and writing it down one word at a time.
 */
export const exercise45: Exercise = {
  id: 45,
  title: 'Say It, Write It',
  level: 6,
  levelName: 'City Spellers',
  targetMinutes: 6,
  concepts: ['dictation-short'],
  reviewConcepts: ['compound-weather', 'contractions-more', 'ee-sound'],
  activities: [
    dictate('e45-1', 'dictation-short', 'The cat sat on my bed.', {
      prompt: 'Listen to the whole sentence, then write it. You can hear it again as many times as you like.',
    }),
    dictate('e45-2', 'dictation-short', 'We went to the park after school.'),
    dictate('e45-3', 'dictation-short', 'My friend has a green bike.'),
    dictate('e45-4', 'dictation-short', 'It was raining all day.'),

    novel(dictate('e45-5', 'dictation-short', "It's too cold for the sunshine today.", { difficulty: 2 })),
  ],
  ruleReveal: {
    title: 'Say It, Write It',
    text: 'Say the sentence back to yourself before you start. Then write one word at a time, saying each word slowly while you write it.',
    examples: ['listen', 'say it back', 'write one word at a time'],
  },
}
