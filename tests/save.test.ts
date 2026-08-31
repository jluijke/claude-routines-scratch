import { describe, expect, it } from 'vitest'
import { deserialise, load, migrate, newSave, save, serialise, SAVE_VERSION } from '../src/core/save'
import { recordAttempt } from '../src/spelling/mastery'

/** A stand-in for localStorage that behaves like a real one, including failure. */
class MemoryStorage implements Storage {
  private data = new Map<string, string>()
  failWrites = false
  get length() {
    return this.data.size
  }
  clear() {
    this.data.clear()
  }
  getItem(key: string) {
    return this.data.get(key) ?? null
  }
  key(index: number) {
    return [...this.data.keys()][index] ?? null
  }
  removeItem(key: string) {
    this.data.delete(key)
  }
  setItem(key: string, value: string) {
    if (this.failWrites) throw new Error('quota exceeded')
    this.data.set(key, value)
  }
}

describe('save data', () => {
  it('round-trips a full save', () => {
    const storage = new MemoryStorage()
    const data = newSave()
    data.player.rupees = 240
    data.inventory.metalSword = 1
    data.spelling.completedExercises = [1, 2, 3]
    recordAttempt(data.spelling.mastery, {
      concept: 'ee-sound',
      correct: true,
      firstAttempt: true,
      hintsUsed: 0,
    })

    save(data, storage)
    const loaded = load(storage)

    expect(loaded.player.rupees).toBe(240)
    expect(loaded.inventory.metalSword).toBe(1)
    expect(loaded.spelling.completedExercises).toEqual([1, 2, 3])
    expect(loaded.spelling.mastery.concepts['ee-sound']?.status).toBe('mastered')
  })

  it('starts a fresh game when there is nothing saved', () => {
    expect(load(new MemoryStorage()).spelling.completedExercises).toEqual([])
  })

  it('never loses the game to a corrupt save', () => {
    const storage = new MemoryStorage()
    storage.setItem('zsq.save', '{ this is not json')
    const loaded = load(storage)
    expect(loaded.player.hearts).toBe(3)
  })

  it('keeps playing when storage refuses writes, rather than crashing', () => {
    const storage = new MemoryStorage()
    storage.failWrites = true
    expect(() => save(newSave(), storage)).not.toThrow()
  })

  it('fills in fields a older or partial save is missing', () => {
    const partial = { version: SAVE_VERSION, player: { rupees: 5 } }
    const migrated = migrate(partial as unknown as Record<string, unknown>)
    expect(migrated.player.rupees).toBe(5)
    expect(migrated.player.maxHearts).toBe(3)
    expect(migrated.world.openedGates).toEqual([])
    expect(migrated.pacing.playSeconds).toBe(0)
    expect(migrated.spelling.mastery.concepts).toEqual({})
  })

  it('upgrades a save with no version at all', () => {
    const ancient = { player: { rupees: 12 } }
    const migrated = migrate(ancient as unknown as Record<string, unknown>)
    expect(migrated.version).toBe(SAVE_VERSION)
    expect(migrated.player.rupees).toBe(12)
  })

  it('exports and re-imports for playing on another device', () => {
    const data = newSave()
    data.player.rupees = 999
    data.world.openedGates = ['gate-bridge']
    const restored = deserialise(serialise(data))
    expect(restored.player.rupees).toBe(999)
    expect(restored.world.openedGates).toEqual(['gate-bridge'])
  })
})

describe('schema migration', () => {
  it('upgrades a version 1 save from before bombs existed', () => {
    // A child mid-curriculum must not lose their game when the game is updated.
    const old = {
      version: 1,
      player: { rupees: 310, hearts: 4, maxHearts: 6, screenId: 'forest-2', equippedSword: 'metalSword' },
      inventory: { metalSword: 1, blueCandle: 1 },
      world: { openedGates: ['forest-seal'], defeatedBosses: [], takenChests: [], visitedScreens: ['forest-2'] },
      spelling: { completedExercises: [1, 2, 3, 4, 5, 6], mastery: { concepts: {} } },
      pacing: { playSeconds: 1200, exerciseSeconds: 1100 },
    }
    const migrated = migrate(old as unknown as Record<string, unknown>)

    expect(migrated.version).toBe(SAVE_VERSION)
    expect(migrated.world.brokenTiles).toEqual([])
    // Everything they had earned is still there.
    expect(migrated.player.rupees).toBe(310)
    expect(migrated.player.maxHearts).toBe(6)
    expect(migrated.inventory.blueCandle).toBe(1)
    expect(migrated.world.openedGates).toEqual(['forest-seal'])
    expect(migrated.spelling.completedExercises).toHaveLength(6)
    expect(migrated.pacing.playSeconds).toBe(1200)
  })
})
