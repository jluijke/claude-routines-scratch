import type { Exercise } from '../../spelling/types'
import type { ConceptId } from '../../spelling/types'
import { aud, letters } from '../build'

/**
 * Two questions, and the shopkeeper sells him a candle.
 *
 * Deliberately trivial. It is not a lesson — it is the moment a child learns
 * that spelling is the currency of this world, thirty seconds after starting.
 *
 * It is NOT in the EXERCISES array, and must never be: that list drives
 * `nextExercise`, the curriculum counter, the validator and the parent
 * dashboard, none of which should ever see this. `id: 0` keeps the scheduler
 * from adding a review block, and `concepts: []` stops the engine drawing extra
 * questions to prove a concept — so the queue is exactly these two, and he has
 * to get both right to pass.
 */
const INTRO_CONCEPT = 'intro' as ConceptId

export const INTRO_CANDLE: Exercise = {
  id: 0,
  title: 'The Shopkeeper Asks',
  level: 1,
  levelName: 'Sound Detectives',
  targetMinutes: 1,
  concepts: [],
  reviewConcepts: [],
  activities: [
    aud('intro-1', INTRO_CONCEPT, 'cat', {
      prompt: 'The shopkeeper leans over the counter. "Spell this one for me."',
    }),
    letters('intro-2', INTRO_CONCEPT, 'dog', {
      prompt: 'One more, and the candle is yours to buy.',
    }),
  ],
  ruleReveal: {
    title: 'The Shopkeeper Nods',
    text: '"Careful hands and a careful head. The candle is yours if you can pay for it — and here is something for your trouble."',
    examples: ['cat', 'dog'],
  },
}
