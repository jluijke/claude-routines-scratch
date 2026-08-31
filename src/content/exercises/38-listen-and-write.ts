import type { Exercise } from '../../spelling/types'
import { dictate, novel } from '../build'

/**
 * Exercise 38 — whole-sentence dictation. Each sentence is loaded with
 * patterns from earlier exercises, so this is a cumulative test disguised as a
 * listening task. Spelling is what is assessed; capitals and full stops are not.
 */
export const exercise38: Exercise = {
  id: 38,
  title: 'Listen and Write',
  level: 5,
  levelName: 'Spelling Detectives',
  targetMinutes: 10,
  concepts: ['sentence-dictation'],
  reviewConcepts: ['proofreading', 'australian-spelling', 'schwa'],
  activities: [
    dictate('e38-1', 'sentence-dictation', 'The children were playing happily in the garden.', {
      prompt: 'Listen to the whole sentence, then write it down. Replay it as often as you like.',
      difficulty: 2,
    }),
    dictate('e38-3', 'sentence-dictation', 'My neighbour painted her fence a bright colour.', { difficulty: 3 }),
    dictate('e38-4', 'sentence-dictation', 'They knew their answers were completely different.', { difficulty: 3 }),

    novel(dictate('e38-5', 'sentence-dictation', 'Unfortunately the weather changed before lunch.', { difficulty: 3 })),
  ],
  ruleReveal: {
    title: 'Listen and Write',
    text: 'When a word is difficult, use several clues at once: say it, split it into beats, find its base word, and think about which spelling pattern it belongs to.',
    examples: ['happily → happy + ly, y becomes i', 'neighbour → Australian "our"', 'different → the lazy vowel'],
  },
}
