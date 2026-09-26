/**
 * Level 3: New York, drawn from the same sixteen letters.
 *
 * The tile characters keep their meanings — 'T' is the solid border, ',' is
 * something a tool clears, '~' is the thing you fall into, 'B' is walkable —
 * and four settings decide what they look like:
 *
 *   street    a Manhattan block: tenements and brownstones, a concrete
 *             sidewalk with a curb, an asphalt road with lane lines, zebra
 *             crosswalks, trash bags, hydrants, subway stairs with the green
 *             globe lamp that means "open".
 *   park      Washington Square, Tompkins Square: grass, hexagonal pavers,
 *             iron railings, a fountain, an arch you walk under.
 *   platform  a subway station: white tile walls with a coloured mosaic band,
 *             green steel columns, a concrete platform with a yellow edge,
 *             the track pit with its rails, and a train standing at it.
 *   train     inside the car: stainless walls, orange and yellow bucket
 *             seats, poles, the tunnel flashing past the windows.
 *
 * Same sixteen-pixel, outlined, flat-colour way as the land and the ship, so
 * the three worlds read as one game. Nothing here is traced from anywhere.
 */
import { TILE, type TileChar } from '../world/tiles'
import type { Screen } from '../world/screens'
import { bush, caveMouth, cliff, tileHash, tree, water, type Palette, type Theme } from './world'

export type CityTheme = 'street' | 'park' | 'platform' | 'train'

const CITY_THEMES: readonly Theme[] = ['street', 'park', 'platform', 'train']

export function isCityTheme(theme: Theme): theme is CityTheme {
  return CITY_THEMES.includes(theme)
}

/**
 * The palettes. The field names are the land's — `leaf`, `rock`, `water` —
 * and what they colour here is written beside each one, because a reader who
 * sees `p.water` painting asphalt deserves to be told why.
 */
const STREET: Palette = {
  ground: '#b7b3a8', // sidewalk concrete
  groundSpeckle: '#9e9a8f', // slab seams, gum, grates
  wall: '#a4543b', // tenement brick
  wallLight: '#c77a5e',
  wallDark: '#5c2b1e',
  rock: '#7a6154', // brownstone
  rockLight: '#9b8272',
  rockDark: '#44342b',
  water: '#3a3b41', // asphalt
  waterLight: '#4b4c53',
  path: '#ece9df', // crosswalk paint
  pathEdge: '#3a3b41',
  leaf: '#2f7a3c', // the street trees
  leafLight: '#49a95a',
  leafDark: '#1f5c26',
  trunk: '#5a3a1b',
}

const PARK: Palette = {
  ground: '#4f9f47', // lawn
  groundSpeckle: '#43903d',
  wall: '#23242a', // iron railings
  wallLight: '#4a4c55',
  wallDark: '#0f1013',
  rock: '#a89f8f', // stone — the fountain rim, statue bases
  rockLight: '#cfc6b4',
  rockDark: '#6c655a',
  water: '#2f6fd0', // the fountain
  waterLight: '#4a8ae8',
  path: '#a49a94', // hexagonal pavers
  pathEdge: '#7e746e',
  leaf: '#2e7a3a',
  leafLight: '#4aa958',
  leafDark: '#1d5824',
  trunk: '#5a3a1b',
}

const PLATFORM: Palette = {
  ground: '#8d8b84', // platform concrete
  groundSpeckle: '#76746d',
  wall: '#e6e2d6', // white wall tile
  wallLight: '#f6f3ec',
  wallDark: '#b7b2a4', // grout
  rock: '#2f6b46', // the green steel columns
  rockLight: '#4d9066',
  rockDark: '#1b4229',
  water: '#17171b', // the track pit
  waterLight: '#2c2b31',
  path: '#f2c12e', // the yellow edge
  pathEdge: '#8a6d10',
  leaf: '#0039a6', // the mosaic band — A/C/E blue at West 4th
  leafLight: '#3a66c8',
  leafDark: '#1f2a44',
  trunk: '#9a978c', // rails
}

const TRAIN: Palette = {
  ground: '#a7a398', // the car floor
  groundSpeckle: '#8f8b80',
  wall: '#c6c8c4', // stainless steel
  wallLight: '#e3e5e1',
  wallDark: '#767974',
  rock: '#e0862c', // orange bucket seats
  rockLight: '#f2a24f',
  rockDark: '#9c5514',
  water: '#0d0d14', // the tunnel outside
  waterLight: '#2b2b45',
  path: '#f2c12e', // the yellow seats
  pathEdge: '#b08a12',
  leaf: '#0039a6', // the route bullet on the wall
  leafLight: '#3a66c8',
  leafDark: '#12131a',
  trunk: '#d9dbd7', // the poles
}

export const CITY_PALETTES: Record<CityTheme, Palette> = {
  street: STREET,
  park: PARK,
  platform: PLATFORM,
  train: TRAIN,
}

const at = (screen: Screen, col: number, row: number): string =>
  (screen.rows[row] ?? '')[col] ?? '#'

export function drawCityTile(
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
  switch (theme) {
    case 'street':
      return streetTile(ctx, char, x, y, col, row, p, frame, line, screen)
    case 'park':
      return parkTile(ctx, char, x, y, col, row, p, frame, line, screen)
    case 'platform':
      return platformTile(ctx, char, x, y, col, row, p, frame, screen)
    case 'train':
      return trainTile(ctx, char, x, y, col, row, p, frame, screen)
    default:
      return
  }
}

/** Anything painted over several tiles at once. */
export function drawCityOverlay(
  ctx: CanvasRenderingContext2D,
  screen: Screen,
  theme: Theme,
  frame: number,
): void {
  if (theme === 'platform') mosaicName(ctx, screen)
  void frame
}

// ======================================================================
// The street
// ======================================================================

function streetTile(
  ctx: CanvasRenderingContext2D,
  char: TileChar,
  x: number,
  y: number,
  col: number,
  row: number,
  p: Palette,
  frame: number,
  line: string,
  screen: Screen,
): void {
  switch (char) {
    case '.':
      return sidewalk(ctx, x, y, col, row, p, screen)
    case 'B':
      return road(ctx, x, y, col, row, p, screen)
    case 'S':
      return crosswalk(ctx, x, y, col, row, p, screen)
    case 'T':
      return tenement(ctx, x, y, col, row, p, screen)
    case '#':
      return brownstone(ctx, x, y, col, row, p, screen)
    case 'R':
      return jerseyBarrier(ctx, x, y, col, row, p, line, screen)
    case ',':
      sidewalk(ctx, x, y, col, row, p, screen)
      return trashBags(ctx, x, y, col, row, screen)
    case 'p':
      sidewalk(ctx, x, y, col, row, p, screen)
      trashBags(ctx, x, y, col, row, screen)
      ctx.fillStyle = '#57d2c6'
      ctx.fillRect(x + 11, y + 12, 2, 2)
      return
    case '*':
      sidewalk(ctx, x, y, col, row, p, screen)
      return hydrant(ctx, x, y)
    case '^':
      sidewalk(ctx, x, y, col, row, p, screen)
      return subwayStairs(ctx, x, y, frame)
    case 'H':
      return shopfront(ctx, x, y, col, row, p, screen)
    case 'D':
    case 'C':
      return alley(ctx, x, y, p)
    case 'X':
      return boardedDoor(ctx, x, y, p)
    case '~':
      return water(ctx, x, y, col, row, frame, p, line, screen)
    case '=':
      return sidewalk(ctx, x, y, col, row, p, screen)
    case 'A':
      return sidewalk(ctx, x, y, col, row, p, screen)
  }
}

