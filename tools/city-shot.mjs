/**
 * Renders the Level 3 sample screens through the game's own renderer.
 *
 * Not a check: a look. The screens in src/game/world/screens3.ts are not in
 * the world yet, so nothing else draws them. This loads the renderer in the
 * browser, paints each one at 3x with the hero standing in it, and saves a
 * PNG per screen to the scratchpad for the design page.
 */
import { chromium } from 'playwright'
import { writeFileSync } from 'node:fs'

const OUT = process.env.OUT ?? '/tmp/claude-0/-home-user-claude-routines-scratch/6df0b2d4-03e5-5006-8fa7-f59d18d1702e/scratchpad'
const BASE = process.env.BASE ?? 'http://localhost:5199/'
const SCALE = 3

const browser = await chromium.launch({
  executablePath: process.env.CHROME ?? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
})
const page = await browser.newPage({ viewport: { width: 900, height: 700 } })
page.on('pageerror', (e) => console.log('ERR', String(e)))
page.on('console', (m) => { if (m.type() === 'error') console.log('CONSOLE', m.text()) })
await page.goto(BASE, { waitUntil: 'networkidle' })

const shots = await page.evaluate(async ({ scale }) => {
  const [{ drawTiles }, { SAMPLE_CITY }, { SPRITES, PALETTE }, { TILE }] = await Promise.all([
    import('/src/game/render/world.ts'),
    import('/src/game/world/screens3.ts'),
    import('/src/game/render/sprites.ts'),
    import('/src/game/world/tiles.ts'),
  ])
  const blit = (ctx, sprite, x, y) => {
    for (let r = 0; r < sprite.height; r++) {
      for (let c = 0; c < sprite.width; c++) {
        const colour = PALETTE[sprite.rows[r][c]]
        if (!colour || colour === 'transparent') continue
        ctx.fillStyle = colour
        ctx.fillRect(x + c, y + r, 1, 1)
      }
    }
  }
  const HERO = { 'nyc-washington-square': [3, 7], 'nyc-avenue-a': [5, 2], 'nyc-bleecker': [6, 3], 'nyc-west-4th': [7, 4], 'nyc-a-train': [4, 3] }
  const out = []
  for (const screen of SAMPLE_CITY) {
    const canvas = document.createElement('canvas')
    canvas.width = 256 * scale
    canvas.height = 176 * scale
    const ctx = canvas.getContext('2d')
    ctx.imageSmoothingEnabled = false
    ctx.scale(scale, scale)
    drawTiles(ctx, screen, new Set(), 12)
    for (const prop of screen.props ?? []) blit(ctx, SPRITES[prop.sprite], prop.col * TILE, prop.row * TILE)
    const [hc, hr] = HERO[screen.id] ?? [7, 5]
    blit(ctx, SPRITES.heroWoodenDownA, hc * TILE + 2, hr * TILE + 2)
    out.push({ id: screen.id, name: screen.name, png: canvas.toDataURL('image/png') })
  }
  return out
}, { scale: SCALE })

for (const shot of shots) {
  const file = `${OUT}/${shot.id}.png`
  writeFileSync(file, Buffer.from(shot.png.split(',')[1], 'base64'))
  console.log('wrote', file)
}
await browser.close()
