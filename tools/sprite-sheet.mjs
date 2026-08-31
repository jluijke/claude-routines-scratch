/** Renders the sprites large so they can actually be looked at. */
import { chromium } from 'playwright'
const OUT = '/tmp/claude-0/-home-user-claude-routines-scratch/6df0b2d4-03e5-5006-8fa7-f59d18d1702e/scratchpad'
const browser = await chromium.launch({
  executablePath: process.env.CHROME ?? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
})
const page = await browser.newPage({ viewport: { width: 900, height: 460 } })
await page.goto(process.env.BASE ?? 'http://localhost:5199/', { waitUntil: 'networkidle' })
await page.evaluate(async () => {
  const { SPRITES, PALETTE } = await import('/src/game/render/sprites.ts')
  const names = Object.keys(SPRITES).filter((n) => n.startsWith('hero'))
  document.body.innerHTML = '<div id="sheet" style="display:flex;gap:18px;padding:16px;background:#3f7d38;flex-wrap:wrap"></div>'
  const sheet = document.getElementById('sheet')
  for (const name of names) {
    const sprite = SPRITES[name]
    const scale = 9
    const wrap = document.createElement('div')
    wrap.style.cssText = 'text-align:center;font:11px monospace;color:#fff'
    const canvas = document.createElement('canvas')
    canvas.width = sprite.width * scale
    canvas.height = sprite.height * scale
    const ctx = canvas.getContext('2d')
    for (let y = 0; y < sprite.height; y++) {
      for (let x = 0; x < sprite.width; x++) {
        const colour = PALETTE[sprite.rows[y][x]]
        if (!colour || colour === 'transparent') continue
        ctx.fillStyle = colour
        ctx.fillRect(x * scale, y * scale, scale, scale)
      }
    }
    wrap.append(canvas, document.createElement('br'), document.createTextNode(name))
    sheet.append(wrap)
  }
})
await page.waitForTimeout(300)
await page.screenshot({ path: `${OUT}/sprites-hero.png` })
await browser.close()
console.log('rendered')