/**
 * Concrete slabs with a seam between each, a curb wherever the sidewalk meets
 * the road, and every so often a grate or a manhole so a long block is not a
 * grey field.
 */
function sidewalk(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  col: number,
  row: number,
  p: Palette,
  screen: Screen,
): void {
  ctx.fillStyle = p.ground
  ctx.fillRect(x, y, TILE, TILE)
  ctx.fillStyle = p.groundSpeckle
  ctx.fillRect(x, y + TILE - 1, TILE, 1)
  ctx.fillRect(x + TILE - 1, y, 1, TILE)

  const v = tileHash(screen, col, row) % 19
  if (v === 0) {
    // A sidewalk grate: a steel frame with dark slots.
    ctx.fillStyle = '#5c5a55'
    ctx.fillRect(x + 3, y + 3, 10, 10)
    ctx.fillStyle = '#26252a'
    for (let i = 0; i < 4; i++) ctx.fillRect(x + 4, y + 4 + i * 2 + (i > 0 ? i - 1 : 0), 8, 1)
  } else if (v === 1) {
    // A manhole cover.
    ctx.fillStyle = '#5c5a55'
    ctx.fillRect(x + 4, y + 3, 8, 10)
    ctx.fillRect(x + 3, y + 4, 10, 8)
    ctx.fillStyle = '#7b7972'
    ctx.fillRect(x + 5, y + 5, 3, 1)
    ctx.fillRect(x + 6, y + 8, 4, 1)
  } else if (v === 2 || v === 3) {
    // A crack, or a flattened piece of gum.
    ctx.fillStyle = p.groundSpeckle
    ctx.fillRect(x + 6, y + 4, 1, 5)
    ctx.fillRect(x + 7, y + 8, 1, 3)
  } else if (v === 4) {
    ctx.fillStyle = '#2a2a2e'
    ctx.fillRect(x + 9, y + 10, 2, 2)
  }

  // The curb: a darker lip wherever the road is next door.
  ctx.fillStyle = '#6d6a62'
  if (at(screen, col, row + 1) === 'B') ctx.fillRect(x, y + TILE - 2, TILE, 2)
  if (at(screen, col, row - 1) === 'B') ctx.fillRect(x, y, TILE, 2)
  if (at(screen, col + 1, row) === 'B') ctx.fillRect(x + TILE - 2, y, 2, TILE)
  if (at(screen, col - 1, row) === 'B') ctx.fillRect(x, y, 2, TILE)
}

/**
 * Asphalt. A road is a run of these rows; the line between the two middle
 * lanes is a double yellow, and every other lane line is a dashed white.
 * Worked out per tile from what is above and below, so a two-lane street and
 * a four-lane avenue both come out right from the same letter.
 */
function road(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  col: number,
  row: number,
  p: Palette,
  screen: Screen,
): void {
  ctx.fillStyle = p.water
  ctx.fillRect(x, y, TILE, TILE)
  // Worn patches.
  ctx.fillStyle = p.waterLight
  const v = tileHash(screen, col, row) % 7
  if (v === 0) ctx.fillRect(x + 3, y + 9, 5, 2)
  if (v === 1) ctx.fillRect(x + 10, y + 3, 3, 3)

  const isRoad = (c: number, r: number): boolean => 'BS'.includes(at(screen, c, r))
  // How many road rows are above this one, and how many in the whole run.
  let above = 0
  while (isRoad(col, row - above - 1)) above += 1
  let below = 0
  while (isRoad(col, row + below + 1)) below += 1
  const lanes = above + below + 1
  const lane = above

  // The line on the lower edge of this lane, if there is a lane under it.
  if (lane < lanes - 1) {
    if (lanes % 2 === 0 && lane === lanes / 2 - 1) {
      ctx.fillStyle = '#e8b62a'
      ctx.fillRect(x, y + TILE - 2, TILE, 1)
      ctx.fillRect(x, y + TILE - 4, TILE, 1)
    } else {
      ctx.fillStyle = '#d8d5c8'
      ctx.fillRect(x + 2, y + TILE - 2, 6, 1)
    }
  }
}

/** Zebra bars, laid across the road the way the city paints them. */
function crosswalk(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  col: number,
  row: number,
  p: Palette,
  screen: Screen,
): void {
  road(ctx, x, y, col, row, p, screen)
  ctx.fillStyle = p.path
  ctx.fillRect(x + 1, y + 2, 14, 3)
  ctx.fillRect(x + 1, y + 7, 14, 3)
  ctx.fillRect(x + 1, y + 12, 14, 3)
}

/**
 * A tenement: brick, two windows to a tile, a fire escape zigzagging down some
 * columns, a cornice along the top and a stoop at street level. Every T on a
 * street screen is a piece of a building, and the pieces have to tile.
 */
function tenement(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  col: number,
  row: number,
  p: Palette,
  screen: Screen,
): void {
  brickwork(ctx, x, y, col, row, p)
  const top = at(screen, col, row - 1) !== 'T'
  const bottom = !'T#'.includes(at(screen, col, row + 1))
  const h = tileHash(screen, col, row)

  if (top) {
    // The cornice: a pale ledge with dentils under it.
    ctx.fillStyle = '#d9cbb3'
    ctx.fillRect(x, y, TILE, 2)
    ctx.fillStyle = '#8f7f68'
    for (let i = 0; i < 4; i++) ctx.fillRect(x + 1 + i * 4, y + 2, 2, 1)
  }

  if (bottom && h % 3 === 0) {
    // A stoop: brown steps down to the sidewalk, and a door above them.
    ctx.fillStyle = '#2b1d14'
    ctx.fillRect(x + 5, y + 3, 6, 8)
    ctx.fillStyle = '#7a5a3a'
    ctx.fillRect(x + 4, y + 11, 8, 2)
    ctx.fillRect(x + 3, y + 13, 10, 2)
    ctx.fillStyle = '#a07a50'
    ctx.fillRect(x + 4, y + 11, 8, 1)
    ctx.fillRect(x + 3, y + 13, 10, 1)
    return
  }

  // Two windows, lit or dark.
  const lit = h % 5 === 0
  windowPair(ctx, x, y + (top ? 1 : 0), lit)

  // A fire escape down every sixth column: two rails and a landing, and the
  // ladder only where there is a floor below to reach.
  if (col % 6 === 2 && !bottom) {
    ctx.fillStyle = '#1b1b20'
    ctx.fillRect(x + 2, y + 13, 12, 1)
    ctx.fillRect(x + 2, y + 8, 1, 6)
    ctx.fillRect(x + 13, y + 8, 1, 6)
    ctx.fillRect(x + 2, y + 10, 12, 1)
  }
}

