/**
 * Ragged tree lines.
 *
 * Every screen was authored as a neat rectangle with a one-tile hedge round the
 * outside, which made forty-seven different places all look like the same
 * place. The original NES overworld has no straight edges: the woods push into
 * the clearing in clumps, and it is the shape of the trees that tells you which
 * screen you are on.
 *
 * So the border is thickened, unevenly and deterministically, after the screens
 * are authored. Doing it here rather than by hand keeps every screen's real
 * content — barriers, doors, spawns, the routes between them — exactly as
 * written, and lets the map checks run over the result.
 */
import { Rng } from '../../core/rng'
import { SCREEN_COLS, SCREEN_ROWS, TILES, type TileChar } from './tiles'
import type { Screen } from './screens'

/** How far in from the edge the woods may reach. */
const MAX_DEPTH = 3

function solid(char: TileChar): boolean {
  const def = TILES[char]
  if (!def) return true
  return def.water ? true : def.solid
}

/** Everything that must still be standable and reachable afterwards. */
function protectedTiles(screen: Screen): Set<string> {
  const keep = new Set<string>()
  const add = (col: number, row: number, halo = 1): void => {
    for (let dr = -halo; dr <= halo; dr++) {
      for (let dc = -halo; dc <= halo; dc++) keep.add(`${col + dc},${row + dr}`)
    }
  }

  for (const placement of screen.gates ?? []) {
    add(placement.col, placement.row)
    for (const tile of placement.opens ?? []) add(tile.col, tile.row)
  }
  for (const portal of screen.portals ?? []) add(portal.col, portal.row)
  for (const spawn of screen.spawns ?? []) add(spawn.col, spawn.row)
  for (const prop of screen.props ?? []) add(prop.col, prop.row)
  if (screen.treasure) add(screen.treasure.col, screen.treasure.row)
  if (screen.pickup) add(screen.pickup.col, screen.pickup.row)
  if (screen.dog) add(screen.dog.col, screen.dog.row)
  return keep
}

/** Openings in the border, and the lane leading in from each. */
function doorways(rows: string[]): { col: number; row: number }[] {
  const spots: { col: number; row: number }[] = []
  const at = (col: number, row: number): TileChar =>
    ((rows[row] ?? '')[col] ?? '#') as TileChar

  for (let col = 0; col < SCREEN_COLS; col++) {
    if (!solid(at(col, 0))) spots.push({ col, row: 0 }, { col, row: 1 }, { col, row: 2 })
    const last = SCREEN_ROWS - 1
    if (!solid(at(col, last))) spots.push({ col, row: last }, { col, row: last - 1 }, { col, row: last - 2 })
  }
  for (let row = 0; row < SCREEN_ROWS; row++) {
    if (!solid(at(0, row))) spots.push({ col: 0, row }, { col: 1, row }, { col: 2, row })
    const last = SCREEN_COLS - 1
    if (!solid(at(last, row))) spots.push({ col: last, row }, { col: last - 1, row }, { col: last - 2, row })
  }
  return spots
}

/** Can every place that matters still be walked to from every other? */
function stillConnected(rows: string[], mustReach: { col: number; row: number }[]): boolean {
  const open = mustReach.filter((t) => !solid(((rows[t.row] ?? '')[t.col] ?? '#') as TileChar))
  const start = open[0]
  if (!start) return true

  const seen = new Set<string>([`${start.col},${start.row}`])
  const queue = [start]
  while (queue.length > 0) {
    const { col, row } = queue.shift() as { col: number; row: number }
    for (const [dc, dr] of [[0, -1], [0, 1], [-1, 0], [1, 0]] as const) {
      const c = col + dc
      const r = row + dr
      if (c < 0 || r < 0 || c >= SCREEN_COLS || r >= SCREEN_ROWS) continue
      const key = `${c},${r}`
      if (seen.has(key)) continue
      if (solid(((rows[r] ?? '')[c] ?? '#') as TileChar)) continue
      seen.add(key)
      queue.push({ col: c, row: r })
    }
  }
  return open.every((t) => seen.has(`${t.col},${t.row}`))
}

/**
 * Grows the woods inward in clumps. A tile is only ever planted next to trees
 * that are already there, so the result reads as one wood pushing in rather
 * than as scattered shrubs, and each planting is undone again the moment it
 * would cut the screen in two.
 */
export function roughen(screen: Screen): Screen {
  const rows = [...screen.rows]
  // Only the wooded overworld. Dungeon rooms are walls, and meant to be square.
  if (!rows.some((line) => line.includes('T'))) return screen

  const rng = new Rng(`trees-${screen.id}`)
  const keep = protectedTiles(screen)
  const lanes = doorways(rows)
  for (const lane of lanes) keep.add(`${lane.col},${lane.row}`)
  const mustReach = [...lanes]
  for (const placement of screen.gates ?? []) mustReach.push(placement)
  for (const portal of screen.portals ?? []) mustReach.push(portal)
  if (screen.treasure) mustReach.push(screen.treasure)
  if (screen.pickup) mustReach.push(screen.pickup)
  if (screen.dog) mustReach.push(screen.dog)

  const at = (col: number, row: number): TileChar => ((rows[row] ?? '')[col] ?? '#') as TileChar
  const set = (col: number, row: number, char: string): void => {
    const line = rows[row] as string
    rows[row] = line.slice(0, col) + char + line.slice(col + 1)
  }
  const depth = (col: number, row: number): number =>
    Math.min(col, row, SCREEN_COLS - 1 - col, SCREEN_ROWS - 1 - row)

  // Two passes, so a clump planted in the first can be grown against.
  for (let pass = 0; pass < 2; pass++) {
    for (let row = 0; row < SCREEN_ROWS; row++) {
      for (let col = 0; col < SCREEN_COLS; col++) {
        if (at(col, row) !== '.') continue
        if (keep.has(`${col},${row}`)) continue
        const away = depth(col, row)
        if (away > MAX_DEPTH) continue

        let neighbours = 0
        for (const [dc, dr] of [[0, -1], [0, 1], [-1, 0], [1, 0]] as const) {
          if (at(col + dc, row + dr) === 'T') neighbours++
        }
        if (neighbours === 0) continue

        // Close to the edge and hard against the wood, it almost always grows;
        // further in it thins out, which is what gives the edge its shape.
        const chance = (0.62 - away * 0.16) * (0.55 + neighbours * 0.22)
        if (rng.next() > chance) continue

        set(col, row, 'T')
        if (!stillConnected(rows, mustReach)) set(col, row, '.')
      }
    }
  }

  return { ...screen, rows }
}
