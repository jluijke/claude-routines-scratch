import type { Exercise } from '../../spelling/types'
import { aud, cloze, dictate, mistake, novel } from '../build'

/**
 * Exercise 25 — the first homophone set, and the first time sound alone is
 * useless. Choices are offered while the pattern is being learned and then
 * withdrawn: by the end the child types the word from meaning alone (spec §9).
 */
export const exercise25: Exercise = {
  id: 25,
  title: 'There, Their or They’re?',
  level: 4,
  levelName: 'Meaning Masters',
  targetMinutes: 10,
  concepts: ['homophones-there'],
  reviewConcepts: ['word-families', 'suffix-ous', 'suffix-ment'],
  activities: [
    cloze('e25-1', 'homophones-there', 'Put your bag over ___.', 'there', {
      choices: ['there', 'their', "they're"],
      prompt: 'All three sound exactly the same. Read what the sentence means, then choose.',
    }),
    cloze('e25-2', 'homophones-there', 'The children lost ___ ball.', 'their', {
      choices: ['there', 'their', "they're"],
    }),
    // Now without the choices — the same job, from meaning alone.
    cloze('e25-4', 'homophones-there', 'Is ___ any milk left?', 'there'),
    cloze('e25-5', 'homophones-there', 'I like ___ new house.', 'their'),
    cloze('e25-6', 'homophones-there', '___ going to be late again.', "They're"),

    mistake('e25-7', 'homophones-there', 'Their going to the beach today.', 'Their', "They're"),
    mistake('e25-8', 'homophones-there', 'The dogs ate they’re dinner.', 'they’re', 'their'),

    aud('e25-9', 'homophones-there', 'their', { withSentence: true, difficulty: 2 }),
    dictate('e25-10', 'homophones-there', 'They left their coats over there.', { difficulty: 3 }),

    novel(dictate('e25-11', 'homophones-there', "They're waiting by their car over there.", { difficulty: 3 })),
  ],
  ruleReveal: {
    title: 'There, Their or They’re?',
    text: 'Some words sound the same but are spelled differently because they mean different things. "there" is a place — it has "here" inside it. "their" belongs to them. "they’re" is short for "they are".',
    examples: ['over there (a place)', 'their ball (belongs to them)', "they're playing (they are)"],
  },
}