function brickwork(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  col: number,
  row: number,
  p: Palette,
): void {
  ctx.fillStyle = p.wall
  ctx.fillRect(x, y, TILE, TILE)
  // Courses of brick: mortar lines every four rows, joints staggered.
  ctx.fillStyle = p.wallDark
  for (let r = 3; r < TILE; r += 4) ctx.fillRect(x, y + r, TILE, 1)
  for (let r = 0; r < 4; r++) {
    const off = (r % 2 === 0 ? 0 : 4) + ((col + row) % 2) * 2
    ctx.fillRect(x + off, y + r * 4, 1, 3)
    ctx.fillRect(x + off + 8, y + r * 4, 1, 3)
  }
  ctx.fillStyle = p.wallLight
  ctx.fillRect(x + 2, y + 1, 3, 1)
  ctx.fillRect(x + 10, y + 9, 3, 1)
}

function windowPair(ctx: CanvasRenderingContext2D, x: number, y: number, lit: boolean): void {
  for (const wx of [2, 9]) {
    ctx.fillStyle = '#12131a'
    ctx.fillRect(x + wx, y + 3, 5, 8)
    ctx.fillStyle = lit ? '#f2c94c' : '#26304a'
    ctx.fillRect(x + wx + 1, y + 4, 3, 6)
    ctx.fillStyle = lit ? '#b98d1e' : '#12131a'
    ctx.fillRect(x + wx + 1, y + 7, 3, 1)
    // The sill.
    ctx.fillStyle = '#d9cbb3'
    ctx.fillRect(x + wx - 1, y + 11, 7, 1)
  }
}

/** A brownstone: the same shape as a tenement, in warmer stone. */
function brownstone(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  col: number,
  row: number,
  p: Palette,
  screen: Screen,
): void {
  ctx.fillStyle = p.rock
  ctx.fillRect(x, y, TILE, TILE)
  ctx.fillStyle = p.rockDark
  ctx.fillRect(x, y + 7, TILE, 1)
  ctx.fillRect(x, y + 15, TILE, 1)
  ctx.fillRect(x + ((col + row) % 2 === 0 ? 5 : 11), y, 1, 7)
  ctx.fillStyle = p.rockLight
  ctx.fillRect(x + 1, y + 1, 4, 1)
  const top = at(screen, col, row - 1) !== '#'
  if (top) {
    ctx.fillStyle = '#c9b89c'
    ctx.fillRect(x, y, TILE, 2)
  }
  const h = tileHash(screen, col, row)
  // Tall arched windows, one to a tile.
  ctx.fillStyle = '#12131a'
  ctx.fillRect(x + 5, y + 4, 6, 9)
  ctx.fillRect(x + 6, y + 3, 4, 1)
  ctx.fillStyle = h % 4 === 0 ? '#f2c94c' : '#2a3352'
  ctx.fillRect(x + 6, y + 5, 4, 7)
  ctx.fillStyle = '#12131a'
  ctx.fillRect(x + 8, y + 5, 1, 7)
}

/** A concrete barrier, for the edge of a construction site or a bridge. */
function jerseyBarrier(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  col: number,
  row: number,
  p: Palette,
  line: string,
  screen: Screen,
): void {
  cliff(ctx, x, y, col, row, { ...p, rock: '#9d9a90', rockLight: '#c5c2b7', rockDark: '#5f5c54' }, line, screen)
  // An orange stripe, so it reads as a barrier and not a rock.
  ctx.fillStyle = '#e2883a'
  ctx.fillRect(x + 3, y + 6, TILE - 6, 3)
}

/** Black bags in a heap at the curb. Slash them: sometimes there is something in one. */
function trashBags(ctx: CanvasRenderingContext2D, x: number, y: number, col: number, row: number, screen: Screen): void {
  const h = tileHash(screen, col, row)
  ctx.fillStyle = '#16161b'
  ctx.fillRect(x + 2, y + 7, 7, 7)
  ctx.fillRect(x + 7, y + 5, 7, 9)
  ctx.fillRect(x + 4, y + 4, 4, 3)
  ctx.fillStyle = '#34343d'
  ctx.fillRect(x + 3, y + 8, 2, 2)
  ctx.fillRect(x + 9, y + 6, 3, 2)
  ctx.fillStyle = '#0a0a0d'
  ctx.fillRect(x + 2, y + 13, 12, 1)
  // A knotted top on one of them.
  ctx.fillStyle = '#4a4a55'
  ctx.fillRect(x + (h % 2 === 0 ? 5 : 10), y + 3, 2, 2)
}

/** A hydrant: squat, red, with a cap on each side. */
function hydrant(ctx: CanvasRenderingContext2D, x: number, y: number): void {
  ctx.fillStyle = '#12131a'
  ctx.fillRect(x + 5, y + 3, 6, 12)
  ctx.fillRect(x + 3, y + 7, 10, 3)
  ctx.fillStyle = '#d5433f'
  ctx.fillRect(x + 6, y + 4, 4, 10)
  ctx.fillRect(x + 4, y + 8, 8, 1)
  ctx.fillStyle = '#f08a86'
  ctx.fillRect(x + 6, y + 4, 2, 2)
  ctx.fillStyle = '#8f2320'
  ctx.fillRect(x + 6, y + 12, 4, 2)
  ctx.fillStyle = '#c8d0da'
  ctx.fillRect(x + 7, y + 2, 2, 1)
}

/**
 * The way down. Steps disappearing into the dark, a railing either side, and
 * the green globe on its post — the lamp that means this entrance is open.
 * (A red globe would mean exit only, and there will be some of those.)
 */
