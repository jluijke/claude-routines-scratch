/**
 * The words that change between the land, the ship and the city.
 *
 * The world says a lot of small things — a bush burned, a rock blown open, a
 * sack found — and every one of them is wrong on a spacecraft. Rather than
 * scatter `level === 2 ? ... : ...` through the game loop, each line lives here
 * once for each world, and the world asks for the set it is in.
 */
import type { Level } from '../core/save'

export interface Flavour {
  /** The HUD label over the weapon slot. */
  weaponLabel: string
  /** What the hero swings at everything. */
  swing: string
  bushBurned: string
  hidingTreeBurned: string
  flameGutters: string
  candleOncePerRoom: string
  wallBlown: string
  outOfBombs: string
  /** Pressing the item key with the bow in hand and nothing to fire. */
  noArrows: string
  /** What the shopkeeper says as he hands the bow over. */
  bowPatter: string
  nothingHungry: string
  baitDropped: string
  wingsHowTo: string
  wingsNotHeld: (name: string) => string
  wingsTorn: string
  foodAppears: string
  foodTaken: string
  foodGateKind: string
  foodGateMessage: string
  foodGateOpen: string
  potionWearsOff: string
  noMap: string
  nothingToUse: string
  noItems: string
  defeated: string
  /** Said once, the moment the red mech comes apart. Only the ship has one. */
  mechSplit: string
  /** Said once, when a mech is half dead and stops fighting fair. */
  mechEnraged: string
  /** Stepping onto a teleporter pad, and standing up at the other end. */
  teleportGo: string
  teleportArrive: string
  /** The one line said when he walks out of an airlock without his suit. */
  noSuit: string
  suitOn: string
  suitOff: string
  /** What the pet shop and the shops are called. */
  petShopTitle: string
  petShopGreeting: string
  computer: boolean
}

const LAND: Flavour = {
  weaponLabel: 'SWORD',
  swing: 'sword',
  bushBurned: 'The bush burns away.',
  hidingTreeBurned: 'The tree burns away, and something rolls out of it.',
  flameGutters: 'The flame gutters out.',
  candleOncePerRoom: 'The blue candle only lights once in each room.',
  wallBlown: 'The cracked rock blows apart, revealing a way through.',
  outOfBombs: 'You are out of bombs.',
  noArrows: 'You have no arrows left. The shop sells them.',
  bowPatter: '"The Bow. Press C until it is in your hand, then X to loose one. Arrows sold separately."',
  nothingHungry: 'Nothing here is hungry.',
  baitDropped: 'The monsters stop to eat.',
  wingsHowTo: 'Hold the Wings and walk into open water. They only carry you across.',
  wingsNotHeld: (name) =>
    `You have the ${name}, but they are not in your hand. Press C until the B slot shows them.`,
  wingsTorn: 'The Wings tear apart as you land. That crossing was one way.',
  foodAppears: 'A sack of animal food is lying in the open.',
  foodTaken:
    'You hold up a sack of animal food. Your friend has already smelled it — ' +
    'and it is going to fight anything that comes near you.',
  foodGateKind: 'A sack of animal food',
  foodGateMessage:
    'A sack of animal food, sitting in the open. Your friend has already ' +
    'noticed it. There is a note tied to the string.',
  foodGateOpen: 'The sack is yours.',
  potionWearsOff: 'The potion wears off. They can see you again.',
  noMap: 'You have no map. There must be one somewhere.',
  nothingToUse: 'Nothing to use yet. Buy something at the shop.',
  noItems: 'You have no items to use yet.',
  defeated: 'You have run out of hearts. A villager carries you back to the square.',
  // The land has no splitting guardian. Kept so the two tables stay the same
  // shape, rather than making one field optional for the sake of one world.
  mechSplit: 'It breaks in two, and both halves come on.',
  mechEnraged: 'It is badly hurt, and it stops holding still.',
  teleportGo: 'The light takes you apart.',
  teleportArrive: 'You are somewhere else, and all of you arrived.',
  noSuit: '',
  suitOn: '',
  suitOff: '',
  petShopTitle: 'The Pet Cave',
  petShopGreeting:
    '"They all want to come with you. Pick the one you like the look of — ' +
    'and if you change your mind, come back and pick another."',
  computer: false,
}

