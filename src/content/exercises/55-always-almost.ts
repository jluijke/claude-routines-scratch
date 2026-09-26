import type { Exercise } from '../../spelling/types'
import { aud, build, mistake, novel } from '../build'

/** Exercise 55 — "all" at the front drops an l. A Year 4 idea, gently. */
export const exercise55: Exercise = {
  id: 55,
  title: 'Always Almost',
  level: 6,
  levelName: 'City Spellers',
  targetMinutes: 6,
  concepts: ['al-words'],
  reviewConcepts: ['le-ending', 'compound-some-every', 'tricky-words'],
  activities: [
    build('e55-1', 'al-words', ['all', 'ways'], 'always', {
      prompt: 'When "all" joins the front of a word, one l drops off. What do these make?',
    }),
    build('e55-2', 'al-words', ['all', 'most'], 'almost'),
    build('e55-3', 'al-words', ['all', 'so'], 'also'),
    build('e55-4', 'al-words', ['all', 'ready'], 'already'),

    aud('e55-5', 'al-words', 'always'),
    aud('e55-6', 'al-words', 'almost'),
    aud('e55-7', 'al-words', 'also'),
    mistake('e55-8', 'al-words', 'It is allmost time for bed.', 'allmost', 'almost'),
    mistake('e55-9', 'al-words', 'I have allready eaten.', 'allready', 'already'),

    novel(build('e55-10', 'al-words', ['all', 'together'], 'altogether', { difficulty: 2 })),
  ],
  ruleReveal: {
    title: 'Always Almost',
    text: 'When "all" is joined to the front of another word, it drops one of its l\'s. So there is only one l in always, almost, also and already.',
    examples: ['all + ways → always', 'all + most → almost', 'all + ready → already'],
  },
}
