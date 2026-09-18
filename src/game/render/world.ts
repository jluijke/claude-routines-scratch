/**
 * Draws one screen.
 *
 * The look follows the NES top-down adventure convention closely: a green
 * overworld hemmed in by dense round-canopied trees and blocky tan cliffs,
 * black arched cave mouths cut into rock, and dungeons of blue brick with
 * doorways in the middle of each wall. All of it drawn here from rectangles —
 * no tile art is copied from anywhere.
 */
import { SCREEN_COLS, SCREEN_ROWS, TILE, TILES, type TileChar } from '../world/tiles'
import type { Atlas } from './atlas'
import type { Screen } from '../world/screens'
import { gateById } from '../gates'

export type Theme = 'overworld' | 'dungeon' | 'cave' | 'ship' | 'rock' | 'airlock'

/** The three looks of Level 2. Same tiles underneath, drawn as steel and stone. */
const FUTURE_THEMES: readonly Theme[] = ['ship', 'rock', 'airlock']

export function isFutureTheme(theme: Theme): boolean {
  return FUTURE_THEMES.includes(theme)
}

export interface Palette {
  ground: string
  groundSpeckle: string
  /** Trees outdoors, brick outdoors-walls; wall blocks in a dungeon. */
  wall: string
  wallLight: string
  wallDark: string
  rock: string
  rockLight: string
  rockDark: string
  water: string
  waterLight: string
  path: string
  pathEdge: string
  leaf: string
  leafLight: string
  leafDark: string
  trunk: string
}

const OVERWORLD: Palette = {
  ground: '#4aab4a',
  groundSpeckle: '#3f9a41',
  wall: '#7c6a4a',
  wallLight: '#9a8763',
  wallDark: '#54462e',
  rock: '#b08b52',
  rockLight: '#d0ab6c',
  rockDark: '#7a5c30',
  water: '#2c6fd4',
  waterLight: '#6aa3f0',
  path: '#d8b878',
  pathEdge: '#c0a061',
  leaf: '#116b22',
  leafLight: '#1f9433',
  leafDark: '#063d12',
  trunk: '#5a3a1b',
}

/** Blue brick, dark floor — the interior look of the era. */
const DUNGEON: Palette = {
  ground: '#2b2f6b',
  groundSpeckle: '#333878',
  wall: '#4550c0',
  wallLight: '#6b76e0',
  wallDark: '#232a70',
  rock: '#3a4290',
  rockLight: '#5a63b8',
  rockDark: '#1d2258',
  water: '#1c58b8',
  waterLight: '#4a8ae8',
  path: '#3a3f80',
  pathEdge: '#2b2f6b',
  leaf: '#3a4290',
  leafLight: '#5a63b8',
  leafDark: '#1d2258',
  trunk: '#232a70',
}

/** Bare rock, warm and close. */
const CAVE: Palette = {
  ground: '#4a3a2a',
  groundSpeckle: '#3d3022',
  wall: '#6b5540',
  wallLight: '#8a6f53',
  wallDark: '#43341f',
  rock: '#7a6248',
  rockLight: '#9a7d5e',
  rockDark: '#4f3f2b',
  water: '#2c5fa4',
  waterLight: '#5a8ad0',
  path: '#7a6248',
  pathEdge: '#5c4a33',
  leaf: '#5c4a33',
  leafLight: '#7a6248',
  leafDark: '#3d3022',
  trunk: '#43341f',
}

/**
 * The sky-ship: blue-grey deck plating, pale hull panels, crates with a cyan
 * light on them, hazard-yellow walkways, and the black of space where the
 * land would have water.
 */
const SHIP: Palette = {
  ground: '#3b4452',
  groundSpeckle: '#46505f',
  wall: '#6b7686',
  wallLight: '#94a0b2',
  wallDark: '#3a414d',
  rock: '#5a6b8a',
  rockLight: '#8093b6',
  rockDark: '#36415a',
  water: '#06070f',
  waterLight: '#1a2140',
  path: '#c9a32c',
  pathEdge: '#2b2b2b',
  leaf: '#e2883a',
  leafLight: '#f2c94c',
  leafDark: '#8a4a1a',
  trunk: '#57d2c6',
}

/** A rock in space: grey dust, dark spires, pale boulders, crystal for scrub. */
const ROCK: Palette = {
  ground: '#5c5e66',
  groundSpeckle: '#4f5159',
  wall: '#3a3c45',
  wallLight: '#5a5d68',
  wallDark: '#1f2027',
  rock: '#7a7c86',
  rockLight: '#a3a5ae',
  rockDark: '#464851',
  water: '#06070f',
  waterLight: '#1a2140',
  path: '#8a8c96',
  pathEdge: '#6a6c76',
  leaf: '#57d2c6',
  leafLight: '#c8fff8',
  leafDark: '#2a7a72',
  trunk: '#2a2f3d',
}

/** The airlock: a grid floor and padded, darker walls. Somewhere to hold your breath. */
const AIRLOCK: Palette = {
  ground: '#7d838f',
  groundSpeckle: '#6b717d',
  wall: '#565d6b',
  wallLight: '#7d8798',
  wallDark: '#2a2f3a',
  rock: '#5a6b8a',
  rockLight: '#8093b6',
  rockDark: '#36415a',
  water: '#06070f',
  waterLight: '#1a2140',
  path: '#c9a32c',
  pathEdge: '#2b2b2b',
  leaf: '#e2883a',
  leafLight: '#f2c94c',
  leafDark: '#8a4a1a',
  trunk: '#57d2c6',
}

export const PALETTES: Record<Theme, Palette> = {
  overworld: OVERWORLD,
  dungeon: DUNGEON,
  cave: CAVE,
  ship: SHIP,
  rock: ROCK,
  airlock: AIRLOCK,
}

const DUNGEON_REGIONS = ['Sunken Hall', 'Hollow Keep', 'Ember Vault', 'Sunless Spire']

/** Which look a screen wears. Derived so no screen has to say it twice. */
export function themeFor(screen: Screen): Theme {
  // Level 2 says what it is made of; nothing about it is inferred from names.
  if (screen.setting) return screen.setting
  if (DUNGEON_REGIONS.includes(screen.region)) return 'dungeon'
  // Anywhere the sun does not reach is underground, whatever it is called.
  // Matching on the id alone once gave a cave a grass floor.
  if (screen.dark) return 'cave'
  if (screen.shop || /grotto|cave|interior|secret/.test(screen.id)) return 'cave'
  return 'overworld'
}

/**
 * Which tile to draw at a spot, once anything cleared there is taken into
 * account.
 *
 * Cleared ground — a barrier opened, a wall bombed, a bush burned — is drawn as
 * ordinary ground, because the collision map already treats it that way and it
 * would otherwise be walkable but still look like rock. The exception is a
 * cleared tile with a doorway on it: that is drawn as the doorway it now is.
 * Bombing a rock used to leave nothing but a gap the colour of the grass, so
 * the way in was invisible and you had to walk the exact tile to find it, which
 * is no way to reward someone for spending a bomb on it.
 */
export function visibleTile(
  screen: Screen,
  openedTiles: ReadonlySet<string>,
  col: number,
  row: number,
): TileChar {
  const char = ((screen.rows[row] ?? '')[col] ?? '.') as TileChar
  if (!openedTiles.has(`${col},${row}`)) return char
  const def = TILES[char]
  if (char !== '=' && !def?.cracked && !def?.bush) return char
  const door = (screen.portals ?? []).some((portal) => portal.col === col && portal.row === row)
  return door ? 'C' : '.'
}

export function drawTiles(
  ctx: CanvasRenderingContext2D,
  screen: Screen,
  openedTiles: ReadonlySet<string>,
  frame: number,
): void {
  const theme = themeFor(screen)
  const p = PALETTES[theme]

  for (let row = 0; row < SCREEN_ROWS; row++) {
    const line = screen.rows[row] as string
    for (let col = 0; col < SCREEN_COLS; col++) {
      const char = visibleTile(screen, openedTiles, col, row)

      const x = col * TILE
      const y = row * TILE
      drawTile(ctx, char, x, y, col, row, p, theme, frame, line, screen)
    }
  }
}

function drawTile(
  ctx: CanvasRenderingContext2D,
  char: TileChar,
  x: number,
  y: number,
  col: number,
  row: number,
  p: Palette,
  theme: Theme,
  frame: number,
  line: string,
  screen: Screen,
): void {
  // Everything sits on ground, so a tile with holes in it reads correctly.
  ground(ctx, x, y, col, row, p, theme)

  if (isFutureTheme(theme)) return drawFutureTile(ctx, char, x, y, col, row, p, theme, frame, line, screen)

  switch (char) {
    case '.':
      return
    case 'S':
      return path(ctx, x, y, col, row, p)
    case ',':
      return bush(ctx, x, y, p)
    case '~':
      return water(ctx, x, y, col, row, frame, p, line, screen)
    case 'B':
      return bridge(ctx, x, y, p)
    case 'T':
      return theme === 'overworld' ? tree(ctx, x, y, p) : block(ctx, x, y, col, row, p)
    case 'p':
      return hidingTree(ctx, x, y, p)
    case 'R':
      return cliff(ctx, x, y, col, row, p, line, screen)
    case '#':
      return block(ctx, x, y, col, row, p)
    case 'X':
      return crackedWall(ctx, x, y, p)
    case '*':
      return statue(ctx, x, y, p)
    case '^':
      return stairs(ctx, x, y, p)
    case 'D':
    case 'C':
      return caveMouth(ctx, x, y, p)
    case 'H':
      return doorway(ctx, x, y, p)
    case '=':
      return
  }
}

