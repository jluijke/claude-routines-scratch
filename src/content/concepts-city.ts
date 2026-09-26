/**
 * The concepts of the second spelling pack, exercises 41 to 60.
 *
 * Year 3 mostly, with a few Year 4 ideas where they belong (the owning
 * apostrophe, -or people, the "al" that drops an l). Nothing from Year 5:
 * the harder end of the first forty already went there, and this pack is
 * about getting the everyday words solid — the ones he writes every day and
 * gets wrong every day.
 *
 * Three threads run through it, because they are the ones that were asked
 * for: contractions, compound words, and dictation. The other patterns are
 * the vowel teams and consonant choices a Year 3 speller still trips on.
 */
import type { Concept } from '../spelling/types'
import { aud, build, cloze, dictate, letters, mistake, pat, proof, syl } from './build'

export const CITY_CONCEPTS: Concept[] = [
  {
    id: 'contractions-more',
    label: "Contractions with 's, 'll, 've and 're",
    patternReminder:
      'Two words squash into one, and the apostrophe sits exactly where the letters fell out: it is → it\'s, we will → we\'ll, they have → they\'ve.',
    introducedIn: 41,
    reviewPool: [
      build('cm-r1', 'contractions-more', ['it', 'is'], "it's"),
      build('cm-r2', 'contractions-more', ['she', 'will'], "she'll"),
      build('cm-r3', 'contractions-more', ['we', 'have'], "we've"),
      build('cm-r4', 'contractions-more', ['you', 'are'], "you're"),
      build('cm-r5', 'contractions-more', ['that', 'is'], "that's"),
      build('cm-r6', 'contractions-more', ['he', 'will'], "he'll"),
      build('cm-r7', 'contractions-more', ['they', 'have'], "they've"),
      aud('cm-r8', 'contractions-more', "you'll"),
      aud('cm-r9', 'contractions-more', "there's"),
      mistake('cm-r10', 'contractions-more', "Were going to the beach today.", 'Were', "We're", { difficulty: 2 }),
    ],
  },
  {
    id: 'contractions-not',
    label: "Contractions with n't",
    patternReminder:
      'When "not" joins on, the o drops out and an apostrophe takes its place: does not → doesn\'t. "Will not" is the odd one — it turns into won\'t.',
    introducedIn: 42,
    reviewPool: [
      build('ct-r1', 'contractions-not', ['does', 'not'], "doesn't"),
      build('ct-r2', 'contractions-not', ['are', 'not'], "aren't"),
      build('ct-r3', 'contractions-not', ['were', 'not'], "weren't"),
      build('ct-r4', 'contractions-not', ['should', 'not'], "shouldn't"),
      build('ct-r5', 'contractions-not', ['has', 'not'], "hasn't"),
      build('ct-r6', 'contractions-not', ['was', 'not'], "wasn't"),
      build('ct-r7', 'contractions-not', ['will', 'not'], "won't", { difficulty: 2 }),
      aud('ct-r8', 'contractions-not', "doesn't"),
      aud('ct-r9', 'contractions-not', "won't", { difficulty: 2 }),
      mistake('ct-r10', 'contractions-not', "The bus does'nt stop here.", "does'nt", "doesn't", { difficulty: 2 }),
    ],
  },
  {
    id: 'compound-some-every',
    label: 'Some-, any-, every- and no- words',
    patternReminder:
      'Find the two small words and spell them one after the other: some + thing, every + where, no + body. Nothing changes where they join.',
    maskFrom: 'lastPart',
    introducedIn: 43,
    reviewPool: [
      build('cs-r1', 'compound-some-every', ['some', 'thing'], 'something'),
      build('cs-r2', 'compound-some-every', ['every', 'where'], 'everywhere'),
      build('cs-r3', 'compound-some-every', ['no', 'body'], 'nobody'),
      build('cs-r4', 'compound-some-every', ['any', 'one'], 'anyone'),
      aud('cs-r5', 'compound-some-every', 'sometimes'),
      aud('cs-r6', 'compound-some-every', 'everything'),
      aud('cs-r7', 'compound-some-every', 'nothing'),
      aud('cs-r8', 'compound-some-every', 'somewhere'),
      aud('cs-r9', 'compound-some-every', 'everybody', { difficulty: 2 }),
      mistake('cs-r10', 'compound-some-every', 'I looked every where for my shoe.', 'every where', 'everywhere', { difficulty: 2 }),
    ],
  },
  {
    id: 'compound-weather',
    label: 'Weather compound words',
    patternReminder:
      'Most weather words are two words joined: sun + shine, rain + drop, snow + flake. Spell the first word, then the second.',
    maskFrom: 'lastPart',
    introducedIn: 44,
    reviewPool: [
      build('wx-r1', 'compound-weather', ['sun', 'shine'], 'sunshine'),
      build('wx-r2', 'compound-weather', ['rain', 'coat'], 'raincoat'),
      build('wx-r3', 'compound-weather', ['snow', 'flake'], 'snowflake'),
      build('wx-r4', 'compound-weather', ['sun', 'set'], 'sunset'),
      aud('wx-r5', 'compound-weather', 'raindrop'),
      aud('wx-r6', 'compound-weather', 'snowball'),
      aud('wx-r7', 'compound-weather', 'windmill'),
      aud('wx-r8', 'compound-weather', 'sunburn'),
      aud('wx-r9', 'compound-weather', 'moonlight', { difficulty: 2 }),
      aud('wx-r10', 'compound-weather', 'thunderstorm', { difficulty: 3 }),
    ],
  },
  {
    id: 'dictation-short',
    label: 'Writing a short sentence',
    patternReminder:
      'Say the sentence back to yourself first. Then write one word at a time, and say each word slowly as you write it.',
    introducedIn: 45,
    reviewPool: [
      dictate('ds-r1', 'dictation-short', 'The cat sat on my bed.'),
      dictate('ds-r2', 'dictation-short', 'We went to the park after school.'),
      dictate('ds-r3', 'dictation-short', 'My friend has a green bike.'),
      dictate('ds-r4', 'dictation-short', 'It was raining all day.'),
      dictate('ds-r5', 'dictation-short', 'The dog ran down the road.'),
      dictate('ds-r6', 'dictation-short', 'I like to play in the snow.'),
      dictate('ds-r7', 'dictation-short', 'She found a shell at the beach.', { difficulty: 2 }),
      dictate('ds-r8', 'dictation-short', 'We had toast and eggs for lunch.', { difficulty: 2 }),
    ],
  },
  {
    id: 'ai-ay-sound',
    label: 'The /ay/ sound: ai and ay',
    patternReminder:
      '"ai" sits in the middle of a word, before another letter: rain, paint. "ay" sits at the very end: day, play.',
    alternatives: ['ai', 'ay', 'a'],
    introducedIn: 46,
    reviewPool: [
      aud('ai-r1', 'ai-ay-sound', 'rain'),
      aud('ai-r2', 'ai-ay-sound', 'play'),
      aud('ai-r3', 'ai-ay-sound', 'paint'),
      aud('ai-r4', 'ai-ay-sound', 'stay'),
      pat('ai-r5', 'ai-ay-sound', 'snail', { choices: ['ai', 'ay', 'a'] }),
      pat('ai-r6', 'ai-ay-sound', 'away', { choices: ['ai', 'ay', 'a'] }),
      letters('ai-r7', 'ai-ay-sound', 'chain'),
      letters('ai-r8', 'ai-ay-sound', 'tray'),
      aud('ai-r9', 'ai-ay-sound', 'daisy', { difficulty: 2 }),
      aud('ai-r10', 'ai-ay-sound', 'crayon', { difficulty: 2 }),
    ],
  },
  {
    id: 'igh-sound',
    label: 'The /igh/ sound: igh, y and i_e',
    patternReminder:
      '"igh" usually comes before a t: night, light. A short word ending in the sound usually ends in y: fly, sky. Otherwise try i with an e at the end: bike, time.',
    alternatives: ['igh', 'y', 'i'],
    introducedIn: 47,
    reviewPool: [
      aud('ig-r1', 'igh-sound', 'night'),
      aud('ig-r2', 'igh-sound', 'bright'),
      aud('ig-r3', 'igh-sound', 'sky'),
      aud('ig-r4', 'igh-sound', 'kite'),
      pat('ig-r5', 'igh-sound', 'light', { choices: ['igh', 'y', 'i'] }),
      pat('ig-r6', 'igh-sound', 'cry', { choices: ['igh', 'y', 'ie'] }),
      letters('ig-r7', 'igh-sound', 'fight'),
      letters('ig-r8', 'igh-sound', 'slide'),
      aud('ig-r9', 'igh-sound', 'flight', { difficulty: 2 }),
      aud('ig-r10', 'igh-sound', 'frighten', { difficulty: 2 }),
    ],
  },
  {
    id: 'ou-ow-sound',
    label: 'The /ow/ sound: ou and ow',
    patternReminder:
      '"ou" sits in the middle of a word: house, cloud. "ow" comes at the end, or just before an n or an l: cow, town, owl.',
    alternatives: ['ou', 'ow'],
    introducedIn: 48,
    reviewPool: [
      aud('ou-r1', 'ou-ow-sound', 'cloud'),
      aud('ou-r2', 'ou-ow-sound', 'town'),
      aud('ou-r3', 'ou-ow-sound', 'shout'),
      aud('ou-r4', 'ou-ow-sound', 'brown'),
      pat('ou-r5', 'ou-ow-sound', 'mouth', { choices: ['ou', 'ow', 'o'] }),
      pat('ou-r6', 'ou-ow-sound', 'crowd', { choices: ['ou', 'ow', 'o'] }),
      letters('ou-r7', 'ou-ow-sound', 'round'),
      letters('ou-r8', 'ou-ow-sound', 'down'),
      aud('ou-r9', 'ou-ow-sound', 'mountain', { difficulty: 2 }),
      aud('ou-r10', 'ou-ow-sound', 'towel', { difficulty: 2 }),
    ],
  },
  {
    id: 'er-ir-ur',
    label: 'Bossy r: er, ir and ur',
    patternReminder:
      'The same sound has three spellings, and your ears cannot pick. "er" is the most common. Words with ir and ur have to be remembered: bird, girl, first; turn, burn, nurse.',
    alternatives: ['er', 'ir', 'ur'],
    introducedIn: 49,
    reviewPool: [
      aud('er-r1', 'er-ir-ur', 'bird'),
      aud('er-r2', 'er-ir-ur', 'turn'),
      aud('er-r3', 'er-ir-ur', 'her'),
      aud('er-r4', 'er-ir-ur', 'first'),
      pat('er-r5', 'er-ir-ur', 'girl', { choices: ['er', 'ir', 'ur'] }),
      pat('er-r6', 'er-ir-ur', 'burn', { choices: ['er', 'ir', 'ur'] }),
      pat('er-r7', 'er-ir-ur', 'fern', { choices: ['er', 'ir', 'ur'] }),
      letters('er-r8', 'er-ir-ur', 'shirt'),
      aud('er-r9', 'er-ir-ur', 'nurse', { difficulty: 2 }),
      aud('er-r10', 'er-ir-ur', 'thirsty', { difficulty: 2 }),
    ],
  },
  {
    id: 'or-aw-sound',
    label: 'The /or/ sound: or, ore and aw',
    patternReminder:
      '"or" sits in the middle: fork, storm. "ore" comes at the end: more, shore. "aw" comes at the end, or before an n or an l: saw, yawn, crawl.',
    alternatives: ['or', 'ore', 'aw'],
    introducedIn: 50,
    reviewPool: [
      aud('or-r1', 'or-aw-sound', 'fork'),
      aud('or-r2', 'or-aw-sound', 'more'),
      aud('or-r3', 'or-aw-sound', 'saw'),
      aud('or-r4', 'or-aw-sound', 'storm'),
      pat('or-r5', 'or-aw-sound', 'horse', { choices: ['or', 'aw', 'ore'] }),
      pat('or-r6', 'or-aw-sound', 'draw', { choices: ['or', 'aw', 'ore'] }),
      letters('or-r7', 'or-aw-sound', 'short'),
      letters('or-r8', 'or-aw-sound', 'paw'),
      aud('or-r9', 'or-aw-sound', 'before', { difficulty: 2 }),
      aud('or-r10', 'or-aw-sound', 'yawn', { difficulty: 2 }),
    ],
  },
  {
    id: 'c-k-ck',
    label: 'The /k/ sound: c, k and ck',
    patternReminder:
      '"ck" comes straight after a short vowel at the end: back, duck. Use "k" before e, i and y: kite, kettle. Use "c" before a, o and u: cat, cot, cup.',
    alternatives: ['c', 'k', 'ck'],
    introducedIn: 51,
    reviewPool: [
      aud('ck-r1', 'c-k-ck', 'duck'),
      aud('ck-r2', 'c-k-ck', 'kite'),
      aud('ck-r3', 'c-k-ck', 'cup'),
      aud('ck-r4', 'c-k-ck', 'clock'),
      pat('ck-r5', 'c-k-ck', 'sock', { choices: ['c', 'k', 'ck'] }),
      pat('ck-r6', 'c-k-ck', 'kettle', { choices: ['c', 'k', 'ck'] }),
      pat('ck-r7', 'c-k-ck', 'cot', { choices: ['c', 'k', 'ck'] }),
      letters('ck-r8', 'c-k-ck', 'black'),
      aud('ck-r9', 'c-k-ck', 'pocket', { difficulty: 2 }),
      aud('ck-r10', 'c-k-ck', 'kitten', { difficulty: 2 }),
    ],
  },
  {
    id: 'tricky-words',
    label: 'Tricky words',
    patternReminder:
      'These words do not follow the rules, so find the tricky part and remember just that bit: s-AI-d, fr-IE-nd, bec-AU-se, p-EO-ple.',
    introducedIn: 52,
    reviewPool: [
      aud('tk-r1', 'tricky-words', 'said'),
      aud('tk-r2', 'tricky-words', 'friend'),
      aud('tk-r3', 'tricky-words', 'because'),
      aud('tk-r4', 'tricky-words', 'people'),
      aud('tk-r5', 'tricky-words', 'again'),
      aud('tk-r6', 'tricky-words', 'many'),
      letters('tk-r7', 'tricky-words', 'laugh'),
      letters('tk-r8', 'tricky-words', 'busy'),
      aud('tk-r9', 'tricky-words', 'once', { difficulty: 2 }),
      mistake('tk-r10', 'tricky-words', 'My frend sed hello.', 'frend', 'friend', { difficulty: 2 }),
    ],
  },
  {
    id: 'wh-ph',
    label: 'wh and ph',
    patternReminder:
      'Question words start with "wh": what, when, where, which, why. "ph" makes an /f/ sound in some words: phone, photo, dolphin.',
    alternatives: ['wh', 'w', 'ph', 'f'],
    introducedIn: 53,
    reviewPool: [
      aud('wp-r1', 'wh-ph', 'when'),
      aud('wp-r2', 'wh-ph', 'where'),
      aud('wp-r3', 'wh-ph', 'phone'),
      aud('wp-r4', 'wh-ph', 'white'),
      pat('wp-r5', 'wh-ph', 'whale', { choices: ['wh', 'w', 'wr'] }),
      pat('wp-r6', 'wh-ph', 'photo', { choices: ['ph', 'f', 'ff'], span: [0, 2] }),
      letters('wp-r7', 'wh-ph', 'wheel'),
      letters('wp-r8', 'wh-ph', 'dolphin'),
      aud('wp-r9', 'wh-ph', 'which', { withSentence: true, difficulty: 2 }),
      aud('wp-r10', 'wh-ph', 'elephant', { difficulty: 2 }),
    ],
  },
  {
    id: 'le-ending',
    label: 'Words ending in -le',
    patternReminder:
      'The /ul/ sound at the end of a word is usually spelled "le": table, candle. After a short vowel the letter before it doubles: little, apple.',
    maskFrom: 'lastPart',
    introducedIn: 54,
    reviewPool: [
      aud('le-r1', 'le-ending', 'table'),
      aud('le-r2', 'le-ending', 'apple'),
      aud('le-r3', 'le-ending', 'little'),
      aud('le-r4', 'le-ending', 'candle'),
      syl('le-r5', 'le-ending', 'bottle'),
      syl('le-r6', 'le-ending', 'jungle'),
      letters('le-r7', 'le-ending', 'middle'),
      letters('le-r8', 'le-ending', 'turtle'),
      aud('le-r9', 'le-ending', 'puzzle', { difficulty: 2 }),
      aud('le-r10', 'le-ending', 'bubble', { difficulty: 2 }),
    ],
  },
  {
    id: 'al-words',
    label: 'al- at the start',
    patternReminder:
      'When "all" joins the front of a word it drops an l, and only one is left: all + ways → always, all + most → almost.',
    maskFrom: 'firstPart',
    introducedIn: 55,
    reviewPool: [
      build('al-r1', 'al-words', ['all', 'ways'], 'always'),
      build('al-r2', 'al-words', ['all', 'most'], 'almost'),
      build('al-r3', 'al-words', ['all', 'so'], 'also'),
      build('al-r4', 'al-words', ['all', 'ready'], 'already'),
      aud('al-r5', 'al-words', 'always'),
      aud('al-r6', 'al-words', 'almost'),
      aud('al-r7', 'al-words', 'also'),
      aud('al-r8', 'al-words', 'already', { difficulty: 2 }),
      mistake('al-r9', 'al-words', 'I allways walk to school.', 'allways', 'always'),
      mistake('al-r10', 'al-words', 'We are allmost there.', 'allmost', 'almost'),
    ],
  },
  {
    id: 'homophones-simple',
    label: 'Words that sound the same',
    patternReminder:
      'Two words sound the same, so listening will not tell you. Think about what the word means in the sentence, and look for a clue inside it: MEAT is food you EAT.',
    introducedIn: 56,
    reviewPool: [
      cloze('hs-r1', 'homophones-simple', 'We had ___ and vegetables for dinner.', 'meat', {
        speakSentence: true,
        prompt: 'Write the word that means "food from an animal". It has "eat" in it.',
      }),
      cloze('hs-r2', 'homophones-simple', 'I will ___ you at the gate.', 'meet', {
        speakSentence: true,
        prompt: 'Write the word that means "come together with".',
      }),
      cloze('hs-r3', 'homophones-simple', 'The ___ was shining all day.', 'sun', {
        speakSentence: true,
        prompt: 'Write the word that means "the star in the sky".',
      }),
      cloze('hs-r4', 'homophones-simple', 'A ___ buzzed around the flowers.', 'bee', {
        speakSentence: true,
        prompt: 'Write the word that means "the insect that makes honey".',
      }),
      cloze('hs-r5', 'homophones-simple', 'The dog wagged its ___.', 'tail', {
        speakSentence: true,
        prompt: 'Write the word that means "the part at the back of an animal".',
      }),
      cloze('hs-r6', 'homophones-simple', 'I ate a juicy ___.', 'pear', {
        speakSentence: true,
        prompt: 'Write the word that means "a fruit". It has "ear" in it.',
      }),
      mistake('hs-r7', 'homophones-simple', 'The postman brought the male.', 'male', 'mail'),
      mistake('hs-r8', 'homophones-simple', 'We could see the stars last knight.', 'knight', 'night'),
      mistake('hs-r9', 'homophones-simple', 'I bought a new pear of shoes.', 'pear', 'pair', { difficulty: 2 }),
    ],
  },
  {
    id: 'possessive-apostrophe',
    label: "The apostrophe that shows who owns it",
    patternReminder:
      'Add \'s to show that something belongs to someone: the dog\'s bone, Mum\'s car. The apostrophe comes straight after the owner.',
    introducedIn: 57,
    reviewPool: [
      cloze('pa-r1', 'possessive-apostrophe', 'The ___ bone was in the garden.', "dog's", {
        speakSentence: true,
        prompt: 'The bone belongs to the dog. Write "dog" so that it shows it.',
      }),
      cloze('pa-r2', 'possessive-apostrophe', "___ car is red.", "Mum's", {
        speakSentence: true,
        prompt: 'The car belongs to Mum. Write "Mum" so that it shows it.',
      }),
      cloze('pa-r3', 'possessive-apostrophe', 'The ___ hat blew away.', "girl's", {
        speakSentence: true,
        prompt: 'The hat belongs to the girl. Write "girl" so that it shows it.',
      }),
      cloze('pa-r4', 'possessive-apostrophe', 'The ___ tail was long.', "cat's", {
        speakSentence: true,
        prompt: 'The tail belongs to the cat. Write "cat" so that it shows it.',
      }),
      cloze('pa-r5', 'possessive-apostrophe', 'My ___ bike has a bell.', "brother's", {
        speakSentence: true,
        prompt: 'The bike belongs to my brother. Write "brother" so that it shows it.',
        difficulty: 2,
      }),
      mistake('pa-r6', 'possessive-apostrophe', 'The dogs bone was buried.', 'dogs', "dog's"),
      mistake('pa-r7', 'possessive-apostrophe', 'I found my sisters shoe.', 'sisters', "sister's"),
      mistake('pa-r8', 'possessive-apostrophe', 'That is Toms book.', 'Toms', "Tom's", { difficulty: 2 }),
    ],
  },
  {
    id: 'er-or-people',
    label: 'People words ending in -er and -or',
    patternReminder:
      'A person who does something usually gets "er": teach → teacher, farm → farmer. A few use "or", and they have to be remembered: actor, doctor, visitor, sailor.',
    alternatives: ['er', 'or'],
    maskFrom: 'lastPart',
    introducedIn: 58,
    reviewPool: [
      build('eo-r1', 'er-or-people', ['teach', 'er'], 'teacher'),
      build('eo-r2', 'er-or-people', ['farm', 'er'], 'farmer'),
      build('eo-r3', 'er-or-people', ['act', 'or'], 'actor'),
      build('eo-r4', 'er-or-people', ['visit', 'or'], 'visitor'),
      aud('eo-r5', 'er-or-people', 'painter'),
      aud('eo-r6', 'er-or-people', 'singer'),
      aud('eo-r7', 'er-or-people', 'doctor'),
      aud('eo-r8', 'er-or-people', 'sailor'),
      pat('eo-r9', 'er-or-people', 'player', { choices: ['er', 'or', 'ar'] }),
      pat('eo-r10', 'er-or-people', 'inventor', { choices: ['er', 'or', 'ar'], difficulty: 2 }),
    ],
  },
  {
    id: 'dictation-story',
    label: 'Writing a longer sentence',
    patternReminder:
      'Break the sentence into chunks of three or four words. Write one chunk, say the next chunk, write that. Squashed words need their apostrophe.',
    introducedIn: 59,
    reviewPool: [
      dictate('dy-r1', 'dictation-story', "It's raining, so we'll stay inside today.", { difficulty: 2 }),
      dictate('dy-r2', 'dictation-story', 'Somebody left a raincoat on the playground.', { difficulty: 2 }),
      dictate('dy-r3', 'dictation-story', "My friend said she doesn't like thunder.", { difficulty: 2 }),
      dictate('dy-r4', 'dictation-story', 'The brown owl flew away into the night.', { difficulty: 2 }),
      dictate('dy-r5', 'dictation-story', "We've always had a little turtle.", { difficulty: 2 }),
      dictate('dy-r6', 'dictation-story', "I can't find my sister's white shoe anywhere.", { difficulty: 3 }),
      dictate('dy-r7', 'dictation-story', 'The farmer saw a snail on the shiny apple.', { difficulty: 2 }),
    ],
  },
  {
    id: 'city-mastery',
    label: 'The whole pack at once',
    patternReminder:
      'Nobody will tell you which pattern this is. Say the word slowly, look for two small words inside it, and ask yourself whether letters have been squashed out.',
    introducedIn: 60,
    reviewPool: [
      aud('cy-r1', 'city-mastery', 'thunderstorm', { difficulty: 2 }),
      aud('cy-r2', 'city-mastery', "shouldn't", { difficulty: 2 }),
      aud('cy-r3', 'city-mastery', 'already', { difficulty: 2 }),
      aud('cy-r4', 'city-mastery', 'elephant', { difficulty: 2 }),
      aud('cy-r5', 'city-mastery', 'mountain', { difficulty: 2 }),
      build('cy-r6', 'city-mastery', ['every', 'body'], 'everybody'),
      dictate('cy-r7', 'city-mastery', "They've already found the dog's ball.", { difficulty: 3 }),
      proof('cy-r8', 'city-mastery', 'Evry nite the gerl reads a litle book.', [
        ['Evry', 'Every'], ['nite', 'night'], ['gerl', 'girl'], ['litle', 'little'],
      ], { difficulty: 3 }),
    ],
  },
]
