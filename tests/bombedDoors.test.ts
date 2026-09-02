import { describe, expect, it } from 'vitest'
import { visibleTile } from '../src/game/render/world'
import { SCREENS, screenById } from '../src/game/world/screens'
import { TILES, type TileChar } from '../src/game/world/tiles'

/** Every doorway standing on a cracked wall or a bush — the hidden ways in. */
function hiddenDoors(): { screen: string; col: number; row: number; to: string }[] {
  const found: { screen: string; col: number; row: number; to: string }[] = []
  for (const screen of SCREENS) {
    for (const portal of screen.portals ?? []) {
      const char = ((screen.rows[portal.row] ?? '')[portal.col] ?? '.') as TileChar
      const def = TILES[char]
      if (def?.cracked || def?.bush) {
        found.push({ screen: screen.id, col: portal.col, row: portal.row, to: portal.to })
      }
    }
  }
  return found
}

describe('a way in that has been opened', () => {
  const doors = hiddenDoors()

  it('there are hidden doors to check', () => {
    // Four bombable and one behind a bush, at the time of writing.
    expect(doors.length).toBeGreaterThanOrEqual(5)
  })

  it('is drawn as a doorway, not as bare ground', () => {
    // The fault this covers: bombing the boulder on the forest path left a gap
    // the colour of the grass, so the only way to discover the cave was to walk
    // over the exact tile. Every one of these behaves the same way, so fixing
    // it for one fixes it for all.
    for (const door of doors) {
      const screen = screenById(door.screen)
      expect(screen).toBeDefined()
      const opened = new Set([`${door.col},${door.row}`])
      expect(
        visibleTile(screen!, opened, door.col, door.row),
        `${door.screen} ${door.col},${door.row} -> ${door.to}`,
      ).toBe('C')
    }
  })

  it('still looks shut until it is opened', () => {
    for (const door of doors) {
      const screen = screenById(door.screen)!
      const shut = visibleTile(screen, new Set(), door.col, door.row)
      expect(shut, `${door.screen} gives itself away`).not.toBe('C')
      expect(TILES[shut]?.cracked || TILES[shut]?.bush).toBe(true)
    }
  })

  it('clears an opened wall with no door behind it to plain ground', () => {
    // A bombed wall that is only a wall stays a hole in the rock, not a cave.
    const screen = screenById('mountain-2')!
    const wall = (screen.gates ?? []).find((g) => g.gateId === 'mountain-wall')
    expect(wall).toBeDefined()
    const opened = new Set([`${wall!.col},${wall!.row}`])
    expect(visibleTile(screen, opened, wall!.col, wall!.row)).toBe('.')
  })
})
