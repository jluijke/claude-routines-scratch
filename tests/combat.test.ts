import { describe, expect, it } from 'vitest'
import { Player, PLAYER_SIZE } from '../src/game/entities/player'

/** A hero standing at a known spot with the starting sword. */
function hero(facing: 'up' | 'down' | 'left' | 'right') {
  const player = new Player({ sword: 'woodenSword', shield: 'woodenShield' }, 3, 3)
  player.x = 100
  player.y = 100
  player.facing = facing
  player.attack()
  return player
}

/** Standard 14 px monster box at a given gap in front of the hero. */
function monsterAhead(player: Player, gap: number, offset = 0) {
  switch (player.facing) {
    case 'right':
      return { x: player.x + PLAYER_SIZE + gap, y: player.y + offset, w: 14, h: 14 }
    case 'left':
      return { x: player.x - 14 - gap, y: player.y + offset, w: 14, h: 14 }
    case 'down':
      return { x: player.x + offset, y: player.y + PLAYER_SIZE + gap, w: 14, h: 14 }
    case 'up':
      return { x: player.x + offset, y: player.y - 14 - gap, w: 14, h: 14 }
  }
}

function overlaps(a: { x: number; y: number; w: number; h: number }, b: typeof a): boolean {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y
}

describe('the sword', () => {
  it('reaches a full tile beyond the body', () => {
    // It used to be measured from the player's centre, so half of it was
    // inside him and only seven pixels stuck out. A child could not hit
    // anything that was not already touching him.
    const player = hero('right')
    const box = player.swordBox()
    expect(box).toBeDefined()
    const beyondBody = (box as { x: number; w: number }).x + (box as { w: number }).w - (player.x + PLAYER_SIZE)
    expect(beyondBody).toBeGreaterThanOrEqual(14)
  })

  it('starts at the body, wasting none of itself inside him', () => {
    const player = hero('right')
    const box = player.swordBox() as { x: number }
    expect(box.x).toBeGreaterThanOrEqual(player.x + PLAYER_SIZE - 1)
  })

  it.each(['up', 'down', 'left', 'right'] as const)('hits a monster a tile away when facing %s', (facing) => {
    const player = hero(facing)
    const box = player.swordBox()
    expect(overlaps(box as never, monsterAhead(player, 12) as never)).toBe(true)
  })

  it('forgives being a few pixels out of line', () => {
    const player = hero('right')
    const box = player.swordBox()
    // The swing band is as wide as the monsters, so a near miss still lands.
    expect(overlaps(box as never, monsterAhead(player, 4, 8) as never)).toBe(true)
    expect(overlaps(box as never, monsterAhead(player, 4, -8) as never)).toBe(true)
  })

  it('does not hit behind him', () => {
    const player = hero('right')
    const box = player.swordBox()
    const behind = { x: player.x - 20, y: player.y, w: 14, h: 14 }
    expect(overlaps(box as never, behind)).toBe(false)
  })

  it('is only out while swinging', () => {
    const player = new Player({ sword: 'woodenSword', shield: 'woodenShield' }, 3, 3)
    expect(player.swordBox()).toBeUndefined()
  })

  it('reaches further with a better blade', () => {
    const wooden = hero('right')
    const golden = new Player({ sword: 'goldenSword', shield: 'woodenShield' }, 3, 3)
    golden.x = 100
    golden.y = 100
    golden.facing = 'right'
    golden.attack()
    expect(golden.swordReach).toBeGreaterThan(wooden.swordReach)
  })
})