/**
 * The same letters, a thousand years on.
 *
 * Nothing about collision or the map checks knows the difference: a 'T' is
 * still the solid border, a ',' is still something a tool clears. Only what is
 * painted changes — and it is painted in the same sixteen-pixel, outlined,
 * flat-colour way as the land, so the two worlds read as one game.
 */
function drawFutureTile(
  ctx: CanvasRenderingContext2D,
  char: TileChar,
  x: number,
  y: number,
  col: number,
  row: number,
  p: Palette,
  theme: Theme,
  frame: number,
  line: string,
  screen: Screen,
): void {
  const onRock = theme === 'rock'
  switch (char) {
    case '.':
      return
    case 'S':
      return onRock ? path(ctx, x, y, col, row, p) : walkway(ctx, x, y, col, row, p, screen)
    case ',':
      return onRock ? crystals(ctx, x, y, p) : cables(ctx, x, y, col, row, p)
    case '~':
      // On a rock a hole is an edge too: the asteroid stops, and space shows.
      return onRock ? asteroidEdge(ctx, x, y, col, row, p, screen, frame) : space(ctx, x, y, col, row, frame, screen, theme)
    case 'B':
      return gantry(ctx, x, y, p)
    case 'T':
      return onRock ? asteroidEdge(ctx, x, y, col, row, p, screen, frame) : hullPanel(ctx, x, y, col, row, p, screen, frame)
    case 'p':
      return onRock ? hidingCrystals(ctx, x, y, p) : sealedPanel(ctx, x, y, col, row, p, screen, frame)
    case 'R':
      return onRock ? cliff(ctx, x, y, col, row, p, line, screen) : machinery(ctx, x, y, col, row, p, screen, frame)
    case '#':
      return onRock
        ? cliff(ctx, x, y, col, row, p, line, screen, '#')
        : theme === 'airlock'
          ? airlockWall(ctx, x, y, col, row, p, screen, frame)
          : block(ctx, x, y, col, row, p)
    case 'X':
      return crackedWall(ctx, x, y, p)
    case '*':
      return pillar(ctx, x, y, p, frame)
    case '^':
      return liftHatch(ctx, x, y, p, frame)
    case 'D':
    case 'C':
      return hatch(ctx, x, y, p, frame)
    case 'H':
      return hatch(ctx, x, y, p, frame)
    case '=':
      return
  }
}

// --- pieces ---------------------------------------------------------------

function ground(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  col: number,
  row: number,
  p: Palette,
  theme: Theme = 'overworld',
): void {
  ctx.fillStyle = p.ground
  ctx.fillRect(x, y, TILE, TILE)

  if (theme === 'ship' || theme === 'airlock') {
    // Deck plating: a seam along two edges of every plate, and a rivet in
    // the corner of some of them. Every so often a plate is something else —
    // a floor grille, a hazard mark, a guide light — so a long deck reads as
    // a deck and not as a grey field.
    ctx.fillStyle = p.groundSpeckle
    ctx.fillRect(x, y + TILE - 1, TILE, 1)
    ctx.fillRect(x + TILE - 1, y, 1, TILE)
    if ((col * 5 + row * 3) % 4 === 0) ctx.fillRect(x + 2, y + 2, 2, 2)
    if (theme === 'airlock') {
      // Big plates: a seam every tile and a rivet in one corner, nothing else.
      ctx.fillRect(x + 2, y + 2, 1, 1)
      return
    }
    const v = (col * 7919 + row * 104729 + col * row * 31) % 17
    if (v === 0) {
      // A floor grille: three dark slats in a recessed frame.
      ctx.fillStyle = '#2a3140'
      ctx.fillRect(x + 4, y + 4, 8, 8)
      ctx.fillStyle = '#56617a'
      ctx.fillRect(x + 5, y + 5, 6, 1)
      ctx.fillRect(x + 5, y + 8, 6, 1)
      ctx.fillRect(x + 5, y + 11, 6, 1)
    } else if (v === 1) {
      // A hazard mark by the seam.
      ctx.fillStyle = p.path
      ctx.fillRect(x + 3, y + 12, 3, 2)
      ctx.fillRect(x + 8, y + 12, 3, 2)
    } else if (v === 2) {
      // A guide light set into the plate, slow and blue.
      ctx.fillStyle = '#1a2140'
      ctx.fillRect(x + 6, y + 6, 4, 4)
      ctx.fillStyle = Math.floor((col + row * 3) / 2) % 2 === 0 ? '#57d2c6' : '#3f74d6'
      ctx.fillRect(x + 7, y + 7, 2, 2)
    } else if (v === 3) {
      // Four rivets, a heavier plate.
      ctx.fillStyle = p.groundSpeckle
      ctx.fillRect(x + 2, y + 2, 2, 2)
      ctx.fillRect(x + 11, y + 2, 2, 2)
      ctx.fillRect(x + 2, y + 11, 2, 2)
      ctx.fillRect(x + 11, y + 11, 2, 2)
    }
    return
  }
  if (theme === 'rock') {
    // Dust, with craters and scattered stones — the surface of an asteroid.
    ctx.fillStyle = p.groundSpeckle
    if ((col * 7 + row * 13) % 5 === 0) ctx.fillRect(x + 3, y + 4, 2, 2)
    if ((col * 3 + row * 5) % 7 === 0) ctx.fillRect(x + 10, y + 11, 2, 1)
    const v = (col * 7919 + row * 104729 + col * row * 31) % 13
    if (v === 0) {
      // A crater: a dark bowl with a lit far rim.
      ctx.fillStyle = p.rockDark
      ctx.fillRect(x + 3, y + 5, 10, 7)
      ctx.fillRect(x + 4, y + 4, 8, 9)
      ctx.fillStyle = '#3a3c45'
      ctx.fillRect(x + 5, y + 7, 6, 4)
      ctx.fillStyle = p.rockLight
      ctx.fillRect(x + 4, y + 12, 8, 1)
      ctx.fillRect(x + 3, y + 11, 1, 1)
      ctx.fillRect(x + 12, y + 11, 1, 1)
    } else if (v === 1 || v === 2) {
      // A small stone.
      ctx.fillStyle = p.rockDark
      ctx.fillRect(x + 6, y + 8, 5, 4)
      ctx.fillStyle = p.rock
      ctx.fillRect(x + 7, y + 8, 3, 2)
      ctx.fillStyle = p.rockLight
      ctx.fillRect(x + 7, y + 8, 2, 1)
    } else if (v === 3) {
      // A little dip.
      ctx.fillStyle = p.groundSpeckle
      ctx.fillRect(x + 6, y + 6, 5, 3)
      ctx.fillStyle = p.rockDark
      ctx.fillRect(x + 7, y + 7, 3, 1)
    }
    return
  }
  // A sparse, fixed speckle so open ground is not a flat slab.
  ctx.fillStyle = p.groundSpeckle
  if ((col * 7 + row * 13) % 5 === 0) ctx.fillRect(x + 4, y + 5, 2, 2)
  if ((col * 3 + row * 5) % 7 === 0) ctx.fillRect(x + 10, y + 11, 2, 2)
}

function path(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  col: number,
  row: number,
  p: Palette,
): void {
  ctx.fillStyle = p.path
  ctx.fillRect(x, y, TILE, TILE)
  ctx.fillStyle = p.pathEdge
  if ((col + row) % 2 === 0) ctx.fillRect(x + 3, y + 6, 3, 2)
  if ((col * 5 + row) % 3 === 0) ctx.fillRect(x + 9, y + 2, 2, 2)
}

/**
 * The dense dark tree that hems in every outdoor screen.
 *
 * Drawn from a pixel map rather than rectangles: the scalloped crown and the
 * short trunk are what make a block of these read as forest instead of a grid
 * of green squares. Trees tile edge to edge, so the silhouette has to work
 * both alone and in a solid mass.
 */
const TREE_ROWS = [
  '..dd..dd..dd..d.',
  '.dDDddDDddDDddd.',
  'dDDDDDDDDDDDDDDd',
  'dDDlDDDDDDDDDDDd',
  'dDllDDDDlDDDDDDd',
  'dDlDDDDllDDDDDDd',
  'dDDDDDDlDDDDDDDd',
  'dDDDDDDDDDDDlDDd',
  'dDDDDDDDDDDllDDd',
  'dDDDDlDDDDDlDDDd',
  'dDDDllDDDDDDDDDd',
  '.dDDlDDDDDDDDdd.',
  '..ddDDDDDDDdd...',
  '....dtttttd.....',
  '....dtttttd.....',
  '.....ddddd......',
]

