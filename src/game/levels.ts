/**
 * The three worlds, and stepping between them.
 *
 * Level 1 is the land. Level 2 is the sky-ship a thousand years on. Level 3
 * is New York, now: the same game underneath — barriers, a shop, an animal,
 * things hidden behind things — dressed for the present and laid out
 * differently, so each is a new quest rather than the old one twice.
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
  3: 'nyc-washington-square',
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
 * The most hearts the ring lets through on the way back to the present. Going
 * forward costs nothing; coming back, the present pulls at a traveller, and
 * the crossing is paid for in life. A fresh quest starts with three, so this
 * is one more than that and a long way down from a chest of containers.
 */
export const WARP_HEARTS = 4

/** What a traveller with this many hearts arrives in the present with. */
export function warpToll(maxHearts: number): number {
  return Math.min(maxHearts, WARP_HEARTS)
}

/**
 * Moves him to another world.
 *
 * His current gear goes into that world's stash and the stash of the world he
 * is going to — or a fresh start, the first time — comes out. Nothing keyed
 * by screen or barrier is touched: the worlds have no ids in common, so
 * opened doors, burned trees and fallen guardians all keep. Anything that
 * belongs to the screen he is standing on (a sack of food, a potion in
 * effect, the suit) is cleared, because he is no longer standing on it.
 */
export function switchLevel(save: SaveData, level: Level): void {
  if (save.level === level) return
  const leaving: Kit = { player: save.player, inventory: save.inventory }
  const arriving = save.stashes[level] ?? freshKit(level, save.player.hearts, save.player.maxHearts)
  save.stashes[save.level] = leaving
  delete save.stashes[level]
  save.level = level
  // Life is his, not the world's: the container he earned in one carries to
  // the other, and he arrives whole — except into the present, where the
  // ring takes its toll on the way.
  const carried = Math.max(arriving.player.maxHearts, leaving.player.maxHearts)
  const maxHearts = level === 3 ? warpToll(carried) : carried
  save.player = {
    ...arriving.player,
    maxHearts,
    hearts: maxHearts,
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
  if (/^nyc-/.test(id)) return 3
  return /^(ship|airlock|rock|outpost)-/.test(id) ? 2 : 1
}
