/**
 * The four mechs of the rocks.
 *
 * They used to be the four guardians of the land with one sprite between them,
 * which made the whole second half of the game the first half again. Each one
 * now has exactly one trick, and these are the checks that it still works —
 * and, just as importantly, that the land's guardians did not catch it.
 */
import { describe, expect, it } from 'vitest'
import { Enemy, ringBurst, type Projectile } from '../src/game/entities/enemies'
import { SPRITES } from '../src/game/render/sprites'

const nowhereBlocked = () => false
/** Walls down both sides, so a charge has something to hit. */
const walledAt = (leftOf: number) => (x: number) => x < leftOf || x > 240

/** Runs an enemy for a while, collecting anything it fires. */
function run(
  enemy: Enemy,
  frames: number,
  target = { x: 200, y: 80 },
  isBlocked: (x: number, y: number) => boolean = nowhereBlocked,
): Projectile[] {
  const fired: Projectile[] = []
  for (let i = 0; i < frames; i++) enemy.update(1 / 60, target, isBlocked, (p) => fired.push(p))
  return fired
}

const mech = (kind: 'boss1' | 'boss2' | 'boss3' | 'boss4', col = 4, row = 5) =>
  new Enemy(kind, col, row, 7, 'robot')

describe('four mechs, four fights', () => {
  it('gives each of them a different trick', () => {
    const tricks = (['boss1', 'boss2', 'boss3', 'boss4'] as const).map((k) => mech(k).mech?.trick)
    expect(tricks).toEqual(['charge', 'split', 'shield', 'phase'])
    expect(new Set(tricks).size).toBe(4)
  })

  it('leaves the guardians of the land alone', () => {
    // The point of the whole change: the land plays exactly as it did.
    for (const kind of ['boss1', 'boss2', 'boss3', 'boss4'] as const) {
      expect(new Enemy(kind, 4, 5, 7, 'monster').mech).toBeUndefined()
    }
  })

  it('draws each one differently, and makes it walk', () => {
    const seen = new Set<string>()
    for (const kind of ['boss1', 'boss2', 'boss3', 'boss4'] as const) {
      const one = mech(kind)
      const frames = new Set<string>()
      for (let i = 0; i < 40; i++) {
        one.update(1 / 60, { x: 200, y: 80 }, nowhereBlocked, () => {})
        frames.add(one.sprite)
        seen.add(one.sprite)
      }
      // Two frames each, so it is not a statue sliding across the floor.
      expect(frames.size, `${kind} never changes frame`).toBe(2)
    }
    expect(seen.size, 'two mechs share a sprite').toBe(8)
    for (const name of seen) expect(SPRITES[name as keyof typeof SPRITES]).toBeDefined()
  })

  it('asks more of him than the guardian it was cloned from', () => {
    for (const kind of ['boss1', 'boss2', 'boss3', 'boss4'] as const) {
      const land = new Enemy(kind, 4, 5, 7, 'monster')
      expect(mech(kind).def.hp, `${kind} is softer in space`).toBeGreaterThanOrEqual(land.def.hp)
    }
  })
})

describe('the grey mech charges', () => {
  it('never shoots — its body is the whole threat', () => {
    expect(run(mech('boss1'), 600)).toHaveLength(0)
  })

  it('winds up before it comes, so the charge can be seen coming', () => {
    const one = mech('boss1')
    let windingFrames = 0
    for (let i = 0; i < 200; i++) {
      one.update(1 / 60, { x: 230, y: 88 }, nowhereBlocked, () => {})
      if (one.isWindingUp) windingFrames += 1
    }
    expect(windingFrames).toBeGreaterThan(20)
  })

  it('knocks itself silly on the wall, and says so', () => {
    const one = mech('boss1', 2, 5)
    // Target hard right, a wall just past it: it will wind up, run, and stop.
    let slams = 0
    let dazedFrames = 0
    for (let i = 0; i < 400; i++) {
      one.update(1 / 60, { x: 236, y: 88 }, walledAt(8), () => {})
      if (one.slammed) {
        slams += 1
        one.slammed = false
      }
      if (one.isDazed) dazedFrames += 1
    }
    expect(slams, 'it never reached the wall').toBeGreaterThan(0)
    expect(dazedFrames, 'no window to hit it in').toBeGreaterThan(30)
  })
})

