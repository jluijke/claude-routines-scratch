/**
 * The grammar rules behind a sack of animal food.
 *
 * Different in shape from the forty spelling exercises, and deliberately so.
 * There the child works the pattern out and is told what it was at the end;
 * here the rule is explained *first* and the four questions only ask whether it
 * landed. That is the right way round for grammar, which is a convention to be
 * told rather than a pattern to be noticed — and it keeps the price of a sack
 * of food to something a child will happily pay while out exploring.
 *
 * Six rules, taken in turn. Each pool is deep enough that four drawn from it
 * are almost never four he has just done: fourteen questions give nearly five
 * hundred different sets of four, before the "not the ones he saw last time"
 * filter narrows it further.
 *
 * Pitched at nine and ten, which rules out the ones a child that age has had
 * since Year 2 — where a capital goes, where a full stop goes. What is left is
 * the machinery that is still genuinely being learned: how plurals are built,
 * what happens to a verb in the past, how things are compared, and the
 * apostrophe, which is the single most-missed mark in a Year 4 book.
 *
 * They carry their own concept ids so that nothing here can be mistaken for one
 * of the forty spelling concepts.
 */
import type { Question } from '../spelling/types'

export interface GrammarRule {
  id: string
  /** Named on the panel before the questions. */
  title: string
  /** The rule itself, in as few words as will do. */
  text: string
  /** Two to four, the way the spelling reveals do it. */
  examples: string[]
  /** What a hint says: the rule again, pointed at the question in front of him. */
  reminder: string
  questions: Question[]
}

/** A sentence with a gap and buttons to fill it. */
function pick(
  id: string,
  concept: string,
  sentence: string,
  answer: string,
  choices: string[],
  options: { capitals?: boolean; punctuation?: boolean; prompt?: string } = {},
): Question {
  return {
    id,
    concept,
    type: 'cloze',
    sentence,
    answer,
    choices,
    inputMode: 'select',
    difficulty: 1,
    ...(options.prompt ? { prompt: options.prompt } : {}),
    ...(options.capitals ? { capitalMatters: true } : {}),
    ...(options.punctuation ? { punctuationMatters: true } : {}),
  }
}

const PLURALS: GrammarRule = {
  id: 'grammar-plurals',
  title: 'More than one',
  text:
    'Most nouns just add -s. A noun ending in s, x, ch or sh adds -es, because ' +
    'you can hear the extra syllable. A noun ending in a consonant and then y ' +
    'changes the y to i and adds -es. Several ending in f swap it for -ves — and ' +
    'a handful change shape altogether.',
  examples: ['box → boxes', 'baby → babies', 'leaf → leaves', 'child → children'],
  reminder: 'Hissing endings take -es. A consonant before y becomes -ies. A few change shape completely.',
  questions: [
    pick('gr-plu-1', 'grammar-plurals', 'We carried four ___ up the hill.', 'boxes', ['boxes', 'boxs']),
    pick('gr-plu-2', 'grammar-plurals', 'Three ___ were hiding under the shed.', 'mice', ['mice', 'mouses']),
    pick('gr-plu-3', 'grammar-plurals', 'The wind took all the ___ off the tree.', 'leaves', ['leaves', 'leafs']),
    pick('gr-plu-4', 'grammar-plurals', 'She told us two ___ before bed.', 'stories', ['stories', 'storys']),
    pick('gr-plu-5', 'grammar-plurals', 'The farm keeps six ___.', 'donkeys', ['donkeys', 'donkies']),
    pick('gr-plu-6', 'grammar-plurals', 'He brushes his ___ every night.', 'teeth', ['teeth', 'tooths']),
    pick('gr-plu-7', 'grammar-plurals', 'Two ___ crossed the paddock at dusk.', 'foxes', ['foxes', 'foxs']),
    pick('gr-plu-8', 'grammar-plurals', 'She cut the apple into ___.', 'halves', ['halves', 'halfs']),
    pick('gr-plu-9', 'grammar-plurals', 'Three ___ came to mend the roof.', 'men', ['men', 'mans']),
    pick('gr-plu-10', 'grammar-plurals', 'The garden is full of ___.', 'bushes', ['bushes', 'bushs']),
    pick('gr-plu-11', 'grammar-plurals', 'My ___ ached after the long walk.', 'feet', ['feet', 'foots']),
    pick('gr-plu-12', 'grammar-plurals', 'We picked a basket of ___.', 'cherries', ['cherries', 'cherrys']),
    pick('gr-plu-13', 'grammar-plurals', 'The zoo keeps two ___.', 'wolves', ['wolves', 'wolfs']),
    pick('gr-plu-14', 'grammar-plurals', 'Both of the ___ have stopped.', 'watches', ['watches', 'watchs']),
  ],
}

