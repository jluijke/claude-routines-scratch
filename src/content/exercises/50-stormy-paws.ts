import type { Exercise } from '../../spelling/types'
import { aud, letters, novel, pat, sort } from '../build'

/** Exercise 50 — the /or/ sound: or, ore and aw. */
export const exercise50: Exercise = {
  id: 50,
  title: 'Stormy Paws',
  level: 6,
  levelName: 'City Spellers',
  targetMinutes: 6,
  concepts: ['or-aw-sound'],
  reviewConcepts: ['er-ir-ur', 'igh-sound', 'compound-weather'],
  activities: [
    sort(
      'e50-1',
      'or-aw-sound',
      {
        'or in the middle': ['fork', 'storm', 'horse'],
        'ore at the end': ['more', 'shore', 'store'],
        aw: ['saw', 'paw', 'yawn'],
      },
      { prompt: 'All of these have the /or/ sound. Where does each spelling sit?' },
    ),

    pat('e50-2', 'or-aw-sound', 'short', { choices: ['or', 'aw', 'ore'] }),
    pat('e50-3', 'or-aw-sound', 'claw', { choices: ['or', 'aw', 'ore'] }),
    pat('e50-4', 'or-aw-sound', 'corn', { choices: ['or', 'aw', 'ore'] }),

    aud('e50-5', 'or-aw-sound', 'storm'),
    aud('e50-6', 'or-aw-sound', 'draw'),
    letters('e50-7', 'or-aw-sound', 'more'),
    letters('e50-8', 'or-aw-sound', 'crawl'),

    novel(aud('e50-9', 'or-aw-sound', 'before', { difficulty: 2 })),
    novel(aud('e50-10', 'or-aw-sound', 'straw', { difficulty: 2 })),
  ],
  ruleReveal: {
    title: 'Stormy Paws',
    text: '"or" sits in the middle of a word, and "ore" comes at the very end. "aw" comes at the end too, or just before an n or an l.',
    examples: ['fork, storm → or', 'more, shore → ore', 'saw, yawn, crawl → aw'],
  },
}
