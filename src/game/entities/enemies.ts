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
  /** Passes straight through walls rather than stopping at them. */
  throughWalls?: boolean
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
  /** Its shots pass straight through walls, so a corner is no refuge. */
  shootsThroughWalls?: boolean
  boss?: boolean
}

/**
 * True for anything that guards a dungeon. Asked of the table that already
 * knows, so a fifth boss cannot be forgotten by a list of names kept somewhere
 * else — which is exactly what happened to boss3 and boss4.
 */
export function isBossKind(kind: EnemyKind): boolean {
  return ARCHETYPES[kind].boss === true
}

/**
 * How an enemy looks. The land's monsters and the ship's robots are the same
 * archetypes underneath — same health, same speed, same habits — so a child
 * who learned to handle a shooter has learned to handle a drone.
 */
export type EnemyLook = 'monster' | 'robot'

const ROBOT_SPRITES: Record<EnemyKind, [SpriteName, SpriteName]> = {
  shooter: ['droneA', 'droneB'],
  chaser: ['crusherA', 'crusherB'],
  flyer: ['discA', 'discB'],
  caster: ['glitchA', 'glitchB'],
  boss1: ['mechGreyA', 'mechGreyB'],
  boss2: ['mechRedA', 'mechRedB'],
  boss3: ['mechIceA', 'mechIceB'],
  boss4: ['mechBlackA', 'mechBlackB'],
}

/**
 * The four mechs of the rocks, and the one thing each of them does.
 *
 * The land's guardians all fight the same way — walk at him, fire a bolt — and
 * for a long time the ship's did too, because they were the same four objects
 * with a different sprite. Four identical fights is three fights wasted, and it
 * is why the second half of the game felt thinner than the first.
 *
 * So each mech gets one idea, and only one, which is how the machines this is
 * drawn after did it:
 *
 * - **charge** winds up, slams across the room, and knocks itself silly on the
 *   far wall. It never shoots. The whole fight is reading the wind-up.
 * - **split** breaks in two when it is half dead, and both halves are still
 *   coming.
 * - **shield** cannot be hurt at all until it fires — the shield drops for a
 *   moment with the shot, and that moment is the fight.
 * - **phase** blinks out and reappears somewhere else, the way the ship's
 *   glitches do. Nothing else in the game teleports at you.
 */
export type MechTrick = 'charge' | 'split' | 'shield' | 'phase'

interface Mech {
  trick: MechTrick
  hp: number
  speed: number
  damage: number
  /** 0 for the charger: its whole threat is its body. */
  fireRate: number
}

const MECHS: Record<'boss1' | 'boss2' | 'boss3' | 'boss4', Mech> = {
  boss1: { trick: 'charge', hp: 20, speed: 24, damage: 2, fireRate: 0 },
  boss2: { trick: 'split', hp: 30, speed: 34, damage: 3, fireRate: 70 },
  boss3: { trick: 'shield', hp: 34, speed: 30, damage: 3, fireRate: 100 },
  boss4: { trick: 'phase', hp: 46, speed: 40, damage: 3, fireRate: 60 },
}

function mechFor(kind: EnemyKind, look: EnemyLook): Mech | undefined {
  if (look !== 'robot') return undefined
  return MECHS[kind as keyof typeof MECHS]
}

/**
 * How fast the charger crosses the room, against its stalking speed.
 *
 * It stalks at 24 and charges at seven and a half times that, which is about
 * three times the hero's walk. At the first value it tried this was 3.6, and
 * the charge ran out of frames in the middle of the room and never reached a
 * wall — so it never slammed, never dazed, and the fight had no opening in it
 * at all.
 */
