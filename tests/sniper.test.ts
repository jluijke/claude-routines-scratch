/**
 * The rooftop, played through without a browser.
 *
 * A rat pays thirty, a squirrel costs fifty, the round is thirty seconds,
 * the bolt has to be worked between shots, and a miss is a miss. The
 * drawing is the world's; everything that decides the score is here.
 */
import { describe, expect, it } from 'vitest'
import {
  beginSniper,
  BOLT_FRAMES,
  critterRise,
  RAT_BOUNTY,
  SNIPER_SECONDS,
  sniperSummary,
  SPOTS,
  SQUIRREL_FINE,
  tickSniper,
  type SniperState,
} from '../src/game/sniper'
import { Rng } from '../src/core/rng'
import { ITEMS } from '../src/game/items'
import { screenById } from '../src/game/world/screens'

const still = { dx: 0, dy: 0, fire: false }

function run(s: SniperState, frames: number, rng: Rng, input = still): SniperState {
  for (let i = 0; i < frames; i++) s = tickSniper(s, input, rng)
  return s
}

describe('the rooftop', () => {
  it('lasts thirty seconds and then it is over', () => {
    const rng = new Rng(1)
    let s = beginSniper()
    expect(s.frames).toBe(SNIPER_SECONDS * 60)
    s = run(s, SNIPER_SECONDS * 60 - 1, rng)
    expect(s.done).toBe(false)
    s = run(s, 1, rng)
    expect(s.done).toBe(true)
    // And stays over.
    expect(run(s, 10, rng).frames).toBe(0)
  })

  it('brings things up out of the bushes, and most of them are rats', () => {
    const rng = new Rng(7)
    let s = beginSniper()
    const seen = { rat: 0, squirrel: 0 }
    const spots = new Set<number>()
    for (let i = 0; i < 1800; i++) {
      const before = new Set(s.critters)
      s = tickSniper(s, still, rng)
      for (const c of s.critters) {
        if (before.has(c)) continue
        seen[c.kind] += 1
        spots.add(c.spot)
        expect(SPOTS[c.spot]).toEqual({ x: c.x, y: c.y })
      }
    }
    expect(seen.rat).toBeGreaterThan(seen.squirrel)
    expect(seen.squirrel).toBeGreaterThan(3)
    expect(spots.size).toBeGreaterThan(5)
  })

  it('pays for a rat, fines for a squirrel, and never counts one twice', () => {
    const rng = new Rng(3)
    let s = beginSniper()
    // Put one of each up ourselves, and aim.
    s = { ...s, critters: [
      { kind: 'rat', spot: 0, x: 40, y: 48, frames: 80, span: 80, shot: false },
      { kind: 'squirrel', spot: 1, x: 96, y: 36, frames: 80, span: 80, shot: false },
    ], nextPop: 9999 }
    s = tickSniper(s, { dx: 0, dy: 0, fire: true, aimAt: { x: 41, y: 47 } }, rng)
    expect(s.rats).toBe(1)
    expect(s.earned).toBe(RAT_BOUNTY)
    expect(s.critters[0]?.shot).toBe(true)
    // The bolt: a second pull straight away does nothing.
    s = tickSniper(s, { dx: 0, dy: 0, fire: true, aimAt: { x: 96, y: 36 } }, rng)
    expect(s.squirrels).toBe(0)
    expect(s.cooldown).toBeGreaterThan(0)
    s = run(s, BOLT_FRAMES, rng)
    s = tickSniper(s, { dx: 0, dy: 0, fire: true, aimAt: { x: 96, y: 36 } }, rng)
    expect(s.squirrels).toBe(1)
    expect(s.earned).toBe(RAT_BOUNTY - SQUIRREL_FINE)
    expect(s.lastHit?.text).toContain('SQUIRREL')
    // The rat is already down: shooting it again is a miss.
    s = run(s, BOLT_FRAMES, rng)
    const shots = s.shots
    s = tickSniper(s, { dx: 0, dy: 0, fire: true, aimAt: { x: 40, y: 48 } }, rng)
    expect(s.shots).toBe(shots + 1)
    expect(s.rats).toBe(1)
  })

  it('misses when the crosshair is off', () => {
    const rng = new Rng(3)
    let s = beginSniper()
    s = { ...s, critters: [{ kind: 'rat', spot: 0, x: 40, y: 48, frames: 80, span: 80, shot: false }], nextPop: 9999 }
    s = tickSniper(s, { dx: 0, dy: 0, fire: true, aimAt: { x: 80, y: 48 } }, rng)
    expect(s.shots).toBe(1)
    expect(s.rats).toBe(0)
  })

  it('moves the crosshair with the keys and keeps it in the view', () => {
    const rng = new Rng(1)
    let s = beginSniper()
    const start = s.crosshair.x
    s = run(s, 10, rng, { dx: 1, dy: 0, fire: false })
    expect(s.crosshair.x).toBeGreaterThan(start + 10)
    s = run(s, 400, rng, { dx: 1, dy: 1, fire: false })
    expect(s.crosshair.x).toBeLessThanOrEqual(256 - 6)
    expect(s.crosshair.y).toBeLessThanOrEqual(176 - 6)
  })

  it('brings a critter up, holds it, and takes it back down', () => {
    const c = { kind: 'rat' as const, spot: 0, x: 0, y: 0, frames: 80, span: 80, shot: false }
    expect(critterRise(c)).toBe(0)
    expect(critterRise({ ...c, frames: 40 })).toBe(1)
    expect(critterRise({ ...c, frames: 5 })).toBe(0.5)
    expect(critterRise({ ...c, frames: 5, shot: true })).toBe(1)
  })

  it('sums it up in words', () => {
    const s = { ...beginSniper(), rats: 3, squirrels: 1, earned: 40 }
    expect(sniperSummary(s)).toBe('Time. 3 rats, 1 squirrel: +$40.')
    expect(sniperSummary({ ...s, rats: 1, squirrels: 0, earned: 30 })).toBe('Time. 1 rat, no squirrels: +$30.')
    expect(sniperSummary({ ...s, rats: 0, squirrels: 2, earned: -100 })).toBe('Time. 0 rats, 2 squirrels: -$100.')
  })

  it('is played with a rifle that is found on the roof and never sold', () => {
    expect(ITEMS.sniperRifle.price).toBeUndefined()
    expect(ITEMS.sniperRifle.city?.price).toBeUndefined()
    const roof = screenById('nyc-rooftop-a')
    expect(roof?.pickup?.item).toBe('sniperRifle')
    expect(roof?.props?.some((p) => p.scope)).toBe(true)
    // Up the fire escape on Avenue A, and back down it.
    const avenue = screenById('nyc-avenue-a')
    const ladder = avenue?.portals?.find((p) => p.to === 'nyc-rooftop-a')
    expect(ladder).toBeDefined()
    expect(avenue?.rows[ladder?.row as number]?.[ladder?.col as number]).toBe('D')
    expect(roof?.portals?.some((p) => p.to === 'nyc-avenue-a')).toBe(true)
  })
})
