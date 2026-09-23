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
  | 'map'
  | 'animalFood'
  | 'potion'

export type ItemCategory = 'sword' | 'shield' | 'tunic' | 'tool' | 'consumable' | 'ring'

/**
 * What an item is called in the future.
 *
 * Every item keeps its id, its slot, its price and its power across both
 * worlds — the Wings and the rocket are the same thing to the game, a way over
 * something you cannot walk across. Only what he sees changes: the name, the
 * description, and the picture.
 */
export interface FutureFace {
  name: string
  description: string
  /**
   * The computer's own proof before it sells this, a barrier of its own so
   * that what he proved to the village shopkeeper does not carry a thousand
   * years forward. Absent where the land's item is not gated either.
   */
  gate?: string
}

export interface ItemDef {
  id: ItemId
  name: string
  category: ItemCategory
  /** Rupees. Omitted for items that are never sold. */
  price?: number
  description: string
  /** How it appears in Level 2. */
  future: FutureFace
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
    future: {
      name: 'Training Saber',
      description: 'A short, dim yellow blade of light. It is better than bare hands.',
    },
    power: 1,
  },
  metalSword: {
    id: 'metalSword',
    name: 'Metal Sword',
    category: 'sword',
    price: 90,
    description: 'Sharper, longer reach. Your first real upgrade.',
    future: {
      name: 'Blue Lightsaber',
      description: 'A full blade of blue light. Longer reach, and it hums when it swings.',
    },
    power: 2,
  },
  bronzeSword: {
    id: 'bronzeSword',
    name: 'Bronze Sword',
    category: 'sword',
    price: 250,
    description: 'Heavy and bright. Cuts through armoured foes.',
    future: {
      name: 'Green Lightsaber',
      description: 'A blade of green light that cuts through armour plating.',
      gate: 'forge-green',
    },
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
    future: {
      name: 'Arc Staff',
      description: 'The forge’s masterwork. The orb at its tip swings a ring of lightning right round you.',
      gate: 'forge-arc',
    },
    power: 5,
    requires: 'bronzeSword',
    gate: 'smith-golden',
  },
  woodenShield: {
    id: 'woodenShield',
    name: 'Wooden Shield',
    category: 'shield',
    description: 'Stops a stone. Not much else.',
    future: {
      name: 'Deflector Plate',
      description: 'Stops a bolt. Not much else.',
    },
    power: 1,
  },
  metalShield: {
    id: 'metalShield',
    name: 'Metal Shield',
    category: 'shield',
    price: 90,
    description: 'Blocks arrows and rocks while you face them.',
    future: {
      name: 'Energy Shield',
      description: 'Turns aside bolts and scrap while you face them.',
    },
    power: 2,
  },
  bronzeShield: {
    id: 'bronzeShield',
    name: 'Bronze Shield',
    category: 'shield',
    price: 200,
    description: 'Wide enough to hide behind properly.',
    future: {
      name: 'Force Shield',
      description: 'Wide enough to hide behind properly.',
    },
    power: 3,
    requires: 'metalShield',
  },
  magicalShield: {
    id: 'magicalShield',
    name: 'Magical Shield',
    category: 'shield',
    price: 350,
    description: 'Turns aside even a boss’s magic.',
    future: {
      name: 'Photon Shield',
      description: 'Turns aside even a mech’s lightning.',
      gate: 'ship-photon-shield',
    },
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
    future: {
      name: 'Rocketship',
      description: 'Carries you across open space. The void is no longer the edge of the ship.',
      gate: 'ship-rocket',
    },
    gate: 'shop-wings',
  },
  blueTunic: {
    id: 'blueTunic',
    name: 'Blue Tunic',
    category: 'tunic',
    price: 250,
    description: 'Woven cloth that softens every blow.',
    future: {
      name: 'Blue Nano-suit',
      description: 'Woven from nanofibre. Softens every blow.',
    },
    power: 1,
  },
  redTunic: {
    id: 'redTunic',
    name: 'Red Tunic',
    category: 'tunic',
    price: 500,
    description: 'Dyed with fire flowers. Halves the damage you take.',
    future: {
      name: 'Red Nano-suit',
      description: 'Lined with reactor plating. Halves the damage you take.',
      gate: 'ship-red-nanosuit',
    },
    power: 2,
    requires: 'blueTunic',
    gate: 'shop-red-tunic',
  },
  bow: {
    id: 'bow',
    name: 'Bow',
    category: 'tool',
    price: 250,
    description: 'Strike from a distance — if you have arrows.',
    future: {
      name: 'Blaster',
      description: 'Strike from a distance — if you have power cells.',
      gate: 'ship-blaster',
    },
    gate: 'shop-bow',
  },
  arrows: {
    id: 'arrows',
    name: 'Arrows',
    category: 'consumable',
    price: 80,
    description: 'A bundle of thirty. Useless without the Bow.',
    future: {
      name: 'Power Cells',
      description: 'A rack of thirty. Useless without the Blaster.',
    },
    requires: 'bow',
    stackable: true,
  },
  blueCandle: {
    id: 'blueCandle',
    name: 'Blue Candle',
    category: 'tool',
    price: 60,
    gate: 'shop-candle',
    description: 'Lights a dark room, and burns away a bush. One flame per room.',
    future: {
      name: 'Laser Screwdriver',
      description: 'Its beam lights a dark deck, and unscrews a loose panel. One use per room.',
      gate: 'ship-candle',
    },
  },
  bomb: {
    id: 'bomb',
    name: 'Bombs',
    category: 'consumable',
    price: 40,
    description: 'Blows open cracked walls. Sold in bundles of four.',
    future: {
      name: 'Plasma Charges',
      description: 'Blows open a cracked bulkhead. Sold in packs of four.',
    },
    stackable: true,
  },
  bait: {
    id: 'bait',
    name: 'Bait',
    category: 'consumable',
    price: 60,
    description: 'Hungry monsters stop to eat instead of chasing you.',
    future: {
      name: 'Scrap Metal',
      description: 'Hungry robots stop to chew on it instead of chasing you.',
    },
    stackable: true,
  },
  blueRing: {
    id: 'blueRing',
    name: 'Blue Ring',
    category: 'ring',
    price: 250,
    description: 'A cool blue band. You take far less damage.',
    future: {
      name: 'Circuit Ring',
      description: 'A cool blue band of circuitry. You take far less damage.',
      gate: 'ship-circuit-ring',
    },
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
    future: {
      name: 'Med Patch',
      description: 'Restores one heart straight away.',
    },
    stackable: true,
  },
  heartContainer: {
    id: 'heartContainer',
    name: 'Heart Container',
    category: 'consumable',
    description: 'Raises your maximum life by one heart. Never sold — only earned.',
    future: {
      name: 'Life Core',
      description: 'Raises your maximum life by one heart. Never sold — only earned.',
    },
  },
  map: {
    id: 'map',
    name: 'Map of the Land',
    category: 'tool',
    // No price, so no shopkeeper can stock it. There is one, it is under a
    // rock on the Forest Path, and a bomb is the only way to it.
    description: 'Every place you have been, drawn as you found it. Press M.',
    future: {
      name: 'Ship Schematic',
      description: 'Every deck you have walked, drawn as you found it. Press M.',
    },
  },
  potion: {
    id: 'potion',
    name: 'Vanishing Potion',
    category: 'consumable',
    // Never sold. There are two in the world, each inside a tree that has to be
    // burned to get at it.
    description: 'Nothing can see you, or touch you, until you have left three places behind.',
    future: {
      name: 'Cloaking Serum',
      description: 'No sensor can see you, and nothing can touch you, until you have left three places behind.',
    },
  },
  animalFood: {
    id: 'animalFood',
    name: 'Animal Food',
    category: 'consumable',
    // No price: it is never sold. Sacks turn up in the open every few screens
    // and are earned by answering four questions about a grammar rule.
    description: 'Your animal fights beside you until you have left the next place behind.',
    future: {
      name: 'Battery Pack',
      description: 'Your cyborg fights beside you until you have left the next place behind.',
    },
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

/** The castaway under the island. He sells one thing, and knows it. */
export const CASTAWAY_SHOP: ItemId[] = ['wings', 'recoveryHeart']

/**
 * Items that occupy the B slot and are used with the item key. Ordered the way
 * the child cycles through them.
 */
export const TOOL_SLOT: ItemId[] = ['bomb', 'blueCandle', 'bow', 'wings', 'bait', 'recoveryHeart']

export function isTool(id: ItemId): boolean {
  return TOOL_SLOT.includes(id)
}

export function itemPower(id: ItemId): number {
  return ITEMS[id].power ?? 0
}

/** What it is called where he is standing. */
export function itemName(id: ItemId, level: 1 | 2 = 1): string {
  return level === 2 ? ITEMS[id].future.name : ITEMS[id].name
}

/** What it does, in the words of the world he is in. */
export function itemDescription(id: ItemId, level: 1 | 2 = 1): string {
  return level === 2 ? ITEMS[id].future.description : ITEMS[id].description
}

/** The proof a shop wants before selling it, in this world. */
export function itemGate(id: ItemId, level: 1 | 2 = 1): string | undefined {
  return level === 2 ? ITEMS[id].future.gate : ITEMS[id].gate
}

/**
 * What a piece of gear is made of, which is what the sprite is recoloured to.
 * The starting sword is wood and should look like wood, not like the metal one
 * he has not bought yet.
 */
export function materialOf(id: ItemId): 'wooden' | 'metal' | 'bronze' | 'golden' | 'magical' {
  switch (id) {
    case 'metalSword':
    case 'metalShield':
      return 'metal'
    case 'bronzeSword':
    case 'bronzeShield':
      return 'bronze'
    case 'goldenSword':
      return 'golden'
    case 'magicalShield':
      return 'magical'
    default:
      return 'wooden'
  }
}
