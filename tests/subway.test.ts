/**
 * The subway: the line, the stations, the fare, and the ride.
 *
 * Most of what could go wrong is in the joins — a stairway that comes down
 * into the wrong station, a turnstile that can be walked round, a platform
 * that is not on the line — and in the ride's clock, which is pure
 * arithmetic and can be proved without a train.
 */
import { describe, expect, it } from 'vitest'
import { screenById, SCREENS } from '../src/game/world/screens'
import { gateById } from '../src/game/gates'
import { bypassableBarriers, overworldLayout } from '../src/game/world/analysis'
import { START_SCREENS } from '../src/game/levels'
import { ITEMS } from '../src/game/items'
import { SPRITES } from '../src/game/render/sprites'
import {
  beginRide,
  directionsFrom,
  DOORS_FRAMES,
  isUnderground,
  MOVING_FRAMES,
  nextStop,
  rideProgress,
  stationIndex,
  stationsVisited,
  STOPS,
  stopIndex,
  tickRide,
  TRAIN_CAR,
  EXPRESS_EVERY,
  EXPRESS_WARNING,
  expressPhase,
  type Ride,
} from '../src/game/world/subway'
import { splitLabel } from '../src/game/render/map'

const screen = (id: string) => {
  const s = screenById(id)
  if (!s) throw new Error(`no screen ${id}`)
  return s
}

describe('the line', () => {
  it('runs through eleven stops, every one of them a platform', () => {
    expect(STOPS.length).toBe(11)
    for (const stop of STOPS) {
      const platform = screen(stop.id)
      expect(platform.setting).toBe('platform')
      expect(platform.level).toBe(3)
      // The train stands at it: two rows of car over the tracks, shorter
      // than the platform, so the pit shows at either end.
      expect(platform.rows[6]).toBe('~~BBBBBBBBBBBB~~')
      expect(platform.rows[7]).toBe('~~BBBBBBBBBBBB~~')
      expect(platform.rows[8]?.startsWith('~')).toBe(true)
    }
    expect(stopIndex('nyc-sub-w4-platform')).toBe(4)
    expect(stopIndex('nyc-washington-square')).toBe(-1)
  })

  it('offers both ways from the middle and one way from each end', () => {
    expect(Object.keys(directionsFrom(0))).toEqual(['downtown', 'expressDowntown'])
    expect(Object.keys(directionsFrom(STOPS.length - 1))).toEqual(['uptown', 'expressUptown'])
    const middle = directionsFrom(2)
    expect(middle.uptown?.id).toBe(STOPS[1]?.id)
    expect(middle.downtown?.id).toBe(STOPS[3]?.id)
  })

  it('knows which station a mezzanine or passage belongs to', () => {
    expect(stationIndex('nyc-sub-astor-mezz')).toBe(2)
    expect(stationIndex('nyc-sub-astor-passage')).toBe(2)
    expect(stationIndex('nyc-sub-astor-platform')).toBe(2)
    expect(stationIndex(TRAIN_CAR)).toBe(-1)
    expect(stationIndex('nyc-bleecker')).toBe(-1)
    // Standing on the mezzanine counts as having been to the station.
    expect(stationsVisited(['nyc-sub-w4-mezz', 'nyc-sheridan-square'])).toEqual(['nyc-sub-w4-platform'])
  })

  it('is underground on a platform and in the train, and nowhere else', () => {
    expect(isUnderground('platform')).toBe(true)
    expect(isUnderground('train')).toBe(true)
    expect(isUnderground('street')).toBe(false)
    expect(isUnderground(undefined)).toBe(false)
  })
})

