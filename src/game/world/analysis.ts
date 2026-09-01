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
import { SCREEN_COLS, SCREEN_ROWS, TILE, TILES, type TileChar } from './tiles'
import { bodyCorners, PLAYER_SIZE } from '../entities/player'

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


// ---------------------------------------------------- standing in a doorway

export interface Spot {
  x: number
  y: number
}

/** Whether the hero's body fits at these pixel coordinates. */
export function bodyFits(screen: Screen, x: number, y: number): boolean {
  for (const [cx, cy] of bodyCorners(x, y)) {
    if (isSolid(screen, Math.floor(cx / TILE), Math.floor(cy / TILE))) return false
  }
  return true
}

/** How far back from a door the hero is placed once it opens. */
export const STEP_BACK = 10

/**
 * Where to stand the hero after a barrier opens or is declined.
 *
 * The direction comes from the door, never from which way he happens to be
 * facing: finishing an exercise rebuilds the world and facing resets, so a
 * facing-based push sent him the wrong way and, unchecked, into solid rock —
 * where nothing could move him again. Everything here is offered to `fits`
 * first, and if nothing is free he simply stays in the doorway.
 */
export function stepBackFromGate(
  gate: { col: number; row: number },
  from: Spot,
  fits: (x: number, y: number) => boolean,
): Spot {
  const centreX = from.x + PLAYER_SIZE / 2
  const centreY = from.y + PLAYER_SIZE / 2
  const dx = centreX - (gate.col * TILE + TILE / 2)
  const dy = centreY - (gate.row * TILE + TILE / 2)
  const away: [number, number] =
    Math.abs(dx) >= Math.abs(dy)
      ? [dx < 0 ? -STEP_BACK : STEP_BACK, 0]
      : [0, dy < 0 ? -STEP_BACK : STEP_BACK]

  const tries: [number, number][] = [
    away,
    [0, STEP_BACK],
    [0, -STEP_BACK],
    [STEP_BACK, 0],
    [-STEP_BACK, 0],
  ]
  for (const [ox, oy] of tries) {
    if (fits(from.x + ox, from.y + oy)) return { x: from.x + ox, y: from.y + oy }
  }
  return from
}

/**
 * Barrier positions from which opening the door would leave the hero inside a
 * wall. One unchecked ten-pixel shove did exactly that and cost a child his
 * save, so this walks every place he could legally be standing.
 */
export function trappingGates(screen: Screen): string[] {
  const problems: string[] = []
  const fits = (x: number, y: number): boolean => bodyFits(screen, x, y)

  for (const placement of screen.gates ?? []) {
    for (let y = 0; y <= SCREEN_ROWS * TILE - PLAYER_SIZE; y += 2) {
      for (let x = 0; x <= SCREEN_COLS * TILE - PLAYER_SIZE; x += 2) {
        if (!fits(x, y)) continue
        const landed = stepBackFromGate(placement, { x, y }, fits)
        if (fits(landed.x, landed.y)) continue
        problems.push(
          `${screen.id}: opening "${placement.gateId}" from ${x},${y} leaves the hero inside a wall`,
        )
        break
      }
    }
  }
  return problems
}


/**
 * Chests nobody can reach. A treasure walled in is worse than no treasure: the
 * child sees it through the dark and cannot get to it.
 */
export function strandedTreasure(screen: Screen): string[] {
  const treasure = screen.treasure
  if (!treasure) return []
  const { col, row } = treasure
  if (isSolid(screen, col, row)) {
    return [`${screen.id}: the chest "${treasure.id}" sits inside a solid tile`]
  }
  const reachable =
    !isSolid(screen, col, row - 1) ||
    !isSolid(screen, col, row + 1) ||
    !isSolid(screen, col - 1, row) ||
    !isSolid(screen, col + 1, row)
  if (!reachable) {
    return [`${screen.id}: the chest "${treasure.id}" is walled in on every side`]
  }
  return []
}

// -------------------------------------------------------- barriers you can see

/** Tiles that are already a visible obstacle in their own right. */
const SELF_EVIDENT_TILES = new Set<TileChar>(['=', 'X', ',', 'C', 'D', '^', 'R', '#'])

