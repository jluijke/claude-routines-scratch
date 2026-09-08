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
 * These are Year 4 conventions, and they carry their own concept ids so that
 * nothing here can be mistaken for one of the forty spelling concepts.
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

const CAPITALS: GrammarRule = {
  id: 'grammar-capitals',
  title: 'Where a sentence starts and stops',
  text:
    'Every sentence begins with a capital letter and ends with a full stop, a ' +
    'question mark or an exclamation mark. Names of people and places take a ' +
    'capital wherever they appear in the sentence.',
  examples: [
    'The dog barked at the gate.',
    'Where did you put my sword?',
    'We walked all the way to Sydney.',
  ],
  reminder: 'A sentence opens with a capital letter, and a name always keeps one.',
  questions: [
    pick('gr-cap-1', 'grammar-capitals', '___ dog followed me home.', 'The', ['The', 'the'], { capitals: true }),
    pick('gr-cap-2', 'grammar-capitals', 'My friend ___ lives next door.', 'Sam', ['Sam', 'sam'], { capitals: true }),
    pick('gr-cap-3', 'grammar-capitals', 'We are going to ___ in the holidays.', 'Perth', ['Perth', 'perth'], { capitals: true }),
    pick('gr-cap-4', 'grammar-capitals', '"Where are my boots___"', '?', ['?', '.'], { punctuation: true, prompt: 'Which mark finishes this sentence?' }),
    pick('gr-cap-5', 'grammar-capitals', '"I found the cave___"', '.', ['.', '?'], { punctuation: true, prompt: 'Which mark finishes this sentence?' }),
    pick('gr-cap-6', 'grammar-capitals', '___ went down to the river.', 'They', ['They', 'they'], { capitals: true }),
    pick('gr-cap-7', 'grammar-capitals', 'On ___ we have swimming.', 'Monday', ['Monday', 'monday'], { capitals: true }),
    pick('gr-cap-8', 'grammar-capitals', 'The river runs past ___ farm.', 'Miller’s', ['Miller’s', 'miller’s'], { capitals: true }),
    pick('gr-cap-9', 'grammar-capitals', '"Look out___"', '!', ['!', '.'], { punctuation: true, prompt: 'Which mark finishes this sentence?' }),
    pick('gr-cap-10', 'grammar-capitals', '___ is the biggest bat I have seen.', 'That', ['That', 'that'], { capitals: true }),
    pick('gr-cap-11', 'grammar-capitals', 'My brother ___ hates spiders.', 'Tom', ['Tom', 'tom'], { capitals: true }),
    pick('gr-cap-12', 'grammar-capitals', '"Are you coming with us___"', '?', ['?', '.'], { punctuation: true, prompt: 'Which mark finishes this sentence?' }),
    pick('gr-cap-13', 'grammar-capitals', '___ rain stopped before lunch.', 'The', ['The', 'the'], { capitals: true }),
    pick('gr-cap-14', 'grammar-capitals', 'We climbed ___ Hill on Sunday.', 'Bald', ['Bald', 'bald'], { capitals: true }),
  ],
}

