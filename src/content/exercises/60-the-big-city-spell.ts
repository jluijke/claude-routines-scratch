import type { Exercise } from '../../spelling/types'
import { aud, build, dictate, mistake, novel, proof } from '../build'

/**
 * Exercise 60 — the end of the second pack. Everything from 41 on, mixed,
 * with nothing saying which pattern a word belongs to.
 */
export const exercise60: Exercise = {
  id: 60,
  title: 'The Big City Spell',
  level: 6,
  levelName: 'City Spellers',
  targetMinutes: 6,
  concepts: ['city-mastery'],
  reviewConcepts: ['dictation-story', 'homophones-simple', 'possessive-apostrophe'],
  activities: [
    aud('e60-1', 'city-mastery', 'thunderstorm', {
      prompt: 'Nobody is going to tell you the pattern this time. Use every clue you have.',
      difficulty: 2,
    }),
    aud('e60-2', 'city-mastery', "shouldn't", { difficulty: 2 }),
    aud('e60-3', 'city-mastery', 'already', { difficulty: 2 }),
    build('e60-4', 'city-mastery', ['every', 'body'], 'everybody'),
    mistake('e60-5', 'city-mastery', 'The gerl saw a bird in the sky.', 'gerl', 'girl'),
    proof('e60-6', 'city-mastery', 'Evry nite the owl sits on a litle branch.', [
      ['Evry', 'Every'], ['nite', 'night'], ['litle', 'little'],
    ], { difficulty: 2 }),

    novel(aud('e60-7', 'city-mastery', 'elephant', { difficulty: 2 })),
    novel(dictate('e60-8', 'city-mastery', "They've already found the dog's ball.", { difficulty: 3 })),
  ],
  ruleReveal: {
    title: 'The Big City Spell',
    text: 'You know a lot of spelling now. When a word is hard, say it slowly, look for two small words inside it, check whether letters have been squashed out, and think about what it means.',
    examples: ['thunder + storm', "should not → shouldn't", 'every + body', "the dog's ball"],
  },
}