function subwayStairs(ctx: CanvasRenderingContext2D, x: number, y: number, frame: number): void {
  ctx.fillStyle = '#0d0d12'
  ctx.fillRect(x + 3, y + 3, 10, 13)
  ctx.fillStyle = '#5a5a63'
  ctx.fillRect(x + 4, y + 4, 8, 1)
  ctx.fillRect(x + 4, y + 7, 8, 1)
  ctx.fillRect(x + 4, y + 10, 8, 1)
  ctx.fillStyle = '#2f6b46'
  ctx.fillRect(x + 2, y + 2, 1, 14)
  ctx.fillRect(x + 13, y + 2, 1, 14)
  ctx.fillRect(x + 2, y + 2, 12, 1)
  // The globe, glowing a little.
  const glow = Math.floor(frame / 30) % 2 === 0
  ctx.fillStyle = '#1b4229'
  ctx.fillRect(x + 13, y + 0, 1, 3)
  ctx.fillStyle = glow ? '#5fd67c' : '#3fb85f'
  ctx.fillRect(x + 12, y - 2 + 2, 3, 3)
  ctx.fillStyle = '#b8ffcb'
  ctx.fillRect(x + 12, y + 0, 1, 1)
}

/** A shop door under a striped awning. The colour of the awning is the shop's. */
function shopfront(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  col: number,
  row: number,
  p: Palette,
  screen: Screen,
): void {
  brickwork(ctx, x, y, col, row, p)
  const awnings = ['#d5433f', '#2f7a3c', '#3f74d6', '#e2883a']
  const colour = awnings[tileHash(screen, col, row) % awnings.length] as string
  ctx.fillStyle = colour
  ctx.fillRect(x, y + 1, TILE, 4)
  ctx.fillStyle = '#f6f3e7'
  for (let i = 0; i < 4; i++) ctx.fillRect(x + 1 + i * 4, y + 1, 2, 4)
  ctx.fillStyle = '#12131a'
  ctx.fillRect(x, y + 5, TILE, 1)
  // The door, with a glass panel and a light on inside.
  ctx.fillStyle = '#3a2416'
  ctx.fillRect(x + 3, y + 6, 10, 10)
  ctx.fillStyle = '#f2c94c'
  ctx.fillRect(x + 5, y + 7, 6, 5)
  ctx.fillStyle = '#12131a'
  ctx.fillRect(x + 7, y + 7, 1, 5)
  ctx.fillRect(x + 5, y + 13, 6, 3)
}

/** A gap between buildings, dark all the way back. */
function alley(ctx: CanvasRenderingContext2D, x: number, y: number, p: Palette): void {
  ctx.fillStyle = p.wallDark
  ctx.fillRect(x, y, TILE, TILE)
  ctx.fillStyle = '#000000'
  ctx.fillRect(x + 3, y, 10, TILE)
  ctx.fillStyle = '#2a2a30'
  ctx.fillRect(x + 4, y + 12, 8, 1)
  ctx.fillRect(x + 5, y + 14, 6, 1)
}

/** Plywood over a doorway, with the corner of a poster still on it. */
function boardedDoor(ctx: CanvasRenderingContext2D, x: number, y: number, p: Palette): void {
  ctx.fillStyle = p.wallDark
  ctx.fillRect(x, y, TILE, TILE)
  ctx.fillStyle = '#b8945a'
  ctx.fillRect(x + 2, y + 2, 12, 13)
  ctx.fillStyle = '#8a6a3a'
  ctx.fillRect(x + 2, y + 8, 12, 1)
  ctx.fillRect(x + 8, y + 2, 1, 13)
  ctx.fillStyle = '#d5433f'
  ctx.fillRect(x + 9, y + 3, 4, 4)
  ctx.fillStyle = '#f6f3e7'
  ctx.fillRect(x + 10, y + 4, 2, 1)
  ctx.fillStyle = '#12131a'
  ctx.fillRect(x + 3, y + 3, 1, 1)
  ctx.fillRect(x + 12, y + 13, 1, 1)
}

// ======================================================================
// The park
// ======================================================================

function parkTile(
  ctx: CanvasRenderingContext2D,
  char: TileChar,
  x: number,
  y: number,
  col: number,
  row: number,
  p: Palette,
  frame: number,
  line: string,
  screen: Screen,
): void {
  lawn(ctx, x, y, col, row, p)
  switch (char) {
    case '.':
      return
    case 'S':
      return pavers(ctx, x, y, col, row, p)
    case 'B':
      return pavers(ctx, x, y, col, row, p)
    case ',':
      return bush(ctx, x, y, p)
    case 'T':
      return tree(ctx, x, y, p)
    case 'p':
      tree(ctx, x, y, p)
      ctx.fillStyle = '#2a2f3d'
      ctx.fillRect(x + 6, y + 10, 4, 5)
      ctx.fillStyle = '#57d2c6'
      ctx.fillRect(x + 7, y + 11, 2, 2)
      return
    case '#':
      return railing(ctx, x, y, col, row, p, screen)
    case 'R':
      return cliff(ctx, x, y, col, row, p, line, screen)
    case '~':
      return fountain(ctx, x, y, col, row, frame, p, line, screen)
    case '*':
      return marblePillar(ctx, x, y, p)
    case 'A':
      return archSpan(ctx, x, y, col, row, p, screen)
    case '^':
      pavers(ctx, x, y, col, row, p)
      return subwayStairs(ctx, x, y, frame)
    case 'H':
      return shopfront(ctx, x, y, col, row, STREET, screen)
    case 'D':
    case 'C':
      return caveMouth(ctx, x, y, p)
    case 'X':
      return boardedDoor(ctx, x, y, p)
    case '=':
      return
  }
}

function lawn(ctx: CanvasRenderingContext2D, x: number, y: number, col: number, row: number, p: Palette): void {
  ctx.fillStyle = p.ground
  ctx.fillRect(x, y, TILE, TILE)
  ctx.fillStyle = p.groundSpeckle
  if ((col * 7 + row * 13) % 5 === 0) ctx.fillRect(x + 4, y + 5, 2, 2)
  if ((col * 3 + row * 5) % 7 === 0) ctx.fillRect(x + 10, y + 11, 2, 2)
}

/** The hexagonal pavers every Manhattan park path is laid in. */
function pavers(ctx: CanvasRenderingContext2D, x: number, y: number, col: number, row: number, p: Palette): void {
  ctx.fillStyle = p.path
  ctx.fillRect(x, y, TILE, TILE)
  ctx.fillStyle = p.pathEdge
  // Two staggered rows of hexagons, drawn as their outlines.
  for (let r = 0; r < 2; r++) {
    const off = r === 0 ? 0 : 4
    for (let c = -1; c < 3; c++) {
      const hx = x + off + c * 8
      const hy = y + r * 8
      ctx.fillRect(hx + 2, hy, 4, 1)
      ctx.fillRect(hx, hy + 2, 1, 4)
      ctx.fillRect(hx + 7, hy + 2, 1, 4)
      ctx.fillRect(hx + 2, hy + 7, 4, 1)
    }
  }
  void col
  void row
}

