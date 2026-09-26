/**
 * Previews for the Level 3 design page: the box hammer swung and slammed,
 * the people in black and grey, a hydrant blown open. Composites of the
 * game's own sprites and tiles, not mock-ups.
 */
import { chromium } from 'playwright'
import { writeFileSync } from 'node:fs'

const OUT = process.env.OUT ?? '/tmp/claude-0/-home-user-claude-routines-scratch/6df0b2d4-03e5-5006-8fa7-f59d18d1702e/scratchpad'
const browser = await chromium.launch({ executablePath: process.env.CHROME ?? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' })
const page = await browser.newPage({ viewport: { width: 900, height: 700 } })
page.on('pageerror', (e) => console.log('ERR', String(e)))
await page.goto(process.env.BASE ?? 'http://localhost:5199/', { waitUntil: 'networkidle' })

const shots = await page.evaluate(async () => {
  const [{ drawTiles }, { SAMPLE_CITY }, { SPRITES, PALETTE }, { TILE }] = await Promise.all([
    import('/src/game/render/world.ts'),
    import('/src/game/world/screens3.ts'),
    import('/src/game/render/sprites.ts'),
    import('/src/game/world/tiles.ts'),
  ])
  const blit = (ctx, sprite, x, y) => {
    for (let r = 0; r < sprite.height; r++) for (let c = 0; c < sprite.width; c++) {
      const colour = PALETTE[sprite.rows[r][c]]
      if (!colour || colour === 'transparent') continue
      ctx.fillStyle = colour
      ctx.fillRect(x + c, y + r, 1, 1)
    }
  }
  const make = (w, h, scale) => {
    const canvas = document.createElement('canvas')
    canvas.width = w * scale
    canvas.height = h * scale
    const ctx = canvas.getContext('2d')
    ctx.imageSmoothingEnabled = false
    ctx.scale(scale, scale)
    return [canvas, ctx]
  }
  const avenue = SAMPLE_CITY.find((s) => s.id === 'nyc-avenue-a')
  const out = {}

  // --- the hammer: two panels, a crop of the avenue at 4x -----------------
  {
    const crop = { x: 0, y: 16, w: 128, h: 64 }
    const [canvas, ctx] = make(crop.w * 2 + 8, crop.h, 4)
    const panel = (dx, slam) => {
      ctx.save()
      ctx.beginPath()
      ctx.rect(dx, 0, crop.w, crop.h)
      ctx.clip()
      const shakeX = slam ? -2 : 0
      const shakeY = slam ? 2 : 0
      ctx.translate(dx - crop.x + shakeX, -crop.y + shakeY)
      drawTiles(ctx, avenue, new Set(), 12)
      // The hero at the trash bags, facing right, hammer out.
      const hx = 4 * TILE + 2
      const hy = 2 * TILE + 2
      blit(ctx, SPRITES.heroWoodenRightA, hx, hy)
      if (slam) {
        blit(ctx, SPRITES.hammerRight, hx + 12, hy + 4)
        // The hit: the bags burst, dust rings, a dollar.
        ctx.fillStyle = '#f6f3e7'
        for (const [ox, oy] of [[-3, -3], [17, -4], [-5, 8], [20, 9], [6, -7], [8, 15]]) ctx.fillRect(hx + 22 + ox, hy + 6 + oy, 2, 2)
        ctx.fillStyle = '#e8bb2c'
        ctx.fillRect(hx + 24, hy + 2, 3, 4)
        ctx.fillStyle = '#12131a'
        ctx.fillRect(hx + 25, hy + 3, 1, 2)
      } else {
        // Wound up: the hammer raised over his shoulder.
        blit(ctx, SPRITES.hammerUp, hx + 8, hy - 12)
      }
      ctx.restore()
    }
    panel(0, false)
    panel(crop.w + 8, true)
    out.hammer = canvas.toDataURL('image/png')
  }

  // --- the people: a line-up on the sidewalk, with him for scale ----------
  {
    const [canvas, ctx] = make(16 * 8, 40, 5)
    const street = { ...avenue, rows: ['................', '................', '................'] }
    ctx.save()
    ctx.translate(0, 8)
    drawTiles(ctx, street, new Set(), 12)
    ctx.restore()
    const row = [
      ['heroWoodenDownA', 0], ['hoodieA', 1], ['hoodieB', 2], ['suitA', 3], ['suitB', 4], ['capA', 5], ['capB', 6],
    ]
    for (const [name, i] of row) blit(ctx, SPRITES[name], 8 + i * 17, 14)
    out.people = canvas.toDataURL('image/png')
  }

  // --- the hydrant: blown open, spraying across the avenue ----------------
  {
    const crop = { x: 96, y: 16, w: 128, h: 112 }
    const [canvas, ctx] = make(crop.w, crop.h, 4)
    ctx.translate(-crop.x, -crop.y)
    drawTiles(ctx, avenue, new Set(), 12)
    for (const prop of avenue.props ?? []) blit(ctx, SPRITES[prop.sprite], prop.col * TILE, prop.row * TILE)
    // The jet from the hydrant at (10, 2): up at forty-five degrees and down
    // onto the road two tiles to the right, where it pools.
    blit(ctx, SPRITES.sprayA, 10 * TILE + 2, 2 * TILE - 4)
    ctx.fillStyle = '#4a8ae8'
    ctx.fillRect(11 * TILE + 8, 3 * TILE + 2, 14, 3)
    ctx.fillRect(11 * TILE + 4, 3 * TILE + 5, 22, 2)
    ctx.fillStyle = '#c9e6f2'
    ctx.fillRect(11 * TILE + 10, 3 * TILE + 3, 4, 1)
    // A hoodie washed off his feet, and a cab skidded to a stop.
    blit(ctx, SPRITES.hoodieB, 12 * TILE + 6, 3 * TILE - 2)
    blit(ctx, SPRITES.heroWoodenRightA, 8 * TILE + 2, 2 * TILE + 2)
    out.spray = canvas.toDataURL('image/png')
  }
  return out
})

for (const [name, png] of Object.entries(shots)) {
  writeFileSync(`${OUT}/preview-${name}.png`, Buffer.from(png.split(',')[1], 'base64'))
  console.log('wrote', name)
}
await browser.close()
