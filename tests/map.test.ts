import { describe, expect, it } from 'vitest'
import {
  brokenExits,
  bypassableBarriers,
  isSolid,
  layoutConflicts,
  unreachableDoors,
  workingLines,
} from '../src/game/world/analysis'
import { screenById, SCREENS } from '../src/game/world/screens'
import type { Screen } from '../src/game/world/screens'

describe('the world joins up', () => {
  it('never drops the player inside a wall or a river', () => {
    // The bug that stranded a real child: walking into The Crossing put him in
    // the middle of the water with every direction blocked.
    expect(brokenExits()).toEqual([])
  })

  it('can be drawn on a single map', () => {
    expect(layoutConflicts()).toEqual([])
  })

  it('has no door you cannot walk up to', () => {
    // The shop door sat in the top row of its building with wall beneath it.
    expect(unreachableDoors()).toEqual([])
  })

  it('has no barrier you can simply walk around', () => {
    // A two-tile seal in a fourteen-tile field is decoration, and the exercise
    // behind it never gets asked.
    expect(bypassableBarriers()).toEqual([])
  })
})

describe('the checks themselves', () => {
  const blank = (rows: string[]): Screen => ({
    id: 'test',
    name: 'Test',
    region: 'Test',
    rows,
    exits: {},
  })

  it('treats water as solid, because the Wings must never be required', () => {
    const screen = blank(Array(11).fill('T~~~~~~~~~~~~~~T'))
    expect(isSolid(screen, 7, 5)).toBe(true)
  })

  it('rejects a landing tile that is walled in even though it is walkable', () => {
    const from = blank(Array(11).fill('...............' + '.'))
    // Column 1 is open but boxed in by rock on every side.
    const to = blank([
      ...Array(5).fill('#RRRRRRRRRRRRRR#'),
      '#R#RRRRRRRRRRRR#'.slice(0, 16),
      ...Array(5).fill('#RRRRRRRRRRRRRR#'),
    ])
    expect(workingLines(from, 'right', to)).toEqual([])
  })

  it('finds the working line for a real pair of screens', () => {
    const crossing = screenById('river-bridge') as Screen
    const forest = screenById('forest-3') as Screen
    const lines = workingLines(crossing, 'right', forest)
    expect(lines.length).toBeGreaterThan(0)
    // And it is on the bank, not out in the river.
    for (const row of lines) expect(isSolid(crossing, 14, row)).toBe(false)
  })

  it('covers every screen', () => {
    expect(SCREENS.length).toBeGreaterThan(40)
  })
})
