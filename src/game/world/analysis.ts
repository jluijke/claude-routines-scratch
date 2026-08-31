/**
 * Structural checks on the world map.
 *
 * Every screen was authored on its own, and the bugs that reached the child
 * were all in the *seams between* screens: exits that dropped him inside a
 * river, a shop door walled in on four sides, barriers he could walk around.
 * None of it is visible while looking at one screen at a time, so these checks
 * look at the joins.
 *
 * Used by tools/validate-content.ts and by the unit tests.
 */
import { SCREENS, screenById, type Screen, type GatePlacement } from './screens'
import { SCREEN_COLS, SCREEN_ROWS, TILES, type TileChar } from './tiles'

export type Direction = 'up' | 'down' | 'left' | 'right'

/**
 * Solid for a player on foot. Water counts as solid: the Wings make it
 * passable, but nothing may *depend* on owning them, or a child without them
 * gets stuck.
 */
export function isSolid(screen: Screen, col: number, row: number): boolean {
  if (col < 0 || row < 0 || col >= SCREEN_COLS || row >= SCREEN_ROWS) return true
  const char = ((screen.rows[row] ?? '')[col] ?? '#') as TileChar
  const def = TILES[char]
  if (!def) return true
  return def.water ? true : def.solid
}

function hasWalkableNeighbour(screen: Screen, col: number, row: number): boolean {
  return [
    [0, 1],
    [0, -1],
    [1, 0],
    [-1, 0],
  ].some(([dc, dr]) => !isSolid(screen, col + (dc as number), row + (dr as number)))
}

/**
 * Where the player ends up after walking off an edge. The game keeps the
 * position on the other axis and places them one tile in from the far side.
 */
const LANDING: Record<Direction, { fromEdge: number; toEdge: number; axis: 'row' | 'col' }> = {
  right: { fromEdge: SCREEN_COLS - 1, toEdge: 1, axis: 'row' },
  left: { fromEdge: 0, toEdge: SCREEN_COLS - 2, axis: 'row' },
  up: { fromEdge: 0, toEdge: SCREEN_ROWS - 2, axis: 'col' },
  down: { fromEdge: SCREEN_ROWS - 1, toEdge: 1, axis: 'col' },
}

/**
 * The rows (or columns) along which an exit actually works: open on the way
 * out, and walkable where the player lands.
 */
export function workingLines(from: Screen, direction: Direction, to: Screen): number[] {
  const { fromEdge, toEdge, axis } = LANDING[direction]
  const limit = axis === 'row' ? SCREEN_ROWS : SCREEN_COLS
  const lines: number[] = []

  for (let i = 0; i < limit; i++) {
    const openHere = axis === 'row' ? !isSolid(from, fromEdge, i) : !isSolid(from, i, fromEdge)
    if (!openHere) continue
    const landCol = axis === 'row' ? toEdge : i
    const landRow = axis === 'row' ? i : toEdge
    if (isSolid(to, landCol, landRow)) continue
    // Landing somewhere with no way out is the same as landing in a wall.
    if (!hasWalkableNeighbour(to, landCol, landRow)) continue
    lines.push(i)
  }
  return lines
}

/** Exits that would strand the player. */
export function brokenExits(screens: readonly Screen[] = SCREENS): string[] {
  const problems: string[] = []
  for (const screen of screens) {
    for (const [direction, target] of Object.entries(screen.exits ?? {})) {
      const to = screenById(target)
      if (!to) {
        problems.push(`${screen.id} --${direction}--> unknown screen "${target}"`)
        continue
      }
      if (workingLines(screen, direction as Direction, to).length === 0) {
        problems.push(
          `${screen.id} --${direction}--> ${target}: no line where the border is open and the landing tile is walkable`,
        )
      }
    }
  }
  return problems
}

const STEP: Record<Direction, [number, number]> = {
  up: [0, -1],
  down: [0, 1],
  left: [-1, 0],
  right: [1, 0],
}

/**
 * Lays the world on a grid by following exits from the village, and reports
 * any exit that disagrees with where its target already sits. A screen that is
 * both "left of the village" and "below the crossing" cannot be drawn.
 */
export function layoutConflicts(start = 'village-square'): string[] {
  const position = new Map<string, string>([[start, '0,0']])
  const queue: string[] = [start]
  const conflicts: string[] = []

  while (queue.length > 0) {
    const id = queue.shift() as string
    const screen = screenById(id)
    if (!screen) continue
    const [x, y] = (position.get(id) as string).split(',').map(Number) as [number, number]

    for (const [direction, target] of Object.entries(screen.exits ?? {})) {
      const step = STEP[direction as Direction]
      const expected = `${x + step[0]},${y + step[1]}`
      const existing = position.get(target)
      if (existing === undefined) {
        position.set(target, expected)
        queue.push(target)
      } else if (existing !== expected) {
        conflicts.push(
          `${id} --${direction}--> ${target}: that would put it at ${expected}, but it already sits at ${existing}`,
        )
      }
    }
  }
  return conflicts
}

/**
 * Doors nobody can walk up to. A door standing on a cracked wall or a bush is
 * fine — that is the deliberate "find it with a bomb or the candle" case.
 */
export function unreachableDoors(screens: readonly Screen[] = SCREENS): string[] {
  const problems: string[] = []
  for (const screen of screens) {
    for (const portal of screen.portals ?? []) {
      const char = ((screen.rows[portal.row] ?? '')[portal.col] ?? '#') as TileChar
      const def = TILES[char]
      if (def?.cracked || def?.bush) continue
      if (isSolid(screen, portal.col, portal.row)) {
        problems.push(`${screen.id}: door at ${portal.col},${portal.row} -> ${portal.to} stands on a solid tile`)
        continue
      }
      if (!hasWalkableNeighbour(screen, portal.col, portal.row)) {
        problems.push(`${screen.id}: door at ${portal.col},${portal.row} -> ${portal.to} is walled in on all four sides`)
      }
    }
  }
  return problems
}

