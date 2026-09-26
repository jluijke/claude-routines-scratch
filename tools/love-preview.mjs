/** The three guardians on the boardwalk, and one of them being loved. */
import { chromium } from 'playwright'
import { writeFileSync } from 'node:fs'
const OUT = process.env.OUT ?? '/tmp/claude-0/-home-user-claude-routines-scratch/6df0b2d4-03e5-5006-8fa7-f59d18d1702e/scratchpad'
const browser = await chromium.launch({ executablePath: process.env.CHROME ?? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' })
const page = await browser.newPage({ viewport: { width: 900, height: 700 } })
page.on('pageerror', (e) => console.log('ERR', String(e)))
await page.goto(process.env.BASE ?? 'http://localhost:5199/', { waitUntil: 'networkidle' })
const shots = await page.evaluate(async () => {
  const [{ drawTiles }, { SPRITES, PALETTE }, { TILE }] = await Promise.all([
    import('/src/game/render/world.ts'), import('/src/game/render/sprites.ts'), import('/src/game/world/tiles.ts'),
  ])
  const blit = (ctx, sprite, x, y, tint) => {
    for (let r = 0; r < sprite.height; r++) for (let c = 0; c < sprite.width; c++) {
      let colour = PALETTE[sprite.rows[r][c]]
      if (!colour || colour === 'transparent') continue
      if (tint && colour !== PALETTE.k) colour = tint(colour, sprite.rows[r][c])
      ctx.fillStyle = colour
      ctx.fillRect(x + c, y + r, 1, 1)
    }
  }
  const make = (w, h, scale) => {
    const canvas = document.createElement('canvas'); canvas.width = w * scale; canvas.height = h * scale
    const ctx = canvas.getContext('2d'); ctx.imageSmoothingEnabled = false; ctx.scale(scale, scale); return [canvas, ctx]
  }
  const out = {}
  // The line-up: a park lawn, the three of them and him for scale.
  {
    const [canvas, ctx] = make(160, 56, 5)
    const lawn = { id: 'lineup', name: '', region: '', setting: 'park', rows: ['SSSSSSSSSS', 'SSSSSSSSSS', 'SSSSSSSSSS', 'SSSSSSSSSS'], exits: {} }
    drawTiles(ctx, lawn, new Set(), 12)
    blit(ctx, SPRITES.heroWoodenDownA, 8, 34)
    blit(ctx, SPRITES.guardianGold, 32, 14)
    blit(ctx, SPRITES.guardianGrey, 72, 14)
    blit(ctx, SPRITES.guardianDark, 112, 14)
    blit(ctx, SPRITES.loveBomb, 12, 12)
    out.guardians = canvas.toDataURL('image/png')
  }
  // Being loved: the grey one, gone pink, hearts everywhere, the meter full.
  {
    const [canvas, ctx] = make(112, 72, 5)
    const lawn = { id: 'loved', name: '', region: '', setting: 'park', rows: ['SSSSSSS', 'SSSSSSS', 'SSSSSSS', 'SSSSSSS', 'SSSSSSS'], exits: {} }
    drawTiles(ctx, lawn, new Set(), 12)
    const pink = (colour, ch) => (ch === 'z' || ch === 'M' || ch === 'B' ? '#e05a9a' : ch === 's' ? '#ffb3d1' : colour)
    blit(ctx, SPRITES.guardianGrey, 56, 22, pink)
    blit(ctx, SPRITES.heroWoodenRightA, 20, 40)
    blit(ctx, SPRITES.loveBomb, 38, 30)
    for (const [x, y, big] of [[52, 12, 1], [90, 16, 0], [96, 30, 1], [48, 44, 0], [86, 50, 1], [66, 6, 0], [100, 8, 0]]) blit(ctx, big ? SPRITES.heartBig : SPRITES.heartSmall, x, y)
    // The love meter over his head.
    ctx.fillStyle = '#12131a'; ctx.fillRect(56, 14, 32, 5)
    ctx.fillStyle = '#ff6fb5'; ctx.fillRect(57, 15, 27, 3)
    blit(ctx, SPRITES.heartSmall, 50, 12)
    out.loved = canvas.toDataURL('image/png')
  }
  return out
})
for (const [name, png] of Object.entries(shots)) { writeFileSync(`${OUT}/preview-${name}.png`, Buffer.from(png.split(',')[1], 'base64')); console.log('wrote', name) }
await browser.close()
