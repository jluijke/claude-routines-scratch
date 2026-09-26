/**
 * The hero: movement, sword, shield, damage.
 */
import { TILE } from '../world/tiles'
import type { ItemId } from '../items'
import { ITEMS, itemPower } from '../items'

export type Facing = 'up' | 'down' | 'left' | 'right'

export const PLAYER_SIZE = 12
/**
 * The body is tested slightly smaller than a tile, so the player fits through a
 * one-tile gap without pixel-perfect steering. Exported so the map checks can
 * ask exactly the question the game asks.
 */
export const BODY_INSET = 2

/** The four points the collision test samples for a body at (x, y). */
export function bodyCorners(x: number, y: number): [number, number][] {
  const left = x + BODY_INSET
  const right = x + PLAYER_SIZE - BODY_INSET
  const top = y + BODY_INSET
  const bottom = y + PLAYER_SIZE - BODY_INSET
  return [
    [left, top],
    [right, top],
    [left, bottom],
    [right, bottom],
  ]
}
export const WALK_SPEED = 62 // pixels per second

/**
 * Out on the rocks there is nothing to push against.
 *
 * On solid ground a key is a velocity: press it and he is moving, let go and
 * he has stopped. In the vacuum outside the ship he has weight but no grip, so
 * a key becomes a push instead — he takes a moment to get going and coasts a
 * little when he stops.
 *
 * Both numbers are deliberately gentle. The point is that stepping out of an
 * airlock *feels* different, not that the controls stop answering: at a drag
 * of 0.90 he coasts about half a tile after letting go, which reads as
 * floating rather than as ice. A nine-year-old dodging a charging mech has to
 * be able to get out of the way, and every pixel of coast is a pixel he did
 * not ask for.
 */
const FLOAT_PUSH = 0.08
const FLOAT_DRAG = 0.94
const ATTACK_FRAMES = 14
/** Reach beyond the body for the weakest sword: a full tile. */
const BLADE_LENGTH = 14
/**
 * How wide the swing is across the facing direction. Matched to the monsters,
 * which are 14 px, so a hit is not lost to being three pixels too high.
 */
const SWING_WIDTH = 14
/**
 * Frames of invulnerability after a hit — a second and a half.
 *
 * At one second, standing in a room with two enemies cost roughly a heart per
 * second, which for a nine-year-old with three hearts is a death sentence for
 * hesitating. This is also closer to what the games this borrows from did.
 */
const INVULNERABLE_FRAMES = 90
const KNOCKBACK_SPEED = 140

export interface Loadout {
  /** Absent until he finds one. The quest starts with empty hands. */
  sword?: ItemId
  shield: ItemId
  tunic?: ItemId
  ring?: ItemId
}

export class Player {
  x = 0
  y = 0
  facing: Facing = 'down'
  hearts: number
  maxHearts: number

  /** Counts down while the sword is out. */
  attackTimer = 0
  /** Counts down after taking a hit; the sprite flashes and cannot be hurt. */
  invulnerable = 0
  /** Carried momentum out on the rocks, where nothing stops him but time. */
  private driftX = 0
  private driftY = 0
  private knockX = 0
  private knockY = 0
  /** Animation frame toggle. */
  private walkPhase = 0
  private moving = false

  constructor(
    public loadout: Loadout,
    hearts: number,
    maxHearts: number,
  ) {
    this.hearts = hearts
    this.maxHearts = maxHearts
  }

  get swordDamage(): number {
    return this.loadout.sword ? itemPower(this.loadout.sword) : 0
  }

  /**
   * How far the blade reaches *beyond the body*, in pixels.
   *
   * This used to be measured from the player's centre, which meant half of it
   * was inside him and only seven pixels stuck out — less than half a tile.
   * Standing and swinging at a two-hit monster took over a hundred swings,
   * because you had to be almost touching it and perfectly lined up. A tile of
   * reach is the least that feels like a sword.
   */
  get swordReach(): number {
    return BLADE_LENGTH + this.swordDamage * 2
  }

