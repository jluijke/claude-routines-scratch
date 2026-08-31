/**
 * The concept registry.
 *
 * Every concept carries the level-3 hint text, the rival spellings used at
 * hint level 5, and a review pool. The pool does double duty: cumulative
 * review in later exercises (spec §12) and the remediation questions the
 * engine injects when a child gets the concept wrong (spec §2).
 *
 * A pool must be deep enough that a repeated mistake always draws a word the
 * child has not just seen — that is what makes "prove it independently" real.
 */
import type { Concept, ConceptId } from '../spelling/types'
import { aud, cloze, letters, mistake, pat, sort, syl } from './build'

const CONCEPT_LIST: Concept[] = [
  {
    id: 'syllables',
    label: 'Splitting words into beats',
    patternReminder: 'Clap the word. Each clap is a beat, and you spell one beat at a time.',
    introducedIn: 1,
    reviewPool: [
      syl('syl-r1', 'syllables', 'basket'),
      syl('syl-r2', 'syllables', 'jumper'),
      syl('syl-r3', 'syllables', 'picnic'),
      syl('syl-r4', 'syllables', 'magnet'),
      syl('syl-r5', 'syllables', 'tennis'),
      syl('syl-r6', 'syllables', 'garden'),
      syl('syl-r7', 'syllables', 'remember', { difficulty: 2 }),
      syl('syl-r8', 'syllables', 'important', { difficulty: 2 }),
      syl('syl-r9', 'syllables', 'yesterday', { difficulty: 2 }),
      syl('syl-r10', 'syllables', 'telescope', { difficulty: 3 }),
      aud('syl-r11', 'syllables', 'afternoon', { difficulty: 2 }),
      aud('syl-r12', 'syllables', 'lemonade', { difficulty: 2 }),
    ],
  },
  {
    id: 'ee-sound',
    label: 'The /ee/ sound',
    patternReminder:
      'The /ee/ sound has a few spellings. "ee" and "ea" usually sit inside a word, and "y" or "ey" usually come at the end.',
    alternatives: ['ee', 'ea', 'y', 'ey'],
    introducedIn: 2,
    reviewPool: [
      aud('ee-r1', 'ee-sound', 'sheep'),
      aud('ee-r2', 'ee-sound', 'dream'),
      aud('ee-r3', 'ee-sound', 'queen'),
      aud('ee-r4', 'ee-sound', 'treat'),
      aud('ee-r5', 'ee-sound', 'sunny'),
      aud('ee-r6', 'ee-sound', 'donkey'),
      pat('ee-r7', 'ee-sound', 'green', { choices: ['ee', 'ea'] }),
      pat('ee-r8', 'ee-sound', 'clean', { choices: ['ea', 'ee'] }),
      pat('ee-r9', 'ee-sound', 'twenty', { choices: ['y', 'ey'] }),
      letters('ee-r10', 'ee-sound', 'between', { difficulty: 2 }),
      letters('ee-r11', 'ee-sound', 'teacher', { difficulty: 2 }),
      cloze('ee-r12', 'ee-sound', 'We go swimming once a ___.', 'week', { difficulty: 2 }),
      aud('ee-r13', 'ee-sound', 'cheese'),
      aud('ee-r14', 'ee-sound', 'valley', { difficulty: 2 }),
    ],
  },
  {
    id: 'oa-sound',
    label: 'The /oa/ sound',
    patternReminder:
      'The /oa/ sound has several spellings. "oa" usually sits inside a word, while "ow", "oe" and o_e often come near the end.',
    alternatives: ['oa', 'ow', 'oe', 'o'],
    introducedIn: 3,
    reviewPool: [
      aud('oa-r1', 'oa-sound', 'goat'),
      aud('oa-r2', 'oa-sound', 'toast'),
      aud('oa-r3', 'oa-sound', 'yellow'),
      aud('oa-r4', 'oa-sound', 'elbow'),
      aud('oa-r5', 'oa-sound', 'stone'),
      aud('oa-r6', 'oa-sound', 'rope'),
      pat('oa-r7', 'oa-sound', 'road', { choices: ['oa', 'ow'] }),
      pat('oa-r8', 'oa-sound', 'snow', { choices: ['ow', 'oa'] }),
      letters('oa-r9', 'oa-sound', 'float', { difficulty: 2 }),
      letters('oa-r10', 'oa-sound', 'pillow', { difficulty: 2 }),
      aud('oa-r11', 'oa-sound', 'throat', { difficulty: 2 }),
      aud('oa-r12', 'oa-sound', 'tiptoe', { difficulty: 2 }),
      cloze('oa-r13', 'oa-sound', 'There is a ___ in my sock.', 'hole', { difficulty: 2 }),
      aud('oa-r14', 'oa-sound', 'smoke'),
    ],
  },
  {
    id: 'plural-s-es',
    label: 'Plurals with -s and -es',
    patternReminder:
      'Most words just add "s". If the word already ends in a hissing or buzzing sound — s, sh, ch, x or z — it needs "es".',
    alternatives: ['s', 'es'],
    introducedIn: 4,
    reviewPool: [
      aud('pl-r1', 'plural-s-es', 'foxes'),
      aud('pl-r2', 'plural-s-es', 'dishes'),
      aud('pl-r3', 'plural-s-es', 'benches'),
      aud('pl-r4', 'plural-s-es', 'glasses'),
      aud('pl-r5', 'plural-s-es', 'books'),
      aud('pl-r6', 'plural-s-es', 'chairs'),
      cloze('pl-r7', 'plural-s-es', 'We waited at the stop for two ___.', 'buses', { difficulty: 2 }),
      cloze('pl-r8', 'plural-s-es', 'There are three ___ on the shelf.', 'boxes', { difficulty: 2 }),
      sort('pl-r9', 'plural-s-es', { '+s': ['trees', 'hands'], '+es': ['wishes', 'matches'] }),
      mistake('pl-r10', 'plural-s-es', 'We washed all the dishs after dinner.', 'dishs', 'dishes', { difficulty: 2 }),
      aud('pl-r11', 'plural-s-es', 'churches', { difficulty: 2 }),
      aud('pl-r12', 'plural-s-es', 'taxes', { difficulty: 3 }),
    ],
  },
  {
    id: 'plural-y-ies',
    label: 'Words ending in y',
    patternReminder:
      'If a consonant comes before the "y", change the y to i and add "es". If a vowel comes before the y, just add "s".',
    alternatives: ['ies', 'ys'],
    introducedIn: 5,
    reviewPool: [
      aud('yi-r1', 'plural-y-ies', 'cherries'),
      aud('yi-r2', 'plural-y-ies', 'parties'),
      aud('yi-r3', 'plural-y-ies', 'ladies'),
      aud('yi-r4', 'plural-y-ies', 'puppies'),
      aud('yi-r5', 'plural-y-ies', 'keys'),
      aud('yi-r6', 'plural-y-ies', 'monkeys'),
      cloze('yi-r7', 'plural-y-ies', 'The two ___ were fast asleep.', 'babies', { difficulty: 2 }),
      cloze('yi-r8', 'plural-y-ies', 'We visited three different ___.', 'countries', { difficulty: 3 }),
      sort('yi-r9', 'plural-y-ies', { 'y becomes ies': ['stories', 'pennies'], 'just add s': ['days', 'toys'] }),
      mistake('yi-r10', 'plural-y-ies', 'The butterflys landed on the flowers.', 'butterflys', 'butterflies', {
        difficulty: 2,
      }),
      aud('yi-r11', 'plural-y-ies', 'armies', { difficulty: 2 }),
      aud('yi-r12', 'plural-y-ies', 'valleys', { difficulty: 2 }),
    ],
  },
]

export const CONCEPTS: ReadonlyMap<ConceptId, Concept> = new Map(
  CONCEPT_LIST.map((concept) => [concept.id, concept]),
)

export function conceptLabel(id: ConceptId): string {
  return CONCEPTS.get(id)?.label ?? id
}
