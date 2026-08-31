/** Screenshots the hero swinging each grade of sword, to check the materials. */
import { chromium } from 'playwright'
const OUT = '/tmp/claude-0/-home-user-claude-routines-scratch/6df0b2d4-03e5-5006-8fa7-f59d18d1702e/scratchpad'
const browser = await chromium.launch({
  executablePath: process.env.CHROME ?? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
})
const page = await browser.newPage({ viewport: { width: 820, height: 760 } })
page.on('pageerror', (e) => console.log('ERR', String(e)))
await page.goto('http://localhost:5199/', { waitUntil: 'networkidle' })
await page.evaluate(() => localStorage.removeItem('zsq.save'))
await page.reload({ waitUntil: 'networkidle' })
await page.getByRole('button', { name: /begin/i }).click()
await page.waitForSelector('.game-canvas')

const sets = [
  ['woodenSword', 'woodenShield', 'wooden'],
  ['metalSword', 'metalShield', 'metal'],
  ['bronzeSword', 'bronzeShield', 'bronze'],
  ['goldenSword', 'magicalShield', 'golden'],
]

for (const [sword, shield, label] of sets) {
  await page.evaluate(([sw, sh]) => {
    const s = window.zsq.state
    s.inventory[sw] = 1
    s.inventory[sh] = 1
    s.player.equippedSword = sw
    s.player.equippedShield = sh
    window.zsq.world.refreshFromSave()
    window.zsq.goTo('village-square', 8, 8)
  }, [sword, shield])
  await page.waitForTimeout(300)
  await page.keyboard.down('ArrowRight')
  await page.waitForTimeout(90)
  await page.keyboard.up('ArrowRight')
  await page.keyboard.press('z')
  await page.waitForTimeout(50)
  await page.locator('.game-canvas').screenshot({ path: `${OUT}/gear-${label}.png` })
}
console.log('shot', sets.map((s) => s[2]).join(', '))
await browser.close()