/** Iron railings on a low stone base — the fence round every square. */
function railing(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  col: number,
  row: number,
  p: Palette,
  screen: Screen,
): void {
  const vertical = at(screen, col, row - 1) === '#' || at(screen, col, row + 1) === '#'
  const horizontal = at(screen, col - 1, row) === '#' || at(screen, col + 1, row) === '#'
  ctx.fillStyle = p.wall
  if (horizontal || !vertical) {
    // Bars standing on a base rail, spear points on top.
    ctx.fillRect(x, y + 12, TILE, 2)
    ctx.fillRect(x, y + 5, TILE, 1)
    for (let i = 1; i < TILE; i += 3) {
      ctx.fillRect(x + i, y + 3, 1, 10)
      ctx.fillStyle = p.wallLight
      ctx.fillRect(x + i, y + 2, 1, 1)
      ctx.fillStyle = p.wall
    }
  } else {
    ctx.fillRect(x + 7, y, 2, TILE)
    ctx.fillRect(x + 5, y, 1, TILE)
    ctx.fillRect(x + 10, y, 1, TILE)
    ctx.fillStyle = p.wallLight
    ctx.fillRect(x + 7, y + 4, 2, 1)
    ctx.fillRect(x + 7, y + 11, 2, 1)
  }
}

function fountain(
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
  water(ctx, x, y, col, row, frame, p, line, screen)
  // The rim, in stone, wherever the water stops.
  const isWater = (c: number, r: number): boolean => at(screen, c, r) === '~'
  ctx.fillStyle = p.rockLight
  if (!isWater(col, row - 1)) ctx.fillRect(x, y, TILE, 2)
  if (!isWater(col, row + 1)) ctx.fillRect(x, y + TILE - 2, TILE, 2)
  if (!isWater(col - 1, row)) ctx.fillRect(x, y, 2, TILE)
  if (!isWater(col + 1, row)) ctx.fillRect(x + TILE - 2, y, 2, TILE)
  // The jet, in the middle of a run.
  if (isWater(col, row - 1) && isWater(col, row + 1) && isWater(col - 1, row) && isWater(col + 1, row)) {
    const rise = Math.floor(frame / 8) % 3
    ctx.fillStyle = '#f6f3e7'
    ctx.fillRect(x + 7, y + 3 - rise, 2, 6 + rise)
    ctx.fillRect(x + 5, y + 9, 6, 1)
  }
}

/** A white marble pillar: the legs of the arch, the base of a statue. */
function marblePillar(ctx: CanvasRenderingContext2D, x: number, y: number, p: Palette): void {
  ctx.fillStyle = '#8f877a'
  ctx.fillRect(x + 2, y, 12, TILE)
  ctx.fillStyle = '#e8e4d8'
  ctx.fillRect(x + 3, y, 10, TILE)
  ctx.fillStyle = '#f6f3ec'
  ctx.fillRect(x + 4, y, 2, TILE)
  ctx.fillStyle = '#c9c2ad'
  ctx.fillRect(x + 3, y + 4, 10, 1)
  ctx.fillRect(x + 3, y + 11, 10, 1)
  void p
}

/**
 * The span of the arch, drawn overhead. He walks under it: the ground shows
 * through below the keystone, and the marble is the top half of the tile.
 */
function archSpan(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  col: number,
  row: number,
  p: Palette,
  screen: Screen,
): void {
  pavers(ctx, x, y, col, row, p)
  ctx.fillStyle = '#8f877a'
  ctx.fillRect(x, y, TILE, 8)
  ctx.fillStyle = '#e8e4d8'
  ctx.fillRect(x, y, TILE, 6)
  ctx.fillStyle = '#f6f3ec'
  ctx.fillRect(x, y, TILE, 1)
  // The curve of the arch, cut out of the underside.
  ctx.fillStyle = p.path
  ctx.fillRect(x + 2, y + 7, 12, 1)
  ctx.fillRect(x + 4, y + 6, 8, 1)
  // The keystone.
  ctx.fillStyle = '#c9c2ad'
  ctx.fillRect(x + 7, y + 1, 2, 5)
  void screen
}

// ======================================================================
// The platform
// ======================================================================

function platformTile(
  ctx: CanvasRenderingContext2D,
  char: TileChar,
  x: number,
  y: number,
  col: number,
  row: number,
  p: Palette,
  frame: number,
  screen: Screen,
): void {
  switch (char) {
    case '.':
      return platformFloor(ctx, x, y, col, row, p, screen)
    case 'S':
      platformFloor(ctx, x, y, col, row, p, screen)
      return tactileStrip(ctx, x, y, p)
    case '#':
      return tiledWall(ctx, x, y, col, row, p, screen)
    case 'T':
      return tiledWall(ctx, x, y, col, row, p, screen)
    case 'R':
    case '*':
      platformFloor(ctx, x, y, col, row, p, screen)
      return steelColumn(ctx, x, y, col, row, p, screen)
    case '~':
      return tracks(ctx, x, y, col, row, p, frame, screen)
    case 'B':
      return trainCar(ctx, x, y, col, row, p, frame, screen)
    case ',':
      platformFloor(ctx, x, y, col, row, p, screen)
      return trashBags(ctx, x, y, col, row, screen)
    case 'p':
      platformFloor(ctx, x, y, col, row, p, screen)
      trashBags(ctx, x, y, col, row, screen)
      ctx.fillStyle = '#57d2c6'
      ctx.fillRect(x + 11, y + 12, 2, 2)
      return
    case '^':
      return stairsUp(ctx, x, y, p)
    case 'H':
      platformFloor(ctx, x, y, col, row, p, screen)
      return turnstile(ctx, x, y)
    case 'D':
    case 'C':
      return tunnelMouth(ctx, x, y, col, row, p, frame, screen)
    case 'X':
      return boardedDoor(ctx, x, y, p)
    case '=':
      return platformFloor(ctx, x, y, col, row, p, screen)
    case 'A':
      return platformFloor(ctx, x, y, col, row, p, screen)
  }
}

/** Concrete, and a yellow edge with a dark lip wherever it drops to the track. */
function platformFloor(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  col: number,
  row: number,
  p: Palette,
  screen: Screen,
): void {
  ctx.fillStyle = p.ground
  ctx.fillRect(x, y, TILE, TILE)
  ctx.fillStyle = p.groundSpeckle
  if ((col * 7 + row * 13) % 6 === 0) ctx.fillRect(x + 4, y + 5, 2, 1)
  if ((col * 3 + row * 5) % 7 === 0) ctx.fillRect(x + 10, y + 11, 1, 2)
  // Expansion joints.
  if (col % 2 === 0) ctx.fillRect(x, y, 1, TILE)

  const edge = (c: number, r: number): boolean => 'B~'.includes(at(screen, c, r))
  if (edge(col, row + 1)) {
    ctx.fillStyle = p.path
    ctx.fillRect(x, y + TILE - 4, TILE, 3)
    ctx.fillStyle = p.pathEdge
    ctx.fillRect(x, y + TILE - 1, TILE, 1)
    ctx.fillStyle = p.groundSpeckle
    for (let i = 1; i < TILE; i += 4) ctx.fillRect(x + i, y + TILE - 3, 1, 1)
  }
  if (edge(col, row - 1)) {
    ctx.fillStyle = p.pathEdge
    ctx.fillRect(x, y, TILE, 1)
    ctx.fillStyle = p.path
    ctx.fillRect(x, y + 1, TILE, 3)
    ctx.fillStyle = p.groundSpeckle
    for (let i = 1; i < TILE; i += 4) ctx.fillRect(x + i, y + 2, 1, 1)
  }
}

