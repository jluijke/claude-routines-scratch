/**
 * Tiles and collision.
 *
 * A screen is 16 x 11 tiles of 16 pixels, the same shape the 1986 game used,
 * and the view cuts from screen to screen rather than scrolling.
 */

export const TILE = 16
export const SCREEN_COLS = 16
export const SCREEN_ROWS = 11
export const SCREEN_W = SCREEN_COLS * TILE
export const SCREEN_H = SCREEN_ROWS * TILE

export type TileChar =
  | '.' // open ground
  | ',' // bush — cut it for a chance of rupees
  | '~' // water — impassable without Wings
  | 'T' // tree
  | 'R' // rock
  | '#' // wall
  | 'S' // sand path
  | 'B' // bridge over water
  | 'D' // dungeon doorway
  | 'C' // cave mouth
  | 'H' // shop door
  | '^' // stairs
  | '=' // sealed gate — opened by an exercise
  | '*' // statue
  | 'X' // cracked wall — blow it open with a bomb

export interface TileDef {
  solid: boolean
  /** Passable only while wearing the Wings. */
  water?: boolean
  /** Cuttable with a sword, and burnable with the candle. */
  bush?: boolean
  /** Blows open with a bomb. */
  cracked?: boolean
  /** Walking onto it moves the player somewhere else. */
  portal?: boolean
  colour: string
  accent?: string
}

export const TILES: Record<TileChar, TileDef> = {
  '.': { solid: false, colour: '#3f7d38', accent: '#4a8f41' },
  ',': { solid: false, bush: true, colour: '#3f7d38', accent: '#2c5f27' },
  '~': { solid: true, water: true, colour: '#2f6fd0', accent: '#4a8ae8' },
  T: { solid: true, colour: '#1f5c26', accent: '#2e7a33' },
  R: { solid: true, colour: '#7d7466', accent: '#9a9184' },
  '#': { solid: true, colour: '#4a4a55', accent: '#5e5e6b' },
  S: { solid: false, colour: '#c9a86a', accent: '#d9bc84' },
  B: { solid: false, colour: '#8a5a2b', accent: '#a06a33' },
  D: { solid: false, portal: true, colour: '#1a1a22', accent: '#3a3a48' },
  C: { solid: false, portal: true, colour: '#1a1a22', accent: '#3a3a48' },
  H: { solid: false, portal: true, colour: '#5a3a1b', accent: '#8a5a2b' },
  '^': { solid: false, portal: true, colour: '#7d7466', accent: '#c9c2ad' },
  '=': { solid: true, colour: '#79838f', accent: '#57d2c6' },
  '*': { solid: true, colour: '#8a8478', accent: '#a8a294' },
  X: { solid: true, cracked: true, colour: '#6f685c', accent: '#4a453c' },
}

export function tileAt(rows: readonly string[], col: number, row: number): TileChar {
  if (col < 0 || row < 0 || row >= rows.length) return '#'
  const line = rows[row] as string
  if (col >= line.length) return '#'
  return (line[col] ?? '#') as TileChar
}

export function isSolidChar(char: TileChar, canCrossWater: boolean): boolean {
  const def = TILES[char] ?? TILES['#']
  if (def.water) return !canCrossWater
  return def.solid
}

/** Converts world pixels to tile coordinates. */
export function toTile(x: number, y: number): { col: number; row: number } {
  return { col: Math.floor(x / TILE), row: Math.floor(y / TILE) }
}
