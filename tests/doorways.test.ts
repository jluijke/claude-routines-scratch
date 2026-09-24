/**
 * You can always walk out of a doorway.
 *
 * The bug: leaving a screen asked for the hero's *centre* to be within five
 * pixels of the screen edge, and he can never get there. Collision stops his
 * body two pixels short of the boundary, which put his furthest centre at 172
 * against a door that wanted 171. One pixel of overlap, crossed at about a
 * pixel a frame — so whether a doorway worked came down to where his stride
 * happened to land. Walking straight in from the door he arrived by lined up;
 * almost anything else left him pressed into the gap, walking on the spot.
 *
 * A browser check can only sample footings and will miss the one that sticks,
 * which is exactly what happened the first time this was written. The thing
 * that actually decides it is arithmetic between five numbers, so it is
 * checked as arithmetic, for every stride phase there is.
 */
import { describe, expect, it } from 'vitest'
import { PLAYER_SIZE, BODY_INSET, WALK_SPEED } from '../src/game/entities/player'
import { EDGE_MARGIN } from '../src/game/world'
import { SCREEN_H, SCREEN_W, TILE } from '../src/game/world/tiles'

/**
 * The furthest his centre can get towards an edge.
 *
 * Collision keeps every sampled corner strictly inside the tile grid, so his
 * leading edge stops just short of the boundary and his centre stops half a
 * body behind that.
 */
const furthestCentre = (extent: number): number => extent - (PLAYER_SIZE - BODY_INSET) + PLAYER_SIZE / 2
const nearestCentre = (): number => -BODY_INSET + PLAYER_SIZE / 2

describe('walking out of a screen', () => {
  it('opens the door well before he runs out of floor', () => {
    // Down and right: the trigger must be below where he can actually get to.
    const downRoom = furthestCentre(SCREEN_H) - (SCREEN_H - EDGE_MARGIN)
    const rightRoom = furthestCentre(SCREEN_W) - (SCREEN_W - EDGE_MARGIN)
    // Up and left: the trigger must be above where he can get to.
    const upRoom = EDGE_MARGIN - nearestCentre()
    const leftRoom = EDGE_MARGIN - nearestCentre()

    for (const [name, room] of [
      ['down', downRoom],
      ['right', rightRoom],
      ['up', upRoom],
      ['left', leftRoom],
    ] as const) {
      // A stride is about a pixel; anything under a few of them is a coin
      // toss. Eight is comfortable at any frame rate the loop runs at.
      expect(room, `only ${room}px of room to leave ${name}`).toBeGreaterThanOrEqual(8)
    }
  })

  it('lets him out from every stride phase there is', () => {
    // Walk him at the bottom edge from a thousand different starting offsets,
    // a frame at a time, exactly as the real loop does. Every one must end up
    // past the line. With the old five-pixel margin, some do not.
    const step = WALK_SPEED / 60
    const ceiling = SCREEN_H - (PLAYER_SIZE - BODY_INSET) // his leading edge stops here
    let stuck = 0

    for (let i = 0; i < 1000; i++) {
      // Spread across the last few tiles of approach, staying inside the
      // floor: a start already past the ceiling would prove nothing.
      let y = 140 + i * 0.025
      for (let frame = 0; frame < 400; frame++) {
        const next = y + step
        // Collision: the step is refused outright if it would put his leading
        // edge on or past the boundary. He does not slide up to it.
        if (next + PLAYER_SIZE - BODY_INSET >= SCREEN_H) break
        y = next
      }
      expect(y + PLAYER_SIZE - BODY_INSET).toBeLessThan(SCREEN_H)
      if (!(y + PLAYER_SIZE / 2 > SCREEN_H - EDGE_MARGIN)) stuck += 1
    }
    expect(stuck, `${stuck} of 1000 footings could not leave`).toBe(0)
    expect(ceiling).toBeLessThan(SCREEN_H)
  })

  it('does not throw him out of a screen he has only just walked into', () => {
    // Arriving through a door puts him a tile in. That must be clear of the
    // trigger, or he would bounce between two screens for ever.
    const arriveTop = TILE + PLAYER_SIZE / 2
    const arriveBottom = SCREEN_H - TILE - PLAYER_SIZE + PLAYER_SIZE / 2
    const arriveLeft = TILE + PLAYER_SIZE / 2
    const arriveRight = SCREEN_W - TILE - PLAYER_SIZE + PLAYER_SIZE / 2

    expect(arriveTop, 'arriving from above lands him back in the door').toBeGreaterThanOrEqual(EDGE_MARGIN)
    expect(arriveLeft).toBeGreaterThanOrEqual(EDGE_MARGIN)
    expect(arriveBottom).toBeLessThanOrEqual(SCREEN_H - EDGE_MARGIN)
    expect(arriveRight).toBeLessThanOrEqual(SCREEN_W - EDGE_MARGIN)
  })

  it('keeps the trigger inside the border tile, not out in the room', () => {
    // The other failure mode: a margin so generous he is pulled out of a
    // screen while still standing well inside it.
    expect(EDGE_MARGIN).toBeLessThanOrEqual(TILE)
  })
})