function tree(ctx: CanvasRenderingContext2D, x: number, y: number, p: Palette): void {
  const colours: Record<string, string> = {
    d: p.leafDark,
    D: p.leaf,
    l: p.leafLight,
    t: p.trunk,
  }
  for (let row = 0; row < 16; row++) {
    const line = TREE_ROWS[row] as string
    for (let col = 0; col < 16; col++) {
      const colour = colours[line[col] as string]
      if (!colour) continue
      ctx.fillStyle = colour
      ctx.fillRect(x + col, y + row, 1, 1)
    }
  }
}

/**
 * A tree with something in it.
 *
 * The same tree, with the neck and shoulder of a bottle showing at its foot —
 * a couple of pixels of glass and a cork. Not a marker: from across the screen
 * it is a tree, and it is meant to be found by someone who is looking.
 */
function hidingTree(ctx: CanvasRenderingContext2D, x: number, y: number, p: Palette): void {
  tree(ctx, x, y, p)
  ctx.fillStyle = '#2a2f3d'
  ctx.fillRect(x + 6, y + 10, 4, 5)
  ctx.fillStyle = '#9a55d1'
  ctx.fillRect(x + 7, y + 11, 2, 4)
  ctx.fillStyle = '#c9a86a'
  ctx.fillRect(x + 7, y + 9, 2, 1)
}

/**
 * A low, bright shrub — deliberately nothing like the trees, because one of
 * these can be cut or burned and a tree cannot, and he has to be able to tell
 * at a glance.
 */
function bush(ctx: CanvasRenderingContext2D, x: number, y: number, p: Palette): void {
  ctx.fillStyle = p.leafDark
  ctx.fillRect(x + 2, y + 5, 12, 9)
  ctx.fillRect(x + 4, y + 3, 8, 2)
  ctx.fillStyle = p.leafLight
  ctx.fillRect(x + 3, y + 6, 10, 7)
  ctx.fillRect(x + 5, y + 4, 6, 2)
  // Leafy speckle, lighter than the trees so it reads as scrub.
  ctx.fillStyle = p.leaf
  ctx.fillRect(x + 5, y + 7, 2, 2)
  ctx.fillRect(x + 9, y + 9, 2, 2)
  ctx.fillRect(x + 7, y + 11, 2, 1)
}

/** Blocky tan cliff, drawn as part of a mass rather than a lone boulder. */
function cliff(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  col: number,
  row: number,
  p: Palette,
  line: string,
  screen: Screen,
  mass: string = 'R',
): void {
  const above = ((screen.rows[row - 1] ?? '')[col] ?? '.') === mass
  const below = ((screen.rows[row + 1] ?? '')[col] ?? '.') === mass
  const left = (line[col - 1] ?? '.') === mass
  const right = (line[col + 1] ?? '.') === mass

  ctx.fillStyle = p.rock
  ctx.fillRect(x, y, TILE, TILE)

  // Light along the top and left of the mass, shadow at the bottom and right.
  ctx.fillStyle = p.rockLight
  if (!above) ctx.fillRect(x, y, TILE, 3)
  if (!left) ctx.fillRect(x, y, 3, TILE)
  ctx.fillStyle = p.rockDark
  if (!below) ctx.fillRect(x, y + TILE - 3, TILE, 3)
  if (!right) ctx.fillRect(x + TILE - 3, y, 3, TILE)

  // Interior fissures.
  ctx.fillStyle = p.rockDark
  if ((col + row) % 2 === 0) ctx.fillRect(x + 5, y + 6, 6, 2)
  else ctx.fillRect(x + 4, y + 9, 5, 2)
}

/** Dungeon brickwork: two courses of blocks with mortar between. */
function block(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  col: number,
  row: number,
  p: Palette,
): void {
  ctx.fillStyle = p.wallDark
  ctx.fillRect(x, y, TILE, TILE)

  const offset = row % 2 === 0 ? 0 : 4
  ctx.fillStyle = p.wall
  ctx.fillRect(x + 1, y + 1, 14, 6)
  ctx.fillRect(x + 1, y + 9, 14, 6)

  // Vertical mortar, staggered course to course.
  ctx.fillStyle = p.wallDark
  ctx.fillRect(x + ((offset + 7) % 16), y + 1, 1, 6)
  ctx.fillRect(x + ((offset + 3) % 16), y + 9, 1, 6)

  // A highlight along the top of each course.
  ctx.fillStyle = p.wallLight
  ctx.fillRect(x + 1, y + 1, 14, 1)
  ctx.fillRect(x + 1, y + 9, 14, 1)
  void col
}

/** Same brick, visibly split — worth spending a bomb on. */
function crackedWall(ctx: CanvasRenderingContext2D, x: number, y: number, p: Palette): void {
  ctx.fillStyle = p.wallDark
  ctx.fillRect(x, y, TILE, TILE)
  ctx.fillStyle = p.rock
  ctx.fillRect(x + 1, y + 1, 14, 14)
  ctx.fillStyle = p.rockLight
  ctx.fillRect(x + 1, y + 1, 14, 1)

  // A fissure running top to bottom, plus branches.
  ctx.fillStyle = p.wallDark
  ctx.fillRect(x + 7, y + 1, 2, 5)
  ctx.fillRect(x + 5, y + 6, 2, 4)
  ctx.fillRect(x + 9, y + 7, 2, 6)
  ctx.fillRect(x + 3, y + 10, 3, 2)
  ctx.fillRect(x + 11, y + 4, 2, 3)
}

function water(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  col: number,
  row: number,
  frame: number,
  p: Palette,
  line: string,
  screen: Screen,
): void {
  ctx.fillStyle = p.water
  ctx.fillRect(x, y, TILE, TILE)

  const wave = Math.sin((frame + col * 12 + row * 7) / 24) * 2
  ctx.fillStyle = p.waterLight
  ctx.fillRect(x + 1, y + 5 + wave, 6, 2)
  ctx.fillRect(x + 9, y + 10 - wave, 5, 1)

  // A dark shoreline wherever the water meets something that is not water,
  // which is what stops a lake reading as a blue rectangle pasted on grass.
  const isWater = (c: number, r: number): boolean =>
    ((screen.rows[r] ?? '')[c] ?? '.') === '~'
  ctx.fillStyle = '#123c7a'
  if (!isWater(col, row - 1)) ctx.fillRect(x, y, TILE, 2)
  if (!isWater(col, row + 1)) ctx.fillRect(x, y + TILE - 2, TILE, 2)
  if (!isWater(col - 1, row)) ctx.fillRect(x, y, 2, TILE)
  if (!isWater(col + 1, row)) ctx.fillRect(x + TILE - 2, y, 2, TILE)
  void line
}

function bridge(ctx: CanvasRenderingContext2D, x: number, y: number, p: Palette): void {
  ctx.fillStyle = '#8a5a2b'
  ctx.fillRect(x, y, TILE, TILE)
  ctx.fillStyle = '#a87a42'
  for (let i = 0; i < 4; i++) ctx.fillRect(x, y + i * 4 + 1, TILE, 2)
  ctx.fillStyle = '#5a3a1b'
  ctx.fillRect(x, y, 2, TILE)
  ctx.fillRect(x + TILE - 2, y, 2, TILE)
  void p
}

/** A black arch cut into rock — the way into every cave and dungeon. */
function caveMouth(ctx: CanvasRenderingContext2D, x: number, y: number, p: Palette): void {
  ctx.fillStyle = p.rock
  ctx.fillRect(x, y, TILE, TILE)
  ctx.fillStyle = p.rockLight
  ctx.fillRect(x, y, TILE, 3)
  ctx.fillStyle = p.rockDark
  ctx.fillRect(x, y + TILE - 2, TILE, 2)

  // The arch itself: shoulders, then a square mouth below.
  ctx.fillStyle = '#000000'
  ctx.fillRect(x + 5, y + 3, 6, 2)
  ctx.fillRect(x + 4, y + 5, 8, 11)
  ctx.fillStyle = p.rockDark
  ctx.fillRect(x + 3, y + 5, 1, 11)
  ctx.fillRect(x + 12, y + 5, 1, 11)
}

/** A door in a wall, for the shop and the smithy. */
function doorway(ctx: CanvasRenderingContext2D, x: number, y: number, p: Palette): void {
  ctx.fillStyle = p.wall
  ctx.fillRect(x, y, TILE, TILE)
  ctx.fillStyle = p.wallLight
  ctx.fillRect(x, y, TILE, 2)
  ctx.fillStyle = '#3a2416'
  ctx.fillRect(x + 3, y + 2, 10, 14)
  ctx.fillStyle = '#000000'
  ctx.fillRect(x + 5, y + 5, 6, 11)
}

function stairs(ctx: CanvasRenderingContext2D, x: number, y: number, p: Palette): void {
  ctx.fillStyle = p.rockDark
  ctx.fillRect(x, y, TILE, TILE)
  ctx.fillStyle = p.rockLight
  for (let i = 0; i < 4; i++) ctx.fillRect(x + 1 + i, y + 2 + i * 4, 14 - i * 2, 2)
}

