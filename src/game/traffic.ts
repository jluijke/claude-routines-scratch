/**
 * Traffic: the cars on the streets of Level 3, and the lights they obey.
 *
 * A road is read off the tiles. Every long run of road tiles — across a
 * screen for a street, up it for an avenue — is a lane, and lanes that sit
 * side by side are one road: on a two-way road the near half goes one way and
 * the far half the other, the way right-hand traffic does; an avenue can be
 * one-way, the way most of them are. Cars come in from off the screen at one
 * end, drive the lane, and leave at the other.
 *
 * The lights are one clock for the whole city: for six seconds the avenues
 * have the green and the streets are red, then the other way about. A red
 * road's cars stop at the first crosswalk in their way and queue behind each
 * other; the crosswalk over a red road shows the walking man, and that is
 * when a child can cross. The hand flashes for a second and a half before it
 * changes back, which is the only warning he gets.
 *
 * A car that is in a crossing when its light goes red drives on out of it —
 * nobody stops in the middle of an intersection — which is what the "paired
 * crosswalk" rule below is for.
 */
import type { Rng } from '../core/rng'
import { SCREEN_COLS, SCREEN_ROWS, TILE } from './world/tiles'
import type { Screen } from './world/screens'
import type { SpriteName } from './render/sprites'
import type { Atlas } from './render/atlas'

/** A full cycle of the lights, in frames: twelve seconds. */
export const LIGHT_CYCLE = 720
/** The avenues have the first half; the streets the second. */
const HALF_CYCLE = LIGHT_CYCLE / 2
/** How long the hand flashes before the walking man goes out. */
export const FLASH_FRAMES = 90
/**
 * The all-red: how long after a road turns red before its crosswalk shows the
 * walking man. A car that was in the intersection when the light changed is
 * driving on out of it, over that crosswalk, for about this long.
 */
export const ALL_RED = 90

/** Along the screen ('x': a street) or up it ('y': an avenue). */
export type Axis = 'x' | 'y'

export interface Lane {
  axis: Axis
  /** The row (for a street) or column (for an avenue) the lane runs along. */
  at: number
  /** First and last tile of the run, inclusive. */
  from: number
  to: number
  /** +1 runs toward higher tiles (right, or down); -1 the other way. */
  dir: 1 | -1
  /** Pixels a second. Avenues are quick, streets are not. */
  speed: number
  /** Tiles along the run that are crosswalk. */
  crosswalks: number[]
}

/** A car is a point on its lane and a sprite; the lane knows the rest. */
export interface Car {
  lane: Lane
  /** The car's centre along the lane's axis, in pixels. */
  pos: number
  kind: CarKind
}

export type CarKind = 'taxi' | 'carWhite' | 'carBlue' | 'carRed' | 'carGrey'

/** Every car is two tiles long and one wide, pointing along its lane. */
export const CAR_LENGTH = 24
export const CAR_WIDTH = 16

/** A lane has to be this long to carry traffic: a stub of side street does not. */
const MIN_LANE = 8
/**
 * A car will not stop between two crosswalks this close together: that is
 * an intersection. A four-lane avenue's crosswalks sit five tiles apart.
 */
const INTERSECTION_TILES = 6
/** The gap a car keeps from the one ahead. */
const FOLLOW_GAP = 6

const isRoad = (screen: Screen, col: number, row: number): boolean =>
  'BS'.includes((screen.rows[row] ?? '')[col] ?? '#')
const isCrosswalk = (screen: Screen, col: number, row: number): boolean =>
  ((screen.rows[row] ?? '')[col] ?? '#') === 'S'

/** Which axis has the green light at this frame. */
export function greenAxis(frame: number): Axis {
  return frame % LIGHT_CYCLE < HALF_CYCLE ? 'y' : 'x'
}

/**
 * Whether a person may cross a road that runs along `axis`: only while it is
 * red, and only once the cars that were already in the crossing have cleared.
 */
export function walkAcross(axis: Axis, frame: number): boolean {
  return greenAxis(frame) !== axis && frame % HALF_CYCLE >= ALL_RED
}

