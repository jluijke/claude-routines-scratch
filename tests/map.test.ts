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
  walledInFeatures,
  strandedFeatures,
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

  // The entrance to the first dungeon spent the life of this project sealed
  // inside its own rock box, unreachable. Nothing caught it, because the old
  // door check only asked whether a door had an open tile beside it — which a
  // walled-in pocket does.
  describe('places you can actually get to', () => {
    it('finds nothing walled in anywhere in the world', () => {
      expect(SCREENS.flatMap(walledInFeatures)).toEqual([])
    })

    it('catches a doorway sealed inside a rock box', () => {
      const shrine = {
        ...(screenById('forest-6') as Screen),
        // The shrine exactly as it was authored: solid rock under the doors.
        rows: [
          'TTTTTTTTTTTTTTTT',
          'T....*....*....T',
          'T..............T',
          'T....RRRRRR....T',
          'T....R.DD.R....T',
          'T....RRRRRR....T',
          'T......,,......T',
          'T..............T',
          'T....,....,....T',
          'T..............T',
          'TTTTTTT..TTTTTTT',
        ],
      } as Screen
      const problems = walledInFeatures(shrine)
      expect(problems.some((p) => p.includes('d1-entrance'))).toBe(true)
    })

    it('does not mind a barrier that merely needs opening', () => {
      // A seal or a cracked wall is a door, not a wall.
      expect(walledInFeatures(screenById('graveyard-1') as Screen)).toEqual([])
      expect(walledInFeatures(screenById('mountain-2') as Screen)).toEqual([])
    })

    it('finds nothing stranded on any screen he walks onto', () => {
      expect(SCREENS.flatMap(strandedFeatures)).toEqual([])
    })

    it('catches a door only its own far side can vouch for', () => {
      // The real fault: the boulder on the forest path was planted against the
      // treeline, the scenery pass grew a wall around the one tile he can
      // stand on to bomb it, and the cave behind it became unreachable on
      // foot. walledInFeatures stayed quiet because it counts arriving through
      // a door as a way in — and the cave's own return spawn sat inside the
      // sealed pocket, so the unreachable door vouched for itself.
      const sealed = {
        ...(screenById('forest-3') as Screen),
        rows: [
          'TTTTTTT..TTTTTTT',
          'TTTTT,....TTT,TT',
          'T..T.....TTT...T',
          'TTT........RXRTT',
          'TTTT.......RRRTT',
          'TT..T.......T..T',
          'TT............TT',
          '.....,....,...TT',
          'T.............TT',
          'T.TT..T..T...TTT',
          'TTTTTTT..TTTTTTT',
        ],
        portals: [{ col: 12, row: 3, to: 'map-cave', spawnCol: 12, spawnRow: 2 }],
      } as Screen
      // Verified against the data as it stood: walledInFeatures(forest-3)
      // returned [] while the cave was unreachable on foot, because the cave's
      // return spawn sat at 12,2 inside the sealed pocket. That cannot be
      // reproduced from here — the seeding reads the live screen list — so
      // this asserts the new check catches the shape of it.
      expect(strandedFeatures(sealed).some((p) => p.includes('map-cave'))).toBe(true)
    })
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
