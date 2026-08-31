import type { Exercise } from '../../spelling/types'
import { aud, cloze, mistake, novel, pat, sort } from '../build'

/**
 * Exercise 16 — tch and ch, the same short-vowel logic as dge and ge, taught
 * straight after it so the child can see one idea behind two patterns.
 */
export const exercise16: Exercise = {
  id: 16,
  title: 'Catch the T',
  level: 2,
  levelName: 'Pattern Hunters',
  targetMinutes: 10,
  concepts: ['tch-ch'],
  reviewConcepts: ['dge-ge', 'silent-letters', 'y-to-i'],
  activities: [
    sort(
      'e16-1',
      'tch-ch',
      {
        tch: ['catch', 'pitch', 'match', 'witch'],
        ch: ['much', 'beach', 'such', 'teach'],
      },
      { prompt: 'Every word ends with a /ch/ sound. Listen again to the vowel just before it.' },
    ),

    pat('e16-2', 'tch-ch', 'scratch', { choices: ['tch', 'ch'] }),
    pat('e16-3', 'tch-ch', 'lunch', { choices: ['ch', 'tch'] }),

    aud('e16-4', 'tch-ch', 'stitch'),
    aud('e16-5', 'tch-ch', 'bench'),
    aud('e16-6', 'tch-ch', 'rich'),
    aud('e16-7', 'tch-ch', 'sketch'),

    cloze('e16-8', 'tch-ch', 'Can you ___ the ball?', 'catch'),
    cloze('e16-9', 'tch-ch', 'We built a sandcastle on the ___.', 'beach'),
    mistake('e16-10', 'tch-ch', 'That was a close mach.', 'mach', 'match'),

    novel(aud('e16-11', 'tch-ch', 'teach')),
    novel(pat('e16-12', 'tch-ch', 'witch', { difficulty: 2 })),
  ],
  ruleReveal: {
    title: 'Catch the T',
    text: 'At the end of a short word, the /ch/ sound is written "tch" straight after one short vowel, and "ch" everywhere else. Same idea as dge and ge.',
    examples: ['catch, pitch, match → tch', 'much, beach, teach → ch'],
  },
}