  get isAttacking(): boolean {
    return this.attackTimer > 0
  }

  get animationFrame(): 'A' | 'B' {
    return this.moving && Math.floor(this.walkPhase / 8) % 2 === 1 ? 'B' : 'A'
  }

  /** Damage reduction from tunic and ring, as a fraction kept. */
  private get damageTaken(): number {
    const tunic = this.loadout.tunic ? itemPower(this.loadout.tunic) : 0
    const ring = this.loadout.ring ? itemPower(this.loadout.ring) : 0
    // Each point of protection removes a quarter, floored so a hit always hurts.
    return Math.max(0.25, 1 - (tunic + ring) * 0.25)
  }

  attack(frames = ATTACK_FRAMES): void {
    if (this.attackTimer <= 0) this.attackTimer = frames
  }

  /**
   * The rectangle the sword sweeps, or undefined when not attacking.
   *
   * Measured from the edge of the body outward, so the whole of it is in front
   * of him and none of it wasted inside him.
   */
  swordBox(): { x: number; y: number; w: number; h: number } | undefined {
    // No sword, no swing: one guard turns off both the hitbox and the blade.
    if (!this.loadout.sword) return undefined
    if (this.attackTimer <= 0) return undefined
    const reach = this.swordReach
    const cx = this.x + PLAYER_SIZE / 2
    const cy = this.y + PLAYER_SIZE / 2
    const half = SWING_WIDTH / 2
    switch (this.facing) {
      case 'up':
        return { x: cx - half, y: this.y - reach, w: SWING_WIDTH, h: reach }
      case 'down':
        return { x: cx - half, y: this.y + PLAYER_SIZE, w: SWING_WIDTH, h: reach }
      case 'left':
        return { x: this.x - reach, y: cy - half, w: reach, h: SWING_WIDTH }
      case 'right':
        return { x: this.x + PLAYER_SIZE, y: cy - half, w: reach, h: SWING_WIDTH }
    }
  }

  /**
   * True when a projectile coming from (dx, dy) hits the front of the shield.
   * You have to be facing it, which is what makes shields interesting.
   */
  blocks(dx: number, dy: number): boolean {
    const power = itemPower(this.loadout.shield)
    if (power <= 0) return false
    switch (this.facing) {
      case 'up':
        return dy > 0.3
      case 'down':
        return dy < -0.3
      case 'left':
        return dx > 0.3
      case 'right':
        return dx < -0.3
    }
  }

  hurt(amount: number, fromX: number, fromY: number): boolean {
    if (this.invulnerable > 0) return false
    const taken = Math.max(1, Math.round(amount * this.damageTaken))
    this.hearts = Math.max(0, this.hearts - taken)
    this.invulnerable = INVULNERABLE_FRAMES

    const dx = this.x - fromX
    const dy = this.y - fromY
    const length = Math.hypot(dx, dy) || 1
    this.knockX = (dx / length) * KNOCKBACK_SPEED
    this.knockY = (dy / length) * KNOCKBACK_SPEED
    return true
  }

  heal(hearts: number): void {
    this.hearts = Math.min(this.maxHearts, this.hearts + hearts)
  }

  addHeartContainer(): void {
    this.maxHearts += 1
    this.hearts = this.maxHearts
  }

  isDead(): boolean {
    return this.hearts <= 0
  }

