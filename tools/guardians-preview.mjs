/** The three guardians, large, and the same three loved. */
import { chromium } from 'playwright'
import { writeFileSync } from 'node:fs'
const OUT = process.env.OUT ?? '/tmp/claude-0/-home-user-claude-routines-scratch/6df0b2d4-03e5-5006-8fa7-f59d18d1702e/scratchpad'
const browser = await chromium.launch({ executablePath: process.env.CHROME ?? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' })
const page = await browser.newPage({ viewport: { width: 900, height: 700 } })
page.on('pageerror', (e) => console.log('ERR', String(e)))
await page.goto(process.env.BASE ?? 'http://localhost:5199/', { waitUntil: 'networkidle' })
const png = await page.evaluate(async () => {
  const { SPRITES, PALETTE } = await import('/src/game/render/sprites.ts')
  const S = 8
  const canvas = document.createElement('canvas')
  canvas.width = 144 * S
  canvas.height = 88 * S
  const ctx = canvas.getContext('2d')
  ctx.imageSmoothingEnabled = false
  ctx.scale(S, S)
  ctx.fillStyle = '#b7b3a8'
  ctx.fillRect(0, 0, 200, 100)
  ctx.fillStyle = '#9e9a8f'
  for (let i = 0; i < 12; i++) ctx.fillRect(i * 16, 0, 1, 100)
  for (let i = 0; i < 6; i++) ctx.fillRect(0, i * 16, 200, 1)
  const blit = (sprite, x, y, tint) => {
    for (let r = 0; r < sprite.height; r++) for (let c = 0; c < sprite.width; c++) {
      const ch = sprite.rows[r][c]
      let colour = PALETTE[ch]
      if (!colour || colour === 'transparent') continue
      if (tint) colour = tint(colour, ch)
      ctx.fillStyle = colour
      ctx.fillRect(x + c, y + r, 1, 1)
    }
  }
  const pink = (colour, ch) => {
    if (ch === 'z' || ch === 'M' || ch === 'B') return '#e05a9a'
    if (ch === 's' || ch === 't') return '#ffb3d1'
    if (ch === 'b' || ch === 'r') return '#ff6fb5'
    return colour
  }
  const three = ['guardianGold', 'guardianGrey', 'guardianDark']
  three.forEach((name, i) => {
    blit(SPRITES[name], 6 + i * 40, 6)
    blit(SPRITES[name], 6 + i * 40, 50, pink)
  })
  for (const [x, y, big] of [[2, 52, 1], [36, 58, 0], [44, 48, 1], [76, 62, 0], [84, 50, 1], [116, 56, 0], [10, 74, 0], [58, 76, 1], [100, 74, 0]]) blit(big ? SPRITES.heartBig : SPRITES.heartSmall, x, y)
  blit(SPRITES.heroWoodenDownA, 124, 24)
  blit(SPRITES.loveBomb, 124, 4)
  return canvas.toDataURL('image/png')
})
writeFileSync(`${OUT}/preview-guardians-big.png`, Buffer.from(png.split(',')[1], 'base64'))
console.log('wrote')
await browser.close()