const CHARGE_SPEED = 7.5
/** Frames it stands and shakes before it comes, and frames it is dazed after. */
const WIND_UP = 46
const DAZED = 74
/** Frames the ice mech's shield stays down after it fires. */
const SHIELD_OPEN = 58
/** How far off it has to be to bother charging, rather than simply shoving. */
const CHARGE_REACH = 44

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
  caster: {
    // Shots that ignore walls are already the hard part. Two of these in a
    // room emptied twelve hearts in four seconds at the original numbers,
    // which is not a fight, it is a punishment.
    hp: 3, speed: 0, damage: 1, size: 14,
    spriteA: 'casterA', spriteB: 'casterB', fireRate: 165, rupeeValue: 4,
    shootsThroughWalls: true,
  },
  boss1: {
    hp: 18, speed: 30, damage: 2, size: 30,
    spriteA: 'bossA', spriteB: 'bossA', fireRate: 90, rupeeValue: 25, boss: true,
  },
  boss2: {
    hp: 28, speed: 38, damage: 3, size: 30,
    spriteA: 'bossA', spriteB: 'bossA', fireRate: 60, rupeeValue: 40, boss: true,
  },
  boss3: {
    hp: 34, speed: 34, damage: 3, size: 30,
    spriteA: 'bossA', spriteB: 'bossA', fireRate: 55, rupeeValue: 55, boss: true,
  },
  boss4: {
    hp: 44, speed: 42, damage: 3, size: 30,
    spriteA: 'bossA', spriteB: 'bossA', fireRate: 45, rupeeValue: 80, boss: true,
  },
}

export class Enemy {
  x: number
  y: number
  hp: number
  readonly kind: EnemyKind
  readonly def: Archetype
  readonly look: EnemyLook
  hurtTimer = 0
  private cooldown: number
  private dirX = 0
  private dirY = 1
  private turnTimer = 0
  private phase = 0
  private readonly rng: Rng
  /**
   * Frames until the next blink, for enemies that teleport.
   *
   * At the original two-and-a-half seconds it could cross the room faster than
   * the player could walk to it, so it could never be cornered and killed — an
   * enemy that is merely annoying rather than a fight.
   */
  private blinkTimer = 300
  /** Counts down while fading in or out of a blink. */
  private blinkPhase = 0
  /** Set while distracted by bait. */
  private baitTimer = 0
  private baitX = 0
  private baitY = 0

  /** Which of the four rock mechs this is, if it is one at all. */
  readonly mech: Mech | undefined
  /** True for the two pieces a split mech leaves behind. */
  readonly isHalf: boolean
  /** Where the charger is in its wind up, run and daze. */
  private chargeState: 'stalk' | 'wind' | 'run' | 'dazed' = 'stalk'
  private chargeTimer = 0
  private runX = 0
  private runY = 0
  /**
   * Set on the frame a charge ends against a wall, and cleared by the world,
   * which owns the noise and the shake. The enemy does not know about either.
   */
  slammed = false
  /** Counts down while the ice mech's shield is out of the way. */
  private openTimer = 0
  /** Lit for a few frames when a blow is turned aside, so it reads as a block. */
  blockFlash = 0
  /** Set the moment a splitter drops past half, and cleared by the world. */
  wantsSplit = false
  private hasSplit = false

  constructor(
    kind: EnemyKind,
    col: number,
    row: number,
    seed: number,
    look: EnemyLook = 'monster',
    options: { half?: boolean } = {},
  ) {
    this.kind = kind
    this.look = look
    this.isHalf = options.half === true
    this.mech = mechFor(kind, look)
    // A mech overrides the guardian's numbers it was cloned from; a half is
    // smaller and softer again, so two of them are a fight rather than twice
    // the fight he had just nearly won.
    const base = ARCHETYPES[kind]
    const merged = this.mech ? { ...base, ...this.mech } : base
    this.def = this.isHalf
      ? { ...merged, hp: Math.ceil(merged.hp / 2), size: Math.round(merged.size * 0.62) }
      : merged
    this.x = col * TILE + (TILE - this.def.size) / 2
    this.y = row * TILE + (TILE - this.def.size) / 2
    this.hp = this.def.hp
    this.rng = new Rng(seed)
    this.cooldown = this.def.fireRate > 0 ? this.rng.int(30, this.def.fireRate) : 0
    // The phasing mech blinks on the caster's clock, but sooner the first time
    // so that it shows him the trick early rather than after a long plain walk.
    if (this.mech?.trick === 'phase') this.blinkTimer = 120
    // A moment of walking before the first wind-up, so the room is not a
    // charge the instant he steps through the door.
    if (this.mech?.trick === 'charge') this.chargeTimer = 70
  }