describe('the stations', () => {
  const keys = ['59st', 'union', 'astor', '2av', 'w4', 'christopher', 'canal', 'atlantic', 'brighton', 'coney']

  it('are each three screens deep: mezzanine, passage, platform', () => {
    for (const key of keys) {
      const mezz = screen(`nyc-sub-${key}-mezz`)
      const passage = screen(`nyc-sub-${key}-passage`)
      const platform = screen(`nyc-sub-${key}-platform`)
      expect(mezz.exits).toEqual({ down: passage.id })
      expect(passage.exits).toEqual({ up: mezz.id, down: platform.id })
      expect(platform.exits).toEqual({ up: passage.id })
    }
  })

  it('come down from the street and go back up to the same street', () => {
    for (const key of keys) {
      const mezz = screen(`nyc-sub-${key}-mezz`)
      const up = mezz.portals?.find((p) => p.to !== mezz.id)
      expect(up, key).toBeDefined()
      const street = screen(up?.to as string)
      const down = street.portals?.find((p) => p.to === mezz.id)
      expect(down, `${street.id} has stairs down to ${mezz.id}`).toBeDefined()
      // The stairs on the street are drawn as stairs.
      expect(street.rows[down?.row as number]?.[down?.col as number]).toBe('^')
      expect(mezz.rows[up?.row as number]?.[up?.col as number]).toBe('^')
    }
  })

  it('have a turnstile between the stairs and the platform, on every one', () => {
    for (const key of keys) {
      const mezz = screen(`nyc-sub-${key}-mezz`)
      const placement = mezz.gates?.find((g) => g.gateId === `nyc-turnstile-${key}`)
      expect(placement, key).toBeDefined()
      expect(placement?.guards).toBe('down')
      const gate = gateById(`nyc-turnstile-${key}`)
      expect(gate?.kind).toBe('turnstile')
      expect(gate?.challenge).toBe('turnstile')
      // Not a curriculum door, and not one the governor opens for free.
      expect(gate?.optional).toBeUndefined()
      for (const tile of placement?.opens ?? []) expect(mezz.rows[tile.row]?.[tile.col]).toBe('=')
    }
    // And none of them can be walked round.
    const underground = SCREENS.filter((s) => s.id.startsWith('nyc-sub-'))
    expect(bypassableBarriers(underground)).toEqual([])
  })

  it('keep the platform at least a screen away from the turnstile', () => {
    for (const key of keys) {
      const mezz = screen(`nyc-sub-${key}-mezz`)
      expect(stopIndex(mezz.exits.down as string)).toBe(-1)
    }
  })

  it('are not on the street map, and the far ends are only reached by train', () => {
    const { cells } = overworldLayout(START_SCREENS[3])
    for (const id of cells.keys()) expect(id.startsWith('nyc-sub-')).toBe(false)
    for (const id of ['nyc-union-square', 'nyc-trump-green', 'nyc-columbus-park', 'nyc-atlantic-terminal', 'nyc-boardwalk', 'nyc-coney-island']) {
      expect(cells.has(id)).toBe(false)
      expect(screen(id).exits).toEqual({})
    }
    expect(screen('nyc-union-square').treasure).toBeDefined()
    expect(screen('nyc-atlantic-terminal').treasure).toBeDefined()
  })

  it('leave the other subway stairs off the streets that have no station', () => {
    for (const id of ['nyc-fifth-ave', 'nyc-second-ave', 'nyc-avenue-a']) {
      const s = screen(id)
      expect(s.rows.some((r) => r.includes('^')), id).toBe(false)
    }
  })
})

describe('the subway map', () => {
  it('is an item with a picture, free, lying on the West 4th mezzanine', () => {
    expect(ITEMS.subwayMap.price).toBeUndefined()
    expect(ITEMS.subwayMap.city?.price).toBeUndefined()
    expect(SPRITES.subwayMap.width).toBe(16)
    const mezz = screen('nyc-sub-w4-mezz')
    expect(mezz.pickup?.item).toBe('subwayMap')
    // Before the turnstile, so it costs nothing to reach.
    expect(mezz.pickup?.row).toBeLessThan(6)
  })

  it('breaks a long name so it fits its slot', () => {
    expect(splitLabel('14 ST-UNION SQ')).toEqual(['14 ST', 'UNION SQ'])
    expect(splitLabel('BRIGHTON BEACH')).toEqual(['BRIGHTON', 'BEACH'])
    expect(splitLabel('W 4 ST')).toEqual(['W 4 ST'])
  })
})

describe('the ride', () => {
  it('moves for a while, then stands at the next stop with the doors open', () => {
    let ride = beginRide(3, -1)
    expect(ride.phase).toBe('moving')
    expect(nextStop(ride).id).toBe(STOPS[2]?.id)
    let arrivals = 0
    for (let f = 0; f < MOVING_FRAMES; f++) {
      const step = tickRide(ride)
      ride = step.ride
      if (step.event === 'arrive') arrivals += 1
    }
    expect(arrivals).toBe(1)
    expect(ride.phase).toBe('doors')
    expect(ride.index).toBe(2)
    expect(ride.frames).toBe(DOORS_FRAMES)
    expect(nextStop(ride).id).toBe(STOPS[2]?.id)
  })

  it('closes the doors and goes on if he does not get off', () => {
    let ride: Ride = { ...beginRide(3, -1), index: 2, phase: 'doors', frames: 2 }
    let departed = false
    for (let f = 0; f < 2; f++) {
      const step = tickRide(ride)
      ride = step.ride
      if (step.event === 'depart') departed = true
    }
    expect(departed).toBe(true)
    expect(ride.phase).toBe('moving')
    expect(ride.dir).toBe(-1)
    expect(nextStop(ride).id).toBe(STOPS[1]?.id)
  })

  it('turns round at the end of the line', () => {
    let ride: Ride = { ...beginRide(1, -1), index: 0, phase: 'doors', frames: 1 }
    ride = tickRide(ride).ride
    expect(ride.dir).toBe(1)
    expect(ride.index).toBe(0)
    expect(nextStop(ride).id).toBe(STOPS[1]?.id)
    let other: Ride = { ...beginRide(3, 1), index: STOPS.length - 1, phase: 'doors', frames: 1 }
    other = tickRide(other).ride
    expect(other.dir).toBe(-1)
  })

  it('reports where on the line the train is, for the map', () => {
    const ride = beginRide(1, 1)
    expect(rideProgress(ride)).toBe(1)
    const half = { ...ride, frames: MOVING_FRAMES / 2 }
    expect(rideProgress(half)).toBeCloseTo(1.5)
    const back = { ...beginRide(3, -1), frames: MOVING_FRAMES / 4 }
    expect(rideProgress(back)).toBeCloseTo(2.25)
    expect(rideProgress({ ...ride, index: 2, phase: 'doors' })).toBe(2)
  })

  it('has a car with doors along the bottom and no way out but them', () => {
    const car = screen(TRAIN_CAR)
    expect(car.setting).toBe('train')
    expect(car.exits).toEqual({})
    expect(car.portals ?? []).toEqual([])
    expect(car.rows[9]).toBe('####HH####HH####')
  })
})