/** A knight statue, the kind that flanks a dungeon doorway. */
function statue(ctx: CanvasRenderingContext2D, x: number, y: number, p: Palette): void {
  ctx.fillStyle = p.rockDark
  ctx.fillRect(x + 2, y + 1, 12, 15)
  ctx.fillStyle = p.rock
  ctx.fillRect(x + 3, y + 2, 10, 13)
  ctx.fillStyle = p.rockLight
  ctx.fillRect(x + 5, y + 3, 6, 3)
  ctx.fillStyle = p.rockDark
  ctx.fillRect(x + 5, y + 7, 2, 2)
  ctx.fillRect(x + 9, y + 7, 2, 2)
  ctx.fillRect(x + 4, y + 11, 8, 1)
}


// --- pieces of the future -------------------------------------------------

/** A stable number for a tile of a screen, so decoration is fixed per place. */
function tileHash(screen: Screen, col: number, row: number): number {
  let h = 2166136261
  for (const ch of screen.id) h = Math.imul(h ^ ch.charCodeAt(0), 16777619) >>> 0
  return (h + col * 7919 + row * 104729 + col * row * 977) >>> 0
}

/** What a hull panel has on it. Windows come in pairs; see `hullPanel`. */
type HullDecor = 'plain' | 'window' | 'console' | 'vent' | 'light' | 'pipe' | 'rivets'

function hullDecor(screen: Screen, col: number, row: number): HullDecor {
  const edge = row === 0 || row === SCREEN_ROWS - 1 || col === 0 || col === SCREEN_COLS - 1
  const v = tileHash(screen, col, row) % 12
  if (!edge) return v < 3 ? 'vent' : v < 5 ? 'pipe' : v < 6 ? 'light' : 'plain'
  if (v < 3) return 'window'
  if (v < 5) return 'console'
  if (v < 6) return 'vent'
  if (v < 7) return 'light'
  if (v < 9) return 'pipe'
  if (v < 10) return 'rivets'
  return 'plain'
}

const isHull = (screen: Screen, col: number, row: number): boolean =>
  ((screen.rows[row] ?? '')[col] ?? '.') === 'T' || ((screen.rows[row] ?? '')[col] ?? '.') === 'p'

/**
 * A hull panel: the wall of every deck. Pale plate, a dark seam, a light
 * strip — and on the outer hull, the things a ship has in its walls: viewport
 * windows with stars behind them, console screens, vent grilles, warning
 * lights, pipe runs. Which panel gets which is fixed per place, so a corridor
 * always looks the way it looked last time.
 */
function hullPanel(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  col: number,
  row: number,
  p: Palette,
  screen: Screen,
  frame: number,
): void {
  ctx.fillStyle = p.wallDark
  ctx.fillRect(x, y, TILE, TILE)
  ctx.fillStyle = p.wall
  ctx.fillRect(x + 1, y + 1, 14, 14)
  ctx.fillStyle = p.wallLight
  ctx.fillRect(x + 1, y + 1, 14, 2)
  ctx.fillRect(x + 1, y + 1, 2, 14)

  // Windows are two panels wide along the top and bottom hull, two tall down
  // the sides: the left (or upper) one decides, and its neighbour follows.
  const horizontal = row === 0 || row === SCREEN_ROWS - 1
  const leads = (c: number, r: number): boolean =>
    isHull(screen, c, r) && hullDecor(screen, c, r) === 'window' && (horizontal ? c % 2 === 0 : r % 2 === 0)
  const partner = horizontal ? [col + 1, row] : [col, row + 1]
  const before = horizontal ? [col - 1, row] : [col, row - 1]
  if (leads(col, row) && isHull(screen, partner[0] as number, partner[1] as number)) {
    return viewport(ctx, x, y, col, row, screen, frame, horizontal ? 'left' : 'top')
  }
  if (leads(before[0] as number, before[1] as number)) {
    return viewport(ctx, x, y, col, row, screen, frame, horizontal ? 'right' : 'bottom')
  }

  switch (hullDecor(screen, col, row)) {
    case 'console': {
      ctx.fillStyle = '#12131a'
      ctx.fillRect(x + 3, y + 3, 10, 8)
      ctx.fillStyle = '#3f74d6'
      ctx.fillRect(x + 4, y + 4, 8, 6)
      ctx.fillStyle = '#c8fff8'
      ctx.fillRect(x + 5, y + 5, 4, 1)
      ctx.fillRect(x + 5, y + 7, 6, 1)
      if (Math.floor((frame + col * 9) / 22) % 2 === 0) ctx.fillRect(x + 5, y + 9, 2, 1)
      ctx.fillStyle = p.wallDark
      ctx.fillRect(x + 5, y + 12, 6, 1)
      ctx.fillStyle = '#e2883a'
      ctx.fillRect(x + 12, y + 12, 1, 1)
      return
    }
    case 'vent': {
      ctx.fillStyle = p.wallDark
      ctx.fillRect(x + 3, y + 4, 10, 8)
      ctx.fillStyle = p.wallLight
      ctx.fillRect(x + 4, y + 5, 8, 1)
      ctx.fillRect(x + 4, y + 8, 8, 1)
      ctx.fillRect(x + 4, y + 11, 8, 1)
      return
    }
    case 'light': {
      const on = Math.floor((frame + col * 13 + row * 5) / 26) % 2 === 0
      ctx.fillStyle = p.wallDark
      ctx.fillRect(x + 5, y + 5, 6, 6)
      ctx.fillStyle = on ? '#e2883a' : '#8a4a1a'
      ctx.fillRect(x + 6, y + 6, 4, 4)
      if (on) {
        ctx.fillStyle = '#f2c94c'
        ctx.fillRect(x + 7, y + 7, 2, 2)
      }
      return
    }
    case 'pipe': {
      ctx.fillStyle = p.wallDark
      if (horizontal || (row > 0 && row < SCREEN_ROWS - 1 && col > 0 && col < SCREEN_COLS - 1)) {
        ctx.fillRect(x, y + 7, TILE, 4)
        ctx.fillStyle = p.rockLight
        ctx.fillRect(x, y + 8, TILE, 2)
        ctx.fillStyle = p.wallDark
        ctx.fillRect(x + 6, y + 6, 4, 6)
      } else {
        ctx.fillRect(x + 6, y, 4, TILE)
        ctx.fillStyle = p.rockLight
        ctx.fillRect(x + 7, y, 2, TILE)
        ctx.fillStyle = p.wallDark
        ctx.fillRect(x + 5, y + 6, 6, 4)
      }
      return
    }
    case 'rivets': {
      ctx.fillStyle = p.wallDark
      ctx.fillRect(x + 3, y + 4, 1, 1)
      ctx.fillRect(x + 12, y + 4, 1, 1)
      ctx.fillRect(x + 3, y + 12, 1, 1)
      ctx.fillRect(x + 12, y + 12, 1, 1)
      ctx.fillStyle = p.trunk
      ctx.fillRect(x + 5, y + 8, 6, 1)
      return
    }
    default: {
      ctx.fillStyle = p.wallDark
      ctx.fillRect(x + 3, y + 4, 1, 1)
      ctx.fillRect(x + 12, y + 12, 1, 1)
      if ((col + row) % 3 === 0) {
        ctx.fillStyle = p.trunk
        ctx.fillRect(x + 5, y + 8, 6, 1)
      }
    }
  }
}

/**
 * A viewport: a window set into the hull, blue-framed, with stars behind it
 * and sometimes the curve of a planet. One half of a two-panel window.
 */
function viewport(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  col: number,
  row: number,
  screen: Screen,
  frame: number,
  half: 'left' | 'right' | 'top' | 'bottom',
): void {
  // The frame is open on the side the other half continues on.
  const inset = { l: 2, r: 2, t: 2, b: 2 }
  if (half === 'left') inset.r = 0
  if (half === 'right') inset.l = 0
  if (half === 'top') inset.b = 0
  if (half === 'bottom') inset.t = 0
  ctx.fillStyle = '#3f74d6'
  ctx.fillRect(x + inset.l - (inset.l ? 1 : 0), y + inset.t - (inset.t ? 1 : 0), TILE - inset.l - inset.r + (inset.l ? 1 : 0) + (inset.r ? 1 : 0), TILE - inset.t - inset.b + (inset.t ? 1 : 0) + (inset.b ? 1 : 0))
  ctx.fillStyle = '#06070f'
  ctx.fillRect(x + inset.l, y + inset.t, TILE - inset.l - inset.r, TILE - inset.t - inset.b)
  // Stars, a couple per pane, one of them slowly twinkling.
  const seed = tileHash(screen, col, row)
  const stars: [number, number][] = [
    [(seed % 9) + 3, ((seed >> 3) % 9) + 3],
    [((seed >> 5) % 9) + 3, ((seed >> 7) % 9) + 3],
    [((seed >> 9) % 9) + 3, ((seed >> 11) % 9) + 3],
  ]
  stars.forEach(([sx, sy], i) => {
    const dim = i === 0 && Math.floor((frame + seed) / 45) % 3 === 0
    ctx.fillStyle = dim ? '#1a2140' : i === 2 ? '#8f98a8' : '#f6f3e7'
    ctx.fillRect(x + sx, y + sy, 1, 1)
  })
  // A planet's edge in the corner of some windows: a blue arc, banded.
  if ((seed >> 13) % 3 === 0) {
    const cx = half === 'left' || half === 'top' ? x + 1 : x + 15
    const cy = half === 'top' ? y + 1 : half === 'bottom' ? y + 15 : y + 14
    for (let py = inset.t; py < TILE - inset.b; py++) {
      for (let px = inset.l; px < TILE - inset.r; px++) {
        const d = Math.hypot(x + px - cx, y + py - cy)
        if (d > 9) continue
        ctx.fillStyle = d > 8 ? '#6aa3f0' : (py + px) % 4 === 0 ? '#27488f' : '#3f74d6'
        ctx.fillRect(x + px, y + py, 1, 1)
      }
    }
  }
}

