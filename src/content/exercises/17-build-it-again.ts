import type { Exercise } from '../../spelling/types'
import { aud, build, cloze, mistake, novel, sort } from '../build'

export const exercise17: Exercise = {
  id: 17,
  title: 'Build It Again',
  level: 3,
  levelName: 'Word Engineers',
  targetMinutes: 10,
  concepts: ['prefix-re-un'],
  reviewConcepts: ['tch-ch', 'dge-ge', 'ly-suffix'],
  activities: [
    sort(
      'e17-1',
      'prefix-re-un',
      { 're- (again)': ['redo', 'rebuild', 'replay'], 'un- (not)': ['unhappy', 'unfair', 'unkind'] },
      { prompt: 'Each of these has a little word stuck on the front. What does each front piece do to the meaning?' },
    ),

    build('e17-2', 'prefix-re-un', ['re', 'do'], 'redo'),
    build('e17-3', 'prefix-re-un', ['re', 'read'], 'reread'),
    build('e17-4', 'prefix-re-un', ['un', 'happy'], 'unhappy'),
    build('e17-5', 'prefix-re-un', ['un', 'lock'], 'unlock'),

    aud('e17-6', 'prefix-re-un', 'refill'),
    aud('e17-7', 'prefix-re-un', 'unkind'),
    aud('e17-8', 'prefix-re-un', 'return'),

    cloze('e17-9', 'prefix-re-un', 'Please ___ the door before you go.', 'unlock'),
    mistake('e17-10', 'prefix-re-un', 'That decision was very unfare.', 'unfare', 'unfair'),

    novel(build('e17-11', 'prefix-re-un', ['un', 'tie'], 'untie', { difficulty: 2 })),
    novel(aud('e17-12', 'prefix-re-un', 'rebuild', { difficulty: 2 })),
  ],
  ruleReveal: {
    title: 'Build It Again',
    text: 'A prefix goes in front of a whole word without changing its spelling. "re-" usually means again, and "un-" usually means not.',
    examples: ['re + do → redo', 're + read → reread', 'un + happy → unhappy'],
  },
}
