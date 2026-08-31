/**
 * Bakes the text sprites into an offscreen canvas once at boot, so drawing a
 * frame is a handful of drawImage calls rather than thousands of fillRects.
 */
import { PALETTE, SPRITES, type Sprite, type SpriteName } from './sprites'

interface Placed {
  x: number
  y: number
  width: number
  height: number
}

export class Atlas {
  private readonly canvas: HTMLCanvasElement | OffscreenCanvas
  private readonly placed = new Map<string, Placed>()

  constructor() {
    const entries = Object.entries(SPRITES) as [SpriteName, Sprite][]
    const padding = 1
    const columns = 8
    let x = 0
    let y = 0
    let rowHeight = 0
    let width = 0

    // First pass: work out where each sprite goes and how big the sheet is.
    const layout: [SpriteName, Sprite, Placed][] = []
    entries.forEach(([name, sprite], index) => {
      if (index % columns === 0 && index > 0) {
        y += rowHeight + padding
        x = 0
        rowHeight = 0
      }
      const spot: Placed = { x, y, width: sprite.width, height: sprite.height }
      layout.push([name, sprite, spot])
      x += sprite.width + padding
      width = Math.max(width, x)
      rowHeight = Math.max(rowHeight, sprite.height)
    })
    const height = y + rowHeight + padding

    this.canvas = createCanvas(Math.max(1, width), Math.max(1, height))
    const ctx = this.canvas.getContext('2d') as CanvasRenderingContext2D
    ctx.imageSmoothingEnabled = false

    for (const [name, sprite, spot] of layout) {
      paint(ctx, sprite, spot.x, spot.y)
      this.placed.set(name, spot)
    }
  }

  /** Draws a sprite with its top-left at (x, y), optionally tinted. */
  draw(
    ctx: CanvasRenderingContext2D,
    name: SpriteName,
    x: number,
    y: number,
    options: { flash?: boolean; scale?: number } = {},
  ): void {
    const spot = this.placed.get(name)
    if (!spot) return
    const scale = options.scale ?? 1

    if (options.flash) {
      // Hurt flash: draw the sprite as a white silhouette.
      ctx.save()
      ctx.globalCompositeOperation = 'source-over'
      ctx.globalAlpha = 0.75
      ctx.drawImage(
        this.canvas as CanvasImageSource,
        spot.x, spot.y, spot.width, spot.height,
        Math.round(x), Math.round(y), spot.width * scale, spot.height * scale,
      )
      ctx.restore()
      return
    }

    ctx.drawImage(
      this.canvas as CanvasImageSource,
      spot.x, spot.y, spot.width, spot.height,
      Math.round(x), Math.round(y), spot.width * scale, spot.height * scale,
    )
  }

  sizeOf(name: SpriteName): { width: number; height: number } {
    const spot = this.placed.get(name)
    return spot ? { width: spot.width, height: spot.height } : { width: 0, height: 0 }
  }
}

function createCanvas(width: number, height: number): HTMLCanvasElement {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  return canvas
}

function paint(ctx: CanvasRenderingContext2D, sprite: Sprite, originX: number, originY: number): void {
  for (let y = 0; y < sprite.height; y++) {
    const row = sprite.rows[y] as string
    for (let x = 0; x < sprite.width; x++) {
      const key = row[x] as string
      const colour = PALETTE[key]
      if (!colour || colour === 'transparent') continue
      ctx.fillStyle = colour
      ctx.fillRect(originX + x, originY + y, 1, 1)
    }
  }
}