/** A sealed panel with something behind it: a hull panel, a screw, and a glint. */
function sealedPanel(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  col: number,
  row: number,
  p: Palette,
  screen: Screen,
  frame: number,
): void {
  void screen
  void frame
  void col
  void row
  ctx.fillStyle = p.wallDark
  ctx.fillRect(x, y, TILE, TILE)
  ctx.fillStyle = p.wall
  ctx.fillRect(x + 1, y + 1, 14, 14)
  ctx.fillStyle = p.wallLight
  ctx.fillRect(x + 1, y + 1, 14, 2)
  ctx.fillRect(x + 1, y + 1, 2, 14)
  ctx.fillStyle = p.wallDark
  ctx.fillRect(x + 6, y + 5, 4, 4)
  ctx.fillStyle = p.wallLight
  ctx.fillRect(x + 7, y + 6, 2, 2)
  // The seam along the bottom edge glows: whatever is behind it is lit.
  ctx.fillStyle = '#2a2f3d'
  ctx.fillRect(x + 4, y + 12, 8, 3)
  ctx.fillStyle = '#57d2c6'
  ctx.fillRect(x + 6, y + 13, 4, 1)
}

/**
 * The solid blocks of a deck: crates, and the machinery a ship is full of.
 * A block two tiles tall is one machine — the lower tile follows the upper
 * one — so a console has its screen up top and its keyboard below, and a
 * tank is one glass tube rather than two.
 */
function machinery(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  col: number,
  row: number,
  p: Palette,
  screen: Screen,
  frame: number,
): void {
  const at = (c: number, r: number): string => (screen.rows[r] ?? '')[c] ?? '.'
  const above = at(col, row - 1) === 'R'
  const below = at(col, row + 1) === 'R'
  const top = above ? row - 1 : row
  const kind = tileHash(screen, col, top) % 10
  const lower = above
  const stack = above || below

  ctx.fillStyle = p.rockDark
  ctx.fillRect(x, y, TILE, TILE)

  if (stack && kind >= 4 && kind < 6) {
    // A console: a lit screen over a bank of keys.
    ctx.fillStyle = p.rock
    ctx.fillRect(x + 1, y + (lower ? 0 : 1), 14, lower ? 14 : 15)
    if (!lower) {
      ctx.fillStyle = '#12131a'
      ctx.fillRect(x + 2, y + 3, 12, 11)
      ctx.fillStyle = '#3f74d6'
      ctx.fillRect(x + 3, y + 4, 10, 9)
      ctx.fillStyle = '#c8fff8'
      ctx.fillRect(x + 4, y + 5, 5, 1)
      ctx.fillRect(x + 4, y + 7, 7, 1)
      ctx.fillRect(x + 4, y + 9, 3, 1)
      if (Math.floor((frame + col * 7) / 20) % 2 === 0) ctx.fillRect(x + 4, y + 11, 4, 1)
      ctx.fillStyle = '#e2883a'
      ctx.fillRect(x + 11, y + 11, 1, 1)
    } else {
      ctx.fillStyle = p.rockLight
      ctx.fillRect(x + 2, y + 2, 12, 4)
      ctx.fillStyle = p.rockDark
      for (let i = 0; i < 5; i++) ctx.fillRect(x + 3 + i * 2, y + 3, 1, 2)
      ctx.fillRect(x + 4, y + 9, 8, 1)
      ctx.fillStyle = '#57d2c6'
      ctx.fillRect(x + 3, y + 12, 2, 1)
      ctx.fillStyle = '#e2883a'
      ctx.fillRect(x + 11, y + 12, 2, 1)
    }
    return
  }

  if (stack && kind >= 6 && kind < 8) {
    // A tank: a glass tube of something green, capped top and bottom.
    ctx.fillStyle = p.rock
    ctx.fillRect(x + 1, y, 14, TILE)
    const glow = Math.floor((frame + col * 11) / 30) % 2 === 0
    ctx.fillStyle = glow ? '#7fbb4c' : '#6aa63e'
    ctx.fillRect(x + 4, y + (lower ? 0 : 4), 8, lower ? 11 : 12)
    ctx.fillStyle = '#c8ff8a'
    ctx.fillRect(x + 5, y + (lower ? 0 : 5), 1, lower ? 10 : 11)
    ctx.fillStyle = '#4d7a2c'
    ctx.fillRect(x + 10, y + (lower ? 0 : 5), 2, lower ? 10 : 11)
    ctx.fillStyle = p.rockLight
    if (!lower) ctx.fillRect(x + 3, y + 1, 10, 3)
    else ctx.fillRect(x + 3, y + 11, 10, 3)
    ctx.fillStyle = p.rockDark
    if (!lower) ctx.fillRect(x + 3, y + 3, 10, 1)
    else ctx.fillRect(x + 3, y + 11, 10, 1)
    return
  }

  if (stack && kind >= 8) {
    // An engine housing: vents, and an orange light that breathes.
    ctx.fillStyle = p.rock
    ctx.fillRect(x + 1, y + 1, 14, 14)
    ctx.fillStyle = p.rockLight
    ctx.fillRect(x + 1, y + 1, 14, 1)
    ctx.fillStyle = p.rockDark
    for (let i = 0; i < 4; i++) ctx.fillRect(x + 3, y + 3 + i * 3, 10, 1)
    if (!lower) {
      const on = Math.floor((frame + col * 5) / 24) % 2 === 0
      ctx.fillStyle = on ? '#e2883a' : '#8a4a1a'
      ctx.fillRect(x + 11, y + 11, 3, 3)
    }
    return
  }

  // A crate: a solid block with a light on its face.
  ctx.fillStyle = p.rock
  ctx.fillRect(x + 1, y + 1, 14, 14)
  ctx.fillStyle = p.rockLight
  ctx.fillRect(x + 1, y + 1, 14, 2)
  ctx.fillRect(x + 1, y + 1, 2, 14)
  ctx.fillStyle = p.rockDark
  ctx.fillRect(x + 4, y + 7, 8, 1)
  if (kind % 2 === 0) {
    ctx.fillStyle = '#57d2c6'
    ctx.fillRect(x + 11, y + 4, 2, 1)
  } else {
    ctx.fillStyle = '#e2883a'
    ctx.fillRect(x + 3, y + 11, 3, 1)
  }
}

/** A marked walkway: lighter plating with a yellow line down each side. The sand path of the ship. */
function walkway(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  col: number,
  row: number,
  p: Palette,
  screen: Screen,
): void {
  ctx.fillStyle = '#4b5567'
  ctx.fillRect(x, y, TILE, TILE)
  ctx.fillStyle = '#56617a'
  ctx.fillRect(x, y + TILE - 1, TILE, 1)
  ctx.fillRect(x + TILE - 1, y, 1, TILE)
  // The yellow runs along the edge of the walkway, not through the middle of
  // it, so a wide apron reads as a floor with a border rather than a slab.
  const isWalk = (c: number, r: number): boolean => ((screen.rows[r] ?? '')[c] ?? '.') === 'S'
  ctx.fillStyle = p.path
  if (!isWalk(col, row - 1)) ctx.fillRect(x, y, TILE, 2)
  if (!isWalk(col, row + 1)) ctx.fillRect(x, y + TILE - 2, TILE, 2)
  if (!isWalk(col - 1, row)) ctx.fillRect(x, y, 2, TILE)
  if (!isWalk(col + 1, row)) ctx.fillRect(x + TILE - 2, y, 2, TILE)
  ctx.fillStyle = '#56617a'
  if ((col * 3 + row) % 4 === 0) ctx.fillRect(x + 6, y + 7, 3, 1)
}

/** Loose cabling, orange and yellow, spilling out of the floor. The bush. */
function cables(ctx: CanvasRenderingContext2D, x: number, y: number, col: number, row: number, p: Palette): void {
  ctx.fillStyle = p.leafDark
  ctx.fillRect(x + 2, y + 5, 12, 9)
  ctx.fillStyle = p.leaf
  ctx.fillRect(x + 3, y + 6, 10, 7)
  ctx.fillStyle = p.leafLight
  ctx.fillRect(x + 4, y + 7, 3, 1)
  ctx.fillRect(x + 9, y + 9, 3, 1)
  ctx.fillRect(x + 6, y + 11, 4, 1)
  ctx.fillStyle = p.leafDark
  ctx.fillRect(x + 7, y + 3, 2, 3)
  ctx.fillRect(x + ((col + row) % 2 ? 4 : 10), y + 8, 2, 2)
}