describe('the red mech splits', () => {
  it('comes apart at half health, once, and not before', () => {
    const one = mech('boss2')
    const full = one.def.hp
    while (one.hp > full / 2) {
      one.hurt(1)
      // Between blows, so the twelve-frame guard is not what stops it.
      run(one, 14)
      if (one.hp > full / 2) expect(one.wantsSplit, 'split before half').toBe(false)
    }
    expect(one.wantsSplit).toBe(true)

    // Asking again does not produce a third and fourth piece.
    one.wantsSplit = false
    run(one, 14)
    one.hurt(1)
    expect(one.wantsSplit).toBe(false)
  })

  it('makes halves that are smaller, softer, and do not split again', () => {
    const whole = mech('boss2')
    const half = new Enemy('boss2', 4, 5, 7, 'robot', { half: true })
    expect(half.isHalf).toBe(true)
    expect(half.size).toBeLessThan(whole.size)
    expect(half.def.hp).toBeLessThan(whole.def.hp)

    while (half.hp > 0) {
      half.hurt(1)
      expect(half.wantsSplit, 'a half split again').toBe(false)
      run(half, 14)
    }
  })

  it('is still a boss when it is only half of one', () => {
    // The room is not won until both pieces are down, and the world decides
    // that by asking each enemy whether it is a boss.
    expect(new Enemy('boss2', 4, 5, 7, 'robot', { half: true }).isBoss).toBe(true)
  })
})

describe('the ice mech hides behind a shield', () => {
  it('takes nothing at all while the shield is up', () => {
    const one = mech('boss3')
    expect(one.isShielded).toBe(true)
    expect(one.hurt(99)).toBe(false)
    expect(one.hp).toBe(one.def.hp)
  })

  it('opens the moment it fires, and closes again after', () => {
    const one = mech('boss3')
    let firedAt = -1
    for (let i = 0; i < 400 && firedAt < 0; i++) {
      one.update(1 / 60, { x: 200, y: 80 }, nowhereBlocked, () => { firedAt = i })
    }
    expect(firedAt, 'it never fired, so it can never be hurt').toBeGreaterThan(-1)

    // Open now: a blow lands.
    expect(one.isShielded).toBe(false)
    expect(one.hurt(3)).toBe(true)
    expect(one.hp).toBe(one.def.hp - 3)

    // And shut again well before the next shot.
    run(one, 70)
    expect(one.isShielded).toBe(true)
  })

  it('reports a turned blade once per swing, not once per frame', () => {
    const one = mech('boss3')
    expect(one.deflect()).toBe(true)
    expect(one.deflect()).toBe(false)
    run(one, 20)
    expect(one.deflect()).toBe(true)
  })
})

describe('the black mech phases', () => {
  it('is somewhere else before long, and untouchable on the way', () => {
    const one = mech('boss4', 8, 5)
    const start = { x: one.x, y: one.y }
    let untouchable = false
    for (let i = 0; i < 400; i++) {
      one.update(1 / 60, { x: 60, y: 140 }, nowhereBlocked, () => {})
      if (one.isBlinking) untouchable = true
    }
    expect(untouchable, 'it never blinked').toBe(true)
    expect(Math.hypot(one.x - start.x, one.y - start.y)).toBeGreaterThan(8)
  })

  it('cannot be hit on the frame it goes', () => {
    // It fades back in over the second half of the blink and can be hit then,
    // which is the caster's bargain and is deliberate. What must never work is
    // swinging at it as it leaves.
    const one = mech('boss4', 8, 5)
    let jumps = 0
    let was = { x: one.x, y: one.y }
    for (let i = 0; i < 600; i++) {
      one.update(1 / 60, { x: 60, y: 140 }, nowhereBlocked, () => {})
      if (Math.hypot(one.x - was.x, one.y - was.y) > 8) {
        jumps += 1
        expect(one.hurt(1), 'hit it as it vanished').toBe(false)
      }
      was = { x: one.x, y: one.y }
    }
    expect(jumps, 'it never blinked').toBeGreaterThan(0)
  })
})

/** Beats it down to just past half, leaving the twelve-frame guard clear. */
function halve(one: Enemy, target = { x: 200, y: 80 }): void {
  const half = one.def.hp / 2
  for (let i = 0; i < 200 && one.hp > half; i++) {
    one.hurt(1)
    run(one, 14, target)
  }
}

