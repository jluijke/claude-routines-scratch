import type { Exercise } from '../../spelling/types'
import { aud, letters, novel, pat, sort } from '../build'

/** Exercise 49 — er, ir and ur, which his ears cannot tell apart. */
export const exercise49: Exercise = {
  id: 49,
  title: 'Bossy R',
  level: 6,
  levelName: 'City Spellers',
  targetMinutes: 6,
  concepts: ['er-ir-ur'],
  reviewConcepts: ['ou-ow-sound', 'ai-ay-sound', 'dictation-short'],
  activities: [
    sort(
      'e49-1',
      'er-ir-ur',
      {
        er: ['her', 'fern', 'herd'],
        ir: ['bird', 'girl', 'first'],
        ur: ['turn', 'burn', 'nurse'],
      },
      { prompt: 'Every one of these makes the same sound. Sort them by how it is spelled.' },
    ),

    pat('e49-2', 'er-ir-ur', 'shirt', { choices: ['er', 'ir', 'ur'] }),
    pat('e49-3', 'er-ir-ur', 'church', { choices: ['er', 'ir', 'ur'] }),
    pat('e49-4', 'er-ir-ur', 'her', { choices: ['er', 'ir', 'ur'] }),

    aud('e49-5', 'er-ir-ur', 'bird'),
    aud('e49-6', 'er-ir-ur', 'turn'),
    letters('e49-7', 'er-ir-ur', 'first'),
    letters('e49-8', 'er-ir-ur', 'purple'),

    novel(aud('e49-9', 'er-ir-ur', 'thirsty', { difficulty: 2 })),
    novel(aud('e49-10', 'er-ir-ur', 'Thursday', { difficulty: 2 })),
  ],
  ruleReveal: {
    title: 'Bossy R',
    text: 'The r bosses the vowel in front of it, and er, ir and ur all make the same sound. Your ears cannot choose, so picture the word: girl and bird have ir, turn and nurse have ur.',
    examples: ['her, fern → er', 'bird, girl → ir', 'turn, nurse → ur'],
  },
}
