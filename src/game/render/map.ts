/**
 * The map he carries, drawn on the canvas rather than as a panel, so it looks
 * like the game and not like a dialog box.
 *
 * It shows the overworld only. Caves, shop interiors and dungeon rooms are
 * reached through doors and have no position relative to anything else, so
 * there is nothing truthful to draw for them — the original had the same
 * split, and for the same reason.
 *
 * Nothing here is remembered separately: the map reads `visitedScreens`, which
 * the world already writes. So it records where he has been rather than telling
 * him where to go, and a door only appears once he has actually gone through
 * it.
 */
import { SCREEN_H, SCREEN_W } from '../world/tiles'
import { overworldLayout } from '../world/analysis'
import { screenById, SCREENS } from '../world/screens'

/** Each screen is a small box on the map. */
const CELL_W = 20
const CELL_H = 14
const GAP = 2

/** The mountain track, which cannot sit on the main grid — see below. */
const MOUNTAIN = 'Mountain'

interface Cell {
  id: string
  x: number
  y: number
}

/**
 * The overworld, plus the mountain track as a column of its own.
 *
 * The track is walkable but it is entered through the crypt door, and its one
 * downward exit into the graveyard would put it on top of screens that are
 * already there. Drawing it detached is both the honest picture and how it
 * actually plays.
 */
function buildCells(): { main: Cell[]; mountain: Cell[] } {
  const { cells } = overworldLayout()
  const main: Cell[] = [...cells].map(([id, at]) => ({ id, x: at.x, y: at.y }))

  // Follow the track upward from its foot, so the order comes from the map
  // rather than from a list that could fall out of step with it.
  const mountain: Cell[] = []
  let id: string | undefined = SCREENS.find((s) => s.region === MOUNTAIN && s.exits.down)?.id
  let step = 0
  while (id && !mountain.some((c) => c.id === id)) {
    mountain.push({ id, x: 0, y: -step })
    const next: string | undefined = screenById(id)?.exits.up
    id = next && screenById(next)?.region === MOUNTAIN ? next : undefined
    step += 1
  }
  return { main, mountain }
}

const CELLS = buildCells()

export interface MapView {
  /** Where he is standing now. */
  here: string
  visited: readonly string[]
}

export function drawWorldMap(ctx: CanvasRenderingContext2D, view: MapView, frame: number): void {
  ctx.fillStyle = '#0d1017'
  ctx.fillRect(0, 0, SCREEN_W, SCREEN_H)

  const seen = new Set(view.visited)
  seen.add(view.here)

  const all = [...CELLS.main, ...CELLS.mountain]
  const minX = Math.min(...all.map((c) => c.x))
  const maxX = Math.max(...CELLS.main.map((c) => c.x))
  const minY = Math.min(...all.map((c) => c.y))
  const maxY = Math.max(...all.map((c) => c.y))

  const columns = maxX - minX + 1 + 2 // two spare columns for the mountain track
  const rows = maxY - minY + 1
  const boardW = columns * (CELL_W + GAP) - GAP
  const boardH = rows * (CELL_H + GAP) - GAP
  const originX = Math.round((SCREEN_W - boardW) / 2)
  const originY = Math.round((SCREEN_H - boardH) / 2) + 4

  const place = (cell: Cell, columnOffset: number): { x: number; y: number } => ({
    x: originX + (cell.x - minX + columnOffset) * (CELL_W + GAP),
    y: originY + (cell.y - minY) * (CELL_H + GAP),
  })

  for (const cell of CELLS.main) drawCell(ctx, cell, place(cell, 0), seen, view, frame)
  // The track sits to the right of everything, clear of the grid.
  const trackColumn = maxX - minX + 2
  for (const cell of CELLS.mountain) {
    const at = {
      x: originX + trackColumn * (CELL_W + GAP),
      y: originY + (cell.y - minY) * (CELL_H + GAP),
    }
    drawCell(ctx, cell, at, seen, view, frame)
  }

  const title = screenById(view.here)?.name?.toUpperCase() ?? 'THE LAND'
  ctx.fillStyle = '#e6b422'
  ctx.font = '7px monospace'
  ctx.textBaseline = 'top'
  ctx.fillText(title, 4, 4)
  const legend = 'M OR ESC TO CLOSE'
  ctx.fillStyle = '#5d6472'
  ctx.fillText(legend, SCREEN_W - 4 - legend.length * 4.2, 4)
  const found = `${[...seen].filter((id) => CELLS.main.some((c) => c.id === id) || CELLS.mountain.some((c) => c.id === id)).length}/${all.length} PLACES`
  ctx.fillText(found, 4, SCREEN_H - 10)
}

function drawCell(
  ctx: CanvasRenderingContext2D,
  cell: Cell,
  at: { x: number; y: number },
  seen: ReadonlySet<string>,
  view: MapView,
  frame: number,
): void {
  const screen = screenById(cell.id)
  if (!screen) return
  const known = seen.has(cell.id)

  // Nowhere he has not been is drawn at all — not even an outline. Sketching
  // the empty squares would hand him the shape of the whole land, which is the
  // thing the map is supposed to be a record of him discovering.
  if (!known) return

  ctx.fillStyle = '#2f5d3a'
  ctx.fillRect(at.x, at.y, CELL_W, CELL_H)
  ctx.strokeStyle = '#12131a'
  ctx.strokeRect(at.x + 0.5, at.y + 0.5, CELL_W - 1, CELL_H - 1)

  // A door he has actually been through. Never one he has not: the map is a
  // record of where he has gone, not a list of what is left.
  const doors = (screen.portals ?? []).filter((p) => seen.has(p.to))
  if (doors.length > 0) {
    ctx.fillStyle = '#12131a'
    ctx.fillRect(at.x + CELL_W / 2 - 2, at.y + CELL_H - 5, 4, 4)
    ctx.fillStyle = '#e6b422'
    ctx.fillRect(at.x + CELL_W / 2 - 1, at.y + CELL_H - 4, 2, 3)
  }

  if (cell.id === view.here) {
    // Blinking, the way the original marked you.
    if (Math.floor(frame / 16) % 2 === 0) {
      ctx.fillStyle = '#49a95a'
      ctx.fillRect(at.x + CELL_W / 2 - 3, at.y + CELL_H / 2 - 3, 6, 6)
      ctx.fillStyle = '#f6f3e7'
      ctx.fillRect(at.x + CELL_W / 2 - 2, at.y + CELL_H / 2 - 2, 4, 4)
    }
  }
}