/**
 * The edge of the asteroid.
 *
 * The border of a rock is not a wall but the place the ground stops: black
 * space with stars and distant planets, and along every side that touches
 * the surface, a ragged lip of rock — the lit top edge where the surface
 * ends, and a shaded cliff face where the drop is towards the viewer.
 */
function asteroidEdge(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  col: number,
  row: number,
  p: Palette,
  screen: Screen,
  frame: number,
): void {
  space(ctx, x, y, col, row, frame, screen, 'rock')
  const at = (c: number, r: number): string => (screen.rows[r] ?? '')[c] ?? 'T'
  const ground = (c: number, r: number): boolean => at(c, r) !== 'T' && at(c, r) !== '~'
  const seed = tileHash(screen, col, row)
  const jag = (i: number): number => (seed >> (i % 13)) % 3

  // Ground above: this tile is the drop below the surface, so the cliff face.
  if (ground(col, row - 1)) {
    for (let px = 0; px < TILE; px++) {
      const depth = 5 + jag(px)
      ctx.fillStyle = p.wall
      ctx.fillRect(x + px, y, 1, depth)
      ctx.fillStyle = p.wallDark
      ctx.fillRect(x + px, y + depth - 1, 1, 1)
      if (px % 3 === (seed % 3)) ctx.fillRect(x + px, y + 1, 1, depth - 2)
    }
    ctx.fillStyle = p.wallLight
    ctx.fillRect(x, y, TILE, 1)
  }
  // Ground below: the lit top edge of the surface.
  if (ground(col, row + 1)) {
    for (let px = 0; px < TILE; px++) {
      const depth = 3 + jag(px + 4)
      ctx.fillStyle = p.ground
      ctx.fillRect(x + px, y + TILE - depth, 1, depth)
      ctx.fillStyle = p.rockLight
      ctx.fillRect(x + px, y + TILE - depth, 1, 1)
    }
  }
  // Ground to the left or right: the side of the asteroid.
  if (ground(col - 1, row)) {
    for (let py = 0; py < TILE; py++) {
      const depth = 3 + jag(py + 7)
      ctx.fillStyle = p.wall
      ctx.fillRect(x, y + py, depth, 1)
      ctx.fillStyle = p.wallLight
      ctx.fillRect(x, y + py, 1, 1)
      ctx.fillStyle = p.wallDark
      ctx.fillRect(x + depth - 1, y + py, 1, 1)
    }
  }
  if (ground(col + 1, row)) {
    for (let py = 0; py < TILE; py++) {
      const depth = 3 + jag(py + 9)
      ctx.fillStyle = p.wall
      ctx.fillRect(x + TILE - depth, y + py, depth, 1)
      ctx.fillStyle = p.wallLight
      ctx.fillRect(x + TILE - 1, y + py, 1, 1)
      ctx.fillStyle = p.wallDark
      ctx.fillRect(x + TILE - depth, y + py, 1, 1)
    }
  }
}

/** A crystal cluster on a rock: the scrub, and it comes off with a tool. */
function crystals(ctx: CanvasRenderingContext2D, x: number, y: number, p: Palette): void {
  ctx.fillStyle = p.leafDark
  ctx.fillRect(x + 3, y + 8, 4, 6)
  ctx.fillRect(x + 7, y + 4, 3, 10)
  ctx.fillRect(x + 10, y + 9, 3, 5)
  ctx.fillStyle = p.leaf
  ctx.fillRect(x + 4, y + 9, 2, 4)
  ctx.fillRect(x + 8, y + 5, 1, 8)
  ctx.fillRect(x + 11, y + 10, 1, 3)
  ctx.fillStyle = p.leafLight
  ctx.fillRect(x + 4, y + 9, 1, 2)
  ctx.fillRect(x + 8, y + 5, 1, 3)
}

/** Crystals with a bottle wedged in among them. */
function hidingCrystals(ctx: CanvasRenderingContext2D, x: number, y: number, p: Palette): void {
  crystals(ctx, x, y, p)
  ctx.fillStyle = '#2a2f3d'
  ctx.fillRect(x + 12, y + 11, 3, 4)
  ctx.fillStyle = '#c8fff8'
  ctx.fillRect(x + 13, y + 12, 1, 3)
}

/** Open space: black, with stars that turn slowly, and a lit lip at every edge. */
function space(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  col: number,
  row: number,
  frame: number,
  screen: Screen,
  theme: Theme = 'ship',
): void {
  ctx.fillStyle = '#06070f'
  ctx.fillRect(x, y, TILE, TILE)
  // An airlock's window looks out onto the rock itself: grey ground rising
  // along the bottom of the pane, with the stars above it.
  const airlockSill = theme === 'airlock' && ((screen.rows[row + 1] ?? '')[col] ?? '~') !== '~'
  if (airlockSill) {
    const seed = tileHash(screen, col, row)
    const rise = 5 + (seed % 4)
    ctx.fillStyle = '#7a7c86'
    ctx.fillRect(x, y + TILE - rise, TILE, rise)
    ctx.fillStyle = '#a3a5ae'
    ctx.fillRect(x, y + TILE - rise, TILE, 1)
    ctx.fillStyle = '#5c5e66'
    ctx.fillRect(x + (seed % 7) + 2, y + TILE - 3, 2, 1)
    ctx.fillRect(x + ((seed >> 3) % 9) + 1, y + TILE - rise + 2, 1, 1)
  }
  // A planet, somewhere out there: one per screen, big and banded, hanging
  // in whichever corner of the void the screen's own number puts it.
  for (const planet of planetsOf(screen)) {
    if (Math.hypot(x + 8 - planet.x, y + 8 - planet.y) >= planet.r + 12) continue
    for (let py = 0; py < TILE; py++) {
      for (let px = 0; px < TILE; px++) {
        const d = Math.hypot(x + px - planet.x, y + py - planet.y)
        if (d > planet.r) continue
        const band = Math.floor((y + py - planet.y + planet.r) / 6) % 3
        ctx.fillStyle =
          d > planet.r - 1.5 ? planet.rim : band === 0 ? planet.dark : band === 1 ? planet.mid : planet.light
        ctx.fillRect(x + px, y + py, 1, 1)
      }
    }
  }
  // Three stars a tile, at fixed spots, one of them blinking.
  const seed = col * 31 + row * 17
  const stars: [number, number][] = [
    [(seed * 7) % 14 + 1, (seed * 11) % 14 + 1],
    [(seed * 13) % 14 + 1, (seed * 3) % 14 + 1],
    [(seed * 5) % 14 + 1, (seed * 19) % 14 + 1],
  ]
  stars.forEach(([sx, sy], i) => {
    const blink = i === 0 && Math.floor((frame + seed) / 40) % 3 === 0
    ctx.fillStyle = blink ? '#1a2140' : i === 2 ? '#8f98a8' : '#f6f3e7'
    ctx.fillRect(x + sx, y + sy, 1, 1)
  })
  // Where the floor stops, a rim, so the drop reads as a drop. Not on a
  // rock: there the asteroid's own edge is drawn over this, ragged.
  if (theme === 'rock') return
  const isSpace = (c: number, r: number): boolean => ((screen.rows[r] ?? '')[c] ?? '~') === '~'
  ctx.fillStyle = '#2a3140'
  if (!isSpace(col, row - 1)) ctx.fillRect(x, y, TILE, 2)
  if (!isSpace(col, row + 1)) ctx.fillRect(x, y + TILE - 2, TILE, 2)
  if (!isSpace(col - 1, row)) ctx.fillRect(x, y, 2, TILE)
  if (!isSpace(col + 1, row)) ctx.fillRect(x + TILE - 2, y, 2, TILE)
}

interface Planet {
  x: number
  y: number
  r: number
  rim: string
  dark: string
  mid: string
  light: string
}

/**
 * The planets a screen's sky hangs: one big and near in a corner, one small
 * and far in the opposite one. Nowhere for a screen with no sky in it.
 */
function planetsOf(screen: Screen): Planet[] {
  if (screen.setting !== 'rock' && !screen.rows.some((line) => line.includes('~'))) return []
  const seed = tileHash(screen, 3, 7)
  const corners: [number, number][] = [
    [-10, -6],
    [SCREEN_COLS * TILE + 10, -6],
    [-10, SCREEN_ROWS * TILE + 6],
    [SCREEN_COLS * TILE + 10, SCREEN_ROWS * TILE + 6],
  ]
  const near = corners[seed % 4] as [number, number]
  const far = corners[3 - (seed % 4)] as [number, number]
  const blue = { rim: '#6aa3f0', dark: '#27488f', mid: '#3f74d6', light: '#345fb8' }
  const violet = { rim: '#b48be8', dark: '#4a2a7a', mid: '#7a4fb8', light: '#5c3a99' }
  const rust = { rim: '#f0a070', dark: '#6a2a1a', mid: '#a04a2a', light: '#8a3a22' }
  const nearLook = (seed >> 4) % 2 === 0 ? blue : violet
  const farLook = (seed >> 6) % 2 === 0 ? rust : blue
  return [
    { x: near[0], y: near[1], r: 52 + (seed % 5) * 6, ...nearLook },
    // The far one sits a little in from its corner, so the whole disc shows.
    { x: far[0] + (far[0] < 0 ? 28 : -28), y: far[1] + (far[1] < 0 ? 22 : -22), r: 9 + ((seed >> 8) % 3) * 2, ...farLook },
  ]
}