const CONTRACTIONS: GrammarRule = {
  id: 'grammar-contractions',
  title: 'The apostrophe that stands for missing letters',
  text:
    'When two words are squashed into one, an apostrophe goes exactly where the ' +
    'missing letters were. do not becomes don’t. I will becomes I’ll. There is ' +
    'never an apostrophe in a plain plural.',
  examples: ['do not → don’t', 'she is → she’s', 'we have → we’ve'],
  reminder: 'The apostrophe stands in for the letters that were taken out.',
  questions: [
    pick('gr-con-1', 'grammar-contractions', 'I ___ know where it went.', 'don’t', ['don’t', 'dont']),
    pick('gr-con-2', 'grammar-contractions', '___ going to be late.', 'We’re', ['We’re', 'Were'], { capitals: true }),
    pick('gr-con-3', 'grammar-contractions', 'She ___ finished her lunch yet.', 'hasn’t', ['hasn’t', 'hasnt']),
    pick('gr-con-4', 'grammar-contractions', '___ is short for "it is".', 'it’s', ['it’s', 'its']),
    pick('gr-con-5', 'grammar-contractions', '___ is short for "cannot".', 'can’t', ['can’t', 'cant']),
    pick('gr-con-6', 'grammar-contractions', 'They ___ seen the map before.', 'haven’t', ['haven’t', 'havent']),
    pick('gr-con-7', 'grammar-contractions', '___ carry the lantern.', 'I’ll', ['I’ll', 'Ill'], { capitals: true }),
    pick('gr-con-8', 'grammar-contractions', '___ is short for "you are".', 'you’re', ['you’re', 'your']),
    pick('gr-con-9', 'grammar-contractions', 'The cave ___ as dark as we thought.', 'wasn’t', ['wasn’t', 'wasnt']),
    pick('gr-con-10', 'grammar-contractions', 'I have three ___ at home.', 'cats', ['cats', 'cat’s'], { prompt: 'More than one cat — is an apostrophe needed?' }),
    pick('gr-con-11', 'grammar-contractions', '___ is short for "did not".', 'didn’t', ['didn’t', 'didnt']),
    pick('gr-con-12', 'grammar-contractions', 'He ___ be here until six.', 'won’t', ['won’t', 'wont']),
    pick('gr-con-13', 'grammar-contractions', 'The shop sells ___ and apples.', 'pears', ['pears', 'pear’s'], { prompt: 'More than one pear — is an apostrophe needed?' }),
    pick('gr-con-14', 'grammar-contractions', '___ is short for "they are".', 'they’re', ['they’re', 'their']),
  ],
}

const POSSESSION: GrammarRule = {
  id: 'grammar-possession',
  title: 'The apostrophe that shows who owns it',
  text:
    'To show that something belongs to somebody, add an apostrophe and an s: ' +
    'the dog’s bowl. If the owners are already a plural ending in s, the ' +
    'apostrophe goes after that s: the dogs’ bowls.',
  examples: ['the girl’s bike', 'my brother’s room', 'the farmers’ sheds'],
  reminder: 'One owner takes ’s. Owners already ending in s just take the apostrophe.',
  questions: [
    pick('gr-pos-1', 'grammar-possession', 'That is my ___ sword.', 'brother’s', ['brother’s', 'brothers']),
    pick('gr-pos-2', 'grammar-possession', 'The ___ tail was wagging.', 'dog’s', ['dog’s', 'dogs']),
    pick('gr-pos-3', 'grammar-possession', 'All six ___ tails were wagging.', 'dogs’', ['dogs’', 'dog’s']),
    pick('gr-pos-4', 'grammar-possession', 'I found the ___ hat by the river.', 'boy’s', ['boy’s', 'boys']),
    pick('gr-pos-5', 'grammar-possession', 'Three ___ live on our street.', 'families', ['families', 'family’s']),
    pick('gr-pos-6', 'grammar-possession', 'The ___ roof is leaking.', 'shed’s', ['shed’s', 'sheds']),
    pick('gr-pos-7', 'grammar-possession', 'The ___ classroom is upstairs.', 'teacher’s', ['teacher’s', 'teachers']),
    pick('gr-pos-8', 'grammar-possession', 'Both ___ shoes were muddy.', 'girls’', ['girls’', 'girl’s']),
    pick('gr-pos-9', 'grammar-possession', 'We picked up all the ___ from the path.', 'stones', ['stones', 'stone’s']),
    pick('gr-pos-10', 'grammar-possession', 'The ___ handle came off.', 'bucket’s', ['bucket’s', 'buckets']),
    pick('gr-pos-11', 'grammar-possession', 'My ___ car is old.', 'father’s', ['father’s', 'fathers']),
    pick('gr-pos-12', 'grammar-possession', 'The ___ nests are up in the gum tree.', 'birds’', ['birds’', 'bird’s']),
    pick('gr-pos-13', 'grammar-possession', 'Those ___ belong to the school.', 'books', ['books', 'book’s']),
    pick('gr-pos-14', 'grammar-possession', 'The ___ mane was full of burrs.', 'horse’s', ['horse’s', 'horses']),
  ],
}

