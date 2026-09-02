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
import { ITEMS } from '../src/game/items'

const { cells } = overworldLayout()

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

const screens = SCREENS.map((screen) => ({
  id: screen.id,
  name: screen.name,
  region: screen.region,
  rows: screen.rows,
  dark: screen.dark ?? false,
  shop: screen.shop,
  at: cells.get(screen.id),
  exits: screen.exits,
  portals: (screen.portals ?? []).map((portal) => ({
    col: portal.col,
    row: portal.row,
    to: portal.to,
    toName: screenById(portal.to)?.name ?? portal.to,
    hidden: hiddenBy(screen.id, portal.col, portal.row),
    requires: portal.requires ? ITEMS[portal.requires].name : undefined,
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
  treasure: screen.treasure,
  pickup: screen.pickup
    ? { ...screen.pickup, itemName: ITEMS[screen.pickup.item].name }
    : undefined,
  props: (screen.props ?? []).filter((p) => p.talk).map((p) => ({ col: p.col, row: p.row, talk: p.talk })),
  spawns: (screen.spawns ?? []).map((s) => s.kind),
}))

console.log(JSON.stringify({ screens, generated: new Date().toISOString().slice(0, 10) }, null, 2))