/** The hand is flashing: the walk is about to end. */
export function walkFlashing(axis: Axis, frame: number): boolean {
  if (!walkAcross(axis, frame)) return false
  const into = frame % HALF_CYCLE
  return into >= HALF_CYCLE - FLASH_FRAMES
}

/**
 * The lanes on a screen, read off its road tiles.
 *
 * Runs of road along a row are street lanes; runs down a column are avenue
 * lanes. Adjacent lanes of one axis are one road, and the road decides the
 * directions: the first half of its lanes one way, the second half the other,
 * unless the screen says the avenue is one-way.
 */
export function lanesOf(screen: Screen): Lane[] {
  const lanes: Lane[] = []

  // Streets: runs along each row.
  for (let row = 0; row < SCREEN_ROWS; row++) {
    let start = -1
    for (let col = 0; col <= SCREEN_COLS; col++) {
      const road = col < SCREEN_COLS && isRoad(screen, col, row)
      if (road && start < 0) start = col
      if (!road && start >= 0) {
        if (col - start >= MIN_LANE) lanes.push(lane(screen, 'x', row, start, col - 1))
        start = -1
      }
    }
  }
  // Avenues: runs down each column.
  for (let col = 0; col < SCREEN_COLS; col++) {
    let start = -1
    for (let row = 0; row <= SCREEN_ROWS; row++) {
      const road = row < SCREEN_ROWS && isRoad(screen, col, row)
      if (road && start < 0) start = row
      if (!road && start >= 0) {
        if (row - start >= MIN_LANE) lanes.push(lane(screen, 'y', col, start, row - 1))
        start = -1
      }
    }
  }

  // Group adjacent lanes into roads and give each road its directions.
  for (const axis of ['x', 'y'] as const) {
    const ours = lanes.filter((l) => l.axis === axis).sort((a, b) => a.at - b.at)
    let group: Lane[] = []
    const settle = (): void => {
      if (group.length === 0) return
      const oneWay = axis === 'y' ? screen.traffic?.oneWay : undefined
      const wide = group.length >= 4
      group.forEach((l, i) => {
        // Right-hand traffic: on a street the upper lanes run left and the
        // lower lanes run right; on an avenue the left lanes run down and the
        // right lanes run up.
        const firstHalf = i < group.length / 2
        l.dir = oneWay ? (oneWay === 'up' ? -1 : 1) : axis === 'x' ? (firstHalf ? -1 : 1) : firstHalf ? 1 : -1
        l.speed = wide ? 84 : 52
      })
      group = []
    }
    for (const l of ours) {
      const last = group[group.length - 1]
      if (last && l.at !== last.at + 1) settle()
      group.push(l)
    }
    settle()
  }
  return lanes
}

function lane(screen: Screen, axis: Axis, at: number, from: number, to: number): Lane {
  const crosswalks: number[] = []
  for (let t = from; t <= to; t++) {
    const col = axis === 'x' ? t : at
    const row = axis === 'x' ? at : t
    if (isCrosswalk(screen, col, row)) crosswalks.push(t)
  }
  return { axis, at, from, to, dir: 1, speed: 52, crosswalks }
}

/** Between two crosswalks of one intersection. */
function inIntersection(lane: Lane, pos: number): boolean {
  for (const a of lane.crosswalks) {
    for (const b of lane.crosswalks) {
      if (b <= a || b - a > INTERSECTION_TILES) continue
      if (pos > (a + 1) * TILE - CAR_LENGTH && pos < b * TILE + CAR_LENGTH) return true
    }
  }
  return false
}

/** The screen box a car covers. */
export function carBox(car: Car): { x: number; y: number; w: number; h: number } {
  const { lane } = car
  if (lane.axis === 'x') {
    return { x: car.pos - CAR_LENGTH / 2, y: lane.at * TILE, w: CAR_LENGTH, h: CAR_WIDTH }
  }
  return { x: lane.at * TILE, y: car.pos - CAR_LENGTH / 2, w: CAR_WIDTH, h: CAR_LENGTH }
}

