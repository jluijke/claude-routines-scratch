import type { Exercise } from '../../spelling/types'
import { aud, cloze, dictate, mistake, novel } from '../build'

export const exercise26: Exercise = {
  id: 26,
  title: 'To, Too or Two?',
  level: 4,
  levelName: 'Meaning Masters',
  targetMinutes: 10,
  concepts: ['homophones-to-too-two'],
  reviewConcepts: ['homophones-there', 'word-families', 'suffix-ness'],
  activities: [
    cloze('e26-1', 'homophones-to-too-two', 'I have ___ brothers.', 'two', {
      choices: ['to', 'too', 'two'],
      prompt: 'Three spellings, one sound. Which meaning does the sentence need?',
    }),
    cloze('e26-2', 'homophones-to-too-two', 'That bag is far ___ heavy.', 'too', {
      choices: ['to', 'too', 'two'],
    }),
    cloze('e26-3', 'homophones-to-too-two', 'We walked ___ the shop.', 'to', { choices: ['to', 'too', 'two'] }),

    mistake('e26-8', 'homophones-to-too-two', 'I have two much homework tonight.', 'two', 'too'),
    mistake('e26-9', 'homophones-to-too-two', 'We went too the park after school.', 'too', 'to'),

    aud('e26-10', 'homophones-to-too-two', 'too', { withSentence: true, difficulty: 2 }),
    novel(dictate('e26-11', 'homophones-to-too-two', 'The two of us went to the shop too.', { difficulty: 3 })),
  ],
  ruleReveal: {
    title: 'To, Too or Two?',
    text: '"two" is the number — it keeps the w from twin and twice. "too" means also or more than enough, and it has an extra o. "to" does every other job.',
    examples: ['two brothers (the number)', 'too heavy (more than enough)', 'come too (also)', 'to the shop'],
  },
}
