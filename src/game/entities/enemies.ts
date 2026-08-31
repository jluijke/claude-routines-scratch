/**
 * Three enemy archetypes and two bosses.
 *
 * Shooter stands off and spits stones, chaser closes and hits hard, flyer moves
 * unpredictably and ignores walls. Between them they cover the three things a
 * child has to learn to handle: positioning, timing, and patience.
 */
import type { EnemyKind } from '../world/screens'
import type { SpriteName } from '../render/sprites'
import { TILE } from '../world/tiles'
import { Rng } from '../../core/rng'

export interface Projectile {
  x: number
  y: number
  vx: number
  vy: number
  damage: number
  life: number
  magic: boolean
}

interface Archetype {
  hp: number
  speed: number
  damage: number
  size: number
  spriteA: SpriteName
  spriteB: SpriteName
  /** Frames between shots; 0 means it never shoots. */
  fireRate: number
  rupeeValue: number
  ignoresWalls?: boolean
  boss?: boolean
}

const ARCHETYPES: Record<EnemyKind, Archetype> = {
  shooter: {
    hp: 2, speed: 26, damage: 1, size: 14,
    spriteA: 'shooterA', spriteB: 'shooterB', fireRate: 110, rupeeValue: 1,
  },
  chaser: {
    hp: 4, speed: 40, damage: 2, size: 14,
    spriteA: 'chaserA', spriteB: 'chaserB', fireRate: 0, rupeeValue: 3,
  },
  flyer: {
    hp: 2, speed: 52, damage: 1, size: 12,
    spriteA: 'flyerA', spriteB: 'flyerB', fireRate: 0, rupeeValue: 2,
    ignoresWalls: true,
  },
  boss1: {
    hp: 18, speed: 30, damage: 2, size: 30,
    spriteA: 'bossA', spriteB: 'bossA', fireRate: 90, rupeeValue: 25, boss: true,
  },
  boss2: {
    hp: 28, speed: 38, damage: 3, size: 30,
    spriteA: 'bossA', spriteB: 'bossA', fireRate: 60, rupeeValue: 40, boss: true,
  },
}

export class Enemy {
  x: number
  y: number
  hp: number
  readonly kind: EnemyKind
  readonly def: Archetype
  hurtTimer = 0
  private cooldown: number
  private dirX = 0
  private dirY = 1
  private turnTimer = 0
  private phase = 0
  private readonly rng: Rng
  /** Set while distracted by bait. */
  private baitTimer = 0
  private baitX = 0
  private baitY = 0

  constructor(kind: EnemyKind, col: number, row: number, seed: number) {
    this.kind = kind
    this.def = ARCHETYPES[kind]
    this.x = col * TILE + (TILE - this.def.size) / 2
    this.y = row * TILE + (TILE - this.def.size) / 2
    this.hp = this.def.hp
    this.rng = new Rng(seed)
    this.cooldown = this.def.fireRate > 0 ? this.rng.int(30, this.def.fireRate) : 0
  }

  get size(): number {
    return this.def.size
  }

  get isBoss(): boolean {
    return this.def.boss === true
  }

  get sprite(): SpriteName {
    return Math.floor(this.phase / 14) % 2 === 0 ? this.def.spriteA : this.def.spriteB
  }

  centre(): { x: number; y: number } {
    return { x: this.x + this.size / 2, y: this.y + this.size / 2 }
  }

  box(): { x: number; y: number; w: number; h: number } {
    return { x: this.x, y: this.y, w: this.size, h: this.size }
  }

  /** Bait drops nearby: the enemy goes for the food instead of the player. */
  distract(x: number, y: number): void {
    this.baitTimer = 300
    this.baitX = x
    this.baitY = y
  }

  hurt(amount: number): boolean {
    if (this.hurtTimer > 0) return false
    this.hp -= amount
    this.hurtTimer = 12
    return true
  }

  isDead(): boolean {
    return this.hp <= 0
  }

