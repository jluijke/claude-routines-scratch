/**
 * Draws one screen: tiles first, then props, drops, enemies and the hero.
 */
import { SCREEN_COLS, SCREEN_ROWS, TILE, TILES, type TileChar } from '../world/tiles'
import type { Atlas } from './atlas'
import type { Screen } from '../world/screens'

export function drawTiles(
  ctx: CanvasRenderingContext2D,
  screen: Screen,
  openedTiles: ReadonlySet<string>,
  frame: number,
): void {
  for (let row = 0; row < SCREEN_ROWS; row++) {
    const line = screen.rows[row] as string
    for (let col = 0; col < SCREEN_COLS; col++) {
      let char = (line[col] ?? '.') as TileChar
      // A barrier that has been opened becomes ordinary ground.
      if (char === '=' && openedTiles.has(`${col},${row}`)) char = '.'

      const def = TILES[char] ?? TILES['.']
      const x = col * TILE
      const y = row * TILE

      ctx.fillStyle = def.colour
      ctx.fillRect(x, y, TILE, TILE)

      if (!def.accent) continue
      ctx.fillStyle = def.accent
      switch (char) {
        case '.':
          // Sparse tufts so open ground is not a flat slab of colour.
          if ((col * 7 + row * 13) % 5 === 0) ctx.fillRect(x + 5, y + 6, 2, 1)
          if ((col * 3 + row * 5) % 7 === 0) ctx.fillRect(x + 10, y + 11, 2, 1)
          break
        case ',':
          ctx.fillRect(x + 2, y + 4, 12, 9)
          ctx.fillStyle = '#57a04c'
          ctx.fillRect(x + 4, y + 6, 3, 3)
          ctx.fillRect(x + 9, y + 8, 3, 3)
          break
        case '~': {
          // Slow ripples, so water reads as water.
          const wave = Math.sin((frame + col * 12 + row * 7) / 22) * 2
          ctx.fillRect(x, y + 5 + wave, TILE, 2)
          ctx.fillRect(x, y + 11 - wave, TILE, 1)
          break
        }
        case 'T':
          ctx.fillRect(x + 2, y + 1, 12, 11)
          ctx.fillStyle = '#5a3a1b'
          ctx.fillRect(x + 6, y + 12, 4, 4)
          break
        case 'R':
          ctx.fillRect(x + 2, y + 3, 12, 11)
          ctx.fillStyle = '#5f584d'
          ctx.fillRect(x + 4, y + 6, 3, 2)
          ctx.fillRect(x + 9, y + 9, 3, 2)
          break
        case '#':
          ctx.fillRect(x + 1, y + 1, 14, 6)
          ctx.fillRect(x + 1, y + 9, 14, 6)
          break
        case 'S':
          if ((col + row) % 3 === 0) ctx.fillRect(x + 4, y + 7, 3, 2)
          break
        case 'B':
          for (let i = 0; i < 4; i++) ctx.fillRect(x, y + i * 4, TILE, 2)
          break
        case 'D':
        case 'C':
        case 'H':
          ctx.fillRect(x + 3, y + 3, 10, 13)
          ctx.fillStyle = '#0a0a10'
          ctx.fillRect(x + 5, y + 6, 6, 10)
          break
        case '^':
          for (let i = 0; i < 4; i++) ctx.fillRect(x + 2, y + 2 + i * 4, 12, 2)
          break
        case '*':
          ctx.fillRect(x + 4, y + 2, 8, 12)
          ctx.fillStyle = '#6f695e'
          ctx.fillRect(x + 6, y + 5, 4, 1)
          ctx.fillRect(x + 6, y + 8, 4, 1)
          break
        case '=':
          break
      }
    }
  }
}

/** Sealed barriers are drawn on top, so their runes shimmer. */
export function drawSeals(
  ctx: CanvasRenderingContext2D,
  atlas: Atlas,
  screen: Screen,
  openedTiles: ReadonlySet<string>,
  frame: number,
): void {
  for (let row = 0; row < SCREEN_ROWS; row++) {
    const line = screen.rows[row] as string
    for (let col = 0; col < SCREEN_COLS; col++) {
      if (line[col] !== '=') continue
      if (openedTiles.has(`${col},${row}`)) continue
      atlas.draw(ctx, 'seal', col * TILE, row * TILE)
      // A slow pulse of magic over the runes.
      const glow = 0.18 + Math.sin(frame / 18 + col) * 0.12
      ctx.save()
      ctx.globalAlpha = Math.max(0, glow)
      ctx.fillStyle = '#57d2c6'
      ctx.fillRect(col * TILE + 1, row * TILE + 1, TILE - 2, TILE - 2)
      ctx.restore()
    }
  }
}

/** A dark dungeon room: only a small circle around the player is lit. */
export function drawDarkness(
  ctx: CanvasRenderingContext2D,
  centre: { x: number; y: number },
  radius: number,
  width: number,
  height: number,
): void {
  const gradient = ctx.createRadialGradient(centre.x, centre.y, radius * 0.4, centre.x, centre.y, radius)
  gradient.addColorStop(0, 'rgba(0,0,0,0)')
  gradient.addColorStop(1, 'rgba(0,0,0,0.97)')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, width, height)
}
