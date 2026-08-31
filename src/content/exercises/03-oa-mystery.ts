import type { Exercise } from '../../spelling/types'
import { aud, cloze, letters, novel, pat, sort } from '../build'

/**
 * Exercise 3 — the /oa/ sound, and the first exercise where some answers must
 * be typed rather than chosen (spec §10, the recall ramp).
 */
export const exercise3: Exercise = {
  id: 3,
  title: 'The /oa/ Mystery',
  level: 1,
  levelName: 'Sound Detectives',
  targetMinutes: 7,
  concepts: ['oa-sound'],
  reviewConcepts: [],
  activities: [
    sort(
      'e3-1',
      'oa-sound',
      {
        oa: ['boat', 'coat', 'road'],
        ow: ['snow', 'slow', 'yellow'],
        'o_e': ['home', 'bone', 'note'],
        oe: ['toe', 'goes'],
      },
      { prompt: 'Every word says /oa/. Sort them by how that sound is spelled.' },
    ),

    pat('e3-2', 'oa-sound', 'soap', { choices: ['oa', 'ow'] }),
    pat('e3-3', 'oa-sound', 'grow', { choices: ['ow', 'oa'] }),
    pat('e3-4', 'oa-sound', 'goat'),
    pat('e3-5', 'oa-sound', 'window', { difficulty: 2 }),

    aud('e3-6', 'oa-sound', 'toast'),
    aud('e3-7', 'oa-sound', 'rainbow'),
    aud('e3-8', 'oa-sound', 'stone'),
    aud('e3-9', 'oa-sound', 'coach', { difficulty: 2 }),
    letters('e3-10', 'oa-sound', 'float'),
    letters('e3-11', 'oa-sound', 'shadow', { difficulty: 2 }),
    cloze('e3-12', 'oa-sound', 'I put my ___ on before going outside.', 'coat'),

    novel(aud('e3-13', 'oa-sound', 'throat', { difficulty: 2 })),
    novel(aud('e3-14', 'oa-sound', 'tiptoe', { difficulty: 2 })),
  ],
  ruleReveal: {
    title: 'The /oa/ Mystery',
    text: 'The /oa/ sound has several spellings. "oa" usually sits inside a word, while "ow", "oe" and o_e like to come near the end.',
    examples: ['boat, road → oa', 'snow, yellow → ow', 'home, bone → o_e', 'toe, goes → oe'],
  },
}
