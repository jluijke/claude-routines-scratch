import type { Exercise } from '../../spelling/types'
import { aud, build, cloze, novel, sort } from '../build'

/**
 * Exercise 35 — Greek and Latin roots, kept deliberately introductory. The aim
 * is the idea that word pieces carry meaning, not a vocabulary test.
 */
export const exercise35: Exercise = {
  id: 35,
  title: 'Ancient Word Pieces',
  level: 5,
  levelName: 'Spelling Detectives',
  targetMinutes: 10,
  concepts: ['word-roots'],
  reviewConcepts: ['tion-ending', 'soft-c-g', 'prefix-meaning'],
  activities: [
    sort(
      'e35-1',
      'word-roots',
      {
        'tele = far away': ['telephone', 'telescope', 'television'],
        'photo = light': ['photograph', 'photographer'],
        'micro = small': ['microscope', 'microphone'],
      },
      { prompt: 'These word pieces are thousands of years old. Sort them by the piece they share.' },
    ),

    build('e35-2', 'word-roots', ['geo', 'graphy'], 'geography'),
    build('e35-3', 'word-roots', ['bi', 'cycle'], 'bicycle'),
    build('e35-4', 'word-roots', ['auto', 'graph'], 'autograph'),

    aud('e35-5', 'word-roots', 'telescope'),
    aud('e35-6', 'word-roots', 'photograph'),
    aud('e35-7', 'word-roots', 'microphone', { difficulty: 2 }),

    cloze('e35-8', 'word-roots', 'We looked at the stars through a ___.', 'telescope'),

    novel(aud('e35-9', 'word-roots', 'transport', { difficulty: 2 })),
    novel(aud('e35-10', 'word-roots', 'aquarium', { difficulty: 3 })),
  ],
  ruleReveal: {
    title: 'Ancient Word Pieces',
    text: 'Some word pieces come from Greek and Latin, and they carry their meaning — and their spelling — wherever they go. "tele" means far, "photo" means light, "micro" means small.',
    examples: ['tele + scope → telescope', 'photo + graph → photograph', 'geo + graphy → geography'],
  },
}
