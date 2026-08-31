import type { Exercise } from '../../spelling/types'
import { aud, cloze, letters, novel, sort } from '../build'

export const exercise33: Exercise = {
  id: 33,
  title: 'Soft C, Soft G',
  level: 5,
  levelName: 'Spelling Detectives',
  targetMinutes: 10,
  concepts: ['soft-c-g'],
  reviewConcepts: ['two-way-splitting', 'schwa', 'contractions'],
  activities: [
    sort(
      'e33-1',
      'soft-c-g',
      {
        'c says /s/': ['city', 'cycle', 'cent'],
        'c says /k/': ['cat', 'cup', 'cot'],
      },
      { prompt: 'Say each word. Then look at the letter straight after the c — notice anything?' },
    ),
    sort('e33-2', 'soft-c-g', {
      'g says /j/': ['giant', 'gym', 'gem'],
      'g says /g/': ['gate', 'goat', 'gum'],
    }),

    aud('e33-3', 'soft-c-g', 'circle'),
    aud('e33-4', 'soft-c-g', 'gentle'),
    aud('e33-5', 'soft-c-g', 'circus'),
    aud('e33-6', 'soft-c-g', 'ginger'),
    letters('e33-7', 'soft-c-g', 'centre', { difficulty: 2 }),

    cloze('e33-8', 'soft-c-g', 'We live near the middle of the ___.', 'city'),

    novel(aud('e33-9', 'soft-c-g', 'giraffe', { difficulty: 2 })),
    novel(aud('e33-10', 'soft-c-g', 'celery', { difficulty: 2 })),
  ],
  ruleReveal: {
    title: 'Soft C, Soft G',
    text: 'Before e, i or y, "c" usually says /s/ and "g" usually says /j/. Before a, o or u they keep their hard sounds. The letter that comes next is the clue.',
    examples: ['city, cycle, cent → /s/', 'cat, cup, cot → /k/', 'giant, gym, gem → /j/'],
  },
}
