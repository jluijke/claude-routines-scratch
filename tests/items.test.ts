import { describe, expect, it } from 'vitest'
import { ITEMS, TOOL_SLOT, itemName, type ItemId } from '../src/game/items'

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