/**
 * An airlock wall: thick bevelled plate, and on the faces that look into the
 * chamber the things the chamber has — yellow light strips, red readout
 * panels, vent grilles. Deliberately heavier than the hull of the decks.
 */
function airlockWall(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  col: number,
  row: number,
  p: Palette,
  screen: Screen,
  frame: number,
): void {
  const at = (c: number, r: number): string => (screen.rows[r] ?? '')[c] ?? '#'
  const open = (c: number, r: number): boolean => at(c, r) === '.' || at(c, r) === 'C'
  const facesRight = open(col + 1, row)
  const facesLeft = open(col - 1, row)
  const facesDown = open(col, row + 1)
  const facesUp = open(col, row - 1)
  const faces = facesRight || facesLeft || facesDown || facesUp

  ctx.fillStyle = p.wallDark
  ctx.fillRect(x, y, TILE, TILE)
  ctx.fillStyle = p.wall
  ctx.fillRect(x + 1, y + 1, 14, 14)
  ctx.fillStyle = p.wallLight
  ctx.fillRect(x + 1, y + 1, 14, 1)
  ctx.fillRect(x + 1, y + 1, 1, 14)
  // A bevel where the wall meets the chamber.
  ctx.fillStyle = p.wallLight
  if (facesRight) ctx.fillRect(x + 13, y, 2, TILE)
  if (facesLeft) ctx.fillRect(x + 1, y, 2, TILE)
  if (facesDown) ctx.fillRect(x, y + 13, TILE, 2)
  if (facesUp) ctx.fillRect(x, y + 1, TILE, 2)
  if (!faces) {
    // Deep in the wall: a seam and a rivet, so the mass is not flat.
    ctx.fillStyle = p.wallDark
    ctx.fillRect(x + 3, y + 12, 1, 1)
    if ((col + row) % 2 === 0) ctx.fillRect(x + 8, y + 1, 1, 14)
    return
  }

  const v = tileHash(screen, col, row) % 5
  if (v === 0 || v === 1) {
    // A yellow light strip, glowing.
    const bright = Math.floor((frame + row * 7) / 40) % 5 !== 0
    if (facesRight || facesLeft) {
      const lx = facesRight ? x + 9 : x + 4
      ctx.fillStyle = '#8a4a1a'
      ctx.fillRect(lx - 1, y + 2, 5, 12)
      ctx.fillStyle = bright ? '#f2c94c' : '#e2883a'
      ctx.fillRect(lx, y + 3, 3, 10)
      ctx.fillStyle = '#fff4c2'
      ctx.fillRect(lx + 1, y + 4, 1, 8)
    } else {
      const ly = facesDown ? y + 9 : y + 4
      ctx.fillStyle = '#8a4a1a'
      ctx.fillRect(x + 2, ly - 1, 12, 5)
      ctx.fillStyle = bright ? '#f2c94c' : '#e2883a'
      ctx.fillRect(x + 3, ly, 10, 3)
      ctx.fillStyle = '#fff4c2'
      ctx.fillRect(x + 4, ly + 1, 8, 1)
    }
    return
  }
  if (v === 2) {
    // A red readout: a dark panel with a few digits lit.
    ctx.fillStyle = '#12131a'
    ctx.fillRect(x + 3, y + 3, 10, 10)
    ctx.fillStyle = '#d5433f'
    const blink = Math.floor((frame + col * 5) / 30) % 2 === 0
    ctx.fillRect(x + 4, y + 5, 2, 2)
    ctx.fillRect(x + 8, y + 5, 3, 2)
    if (blink) ctx.fillRect(x + 4, y + 9, 3, 2)
    ctx.fillRect(x + 9, y + 9, 2, 2)
    ctx.fillStyle = '#8f2320'
    ctx.fillRect(x + 6, y + 5, 1, 2)
    return
  }
  if (v === 3) {
    // A vent grille.
    ctx.fillStyle = p.wallDark
    ctx.fillRect(x + 3, y + 4, 10, 9)
    ctx.fillStyle = p.wallLight
    ctx.fillRect(x + 4, y + 5, 8, 1)
    ctx.fillRect(x + 4, y + 8, 8, 1)
    ctx.fillRect(x + 4, y + 11, 8, 1)
    return
  }
  // Plain, riveted.
  ctx.fillStyle = p.wallDark
  ctx.fillRect(x + 4, y + 4, 1, 1)
  ctx.fillRect(x + 11, y + 11, 1, 1)
}

/** A metal gantry over the void. */
function gantry(ctx: CanvasRenderingContext2D, x: number, y: number, p: Palette): void {
  ctx.fillStyle = p.wallDark
  ctx.fillRect(x, y, TILE, TILE)
  ctx.fillStyle = p.wall
  for (let i = 0; i < 4; i++) ctx.fillRect(x, y + i * 4 + 1, TILE, 2)
  ctx.fillStyle = p.wallLight
  ctx.fillRect(x, y, 2, TILE)
  ctx.fillRect(x + TILE - 2, y, 2, TILE)
}

/** A hatch: a round door in a frame, with a light over it. Every way in and out. */
function hatch(ctx: CanvasRenderingContext2D, x: number, y: number, p: Palette, frame: number): void {
  ctx.fillStyle = p.wall
  ctx.fillRect(x, y, TILE, TILE)
  ctx.fillStyle = p.wallLight
  ctx.fillRect(x, y, TILE, 2)
  ctx.fillStyle = p.wallDark
  ctx.fillRect(x + 2, y + 3, 12, 13)
  ctx.fillStyle = '#000000'
  ctx.fillRect(x + 4, y + 5, 8, 11)
  ctx.fillRect(x + 3, y + 7, 10, 7)
  // The light over the door: green, blinking slowly, and a warning strip
  // down each side of the frame.
  ctx.fillStyle = Math.floor(frame / 30) % 2 === 0 ? '#7fbb4c' : '#4d7a2c'
  ctx.fillRect(x + 7, y + 1, 2, 1)
  const warn = Math.floor(frame / 18) % 2 === 0
  ctx.fillStyle = warn ? '#d5433f' : '#8f2320'
  ctx.fillRect(x + 1, y + 6, 1, 6)
  ctx.fillRect(x + 14, y + 6, 1, 6)
}

/** A lift hatch in the floor: the stairs down. */
function liftHatch(ctx: CanvasRenderingContext2D, x: number, y: number, p: Palette, frame: number): void {
  ctx.fillStyle = p.wallDark
  ctx.fillRect(x, y, TILE, TILE)
  ctx.fillStyle = p.wall
  ctx.fillRect(x + 1, y + 1, 14, 14)
  ctx.fillStyle = '#000000'
  ctx.fillRect(x + 3, y + 3, 10, 10)
  ctx.fillStyle = p.wallLight
  ctx.fillRect(x + 3, y + 3, 10, 1)
  ctx.fillRect(x + 3, y + 3, 1, 10)
  const on = Math.floor(frame / 20) % 2 === 0
  ctx.fillStyle = on ? '#57d2c6' : '#2a7a72'
  ctx.fillRect(x + 1, y + 7, 2, 2)
  ctx.fillRect(x + 13, y + 7, 2, 2)
}

/** A console pillar: what stands where a statue would. */
function pillar(ctx: CanvasRenderingContext2D, x: number, y: number, p: Palette, frame: number): void {
  ctx.fillStyle = p.rockDark
  ctx.fillRect(x + 3, y + 1, 10, 15)
  ctx.fillStyle = p.rock
  ctx.fillRect(x + 4, y + 2, 8, 13)
  ctx.fillStyle = p.rockLight
  ctx.fillRect(x + 4, y + 2, 8, 1)
  ctx.fillStyle = '#12131a'
  ctx.fillRect(x + 5, y + 4, 6, 4)
  ctx.fillStyle = Math.floor(frame / 24) % 2 === 0 ? '#57d2c6' : '#2a7a72'
  ctx.fillRect(x + 6, y + 5, 3, 1)
  ctx.fillRect(x + 6, y + 6, 4, 1)
  ctx.fillStyle = p.rockDark
  ctx.fillRect(x + 5, y + 10, 6, 1)
  ctx.fillRect(x + 5, y + 12, 6, 1)
}

// --- overlays -------------------------------------------------------------