const SHIP: Flavour = {
  weaponLabel: 'WEAPON',
  swing: 'weapon',
  bushBurned: 'The screwdriver whirs, and the loose panel comes away.',
  hidingTreeBurned: 'The sealed panel comes off, and something rolls out from behind it.',
  flameGutters: 'The beam finds nothing to unscrew.',
  candleOncePerRoom: 'The laser screwdriver needs a moment to recharge. Once per room.',
  wallBlown: 'The cracked bulkhead blows apart, revealing a way through.',
  outOfBombs: 'You are out of plasma charges.',
  noArrows: 'You have no power cells left. A computer sells them.',
  bowPatter: '"BLASTER. PRESS C UNTIL IT IS IN YOUR HAND, THEN X TO FIRE. POWER CELLS SOLD SEPARATELY."',
  nothingHungry: 'Nothing here wants scrap.',
  baitDropped: 'The robots stop to chew on the scrap.',
  wingsHowTo: 'Hold the Rocketship and step onto a launch pad — the ring of lights. It only carries you across.',
  wingsNotHeld: (name) =>
    `You have the ${name}, but it is not in your hand. Press C until the B slot shows it.`,
  wingsTorn: 'The rocket burns out as you land. That crossing was one way.',
  foodAppears: 'A battery pack is lying on the deck.',
  foodTaken:
    'You hold up a battery pack. Your cyborg friend is already humming — ' +
    'and it is going to fight anything that comes near you.',
  foodGateKind: 'A battery pack',
  foodGateMessage:
    'A battery pack, left on the deck. Your cyborg has already ' +
    'noticed it. There is a note stuck to the casing.',
  foodGateOpen: 'The battery pack is yours.',
  potionWearsOff: 'The cloaking serum wears off. Their sensors can see you again.',
  noMap: 'You have no schematic of the ship. There must be one somewhere.',
  nothingToUse: 'Nothing to use yet. Buy something at a computer.',
  noItems: 'You have no items to use yet.',
  defeated: 'You have run out of hearts. A medical drone carries you back to the bridge.',
  mechSplit: 'THE MECH SPLITS IN TWO. BOTH HALVES ARE STILL COMING.',
  mechEnraged: 'WARNING: CORE BREACH. THE MECH IS PHASING — IT WILL NOT STAY PUT.',
  teleportGo: 'The light takes you apart.',
  teleportArrive: 'You are somewhere else, and all of you arrived.',
  noSuit: 'You forgot to put on your space suit!',
  suitOn: 'You put on your space suit. The helmet seals with a hiss.',
  suitOff: 'Back inside, you hang the space suit up in the airlock.',
  petShopTitle: 'The Cyborg Bay',
  petShopGreeting:
    'The screen flickers. "SIX CYBORG COMPANIONS ONLINE. Choose the one you ' +
    'like the look of — and come back to this console to change your mind."',
  computer: true,
}

const CITY: Flavour = {
  weaponLabel: 'WEAPON',
  swing: 'weapon',
  bushBurned: 'The bolt cutters go through the padlock, and the lid comes up.',
  hidingTreeBurned: 'The padlock drops off the dumpster, and something rolls out of it.',
  flameGutters: 'Nothing here to cut.',
  candleOncePerRoom: 'The bolt cutters need a rest. Once per block.',
  wallBlown: 'The firecrackers go off and the boards come away, revealing a way through.',
  outOfBombs: 'You are out of firecrackers.',
  noArrows: 'You are out of bullets. The hardware store sells them.',
  bowPatter: '"The machine gun. Press C until it is in your hand, then X. Bullets sold separately, and mind where you point it."',
  nothingHungry: 'Nothing here is hungry.',
  baitDropped: 'The rats stop to eat.',
  wingsHowTo: 'Hold the Citi Bike pass and ride onto the bridge. It only carries you across.',
  wingsNotHeld: (name) =>
    `You have the ${name}, but it is not in your hand. Press C until the B slot shows it.`,
  wingsTorn: 'The bike docks itself on the far side. That crossing was one way.',
  foodAppears: 'A bodega sandwich is lying on the sidewalk, still in its foil.',
  foodTaken:
    'You hold up a bodega sandwich. Your friend has already smelled it — ' +
    'and it is going to fight anything that comes near you.',
  foodGateKind: 'A bodega sandwich',
  foodGateMessage:
    'A bodega sandwich in foil, sitting on the sidewalk. Your friend has already ' +
    'noticed it. There is a note stuck to the wrapper.',
  foodGateOpen: 'The sandwich is yours.',
  potionWearsOff: 'You take the hoodie off. They can see you again.',
  noMap: 'You have no map. The newsstand on Sheridan Square sells one.',
  nothingToUse: 'Nothing to use yet. Buy something at the bodega.',
  noItems: 'You have no items to use yet.',
  defeated: 'You have run out of hearts. A cab driver takes you back to the square, and does not charge you.',
  mechSplit: 'It breaks in two, and both halves come on.',
  mechEnraged: 'It is badly hurt, and it stops holding still.',
  teleportGo: 'The purple car pulls away with you in the back.',
  teleportArrive: 'The purple car lets you out. This is not where you got in.',
  noSuit: '',
  suitOn: '',
  suitOff: '',
  petShopTitle: 'The Pet Shop',
  petShopGreeting:
    '"You again? A thousand years each way and you still haven\'t decided. ' +
    'Same six as ever — pick the one you like the look of."',
  computer: false,
}

export function flavourFor(level: Level): Flavour {
  return level === 2 ? SHIP : level === 3 ? CITY : LAND
}
