import type { Exercise } from '../../spelling/types'
import { cloze, mistake, novel, sort } from '../build'

/**
 * Exercise 57 — the apostrophe that shows who something belongs to. One
 * owner only: plural owners are Year 5, and this pack stops at Year 4.
 */
export const exercise57: Exercise = {
  id: 57,
  title: 'Whose Is It?',
  level: 6,
  levelName: 'City Spellers',
  targetMinutes: 6,
  concepts: ['possessive-apostrophe'],
  reviewConcepts: ['contractions-more', 'plural-s-es', 'homophones-simple'],
  activities: [
    cloze('e57-1', 'possessive-apostrophe', 'The ___ bone was in the garden.', "dog's", {
      speakSentence: true,
      prompt: 'The bone belongs to the dog. Write "dog" so that it shows it.',
    }),
    cloze('e57-2', 'possessive-apostrophe', 'The ___ tail was fluffy.', "cat's", {
      speakSentence: true,
      prompt: 'The tail belongs to the cat. Write "cat" so that it shows it.',
    }),
    cloze('e57-3', 'possessive-apostrophe', '___ car is red.', "Mum's", {
      speakSentence: true,
      prompt: 'The car belongs to Mum. Write "Mum" so that it shows it.',
    }),
    cloze('e57-4', 'possessive-apostrophe', 'The ___ desk was tidy.', "teacher's", {
      speakSentence: true,
      prompt: 'The desk belongs to the teacher. Write "teacher" so that it shows it.',
    }),

    sort(
      'e57-5',
      'possessive-apostrophe',
      {
        'more than one (no apostrophe)': ['dogs', 'cats', 'girls'],
        'belongs to one': ["dog's", "cat's", "girl's"],
      },
      { prompt: 'Does the word mean "more than one", or "belonging to one"?' },
    ),

    mistake('e57-6', 'possessive-apostrophe', 'I found my sisters shoe.', 'sisters', "sister's"),
    mistake('e57-7', 'possessive-apostrophe', 'That is Toms book.', 'Toms', "Tom's"),

    novel(cloze('e57-8', 'possessive-apostrophe', 'My ___ bike has a bell.', "brother's", {
      speakSentence: true,
      prompt: 'The bike belongs to my brother. Write "brother" so that it shows it.',
      difficulty: 2,
    })),
  ],
  ruleReveal: {
    title: 'Whose Is It?',
    text: 'To show that something belongs to someone, add an apostrophe and an s straight after the owner. An s on its own just means more than one.',
    examples: ["the dog's bone", "Mum's car", "dogs → more than one, no apostrophe"],
  },
}