describe('half dead, and it turns', () => {
  it('enrages every mech but the splitter, which splits instead', () => {
    for (const kind of ['boss1', 'boss3', 'boss4'] as const) {
      const one = mech(kind)
      expect(one.enraged, `${kind} starts angry`).toBe(false)
      halve(one)
      expect(one.enraged, `${kind} never turned`).toBe(true)
      expect(one.justEnraged, `${kind} never said so`).toBe(true)
    }
    const red = mech('boss2')
    halve(red)
    expect(red.wantsSplit).toBe(true)
    expect(red.enraged, 'the splitter enraged as well as splitting').toBe(false)
  })

  it('says so exactly once', () => {
    const one = mech('boss4')
    halve(one)
    expect(one.justEnraged).toBe(true)
    one.justEnraged = false
    // Beat it to within an inch: it must not announce itself again.
    for (let i = 0; i < 40 && one.hp > 1; i++) {
      one.hurt(1)
      run(one, 14)
      expect(one.justEnraged, 'it turned twice').toBe(false)
    }
  })

  it('hands the red mech its rage to its halves instead', () => {
    const half = new Enemy('boss2', 4, 5, 7, 'robot', { half: true })
    expect(half.enraged, 'a half arrives calm').toBe(true)
  })

  it('makes every one of them start vanishing', () => {
    for (const kind of ['boss1', 'boss3', 'boss4'] as const) {
      const one = mech(kind, 8, 5)
      halve(one)
      // Keep well away, so the charger stays stalking rather than charging.
      let jumps = 0
      let was = { x: one.x, y: one.y }
      for (let i = 0; i < 700; i++) {
        one.update(1 / 60, { x: 40, y: 150 }, nowhereBlocked, () => {})
        if (Math.hypot(one.x - was.x, one.y - was.y) > 12) jumps += 1
        was = { x: one.x, y: one.y }
      }
      expect(jumps, `${kind} never vanished once it turned`).toBeGreaterThan(0)
    }
  })

  it('never blinks a charger out of its own charge', () => {
    // A charge you can read is the whole fight. One that teleports mid-run is
    // not a fight, it is something that happens to you.
    const one = mech('boss1', 2, 5)
    halve(one, { x: 236, y: 88 })
    let was = { x: one.x, y: one.y }
    for (let i = 0; i < 700; i++) {
      one.update(1 / 60, { x: 236, y: 88 }, walledAt(8), () => {})
      const moved = Math.hypot(one.x - was.x, one.y - was.y)
      // A charge step is at most a few pixels; a blink is tens.
      if (!one.isDazed && !one.isWindingUp && moved > 12) {
        expect(one.isBlinking, 'it jumped without blinking').toBe(true)
      }
      was = { x: one.x, y: one.y }
    }
  })
})

describe('what it throws once it has turned', () => {
  it('opens the red mech\'s fan from three bolts to five — but only its halves', () => {
    // The whole one never turns: coming apart is its turn, so it keeps the
    // fan of three right up to the moment it splits. Both halves throw five.
    const whole = mech('boss2')
    halve(whole)
    expect(whole.enraged).toBe(false)
    const fromWhole = run(whole, 400)

    const half = new Enemy('boss2', 4, 5, 7, 'robot', { half: true })
    const fromHalf = run(half, 400)
    expect(fromWhole.length).toBeGreaterThan(0)
    expect(fromHalf.length).toBeGreaterThan(fromWhole.length)
  })

  it('turns the ice mech\'s single shot into a burst of three', () => {
    const one = mech('boss3')
    const before = run(one, 300).length
    halve(one)
    expect(run(one, 300).length).toBeGreaterThan(before)
  })

  it('throws a ring off the charger when it hits the wall', () => {
    const one = mech('boss1', 2, 5)
    halve(one, { x: 236, y: 88 })
    const fired: Projectile[] = []
    for (let i = 0; i < 500; i++) {
      one.update(1 / 60, { x: 236, y: 88 }, walledAt(8), (p) => fired.push(p))
    }
    expect(fired.length, 'the charger never threw anything').toBeGreaterThan(0)
  })

  it('leaves bolts where the black mech was standing', () => {
    const one = mech('boss4', 8, 5)
    halve(one)
    const fired: Projectile[] = []
    let rings = 0
    let was = { x: one.x, y: one.y }
    for (let i = 0; i < 700; i++) {
      const before = fired.length
      one.update(1 / 60, { x: 40, y: 150 }, nowhereBlocked, (p) => fired.push(p))
      if (Math.hypot(one.x - was.x, one.y - was.y) > 12 && fired.length - before >= 6) rings += 1
      was = { x: one.x, y: one.y }
    }
    expect(rings, 'it vanished without leaving anything behind').toBeGreaterThan(0)
  })

  it('throws a ring that always has a way out of it', () => {
    // Evenly spaced and slower than he walks: the gaps open as it travels, so
    // there is never a wall of fire with no door in it.
    const ring = ringBurst({ x: 100, y: 100 }, 3)
    expect(ring.length).toBe(8)
    for (const bolt of ring) {
      expect(Math.hypot(bolt.vx, bolt.vy)).toBeCloseTo(58, 0)
      // A ring bolt always costs less than an aimed one.
      expect(bolt.damage).toBe(2)
    }
    const angles = ring.map((b) => Math.atan2(b.vy, b.vx)).sort((a, b) => a - b)
    for (let i = 1; i < angles.length; i++) {
      expect(angles[i]! - angles[i - 1]!).toBeCloseTo(Math.PI / 4, 3)
    }
  })

  it('never raises what a bolt costs him', () => {
    // The fight gets busier, not more punishing — the difference between a
    // good boss and one a nine-year-old gives up on.
    for (const kind of ['boss1', 'boss2', 'boss3', 'boss4'] as const) {
      const one = mech(kind)
      const damage = one.def.damage
      halve(one)
      expect(one.def.damage, `${kind} hits harder when angry`).toBe(damage)
    }
  })
})
