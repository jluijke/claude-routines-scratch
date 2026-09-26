import type { Exercise } from '../../spelling/types'
import { aud, build, cloze, mistake, novel } from '../build'

/** Exercise 42 — more n't, and the one that breaks the rule. */
export const exercise42: Exercise = {
  id: 42,
  title: "Won't Is Weird",
  level: 6,
  levelName: 'City Spellers',
  targetMinutes: 6,
  concepts: ['contractions-not'],
  reviewConcepts: ['contractions-more', 'contractions', 'silent-letters'],
  activities: [
    build('e42-1', 'contractions-not', ['does', 'not'], "doesn't", {
      prompt: 'When "not" joins on, the o drops out. Put the apostrophe where it was.',
    }),
    build('e42-2', 'contractions-not', ['are', 'not'], "aren't"),
    build('e42-3', 'contractions-not', ['were', 'not'], "weren't"),
    build('e42-4', 'contractions-not', ['should', 'not'], "shouldn't"),
    build('e42-5', 'contractions-not', ['will', 'not'], "won't", {
      prompt: 'This one is weird. "Will not" does not become "willn\'t". What does it become?',
    }),

    aud('e42-6', 'contractions-not', "wasn't"),
    aud('e42-7', 'contractions-not', "hasn't"),
    cloze('e42-8', 'contractions-not', 'We ___ go outside until the rain stops.', "can't", {
      speakSentence: true,
      prompt: 'Write "can not" as one squashed word.',
    }),
    mistake('e42-9', 'contractions-not', "The shop is'nt open yet.", "is'nt", "isn't"),

    novel(aud('e42-10', 'contractions-not', "won't", { difficulty: 2 })),
    novel(build('e42-11', 'contractions-not', ['did', 'not'], "didn't", { difficulty: 2 })),
  ],
  ruleReveal: {
    title: "Won't Is Weird",
    text: 'When "not" is squashed onto a word, only the o falls out, so the apostrophe goes between the n and the t. "Will not" is the one odd word: it becomes won\'t.',
    examples: ["does not → doesn't", "were not → weren't", "should not → shouldn't", "will not → won't"],
  },
}
