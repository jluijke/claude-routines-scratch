import type { Exercise } from '../../spelling/types'
import { aud, letters, novel, pat, sort } from '../build'

/** Exercise 46 — the /ay/ sound, and where each spelling likes to sit. */
export const exercise46: Exercise = {
  id: 46,
  title: 'Rain Train',
  level: 6,
  levelName: 'City Spellers',
  targetMinutes: 6,
  concepts: ['ai-ay-sound'],
  reviewConcepts: ['oa-sound', 'ee-sound', 'dictation-short'],
  activities: [
    sort(
      'e46-1',
      'ai-ay-sound',
      {
        'ai in the middle': ['rain', 'paint', 'snail'],
        'ay at the end': ['play', 'stay', 'away'],
      },
      { prompt: 'All of these have the /ay/ sound. Where does each spelling sit?' },
    ),

    pat('e46-2', 'ai-ay-sound', 'train', { choices: ['ai', 'ay', 'a'] }),
    pat('e46-3', 'ai-ay-sound', 'tray', { choices: ['ai', 'ay', 'a'] }),
    pat('e46-4', 'ai-ay-sound', 'wait', { choices: ['ai', 'ay', 'a'] }),

    aud('e46-5', 'ai-ay-sound', 'rain'),
    aud('e46-6', 'ai-ay-sound', 'play'),
    letters('e46-7', 'ai-ay-sound', 'chain'),
    letters('e46-8', 'ai-ay-sound', 'Sunday'),

    novel(aud('e46-9', 'ai-ay-sound', 'trail', { difficulty: 2 })),
    novel(aud('e46-10', 'ai-ay-sound', 'crayon', { difficulty: 2 })),
  ],
  ruleReveal: {
    title: 'Rain Train',
    text: 'The /ay/ sound is often spelled "ai" or "ay". Use "ai" in the middle of a word, with another letter after it. Use "ay" right at the end.',
    examples: ['rain, paint → ai in the middle', 'day, play → ay at the end', 'crayon → ay, then more word'],
  },
}
