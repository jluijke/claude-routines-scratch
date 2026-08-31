import type { Exercise } from '../../spelling/types'
import { aud, build, cloze, mistake, novel, sort } from '../build'

/**
 * Exercise 12 — y turning into i. The contrast that matters is the vowel
 * before the y, exactly as in Exercise 5, but now for endings rather than
 * plurals. Old pattern, new job.
 */
export const exercise12: Exercise = {
  id: 12,
  title: 'Happy, Happier',
  level: 2,
  levelName: 'Pattern Hunters',
  targetMinutes: 10,
  concepts: ['y-to-i'],
  reviewConcepts: ['er-est', 'plural-sounds', 'plural-y-ies'],
  activities: [
    sort(
      'e12-1',
      'y-to-i',
      {
        'y became i': ['happier', 'funniest', 'luckier'],
        'no y to change': ['taller', 'quickest', 'slower'],
      },
      { prompt: 'Each one added er or est. Which base words had to change a letter first?' },
    ),

    build('e12-2', 'y-to-i', ['happy', '+er'], 'happier'),
    build('e12-3', 'y-to-i', ['funny', '+est'], 'funniest'),
    build('e12-4', 'y-to-i', ['lucky', '+est'], 'luckiest'),
    build('e12-5', 'y-to-i', ['heavy', '+er'], 'heavier'),

    aud('e12-6', 'y-to-i', 'tidiest'),
    aud('e12-7', 'y-to-i', 'earlier'),
    aud('e12-8', 'y-to-i', 'happiest'),

    cloze('e12-9', 'y-to-i', 'This bag is much ___ than mine.', 'heavier'),
    mistake('e12-10', 'y-to-i', 'That was the funnyest joke all day.', 'funnyest', 'funniest'),

    novel(build('e12-11', 'y-to-i', ['noisy', '+er'], 'noisier', { difficulty: 2 })),
    novel(aud('e12-12', 'y-to-i', 'tidier', { difficulty: 2 })),
  ],
  ruleReveal: {
    title: 'Happy, Happier',
    text: 'When a word ends in a consonant and "y", change the y to i before adding an ending. It is the same change you made turning baby into babies.',
    examples: ['happy → happier → happiest', 'funny → funnier → funniest', 'lucky → luckiest'],
  },
}
