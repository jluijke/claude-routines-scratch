import type { Exercise } from '../../spelling/types'
import { build, cloze, dictate, mistake, novel } from '../build'

/**
 * Exercise 27 — the pairs where an apostrophe is the whole difference. Taught
 * by building the contraction first, so the child sees the apostrophe standing
 * in for real missing letters rather than as decoration.
 */
export const exercise27: Exercise = {
  id: 27,
  title: 'Your or You’re? Its or It’s?',
  level: 4,
  levelName: 'Meaning Masters',
  targetMinutes: 10,
  concepts: ['apostrophe-pairs'],
  reviewConcepts: ['homophones-to-too-two', 'homophones-there', 'suffix-ful-less'],
  activities: [
    build('e27-1', 'apostrophe-pairs', ['you', 'are'], "you're", {
      prompt: 'Squash these two words together. Put the apostrophe exactly where the missing letter was.',
    }),
    build('e27-2', 'apostrophe-pairs', ['it', 'is'], "it's"),

    cloze('e27-3', 'apostrophe-pairs', 'Is this ___ jumper?', 'your', { choices: ['your', "you're"] }),
    cloze('e27-4', 'apostrophe-pairs', '___ going to enjoy this.', "You're", { choices: ['Your', "You're"] }),
    cloze('e27-5', 'apostrophe-pairs', 'The dog wagged ___ tail.', 'its', { choices: ['its', "it's"] }),

    cloze('e27-6', 'apostrophe-pairs', '___ raining again.', "It's"),
    cloze('e27-7', 'apostrophe-pairs', 'I think ___ right about that.', "you're"),
    cloze('e27-8', 'apostrophe-pairs', 'The bird built ___ nest in the gutter.', 'its'),

    mistake('e27-9', 'apostrophe-pairs', 'Your going to be late.', 'Your', "You're"),
    mistake('e27-10', 'apostrophe-pairs', 'The cat licked it’s paw.', 'it’s', 'its'),

    novel(dictate('e27-11', 'apostrophe-pairs', "You're sure it's your turn?", { difficulty: 3 })),
  ],
  ruleReveal: {
    title: 'Your or You’re? Its or It’s?',
    text: 'An apostrophe stands in for missing letters. "you’re" is "you are" and "it’s" is "it is". Without the apostrophe, the word shows that something belongs to someone.',
    examples: ["you are → you're", "it is → it's", 'your jumper (belongs to you)', 'its tail (belongs to it)'],
  },
}