const OPPOSITE: Record<Direction, Direction> = {
  up: 'down',
  down: 'up',
  left: 'right',
  right: 'left',
}

/**
 * Where the player can actually land coming into a screen through one of its
 * edges — which is only along the lines the neighbour's border opens on, not
 * every row. Assuming otherwise makes barriers look bypassable when they are
 * not.
 */
function entryTiles(screen: Screen, direction: Direction): [number, number][] {
  const target = (screen.exits ?? {})[direction]
  if (!target) return []
  const neighbour = screenById(target)
  // The player can only come in this way if the neighbour leads back here.
  if (!neighbour || (neighbour.exits ?? {})[OPPOSITE[direction]] !== screen.id) return []

  const lines = workingLines(neighbour, OPPOSITE[direction], screen)
  const { toEdge, axis } = LANDING[OPPOSITE[direction]]
  return lines.map((i) => (axis === 'row' ? [toEdge, i] : [i, toEdge]) as [number, number])
}

/** Spawn points of doors that lead into this screen from anywhere else. */
function doorArrivals(screen: Screen, screens: readonly Screen[]): [number, number][] {
  const tiles: [number, number][] = []
  for (const other of screens) {
    for (const portal of other.portals ?? []) {
      if (portal.to === screen.id) tiles.push([portal.spawnCol, portal.spawnRow])
    }
  }
  return tiles
}

/** Tiles a barrier still occupies while it is sealed. */
function sealedTiles(placement: GatePlacement): string[] {
  const tiles = placement.opens ?? [{ col: placement.col, row: placement.row }]
  return tiles.map((t) => `${t.col},${t.row}`)
}

/** Everything walkable from a set of starts, with the barriers treated as walls. */
function reachable(screen: Screen, starts: [number, number][], blocked: ReadonlySet<string>): Set<string> {
  const seen = new Set<string>()
  const queue: [number, number][] = []
  for (const [c, r] of starts) {
    const key = `${c},${r}`
    if (isSolid(screen, c, r) || blocked.has(key) || seen.has(key)) continue
    seen.add(key)
    queue.push([c, r])
  }
  while (queue.length > 0) {
    const [c, r] = queue.shift() as [number, number]
    for (const [dc, dr] of [
      [0, 1],
      [0, -1],
      [1, 0],
      [-1, 0],
    ]) {
      const nc = c + (dc as number)
      const nr = r + (dr as number)
      const key = `${nc},${nr}`
      if (seen.has(key) || isSolid(screen, nc, nr) || blocked.has(key)) continue
      seen.add(key)
      queue.push([nc, nr])
    }
  }
  return seen
}

function edgeReached(reached: ReadonlySet<string>, direction: Direction): boolean {
  switch (direction) {
    case 'right':
      return Array.from({ length: SCREEN_ROWS }, (_, r) => `${SCREEN_COLS - 1},${r}`).some((k) => reached.has(k))
    case 'left':
      return Array.from({ length: SCREEN_ROWS }, (_, r) => `0,${r}`).some((k) => reached.has(k))
    case 'up':
      return Array.from({ length: SCREEN_COLS }, (_, c) => `${c},0`).some((k) => reached.has(k))
    case 'down':
      return Array.from({ length: SCREEN_COLS }, (_, c) => `${c},${SCREEN_ROWS - 1}`).some((k) => reached.has(k))
  }
}

/**
 * Barriers that can simply be walked around.
 *
 * A barrier declares the direction it guards. With it treated as a wall, the
 * player must not be able to enter from any other edge and still leave through
 * the guarded one. A barrier that only blocks two tiles of a fourteen-tile
 * field is decoration, and the exercise behind it never gets asked.
 */
export function bypassableBarriers(screens: readonly Screen[] = SCREENS): string[] {
  const problems: string[] = []

  for (const screen of screens) {
    const guarded = (screen.gates ?? []).filter((g) => g.guards)
    const guardsADoor = (screen.portals ?? []).some((p) => p.guardedBy)
    if (guarded.length === 0 && !guardsADoor) continue

    const blocked = new Set((screen.gates ?? []).flatMap(sealedTiles))
    const directions = Object.keys(screen.exits ?? {}) as Direction[]

    // Every way into this screen that is not through the barrier itself.
    const arrivals: [string, [number, number][]][] = [
      ...directions.map((d) => [`the ${d} edge`, entryTiles(screen, d)] as [string, [number, number][]]),
      ['a door', doorArrivals(screen, screens)],
    ]

    for (const placement of guarded) {
      const guards = placement.guards as Direction
      for (const [label, starts] of arrivals) {
        if (starts.length === 0) continue
        if (label === `the ${guards} edge`) continue
        const reached = reachable(screen, starts, blocked)
        if (edgeReached(reached, guards)) {
          problems.push(
            `${screen.id}: barrier "${placement.gateId}" guards ${guards}, but coming in by ${label} you can still leave ${guards}`,
          )
        }
      }
    }

    // A door meant to sit behind a barrier has to actually sit behind it.
    for (const portal of screen.portals ?? []) {
      if (!portal.guardedBy) continue
      for (const [label, starts] of arrivals) {
        if (starts.length === 0) continue
        const reached = reachable(screen, starts, blocked)
        if (reached.has(`${portal.col},${portal.row}`)) {
          problems.push(
            `${screen.id}: door to ${portal.to} should sit behind "${portal.guardedBy}", but coming in by ${label} you can reach it`,
          )
        }
      }
    }
  }
  return problems
}
