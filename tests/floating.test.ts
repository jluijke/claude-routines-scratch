/**
 * Out on the rocks there is nothing to push against.
 *
 * On a deck a key is a velocity: press it and he is moving, let go and he has
 * stopped. In vacuum it becomes a push — he takes a moment to get going and
 * coasts when he stops. The numbers matter in both directions: too little and
 * stepping through an airlock feels like nothing happened, too much and a
 * nine-year-old cannot dodge a charging mech.
 */
import { describe, expect, it } from 'vitest'
import { Player, WALK_SPEED } from '../src/game/entities/player'

/** A hero with nothing in his hands; only how he moves is under test here. */
const hero = (x: number, y: number): Player => {
  const player = new Player({ shield: 'woodenShield' }, 3, 3)
  player.x = x
  player.y = y
  return player
}

const clear = () => false
const TILE = 16

/** Runs the player for a number of frames with a held direction. */
function drive(player: Player, frames: number, dx: number, dy = 0): void {
  for (let i = 0; i < frames; i++) player.update(1 / 60, dx, dy, clear, true)
}

/** Same, on solid ground. */
function walk(player: Player, frames: number, dx: number, dy = 0): void {
  for (let i = 0; i < frames; i++) player.update(1 / 60, dx, dy, clear, false)
}

describe('floating on the rocks', () => {
  it('takes a moment to get going', () => {
    const floating = hero(0, 60)
    const walking = hero(0, 60)
    drive(floating, 12, 1)
    walk(walking, 12, 1)
    // A fifth of a second in, the one with something to push against is
    // meaningfully ahead.
    expect(floating.x).toBeLessThan(walking.x * 0.75)
  })

  it('gets there in the end, near enough', () => {
    const floating = hero(0, 60)
    drive(floating, 120, 1)
    // Two seconds of push, and he is travelling at very close to walking pace
    // — floating is not a speed penalty, it is a delay and a glide.
    expect(floating.driftSpeed()).toBeGreaterThan(WALK_SPEED * 0.9)
  })

  it('coasts about a tile when he lets go', () => {
    const player = hero(0, 60)
    drive(player, 60, 1)
    const released = player.x
    drive(player, 120, 0)
    const coast = player.x - released
    // Far enough to feel, near enough to steer: under half a tile it reads as
    // ordinary walking, and over two tiles it reads as ice.
    expect(coast).toBeGreaterThan(TILE * 0.5)
    expect(coast).toBeLessThan(TILE * 1.5)
  })

  it('comes to a full stop rather than creeping for ever', () => {
    const player = hero(0, 60)
    drive(player, 60, 1)
    drive(player, 240, 0)
    expect(player.driftSpeed()).toBe(0)
  })

  it('can be turned round without the old direction flinging him', () => {
    const player = hero(120, 60)
    drive(player, 60, 1)
    const turned = player.x
    drive(player, 60, -1)
    // A second of pushing back and he is going the other way, not still
    // sliding the way he was.
    expect(player.x).toBeLessThan(turned)
  })

  it('leaves the decks exactly as they were', () => {
    const player = hero(0, 60)
    walk(player, 30, 1)
    const travelled = player.x
    // Half a second at walking pace, to the pixel — and not a pixel of coast.
    expect(travelled).toBeCloseTo((WALK_SPEED * 30) / 60, 4)
    walk(player, 30, 0)
    expect(player.x).toBe(travelled)
    expect(player.driftSpeed()).toBe(0)
  })

  it('forgets its momentum the moment he is back inside', () => {
    // Otherwise a coast begun on a rock would carry him across the airlock.
    const player = hero(0, 60)
    drive(player, 60, 1)
    expect(player.driftSpeed()).toBeGreaterThan(0)
    walk(player, 1, 0)
    expect(player.driftSpeed()).toBe(0)
  })
})
