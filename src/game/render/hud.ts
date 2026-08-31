/**
 * The status bar: hearts, rupees, what is equipped, and where you are.
 */
import { SCREEN_W } from '../world/tiles'
import type { Atlas } from './atlas'
import type { Player } from '../entities/player'
import { ITEMS } from '../items'

export const HUD_H = 40

export function drawHud(
  ctx: CanvasRenderingContext2D,
  atlas: Atlas,
  player: Player,
  rupees: number,
  screenName: string,
  exercisesDone: number,
  totalExercises: number,
): void {
  ctx.fillStyle = '#0b0d13'
  ctx.fillRect(0, 0, SCREEN_W, HUD_H)

  ctx.fillStyle = '#3a4150'
  ctx.fillRect(0, HUD_H - 1, SCREEN_W, 1)

  // Hearts, wrapping onto a second row once the child has earned enough.
  for (let i = 0; i < player.maxHearts; i++) {
    const col = i % 10
    const row = Math.floor(i / 10)
    const x = 4 + col * 9
    const y = 4 + row * 9
    if (i < player.hearts) {
      atlas.draw(ctx, 'heart', x, y)
    } else {
      ctx.fillStyle = '#3a2226'
      ctx.fillRect(x + 1, y + 1, 6, 5)
    }
  }

  // Rupee counter.
  atlas.draw(ctx, 'rupee', SCREEN_W - 52, 4)
  ctx.fillStyle = '#f6f3e7'
  ctx.font = '8px monospace'
  ctx.textBaseline = 'top'
  ctx.fillText(String(rupees).padStart(4, '0'), SCREEN_W - 42, 5)

  // Where you are, and how far through the curriculum.
  ctx.fillStyle = '#8f98a8'
  ctx.font = '7px monospace'
  ctx.fillText(screenName.toUpperCase(), 4, 24)
  const progress = `${exercisesDone}/${totalExercises}`
  ctx.fillText(progress, SCREEN_W - 4 - progress.length * 4.2, 24)

  // Equipped gear, as two small icons with the material named beside them.
  ctx.fillStyle = '#5d6472'
  const sword = material(ITEMS[player.loadout.sword].name)
  const shield = material(ITEMS[player.loadout.shield].name)
  ctx.fillText(`SWORD ${sword}`, 4, 32)
  const shieldLabel = `SHIELD ${shield}`
  ctx.fillText(shieldLabel, SCREEN_W - 4 - shieldLabel.length * 4.2, 32)
}

/** "Metal Sword" -> "METAL", so the bar shows the upgrade, not the noun. */
function material(name: string): string {
  return (name.split(' ')[0] ?? name).toUpperCase()
}
