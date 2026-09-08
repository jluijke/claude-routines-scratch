/**
 * The animals.
 *
 * Mostly a data file, so there is not much here to get wrong — except the hop,
 * which is arithmetic, and which is drawn every frame for two of the six.
 */
import { describe, expect, it } from 'vitest'
import { hopOffset, isPetKind, PETS, petByKind } from '../src/game/pets'
import { SPRITES } from '../src/game/render/sprites'

describe('the six of them', () => {
  it('are six, each with a name, a line and two frames', () => {
    expect(PETS).toHaveLength(6)
    for (const pet of PETS) {
      expect(pet.name.trim().length).toBeGreaterThan(0)
      expect(pet.blurb.trim().length).toBeGreaterThan(0)
      expect(pet.frames).toHaveLength(2)
      // The art has to exist, or the animal is an empty square in the grass.
      for (const frame of pet.frames) expect(SPRITES[frame]).toBeDefined()
    }
  })

  it('can be looked up, and unknown ones are not mistaken for animals', () => {
    expect(petByKind('wombat')?.name).toBe('Wombat')
    expect(petByKind(undefined)).toBeUndefined()
    expect(isPetKind('goat')).toBe(true)
    expect(isPetKind('dragon')).toBe(false)
  })

  it('gives the hop to the two that hop and to nothing else', () => {
    const hoppers = PETS.filter((p) => p.hop).map((p) => p.kind)
    expect(hoppers.sort()).toEqual(['kangaroo', 'rabbit'])
    // Every hopper needs a rate as well, or it would sit at the bottom of its
    // arc forever and simply never leave the ground.
    for (const pet of PETS) expect(Boolean(pet.hop)).toBe(Boolean(pet.hopRate))
  })

  it('bounds the kangaroo higher and less often than the rabbit', () => {
    const roo = petByKind('kangaroo')
    const rabbit = petByKind('rabbit')
    expect(roo?.hop).toBeGreaterThan(rabbit?.hop ?? 0)
    expect(roo?.hopRate).toBeLessThan(rabbit?.hopRate ?? 0)
  })
})

describe('the arc of a hop', () => {
  it('starts and ends on the ground, and peaks in the middle', () => {
    expect(hopOffset(0, 4)).toBeCloseTo(0)
    expect(hopOffset(1, 4)).toBeCloseTo(0)
    expect(hopOffset(0.5, 4)).toBeCloseTo(4)
    expect(hopOffset(0.25, 4)).toBeGreaterThan(0)
    expect(hopOffset(0.25, 4)).toBeLessThan(4)
  })

  it('never puts an animal below the ground, whatever it is handed', () => {
    // The phase is a counter that wraps; a negative or runaway one must not
    // sink the animal into the grass.
    for (const phase of [-3.7, -0.5, 0, 0.5, 1, 7.25, 99.9]) {
      const lift = hopOffset(phase, 5)
      expect(lift).toBeGreaterThanOrEqual(0)
      expect(lift).toBeLessThanOrEqual(5)
    }
  })

  it('is smooth, so nothing snaps between frames', () => {
    let previous = hopOffset(0, 5)
    for (let i = 1; i <= 60; i++) {
      const next = hopOffset(i / 60, 5)
      expect(Math.abs(next - previous)).toBeLessThan(1)
      previous = next
    }
  })
})
