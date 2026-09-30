import { describe, expect, it } from 'vitest'
import { ITEMS, KEPT_ITEMS, nextWeapon, TOOL_SLOT, WEAPON_ORDER, itemName, type ItemId } from '../src/game/items'

const ids = Object.keys(ITEMS) as ItemId[]

describe('anything he can buy, he can hold', () => {
  // The fault this covers: the Bow was bought and paid for and then did
  // nothing, because it was never in the item slot. C walked straight past it.
  it('puts every tool on the shelf into the item slot', () => {
    const bought = ids.filter((id) => ITEMS[id].category === 'tool' && ITEMS[id].price !== undefined)
    expect(bought.length).toBeGreaterThan(0)
    for (const id of bought) {
      expect(TOOL_SLOT, `${itemName(id, 1)} can be bought but never held`).toContain(id)
    }
  })

  it('leaves the map out, because it has a key of its own', () => {
    // Not an oversight: M opens it, so it would only pad the C cycle.
    expect(ITEMS.map.price).toBeUndefined()
    expect(TOOL_SLOT).not.toContain('map')
  })

  it('has nothing in the slot that does not exist', () => {
    for (const id of TOOL_SLOT) expect(ITEMS[id], `${id} is in the slot but not in the game`).toBeDefined()
  })

  it('names every one of them in both worlds', () => {
    for (const id of TOOL_SLOT) {
      expect(itemName(id, 1).length).toBeGreaterThan(0)
      expect(itemName(id, 2).length).toBeGreaterThan(0)
    }
  })
})

describe('everything he can own has somewhere to be', () => {
  // The fault this covers: the taser was handed over from the parent panel
  // and was nowhere — a weapon, but weaker than the hammer he already
  // held, so it was never in his hand and no key could put it there.
  it('is a weapon, something worn, a tool in the slot, or on the kept list', () => {
    for (const id of ids) {
      const item = ITEMS[id]
      const worn = item.category === 'shield' || item.category === 'tunic' || item.category === 'ring'
      const weapon = WEAPON_ORDER.includes(id)
      const tool = TOOL_SLOT.includes(id)
      const kept = KEPT_ITEMS.includes(id)
      expect(
        [worn, weapon, tool, kept].filter(Boolean).length,
        `${id} must be exactly one of: worn, a weapon, a tool, or kept`,
      ).toBe(1)
    }
  })

  it('every sword is a weapon he can swap to', () => {
    for (const id of ids) if (ITEMS[id].category === 'sword') expect(WEAPON_ORDER).toContain(id)
  })

  it('the weapon key walks the weapons he owns, weakest first, and round again', () => {
    expect(nextWeapon([], undefined)).toBeUndefined()
    expect(nextWeapon(['woodenSword'], undefined)).toBe('woodenSword')
    expect(nextWeapon(['woodenSword'], 'woodenSword')).toBe('woodenSword')
    const owned: ItemId[] = ['metalSword', 'woodenSword', 'taser']
    expect(nextWeapon(owned, 'woodenSword')).toBe('taser')
    expect(nextWeapon(owned, 'taser')).toBe('metalSword')
    expect(nextWeapon(owned, 'metalSword')).toBe('woodenSword')
    // Holding something he no longer owns starts from the beginning.
    expect(nextWeapon(owned, 'goldenSword')).toBe('woodenSword')
  })
})
