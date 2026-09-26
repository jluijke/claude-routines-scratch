import type { Exercise } from '../../spelling/types'
import { aud, cloze, mistake, novel } from '../build'

/**
 * Exercise 56 — everyday homophones. Typed, never a pick of two: the prompt
 * says what the word means, and that is the only thing that tells a pair
 * of them apart.
 */
export const exercise56: Exercise = {
  id: 56,
  title: 'Sea or See',
  level: 6,
  levelName: 'City Spellers',
  targetMinutes: 6,
  concepts: ['homophones-simple'],
  reviewConcepts: ['homophones-more', 'al-words', 'igh-sound'],
  activities: [
    cloze('e56-1', 'homophones-simple', 'We had ___ pies for lunch.', 'meat', {
      speakSentence: true,
      prompt: 'Write the word that means "food from an animal". It has "eat" in it.',
    }),
    cloze('e56-2', 'homophones-simple', 'Come and ___ my new puppy.', 'meet', {
      speakSentence: true,
      prompt: 'Write the word that means "say hello to for the first time".',
    }),
    cloze('e56-3', 'homophones-simple', 'The postman brought the ___.', 'mail', {
      speakSentence: true,
      prompt: 'Write the word that means "letters and parcels".',
    }),
    cloze('e56-4', 'homophones-simple', 'The ___ rode a white horse.', 'knight', {
      speakSentence: true,
      prompt: 'Write the word that means "a soldier in armour". It starts with a silent letter.',
    }),
    cloze('e56-5', 'homophones-simple', 'Grandpa told us a ___ about a dragon.', 'tale', {
      speakSentence: true,
      prompt: 'Write the word that means "a story".',
    }),

    mistake('e56-6', 'homophones-simple', 'The dog wagged its tale.', 'tale', 'tail'),
    mistake('e56-7', 'homophones-simple', 'I bought a pear of socks.', 'pear', 'pair'),
    aud('e56-8', 'homophones-simple', 'night', { withSentence: true }),

    novel(aud('e56-9', 'homophones-simple', 'son', { withSentence: true, difficulty: 2 })),
    novel(aud('e56-10', 'homophones-simple', 'bee', { withSentence: true, difficulty: 2 })),
  ],
  ruleReveal: {
    title: 'Sea or See',
    text: 'Some words sound exactly the same but mean different things. Listening will not help, so think about the meaning, and look for a clue inside the word.',
    examples: ['MEAT is food you EAT', 'a pair of shoes, a pear to eat', 'a dog\'s tail, a tale to tell'],
  },
}