  /**
   * Moves with wall sliding: pushing diagonally into a wall keeps the part of
   * the movement that is free, which stops a child getting stuck on corners.
   */
  update(
    step: number,
    dx: number,
    dy: number,
    isBlocked: (x: number, y: number) => boolean,
    floating = false,
  ): void {
    if (this.attackTimer > 0) this.attackTimer -= 1
    if (this.invulnerable > 0) this.invulnerable -= 1

    let vx: number
    let vy: number
    if (floating) {
      // A push, not a velocity: he eases up to speed, and coasts down from it
      // when the push stops. One or the other, never both — easing toward zero
      // *and* applying drag compounds into a much shorter coast than the drag
      // alone describes, which is why the first attempt at this barely read as
      // anything at all.
      if (dx !== 0) this.driftX += (dx * WALK_SPEED - this.driftX) * FLOAT_PUSH
      else this.driftX *= FLOAT_DRAG
      if (dy !== 0) this.driftY += (dy * WALK_SPEED - this.driftY) * FLOAT_PUSH
      else this.driftY *= FLOAT_DRAG
      // Below a pixel a second he has stopped, and leaving a hundredth of a
      // pixel on the clock leaves him drifting for ever.
      if (Math.abs(this.driftX) < 1) this.driftX = 0
      if (Math.abs(this.driftY) < 1) this.driftY = 0
      vx = this.driftX
      vy = this.driftY
    } else {
      this.driftX = 0
      this.driftY = 0
      vx = dx * WALK_SPEED
      vy = dy * WALK_SPEED
    }

    if (this.knockX !== 0 || this.knockY !== 0) {
      vx += this.knockX
      vy += this.knockY
      this.knockX *= 0.82
      this.knockY *= 0.82
      if (Math.abs(this.knockX) < 4) this.knockX = 0
      if (Math.abs(this.knockY) < 4) this.knockY = 0
    }

    this.moving = dx !== 0 || dy !== 0
    if (this.moving) {
      this.walkPhase += 1
      // Face the dominant axis, so the sprite never looks sideways up a corridor.
      if (Math.abs(dx) > Math.abs(dy)) this.facing = dx < 0 ? 'left' : 'right'
      else if (dy !== 0) this.facing = dy < 0 ? 'up' : 'down'
    }

    // If he is already inside a wall — which should never happen, but one
    // unchecked shove left a child unable to move in any direction, ever — let
    // him walk out. While stuck, any step that does not make the overlap worse
    // is allowed, which is enough to reach open ground; a step must clear the
    // wall entirely to be legal again once he is out. Strictly *reducing* the
    // count does not work: he moves a pixel a frame, and a corner's tile does
    // not change until it has crossed the boundary.
    const trapped = this.blockedCorners(this.x, this.y, isBlocked)
    const allowed = (x: number, y: number): boolean => {
      const after = this.blockedCorners(x, y, isBlocked)
      return after === 0 || (trapped > 0 && after <= trapped)
    }

    const nextX = this.x + vx * step
    if (allowed(nextX, this.y)) this.x = nextX
    // Drifting into a rock stops him against it. Keeping the momentum would
    // store it up and fling him sideways the moment he turned away.
    else this.driftX = 0
    const nextY = this.y + vy * step
    if (allowed(this.x, nextY)) this.y = nextY
    else this.driftY = 0
  }

  /** How fast he is coasting, for the checks and for the bob that draws it. */
  driftSpeed(): number {
    return Math.hypot(this.driftX, this.driftY)
  }

  /** True if the body would overlap something solid at this position. */
  overlaps(x: number, y: number, isBlocked: (x: number, y: number) => boolean): boolean {
    return this.blockedCorners(x, y, isBlocked) > 0
  }

  private blockedCorners(x: number, y: number, isBlocked: (x: number, y: number) => boolean): number {
    let count = 0
    for (const [cx, cy] of bodyCorners(x, y)) if (isBlocked(cx, cy)) count++
    return count
  }

  centre(): { x: number; y: number } {
    return { x: this.x + PLAYER_SIZE / 2, y: this.y + PLAYER_SIZE / 2 }
  }

  placeAtTile(col: number, row: number): void {
    this.x = col * TILE + (TILE - PLAYER_SIZE) / 2
    this.y = row * TILE + (TILE - PLAYER_SIZE) / 2
    this.knockX = 0
    this.knockY = 0
  }

  describeLoadout(): string {
    const parts = [this.loadout.sword ? ITEMS[this.loadout.sword].name : 'Bare hands', ITEMS[this.loadout.shield].name]
    if (this.loadout.tunic) parts.push(ITEMS[this.loadout.tunic].name)
    return parts.join(' · ')
  }
}