  /** True while the ice mech's shield is up: nothing can touch it. */
  get isShielded(): boolean {
    return this.mech?.trick === 'shield' && this.openTimer <= 0
  }

  /** True while the charger is dazed against the wall — the window to hit it. */
  get isDazed(): boolean {
    return this.chargeState === 'dazed'
  }

  /** True while it is gathering itself to charge, which is the tell. */
  get isWindingUp(): boolean {
    return this.chargeState === 'wind'
  }

  get size(): number {
    return this.def.size
  }

  get isBoss(): boolean {
    return this.def.boss === true
  }

  get sprite(): SpriteName {
    const first = Math.floor(this.phase / 14) % 2 === 0
    if (this.look === 'robot') return ROBOT_SPRITES[this.kind][first ? 0 : 1]
    return first ? this.def.spriteA : this.def.spriteB
  }

  /** True while blinking out or in — the sprite flickers and cannot be hit. */
  get isBlinking(): boolean {
    return this.blinkPhase > 0
  }

  get shotsPassWalls(): boolean {
    return this.def.shootsThroughWalls === true
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
    // Mid-blink it is not really there to hit.
    if (this.blinkPhase > 12) return false
    // Behind its shield it takes nothing at all, however hard he swings.
    if (this.isShielded) return false
    this.hp -= amount
    this.hurtTimer = 12
    // Half dead, and it comes apart. Once only, and never for the pieces.
    if (this.mech?.trick === 'split' && !this.isHalf && !this.hasSplit && this.hp <= this.def.hp / 2) {
      this.hasSplit = true
      this.wantsSplit = true
    }
    return true
  }

  /**
   * A blow the shield turned aside. True once per swing rather than once per
   * frame, so the clang does not come out as a machine gun.
   */
  deflect(): boolean {
    if (this.blockFlash > 0) return false
    this.blockFlash = 16
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
    if (this.blockFlash > 0) this.blockFlash -= 1
    if (this.openTimer > 0) this.openTimer -= 1

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
      case 'caster': {
        // Never chases. It blinks somewhere else and keeps casting, so a
        // corner is no refuge and you have to go to it.
        this.blinkTimer -= 1
        if (this.blinkPhase > 0) this.blinkPhase -= 1
        if (this.blinkTimer <= 0) {
          this.blinkTimer = this.rng.int(280, 430)
          this.blinkPhase = 24
          this.blinkTo(isBlocked, me)
        }
        break
      }
      case 'boss1':
      case 'boss2':
      case 'boss3':
      case 'boss4': {
        if (this.mech) this.updateMech(step, toGoalX / distance, toGoalY / distance, isBlocked, me, distance)
        // Advances steadily and cannot be out-walked forever.
        else this.step(step, toGoalX / distance, toGoalY / distance, isBlocked)
        break
      }
    }

