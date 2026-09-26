/**
 * The cars, and the lights.
 *
 * Traffic is read off the tiles and driven by one clock, so most of what
 * could go wrong is arithmetic: a lane found where there is no road, a lane
 * running the wrong way, a car that stops in the middle of an intersection or
 * drives through a red light. These pin each of those down without a
 * browser.
 */
import { describe, expect, it } from 'vitest'
import { screenById } from '../src/game/world/screens'
import {
  ALL_RED,
  CAR_LENGTH,
  FLASH_FRAMES,
  LIGHT_CYCLE,
  Traffic,
  greenAxis,
  lanesOf,
  stopLineAhead,
  walkAcross,
  walkFlashing,
} from '../src/game/traffic'
import type { Screen } from '../src/game/world/screens'
import { Rng } from '../src/core/rng'
import { TILE } from '../src/game/world/tiles'

const screen = (id: string): Screen => {
  const s = screenById(id)
  if (!s) throw new Error(`no screen ${id}`)
  return s
}

describe('the lanes, read off the tiles', () => {
  it('finds four lanes up a four-lane avenue and two along its cross street', () => {
    const lanes = lanesOf(screen('nyc-sixth-ave'))
    const up = lanes.filter((l) => l.axis === 'y')
    const across = lanes.filter((l) => l.axis === 'x')
    expect(up.map((l) => l.at)).toEqual([6, 7, 8, 9])
    expect(across.map((l) => l.at)).toEqual([4, 5])
    // Sixth Avenue runs uptown, all four lanes of it.
    for (const l of up) expect(l.dir).toBe(-1)
    // The cross street is two-way: the upper lane runs left, the lower right.
    expect(across.map((l) => l.dir)).toEqual([-1, 1])
    // Avenues are quick, streets are not.
    expect(up[0]?.speed).toBeGreaterThan(across[0]?.speed ?? 0)
  })

  it('finds two lanes along a street, running opposite ways', () => {
    const lanes = lanesOf(screen('nyc-bleecker'))
    expect(lanes.map((l) => [l.axis, l.at, l.dir])).toEqual([
      ['x', 4, -1],
      ['x', 5, 1],
    ])
  })

  it('runs a one-way avenue downtown when told to', () => {
    for (const l of lanesOf(screen('nyc-broadway')).filter((l) => l.axis === 'y')) expect(l.dir).toBe(1)
    for (const l of lanesOf(screen('nyc-avenue-a')).filter((l) => l.axis === 'y')) expect(l.dir).toBe(-1)
  })

  it('finds no lanes in a park, or in a shop', () => {
    expect(lanesOf(screen('nyc-washington-square'))).toEqual([])
    expect(lanesOf(screen('nyc-bodega'))).toEqual([])
  })

  it('does not count a stub of side street as a lane', () => {
    // St Marks Place has a side street going down and none going up: the
    // road runs from the main street to the bottom edge, seven tiles, which
    // is a driveway as far as traffic is concerned.
    const lanes = lanesOf(screen('nyc-st-marks'))
    expect(lanes.filter((l) => l.axis === 'y')).toEqual([])
  })

  it('knows where the crosswalks are on every lane', () => {
    const lanes = lanesOf(screen('nyc-sixth-ave'))
    const upLane = lanes.find((l) => l.axis === 'y' && l.at === 6)
    // Either side of the cross street: row 3 above it, row 6 below.
    expect(upLane?.crosswalks).toEqual([3, 6])
  })
})

describe('the lights', () => {
  it('give the avenues the first half of the cycle and the streets the second', () => {
    expect(greenAxis(0)).toBe('y')
    expect(greenAxis(LIGHT_CYCLE / 2 - 1)).toBe('y')
    expect(greenAxis(LIGHT_CYCLE / 2)).toBe('x')
    expect(greenAxis(LIGHT_CYCLE - 1)).toBe('x')
    expect(greenAxis(LIGHT_CYCLE)).toBe('y')
  })

  it('let him cross a road only while it is red, once the crossing has cleared', () => {
    // The first moment of a red is the all-red: whatever was in the
    // intersection is still driving out of it, over the crosswalk.
    expect(walkAcross('x', 10)).toBe(false)
    expect(walkAcross('x', ALL_RED)).toBe(true)
    expect(walkAcross('y', ALL_RED)).toBe(false)
    expect(walkAcross('x', LIGHT_CYCLE / 2 + ALL_RED)).toBe(false)
    expect(walkAcross('y', LIGHT_CYCLE / 2 + ALL_RED)).toBe(true)
  })

  it('never seeds a car inside an intersection', () => {
    for (let i = 0; i < 40; i++) {
      const traffic = new Traffic(screen('nyc-sixth-ave'), new Rng(`seed-${i}`))
      for (const car of traffic.cars) {
        if (car.lane.axis !== 'x') continue
        // The cross street's intersection with the avenue is columns 6 to 9.
        expect(car.pos + CAR_LENGTH / 2 <= 6 * TILE || car.pos - CAR_LENGTH / 2 >= 10 * TILE, `car at ${car.pos}`).toBe(true)
      }
    }
  })

  it('flash the hand for the last moment of the walk, and not before', () => {
    const half = LIGHT_CYCLE / 2
    expect(walkFlashing('x', half - FLASH_FRAMES - 1)).toBe(false)
    expect(walkFlashing('x', half - FLASH_FRAMES)).toBe(true)
    expect(walkFlashing('x', half - 1)).toBe(true)
    expect(walkFlashing('x', half)).toBe(false)
  })
})

