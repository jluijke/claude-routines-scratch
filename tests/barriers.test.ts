/**
 * Every spelling barrier has to stand between him and something.
 *
 * He noticed one in the middle of a street with nothing behind it; the
 * audit that followed found two dozen more, most of them dungeon doors in
 * the middle of open floors. The rule that found them now runs over every
 * screen, and a synthetic screen proves the rule itself sees what it should.
 */
import { describe, expect, it } from 'vitest'
import { SCREENS } from '../src/game/world/screens'
import type { Screen } from '../src/game/world/screens'
import { gateById } from '../src/game/gates'
import { bypassableBarriers, pointlessBarriers } from '../src/game/world/analysis'

const kindOf = (id: string) => gateById(id)?.kind

describe('the barriers', () => {
  it('every one of them blocks something, on every level', () => {
    const problems = SCREENS.flatMap((s) => pointlessBarriers(s, kindOf))
    expect(problems).toEqual([])
  })

  it('none of the declared ones can be walked round', () => {
    expect(bypassableBarriers()).toEqual([])
  })

  it('sees a seal in an open field for what it is, and a seal in a gap for what it is', () => {
    const base: Screen = {
      id: 'test-field',
      name: 'A field',
      region: 'Test',
      rows: [
        'TTTTTTT..TTTTTTT',
        'T..............T',
        'T..............T',
        'T..............T',
        'T..............T',
        'T..............T',
        'T..............T',
        'T..............T',
        'T..............T',
        'T..............T',
        'TTTTTTT..TTTTTTT',
      ],
      exits: { up: 'village-square' },
      gates: [{ gateId: 'forest-seal', col: 7, row: 5, opens: [{ col: 7, row: 5 }, { col: 8, row: 5 }] }],
    }
    // The way in: a door from somewhere else that lands him at the bottom.
    const door: Screen = {
      id: 'test-door',
      name: 'A door',
      region: 'Test',
      rows: base.rows,
      exits: {},
      portals: [{ col: 1, row: 1, to: 'test-field', spawnCol: 7, spawnRow: 9 }],
    }
    expect(pointlessBarriers(base, kindOf, [...SCREENS, base, door])).toHaveLength(1)

    const hedged: Screen = { ...base, rows: base.rows.map((r, i) => (i === 5 ? 'TTTTTTT==TTTTTTT' : r)) }
    expect(pointlessBarriers(hedged, kindOf, [...SCREENS, hedged, door])).toEqual([])
  })

  it('does not ask a chest to block anything: a chest is the reward', () => {
    const chests = SCREENS.flatMap((s) => (s.gates ?? []).filter((g) => kindOf(g.gateId) === 'chest'))
    expect(chests.length).toBeGreaterThan(5)
  })
})