/** Where a lane begins and ends, in pixels, for a car of this direction. */
function entryOf(lane: Lane): number {
  return lane.dir > 0 ? lane.from * TILE - CAR_LENGTH / 2 : (lane.to + 1) * TILE + CAR_LENGTH / 2
}
function pastEnd(car: Car): boolean {
  const { lane } = car
  return lane.dir > 0 ? car.pos - CAR_LENGTH / 2 > (lane.to + 1) * TILE : car.pos + CAR_LENGTH / 2 < lane.from * TILE
}

/**
 * The stop line a car has to hold at when its road is red, or undefined if
 * it may drive on: nothing ahead, or it is already in a crossing.
 */
export function stopLineAhead(car: Car): number | undefined {
  const { lane } = car
  const lead = car.pos + lane.dir * (CAR_LENGTH / 2)
  const lineOf = (t: number): number => (lane.dir > 0 ? t * TILE : (t + 1) * TILE)
  const ahead = (line: number): number => (line - lead) * lane.dir
  let best: number | undefined
  for (const t of lane.crosswalks) {
    const distance = ahead(lineOf(t))
    if (distance < 0) continue
    // Already past another crosswalk of the same intersection: drive on out.
    const paired = lane.crosswalks.some((u) => u !== t && Math.abs(u - t) <= INTERSECTION_TILES && ahead(lineOf(u)) < 0)
    if (paired) continue
    if (best === undefined || distance < ahead(best)) best = lineOf(t)
  }
  return best
}

export class Traffic {
  readonly lanes: Lane[]
  cars: Car[] = []
  private timers = new Map<Lane, number>()

  constructor(
    private readonly screen: Screen,
    private readonly rng: Rng,
  ) {
    this.lanes = lanesOf(screen)
    // A screen is never empty when he arrives: a car or two already on each
    // road, well apart, and none of them stopped on a crosswalk.
    for (const lane of this.lanes) {
      const count = this.rng.int(0, lane.speed > 60 ? 2 : 1)
      for (let i = 0; i < count; i++) {
        const pos = this.rng.int(lane.from * TILE + CAR_LENGTH, (lane.to + 1) * TILE - CAR_LENGTH)
        if (lane.crosswalks.some((t) => Math.abs(pos - (t * TILE + TILE / 2)) < CAR_LENGTH)) continue
        // Nor in the middle of an intersection, where it would have to drive
        // out over a crosswalk somebody may already be standing on.
        if (inIntersection(lane, pos)) continue
        if (this.cars.some((c) => c.lane === lane && Math.abs(c.pos - pos) < CAR_LENGTH * 2)) continue
        this.cars.push({ lane, pos, kind: this.pick() })
      }
      this.timers.set(lane, this.rng.int(30, 160))
    }
  }

  private pick(): CarKind {
    // Half the cars in the city are cabs, which is about right.
    const r = this.rng.int(0, 9)
    return r < 5 ? 'taxi' : r < 7 ? 'carWhite' : r === 7 ? 'carBlue' : r === 8 ? 'carRed' : 'carGrey'
  }

  update(step: number, frame: number): void {
    const green = greenAxis(frame)
    for (const lane of this.lanes) {
      // Spawn at the entry when its turn comes and the entry is clear.
      const left = (this.timers.get(lane) ?? 0) - 1
      if (left <= 0) {
        const entry = entryOf(lane)
        const clear = !this.cars.some((c) => c.lane === lane && Math.abs(c.pos - entry) < CAR_LENGTH * 2)
        if (clear) {
          this.cars.push({ lane, pos: entry, kind: this.pick() })
          this.timers.set(lane, this.rng.int(lane.speed > 60 ? 70 : 120, lane.speed > 60 ? 200 : 320))
        } else {
          this.timers.set(lane, 20)
        }
      } else {
        this.timers.set(lane, left)
      }
    }

    // Front cars first, so a queue moves up in one frame rather than one
    // car per frame.
    const ordered = [...this.cars].sort((a, b) => (b.pos - a.pos) * a.lane.dir)
    for (const car of ordered) {
      const { lane } = car
      let move = lane.speed * step
      const lead = car.pos + lane.dir * (CAR_LENGTH / 2)

      if (green !== lane.axis) {
        const line = stopLineAhead(car)
        if (line !== undefined) {
          const room = (line - lead) * lane.dir
          if (room < move) move = Math.max(0, room)
        }
      }
      // The car in front.
      let nearest: number | undefined
      for (const other of this.cars) {
        if (other === car || other.lane !== lane) continue
        const gap = (other.pos - car.pos) * lane.dir - CAR_LENGTH
        if (gap >= -CAR_LENGTH && (nearest === undefined || gap < nearest)) nearest = gap
      }
      if (nearest !== undefined && nearest - move < FOLLOW_GAP) move = Math.max(0, nearest - FOLLOW_GAP)

      car.pos += lane.dir * move
    }
    this.cars = this.cars.filter((c) => !pastEnd(c))
  }

