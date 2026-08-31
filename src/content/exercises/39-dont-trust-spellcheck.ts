import type { Exercise } from '../../spelling/types'
import { mistake, novel, proof } from '../build'

/**
 * Exercise 39 — every word on screen is a real word, so a spellchecker would
 * pass the lot. The point is that a green tick is not the same as being right.
 */
export const exercise39: Exercise = {
  id: 39,
  title: 'Don’t Trust Spellcheck',
  level: 5,
  levelName: 'Spelling Detectives',
  targetMinutes: 10,
  concepts: ['spellcheck-limits'],
  reviewConcepts: ['sentence-dictation', 'proofreading', 'homophones-more'],
  activities: [
    mistake('e39-1', 'spellcheck-limits', 'Their going to school early.', 'Their', "They're", {
      prompt: 'Every word here exists, so a computer would say this sentence is fine. It is not.',
    }),
    mistake('e39-2', 'spellcheck-limits', 'I have two much homework.', 'two', 'too'),

    proof('e39-6', 'spellcheck-limits', 'Your write about there new bike.', [
      ['Your', "You're"],
      ['write', 'right'],
      ['there', 'their'],
    ], { difficulty: 3 }),

    novel(
      proof('e39-7', 'spellcheck-limits', 'Its to late to by any flours.', [
        ['Its', "It's"],
        ['to', 'too'],
        ['by', 'buy'],
        ['flours', 'flowers'],
      ], { difficulty: 3 }),
    ),
  ],
  ruleReveal: {
    title: 'Don’t Trust Spellcheck',
    text: 'A spellchecker can tell you whether a word exists. It cannot tell you whether you picked the right one. That part is still your job.',
    examples: ['Their going → They’re going', 'two much → too much', 'can you here → can you hear'],
  },
}
