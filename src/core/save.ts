/**
 * Save data — one child, one browser, localStorage only. Nothing leaves the
 * device. The parent dashboard can export and re-import this file so he can
 * play on more than one machine.
 */
import type { ItemId } from '../game/items'
import { emptyMasteryStore, type MasteryStore } from '../spelling/mastery'

const STORAGE_KEY = 'zsq.save'
export const SAVE_VERSION = 4

export interface SaveData {
  version: number
  createdAt: number
  updatedAt: number
  player: {
    hearts: number
    maxHearts: number
    rupees: number
    screenId: string
    x: number
    y: number
    /** Absent until he picks one up. The quest starts empty-handed. */
    equippedSword?: ItemId
    equippedShield: ItemId
    equippedTunic?: ItemId
    /** The item in the B slot, used with the item key. */
    equippedTool?: ItemId
  }
  /** Owned items; stackable items store their count, others store 1. */
  inventory: Partial<Record<ItemId, number>>
  world: {
    openedGates: string[]
    defeatedBosses: string[]
    takenChests: string[]
    visitedScreens: string[]
    /**
     * How many more screens the dog stays for. Zero means no dog — either he
     * has not met it yet, or it has already run off. Kept in the save so
     * closing the tab does not quietly lose a friend mid-walk.
     */
    dogScreensLeft: number
    /**
     * Cracked walls blown open and bushes burned away, as "screenId:col,row".
     * A wall he has opened must stay open — nothing is more annoying than
     * spending a bomb twice on the same rock.
     */
    brokenTiles: string[]
  }
  spelling: {
    completedExercises: number[]
    mastery: MasteryStore
    /** Exercise the child is part-way through, if any. */
    inProgress?: number
    /**
     * Concepts that have already paid their rupee reward. Leaving an exercise
     * and starting it again used to pay for the same pattern every time, which
     * turned the exit button into a rupee printer.
     */
    paidConcepts: string[]
  }
  /** Minutes tracker behind the 50/50 pacing governor. */
  pacing: {
    playSeconds: number
    exerciseSeconds: number
  }
}

export function newSave(): SaveData {
  const now = Date.now()
  return {
    version: SAVE_VERSION,
    createdAt: now,
    updatedAt: now,
    player: {
      hearts: 3,
      maxHearts: 3,
      rupees: 0,
      screenId: 'village-square',
      x: 128,
      y: 120,
      equippedShield: 'woodenShield',
    },
    // No sword. It is lying on the grass in the village square, and finding it
    // is the first thing that happens in the game. An older save keeps its own
    // sword, because withDefaults no longer has one to splice in.
    inventory: { woodenShield: 1 },
    world: {
      openedGates: [],
      defeatedBosses: [],
      takenChests: [],
      visitedScreens: [],
      brokenTiles: [],
      dogScreensLeft: 0,
    },
    spelling: {
      completedExercises: [],
      mastery: emptyMasteryStore(),
      paidConcepts: [],
    },
    pacing: { playSeconds: 0, exerciseSeconds: 0 },
  }
}

type Migration = (data: Record<string, unknown>) => Record<string, unknown>

/**
 * Migrations run in order from the saved version up to SAVE_VERSION. Adding a
 * field to SaveData means adding a migration here, so an existing save is never
 * lost when the game is updated mid-curriculum.
 */
const MIGRATIONS: Record<number, Migration> = {
  // 0 -> 1: the first released schema; anything older is treated as fresh.

  // 1 -> 2: bombs and the burning candle arrived, so the world now remembers
  // which cracked walls and bushes have been cleared.
  1: (data) => {
    const world = (data['world'] as Record<string, unknown>) ?? {}
    if (!Array.isArray(world['brokenTiles'])) world['brokenTiles'] = []
    data['world'] = world
    return data
  },

  // 2 -> 3: leaving an exercise part-way became possible, so the rewards
  // already paid out are remembered and never paid twice.
  2: (data) => {
    const spelling = (data['spelling'] as Record<string, unknown>) ?? {}
    if (!Array.isArray(spelling['paidConcepts'])) spelling['paidConcepts'] = []
    data['spelling'] = spelling
    return data
  },

  // 3 -> 4: a dog you can make friends with, who walks with you for a few
  // screens and then goes. An older save simply has not met him.
  3: (data) => {
    const world = (data['world'] as Record<string, unknown>) ?? {}
    if (typeof world['dogScreensLeft'] !== 'number') world['dogScreensLeft'] = 0
    data['world'] = world
    return data
  },
}

export function migrate(raw: Record<string, unknown>): SaveData {
  let data = raw
  let version = typeof data['version'] === 'number' ? (data['version'] as number) : 0
  while (version < SAVE_VERSION) {
    const migration = MIGRATIONS[version]
    if (migration) data = migration(data)
    version += 1
    data['version'] = version
  }
  return withDefaults(data)
}

/** Fills in anything a hand-edited or partial save is missing. */
export function withDefaults(data: Record<string, unknown>): SaveData {
  const base = newSave()
  const merged = { ...base, ...(data as Partial<SaveData>) } as SaveData
  merged.player = { ...base.player, ...(data['player'] as object) }
  merged.inventory = { ...base.inventory, ...(data['inventory'] as object) }
  merged.world = { ...base.world, ...(data['world'] as object) }
  merged.world.brokenTiles = merged.world.brokenTiles ?? []
  merged.world.dogScreensLeft = merged.world.dogScreensLeft ?? 0
  merged.spelling = { ...base.spelling, ...(data['spelling'] as object) }
  merged.spelling.mastery = merged.spelling.mastery ?? emptyMasteryStore()
  merged.spelling.mastery.concepts = merged.spelling.mastery.concepts ?? {}
  merged.spelling.paidConcepts = merged.spelling.paidConcepts ?? []
  merged.pacing = { ...base.pacing, ...(data['pacing'] as object) }
  merged.version = SAVE_VERSION
  return merged
}

export function load(storage: Storage = localStorage): SaveData {
  try {
    const raw = storage.getItem(STORAGE_KEY)
    if (!raw) return newSave()
    const parsed = JSON.parse(raw) as Record<string, unknown>
    return migrate(parsed)
  } catch {
    // A corrupt save should never stop a nine-year-old from playing.
    return newSave()
  }
}

export function save(data: SaveData, storage: Storage = localStorage): void {
  data.updatedAt = Date.now()
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch {
    // Private browsing, quota, or storage disabled — keep playing in memory.
  }
}

export function clear(storage: Storage = localStorage): void {
  try {
    storage.removeItem(STORAGE_KEY)
  } catch {
    // Nothing to do.
  }
}

export function serialise(data: SaveData): string {
  return JSON.stringify(data, null, 2)
}

export function deserialise(text: string): SaveData {
  return migrate(JSON.parse(text) as Record<string, unknown>)
}
