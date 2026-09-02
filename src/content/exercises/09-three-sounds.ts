import type { Exercise } from '../../spelling/types'
import { aud, build, mistake, novel, sort } from '../build'

/**
 * Exercise 9 — the -ed ending. The whole lesson is that the sound changes but
 * the spelling does not, so the sort comes first and names the three sounds.
 */
export const exercise9: Exercise = {
  id: 9,
  title: 'Three Sounds, One Ending',
  level: 2,
  levelName: 'Pattern Hunters',
  targetMinutes: 10,
  concepts: ['ed-endings'],
  reviewConcepts: ['drop-silent-e', 'consonant-doubling', 'compound-words'],
  activities: [
    sort(
      'e9-1',
      'ed-endings',
      {
        'sounds like /t/': ['jumped', 'walked', 'kicked'],
        'sounds like /d/': ['played', 'cleaned', 'landed'],
        'adds a whole beat': ['wanted', 'shouted', 'pointed'],
      },
      { prompt: 'Say each word out loud. Listen to how the ending sounds — then look at how it is spelled.' },
    ),

    build('e9-2', 'ed-endings', ['jump', '+ed'], 'jumped'),
    build('e9-3', 'ed-endings', ['want', '+ed'], 'wanted'),
    build('e9-4', 'ed-endings', ['paint', '+ed'], 'painted'),

    aud('e9-5', 'ed-endings', 'walked'),
    aud('e9-6', 'ed-endings', 'shouted'),
    aud('e9-7', 'ed-endings', 'cleaned'),

    mistake('e9-9', 'ed-endings', 'She jumpt over the puddle.', 'jumpt', 'jumped'),

    novel(aud('e9-10', 'ed-endings', 'helped', { difficulty: 2 })),
    novel(build('e9-11', 'ed-endings', ['land', '+ed'], 'landed', { difficulty: 2 })),
  ],
  ruleReveal: {
    title: 'Three Sounds, One Ending',
    text: 'Past-tense words nearly always end in "ed", even though that ending can sound like /t/, like /d/, or add a whole extra beat. Trust the spelling, not your ears.',
    examples: ['jump → jumped (/t/)', 'play → played (/d/)', 'want → wanted (extra beat)'],
  },
}
