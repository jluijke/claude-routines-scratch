import type { Exercise } from '../../spelling/types'
import { aud, mistake, novel, pat, sort } from '../build'

/**
 * Exercise 15 — dge and ge. From here on most mastery questions require typing
 * rather than choosing (spec §10), so the choice buttons are used only while
 * the pattern is being discovered.
 */
export const exercise15: Exercise = {
  id: 15,
  title: 'Bridge or Huge?',
  level: 2,
  levelName: 'Pattern Hunters',
  targetMinutes: 10,
  concepts: ['dge-ge'],
  reviewConcepts: ['silent-letters', 'ly-suffix', 'ed-endings'],
  activities: [
    sort(
      'e15-1',
      'dge-ge',
      {
        dge: ['bridge', 'badge', 'edge', 'fudge'],
        ge: ['huge', 'stage', 'cage', 'large'],
      },
      { prompt: 'Every word ends with a /j/ sound. Say the vowel just before it — short, or long?' },
    ),

    pat('e15-2', 'dge-ge', 'judge', { choices: ['dge', 'ge'] }),
    pat('e15-3', 'dge-ge', 'change', { choices: ['ge', 'dge'] }),

    aud('e15-4', 'dge-ge', 'hedge'),
    aud('e15-5', 'dge-ge', 'page'),
    aud('e15-6', 'dge-ge', 'dodge'),
    aud('e15-7', 'dge-ge', 'cage'),

    mistake('e15-10', 'dge-ge', 'She sat on the eges of the step.', 'eges', 'edges'),

    novel(aud('e15-11', 'dge-ge', 'village', { difficulty: 2 })),
    novel(pat('e15-12', 'dge-ge', 'lodge', { difficulty: 2 })),
  ],
  ruleReveal: {
    title: 'Bridge or Huge?',
    text: 'At the end of a word, the /j/ sound is written "dge" straight after one short vowel, and "ge" everywhere else.',
    examples: ['badge, edge, bridge → dge', 'huge, stage, large → ge'],
  },
}