/** Sealed barriers are drawn on top, so their runes shimmer. */
/**
 * Everything standing between the hero and somewhere he wants to be.
 *
 * Barriers were drawn only where the map author had typed a `=` seal tile. A
 * barrier can sit on any tile, though — a chest on the grass, a keeper in a
 * doorway — and 23 of them were painting nothing at all: the child walked onto
 * blank ground and a prompt appeared out of thin air. Now every barrier looks
 * like the thing it is.
 */
export function drawBarriers(
  ctx: CanvasRenderingContext2D,
  atlas: Atlas,
  screen: Screen,
  openedTiles: ReadonlySet<string>,
  frame: number,
): void {
  const future = isFutureTheme(themeFor(screen))
  // Seal tiles the map author placed directly, with no barrier behind them.
  for (let row = 0; row < SCREEN_ROWS; row++) {
    const line = screen.rows[row] as string
    for (let col = 0; col < SCREEN_COLS; col++) {
      if (line[col] !== '=') continue
      if (openedTiles.has(`${col},${row}`)) continue
      drawRuneSeal(ctx, atlas, col, row, frame, future)
    }
  }

  for (const placement of screen.gates ?? []) {
    const gate = gateById(placement.gateId)
    if (!gate) continue
    const open = openedTiles.has(`${placement.col},${placement.row}`)
    const x = placement.col * TILE
    const y = placement.row * TILE

    switch (gate.kind) {
      case 'chest':
        atlas.draw(ctx, open ? 'chestOpen' : 'chestClosed', x, y)
        if (!open) glint(ctx, x, y, frame)
        break

      case 'npc':
        // Someone actually standing in the way, so it reads as a person to
        // talk to rather than as thin air that shouts at you.
        if (open) break
        {
          const bob = Math.sin(frame / 26) > 0 ? 0 : 1
          // On the ship it is a droid in the way, not an old man.
          atlas.draw(ctx, future ? 'droid' : 'scribe', x, y - bob)
        }
        // A keeper covers one tile; a wide doorway needs the rest sealed, or
        // the second door looks like a way round him.
        for (const tile of placement.opens ?? []) {
          if (tile.col === placement.col && tile.row === placement.row) continue
          drawRuneSeal(ctx, atlas, tile.col, tile.row, frame, future)
        }
        break

      case 'door':
      case 'boss':
      case 'seal':
      case 'bridge':
        if (open) break
        for (const tile of placement.opens ?? [{ col: placement.col, row: placement.row }]) {
          // Skip anything the seal-tile pass above already painted.
          if ((screen.rows[tile.row] ?? '')[tile.col] === '=') continue
          drawRuneSeal(ctx, atlas, tile.col, tile.row, frame, future)
        }
        break

      // A cracked wall or a bush hiding a way through is meant to look like an
      // ordinary cracked wall or bush. Finding it is the whole point.
      case 'wall':
      // The shopkeeper is already standing at the counter.
      case 'shop':
      case 'smith':
        break
    }
  }
}

/**
 * A barrier of runes: the seal, and a slow pulse behind it. On the ship the
 * same barrier is a force field — hatched light that flickers rather than a
 * carved stone that glows.
 */
function drawRuneSeal(
  ctx: CanvasRenderingContext2D,
  atlas: Atlas,
  col: number,
  row: number,
  frame: number,
  future = false,
): void {
  if (future) {
    const flicker = Math.floor(frame / 4) % 7 === 0 ? 0.55 : 0.85
    ctx.save()
    ctx.globalAlpha = flicker
    atlas.draw(ctx, 'field', col * TILE, row * TILE)
    ctx.restore()
    ctx.save()
    ctx.globalAlpha = 0.25 + Math.sin(frame / 9 + col) * 0.15
    ctx.fillStyle = '#c8fff8'
    ctx.fillRect(col * TILE + 1, row * TILE + 1, TILE - 2, TILE - 2)
    ctx.restore()
    return
  }
  atlas.draw(ctx, 'seal', col * TILE, row * TILE)
  const glow = 0.18 + Math.sin(frame / 18 + col) * 0.12
  ctx.save()
  ctx.globalAlpha = Math.max(0, glow)
  ctx.fillStyle = '#57d2c6'
  ctx.fillRect(col * TILE + 1, row * TILE + 1, TILE - 2, TILE - 2)
  ctx.restore()
}

/** A spark travelling across a locked chest, so it catches the eye. */
function glint(ctx: CanvasRenderingContext2D, x: number, y: number, frame: number): void {
  const phase = (frame % 150) / 150
  if (phase > 0.28) return
  const travel = phase / 0.28
  ctx.save()
  ctx.globalAlpha = Math.sin(travel * Math.PI) * 0.9
  ctx.fillStyle = '#f6f3e7'
  ctx.fillRect(x + 3 + Math.round(travel * 9), y + 5, 1, 4)
  ctx.restore()
}

/**
 * A faint shimmer on the way onward, and on treasure, in a pitch-dark room.
 *
 * Drawn over the darkness rather than under it: without a candle the room is
 * black enough that a single stairway tile is unfindable, and a cave that looks
 * empty is a cave nobody goes back to. This shows that *something* is over
 * there, never what it is.
 */
export function drawGlimmers(
  ctx: CanvasRenderingContext2D,
  screen: Screen,
  frame: number,
  taken: readonly string[],
  opened: ReadonlySet<string>,
): void {
  const spots: { col: number; row: number }[] = []
  for (const portal of screen.portals ?? []) {
    // Only the way deeper in; the way out is where he came from.
    const char = (screen.rows[portal.row] ?? '')[portal.col]
    if (char === '^' || char === 'D' || char === 'C') spots.push(portal)
  }
  if (screen.treasure && !taken.includes(screen.treasure.id)) spots.push(screen.treasure)
  // A locked chest in a pitch-dark treasury is worth walking towards too.
  for (const placement of screen.gates ?? []) {
    if (gateById(placement.gateId)?.kind !== 'chest') continue
    if (opened.has(`${placement.col},${placement.row}`)) continue
    spots.push(placement)
  }

  for (const spot of spots) {
    const pulse = 0.12 + Math.sin(frame / 22 + spot.col) * 0.1
    if (pulse <= 0) continue
    ctx.save()
    ctx.globalAlpha = pulse
    ctx.fillStyle = '#c9a86a'
    ctx.beginPath()
    ctx.arc(spot.col * TILE + TILE / 2, spot.row * TILE + TILE / 2, 7, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()
  }
}

/** A dark dungeon room: only a small circle around the player is lit. */
export function drawDarkness(
  ctx: CanvasRenderingContext2D,
  centre: { x: number; y: number },
  radius: number,
  width: number,
  height: number,
): void {
  const gradient = ctx.createRadialGradient(centre.x, centre.y, radius * 0.4, centre.x, centre.y, radius)
  gradient.addColorStop(0, 'rgba(0,0,0,0)')
  gradient.addColorStop(1, 'rgba(0,0,0,0.97)')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, width, height)
}


/**
 * A villager's line, in a bubble over his head.
 *
 * It appears when the hero walks near and goes when he walks away — no button,
 * no pause, nothing to dismiss. Same palette and face as the message bar, so
 * the two read as one voice.
 */
export function drawSpeech(
  ctx: CanvasRenderingContext2D,
  at: { col: number; row: number },
  text: string,
  screenWidth: number,
): void {
  const lines = wrapSpeech(text, 30)
  const charWidth = 4.2
  const width = Math.min(
    screenWidth - 8,
    Math.max(...lines.map((line) => line.length)) * charWidth + 10,
  )
  const height = 6 + lines.length * 8
  const anchorX = at.col * TILE + TILE / 2
  // Keep the whole bubble on screen even when he is stood at the edge.
  const x = Math.max(4, Math.min(screenWidth - 4 - width, anchorX - width / 2))
  const y = Math.max(2, at.row * TILE - height - 5)

  ctx.fillStyle = 'rgba(8,10,16,0.92)'
  ctx.fillRect(x, y, width, height)
  ctx.strokeStyle = '#57d2c6'
  ctx.lineWidth = 1
  ctx.strokeRect(x + 0.5, y + 0.5, width - 1, height - 1)

  // The tail, pointing down at whoever is speaking.
  const tailX = Math.max(x + 4, Math.min(x + width - 8, anchorX - 2))
  ctx.fillStyle = 'rgba(8,10,16,0.92)'
  ctx.fillRect(tailX, y + height, 4, 3)
  ctx.fillStyle = '#57d2c6'
  ctx.fillRect(tailX + 1, y + height + 3, 2, 1)

  ctx.fillStyle = '#f6f3e7'
  ctx.font = '7px monospace'
  ctx.textBaseline = 'top'
  lines.forEach((line, i) => ctx.fillText(line, x + 5, y + 4 + i * 8))
}

/** Like the message bar's wrap, but narrower and without its four-line cap. */
function wrapSpeech(text: string, width: number): string[] {
  const lines: string[] = []
  let line = ''
  for (const word of text.split(' ')) {
    if (line.length === 0) line = word
    else if (line.length + 1 + word.length <= width) line += ` ${word}`
    else {
      lines.push(line)
      line = word
    }
  }
  if (line.length > 0) lines.push(line)
  return lines
}