const PAST_TENSE: GrammarRule = {
  id: 'grammar-past',
  title: 'Saying it already happened',
  text:
    'Most verbs add -ed. A short verb ending in one vowel and one consonant ' +
    'doubles that consonant first: stop becomes stopped. A verb ending in a ' +
    'consonant and then y becomes -ied: carry becomes carried. And many of the ' +
    'commonest verbs of all change shape instead — those you simply have to know.',
  examples: ['stop → stopped', 'carry → carried', 'catch → caught', 'bring → brought'],
  reminder: 'Double the consonant after a short vowel, swap y for -ied — or check whether it is one that changes shape.',
  questions: [
    pick('gr-past-1', 'grammar-past', 'The bus ___ at the corner.', 'stopped', ['stopped', 'stoped']),
    pick('gr-past-2', 'grammar-past', 'She ___ the box all the way home.', 'carried', ['carried', 'carryed']),
    pick('gr-past-3', 'grammar-past', 'He ___ the ball in one hand.', 'caught', ['caught', 'catched']),
    pick('gr-past-4', 'grammar-past', 'They ___ us a story after tea.', 'told', ['told', 'telled']),
    pick('gr-past-5', 'grammar-past', 'We ___ the whole afternoon in the cave.', 'spent', ['spent', 'spended']),
    pick('gr-past-6', 'grammar-past', 'The teacher ___ us a new song.', 'taught', ['taught', 'teached']),
    pick('gr-past-7', 'grammar-past', 'I ___ my bag on the step.', 'dropped', ['dropped', 'droped']),
    pick('gr-past-8', 'grammar-past', 'She ___ down the hill after them.', 'hurried', ['hurried', 'hurryed']),
    pick('gr-past-9', 'grammar-past', 'He ___ about it for a long time.', 'thought', ['thought', 'thinked']),
    pick('gr-past-10', 'grammar-past', 'We ___ our lunch in the shade.', 'ate', ['ate', 'eated']),
    pick('gr-past-11', 'grammar-past', 'They ___ across the river and back.', 'swam', ['swam', 'swimmed']),
    pick('gr-past-12', 'grammar-past', 'I ___ my name at the top of the page.', 'wrote', ['wrote', 'writed']),
    pick('gr-past-13', 'grammar-past', 'The bird ___ straight over the fence.', 'flew', ['flew', 'flied']),
    pick('gr-past-14', 'grammar-past', 'We ___ the trip a week ago.', 'planned', ['planned', 'planed']),
  ],
}

