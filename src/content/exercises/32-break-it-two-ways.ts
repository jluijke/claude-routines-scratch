import type { Exercise } from '../../spelling/types'
import { aud, build, dictate, novel, syl } from '../build'

/**
 * Exercise 32 — the end of Level 4, and the exercise that names the strategy
 * the whole programme has been building: split by sound, split by meaning, use
 * both.
 */
export const exercise32: Exercise = {
  id: 32,
  title: 'Break It Two Ways',
  level: 4,
  levelName: 'Meaning Masters',
  targetMinutes: 10,
  concepts: ['two-way-splitting'],
  reviewConcepts: ['schwa', 'contractions', 'word-families'],
  activities: [
    syl('e32-1', 'two-way-splitting', 'unhelpfulness', {
      prompt: 'First split it into beats you can say.',
      difficulty: 2,
    }),
    build('e32-2', 'two-way-splitting', ['un', 'help', 'ful', 'ness'], 'unhelpfulness', {
      prompt: 'Now split the same word into its meaning parts instead.',
    }),

    syl('e32-3', 'two-way-splitting', 'disappointment', { difficulty: 3 }),
    build('e32-4', 'two-way-splitting', ['dis', 'appoint', 'ment'], 'disappointment'),

    syl('e32-5', 'two-way-splitting', 'interesting', { difficulty: 2 }),
    syl('e32-6', 'two-way-splitting', 'comfortable', { difficulty: 3 }),

    build('e32-7', 'two-way-splitting', ['un', 'fortunate', 'ly'], 'unfortunately', { difficulty: 2 }),

    aud('e32-8', 'two-way-splitting', 'independent', { difficulty: 3 }),

    novel(aud('e32-9', 'two-way-splitting', 'unbelievable', { difficulty: 3 })),
    novel(dictate('e32-10', 'two-way-splitting', 'Unfortunately the weather was extraordinary.', { difficulty: 3 })),
  ],
  ruleReveal: {
    title: 'Break It Two Ways',
    text: 'For a really hard word, split it twice: once into beats you can say, and once into meaning parts you recognise. Both splits give you spelling clues, and together they beat guessing.',
    examples: ['un / help / ful / ness (by sound)', 'un + help + ful + ness (by meaning)', 'dis + appoint + ment'],
  },
}