const COMMAS: GrammarRule = {
  id: 'grammar-commas',
  title: 'Commas in a list',
  text:
    'When you list three or more things, put a comma between them — but not ' +
    'before the "and" at the end. A comma is a small pause, not a full stop.',
  examples: [
    'We packed bread, cheese and apples.',
    'The cave was dark, cold and very quiet.',
  ],
  reminder: 'Commas separate the items; the last two are joined by "and" instead.',
  questions: [
    pick('gr-com-1', 'grammar-commas', 'We packed ___ for the walk.', 'bread, cheese and apples', ['bread, cheese and apples', 'bread cheese and apples'], { punctuation: true, prompt: 'Which one is punctuated correctly?' }),
    pick('gr-com-2', 'grammar-commas', 'The flag is ___.', 'red, green and blue', ['red, green and blue', 'red, green, and, blue'], { punctuation: true, prompt: 'Which one is punctuated correctly?' }),
    pick('gr-com-3', 'grammar-commas', 'We came home ___.', 'cold, wet and hungry', ['cold, wet and hungry', 'cold wet, and hungry'], { punctuation: true, prompt: 'Which one is punctuated correctly?' }),
    pick('gr-com-4', 'grammar-commas', 'Before dark I fed ___.', 'the dog, the cat and the goat', ['the dog, the cat and the goat', 'the dog the cat and the goat'], { punctuation: true, prompt: 'Which one is punctuated correctly?' }),
    pick('gr-com-5', 'grammar-commas', 'In the cave we saw ___.', 'bats, spiders and one snake', ['bats, spiders and one snake', 'bats spiders and one snake'], { punctuation: true, prompt: 'Which one is punctuated correctly?' }),
    pick('gr-com-6', 'grammar-commas', 'The list "apples pears figs and plums" needs ___ commas.', 'three', ['three', 'four'], { prompt: 'How many commas does that list need?' }),
    pick('gr-com-7', 'grammar-commas', 'The list "salt and pepper" needs ___ commas.', 'no', ['no', 'two'], { prompt: 'How many commas does that list need?' }),
    pick('gr-com-8', 'grammar-commas', 'He carried ___ into the tunnel.', 'a rope, a lamp and a map', ['a rope, a lamp and a map', 'a rope a lamp and a map'], { punctuation: true, prompt: 'Which one is punctuated correctly?' }),
    pick('gr-com-9', 'grammar-commas', 'My sister is ___.', 'quick, clever and kind', ['quick, clever and kind', 'quick clever and kind'], { punctuation: true, prompt: 'Which one is punctuated correctly?' }),
    pick('gr-com-10', 'grammar-commas', 'The list "north south east and west" needs ___ commas.', 'three', ['three', 'two'], { prompt: 'How many commas does that list need?' }),
    pick('gr-com-11', 'grammar-commas', 'For the mountain you want ___.', 'boots, a coat and gloves', ['boots, a coat and gloves', 'boots, a coat, and, gloves'], { punctuation: true, prompt: 'Which one is punctuated correctly?' }),
    pick('gr-com-12', 'grammar-commas', 'When the guard came past ___.', 'we ran, we hid and we waited', ['we ran, we hid and we waited', 'we ran we hid and we waited'], { punctuation: true, prompt: 'Which one is punctuated correctly?' }),
    pick('gr-com-13', 'grammar-commas', 'Outside the cave were ___.', 'a wombat, a goat and a rabbit', ['a wombat, a goat and a rabbit', 'a wombat a goat, and a rabbit'], { punctuation: true, prompt: 'Which one is punctuated correctly?' }),
    pick('gr-com-14', 'grammar-commas', 'The list "eggs milk bread and jam" needs ___ commas.', 'three', ['three', 'four'], { prompt: 'How many commas does that list need?' }),
  ],
}