  update(
    step: number,
    target: { x: number; y: number },
    isBlocked: (x: number, y: number) => boolean,
    fire: (projectile: Projectile) => void,
  ): void {
    this.phase += 1
    if (this.hurtTimer > 0) this.hurtTimer -= 1
    if (this.baitTimer > 0) this.baitTimer -= 1

    const goal = this.baitTimer > 0 ? { x: this.baitX, y: this.baitY } : target
    const me = this.centre()
    const toGoalX = goal.x - me.x
    const toGoalY = goal.y - me.y
    const distance = Math.hypot(toGoalX, toGoalY) || 1

    switch (this.kind) {
      case 'shooter': {
        // Wanders, but lines up with the player before spitting.
        this.turnTimer -= 1
        if (this.turnTimer <= 0) {
          this.turnTimer = this.rng.int(40, 110)
          const options: [number, number][] = [[1, 0], [-1, 0], [0, 1], [0, -1]]
          const chosen = this.rng.pick(options) ?? [0, 1]
          this.dirX = chosen[0]
          this.dirY = chosen[1]
        }
        this.step(step, this.dirX, this.dirY, isBlocked)
        break
      }
      case 'chaser': {
        this.step(step, toGoalX / distance, toGoalY / distance, isBlocked)
        break
      }
      case 'flyer': {
        // Erratic: drifts toward the player but veers off constantly.
        this.turnTimer -= 1
        if (this.turnTimer <= 0) {
          this.turnTimer = this.rng.int(18, 40)
          this.dirX = toGoalX / distance + (this.rng.next() - 0.5) * 1.8
          this.dirY = toGoalY / distance + (this.rng.next() - 0.5) * 1.8
          const length = Math.hypot(this.dirX, this.dirY) || 1
          this.dirX /= length
          this.dirY /= length
        }
        this.step(step, this.dirX, this.dirY, isBlocked)
        break
      }
      case 'boss1':
      case 'boss2': {
        // Advances steadily and cannot be out-walked forever.
        this.step(step, toGoalX / distance, toGoalY / distance, isBlocked)
        break
      }
    }

    if (this.def.fireRate > 0) {
      this.cooldown -= 1
      if (this.cooldown <= 0) {
        this.cooldown = this.def.fireRate
        const speed = this.isBoss ? 78 : 62
        fire({
          x: me.x - 4,
          y: me.y - 4,
          vx: (toGoalX / distance) * speed,
          vy: (toGoalY / distance) * speed,
          damage: this.def.damage,
          life: 180,
          magic: this.isBoss,
        })
        // The second boss fires a spread rather than a single bolt.
        if (this.kind === 'boss2') {
          for (const angle of [-0.4, 0.4]) {
            const cos = Math.cos(angle)
            const sin = Math.sin(angle)
            const nx = (toGoalX / distance) * cos - (toGoalY / distance) * sin
            const ny = (toGoalX / distance) * sin + (toGoalY / distance) * cos
            fire({ x: me.x - 4, y: me.y - 4, vx: nx * speed, vy: ny * speed, damage: this.def.damage, life: 180, magic: true })
          }
        }
      }
    }
  }

  private step(
    step: number,
    dx: number,
    dy: number,
    isBlocked: (x: number, y: number) => boolean,
  ): void {
    const speed = this.def.speed * step
    const nextX = this.x + dx * speed
    const nextY = this.y + dy * speed

    if (this.def.ignoresWalls) {
      // Flyers pass over walls but stay inside the screen.
      this.x = clamp(nextX, TILE / 2, 15 * TILE - this.size)
      this.y = clamp(nextY, TILE / 2, 10 * TILE - this.size)
      return
    }

    if (!this.blockedAt(nextX, this.y, isBlocked)) this.x = nextX
    else this.turnTimer = 0
    if (!this.blockedAt(this.x, nextY, isBlocked)) this.y = nextY
    else this.turnTimer = 0
  }

  private blockedAt(x: number, y: number, isBlocked: (x: number, y: number) => boolean): boolean {
    const inset = 2
    return (
      isBlocked(x + inset, y + inset) ||
      isBlocked(x + this.size - inset, y + inset) ||
      isBlocked(x + inset, y + this.size - inset) ||
      isBlocked(x + this.size - inset, y + this.size - inset)
    )
  }

  rupeeValue(): number {
    return this.def.rupeeValue
  }
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

export function overlaps(
  a: { x: number; y: number; w: number; h: number },
  b: { x: number; y: number; w: number; h: number },
): boolean {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y
}