  /** Every car's box, for whatever is standing in the road. */
  boxes(): { x: number; y: number; w: number; h: number; car: Car }[] {
    return this.cars.map((car) => ({ ...carBox(car), car }))
  }

  draw(ctx: CanvasRenderingContext2D, atlas: Atlas, frame: number): void {
    for (const car of this.cars) {
      const box = carBox(car)
      const way = car.lane.axis === 'x' ? (car.lane.dir > 0 ? 'Right' : 'Left') : car.lane.dir > 0 ? 'Down' : 'Up'
      atlas.draw(ctx, `${car.kind}${way}` as SpriteName, Math.round(box.x), Math.round(box.y))
    }
    this.drawSignals(ctx, frame)
  }

  /**
   * The walk signals: a little box on a pole at the kerb by each crosswalk,
   * showing the walking man while the road it crosses is red and the hand
   * while it is green — flashing for the last moment of the walk.
   */
  private drawSignals(ctx: CanvasRenderingContext2D, frame: number): void {
    const done = new Set<string>()
    for (const lane of this.lanes) {
      const walk = walkAcross(lane.axis, frame)
      const flashing = walkFlashing(lane.axis, frame) && Math.floor(frame / 15) % 2 === 0
      for (const t of lane.crosswalks) {
        // The kerb tile beside the crosswalk, on the near side of the road.
        const road = this.lanes.filter((l) => l.axis === lane.axis && Math.abs(l.at - lane.at) < 4)
        const near = Math.min(...road.map((l) => l.at)) - 1
        const col = lane.axis === 'x' ? t : near
        const row = lane.axis === 'x' ? near : t
        const key = `${col},${row}`
        if (done.has(key)) continue
        if (((this.screen.rows[row] ?? '')[col] ?? '#') !== '.') continue
        done.add(key)
        signal(ctx, col * TILE, row * TILE, walk, flashing)
      }
    }
  }
}

/** The signal itself: a pole, a black box, and the man or the hand in it. */
function signal(ctx: CanvasRenderingContext2D, x: number, y: number, walk: boolean, flashing: boolean): void {
  ctx.fillStyle = '#2a2a30'
  ctx.fillRect(x + 12, y + 8, 1, 8)
  ctx.fillStyle = '#12131a'
  ctx.fillRect(x + 9, y + 1, 7, 8)
  if (walk && !flashing) {
    // The walking man.
    ctx.fillStyle = '#f6f3e7'
    ctx.fillRect(x + 12, y + 2, 1, 1)
    ctx.fillRect(x + 11, y + 3, 3, 2)
    ctx.fillRect(x + 11, y + 5, 1, 1)
    ctx.fillRect(x + 13, y + 5, 1, 1)
    ctx.fillRect(x + 10, y + 6, 1, 2)
    ctx.fillRect(x + 14, y + 6, 1, 2)
  } else if (!walk || flashing) {
    // The hand.
    ctx.fillStyle = '#e2883a'
    ctx.fillRect(x + 11, y + 3, 3, 4)
    ctx.fillRect(x + 10, y + 4, 5, 2)
    ctx.fillRect(x + 12, y + 2, 1, 1)
  }
}
