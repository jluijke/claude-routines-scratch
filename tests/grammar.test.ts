/**
 * The grammar rules behind a sack of animal food.
 *
 * These questions never go through the content validator — they are not part of
 * the curriculum — so everything that validator would have caught has to be
 * caught here instead: an unanswerable question, a choice list without the
 * right answer in it, a pool too thin to stop repeats.
 */
import { describe, expect, it } from 'vitest'
import { drawGrammar, GRAMMAR_QUESTIONS, GRAMMAR_RULES } from '../src/content/grammar'
import { expectedAnswer, grade } from '../src/spelling/grading'
import { WORD_BANK } from '../src/content/words'
import { Rng } from '../src/core/rng'

describe('the six rules', () => {
  it('is six of them, each stated and shown', () => {
    expect(GRAMMAR_RULES).toHaveLength(6)
    for (const rule of GRAMMAR_RULES) {
      expect(rule.title.trim().length).toBeGreaterThan(0)
      expect(rule.text.trim().length).toBeGreaterThan(0)
      expect(rule.examples.length).toBeGreaterThanOrEqual(2)
      expect(rule.reminder.trim().length).toBeGreaterThan(0)
    }
  })

  it('has pools deep enough that four are rarely four he has just done', () => {
    for (const rule of GRAMMAR_RULES) {
      // Twelve is the point where the number of possible sets of four runs to
      // the hundreds. Fewer than that and repeats stop being a coincidence.
      expect(rule.questions.length).toBeGreaterThanOrEqual(12)
    }
  })

  it('never uses one question id twice', () => {
    const ids = GRAMMAR_RULES.flatMap((r) => r.questions.map((q) => q.id))
    expect(new Set(ids).size).toBe(ids.length)
  })
})

describe('every question is answerable', () => {
  const all = GRAMMAR_RULES.flatMap((r) => r.questions)

  it.each(all.map((q) => [q.id] as const))('%s can be got right', (id) => {
    const question = all.find((q) => q.id === id)
    if (!question || question.type !== 'cloze') throw new Error(`${id} is not a cloze`)

    // A gap to fill, choices to fill it from, and the right one among them.
    expect(question.sentence).toContain('___')
    expect(question.choices?.length ?? 0).toBeGreaterThanOrEqual(2)
    expect(question.choices).toContain(question.answer)

    // And the grader agrees, which is what a child actually meets. The wrong
    // choice must be genuinely wrong: several of these differ only by a capital
    // or an apostrophe, and a question whose two answers both pass is worse
    // than no question at all.
    const right = grade(question, { kind: 'text', value: question.answer }, WORD_BANK)
    expect(right.correct).toBe(true)
    for (const choice of question.choices ?? []) {
      if (choice === question.answer) continue
      expect(grade(question, { kind: 'text', value: choice }, WORD_BANK).correct).toBe(false)
    }
    expect(expectedAnswer(question, WORD_BANK)).toEqual([question.answer])
  })
})

describe('drawing a sack of questions', () => {
  const shuffle = (seed: string) => <T,>(list: readonly T[]): T[] => new Rng(seed).shuffle(list)

  it('asks four, from the rule whose turn it is', () => {
    for (let i = 0; i < GRAMMAR_RULES.length; i++) {
      const drawn = drawGrammar(i, [], shuffle(`s${i}`))
      expect(drawn.rule.id).toBe(GRAMMAR_RULES[i]?.id)
      expect(drawn.questions).toHaveLength(GRAMMAR_QUESTIONS)
      for (const q of drawn.questions) {
        expect(drawn.rule.questions.some((r) => r.id === q.id)).toBe(true)
      }
    }
  })

  it('comes round again after six, so all six are met', () => {
    expect(drawGrammar(6, [], shuffle('a')).rule.id).toBe(GRAMMAR_RULES[0]?.id)
    expect(drawGrammar(13, [], shuffle('a')).rule.id).toBe(GRAMMAR_RULES[1]?.id)
  })

  it('holds back the ones he has just been asked', () => {
    const first = drawGrammar(0, [], shuffle('one'))
    const asked = first.questions.map((q) => q.id)
    const second = drawGrammar(0, asked, shuffle('two'))
    for (const q of second.questions) expect(asked).not.toContain(q.id)
  })

  it('still asks four when almost everything has been asked', () => {
    // Rather than a short exercise, the filter is dropped. A child who has
    // fed his animal all afternoon still gets four questions.
    const rule = GRAMMAR_RULES[0]
    const nearlyAll = (rule?.questions ?? []).slice(0, -1).map((q) => q.id)
    expect(drawGrammar(0, nearlyAll, shuffle('three')).questions).toHaveLength(GRAMMAR_QUESTIONS)
  })

  it('points a hint back at the rule rather than at a spelling pattern', () => {
    const drawn = drawGrammar(2, [], shuffle('four'))
    for (const q of drawn.questions) {
      expect(q.hints?.[3]).toBe(drawn.rule.reminder)
    }
  })
})
