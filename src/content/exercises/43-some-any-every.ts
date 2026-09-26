import type { Exercise } from '../../spelling/types'
import { aud, build, mistake, novel, sort } from '../build'

/** Exercise 43 — the compound words he writes every single day. */
export const exercise43: Exercise = {
  id: 43,
  title: 'Some, Any, Every',
  level: 6,
  levelName: 'City Spellers',
  targetMinutes: 6,
  concepts: ['compound-some-every'],
  reviewConcepts: ['compound-words', 'contractions-more', 'contractions-not'],
  activities: [
    build('e43-1', 'compound-some-every', ['some', 'thing'], 'something', {
      prompt: 'Two small words join into one. Nothing changes where they meet.',
    }),
    build('e43-2', 'compound-some-every', ['every', 'where'], 'everywhere'),
    build('e43-3', 'compound-some-every', ['no', 'body'], 'nobody'),
    build('e43-4', 'compound-some-every', ['any', 'one'], 'anyone'),

    sort(
      'e43-5',
      'compound-some-every',
      {
        'a place': ['somewhere', 'everywhere', 'nowhere'],
        'a person': ['someone', 'everybody', 'nobody'],
        'a thing': ['something', 'anything', 'nothing'],
      },
      { prompt: 'Look at the second small word. Is it a place, a person or a thing?' },
    ),

    aud('e43-6', 'compound-some-every', 'sometimes'),
    aud('e43-7', 'compound-some-every', 'everything'),
    mistake('e43-8', 'compound-some-every', 'I looked every where for my hat.', 'every where', 'everywhere'),

    novel(aud('e43-9', 'compound-some-every', 'anywhere', { difficulty: 2 })),
    novel(aud('e43-10', 'compound-some-every', 'somebody', { difficulty: 2 })),
  ],
  ruleReveal: {
    title: 'Some, Any, Every',
    text: 'Some, any, every and no join onto thing, one, body and where to make one word. Spell the first small word, then the second, and write them with no gap.',
    examples: ['some + thing → something', 'every + where → everywhere', 'no + body → nobody'],
  },
}
