import { describe, expect, it } from 'vitest'
import {
  bodyFits,
  brokenExits,
  bypassableBarriers,
  isSolid,
  layoutConflicts,
  stepBackFromGate,
  trappingGates,
  unmarkedBarriers,
  unreachableDoors,
  workingLines,
} from '../src/game/world/analysis'
import { screenById, SCREENS } from '../src/game/world/screens'
import { gateById } from '../src/game/gates'
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

  // Twenty-three barriers once drew nothing whatsoever: every sealed chest,
  // the shrine keeper, the ferryman. A child walked onto blank grass and a
  // prompt appeared out of thin air.
  describe('barriers you can see', () => {
    const kindOf = (id: string) => gateById(id)?.kind

    it('leaves nothing in the world invisible', () => {
      expect(SCREENS.flatMap((screen) => unmarkedBarriers(screen, kindOf))).toEqual([])
    })

    it('catches a barrier dropped on plain grass with no art', () => {
      const screen = {
        ...(screenById('village-square') as Screen),
        id: 'test-screen',
        props: [],
        gates: [{ gateId: 'graveyard-wall', col: 8, row: 8 }],
      } as Screen
      // A hidden way through has to sit on something worth trying a bomb on.
      expect(unmarkedBarriers(screen, kindOf)).toHaveLength(1)
    })

    it('accepts a hidden way through when the tile itself shows it', () => {
      const screen = {
        ...(screenById('graveyard-1') as Screen),
        gates: [{ gateId: 'graveyard-wall', col: 2, row: 5 }],
      } as Screen
      expect(unmarkedBarriers(screen, kindOf)).toEqual([])
    })
  })

  // A child spent his save stuck inside a rock in Forest Hollow: opening a
  // barrier shoved him ten pixels with no check, and once a corner of his body
  // was inside a wall nothing could move him again.
  describe('standing back from a barrier', () => {
    // The rule only ever returns somewhere `fits` accepted, so this guards
    // against a future edit dropping that check rather than proving today's
    // map safe. The end-to-end proof is tools/stuck-smoke.mjs.
    it('never returns a spot inside a wall, for any barrier in the game', () => {
      const problems = SCREENS.flatMap((screen) => trappingGates(screen))
      expect(problems).toEqual([])
    })

    it('steps away from the door rather than in a fixed direction', () => {
      const hollow = screenById('forest-4') as Screen
      // The exact spot that trapped him: right of the hermit's barrier at 4,5.
      const from = { x: 74, y: 78 }
      expect(bodyFits(hollow, from.x, from.y)).toBe(true)
      const landed = stepBackFromGate({ col: 4, row: 5 }, from, (x, y) => bodyFits(hollow, x, y))
      expect(bodyFits(hollow, landed.x, landed.y)).toBe(true)
      // Away from the door means rightwards here, not up into the rock.
      expect(landed.x).toBeGreaterThan(from.x)
    })

    it('stays put rather than step into a wall when nothing is free', () => {
      const boxed = blank([
        ...Array(5).fill('################'),
        '#######.########',
        ...Array(5).fill('################'),
      ])
      const from = { x: 7 * 16 + 2, y: 5 * 16 + 2 }
      const landed = stepBackFromGate({ col: 7, row: 4 }, from, (x, y) => bodyFits(boxed, x, y))
      expect(landed).toEqual(from)
    })
  })
})