describe('the express', () => {
  it('is offered only where there is a stop to skip', () => {
    const middle = directionsFrom(4)
    expect(middle.expressUptown?.id).toBe(STOPS[2]?.id)
    expect(middle.expressDowntown?.id).toBe(STOPS[6]?.id)
    expect(directionsFrom(1).expressUptown).toBeUndefined()
    expect(directionsFrom(STOPS.length - 2).expressDowntown).toBeUndefined()
  })

  it('goes two stops a leg, and the doors do not open at the one between', () => {
    let ride = beginRide(4, 1, true)
    expect(nextStop(ride).id).toBe(STOPS[6]?.id)
    const arrivals: number[] = []
    for (let f = 0; f < MOVING_FRAMES + DOORS_FRAMES + MOVING_FRAMES; f++) {
      const step = tickRide(ride)
      ride = step.ride
      if (step.event === 'arrive') arrivals.push(ride.index)
    }
    expect(arrivals).toEqual([6, 8])
  })

  it('runs to the end of the line and no further, then turns round', () => {
    let ride = beginRide(STOPS.length - 2, 1, true)
    expect(nextStop(ride).id).toBe(STOPS[STOPS.length - 1]?.id)
    for (let f = 0; f < MOVING_FRAMES; f++) ride = tickRide(ride).ride
    expect(ride.index).toBe(STOPS.length - 1)
    for (let f = 0; f < DOORS_FRAMES; f++) ride = tickRide(ride).ride
    expect(ride.dir).toBe(-1)
    expect(nextStop(ride).id).toBe(STOPS[STOPS.length - 3]?.id)
  })

  it('draws its progress over the two stops it covers', () => {
    const ride = { ...beginRide(4, 1, true), frames: MOVING_FRAMES / 2 }
    expect(rideProgress(ride)).toBeCloseTo(5)
  })

  it('comes through the far track with two seconds of warning first', () => {
    const phases = new Set<string>()
    let warningFrames = 0
    for (let f = 0; f < EXPRESS_EVERY; f++) {
      const { phase } = expressPhase(f)
      phases.add(phase)
      if (phase === 'warning') warningFrames += 1
    }
    expect(phases).toEqual(new Set(['quiet', 'warning', 'passing']))
    expect(warningFrames).toBe(EXPRESS_WARNING)
    expect(EXPRESS_WARNING).toBeGreaterThanOrEqual(120)
  })
})

describe('Coney Island', () => {
  it('is the end of the line, with the Wonder Wheel and a chest up the stairs', () => {
    expect(STOPS[STOPS.length - 1]?.id).toBe('nyc-sub-coney-platform')
    const coney = screen('nyc-coney-island')
    expect(coney.props?.some((p) => p.sprite === 'wonderWheel')).toBe(true)
    expect(coney.treasure).toBeDefined()
  })

  it('has the three of them waiting, but only once all three have been loved', () => {
    const coney = screen('nyc-coney-island')
    const guardians = (coney.props ?? []).filter((p) => p.after)
    expect(guardians.map((p) => p.sprite).sort()).toEqual(['guardianDark', 'guardianGold', 'guardianGrey'])
    for (const g of guardians) {
      expect(g.pink).toBe(true)
      expect(g.after?.sort()).toEqual(['nyc-boardwalk', 'nyc-columbus-park', 'nyc-trump-green'])
      expect(g.talk?.length ?? 0).toBeGreaterThan(20)
    }
  })

  it('and there are buskers in two of the passages', () => {
    const buskers = SCREENS.flatMap((s) => (s.props ?? []).filter((p) => p.busker).map(() => s.id))
    expect(buskers.sort()).toEqual(['nyc-sub-atlantic-passage', 'nyc-sub-union-passage'])
  })
})
