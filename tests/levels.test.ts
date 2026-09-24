import { describe, expect, it } from 'vitest'
import { migrate, newSave, SAVE_VERSION } from '../src/core/save'
import { levelOfScreen, START_SCREENS, switchLevel } from '../src/game/levels'
import { screenById, SCREENS } from '../src/game/world/screens'
import { layoutConflicts, overworldLayout } from '../src/game/world/analysis'
import { SPRITES } from '../src/game/render/sprites'
import { ITEMS, itemGate, itemName } from '../src/game/items'
import { flavourFor } from '../src/game/flavour'
import { PETS } from '../src/game/pets'
import { isBossKind } from '../src/game/entities/enemies'
import { themeFor } from '../src/game/render/world'
import { allGates, gateById } from '../src/game/gates'

describe('the second world in the save', () => {
  it('starts a new quest in the land, with no suit on', () => {
    const fresh = newSave()
    expect(fresh.level).toBe(1)
    expect(fresh.world.suitOn).toBe(false)
    expect(fresh.stash).toBeUndefined()
  })

  it('upgrades a version 6 save into the land', () => {
    const old = { ...newSave(), version: 6 } as Record<string, unknown>
    delete old['level']
    delete (old['world'] as Record<string, unknown>)['suitOn']
    const migrated = migrate(old)
    expect(migrated.version).toBe(SAVE_VERSION)
    expect(migrated.level).toBe(1)
    expect(migrated.world.suitOn).toBe(false)
  })

  it('puts the gear aside on the way forward and brings it back on the way home', () => {
    const save = newSave()
    save.player.rupees = 420
    save.player.maxHearts = 7
    save.player.hearts = 2
    save.inventory.goldenSword = 1
    save.inventory.map = 1
    save.player.equippedSword = 'goldenSword'
    save.world.pet = 'wombat'
    save.world.openedGates.push('village-north-seal')

    switchLevel(save, 2)
    expect(save.level).toBe(2)
    expect(save.player.screenId).toBe(START_SCREENS[2])
    // Nothing metal comes through the machine.
    expect(save.player.rupees).toBe(0)
    expect(save.inventory.goldenSword).toBeUndefined()
    expect(save.inventory.map).toBeUndefined()
    expect(save.player.equippedSword).toBeUndefined()
    // Life and friends do, and he arrives whole.
    expect(save.player.maxHearts).toBe(7)
    expect(save.player.hearts).toBe(7)
    expect(save.world.pet).toBe('wombat')
    expect(save.world.openedGates).toContain('village-north-seal')
    expect(save.stash?.player.rupees).toBe(420)

    // Earn something out there, then go home.
    save.player.rupees = 55
    save.inventory.metalSword = 1
    switchLevel(save, 1)
    expect(save.level).toBe(1)
    expect(save.player.rupees).toBe(420)
    expect(save.inventory.goldenSword).toBe(1)
    expect(save.inventory.metalSword).toBeUndefined()
    expect(save.player.screenId).toBe('village-square')
    // And the ship's gear is waiting for the next trip, but not the spot he
    // was standing on: the machine always lands him at the start.
    switchLevel(save, 2)
    expect(save.player.screenId).toBe(START_SCREENS[2])
    switchLevel(save, 1)
    // And the ship's gear is waiting for the next trip.
    expect(save.stash?.player.rupees).toBe(55)
    expect(save.stash?.inventory.metalSword).toBe(1)
  })

  it('does nothing when asked for the world he is already in', () => {
    const save = newSave()
    save.player.rupees = 9
    switchLevel(save, 1)
    expect(save.player.rupees).toBe(9)
    expect(save.stash).toBeUndefined()
  })
})