/** The bumpy yellow strip, for the blind and for the child who reads it as "edge". */
function tactileStrip(ctx: CanvasRenderingContext2D, x: number, y: number, p: Palette): void {
  ctx.fillStyle = p.path
  ctx.fillRect(x, y + 2, TILE, 12)
  ctx.fillStyle = p.pathEdge
  for (let r = 4; r < 14; r += 4) for (let c = 2; c < TILE; c += 4) ctx.fillRect(x + c, y + r, 1, 1)
}

/**
 * White wall tile with grout, and — along the top of the wall — the coloured
 * band with a dark border that every station carries its name in.
 */
function tiledWall(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  col: number,
  row: number,
  p: Palette,
  screen: Screen,
): void {
  ctx.fillStyle = p.wallDark
  ctx.fillRect(x, y, TILE, TILE)
  ctx.fillStyle = p.wall
  for (let r = 0; r < 4; r++) {
    const off = r % 2 === 0 ? 0 : 2
    for (let c = -1; c < 4; c++) {
      const tx = x + off + c * 4
      ctx.fillRect(Math.max(tx, x), y + r * 4, Math.min(3, x + TILE - Math.max(tx, x)), 3)
    }
  }
  ctx.fillStyle = p.wallLight
  ctx.fillRect(x + 1, y + 1, 1, 1)
  ctx.fillRect(x + 9, y + 9, 1, 1)

  // The band: on the top course of any wall that has floor under it.
  if (bandHere(screen, col, row)) {
    ctx.fillStyle = p.leafDark
    ctx.fillRect(x, y + 4, TILE, 8)
    ctx.fillStyle = p.leaf
    ctx.fillRect(x, y + 5, TILE, 6)
    ctx.fillStyle = p.leafLight
    ctx.fillRect(x + (col % 2 === 0 ? 3 : 11), y + 6, 1, 1)
  }
}

/** The band runs along the lowest wall tile of the wall above the platform. */
function bandHere(screen: Screen, col: number, row: number): boolean {
  const below = at(screen, col, row + 1)
  return '#T'.includes(at(screen, col, row)) && !'#T'.includes(below) && row < 3
}

/** The station's name, in the band, in white mosaic capitals. */
function mosaicName(ctx: CanvasRenderingContext2D, screen: Screen): void {
  // Find the widest run of band tiles on the top rows.
  let best: { row: number; start: number; length: number } | undefined
  for (let row = 0; row < 3; row++) {
    let start = -1
    for (let col = 0; col <= 16; col++) {
      const band = col < 16 && bandHere(screen, col, row)
      if (band && start < 0) start = col
      if (!band && start >= 0) {
        const length = col - start
        if (!best || length > best.length) best = { row, start, length }
        start = -1
      }
    }
  }
  if (!best || best.length < 4) return
  const name = (screen.mosaic ?? screen.name).toUpperCase()
  ctx.font = '7px monospace'
  ctx.textBaseline = 'top'
  const width = name.length * 4.2
  const x = best.start * TILE + (best.length * TILE - width) / 2
  const y = best.row * TILE + 5
  ctx.fillStyle = '#12131a'
  ctx.fillText(name, x + 1, y + 1)
  ctx.fillStyle = '#f6f3ec'
  ctx.fillText(name, x, y)
}

/** The green-painted steel columns that hold the street up. */
function steelColumn(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  col: number,
  row: number,
  p: Palette,
  screen: Screen,
): void {
  const above = 'R*'.includes(at(screen, col, row - 1))
  const below = 'R*'.includes(at(screen, col, row + 1))
  ctx.fillStyle = p.rockDark
  ctx.fillRect(x + 4, y, 8, TILE)
  ctx.fillStyle = p.rock
  ctx.fillRect(x + 5, y, 6, TILE)
  ctx.fillStyle = p.rockLight
  ctx.fillRect(x + 5, y, 2, TILE)
  // Rivets down the flange.
  ctx.fillStyle = p.rockDark
  ctx.fillRect(x + 9, y + 3, 1, 1)
  ctx.fillRect(x + 9, y + 11, 1, 1)
  if (!above) {
    ctx.fillStyle = p.rockDark
    ctx.fillRect(x + 3, y, 10, 2)
  }
  if (!below) {
    ctx.fillStyle = p.rockDark
    ctx.fillRect(x + 2, y + 13, 12, 3)
    ctx.fillStyle = p.rock
    ctx.fillRect(x + 3, y + 13, 10, 1)
  }
}

/** The pit: ties, two rails, and the boarded-over third rail along the far side. */
function tracks(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  col: number,
  row: number,
  p: Palette,
  frame: number,
  screen: Screen,
): void {
  ctx.fillStyle = p.water
  ctx.fillRect(x, y, TILE, TILE)
  // Ballast and ties.
  ctx.fillStyle = p.waterLight
  ctx.fillRect(x + 1, y + 2, 2, 12)
  ctx.fillRect(x + 7, y + 2, 2, 12)
  ctx.fillRect(x + 13, y + 2, 2, 12)
  // The rails.
  ctx.fillStyle = p.trunk
  ctx.fillRect(x, y + 4, TILE, 1)
  ctx.fillRect(x, y + 11, TILE, 1)
  ctx.fillStyle = '#c9c6ba'
  ctx.fillRect(x + 4, y + 4, 3, 1)
  // The third rail, under its wooden cover, on whichever side is away from
  // the platform.
  const platformAbove = at(screen, col, row - 1) === '.'
  ctx.fillStyle = '#6a4a26'
  ctx.fillRect(x, platformAbove ? y + 14 : y + 1, TILE, 1)
  // A puddle catches the light now and then.
  if (tileHash(screen, col, row) % 9 === 0 && Math.floor(frame / 40) % 2 === 0) {
    ctx.fillStyle = '#2b3a5a'
    ctx.fillRect(x + 9, y + 7, 4, 2)
  }
}

/**
 * A subway car standing at the platform, seen from the side. Stainless with a
 * dark window band, a door every fourth tile, the route bullet by the door.
 * Walkable — 'B' — so stepping onto it is stepping aboard.
 */
