/**
 * What the four swords become in the city, and how the guns work.
 *
 * The land has four swords and the game has four sword slots, so the city
 * keeps the slots and changes what is in them: a kitchen knife, a box hammer,
 * a pistol and a rifle. The knife swings like the wooden sword. The hammer
 * swings slow and shakes the street. The two guns do not swing at all: they
 * fire a bullet the way he is facing, so many to a magazine, and then he
 * stands there while it reloads. The machine gun is the bow's slot: three
 * bullets a press, in a fan.
 *
 * Nothing here touches the world; the world asks these questions and this
 * answers them, which is what makes the answers checkable.
 */
import type { ItemId } from './items'
import { TILE } from './world/tiles'

export type CityWeapon = 'knife' | 'hammer' | 'pistol' | 'rifle'
export type Firearm = 'pistol' | 'rifle'

/** The sword slot each city weapon sits in. */
export function cityWeapon(sword: ItemId | undefined): CityWeapon | undefined {
  switch (sword) {
    case 'woodenSword':
      return 'knife'
    case 'metalSword':
      return 'hammer'
    case 'bronzeSword':
      return 'pistol'
    case 'goldenSword':
      return 'rifle'
    default:
      return undefined
  }
}

export function isFirearm(weapon: CityWeapon | undefined): weapon is Firearm {
  return weapon === 'pistol' || weapon === 'rifle'
}

export interface GunSpec {
  /** Rounds before the reload. */
  magazine: number
  /** How far a bullet flies before it drops, in pixels. */
  range: number
  /** Pixels a second. */
  speed: number
  /** Hearts off whatever it hits. */
  damage: number
  /** Frames the reload takes, during which nothing fires. */
  reloadFrames: number
  /** Frames between shots: how fast the trigger can be pulled. */
  cooldown: number
}

export const GUNS: Record<Firearm, GunSpec> = {
  // Short reach: three tiles, then it drops. Six in the magazine.
  pistol: { magazine: 6, range: 3 * TILE, speed: 220, damage: 2, reloadFrames: 60, cooldown: 12 },
  // The whole screen, and hits like a sword swing from the smith. Three in the
  // magazine, and a slower hand.
  rifle: { magazine: 3, range: 16 * TILE, speed: 320, damage: 4, reloadFrames: 90, cooldown: 24 },
}

/** The hammer: a slow swing, and the street shakes when it lands. */
export const HAMMER_SWING_FRAMES = 24
/** Anything this close to the hammer when it lands is stunned for a moment. */
export const HAMMER_STUN_RADIUS = 40
export const HAMMER_STUN_FRAMES = 50

/** The machine gun: three bullets a press, spread across this many degrees. */
export const MACHINE_GUN_BURST = 3
export const MACHINE_GUN_SPREAD = 14
export const MACHINE_GUN_RANGE = 16 * TILE
export const MACHINE_GUN_SPEED = 260
export const MACHINE_GUN_DAMAGE = 2

export interface Magazine {
  weapon: Firearm
  rounds: number
  /** Frames of reload left; zero when it is ready. */
  reload: number
  /** Frames until the trigger can be pulled again. */
  cooldown: number
}

export function fullMagazine(weapon: Firearm): Magazine {
  return { weapon, rounds: GUNS[weapon].magazine, reload: 0, cooldown: 0 }
}

export type TriggerResult = 'fired' | 'reloading' | 'empty' | 'cooling'

/**
 * Pulling the trigger. A round leaves if there is one and the gun is ready;
 * an empty gun starts its reload instead, and a reloading gun does nothing at
 * all — he stands there and waits, which is the whole cost of a gun.
 */
export function pullTrigger(mag: Magazine): { mag: Magazine; result: TriggerResult } {
  const spec = GUNS[mag.weapon]
  if (mag.reload > 0) return { mag, result: 'reloading' }
  if (mag.cooldown > 0) return { mag, result: 'cooling' }
  if (mag.rounds <= 0) return { mag: { ...mag, reload: spec.reloadFrames }, result: 'empty' }
  const rounds = mag.rounds - 1
  // The last round starts the reload by itself, so he is never left holding
  // an empty gun without knowing it.
  return {
    mag: { ...mag, rounds, cooldown: spec.cooldown, reload: rounds === 0 ? spec.reloadFrames : 0 },
    result: 'fired',
  }
}

/** One frame: the reload and the cooldown run down, and a finished reload fills the magazine. */
export function tickMagazine(mag: Magazine): Magazine {
  const spec = GUNS[mag.weapon]
  const cooldown = Math.max(0, mag.cooldown - 1)
  if (mag.reload <= 0) return mag.cooldown === cooldown ? mag : { ...mag, cooldown }
  const reload = mag.reload - 1
  return { ...mag, cooldown, reload, rounds: reload === 0 ? spec.magazine : mag.rounds }
}

/** The bullets of a burst, as unit vectors: straight ahead, and one either side. */
export function burstDirections(dx: number, dy: number, count = MACHINE_GUN_BURST, spread = MACHINE_GUN_SPREAD): { dx: number; dy: number }[] {
  const base = Math.atan2(dy, dx)
  const out: { dx: number; dy: number }[] = []
  for (let i = 0; i < count; i++) {
    const offset = count === 1 ? 0 : ((i / (count - 1)) * 2 - 1) * (spread * Math.PI) / 180
    out.push({ dx: Math.cos(base + offset), dy: Math.sin(base + offset) })
  }
  return out
}

/** What the HUD shows beside the weapon's name. */
export function ammoLabel(mag: Magazine | undefined): string {
  if (!mag) return ''
  if (mag.reload > 0) return 'RELOADING'
  return `${mag.rounds}/${GUNS[mag.weapon].magazine}`
}
