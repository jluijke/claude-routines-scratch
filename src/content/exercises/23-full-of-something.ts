import type { Exercise } from '../../spelling/types'
import { aud, cloze, letters, mistake, novel, pat, sort } from '../build'

export const exercise23: Exercise = {
  id: 23,
  title: 'Full of Something',
  level: 3,
  levelName: 'Word Engineers',
  targetMinutes: 10,
  concepts: ['suffix-ous'],
  reviewConcepts: ['suffix-ment', 'suffix-ness', 'prefix-mis-dis-pre'],
  activities: [
    sort(
      'e23-1',
      'suffix-ous',
      {
        'describes a danger': ['dangerous', 'poisonous'],
        'describes a feeling': ['nervous', 'jealous', 'joyous'],
        'describes a person': ['famous', 'courageous'],
      },
      { prompt: 'These all end in the same sound. What is that ending doing to each word?' },
    ),

    pat('e23-2', 'suffix-ous', 'famous', { choices: ['ous', 'us'] }),
    pat('e23-3', 'suffix-ous', 'nervous', { choices: ['ous', 'us'] }),

    letters('e23-4', 'suffix-ous', 'jealous', { difficulty: 2 }),
    aud('e23-5', 'suffix-ous', 'joyous'),
    aud('e23-6', 'suffix-ous', 'serious'),
    aud('e23-7', 'suffix-ous', 'poisonous', { difficulty: 2 }),

    cloze('e23-8', 'suffix-ous', 'That cliff edge looks ___.', 'dangerous'),
    mistake('e23-9', 'suffix-ous', 'The snake was very dangerus.', 'dangerus', 'dangerous'),

    novel(aud('e23-10', 'suffix-ous', 'humorous', { difficulty: 3 })),
    novel(aud('e23-11', 'suffix-ous', 'courageous', { difficulty: 3 })),
  ],
  ruleReveal: {
    title: 'Full of Something',
    text: '"ous" makes a describing word. It always ends "ous", never "us", however much your ears tell you otherwise.',
    examples: ['danger → dangerous', 'fame → famous', 'poison → poisonous'],
  },
}