const DEGREES: GrammarRule = {
  id: 'grammar-degrees',
  title: 'Comparing one thing with another',
  text:
    'Short words add -er to compare two things and -est for the top of a whole ' +
    'group: tall, taller, tallest. A short vowel doubles its consonant first ' +
    '(big, bigger), and a consonant before y becomes -ier (happy, happier). ' +
    'Longer words use more and most instead. Good and bad follow none of it.',
  examples: [
    'big → bigger → biggest',
    'happy → happier → happiest',
    'difficult → more difficult → most difficult',
    'good → better → best',
  ],
  reminder: 'Short words take -er and -est. Long words take more and most. Two things take -er; a whole group takes -est.',
  questions: [
    pick('gr-deg-1', 'grammar-degrees', 'This rock is ___ than that one.', 'bigger', ['bigger', 'more big']),
    pick('gr-deg-2', 'grammar-degrees', 'Today is the ___ day of the year.', 'hottest', ['hottest', 'hotest']),
    pick('gr-deg-3', 'grammar-degrees', 'She is ___ about it than her sister.', 'happier', ['happier', 'happyer']),
    pick('gr-deg-4', 'grammar-degrees', 'That was the ___ film I have ever seen.', 'most exciting', ['most exciting', 'excitingest']),
    pick('gr-deg-5', 'grammar-degrees', 'My handwriting is ___ than it was last year.', 'better', ['better', 'gooder']),
    pick('gr-deg-6', 'grammar-degrees', 'My cold is ___ today than it was yesterday.', 'worse', ['worse', 'worser']),
    pick('gr-deg-7', 'grammar-degrees', 'He runs ___ than anyone in our class.', 'faster', ['faster', 'more fast']),
    pick('gr-deg-8', 'grammar-degrees', 'That is the ___ pumpkin at the whole show.', 'heaviest', ['heaviest', 'heavyest']),
    pick('gr-deg-9', 'grammar-degrees', 'This puzzle is ___ than the last one.', 'more difficult', ['more difficult', 'difficulter']),
    pick('gr-deg-10', 'grammar-degrees', 'It was the ___ day of the whole trip.', 'wettest', ['wettest', 'wetest']),
    pick('gr-deg-11', 'grammar-degrees', 'That was the ___ thing I have ever done.', 'most frightening', ['most frightening', 'frighteningest']),
    pick('gr-deg-12', 'grammar-degrees', 'This bag is the ___ of the three.', 'lightest', ['lightest', 'most lightest']),
    // The two that test -er against -est rather than the spelling: two things,
    // or a whole group.
    pick('gr-deg-13', 'grammar-degrees', 'Of the two roads, take the ___ one.', 'shorter', ['shorter', 'shortest']),
    pick('gr-deg-14', 'grammar-degrees', 'She was the ___ runner in the entire school.', 'fastest', ['fastest', 'faster']),
  ],
}

const APOSTROPHES: GrammarRule = {
  id: 'grammar-apostrophes',
  title: 'The two jobs of an apostrophe',
  text:
    'An apostrophe does one of two things. It stands in for missing letters — do ' +
    'not becomes don’t, it is becomes it’s — or it shows that something belongs ' +
    'to somebody: the dog’s bowl. It never, ever makes a plural. And the words ' +
    'that already mean belonging — its, yours, hers, theirs — take none at all.',
  examples: ['it’s = it is', 'its = belonging to it', 'the girl’s bike', 'three bikes'],
  reminder: 'Missing letters, or belonging. If you can say "it is" instead, it takes the apostrophe.',
  questions: [
    pick('gr-apo-1', 'grammar-apostrophes', 'The dog wagged ___ tail.', 'its', ['its', 'it’s']),
    pick('gr-apo-2', 'grammar-apostrophes', '___ going to rain before lunch.', 'It’s', ['It’s', 'Its']),
    pick('gr-apo-3', 'grammar-apostrophes', 'That is my ___ bike.', 'brother’s', ['brother’s', 'brothers']),
    pick('gr-apo-4', 'grammar-apostrophes', 'I have three ___ at home.', 'cats', ['cats', 'cat’s']),
    pick('gr-apo-5', 'grammar-apostrophes', 'All six ___ tails were wagging.', 'dogs’', ['dogs’', 'dog’s']),
    pick('gr-apo-6', 'grammar-apostrophes', '___ coat is still on the hook.', 'Your', ['Your', 'You’re']),
    pick('gr-apo-7', 'grammar-apostrophes', '___ late again.', 'You’re', ['You’re', 'Your']),
    pick('gr-apo-8', 'grammar-apostrophes', 'The children took ___ bags with them.', 'their', ['their', 'they’re']),
    pick('gr-apo-9', 'grammar-apostrophes', '___ waiting by the gate.', 'They’re', ['They’re', 'Their']),
    pick('gr-apo-10', 'grammar-apostrophes', 'Do you know ___ bike this is?', 'whose', ['whose', 'who’s']),
    pick('gr-apo-11', 'grammar-apostrophes', '___ coming with us tomorrow?', 'Who’s', ['Who’s', 'Whose']),
    pick('gr-apo-12', 'grammar-apostrophes', 'The shop sells ___ and apples.', 'pears', ['pears', 'pear’s']),
    pick('gr-apo-13', 'grammar-apostrophes', 'The ___ roof has been leaking for weeks.', 'shed’s', ['shed’s', 'sheds']),
    pick('gr-apo-14', 'grammar-apostrophes', 'That book is not mine, it is ___.', 'hers', ['hers', 'her’s']),
  ],
}

