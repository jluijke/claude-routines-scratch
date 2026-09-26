/**
 * The city's rats: calmer than the land's chasers, on purpose.
 *
 * Slower, one heart a bite, only interested when he is close, and they back
 * off after a bite. The land's and the ship's chasers are untouched, so the
 * first two worlds play exactly as they did.
 */
import { describe, expect, it } from 'vitest'
import { Enemy, RAT_NOTICE } from '../src/game/entities/enemies'
import { WALK_SPEED } from '../src/game/entities/player'

const open = () => false
const noShots = () => {}

/** Runs an enemy for a number of frames toward a fixed point. */
function run(enemy: Enemy, target: { x: number; y: number }, frames: number): void {
  for (let i = 0; i < frames; i++) enemy.update(1 / 60, target, open, noShots)
}

describe('city rats', () => {
  it('are much slower than him, and bite for one heart', () => {
    const rat = new Enemy('chaser', 5, 5, 1, 'creature')
    expect(rat.def.speed).toBeLessThan(WALK_SPEED / 2)
    expect(rat.def.damage).toBe(1)
    // The land's chaser keeps its old teeth.
    const land = new Enemy('chaser', 5, 5, 1, 'monster')
    expect(land.def.speed).toBeGreaterThan(rat.def.speed)
    expect(land.def.damage).toBe(2)
  })

  it('come for him when he is close', () => {
    const rat = new Enemy('chaser', 5, 5, 1, 'creature')
    const start = rat.centre()
    const him = { x: start.x + RAT_NOTICE - 20, y: start.y }
    run(rat, him, 60)
    expect(rat.centre().x).toBeGreaterThan(start.x + 15)
  })

  it('leave him alone when he is far off', () => {
    const rat = new Enemy('chaser', 1, 5, 7, 'creature')
    const start = rat.centre()
    const him = { x: start.x + RAT_NOTICE * 2.5, y: start.y }
    run(rat, him, 120)
    // Ambling about, not making a line for him.
    const gained = Math.abs(him.x - start.x) - Math.abs(him.x - rat.centre().x)
    expect(gained).toBeLessThan(35)
  })

  it('run off after a bite', () => {
    const rat = new Enemy('chaser', 5, 5, 1, 'creature')
    const start = rat.centre()
    const him = { x: start.x + 20, y: start.y }
    rat.retreat()
    run(rat, him, 40)
    expect(rat.centre().x).toBeLessThan(start.x)
  })
})
