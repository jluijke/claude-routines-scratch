import type { Exercise } from '../../spelling/types'
import { aud, letters, memory, mistake, novel } from '../build'

/**
 * Exercise 52 — the words that break the rules. No rule to learn here:
 * the whole trick is finding the one odd part and remembering only that.
 */
export const exercise52: Exercise = {
  id: 52,
  title: 'Tricky Words',
  level: 6,
  levelName: 'City Spellers',
  targetMinutes: 6,
  concepts: ['tricky-words'],
  reviewConcepts: ['c-k-ck', 'contractions-not', 'compound-some-every'],
  activities: [
    memory('e52-1', 'tricky-words', 'said', {
      prompt: 'Look hard at the word. Which part is tricky? Then it will disappear, and you write it.',
    }),
    memory('e52-2', 'tricky-words', 'friend'),
    letters('e52-3', 'tricky-words', 'because'),
    letters('e52-4', 'tricky-words', 'people'),

    aud('e52-5', 'tricky-words', 'again'),
    aud('e52-6', 'tricky-words', 'said'),
    aud('e52-7', 'tricky-words', 'many'),
    mistake('e52-8', 'tricky-words', 'We went to the beach becos it was hot.', 'becos', 'because'),

    novel(aud('e52-9', 'tricky-words', 'laugh', { difficulty: 2 })),
    novel(aud('e52-10', 'tricky-words', 'busy', { difficulty: 2 })),
  ],
  ruleReveal: {
    title: 'Tricky Words',
    text: 'Some everyday words do not follow the rules. Do not learn the whole word again: find the one tricky part and remember just that bit.',
    examples: ['s-AI-d', 'fr-IE-nd', 'bec-AU-se', 'p-EO-ple'],
  },
}
