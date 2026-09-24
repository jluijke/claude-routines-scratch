/**
 * Dumps the whole world as JSON, for the reference map.
 *
 * Read straight out of SCREENS and GATES, so the map cannot drift from the
 * game. Run with: npx tsx tools/dump-world.ts > world.json
 */
import { SCREENS, screenById } from '../src/game/world/screens'
import { overworldLayout } from '../src/game/world/analysis'
import { TILES, type TileChar } from '../src/game/world/tiles'
import { gateById } from '../src/game/gates'
import { itemName } from '../src/game/items'
import { START_SCREENS } from '../src/game/levels'
import { themeFor } from '../src/game/render/world'

// Each world laid out from its own start, so a ship screen has a position on
// the ship's grid and none on the land's.
const cells = new Map([
  ...overworldLayout(START_SCREENS[1]).cells,
  ...overworldLayout(START_SCREENS[2]).cells,
])

/** Why a door is hard to find, if it is. */
function hiddenBy(screenId: string, col: number, row: number): string | undefined {
  const screen = screenById(screenId)
  if (!screen) return undefined
  const char = ((screen.rows[row] ?? '')[col] ?? '.') as TileChar
  const def = TILES[char]
  if (def?.cracked) return 'bomb'
  if (def?.bush) return 'candle'
  return undefined
}

/**
 * Every tile in a screen that a bomb or a flame would open.
 *
 * Read off the tile rows rather than off the doors, because the two are not
 * the same list: some cracked rock has a way in behind it, some has a spelling
 * barrier on it, and some has nothing at all. A parent working out where the
 * bombs go needs all three, and only the rows know about the third.
 */
function breakablesOf(screen: (typeof SCREENS)[number]) {
  const found: {
    col: number
    row: number
    needs: 'bomb' | 'candle'
    opens?: { id: string; name: string }
    gate?: string
  }[] = []
  screen.rows.forEach((line, row) => {
    ;[...line].forEach((char, col) => {
      const def = TILES[char as TileChar]
      if (!def?.cracked && !def?.bush) return
      const portal = (screen.portals ?? []).find((p) => p.col === col && p.row === row)
      const gate = (screen.gates ?? []).find(
        (g) =>
          (g.col === col && g.row === row) ||
          (g.opens ?? []).some((t) => t.col === col && t.row === row),
      )
      // Every piece of cracked rock, even the ones with nothing behind them —
      // a bomb spent on one of those is the reason he thinks he is stuck. The
      // scenery bushes are a different matter: there are hundreds, and only the
      // ones hiding something are worth a line.
      if (!def.cracked && !portal && !gate) return
      found.push({
        col,
        row,
        needs: def.cracked ? 'bomb' : 'candle',
        ...(portal ? { opens: { id: portal.to, name: screenById(portal.to)?.name ?? portal.to } } : {}),
        ...(gate ? { gate: gate.gateId } : {}),
      })
    })
  })
  return found
}

const screens = SCREENS.map((screen) => ({
  id: screen.id,
  name: screen.name,
  region: screen.region,
  level: screen.level ?? 1,
  theme: themeFor(screen),
  rows: screen.rows,
  dark: screen.dark ?? false,
  shop: screen.shop ?? (screen.props ?? []).find((p) => p.terminal)?.terminal,
  at: cells.get(screen.id),
  exits: screen.exits,
  portals: (screen.portals ?? []).map((portal) => ({
    col: portal.col,
    row: portal.row,
    to: portal.to,
    toName: screenById(portal.to)?.name ?? portal.to,
    hidden: hiddenBy(screen.id, portal.col, portal.row),
    requires: portal.requires ? itemName(portal.requires, screen.level ?? 1) : undefined,
    needsSuit: portal.needsSuit ?? false,
    teleporter: portal.teleporter ?? false,
    consumes: portal.consumes ?? false,
    guardedBy: portal.guardedBy,
  })),
  gates: (screen.gates ?? []).map((placement) => {
    const gate = gateById(placement.gateId)
    return {
      id: placement.gateId,
      col: placement.col,
      row: placement.row,
      kind: gate?.kind,
      optional: gate?.optional ?? false,
      challenge: gate?.challenge,
      message: gate?.message,
      reward: gate?.reward,
    }
  }),
  breakables: breakablesOf(screen),
  treasure: screen.treasure,
  pickup: screen.pickup
    ? { ...screen.pickup, itemName: itemName(screen.pickup.item, screen.level ?? 1) }
    : undefined,
  props: (screen.props ?? []).filter((p) => p.talk).map((p) => ({ col: p.col, row: p.row, talk: p.talk })),
  spawns: (screen.spawns ?? []).map((s) => s.kind),
}))

console.log(JSON.stringify({ screens, generated: new Date().toISOString().slice(0, 10) }, null, 2))
