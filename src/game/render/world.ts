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

export type Theme = 'overworld' | 'dungeon' | 'cave'

interface Palette {
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

const PALETTES: Record<Theme, Palette> = {
  overworld: OVERWORLD,
  dungeon: DUNGEON,
  cave: CAVE,
}

const DUNGEON_REGIONS = ['Sunken Hall', 'Hollow Keep', 'Ember Vault', 'Sunless Spire']

/** Which look a screen wears. Derived so no screen has to say it twice. */
export function themeFor(screen: Screen): Theme {
  if (DUNGEON_REGIONS.includes(screen.region)) return 'dungeon'
  // Anywhere the sun does not reach is underground, whatever it is called.
  // Matching on the id alone once gave a cave a grass floor.
  if (screen.dark) return 'cave'
  if (screen.shop || /grotto|cave|interior|secret/.test(screen.id)) return 'cave'
  return 'overworld'
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
      let char = (line[col] ?? '.') as TileChar
      // Anything cleared — a barrier opened, a wall bombed, a bush burned —
      // becomes ordinary ground. The collision map already treats it that way,
      // so without this the tile would be walkable but still drawn as rock.
      if (openedTiles.has(`${col},${row}`)) {
        const def = TILES[char]
        if (char === '=' || def?.cracked || def?.bush) char = '.'
      }

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
  ground(ctx, x, y, col, row, p)

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

// --- pieces ---------------------------------------------------------------

function ground(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  col: number,
  row: number,
  p: Palette,
): void {
  ctx.fillStyle = p.ground
  ctx.fillRect(x, y, TILE, TILE)
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
): void {
  const above = ((screen.rows[row - 1] ?? '')[col] ?? '.') === 'R'
  const below = ((screen.rows[row + 1] ?? '')[col] ?? '.') === 'R'
  const left = (line[col - 1] ?? '.') === 'R'
  const right = (line[col + 1] ?? '.') === 'R'

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

// --- overlays -------------------------------------------------------------

/** Sealed barriers are drawn on top, so their runes shimmer. */
export function drawSeals(
  ctx: CanvasRenderingContext2D,
  atlas: Atlas,
  screen: Screen,
  openedTiles: ReadonlySet<string>,
  frame: number,
): void {
  for (let row = 0; row < SCREEN_ROWS; row++) {
    const line = screen.rows[row] as string
    for (let col = 0; col < SCREEN_COLS; col++) {
      if (line[col] !== '=') continue
      if (openedTiles.has(`${col},${row}`)) continue
      atlas.draw(ctx, 'seal', col * TILE, row * TILE)
      const glow = 0.18 + Math.sin(frame / 18 + col) * 0.12
      ctx.save()
      ctx.globalAlpha = Math.max(0, glow)
      ctx.fillStyle = '#57d2c6'
      ctx.fillRect(col * TILE + 1, row * TILE + 1, TILE - 2, TILE - 2)
      ctx.restore()
    }
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