function trainCar(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  col: number,
  row: number,
  p: Palette,
  frame: number,
  screen: Screen,
): void {
  ctx.fillStyle = '#12131a'
  ctx.fillRect(x, y, TILE, TILE)
  ctx.fillStyle = '#c6c8c4'
  ctx.fillRect(x, y + 1, TILE, 14)
  ctx.fillStyle = '#e3e5e1'
  ctx.fillRect(x, y + 1, TILE, 1)
  ctx.fillStyle = '#767974'
  ctx.fillRect(x, y + 13, TILE, 2)
  // Corrugation: the fluted lower body.
  ctx.fillStyle = '#b0b2ae'
  for (let i = 1; i < TILE; i += 2) ctx.fillRect(x + i, y + 9, 1, 4)

  const left = at(screen, col - 1, row)
  const right = at(screen, col + 1, row)
  const isEnd = left !== 'B' || right !== 'B'
  const door = !isEnd && (col + Math.floor(row / 2)) % 4 === 1
  if (door) {
    ctx.fillStyle = '#5a5d59'
    ctx.fillRect(x + 2, y + 2, 12, 13)
    ctx.fillStyle = '#26304a'
    ctx.fillRect(x + 3, y + 3, 4, 5)
    ctx.fillRect(x + 9, y + 3, 4, 5)
    ctx.fillStyle = '#12131a'
    ctx.fillRect(x + 7, y + 2, 2, 13)
    // The route bullet beside the door.
    ctx.fillStyle = p.leaf
    ctx.fillRect(x + 12, y + 9, 3, 3)
    return
  }
  // Windows.
  ctx.fillStyle = '#26304a'
  ctx.fillRect(x + 2, y + 3, 5, 5)
  ctx.fillRect(x + 9, y + 3, 5, 5)
  ctx.fillStyle = '#4a5f8f'
  ctx.fillRect(x + 3, y + 4, 2, 1)
  ctx.fillRect(x + 10, y + 4, 2, 1)
  if (isEnd) {
    // The end of the car: a coupling and the marker lights.
    ctx.fillStyle = '#12131a'
    ctx.fillRect(left !== 'B' ? x : x + 14, y + 2, 2, 12)
    const blink = Math.floor(frame / 20) % 2 === 0
    ctx.fillStyle = blink ? '#ff5a4a' : '#8f2320'
    ctx.fillRect(left !== 'B' ? x + 2 : x + 12, y + 10, 2, 2)
  }
}

/** Steps going up to the street, lit, with the railing painted green. */
function stairsUp(ctx: CanvasRenderingContext2D, x: number, y: number, p: Palette): void {
  ctx.fillStyle = p.wallDark
  ctx.fillRect(x, y, TILE, TILE)
  for (let i = 0; i < 5; i++) {
    ctx.fillStyle = i % 2 === 0 ? '#c9c6ba' : '#a8a498'
    ctx.fillRect(x + 2, y + 13 - i * 3, 12, 3)
  }
  ctx.fillStyle = '#f2c12e'
  ctx.fillRect(x + 2, y + 13, 12, 1)
  ctx.fillStyle = '#2f6b46'
  ctx.fillRect(x + 1, y, 1, TILE)
  ctx.fillRect(x + 14, y, 1, TILE)
}

/** A turnstile: the steel tripod arms in their frame. Swipe to pass. */
function turnstile(ctx: CanvasRenderingContext2D, x: number, y: number): void {
  ctx.fillStyle = '#12131a'
  ctx.fillRect(x + 1, y + 2, 4, 13)
  ctx.fillRect(x + 11, y + 2, 4, 13)
  ctx.fillStyle = '#6f7370'
  ctx.fillRect(x + 2, y + 3, 2, 11)
  ctx.fillRect(x + 12, y + 3, 2, 11)
  // The arms.
  ctx.fillStyle = '#c6c8c4'
  ctx.fillRect(x + 5, y + 7, 6, 2)
  ctx.fillRect(x + 7, y + 4, 2, 8)
  ctx.fillStyle = '#12131a'
  ctx.fillRect(x + 7, y + 7, 2, 2)
  // The card reader, glowing.
  ctx.fillStyle = '#3fb85f'
  ctx.fillRect(x + 2, y + 4, 2, 1)
}

/** Where the track goes into the dark. A signal light beside it. */
function tunnelMouth(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  col: number,
  row: number,
  p: Palette,
  frame: number,
  screen: Screen,
): void {
  ctx.fillStyle = p.wallDark
  ctx.fillRect(x, y, TILE, TILE)
  ctx.fillStyle = '#000000'
  ctx.fillRect(x + 2, y + 2, 12, 14)
  ctx.fillRect(x + 4, y, 8, 2)
  const green = Math.floor(frame / 90) % 2 === 0
  ctx.fillStyle = green ? '#3fb85f' : '#d5433f'
  ctx.fillRect(x + 3, y + 5, 2, 2)
  void col
  void row
  void screen
}

// ======================================================================
// Inside the train
// ======================================================================

function trainTile(
  ctx: CanvasRenderingContext2D,
  char: TileChar,
  x: number,
  y: number,
  col: number,
  row: number,
  p: Palette,
  frame: number,
  screen: Screen,
): void {
  switch (char) {
    case '.':
      return carFloor(ctx, x, y, col, row, p)
    case 'S':
      carFloor(ctx, x, y, col, row, p)
      ctx.fillStyle = p.path
      ctx.fillRect(x, y + 6, TILE, 4)
      return
    case '#':
    case 'T':
      return carWall(ctx, x, y, col, row, p, frame, screen)
    case 'R':
      carFloor(ctx, x, y, col, row, p)
      return seat(ctx, x, y, col, row, p, screen)
    case '*':
      carFloor(ctx, x, y, col, row, p)
      return pole(ctx, x, y, p)
    case 'H':
      return slidingDoors(ctx, x, y, p, frame)
    case 'D':
    case 'C':
      return endDoor(ctx, x, y, p)
    case ',':
      carFloor(ctx, x, y, col, row, p)
      return trashBags(ctx, x, y, col, row, screen)
    case '~':
      return tunnelOutside(ctx, x, y, col, row, p, frame)
    case 'B':
      return carFloor(ctx, x, y, col, row, p)
    case 'X':
      return boardedDoor(ctx, x, y, p)
    case 'p':
      carFloor(ctx, x, y, col, row, p)
      return trashBags(ctx, x, y, col, row, screen)
    case '^':
      return endDoor(ctx, x, y, p)
    case '=':
    case 'A':
      return carFloor(ctx, x, y, col, row, p)
  }
}

function carFloor(ctx: CanvasRenderingContext2D, x: number, y: number, col: number, row: number, p: Palette): void {
  ctx.fillStyle = p.ground
  ctx.fillRect(x, y, TILE, TILE)
  ctx.fillStyle = p.groundSpeckle
  if ((col * 7 + row * 13) % 5 === 0) ctx.fillRect(x + 4, y + 5, 2, 1)
  if ((col * 3 + row * 5) % 7 === 0) ctx.fillRect(x + 10, y + 11, 1, 2)
}

