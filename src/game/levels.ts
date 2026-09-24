/**
 * The two worlds, and stepping between them.
 *
 * Level 1 is the land. Level 2 is the sky-ship a thousand years on: the same
 * game underneath — barriers, a shop, an animal, things hidden behind things —
 * dressed for the future and laid out differently, so it is a new quest rather
 * than the old one twice.
 *
 * Only what he carries changes hands at the crossing. The machine that takes
 * him forward cannot carry metal, so the sword, the shield and the purse stay
 * behind and are waiting when he comes back; his hearts, his animal, and every
 * door he ever opened come with him.
 */
import type { Kit, Level, SaveData } from '../core/save'
import { screenById } from './world/screens'

/** Where each world starts, and where he wakes up after running out of hearts. */
export const START_SCREENS: Record<Level, string> = {
  1: 'village-square',
  2: 'ship-bridge',
}

/** What he arrives with. Level 2's shield is a deflector plate, but it is the same slot. */
function freshKit(level: Level, hearts: number, maxHearts: number): Kit {
  return {
    player: {
      hearts: Math.max(1, hearts),
      maxHearts,
      rupees: 0,
      screenId: START_SCREENS[level],
      x: 128,
      y: 120,
      equippedShield: 'woodenShield',
    },
    inventory: { woodenShield: 1 },
  }
}

/**
 * Moves him to the other world.
 *
 * His current gear goes into the stash and the stash — or a fresh start, the
 * first time — comes out. Nothing keyed by screen or barrier is touched:
 * the two worlds have no ids in common, so opened doors, burned trees and
 * fallen guardians all keep. Anything that belongs to the screen he is standing
 * on (a sack of food, a potion in effect, the suit) is cleared, because he is
 * no longer standing on it.
 */
export function switchLevel(save: SaveData, level: Level): void {
  if (save.level === level) return
  const leaving: Kit = { player: save.player, inventory: save.inventory }
  const arriving = save.stash ?? freshKit(level, save.player.hearts, save.player.maxHearts)
  save.stash = leaving
  save.level = level
  save.player = {
    ...arriving.player,
    // Life is his, not the world's: the container he earned in one carries to
    // the other, and he arrives whole.
    maxHearts: Math.max(arriving.player.maxHearts, leaving.player.maxHearts),
    hearts: Math.max(arriving.player.maxHearts, leaving.player.maxHearts),
    // Always at the beginning of the world he is arriving in, never wherever
    // he happened to be standing when he last left it: the machine has one
    // end in the village and one on the bridge.
    screenId: START_SCREENS[level],
    x: 128,
    y: 120,
  }
  save.inventory = arriving.inventory
  save.world.foodTile = undefined
  save.world.petFedScreens = 0
  save.world.screensSinceFood = 0
  save.world.invisibleScreens = 0
  save.world.suitOn = false
  save.spelling.inProgress = undefined
}

/**
 * Which world a screen belongs to.
 *
 * Asked of the screen itself rather than guessed from its name. The id prefix
 * was a good enough rule while every Level 2 screen was a bit of spacecraft,
 * and it stopped being one the moment the quiet square arrived: that screen is
 * the old world to look at, belongs to Level 2 to play, and is called neither.
 * Unknown ids still fall back to the prefix, because the checks ask about ids
 * that no longer exist.
 */
export function levelOfScreen(id: string): Level {
  const screen = screenById(id)
  if (screen) return screen.level ?? 1
  return /^(ship|airlock|rock|outpost)-/.test(id) ? 2 : 1
}
