import type { Exercise } from '../../spelling/types'
import { aud, build, mistake, novel, sort } from '../build'

export const exercise30: Exercise = {
  id: 30,
  title: 'Missing Letters',
  level: 4,
  levelName: 'Meaning Masters',
  targetMinutes: 10,
  concepts: ['contractions'],
  reviewConcepts: ['homophone-proofreading', 'apostrophe-pairs', 'homophones-more'],
  activities: [
    build('e30-1', 'contractions', ['could', 'not'], "couldn't", {
      prompt: 'Squash the two words together and drop a letter. The apostrophe goes exactly where the letter was.',
    }),
    build('e30-2', 'contractions', ['do', 'not'], "don't"),
    build('e30-3', 'contractions', ['I', 'will'], "I'll"),
    build('e30-4', 'contractions', ['they', 'are'], "they're"),
    build('e30-5', 'contractions', ['is', 'not'], "isn't"),
    build('e30-6', 'contractions', ['we', 'are'], "we're"),

    sort(
      'e30-7',
      'contractions',
      {
        'lost an o': ["don't", "isn't", "couldn't"],
        'lost more than one letter': ["I'll", "they're", "we're"],
      },
      { prompt: 'Which letters went missing from each one?' },
    ),

    aud('e30-8', 'contractions', "wouldn't"),
    mistake('e30-10', 'contractions', 'We could’nt hear the announcement.', 'could’nt', "couldn't"),

    novel(build('e30-11', 'contractions', ['can', 'not'], "can't", { difficulty: 2 })),
    novel(build('e30-12', 'contractions', ['have', 'not'], "haven't", { difficulty: 2 })),
  ],
  ruleReveal: {
    title: 'Missing Letters',
    text: 'An apostrophe shows exactly where letters have been left out — so it goes in the gap the missing letters left, not between the two words.',
    examples: ['could not → couldn’t', 'do not → don’t', 'I will → I’ll', 'they are → they’re'],
  },
}
