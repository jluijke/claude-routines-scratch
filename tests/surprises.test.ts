/**
 * The city's surprises, as far as they can be proved without a browser:
 * the purple car's list, City Hall's secret, Times Square's isolation.
 * The rides, the spray and the pigeons are tools/surprises-smoke.mjs.
 */
import { describe, expect, it } from 'vitest'
import { screenById, SCREENS } from '../src/game/world/screens'
import { STOPS, stationsVisited } from '../src/game/world/subway'
import { unmarkedDoors, walledInFeatures } from '../src/game/world/analysis'

describe('the purple car', () => {
  it('is a door on Fifth Avenue and a door out of Times Square, both marked as the car', () => {
    const fifth = screenById('nyc-fifth-ave')
    const car = fifth?.portals?.find((p) => p.car)
    expect(car).toBeDefined()
    expect(fifth?.props?.some((p) => p.sprite === 'purpleCar' && p.col === car?.col && p.row === car?.row)).toBe(true)
    const times = screenById('nyc-times-square')
    expect(times?.exits).toEqual({})
    expect(times?.portals?.some((p) => p.car)).toBe(true)
    // The car draws itself, so the validator does not ask for a doorway under it.
    expect(unmarkedDoors([fifth as never, times as never])).toEqual([])
    expect(walledInFeatures(times as never)).toEqual([])
  })
})

describe('City Hall', () => {
  it('is a stop the map does not print until he has been', () => {
    const cityHall = STOPS.find((s) => s.id === 'nyc-sub-cityhall-platform')
    expect(cityHall?.secret).toBe(true)
    expect(STOPS.filter((s) => s.secret)).toHaveLength(1)
    expect(stationsVisited(['nyc-sub-cityhall-hall'])).toEqual(['nyc-sub-cityhall-platform'])
  })

  it('is a haven: a hall off the platform with a chest, and no way up to the street', () => {
    const hall = screenById('nyc-sub-cityhall-hall')
    expect(hall?.exits).toEqual({ down: 'nyc-sub-cityhall-platform' })
    expect(hall?.portals ?? []).toEqual([])
    expect(hall?.treasure?.rupees).toBeGreaterThan(100)
    expect(hall?.gates ?? []).toEqual([])
    const platform = screenById('nyc-sub-cityhall-platform')
    expect(platform?.exits).toEqual({ up: 'nyc-sub-cityhall-hall' })
  })
})

describe('the hydrants', () => {
  it('stand on the streets, one to most blocks', () => {
    const streets = SCREENS.filter((s) => s.level === 3 && s.setting === 'street' && Object.keys(s.exits).length > 0)
    const withHydrant = streets.filter((s) => s.rows.some((r) => r.includes('*')))
    expect(withHydrant.length).toBeGreaterThan(streets.length / 2)
  })
})