/**
 * The side of the car from inside: a window along the top with the tunnel
 * going past, an ad card under it, stainless below. The tunnel lights come
 * by in a stream, so the car feels like it is moving even when he stands
 * still.
 */
function carWall(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  col: number,
  row: number,
  p: Palette,
  frame: number,
  screen: Screen,
): void {
  ctx.fillStyle = p.wall
  ctx.fillRect(x, y, TILE, TILE)
  ctx.fillStyle = p.wallDark
  ctx.fillRect(x, y + 15, TILE, 1)
  const topWall = row < 5
  // The window.
  const wy = topWall ? y + 2 : y + 5
  ctx.fillStyle = '#12131a'
  ctx.fillRect(x, wy, TILE, 9)
  ctx.fillStyle = p.water
  ctx.fillRect(x + 1, wy + 1, TILE - 2, 7)
  // Tunnel lights streaming past: one every 40 pixels, moving left.
  const phase = (frame * 3 + col * TILE) % 40
  if (phase < 3) {
    ctx.fillStyle = '#f2c94c'
    ctx.fillRect(x + 6, wy + 3, 2, 2)
    ctx.fillStyle = p.waterLight
    ctx.fillRect(x + 2, wy + 2, TILE - 4, 5)
    ctx.fillStyle = '#f2c94c'
    ctx.fillRect(x + 6, wy + 3, 2, 2)
  } else if (phase < 8) {
    ctx.fillStyle = p.waterLight
    ctx.fillRect(x + 1, wy + 3, TILE - 2, 3)
  }
  // The ad card above the window on the top wall, the seat back below it
  // otherwise.
  const h = tileHash(screen, col, row)
  if (topWall) {
    ctx.fillStyle = ['#d5433f', '#3f74d6', '#e2883a', '#f6f3e7'][h % 4] as string
    ctx.fillRect(x + 1, y + 12, TILE - 2, 3)
  } else {
    ctx.fillStyle = ['#d5433f', '#3f74d6', '#e2883a', '#f6f3e7'][h % 4] as string
    ctx.fillRect(x + 1, y + 1, TILE - 2, 3)
  }
}

/** The dark outside the car: tunnel wall going past, cables, a light now and then. */
function tunnelOutside(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  col: number,
  row: number,
  p: Palette,
  frame: number,
): void {
  ctx.fillStyle = p.water
  ctx.fillRect(x, y, TILE, TILE)
  // Cables along the tunnel wall.
  ctx.fillStyle = p.waterLight
  if (row % 2 === 0) ctx.fillRect(x, y + 6, TILE, 1)
  // Lights streaming past, faster than the ones seen through the windows,
  // because they are closer.
  const phase = (frame * 4 + col * TILE) % 56
  if (phase < 4) {
    ctx.fillStyle = '#f2c94c'
    ctx.fillRect(x + 6, y + 3, 3, 3)
    ctx.fillStyle = '#4a4a2a'
    ctx.fillRect(x + 2, y + 2, 11, 5)
    ctx.fillStyle = '#f2c94c'
    ctx.fillRect(x + 6, y + 3, 3, 3)
  }
}

/** A bucket seat, in orange or yellow — they alternate down the car. */
function seat(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  col: number,
  row: number,
  p: Palette,
  screen: Screen,
): void {
  const yellow = Math.floor(col / 2) % 2 === 1
  const body = yellow ? p.path : p.rock
  const light = yellow ? '#f7d968' : p.rockLight
  const dark = yellow ? p.pathEdge : p.rockDark
  ctx.fillStyle = '#12131a'
  ctx.fillRect(x + 1, y + 2, 14, 13)
  ctx.fillStyle = body
  ctx.fillRect(x + 2, y + 3, 12, 11)
  ctx.fillStyle = light
  ctx.fillRect(x + 3, y + 4, 10, 2)
  ctx.fillStyle = dark
  ctx.fillRect(x + 3, y + 9, 10, 1)
  ctx.fillRect(x + 2, y + 12, 12, 2)
  // The bucket: a dip in the middle.
  ctx.fillStyle = dark
  ctx.fillRect(x + 6, y + 6, 4, 3)
  void row
  void screen
}

/** A stanchion: the pole in the middle of the car, foot to ceiling. */
function pole(ctx: CanvasRenderingContext2D, x: number, y: number, p: Palette): void {
  ctx.fillStyle = '#12131a'
  ctx.fillRect(x + 6, y, 4, TILE)
  ctx.fillStyle = p.trunk
  ctx.fillRect(x + 7, y, 2, TILE)
  ctx.fillStyle = '#f6f3e7'
  ctx.fillRect(x + 7, y, 1, TILE)
  ctx.fillStyle = '#12131a'
  ctx.fillRect(x + 4, y + 13, 8, 3)
  ctx.fillStyle = '#767974'
  ctx.fillRect(x + 5, y + 13, 6, 1)
}

/** The side doors from inside, with the "stand clear" stripe. */
function slidingDoors(ctx: CanvasRenderingContext2D, x: number, y: number, p: Palette, frame: number): void {
  ctx.fillStyle = p.wallDark
  ctx.fillRect(x, y, TILE, TILE)
  ctx.fillStyle = '#9a9d99'
  ctx.fillRect(x + 1, y + 1, 6, 14)
  ctx.fillRect(x + 9, y + 1, 6, 14)
  ctx.fillStyle = '#26304a'
  ctx.fillRect(x + 2, y + 3, 4, 6)
  ctx.fillRect(x + 10, y + 3, 4, 6)
  ctx.fillStyle = '#12131a'
  ctx.fillRect(x + 7, y, 2, TILE)
  // The strip light over the door, blinking when they are about to close.
  const closing = Math.floor(frame / 15) % 4 === 0
  ctx.fillStyle = closing ? '#ff5a4a' : '#5a5d59'
  ctx.fillRect(x + 6, y + 0, 4, 1)
  ctx.fillStyle = '#f2c12e'
  ctx.fillRect(x, y + 15, TILE, 1)
}

/** The door at the end of the car, through to the next one. */
function endDoor(ctx: CanvasRenderingContext2D, x: number, y: number, p: Palette): void {
  ctx.fillStyle = p.wall
  ctx.fillRect(x, y, TILE, TILE)
  ctx.fillStyle = '#12131a'
  ctx.fillRect(x + 3, y + 1, 10, 15)
  ctx.fillStyle = '#7e817d'
  ctx.fillRect(x + 4, y + 2, 8, 13)
  ctx.fillStyle = '#26304a'
  ctx.fillRect(x + 5, y + 3, 6, 5)
  ctx.fillStyle = '#12131a'
  ctx.fillRect(x + 10, y + 10, 1, 2)
}
