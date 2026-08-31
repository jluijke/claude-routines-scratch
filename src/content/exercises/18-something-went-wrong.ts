import type { Exercise } from '../../spelling/types'
import { aud, build, cloze, mistake, novel, sort } from '../build'

/**
 * Exercise 18 — mis-, dis- and pre-. "misspell" earns its place here: the
 * double s is exactly what the rule predicts, and seeing that is the lesson.
 */
export const exercise18: Exercise = {
  id: 18,
  title: 'Something Went Wrong',
  level: 3,
  levelName: 'Word Engineers',
  targetMinutes: 10,
  concepts: ['prefix-mis-dis-pre'],
  reviewConcepts: ['prefix-re-un', 'tch-ch', 'silent-letters'],
  activities: [
    sort(
      'e18-1',
      'prefix-mis-dis-pre',
      {
        'mis- (wrongly)': ['mistake', 'misplace', 'misbehave'],
        'dis- (not, opposite)': ['dislike', 'disagree', 'disappear'],
        'pre- (before)': ['preview', 'preheat', 'preschool'],
      },
      { prompt: 'Three different front pieces. What does each one do to the word it sits on?' },
    ),

    build('e18-2', 'prefix-mis-dis-pre', ['dis', 'agree'], 'disagree'),
    build('e18-3', 'prefix-mis-dis-pre', ['mis', 'behave'], 'misbehave'),
    build('e18-4', 'prefix-mis-dis-pre', ['pre', 'view'], 'preview'),
    build('e18-5', 'prefix-mis-dis-pre', ['mis', 'spell'], 'misspell', {
      prompt: 'Careful with this one. Keep both pieces exactly as they are.',
      difficulty: 2,
    }),

    aud('e18-6', 'prefix-mis-dis-pre', 'dislike'),
    aud('e18-7', 'prefix-mis-dis-pre', 'preheat'),
    aud('e18-8', 'prefix-mis-dis-pre', 'mistake'),

    cloze('e18-9', 'prefix-mis-dis-pre', 'I ___ with almost everything he said.', 'disagree'),
    mistake('e18-10', 'prefix-mis-dis-pre', 'The rabbit began to disapear into the grass.', 'disapear', 'disappear'),

    novel(aud('e18-11', 'prefix-mis-dis-pre', 'disobey', { difficulty: 2 })),
    novel(aud('e18-12', 'prefix-mis-dis-pre', 'dishonest', { difficulty: 3 })),
  ],
  ruleReveal: {
    title: 'Something Went Wrong',
    text: 'Prefixes change a word’s meaning but leave the base word’s spelling alone — even when that leaves you with a double letter.',
    examples: ['mis + spell → misspell', 'dis + agree → disagree', 'pre + view → preview'],
  },
}