const AGREEMENT: GrammarRule = {
  id: 'grammar-agreement',
  title: 'Matching the verb to whoever is doing it',
  text:
    'One person or thing takes the verb ending in s: the dog barks. More than one ' +
    'takes the plain verb: the dogs bark. The catch is a phrase in the middle — ' +
    'match the verb to whoever is really doing it, not to the nearest word. In ' +
    '"the box of apples is heavy", it is the box that is heavy, not the apples.',
  examples: [
    'The dog barks.',
    'The dogs bark.',
    'The box of apples is heavy.',
    'Everyone has finished.',
  ],
  reminder: 'Find who or what is really doing it — not the nearest word — and match the verb to that.',
  questions: [
    pick('gr-agr-1', 'grammar-agreement', 'The box of apples ___ too heavy to lift.', 'is', ['is', 'are']),
    pick('gr-agr-2', 'grammar-agreement', 'The list of names ___ pinned to the door.', 'is', ['is', 'are']),
    pick('gr-agr-3', 'grammar-agreement', 'Everyone ___ finished their lunch.', 'has', ['has', 'have']),
    pick('gr-agr-4', 'grammar-agreement', 'There ___ three cats on the wall.', 'are', ['are', 'is']),
    pick('gr-agr-5', 'grammar-agreement', 'Neither of the boys ___ ready yet.', 'is', ['is', 'are']),
    pick('gr-agr-6', 'grammar-agreement', 'My friends ___ in the next street.', 'live', ['live', 'lives']),
    pick('gr-agr-7', 'grammar-agreement', 'That goat ___ everything it finds.', 'eats', ['eats', 'eat']),
    pick('gr-agr-8', 'grammar-agreement', 'The children ___ home at three.', 'come', ['come', 'comes']),
    pick('gr-agr-9', 'grammar-agreement', 'A bunch of keys ___ on the kitchen table.', 'is', ['is', 'are']),
    pick('gr-agr-10', 'grammar-agreement', 'One of the windows ___ broken.', 'is', ['is', 'are']),
    pick('gr-agr-11', 'grammar-agreement', 'The two rabbits ___ under the shed.', 'hide', ['hide', 'hides']),
    pick('gr-agr-12', 'grammar-agreement', 'Each of the players ___ a number.', 'has', ['has', 'have']),
    pick('gr-agr-13', 'grammar-agreement', 'It ___ here nearly every afternoon.', 'rains', ['rains', 'rain']),
    pick('gr-agr-14', 'grammar-agreement', 'The birds in the gum tree ___ very early.', 'sing', ['sing', 'sings']),
  ],
}

