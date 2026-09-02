import type { Exercise } from '../../spelling/types'
import { aud, build, mistake, novel, sort } from '../build'

export const exercise20: Exercise = {
  id: 20,
  title: 'Full or Empty?',
  level: 3,
  levelName: 'Word Engineers',
  targetMinutes: 10,
  concepts: ['suffix-ful-less'],
  reviewConcepts: ['prefix-meaning', 'prefix-mis-dis-pre', 'ly-suffix'],
  activities: [
    sort(
      'e20-1',
      'suffix-ful-less',
      {
        'full of it': ['helpful', 'colourful', 'cheerful'],
        'without it': ['fearless', 'careless', 'endless'],
      },
      { prompt: 'Two endings, opposite meanings. Which is which?' },
    ),

    build('e20-2', 'suffix-ful-less', ['help', 'ful'], 'helpful'),
    build('e20-3', 'suffix-ful-less', ['fear', 'less'], 'fearless'),
    build('e20-4', 'suffix-ful-less', ['care', 'ful'], 'careful'),
    build('e20-5', 'suffix-ful-less', ['hope', 'less'], 'hopeless'),

    aud('e20-6', 'suffix-ful-less', 'useful'),
    aud('e20-7', 'suffix-ful-less', 'harmless'),
    aud('e20-8', 'suffix-ful-less', 'playful'),

    mistake('e20-10', 'suffix-ful-less', 'That was a very helpfull answer.', 'helpfull', 'helpful', {
      prompt: 'Look closely at the ending. How many l letters does it really need?',
    }),

    novel(aud('e20-11', 'suffix-ful-less', 'cheerful', { difficulty: 2 })),
    novel(build('e20-12', 'suffix-ful-less', ['end', 'less'], 'endless', { difficulty: 2 })),
  ],
  ruleReveal: {
    title: 'Full or Empty?',
    text: '"ful" means full of and "less" means without. Watch the ending: the suffix "ful" has only one l, even though the word "full" has two.',
    examples: ['help + ful → helpful', 'fear + less → fearless', 'colour + ful → colourful'],
  },
}
