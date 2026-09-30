/**
 * The rooftop: Tompkins Square through a scope, six floors down.
 *
 * Thirty seconds. Things pop up out of the bushes and duck back down. A rat
 * is worth thirty dollars; a squirrel, which from up here looks almost
 * exactly like a rat, costs fifty. That is the whole game: look before you
 * shoot. Nothing here touches the canvas or the save, so the round can be
 * played through in a test without a browser.
 */
import type { Rng } from '../core/rng'
import { SCREEN_H, SCREEN_W } from './world/tiles'

export type CritterKind = 'rat' | 'squirrel'

export interface Critter {
  kind: CritterKind
  /** Which bush it is behind. */
  spot: number
  x: number
  y: number
  /** Frames left before it ducks back down. */
  frames: number
  /** How long it stays up in all, for the rise and the duck. */
  span: number
  /** Hit. It stays a moment, on its back, and then it is gone. */
  shot: boolean
}

export interface SniperState {
  /** Frames left in the round. */
  frames: number
  crosshair: { x: number; y: number }
  critters: Critter[]
  /** Frames until the bolt is worked and it can fire again. */
  cooldown: number
  /** Frames until something next pops up. */
  nextPop: number
  rats: number
  squirrels: number
  shots: number
  /** Dollars won and lost this round, never below zero in the pocket. */
  earned: number
  /** A frame of white after a shot. */
  flash: number
  /** What just happened, for the sign: "+30", "-50", or nothing. */
  lastHit?: { text: string; x: number; y: number; frames: number }
  done: boolean
}

export const SNIPER_SECONDS = 30
export const RAT_BOUNTY = 30
export const SQUIRREL_FINE = 50
/** Frames the bolt takes between shots. */
export const BOLT_FRAMES = 30
/** How far off the crosshair a hit still counts, in pixels. */
export const HIT_RADIUS = 9
const CROSSHAIR_SPEED = 2.4
const POP_MIN = 30
const POP_MAX = 70
const UP_MIN = 55
const UP_MAX = 95

/** The bushes, as they sit in the view. A critter comes up out of one. */
export const SPOTS: readonly { x: number; y: number }[] = [
  { x: 40, y: 48 },
  { x: 96, y: 36 },
  { x: 160, y: 52 },
  { x: 216, y: 40 },
  { x: 56, y: 104 },
  { x: 128, y: 92 },
  { x: 200, y: 108 },
  { x: 92, y: 146 },
  { x: 176, y: 150 },
]

export function beginSniper(): SniperState {
  return {
    frames: SNIPER_SECONDS * 60,
    crosshair: { x: SCREEN_W / 2, y: SCREEN_H / 2 },
    critters: [],
    cooldown: 0,
    nextPop: 40,
    rats: 0,
    squirrels: 0,
    shots: 0,
    earned: 0,
    flash: 0,
    done: false,
  }
}

export interface SniperInput {
  dx: number
  dy: number
  fire: boolean
  /** A click: the crosshair jumps there and it fires. */
  aimAt?: { x: number; y: number }
}

/** One frame. Returns the state as it is now. */
export function tickSniper(s: SniperState, input: SniperInput, rng: Rng): SniperState {
  if (s.done) return s
  const next: SniperState = { ...s, crosshair: { ...s.crosshair }, critters: s.critters.map((c) => ({ ...c })) }
  next.frames -= 1
  if (next.cooldown > 0) next.cooldown -= 1
  if (next.flash > 0) next.flash -= 1
  if (next.lastHit) {
    next.lastHit = { ...next.lastHit, frames: next.lastHit.frames - 1 }
    if (next.lastHit.frames <= 0) next.lastHit = undefined
  }

  // The crosshair, kept inside the view.
  if (input.aimAt) {
    next.crosshair.x = input.aimAt.x
    next.crosshair.y = input.aimAt.y
  } else {
    next.crosshair.x += input.dx * CROSSHAIR_SPEED
    next.crosshair.y += input.dy * CROSSHAIR_SPEED
  }
  next.crosshair.x = Math.max(6, Math.min(SCREEN_W - 6, next.crosshair.x))
  next.crosshair.y = Math.max(6, Math.min(SCREEN_H - 6, next.crosshair.y))

  // Things come up, and go back down.
  for (const c of next.critters) c.frames -= 1
  next.critters = next.critters.filter((c) => c.frames > 0)
  next.nextPop -= 1
  if (next.nextPop <= 0) {
    next.nextPop = rng.int(POP_MIN, POP_MAX)
    const busy = new Set(next.critters.map((c) => c.spot))
    const free = SPOTS.map((_, i) => i).filter((i) => !busy.has(i))
    const count = Math.min(free.length, rng.chance(0.35) ? 2 : 1)
    for (let n = 0; n < count; n++) {
      const spot = free.splice(rng.int(0, free.length - 1), 1)[0] as number
      const at = SPOTS[spot] as { x: number; y: number }
      const span = rng.int(UP_MIN, UP_MAX)
      // Squirrels are the minority, so a quick trigger finger pays until it
      // does not.
      next.critters.push({ kind: rng.chance(0.38) ? 'squirrel' : 'rat', spot, x: at.x, y: at.y, frames: span, span, shot: false })
    }
  }

  // The trigger.
  if ((input.fire || input.aimAt) && next.cooldown === 0) {
    next.cooldown = BOLT_FRAMES
    next.shots += 1
    next.flash = 3
    const hit = next.critters.find(
      (c) => !c.shot && Math.hypot(c.x - next.crosshair.x, c.y - next.crosshair.y) <= HIT_RADIUS + 4,
    )
    if (hit) {
      hit.shot = true
      // It lies there for a moment and then it is gone.
      hit.frames = Math.min(hit.frames, 20)
      if (hit.kind === 'rat') {
        next.rats += 1
        next.earned += RAT_BOUNTY
        next.lastHit = { text: `+${RAT_BOUNTY}`, x: hit.x, y: hit.y, frames: 40 }
      } else {
        next.squirrels += 1
        next.earned -= SQUIRREL_FINE
        next.lastHit = { text: `-${SQUIRREL_FINE} SQUIRREL`, x: hit.x, y: hit.y, frames: 50 }
      }
    }
  }

  if (next.frames <= 0) {
    next.frames = 0
    next.done = true
  }
  return next
}

/** How far up out of its bush a critter is, 0 hidden to 1 fully up. */
export function critterRise(c: Critter): number {
  const gone = c.span - c.frames
  if (c.shot) return 1
  if (gone < 10) return gone / 10
  if (c.frames < 10) return c.frames / 10
  return 1
}

/** What the round came to, for the sign at the end. */
export function sniperSummary(s: SniperState): string {
  const total = s.earned >= 0 ? `+$${s.earned}` : `-$${-s.earned}`
  const rats = `${s.rats} rat${s.rats === 1 ? '' : 's'}`
  const squirrels = s.squirrels === 0 ? 'no squirrels' : `${s.squirrels} squirrel${s.squirrels === 1 ? '' : 's'}`
  return `Time. ${rats}, ${squirrels}: ${total}.`
}
