import type { Exercise } from '../../spelling/types'
import { aud, build, cloze, mistake, novel, syl } from '../build'

export const exercise34: Exercise = {
  id: 34,
  title: 'The /shun/ Ending',
  level: 5,
  levelName: 'Spelling Detectives',
  targetMinutes: 10,
  concepts: ['tion-ending'],
  reviewConcepts: ['soft-c-g', 'two-way-splitting', 'suffix-ment'],
  activities: [
    build('e34-1', 'tion-ending', ['act', 'ion'], 'action', {
      prompt: 'Add the /shun/ ending. Keep the base word exactly as it is.',
    }),
    build('e34-2', 'tion-ending', ['collect', 'ion'], 'collection'),
    build('e34-3', 'tion-ending', ['invent', 'ion'], 'invention'),
    build('e34-4', 'tion-ending', ['direct', 'ion'], 'direction'),

    aud('e34-5', 'tion-ending', 'station'),
    aud('e34-6', 'tion-ending', 'question'),
    aud('e34-7', 'tion-ending', 'attention'),
    aud('e34-8', 'tion-ending', 'fraction'),

    syl('e34-9', 'tion-ending', 'celebration', { difficulty: 3 }),
    cloze('e34-10', 'tion-ending', 'We waited at the train ___.', 'station'),
    mistake('e34-11', 'tion-ending', 'Pay attenshun to the instructions.', 'attenshun', 'attention'),

    novel(aud('e34-12', 'tion-ending', 'imagination', { difficulty: 3 })),
  ],
  ruleReveal: {
    title: 'The /shun/ Ending',
    text: 'The ending that sounds like "shun" is nearly always written "tion". Find the base word first, then add it on.',
    examples: ['act → action', 'collect → collection', 'invent → invention'],
  },
}