    // A charger has no gun, and a mech winding up or picking itself off the
    // floor is in no state to use one.
    const canShoot =
      this.def.fireRate > 0 && (this.mech === undefined || this.chargeState === 'stalk')
    if (canShoot) {
      this.cooldown -= 1
      if (this.cooldown <= 0) {
        this.cooldown = this.def.fireRate
        // The shield comes down with the shot and stays down for a moment.
        // Firing is the only thing that opens it, which is what makes the
        // fight a matter of waiting rather than of swinging harder.
        if (this.mech?.trick === 'shield') this.openTimer = SHIELD_OPEN
        const speed = this.isBoss ? 78 : 62
        fire({
          x: me.x - 4,
          y: me.y - 4,
          vx: (toGoalX / distance) * speed,
          vy: (toGoalY / distance) * speed,
          damage: this.def.damage,
          life: 180,
          magic: this.isBoss || this.shotsPassWalls,
          throughWalls: this.shotsPassWalls,
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

  /**
   * How a mech moves, which is the only part of it that differs by rock.
   *
   * Everything here is deliberately slow and legible: a child has to be able
   * to see the wind-up coming and *decide* to get out of the way. A fight he
   * loses without knowing why teaches him nothing.
   */
  private updateMech(
    step: number,
    dx: number,
    dy: number,
    isBlocked: (x: number, y: number) => boolean,
    me: { x: number; y: number },
    distance: number,
  ): void {
    switch (this.mech?.trick) {
      case 'charge': {
        this.chargeTimer -= 1
        if (this.chargeState === 'stalk') {
          this.step(step, dx, dy, isBlocked)
          // Only from across the room: charging at someone standing next to it
          // would be a shove, not a charge he can read and dodge.
          if (this.chargeTimer <= 0 && distance > CHARGE_REACH) {
            this.chargeState = 'wind'
            this.chargeTimer = WIND_UP
            // The direction is locked in *now*, at the start of the wind-up,
            // so stepping aside during it actually works.
            this.runX = dx
            this.runY = dy
          }
        } else if (this.chargeState === 'wind') {
          if (this.chargeTimer <= 0) {
            this.chargeState = 'run'
            this.chargeTimer = 80
          }
        } else if (this.chargeState === 'run') {
          const before = { x: this.x, y: this.y }
          this.step(step * CHARGE_SPEED, this.runX, this.runY, isBlocked)
          const stopped = Math.hypot(this.x - before.x, this.y - before.y) < 0.4
          if (stopped || this.chargeTimer <= 0) {
            this.chargeState = 'dazed'
            this.chargeTimer = DAZED
            this.slammed = stopped
          }
        } else if (this.chargeTimer <= 0) {
          this.chargeState = 'stalk'
          this.chargeTimer = this.rng.int(50, 90)
        }
        break
      }
      case 'phase': {
        // Walks at him like the rest, and every so often is simply somewhere
        // else. The blink itself is the caster's, borrowed whole.
        this.step(step, dx, dy, isBlocked)
        this.blinkTimer -= 1
        if (this.blinkPhase > 0) this.blinkPhase -= 1
        if (this.blinkTimer <= 0) {
          this.blinkTimer = this.rng.int(150, 240)
          this.blinkPhase = 24
          this.blinkTo(isBlocked, me)
        }
        break
      }
      default: {
        this.step(step, dx, dy, isBlocked)
      }
    }
  }

  /**
   * Reappears on a free tile nearby — not anywhere on the screen. Blinking
   * clear across the room made it impossible to corner; staying in the
   * neighbourhood keeps it slippery but beatable.
   */
  private blinkTo(isBlocked: (x: number, y: number) => boolean, from: { x: number; y: number }): void {
    const fromCol = Math.round(from.x / TILE)
    const fromRow = Math.round(from.y / TILE)
    for (let attempt = 0; attempt < 30; attempt++) {
      const col = clamp(fromCol + this.rng.int(-4, 4), 1, 14)
      const row = clamp(fromRow + this.rng.int(-3, 3), 1, 9)
      const x = col * TILE + (TILE - this.size) / 2
      const y = row * TILE + (TILE - this.size) / 2
      if (this.blockedAt(x, y, isBlocked)) continue
      // Do not simply reappear where it already was.
      if (Math.hypot(x - this.x, y - this.y) < TILE) continue
      this.x = x
      this.y = y
      return
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