/**
 * Barriers that draw nothing at all.
 *
 * Twenty-three of them once did: the sealed chests, the shrine keeper, the
 * ferryman. A child walked onto blank grass and a prompt appeared out of thin
 * air, which reads as a bug in the game rather than as a locked door. A barrier
 * has to look like something.
 */
export function unmarkedBarriers(screen: Screen, kindOf: (gateId: string) => string | undefined): string[] {
  const problems: string[] = []
  for (const placement of screen.gates ?? []) {
    const kind = kindOf(placement.gateId)
    if (!kind) {
      problems.push(`${screen.id}: barrier "${placement.gateId}" does not exist`)
      continue
    }
    // These kinds paint their own art wherever they are placed.
    if (kind === 'chest' || kind === 'npc' || kind === 'door' || kind === 'boss' || kind === 'seal' || kind === 'bridge') {
      continue
    }
    // A shopkeeper barrier is represented by the shopkeeper standing there.
    if (kind === 'shop' || kind === 'smith') {
      if ((screen.props ?? []).length > 0) continue
      problems.push(`${screen.id}: shop barrier "${placement.gateId}" has no shopkeeper to stand at it`)
      continue
    }
    // A hidden way through must at least be a tile worth trying something on.
    const char = ((screen.rows[placement.row] ?? '')[placement.col] ?? '.') as TileChar
    if (!SELF_EVIDENT_TILES.has(char)) {
      problems.push(
        `${screen.id}: barrier "${placement.gateId}" (${kind}) sits on plain "${char}" and draws nothing`,
      )
    }
  }
  return problems
}

// ------------------------------------------------------- walled-in features

/** Barriers that open, so they are not what walls a place off. */
const OPENABLE_TILES = new Set<TileChar>(['=', 'X', ','])

function passable(screen: Screen, col: number, row: number): boolean {
  if (col < 0 || row < 0 || col >= SCREEN_COLS || row >= SCREEN_ROWS) return false
  const char = ((screen.rows[row] ?? '')[col] ?? '#') as TileChar
  if (OPENABLE_TILES.has(char)) return true
  return !isSolid(screen, col, row)
}

/**
 * Doors, barriers and chests that cannot be walked to at all.
 *
 * The entrance to the first dungeon was sealed inside its own rock box for the
 * life of this project, and so was one of the dungeon chests. Nothing caught
 * it: `unreachableDoors` only asks whether a door has an open tile beside it,
 * which a walled-in pocket does. This asks the real question — can the hero get
 * there from the edge of the screen — with every openable barrier counted as
 * open, so what it finds is solid rock and nothing else.
 */
export function walledInFeatures(screen: Screen): string[] {
  const seen = new Set<string>()
  const queue: { col: number; row: number }[] = []
  const push = (col: number, row: number): void => {
    const key = `${col},${row}`
    if (seen.has(key) || !passable(screen, col, row)) return
    seen.add(key)
    queue.push({ col, row })
  }

  for (let col = 0; col < SCREEN_COLS; col++) {
    push(col, 0)
    push(col, SCREEN_ROWS - 1)
  }
  for (let row = 0; row < SCREEN_ROWS; row++) {
    push(0, row)
    push(SCREEN_COLS - 1, row)
  }
  // Arriving through a door counts as a way in.
  for (const portal of screen.portals ?? []) push(portal.spawnCol, portal.spawnRow)

  while (queue.length > 0) {
    const { col, row } = queue.shift() as { col: number; row: number }
    push(col, row - 1)
    push(col, row + 1)
    push(col - 1, row)
    push(col + 1, row)
  }

  const problems: string[] = []
  const reached = (col: number, row: number): boolean => seen.has(`${col},${row}`)
  for (const portal of screen.portals ?? []) {
    if (!reached(portal.col, portal.row)) {
      problems.push(`${screen.id}: the door to "${portal.to}" at ${portal.col},${portal.row} is walled in`)
    }
  }
  for (const placement of screen.gates ?? []) {
    if (!reached(placement.col, placement.row)) {
      problems.push(`${screen.id}: barrier "${placement.gateId}" at ${placement.col},${placement.row} is walled in`)
    }
  }
  if (screen.treasure && !reached(screen.treasure.col, screen.treasure.row)) {
    problems.push(`${screen.id}: the chest "${screen.treasure.id}" is walled in`)
  }
  return problems
}
