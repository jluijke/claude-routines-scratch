import type { Exercise } from '../../spelling/types'
import { aud, build, cloze, mistake, novel, sort } from '../build'

/**
 * Exercise 41 — the second pack opens where the first left contractions:
 * not "not", but is, will, have and are, which are the ones he writes most.
 */
export const exercise41: Exercise = {
  id: 41,
  title: 'Squashed Words',
  level: 6,
  levelName: 'City Spellers',
  targetMinutes: 6,
  concepts: ['contractions-more'],
  reviewConcepts: ['contractions', 'compound-words', 'homophones-there'],
  activities: [
    build('e41-1', 'contractions-more', ['it', 'is'], "it's", {
      prompt: 'Squash the two words into one. The apostrophe goes where the letter fell out.',
    }),
    build('e41-2', 'contractions-more', ['we', 'will'], "we'll"),
    build('e41-3', 'contractions-more', ['I', 'have'], "I've"),
    build('e41-4', 'contractions-more', ['you', 'are'], "you're"),
    build('e41-5', 'contractions-more', ['that', 'is'], "that's"),

    sort(
      'e41-6',
      'contractions-more',
      {
        'is': ["it's", "that's", "he's"],
        'will': ["we'll", "she'll", "you'll"],
        'have': ["I've", "they've", "we've"],
      },
      { prompt: 'Which word got squashed into each one?' },
    ),

    cloze('e41-7', 'contractions-more', '___ going to be sunny tomorrow.', "It's", {
      speakSentence: true,
      prompt: 'Write "it is" as one squashed word.',
    }),
    aud('e41-8', 'contractions-more', "she'll"),
    mistake('e41-9', 'contractions-more', "Theyve got a new puppy.", 'Theyve', "They've"),

    novel(build('e41-10', 'contractions-more', ['you', 'have'], "you've", { difficulty: 2 })),
    novel(aud('e41-11', 'contractions-more', "there's", { difficulty: 2 })),
  ],
  ruleReveal: {
    title: 'Squashed Words',
    text: 'When two words are squashed together, some letters fall out, and the apostrophe goes exactly where they were. It never goes in the gap between the two words.',
    examples: ["it is → it's", "we will → we'll", "they have → they've", "you are → you're"],
  },
}