const COMMAS: GrammarRule = {
  id: 'grammar-commas',
  title: 'Where a comma goes',
  text:
    'A comma separates the items in a list of three or more, and there is no ' +
    'comma before the final "and". A comma also comes after a phrase that opens ' +
    'a sentence and tells you when, where or how something happened.',
  examples: [
    'We packed bread, cheese and apples.',
    'After lunch, we walked down to the river.',
    'Slowly, the door creaked open.',
  ],
  reminder: 'Commas between the items in a list, and one after a phrase that opens the sentence.',
  questions: [
    pick('gr-com-1', 'grammar-commas', 'We packed ___ for the walk.', 'bread, cheese and apples', ['bread, cheese and apples', 'bread cheese and apples'], { punctuation: true, prompt: 'Which one is punctuated correctly?' }),
    pick('gr-com-2', 'grammar-commas', 'We came home ___.', 'cold, wet and hungry', ['cold, wet and hungry', 'cold wet, and hungry'], { punctuation: true, prompt: 'Which one is punctuated correctly?' }),
    pick('gr-com-3', 'grammar-commas', 'Before dark I fed ___.', 'the dog, the cat and the goat', ['the dog, the cat and the goat', 'the dog the cat and the goat'], { punctuation: true, prompt: 'Which one is punctuated correctly?' }),
    pick('gr-com-4', 'grammar-commas', 'In the cave we saw ___.', 'bats, spiders and one snake', ['bats, spiders and one snake', 'bats spiders and one snake'], { punctuation: true, prompt: 'Which one is punctuated correctly?' }),
    pick('gr-com-5', 'grammar-commas', 'He carried ___ into the tunnel.', 'a rope, a lamp and a map', ['a rope, a lamp and a map', 'a rope, a lamp, and, a map'], { punctuation: true, prompt: 'Which one is punctuated correctly?' }),
    pick('gr-com-6', 'grammar-commas', 'For the mountain you want ___.', 'boots, a coat and gloves', ['boots, a coat and gloves', 'boots a coat and gloves'], { punctuation: true, prompt: 'Which one is punctuated correctly?' }),
    pick('gr-com-7', 'grammar-commas', 'The list "apples pears figs and plums" needs ___ commas.', 'three', ['three', 'four'], { prompt: 'How many commas does that list need?' }),
    pick('gr-com-8', 'grammar-commas', 'The list "salt and pepper" needs ___ commas.', 'no', ['no', 'two'], { prompt: 'How many commas does that list need?' }),
    // The other half of the rule: a phrase that opens the sentence.
    pick('gr-com-9', 'grammar-commas', '___ we walked down to the river.', 'After lunch,', ['After lunch,', 'After lunch'], { punctuation: true, prompt: 'Which opening is punctuated correctly?' }),
    pick('gr-com-10', 'grammar-commas', '___ the door creaked open.', 'Slowly,', ['Slowly,', 'Slowly'], { punctuation: true, prompt: 'Which opening is punctuated correctly?' }),
    pick('gr-com-11', 'grammar-commas', '___ we finally found the cave.', 'At the top of the hill,', ['At the top of the hill,', 'At the top of the hill'], { punctuation: true, prompt: 'Which opening is punctuated correctly?' }),
    pick('gr-com-12', 'grammar-commas', '___ the dogs were still barking.', 'An hour later,', ['An hour later,', 'An hour later'], { punctuation: true, prompt: 'Which opening is punctuated correctly?' }),
    pick('gr-com-13', 'grammar-commas', '___ nobody moved at all.', 'For a long moment,', ['For a long moment,', 'For a long moment'], { punctuation: true, prompt: 'Which opening is punctuated correctly?' }),
    pick('gr-com-14', 'grammar-commas', '___ he carried the lantern himself.', 'All the way down,', ['All the way down,', 'All the way down'], { punctuation: true, prompt: 'Which opening is punctuated correctly?' }),
  ],
}

export const GRAMMAR_RULES: GrammarRule[] = [
  PLURALS,
  PAST_TENSE,
  DEGREES,
  APOSTROPHES,
  AGREEMENT,
  COMMAS,
]

/** Questions asked per sack of food. Four, and no more. */
export const GRAMMAR_QUESTIONS = 4

/**
 * The rule for the next sack, and four questions from it.
 *
 * Rules come round in turn rather than at random, so he meets all six rather
 * than the same two over and over. Within a rule, questions he has been asked
 * lately are held back — and if that leaves too few, the filter is dropped
 * rather than the exercise being short.
 */
export function drawGrammar(
  ruleIndex: number,
  asked: readonly string[],
  pickFrom: <T>(list: readonly T[]) => T[],
): { rule: GrammarRule; questions: Question[] } {
  const rule = GRAMMAR_RULES[ruleIndex % GRAMMAR_RULES.length] as GrammarRule
  const fresh = rule.questions.filter((q) => !asked.includes(q.id))
  const pool = fresh.length >= GRAMMAR_QUESTIONS ? fresh : rule.questions
  const questions = pickFrom(pool).slice(0, GRAMMAR_QUESTIONS)
  // The rule is stated on the panel before any of this, so a hint is a nudge
  // back towards it rather than anything about spelling patterns.
  return {
    rule,
    questions: questions.map((q) => ({
      ...q,
      hints: { 1: rule.reminder, 2: rule.reminder, 3: rule.reminder, 4: rule.reminder, 5: rule.reminder },
    })),
  }
}
