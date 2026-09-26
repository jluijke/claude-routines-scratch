import type { Exercise } from '../../spelling/types'
import { aud, build, novel, sort, syl } from '../build'

/** Exercise 44 — compound words from the sky. */
export const exercise44: Exercise = {
  id: 44,
  title: 'Weather Words',
  level: 6,
  levelName: 'City Spellers',
  targetMinutes: 6,
  concepts: ['compound-weather'],
  reviewConcepts: ['compound-some-every', 'compound-words', 'oa-sound'],
  activities: [
    build('e44-1', 'compound-weather', ['sun', 'shine'], 'sunshine', {
      prompt: 'The weather is made of little words stuck together. What do these make?',
    }),
    build('e44-2', 'compound-weather', ['rain', 'coat'], 'raincoat'),
    build('e44-3', 'compound-weather', ['snow', 'flake'], 'snowflake'),
    build('e44-4', 'compound-weather', ['sun', 'set'], 'sunset'),

    sort(
      'e44-5',
      'compound-weather',
      {
        sun: ['sunshine', 'sunburn', 'sunset'],
        rain: ['raindrop', 'raincoat', 'rainfall'],
        snow: ['snowball', 'snowflake', 'snowman'],
      },
      { prompt: 'Sort them by the first small word.' },
    ),

    aud('e44-6', 'compound-weather', 'raindrop'),
    aud('e44-7', 'compound-weather', 'windmill'),
    syl('e44-8', 'compound-weather', 'thunderstorm', { difficulty: 2 }),

    novel(aud('e44-9', 'compound-weather', 'moonlight', { difficulty: 2 })),
    novel(aud('e44-10', 'compound-weather', 'daylight', { difficulty: 2 })),
  ],
  ruleReveal: {
    title: 'Weather Words',
    text: 'Lots of weather words are two words joined together. Say the word, find the two small words inside it, and spell each one the way you already know.',
    examples: ['sun + shine → sunshine', 'rain + drop → raindrop', 'thunder + storm → thunderstorm'],
  },
}
