/**
 * Where the right answer sits among the buttons.
 *
 * Content is authored with the answer first, which is the sensible way to write
 * a question and a terrible way to show one: the left-hand button was correct
 * in 89 of the 95 choice questions in the game, and a nine-year-old works that
 * out long before he works out any spelling. He can then finish exercises,
 * open barriers and earn animal food without reading a word of them.
 *
 * These check the rendered order over the whole content set, because that is
 * the only way the fault is visible — every question is individually fine.
 */
import { describe, expect, it } from 'vitest'
import { choiceOrder } from '../src/spelling/questions/choices'
import { EXERCISES } from '../src/content/exercises'
import { INTRO_CANDLE } from '../src/content/exercises/intro-candle'
import { CONCEPTS } from '../src/content/concepts'
import { GRAMMAR_RULES } from '../src/content/grammar'
import { expectedAnswer } from '../src/spelling/grading'
import { WORD_BANK } from '../src/content/words'
import type { Question } from '../src/spelling/types'

/** Every question anywhere in the game that puts buttons in front of a child. */
const WITH_CHOICES: Question[] = [
  ...INTRO_CANDLE.activities,
  ...EXERCISES.flatMap((e) => e.activities),
  ...[...CONCEPTS.values()].flatMap((c) => c.reviewPool),
  ...GRAMMAR_RULES.flatMap((r) => r.questions),
].filter(
  (q): q is Question =>
    (q.type === 'cloze' || q.type === 'missingPattern') && (q.choices?.length ?? 0) > 1,
)

/** Which button is the right one, as the child sees them laid out this run. */
function answerPosition(question: Question, run = ''): number {
  const choices = (question as { choices?: string[] }).choices ?? []
  const shown = choiceOrder(choices, `${run}:${question.id}`)
  const answer = expectedAnswer(question, WORD_BANK)[0] as string
  return shown.indexOf(answer)
}

/** Share of a set of questions whose answer lands on button `at`, pooled over runs. */
function shareAt(questions: Question[], at: number, runs: number): number {
  let hits = 0
  for (let i = 0; i < runs; i++) {
    for (const q of questions) if (answerPosition(q, `run-${i}`) === at) hits += 1
  }
  return hits / (questions.length * runs)
}

describe('the order the choices are shown in', () => {
  it('has choice questions to be wrong about, and none of them a coin', () => {
    expect(WITH_CHOICES.length).toBeGreaterThan(15)
    // Every one that is left offers three. Two buttons is a coin a child can
    // play without reading, which is the whole reason the rest were rewritten
    // into questions he has to write the answer to.
    for (const q of WITH_CHOICES) {
      expect((q as { choices?: string[] }).choices).toHaveLength(3)
    }
  })

  it('still offers the right answer, wherever it moves it to', () => {
    for (const question of WITH_CHOICES) {
      const choices = (question as { choices?: string[] }).choices ?? []
      const shown = choiceOrder(choices, `run:${question.id}`)
      expect(shown.slice().sort()).toEqual(choices.slice().sort())
      expect(answerPosition(question, 'run')).toBeGreaterThanOrEqual(0)
    }
  })

  it('is even-handed across the whole game, run after run', () => {
    // The fault this replaces sat at 95% on the first button. With three
    // buttons the answer should turn up on each of them about a third of the
    // time; the band is wide enough for chance and far too tight for a bias.
    for (let at = 0; at < 3; at++) {
      const share = shareAt(WITH_CHOICES, at, 60)
      expect(share).toBeGreaterThan(0.25)
      expect(share).toBeLessThan(0.42)
    }
  })

  it('is even-handed inside a single rule, which is where he noticed it', () => {
    // A sack of animal food draws four questions from one rule, so it is the
    // per-rule spread that a child actually experiences — a set that happened
    // to sit at 11 of 14 on the left is the same complaint again, quieter.
    for (const rule of GRAMMAR_RULES) {
      const questions = rule.questions.filter((q) => ((q as { choices?: string[] }).choices?.length ?? 0) > 1)
      if (questions.length === 0) continue
      for (let at = 0; at < 3; at++) {
        const share = shareAt(questions, at, 80)
        expect(share).toBeGreaterThan(0.25)
        expect(share).toBeLessThan(0.42)
      }
    }
  })

  it('lays a question out the same way all through one run', () => {
    // He gets one wrong, the buttons redraw, and the answer must not have
    // swapped sides in the meantime.
    for (const question of WITH_CHOICES.slice(0, 20)) {
      const choices = (question as { choices?: string[] }).choices ?? []
      expect(choiceOrder(choices, `one-run:${question.id}`)).toEqual(
        choiceOrder(choices, `one-run:${question.id}`),
      )
    }
  })

  it('lays the same question out differently on a different run', () => {
    // Otherwise a child who meets a question twice has learned where to click.
    const two = ['yes', 'no']
    const seen = new Set(
      Array.from({ length: 30 }, (_, i) => choiceOrder(two, `run-${i}:same-question`).join('|')),
    )
    expect(seen.size).toBe(2)
  })

  it('lays different questions out differently', () => {
    // A fixed shuffle that moved every answer to the right would be the same
    // fault wearing a hat.
    const two = ['yes', 'no']
    const orders = new Set(
      Array.from({ length: 40 }, (_, i) => choiceOrder(two, `q-${i}`).join('|')),
    )
    expect(orders.size).toBe(2)
  })

  it('leaves a single choice alone', () => {
    expect(choiceOrder(['only'], 'x')).toEqual(['only'])
    expect(choiceOrder([], 'x')).toEqual([])
  })
})