const AGREEMENT: GrammarRule = {
  id: 'grammar-agreement',
  title: 'The verb has to match who is doing it',
  text:
    'One person or thing takes a verb ending in s: he runs, the dog barks. More ' +
    'than one takes the plain verb: they run, the dogs bark. It sounds wrong ' +
    'when they do not match, and that is the test.',
  examples: ['She walks to school.', 'They walk to school.', 'The bird sings.'],
  reminder: 'One of them takes the -s ending; more than one does not.',
  questions: [
    pick('gr-agr-1', 'grammar-agreement', 'The dog ___ at the postman.', 'barks', ['barks', 'bark']),
    pick('gr-agr-2', 'grammar-agreement', 'The dogs ___ at the postman.', 'bark', ['bark', 'barks']),
    pick('gr-agr-3', 'grammar-agreement', 'My sister ___ the piano.', 'plays', ['plays', 'play']),
    pick('gr-agr-4', 'grammar-agreement', 'They ___ every Saturday.', 'swim', ['swim', 'swims']),
    pick('gr-agr-5', 'grammar-agreement', 'The kettle ___ on the stove.', 'sits', ['sits', 'sit']),
    pick('gr-agr-6', 'grammar-agreement', 'Those birds ___ very early.', 'sing', ['sing', 'sings']),
    pick('gr-agr-7', 'grammar-agreement', 'He ___ the answer.', 'knows', ['knows', 'know']),
    pick('gr-agr-8', 'grammar-agreement', 'We ___ the answer.', 'know', ['know', 'knows']),
    pick('gr-agr-9', 'grammar-agreement', 'The kangaroo ___ over the fence.', 'jumps', ['jumps', 'jump']),
    pick('gr-agr-10', 'grammar-agreement', 'My friends ___ in the next street.', 'live', ['live', 'lives']),
    pick('gr-agr-11', 'grammar-agreement', 'That goat ___ everything.', 'eats', ['eats', 'eat']),
    pick('gr-agr-12', 'grammar-agreement', 'The children ___ home at three.', 'come', ['come', 'comes']),
    pick('gr-agr-13', 'grammar-agreement', 'It ___ every afternoon here.', 'rains', ['rains', 'rain']),
    pick('gr-agr-14', 'grammar-agreement', 'The two rabbits ___ under the shed.', 'hide', ['hide', 'hides']),
  ],
}

const PAST_TENSE: GrammarRule = {
  id: 'grammar-past',
  title: 'Saying it already happened',
  text:
    'Most verbs take -ed to talk about the past: walk becomes walked. A good ' +
    'many of the commonest ones do not, and simply change: go becomes went, ' +
    'run becomes ran, see becomes saw. Those have to be learned one at a time.',
  examples: ['walk → walked', 'jump → jumped', 'go → went', 'run → ran'],
  reminder: 'Most take -ed. The everyday ones — go, run, see, take — change instead.',
  questions: [
    pick('gr-past-1', 'grammar-past', 'Yesterday we ___ to the beach.', 'went', ['went', 'goed']),
    pick('gr-past-2', 'grammar-past', 'Last night I ___ a strange noise.', 'heard', ['heard', 'heared']),
    pick('gr-past-3', 'grammar-past', 'She ___ all the way home.', 'walked', ['walked', 'walkd']),
    pick('gr-past-4', 'grammar-past', 'He ___ faster than anyone.', 'ran', ['ran', 'runned']),
    pick('gr-past-5', 'grammar-past', 'We ___ the whole cave yesterday.', 'explored', ['explored', 'exploreed']),
    pick('gr-past-6', 'grammar-past', 'I ___ a bat in the doorway.', 'saw', ['saw', 'seed']),
    pick('gr-past-7', 'grammar-past', 'They ___ the door behind them.', 'shut', ['shut', 'shutted']),
    pick('gr-past-8', 'grammar-past', 'The goat ___ my hat.', 'took', ['took', 'taked']),
    pick('gr-past-9', 'grammar-past', 'She ___ the whole book last week.', 'read', ['read', 'readed']),
    pick('gr-past-10', 'grammar-past', 'We ___ for an hour in the rain.', 'waited', ['waited', 'waitted']),
    pick('gr-past-11', 'grammar-past', 'He ___ me the way to the bridge.', 'showed', ['showed', 'shown']),
    pick('gr-past-12', 'grammar-past', 'The rabbit ___ under the fence.', 'dug', ['dug', 'digged']),
    pick('gr-past-13', 'grammar-past', 'I ___ my boots by the fire.', 'dried', ['dried', 'dryed']),
    pick('gr-past-14', 'grammar-past', 'They ___ us a story after tea.', 'told', ['told', 'telled']),
  ],
}

export const GRAMMAR_RULES: GrammarRule[] = [
  CAPITALS,
  CONTRACTIONS,
  POSSESSION,
  COMMAS,
  AGREEMENT,
  PAST_TENSE,
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
