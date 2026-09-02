/**
 * Sprites in the DOM.
 *
 * The shop used to be a list of names and numbers on a cream card, which read
 * like a spelling worksheet rather than a shopkeeper's shelf. Painting the same
 * pixel art the game uses beside each line makes it a shop — and lets a child
 * tell a shield from a candle before he has read either word.
 *
 * This deliberately does not use `Atlas`: that one belongs to the running
 * world, and a shop panel should not have to borrow the game's renderer to draw
 * a 16x16 icon.
 */
import { PALETTE, SPRITES, type SpriteName } from './sprites'
import { ITEMS, materialOf, type ItemId } from '../items'

/** Renders one sprite into its own canvas, sized for CSS pixels. */
export function spriteCanvas(name: SpriteName, scale = 2): HTMLCanvasElement {
  const sprite = SPRITES[name]
  const canvas = document.createElement('canvas')
  canvas.width = sprite.width
  canvas.height = sprite.height
  canvas.style.width = `${sprite.width * scale}px`
  canvas.style.height = `${sprite.height * scale}px`
  canvas.className = 'sprite-icon'

  const ctx = canvas.getContext('2d')
  if (!ctx) return canvas
  ctx.imageSmoothingEnabled = false
  for (let y = 0; y < sprite.height; y++) {
    const row = sprite.rows[y] ?? ''
    for (let x = 0; x < sprite.width; x++) {
      const colour = PALETTE[row[x] ?? '.']
      if (!colour || colour === 'transparent') continue
      ctx.fillStyle = colour
      ctx.fillRect(x, y, 1, 1)
    }
  }
  return canvas
}

function capitalise(word: string): string {
  return word[0]!.toUpperCase() + word.slice(1)
}

/**
 * The sprite that stands for an item. Swords and shields pick up the material
 * they are actually made of, so the bronze one looks bronze on the shelf and
 * bronze in his hand.
 */
export function itemSprite(id: ItemId): SpriteName {
  const tier = capitalise(materialOf(id))
  if (ITEMS[id].category === 'sword') return `swordIcon${tier}` as SpriteName
  if (ITEMS[id].category === 'shield') return `shield${tier}` as SpriteName

  switch (id) {
    case 'wings':
      return 'wings'
    case 'blueTunic':
      return 'tunicBlue'
    case 'redTunic':
      return 'tunicRed'
    case 'bow':
      return 'bow'
    case 'arrows':
      return 'arrow'
    case 'blueCandle':
      return 'candle'
    case 'bomb':
      return 'bomb'
    case 'bait':
      return 'bait'
    case 'blueRing':
      return 'ring'
    case 'map':
      return 'worldMap'
    default:
      return 'heart'
  }
}

/** The icon for a shop row or an inventory line. */
export function itemIcon(id: ItemId, scale = 2): HTMLCanvasElement {
  return spriteCanvas(itemSprite(id), scale)
}
