/**
 * Fireworks.
 *
 * A rocket goes up from the bottom of the screen with a little tail, and at
 * the top of its climb it bursts into a ring of sparks that fly out, slow
 * down, fall, twinkle and go out. Nothing here knows about the world: it is
 * given a rectangle to fill and a source of chance, and asked for a frame at
 * a time, so the show can be proved in a test and drawn anywhere.
 */
import type { Rng } from '../../core/rng'

interface Rocket {
  x: number
  y: number
  vy: number
  /** Where it bursts. */
  peak: number
  colour: number
}

interface Spark {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  span: number
  colour: number
  /** A few sparks are the bright white kind. */
  bright: boolean
}

/** The colours a burst can be, in pairs: the spark, and the paler heart of it. */
const PALETTES: readonly [string, string][] = [
  ['#ff6a3d', '#ffd9c2'],
  ['#e8bb2c', '#fff3c2'],
  ['#57d2c6', '#d9fff9'],
  ['#ff6fb5', '#ffd6ea'],
  ['#7fbb4c', '#e2ffc9'],
  ['#9a55d1', '#e9d4ff'],
]

const GRAVITY = 26
const DRAG = 0.985

export class Fireworks {
  private rockets: Rocket[] = []
  private sparks: Spark[] = []
  /** Bursts so far, for the checks and the sound. */
  bursts = 0
  /** Set by update when something burst this frame, so a pop can be played. */
  burstThisFrame = false

  constructor(
    private readonly rng: Rng,
    private readonly width: number,
    private readonly height: number,
  ) {}

  /** Sends one up, from somewhere along the bottom unless told where. */
  launch(x?: number): void {
    const at = x ?? 24 + this.rng.next() * (this.width - 48)
    this.rockets.push({
      x: at,
      y: this.height + 4,
      vy: -(150 + this.rng.next() * 60),
      peak: 20 + this.rng.next() * (this.height * 0.45),
      colour: this.rng.int(0, PALETTES.length - 1),
    })
  }

  get alight(): boolean {
    return this.rockets.length > 0 || this.sparks.length > 0
  }

  update(step: number): void {
    this.burstThisFrame = false
    for (const r of this.rockets) {
      r.y += r.vy * step
      r.vy += GRAVITY * 2 * step
    }
    const bursting = this.rockets.filter((r) => r.y <= r.peak || r.vy >= 0)
    this.rockets = this.rockets.filter((r) => !bursting.includes(r))
    for (const r of bursting) this.burst(r.x, r.y, r.colour)

    for (const s of this.sparks) {
      s.x += s.vx * step
      s.y += s.vy * step
      s.vx *= DRAG
      s.vy = s.vy * DRAG + GRAVITY * step
      s.life -= 1
    }
    this.sparks = this.sparks.filter((s) => s.life > 0)
  }

  private burst(x: number, y: number, colour: number): void {
    this.bursts += 1
    this.burstThisFrame = true
    const count = 22 + this.rng.int(0, 14)
    const speed = 45 + this.rng.next() * 35
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2 + this.rng.next() * 0.3
      const v = speed * (0.7 + this.rng.next() * 0.5)
      const span = 50 + this.rng.int(0, 40)
      this.sparks.push({
        x,
        y,
        vx: Math.cos(angle) * v,
        vy: Math.sin(angle) * v,
        life: span,
        span,
        colour,
        bright: this.rng.chance(0.2),
      })
    }
  }

  draw(ctx: CanvasRenderingContext2D, frame: number): void {
    for (const r of this.rockets) {
      const [spark, heart] = PALETTES[r.colour] as [string, string]
      ctx.fillStyle = heart
      ctx.fillRect(Math.round(r.x) - 1, Math.round(r.y) - 1, 2, 2)
      // The tail.
      ctx.fillStyle = spark
      for (let i = 1; i <= 4; i++) {
        if ((frame + i) % 2 === 0) ctx.fillRect(Math.round(r.x), Math.round(r.y) + i * 3, 1, 2)
      }
    }
    for (const s of this.sparks) {
      const t = s.life / s.span
      // Twinkling as it dies: some frames it is simply not drawn.
      if (t < 0.4 && (frame + s.life) % 3 === 0) continue
      const [spark, heart] = PALETTES[s.colour] as [string, string]
      ctx.fillStyle = s.bright ? '#f6f3e7' : t > 0.6 ? heart : spark
      const size = t > 0.5 ? 2 : 1
      ctx.fillRect(Math.round(s.x), Math.round(s.y), size, size)
    }
  }

  /** How many sparks are in the air. For the checks. */
  get sparkCount(): number {
    return this.sparks.length
  }
}
