/**
 * The hero: movement, sword, shield, damage.
 */
import { TILE } from '../world/tiles'
import type { ItemId } from '../items'
import { ITEMS, itemPower } from '../items'

export type Facing = 'up' | 'down' | 'left' | 'right'

export const PLAYER_SIZE = 12
const WALK_SPEED = 62 // pixels per second
const ATTACK_FRAMES = 14
const INVULNERABLE_FRAMES = 60
const KNOCKBACK_SPEED = 140

export interface Loadout {
  sword: ItemId
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
    return itemPower(this.loadout.sword)
  }

  /** How far the blade reaches beyond the body — better swords reach further. */
  get swordReach(): number {
    return 10 + this.swordDamage * 3
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

  attack(): void {
    if (this.attackTimer <= 0) this.attackTimer = ATTACK_FRAMES
  }

  /** The rectangle the sword sweeps, or undefined when not attacking. */
  swordBox(): { x: number; y: number; w: number; h: number } | undefined {
    if (this.attackTimer <= 0) return undefined
    const reach = this.swordReach
    const cx = this.x + PLAYER_SIZE / 2
    const cy = this.y + PLAYER_SIZE / 2
    switch (this.facing) {
      case 'up':
        return { x: cx - 4, y: cy - reach, w: 8, h: reach }
      case 'down':
        return { x: cx - 4, y: cy, w: 8, h: reach }
      case 'left':
        return { x: cx - reach, y: cy - 4, w: reach, h: 8 }
      case 'right':
        return { x: cx, y: cy - 4, w: reach, h: 8 }
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
  ): void {
    if (this.attackTimer > 0) this.attackTimer -= 1
    if (this.invulnerable > 0) this.invulnerable -= 1

    let vx = dx * WALK_SPEED
    let vy = dy * WALK_SPEED

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

    const nextX = this.x + vx * step
    if (!this.collides(nextX, this.y, isBlocked)) this.x = nextX
    const nextY = this.y + vy * step
    if (!this.collides(this.x, nextY, isBlocked)) this.y = nextY
  }

  private collides(x: number, y: number, isBlocked: (x: number, y: number) => boolean): boolean {
    // Test the four corners of a body slightly smaller than a tile, so the
    // player fits through a one-tile gap without pixel-perfect steering.
    const inset = 2
    const left = x + inset
    const right = x + PLAYER_SIZE - inset
    const top = y + inset
    const bottom = y + PLAYER_SIZE - inset
    return (
      isBlocked(left, top) || isBlocked(right, top) || isBlocked(left, bottom) || isBlocked(right, bottom)
    )
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
    const parts = [ITEMS[this.loadout.sword].name, ITEMS[this.loadout.shield].name]
    if (this.loadout.tunic) parts.push(ITEMS[this.loadout.tunic].name)
    return parts.join(' · ')
  }
}
