import { describe, expect, it } from 'vitest'
import { tileOrder } from '../src/spelling/questions/wordSort'
import { CONCEPTS } from '../src/content/concepts'
import { EXERCISES } from '../src/content/exercises'
import type { Question, WordSortQuestion } from '../src/spelling/types'

/** Every sorting activity in the game, exercises and review pools alike. */
function everySort(): WordSortQuestion[] {
  const all: Question[] = [
    ...EXERCISES.flatMap((e) => e.activities),
    ...[...CONCEPTS.values()].flatMap((c) => c.reviewPool),
  ]
  return all.filter((q): q is WordSortQuestion => q.type === 'wordSort')
}

/** The old behaviour: box one's words, then box two's. */
function authored(question: WordSortQuestion): string[] {
  return question.groups.flatMap((g) => g.words)
}

describe('the order the sorting tiles are laid out in', () => {
  const sorts = everySort()

  it('finds the sorting activities to check', () => {
    expect(sorts.length).toBeGreaterThan(20)
  })

  it('shows every word exactly once', () => {
    for (const question of sorts) {
      const shown = tileOrder(question.groups, `sort-${question.id}`)
      expect([...shown].sort()).toEqual([...authored(question)].sort())
    }
  })

  it('never lays the tiles out in answer order', () => {
    for (const question of sorts) {
      const shown = tileOrder(question.groups, `sort-${question.id}`)
      expect(shown, `${question.id} shows the answer key`).not.toEqual(authored(question))
    }
  })

  it('never groups the boxes together, even in some other order', () => {
    // The real fault is not "identical to the authored list" but "all of box
    // one, then all of box two" — which a plain shuffle can still land on.
    for (const question of sorts) {
      const shown = tileOrder(question.groups, `sort-${question.id}`)
      const groupOf = new Map<string, number>()
      question.groups.forEach((group, index) => {
        for (const word of group.words) groupOf.set(word, index)
      })
      const indices = shown.map((word) => groupOf.get(word) ?? -1)
      const clustered = indices.every((n, i) => i === 0 || n >= (indices[i - 1] as number))
      expect(clustered, `${question.id} still comes out grouped`).toBe(false)
    }
  })

  it('lays the same question out the same way twice', () => {
    // He can leave an exercise and come back to it, and a wrong answer re-reads
    // the same view. Tiles moving about between those would be maddening.
    for (const question of sorts) {
      const once = tileOrder(question.groups, `sort-${question.id}`)
      const twice = tileOrder(question.groups, `sort-${question.id}`)
      expect(twice).toEqual(once)
    }
  })

  it('lays different questions out differently', () => {
    const shapes = new Map<string, string[]>()
    for (const question of sorts) shapes.set(question.id, tileOrder(question.groups, `sort-${question.id}`))
    expect(shapes.size).toBe(sorts.length)
  })

  it('leaves a two-word sort alone, having nowhere to hide the answer', () => {
    const groups = [{ label: 'a', words: ['one'] }, { label: 'b', words: ['two'] }]
    expect(tileOrder(groups, 'sort-tiny')).toEqual(['one', 'two'])
  })
})