describe('a car on the road', () => {
  const lane = () => lanesOf(screen('nyc-sixth-ave')).find((l) => l.axis === 'x' && l.at === 5) as ReturnType<typeof lanesOf>[number]

  it('stops at the first crosswalk in its way', () => {
    const l = lane()
    // Rightward on row 5, with crosswalks at columns 5 and 10.
    expect(l.dir).toBe(1)
    expect(l.crosswalks).toEqual([5, 10])
    const car = { lane: l, pos: 2 * TILE, kind: 'taxi' as const }
    expect(stopLineAhead(car)).toBe(5 * TILE)
  })

  it('does not stop in the middle of the intersection', () => {
    const l = lane()
    // Past the first crosswalk and between it and the second: drive on out.
    const car = { lane: l, pos: 7 * TILE + 8, kind: 'taxi' as const }
    expect(stopLineAhead(car)).toBeUndefined()
    // Clear of the intersection and onto the far side: nothing ahead at all.
    const beyond = { lane: l, pos: 13 * TILE, kind: 'taxi' as const }
    expect(stopLineAhead(beyond)).toBeUndefined()
  })

  it('holds at a red light and goes on green', () => {
    const traffic = new Traffic(screen('nyc-sixth-ave'), new Rng('quiet'))
    const l = lane()
    traffic.cars = [{ lane: l, pos: 2 * TILE, kind: 'taxi' }]
    // The street is red for the first half of the cycle.
    for (let f = 0; f < 200; f++) traffic.update(1 / 60, f)
    const held = traffic.cars.find((c) => c.lane === l)
    expect(held).toBeDefined()
    // Its nose is at the stop line, not past it.
    expect((held?.pos ?? 0) + CAR_LENGTH / 2).toBeCloseTo(5 * TILE, 0)
    // Green: it moves off.
    for (let f = LIGHT_CYCLE / 2; f < LIGHT_CYCLE / 2 + 30; f++) traffic.update(1 / 60, f)
    expect((traffic.cars.find((c) => c.lane === l)?.pos ?? 0) + CAR_LENGTH / 2).toBeGreaterThan(5 * TILE + 10)
  })

  it('queues behind the car in front rather than driving through it', () => {
    const traffic = new Traffic(screen('nyc-sixth-ave'), new Rng('queue'))
    const l = lane()
    traffic.cars = [
      { lane: l, pos: 3 * TILE, kind: 'taxi' },
      { lane: l, pos: 0, kind: 'carBlue' },
    ]
    for (let f = 0; f < 240; f++) traffic.update(1 / 60, f)
    const [front, back] = traffic.cars.filter((c) => c.lane === l).sort((a, b) => b.pos - a.pos)
    expect(front).toBeDefined()
    expect(back).toBeDefined()
    expect((front?.pos ?? 0) - (back?.pos ?? 0)).toBeGreaterThanOrEqual(CAR_LENGTH + 5)
  })

  it('leaves the screen at the far end and is gone', () => {
    const traffic = new Traffic(screen('nyc-bleecker'), new Rng('gone'))
    const l = lanesOf(screen('nyc-bleecker')).find((x) => x.dir === 1) as ReturnType<typeof lanesOf>[number]
    traffic.cars = [{ lane: l, pos: 15 * TILE, kind: 'carRed' }]
    // Green for streets is the second half; a second of it takes it off the edge.
    for (let f = LIGHT_CYCLE / 2; f < LIGHT_CYCLE / 2 + 70; f++) traffic.update(1 / 60, f)
    expect(traffic.cars.find((c) => c.pos === 15 * TILE)).toBeUndefined()
    for (const c of traffic.cars) expect(c.pos).toBeLessThanOrEqual(16 * TILE + CAR_LENGTH)
  })

  it('keeps the streets busy without spawning a car onto another', () => {
    const traffic = new Traffic(screen('nyc-sixth-ave'), new Rng('busy'))
    let most = 0
    for (let f = 0; f < LIGHT_CYCLE * 3; f++) {
      traffic.update(1 / 60, f)
      most = Math.max(most, traffic.cars.length)
      for (const a of traffic.cars) {
        for (const b of traffic.cars) {
          if (a === b || a.lane !== b.lane) continue
          expect(Math.abs(a.pos - b.pos)).toBeGreaterThanOrEqual(CAR_LENGTH)
        }
      }
    }
    expect(most).toBeGreaterThan(2)
  })
})