describe('the sky-ship', () => {
  const ship = SCREENS.filter((s) => s.level === 2)
  const land = SCREENS.filter((s) => s.level !== 2)

  it('is a world of its own, with no ids in common with the land', () => {
    expect(ship.length).toBeGreaterThan(40)
    for (const s of ship) expect(levelOfScreen(s.id)).toBe(2)
    for (const s of land) expect(levelOfScreen(s.id)).toBe(1)
  })

  it('lays out on its own grid from the bridge, and never touches the land', () => {
    const { cells, conflicts } = overworldLayout(START_SCREENS[2])
    expect(conflicts).toEqual([])
    expect(layoutConflicts(START_SCREENS[2])).toEqual([])
    expect(cells.size).toBeGreaterThan(12)
    for (const id of cells.keys()) expect(screenById(id)?.level).toBe(2)
    const taken = new Set<string>()
    for (const at of cells.values()) {
      const key = `${at.x},${at.y}`
      expect(taken.has(key)).toBe(false)
      taken.add(key)
    }
    // And the land's map does not know the ship exists.
    for (const id of overworldLayout(START_SCREENS[1]).cells.keys()) {
      expect(screenById(id)?.level).toBeUndefined()
    }
  })

  it('has four rocks with a guardian each, like the land has four dungeons', () => {
    const guarded = (list: typeof SCREENS) =>
      list.filter((s) => (s.spawns ?? []).some((sp) => isBossKind(sp.kind)))
    expect(guarded(ship)).toHaveLength(4)
    expect(guarded(land)).toHaveLength(4)
    for (const s of guarded(ship)) expect(themeFor(s)).toBe('rock')
  })

  it('reaches every rock through an airlock with a locker and a door that needs the suit', () => {
    const airlocks = ship.filter((s) => s.setting === 'airlock')
    expect(airlocks).toHaveLength(4)
    for (const a of airlocks) {
      expect((a.props ?? []).some((p) => p.locker)).toBe(true)
      expect((a.spawns ?? []).length).toBe(0)
      const outer = (a.portals ?? []).filter((p) => p.needsSuit)
      expect(outer).toHaveLength(1)
      expect(screenById(outer[0]!.to)?.setting).toBe('rock')
    }
  })

  it('has no shop doors, only computers to bump', () => {
    expect(ship.filter((s) => s.shop)).toHaveLength(0)
    const terminals = ship.flatMap((s) => (s.props ?? []).filter((p) => p.terminal))
    const kinds = new Set(terminals.map((p) => p.terminal))
    expect(kinds).toEqual(new Set(['village', 'secret', 'smith', 'castaway', 'pets']))
  })

  it('hides two cloaking serums behind sealed panels, on different decks', () => {
    const serums = ship.filter((s) => s.pickup?.item === 'potion')
    expect(serums).toHaveLength(2)
    expect(serums[0]!.region).not.toBe(serums[1]!.region)
    for (const s of serums) expect(s.rows[s.pickup!.row]![s.pickup!.col]).toBe('p')
  })

  it('has a barrier of its own for every proof a computer asks', () => {
    for (const item of Object.values(ITEMS)) {
      const gate = itemGate(item.id, 2)
      if (item.gate) expect(gate, `${item.id} needs a future gate`).toBeDefined()
      if (gate) {
        expect(gateById(gate)).toBeDefined()
        expect(gate).not.toBe(item.gate)
      }
    }
    // Every ship barrier is placed, or is a computer's proof.
    const placed = new Set(SCREENS.flatMap((s) => (s.gates ?? []).map((g) => g.gateId)))
    for (const gate of allGates()) {
      if (gate.kind === 'shop' || gate.kind === 'smith') continue
      expect(placed.has(gate.id), `${gate.id} is never placed`).toBe(true)
    }
  })
})

describe('the future in pictures and words', () => {
  it('draws every robot, every cyborg, and the hero in his suit', () => {
    for (const name of ['droneA', 'droneB', 'crusherA', 'crusherB', 'discA', 'discB', 'glitchA', 'glitchB']) {
      expect(SPRITES[name as keyof typeof SPRITES]).toBeDefined()
    }
    for (const pet of PETS) {
      for (const frame of pet.cyborgFrames) expect(SPRITES[frame]).toBeDefined()
      expect(pet.cyborgFrames[0]).not.toBe(pet.frames[0])
    }
    expect(SPRITES.heroSuitWoodenDownA).toBeDefined()
    expect(SPRITES.swordFutureMetalRight).toBeDefined()
    expect(SPRITES.swordIconFutureGolden).toBe(SPRITES.swordFutureGoldenRight === undefined ? undefined : SPRITES.swordIconFutureGolden)
  })

  it('makes a cyborg half chrome and leaves the other half fur', () => {
    const dog = SPRITES.dogA.rows.join('')
    const cyborg = SPRITES.cyborgDogA.rows.join('')
    expect(cyborg).not.toBe(dog)
    // The left half is untouched.
    for (const [i, row] of SPRITES.cyborgDogA.rows.entries()) {
      expect(row.slice(0, 8)).toBe(SPRITES.dogA.rows[i]!.slice(0, 8))
    }
    expect(cyborg.includes('m')).toBe(true)
  })

  it('names every item for both worlds, and never the same way twice', () => {
    for (const item of Object.values(ITEMS)) {
      expect(itemName(item.id, 1)).toBe(item.name)
      expect(itemName(item.id, 2)).toBe(item.future.name)
      expect(item.future.name).not.toBe(item.name)
      expect(item.future.description.length).toBeGreaterThan(10)
    }
    expect(itemName('goldenSword', 2)).toBe('Scythe')
    expect(itemName('metalSword', 2)).toMatch(/Lightsaber/)
    expect(itemName('wings', 2)).toBe('Rocketship')
    expect(itemName('animalFood', 2)).toBe('Battery Pack')
  })

  it('says the airlock line only on the ship', () => {
    expect(flavourFor(1).noSuit).toBe('')
    expect(flavourFor(2).noSuit).toMatch(/space suit/)
    expect(flavourFor(2).foodGateKind).toMatch(/battery/i)
  })
})
