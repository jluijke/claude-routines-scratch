/**
 * The city's weapons: which slot is which, and how the guns behave.
 *
 * A magazine is a small state machine — so many rounds, then a reload during
 * which nothing fires — and a wrong step in it is the difference between a
 * gun that feels like a gun and a button that never stops. The machine
 * gun's fan is trigonometry, and trigonometry is where signs go wrong.
 */
import { describe, expect, it } from 'vitest'
import {
  ammoLabel,
  burstDirections,
  cityWeapon,
  fullMagazine,
  GUNS,
  isFirearm,
  pullTrigger,
  tickMagazine,
  MACHINE_GUN_BURST,
  type Magazine,
} from '../src/game/weapons'
import { TILE } from '../src/game/world/tiles'

describe('the four slots', () => {
  it('put a knife, a hammer, a pistol and a rifle where the swords were', () => {
    expect(cityWeapon('woodenSword')).toBe('knife')
    expect(cityWeapon('metalSword')).toBe('hammer')
    expect(cityWeapon('bronzeSword')).toBe('pistol')
    expect(cityWeapon('goldenSword')).toBe('rifle')
    expect(cityWeapon(undefined)).toBeUndefined()
    expect(cityWeapon('bow')).toBeUndefined()
  })

  it('know which ones are guns', () => {
    expect(isFirearm('pistol')).toBe(true)
    expect(isFirearm('rifle')).toBe(true)
    expect(isFirearm('hammer')).toBe(false)
    expect(isFirearm(undefined)).toBe(false)
  })

  it('give the pistol a short reach and the rifle the whole screen', () => {
    expect(GUNS.pistol.range).toBeLessThanOrEqual(4 * TILE)
    expect(GUNS.rifle.range).toBeGreaterThanOrEqual(16 * TILE)
    expect(GUNS.rifle.magazine).toBeLessThan(GUNS.pistol.magazine)
    expect(GUNS.rifle.damage).toBeGreaterThan(GUNS.pistol.damage)
  })
})

describe('a magazine', () => {
  const emptyOut = (mag: Magazine): { mag: Magazine; fired: number } => {
    let fired = 0
    for (let i = 0; i < 20; i++) {
      const pull = pullTrigger(mag)
      mag = pull.mag
      if (pull.result === 'fired') fired += 1
      // Until the reload starts: that is the magazine.
      if (mag.reload > 0) break
      // Let the trigger cool between pulls, as a finger would.
      for (let f = 0; f < GUNS[mag.weapon].cooldown; f++) mag = tickMagazine(mag)
    }
    return { mag, fired }
  }

  it('fires six from the pistol and three from the rifle, then reloads', () => {
    const pistol = emptyOut(fullMagazine('pistol'))
    expect(pistol.fired).toBe(6)
    const rifle = emptyOut(fullMagazine('rifle'))
    expect(rifle.fired).toBe(3)
  })

  it('starts the reload with the last round, and fires nothing until it is done', () => {
    let mag = fullMagazine('rifle')
    for (let i = 0; i < 3; i++) {
      mag = pullTrigger(mag).mag
      for (let f = 0; f < GUNS.rifle.cooldown; f++) mag = tickMagazine(mag)
    }
    expect(mag.rounds).toBe(0)
    expect(mag.reload).toBeGreaterThan(0)
    expect(pullTrigger(mag).result).toBe('reloading')
    expect(ammoLabel(mag)).toBe('RELOADING')
    // Tick it through the reload: it comes back full.
    for (let f = 0; f < GUNS.rifle.reloadFrames; f++) mag = tickMagazine(mag)
    expect(mag.reload).toBe(0)
    expect(mag.rounds).toBe(GUNS.rifle.magazine)
    expect(ammoLabel(mag)).toBe('3/3')
    expect(pullTrigger(mag).result).toBe('fired')
  })

  it('will not fire twice in the same moment', () => {
    const first = pullTrigger(fullMagazine('pistol'))
    expect(first.result).toBe('fired')
    expect(pullTrigger(first.mag).result).toBe('cooling')
    let mag = first.mag
    for (let f = 0; f < GUNS.pistol.cooldown; f++) mag = tickMagazine(mag)
    expect(pullTrigger(mag).result).toBe('fired')
  })

  it('reloads an empty gun when the trigger is pulled on it', () => {
    const mag: Magazine = { weapon: 'pistol', rounds: 0, reload: 0, cooldown: 0 }
    const pull = pullTrigger(mag)
    expect(pull.result).toBe('empty')
    expect(pull.mag.reload).toBe(GUNS.pistol.reloadFrames)
  })
})

describe('the machine gun', () => {
  it('fires three bullets in a fan, the middle one straight ahead', () => {
    const fan = burstDirections(1, 0)
    expect(fan.length).toBe(MACHINE_GUN_BURST)
    expect(fan[1]?.dx).toBeCloseTo(1)
    expect(fan[1]?.dy).toBeCloseTo(0)
    // One bullet either side, by the same angle.
    expect(fan[0]?.dy).toBeCloseTo(-(fan[2]?.dy ?? 0))
    expect(fan[0]?.dx).toBeCloseTo(fan[2]?.dx ?? 0)
    expect(Math.abs(fan[0]?.dy ?? 0)).toBeGreaterThan(0.1)
    expect(Math.abs(fan[0]?.dy ?? 0)).toBeLessThan(0.5)
  })

  it('fans the other three ways too', () => {
    for (const [dx, dy] of [[-1, 0], [0, 1], [0, -1]] as const) {
      const fan = burstDirections(dx, dy)
      expect(fan[1]?.dx).toBeCloseTo(dx)
      expect(fan[1]?.dy).toBeCloseTo(dy)
      for (const d of fan) expect(Math.hypot(d.dx, d.dy)).toBeCloseTo(1)
    }
  })

  it('fires fewer when fewer are left', () => {
    expect(burstDirections(1, 0, 1).length).toBe(1)
    expect(burstDirections(1, 0, 1)[0]?.dx).toBeCloseTo(1)
    expect(burstDirections(1, 0, 2).length).toBe(2)
  })
})
