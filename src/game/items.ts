/**
 * Items and the shop catalogue.
 *
 * Rupees from monsters cover the consumables. The equipment that actually
 * changes how the game plays is priced beyond what wandering can earn, and the
 * best pieces are gated behind a spelling exercise as well — that is what makes
 * the curriculum the real progression system rather than a tax on playing.
 */

export type ItemId =
  | 'woodenSword'
  | 'metalSword'
  | 'bronzeSword'
  | 'goldenSword'
  | 'woodenShield'
  | 'metalShield'
  | 'bronzeShield'
  | 'magicalShield'
  | 'wings'
  | 'blueTunic'
  | 'redTunic'
  | 'bow'
  | 'arrows'
  | 'blueCandle'
  | 'bomb'
  | 'bait'
  | 'blueRing'
  | 'recoveryHeart'
  | 'heartContainer'

export type ItemCategory = 'sword' | 'shield' | 'tunic' | 'tool' | 'consumable' | 'ring'

export interface ItemDef {
  id: ItemId
  name: string
  category: ItemCategory
  /** Rupees. Omitted for items that are never sold. */
  price?: number
  description: string
  /** Sword damage, or shield block strength, or tunic damage reduction. */
  power?: number
  /** Item that must already be owned before this one can be bought or used. */
  requires?: ItemId
  /** Stackable items track a count; everything else is owned or not. */
  stackable?: boolean
  /** Bought in the hidden cave rather than the village shop. */
  secret?: boolean
  /**
   * The shopkeeper asks for a spelling challenge before selling this. The id
   * refers to a gate in game/gates.ts.
   */
  gate?: string
}

export const ITEMS: Record<ItemId, ItemDef> = {
  woodenSword: {
    id: 'woodenSword',
    name: 'Wooden Sword',
    category: 'sword',
    description: 'A trainer’s blade. It is better than bare hands.',
    power: 1,
  },
  metalSword: {
    id: 'metalSword',
    name: 'Metal Sword',
    category: 'sword',
    price: 90,
    description: 'Sharper, longer reach. Your first real upgrade.',
    power: 2,
  },
  bronzeSword: {
    id: 'bronzeSword',
    name: 'Bronze Sword',
    category: 'sword',
    price: 250,
    description: 'Heavy and bright. Cuts through armoured foes.',
    power: 3,
    requires: 'metalSword',
    gate: 'smith-bronze',
  },
  goldenSword: {
    id: 'goldenSword',
    name: 'Golden Sword',
    category: 'sword',
    price: 600,
    description: 'The smith’s masterwork. Few have earned it.',
    power: 5,
    requires: 'bronzeSword',
    gate: 'smith-golden',
  },
  woodenShield: {
    id: 'woodenShield',
    name: 'Wooden Shield',
    category: 'shield',
    description: 'Stops a stone. Not much else.',
    power: 1,
  },
  metalShield: {
    id: 'metalShield',
    name: 'Metal Shield',
    category: 'shield',
    price: 90,
    description: 'Blocks arrows and rocks while you face them.',
    power: 2,
  },
  bronzeShield: {
    id: 'bronzeShield',
    name: 'Bronze Shield',
    category: 'shield',
    price: 200,
    description: 'Wide enough to hide behind properly.',
    power: 3,
    requires: 'metalShield',
  },
  magicalShield: {
    id: 'magicalShield',
    name: 'Magical Shield',
    category: 'shield',
    price: 350,
    description: 'Turns aside even a boss’s magic.',
    power: 4,
    requires: 'bronzeShield',
    gate: 'shop-magical-shield',
  },
  wings: {
    id: 'wings',
    name: 'Wings',
    category: 'tool',
    price: 300,
    description: 'Carry you over water. The river is no longer the edge of the map.',
    gate: 'shop-wings',
  },
  blueTunic: {
    id: 'blueTunic',
    name: 'Blue Tunic',
    category: 'tunic',
    price: 250,
    description: 'Woven cloth that softens every blow.',
    power: 1,
  },
  redTunic: {
    id: 'redTunic',
    name: 'Red Tunic',
    category: 'tunic',
    price: 500,
    description: 'Dyed with fire flowers. Halves the damage you take.',
    power: 2,
    requires: 'blueTunic',
    gate: 'shop-red-tunic',
  },
  bow: {
    id: 'bow',
    name: 'Bow',
    category: 'tool',
    price: 350,
    description: 'Strike from a distance — if you have arrows.',
    gate: 'shop-bow',
  },
  arrows: {
    id: 'arrows',
    name: 'Arrows',
    category: 'consumable',
    price: 80,
    description: 'A bundle of thirty. Useless without the Bow.',
    requires: 'bow',
    stackable: true,
  },
  blueCandle: {
    id: 'blueCandle',
    name: 'Blue Candle',
    category: 'tool',
    price: 60,
    description: 'Lights a dark room, and burns away a bush. One flame per room.',
  },
  bomb: {
    id: 'bomb',
    name: 'Bombs',
    category: 'consumable',
    price: 40,
    description: 'Blows open cracked walls. Sold in bundles of four.',
    stackable: true,
  },
  bait: {
    id: 'bait',
    name: 'Bait',
    category: 'consumable',
    price: 60,
    description: 'Hungry monsters stop to eat instead of chasing you.',
    stackable: true,
  },
  blueRing: {
    id: 'blueRing',
    name: 'Blue Ring',
    category: 'ring',
    price: 250,
    description: 'A cool blue band. You take far less damage.',
    power: 2,
    secret: true,
    gate: 'secret-blue-ring',
  },
  recoveryHeart: {
    id: 'recoveryHeart',
    name: 'Recovery Heart',
    category: 'consumable',
    price: 10,
    description: 'Restores one heart straight away.',
    stackable: true,
  },
  heartContainer: {
    id: 'heartContainer',
    name: 'Heart Container',
    category: 'consumable',
    description: 'Raises your maximum life by one heart. Never sold — only earned.',
  },
}

/** Items on the village shopkeeper's shelf, in display order. */
export const VILLAGE_SHOP: ItemId[] = [
  'recoveryHeart',
  'bomb',
  'blueCandle',
  'bait',
  'metalSword',
  'metalShield',
  'bronzeShield',
  'bronzeSword',
  'blueTunic',
  'bow',
  'arrows',
  'wings',
  'magicalShield',
  'redTunic',
  'goldenSword',
]

/** The hidden cave in the graveyard. */
export const SECRET_SHOP: ItemId[] = ['blueRing', 'bomb', 'recoveryHeart', 'arrows']

/**
 * Items that occupy the B slot and are used with the item key. Ordered the way
 * the child cycles through them.
 */
export const TOOL_SLOT: ItemId[] = ['bomb', 'blueCandle', 'bait', 'recoveryHeart']

export function isTool(id: ItemId): boolean {
  return TOOL_SLOT.includes(id)
}

export function itemPower(id: ItemId): number {
  return ITEMS[id].power ?? 0
}
