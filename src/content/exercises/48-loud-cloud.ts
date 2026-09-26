import type { Exercise } from '../../spelling/types'
import { aud, letters, novel, pat, sort } from '../build'

/** Exercise 48 — the /ow/ sound: ou in the middle, ow at the end. */
export const exercise48: Exercise = {
  id: 48,
  title: 'Loud Cloud',
  level: 6,
  levelName: 'City Spellers',
  targetMinutes: 6,
  concepts: ['ou-ow-sound'],
  reviewConcepts: ['igh-sound', 'oa-sound', 'compound-some-every'],
  activities: [
    sort(
      'e48-1',
      'ou-ow-sound',
      {
        'ou in the middle': ['cloud', 'shout', 'round'],
        ow: ['cow', 'town', 'brown'],
      },
      { prompt: 'Both spellings make the /ow/ sound, as in "ouch". Where does each one sit?' },
    ),

    pat('e48-2', 'ou-ow-sound', 'loud', { choices: ['ou', 'ow', 'o'] }),
    pat('e48-3', 'ou-ow-sound', 'down', { choices: ['ou', 'ow', 'o'] }),
    pat('e48-4', 'ou-ow-sound', 'ground', { choices: ['ou', 'ow', 'o'] }),

    aud('e48-5', 'ou-ow-sound', 'cloud'),
    aud('e48-6', 'ou-ow-sound', 'crowd'),
    letters('e48-7', 'ou-ow-sound', 'mouth'),
    letters('e48-8', 'ou-ow-sound', 'owl'),

    novel(aud('e48-9', 'ou-ow-sound', 'mountain', { difficulty: 2 })),
    novel(aud('e48-10', 'ou-ow-sound', 'towel', { difficulty: 2 })),
  ],
  ruleReveal: {
    title: 'Loud Cloud',
    text: '"ou" usually sits in the middle of a word, with more letters after it. "ow" comes at the end of a word, or just before an n or an l.',
    examples: ['cloud, shout → ou in the middle', 'cow → ow at the end', 'town, owl → ow before n or l'],
  },
}
