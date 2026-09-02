import type { Exercise } from '../../spelling/types'
import { aud, cloze, dictate, mistake, novel } from '../build'

export const exercise28: Exercise = {
  id: 28,
  title: 'Hear It Here',
  level: 4,
  levelName: 'Meaning Masters',
  targetMinutes: 10,
  concepts: ['homophones-more'],
  reviewConcepts: ['apostrophe-pairs', 'homophones-to-too-two', 'homophones-there'],
  activities: [
    cloze('e28-1', 'homophones-more', 'Can you ___ the music?', 'hear', {
      choices: ['hear', 'here'],
      prompt: 'Same sound, different meaning. "hear" has "ear" in it — that may help.',
    }),
    cloze('e28-2', 'homophones-more', 'Come and sit ___ with me.', 'here', { choices: ['hear', 'here'] }),
    cloze('e28-3', 'homophones-more', 'Our team ___ the final.', 'won', { choices: ['one', 'won'] }),

    mistake('e28-9', 'homophones-more', 'Can you here the music?', 'here', 'hear'),
    mistake('e28-10', 'homophones-more', 'I one the race by miles.', 'one', 'won'),

    aud('e28-11', 'homophones-more', 'piece', { withSentence: true, difficulty: 2 }),
    novel(dictate('e28-12', 'homophones-more', 'She knew she had won a new bike.', { difficulty: 3 })),
  ],
  ruleReveal: {
    title: 'Hear It Here',
    text: 'When two words sound the same, your ears cannot choose between them. Use the meaning of the sentence instead — and look for a clue hiding inside the word.',
    examples: ['hear has "ear" in it', 'piece of cake', 'write a letter / turn right', 'won the race / one more'],
  },
}
