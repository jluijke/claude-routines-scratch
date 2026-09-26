/**
 * Original pixel art, authored as text.
 *
 * Every sprite is a grid of palette characters. Nothing here is traced from or
 * copied out of any Nintendo game — this is a Zelda-*inspired* look, drawn from
 * scratch. Keeping the art as text means no binary assets, reviewable diffs,
 * and nothing to download before the game runs.
 */

export const PALETTE: Record<string, string> = {
  '.': 'transparent',
  k: '#12131a', // outline
  w: '#f6f3e7', // white
  s: '#f2c9a0', // skin
  h: '#7b4a22', // hair
  g: '#49a95a', // tunic
  G: '#2f7a3c', // tunic shadow
  m: '#c8d0da', // metal
  M: '#79838f', // dark metal
  n: '#8a5a2b', // wood / brown
  v: '#b5793d', // lighter wood, for a wooden blade's edge
  d: '#5a3a1b', // dark brown
  r: '#d5433f', // red
  R: '#8f2320', // dark red
  b: '#3f74d6', // blue
  B: '#27488f', // dark blue
  p: '#9a55d1', // purple
  P: '#5e2f8a', // dark purple — the one car in the city that is not a cab
  i: '#ff6fb5', // pink — love
  I: '#c2357a', // deep pink
  o: '#e2883a', // orange
  y: '#e8bb2c', // gold
  Y: '#a9821a', // dark gold
  e: '#7fbb4c', // enemy body
  E: '#4d7a2c', // enemy shadow
  c: '#57d2c6', // magic / water sparkle
  x: '#d9d6c4', // bone
  z: '#2a2f3d', // shadow
}

export type SpriteRows = readonly string[]

export interface Sprite {
  width: number
  height: number
  rows: string[]
}

/**
 * Pads or trims each row so a miscounted line shows up as slightly odd art
 * rather than a crash or a corrupted atlas.
 */
export function defineSprite(width: number, height: number, rows: SpriteRows): Sprite {
  const padded: string[] = []
  for (let y = 0; y < height; y++) {
    const row = rows[y] ?? ''
    padded.push(row.length >= width ? row.slice(0, width) : row.padEnd(width, '.'))
  }
  return { width, height, rows: padded }
}

/**
 * The materials a sword or shield can be made of. The art is drawn once in
 * steel and recoloured, so a wooden sword actually looks like wood rather than
 * like the metal one he has not bought yet.
 */
export type Tier = 'wooden' | 'metal' | 'bronze' | 'golden' | 'magical'

/** body, edge, and the grip or boss. */
const TIER_COLOURS: Record<Tier, { body: string; edge: string; grip: string }> = {
  wooden: { body: 'n', edge: 'v', grip: 'd' },
  metal: { body: 'm', edge: 'w', grip: 'y' },
  bronze: { body: 'o', edge: 'y', grip: 'Y' },
  golden: { body: 'y', edge: 'w', grip: 'Y' },
  magical: { body: 'c', edge: 'w', grip: 'p' },
}

/** Rewrites palette characters, so one drawing can serve several colours. */
export function mapColours(sprite: Sprite, swap: Record<string, string>): Sprite {
  return {
    width: sprite.width,
    height: sprite.height,
    rows: sprite.rows.map((row) =>
      row
        .split('')
        .map((ch) => swap[ch] ?? ch)
        .join(''),
    ),
  }
}

/** Swaps the steel palette characters for another material's. */
export function recolour(sprite: Sprite, tier: Tier): Sprite {
  const { body, edge, grip } = TIER_COLOURS[tier]
  return mapColours(sprite, { m: body, M: body, w: edge, y: grip })
}

/** Mirrors a sprite vertically, so an up-pointing blade is free. */
export function flipVertical(sprite: Sprite): Sprite {
  return { width: sprite.width, height: sprite.height, rows: [...sprite.rows].reverse() }
}

/** Mirrors a sprite horizontally, so left-facing art is free. */
export function mirror(sprite: Sprite): Sprite {
  return {
    width: sprite.width,
    height: sprite.height,
    rows: sprite.rows.map((row) => row.split('').reverse().join('')),
  }
}

const S = (rows: SpriteRows) => defineSprite(16, 16, rows)
const S8 = (rows: SpriteRows) => defineSprite(8, 8, rows)

// --- the hero -------------------------------------------------------------
//
// Drawn in the visual language of the 1986 NES top-down adventure hero — the
// pointed green cap, the tunic, the shield carried in front, the chunky 16x16
// proportions and the same small palette — but drawn from scratch here rather
// than reproducing anyone else's sprite data.

const HERO_DOWN_A = S([
  '.......kk.......',
  '......kggk......',
  '.....kggggk.....',
  '....kgggggggk...',
  '...kgggggggggk..',
  '...khhhhhhhhhk..',
  '...ksssssssssk..',
  '...kssksskssk...',
  '...ksssssssssk..',
  '....kssssssk....',
  '..kmkgggggggk...',
  '..kmmkggggggk...',
  '..kmmkgGGGGgk...',
  '..kmkgggggggk...',
  '...kddkkkddk....',
  '....kk...kk.....',
])

const HERO_DOWN_B = S([
  '.......kk.......',
  '......kggk......',
  '.....kggggk.....',
  '....kgggggggk...',
  '...kgggggggggk..',
  '...khhhhhhhhhk..',
  '...ksssssssssk..',
  '...kssksskssk...',
  '...ksssssssssk..',
  '....kssssssk....',
  '..kmkgggggggk...',
  '..kmmkggggggk...',
  '..kmmkgGGGGgk...',
  '..kmkgggggggk...',
  '....kddkkddk....',
  '.....kk.kk......',
])

const HERO_UP_A = S([
  '.......kk.......',
  '......kggk......',
  '.....kggggk.....',
  '....kgggggggk...',
  '...kgggggggggk..',
  '...kgggggggggk..',
  '...khhhhhhhhhk..',
  '...khhhhhhhhhk..',
  '....khhhhhhhk...',
  '.....khhhhhk....',
  '...kgggggggkmk..',
  '...kggggggkmmk..',
  '...kgGGGGgkmmk..',
  '...kgggggggkmk..',
  '...kddkkkddk....',
  '....kk...kk.....',
])

const HERO_UP_B = S([
  '.......kk.......',
  '......kggk......',
  '.....kggggk.....',
  '....kgggggggk...',
  '...kgggggggggk..',
  '...kgggggggggk..',
  '...khhhhhhhhhk..',
  '...khhhhhhhhhk..',
  '....khhhhhhhk...',
  '.....khhhhhk....',
  '...kgggggggkmk..',
  '...kggggggkmmk..',
  '...kgGGGGgkmmk..',
  '...kgggggggkmk..',
  '....kddkkddk....',
  '.....kk.kk......',
])

const HERO_RIGHT_A = S([
  '................',
  '..kk............',
  '.kggkk..........',
  '.kggggkk........',
  '.kgggggggk......',
  '..kgggggggk.....',
  '..khhhhssssk....',
  '..khhhsskskk....',
  '...khhssssk.....',
  '....khsssk......',
  '....kggggkmk....',
  '....kgggkmmk....',
  '....kgGGkmmk....',
  '....kggggkmk....',
  '....kddkddk.....',
  '....kkk.kkk.....',
])

const HERO_RIGHT_B = S([
  '................',
  '..kk............',
  '.kggkk..........',
  '.kggggkk........',
  '.kgggggggk......',
  '..kgggggggk.....',
  '..khhhhssssk....',
  '..khhhsskskk....',
  '...khhssssk.....',
  '....khsssk......',
  '....kggggkmk....',
  '....kgggkmmk....',
  '....kgGGkmmk....',
  '....kggggkmk....',
  '.....kddddk.....',
  '.....kkkkk......',
])

// --- enemies --------------------------------------------------------------

/** Shooter: squat, spits stones. */
const SHOOTER_A = S([
  '................',
  '................',
  '.....kkkkkk.....',
  '....keeeeeek....',
  '...keeeeeeeek...',
  '..keewkeekweek..',
  '..keewkeekweek..',
  '..keeeeeeeeeek..',
  '..keeEEeeEEeek..',
  '..keeeeeeeeeek..',
  '...keeeeeeeek...',
  '....kEEkkEEk....',
  '.....kkkkkk.....',
  '................',
  '................',
  '................',
])

const SHOOTER_B = S([
  '................',
  '................',
  '................',
  '.....kkkkkk.....',
  '....keeeeeek....',
  '...keewkkweek...',
  '...keewkkweek...',
  '...keeeeeeeek...',
  '...keeEEEEeek...',
  '...keeeeeeeek...',
  '....keeeeeek....',
  '...kEEkkkkEEk...',
  '...kkk....kkk...',
  '................',
  '................',
  '................',
])

/** Chaser: heavy brute with a club. */
const CHASER_A = S([
  '................',
  '......kkkk......',
  '.....kpppdk.....',
  '....kppppppk....',
  '....kpwppwpk....',
  '....kppkkppk....',
  '....kpppppppk...',
  '...kkppppppkk...',
  '..kpppppppppk...',
  '..kppRRRRppppk..',
  '..kppppppppppk..',
  '...kpppppppk....',
  '....kppkkppk....',
  '....kkk..kkk....',
  '................',
  '................',
])

const CHASER_B = S([
  '................',
  '......kkkk......',
  '.....kpppdk.....',
  '....kppppppk....',
  '....kpwppwpk....',
  '....kppkkppk....',
  '....kpppppppk...',
  '...kkppppppkk...',
  '...kpppppppppk..',
  '..kppppRRRRppk..',
  '..kppppppppppk..',
  '....kpppppppk...',
  '....kppkkppk....',
  '.....kkk.kkk....',
  '................',
  '................',
])

/** Flyer: erratic bat. */
const FLYER_A = S([
  '................',
  '................',
  '..kk........kk..',
  '.kzzk......kzzk.',
  'kzzzzk....kzzzzk',
  'kzzzzzkkkkzzzzzk',
  '.kzzzkzzzzkzzzk.',
  '..kkkkzrrzkkkk..',
  '.....kzzzzk.....',
  '......kzzk......',
  '.......kk.......',
  '................',
  '................',
  '................',
  '................',
  '................',
])

const FLYER_B = S([
  '................',
  '......kkkk......',
  '.....kzzzzk.....',
  '..kkkzzzzzzkkk..',
  '.kzzkzzzzzzkzzk.',
  'kzzzzkzrrzkzzzzk',
  'kzzzzzkzzkzzzzzk',
  '.kkkk..kk..kkkk.',
  '................',
  '................',
  '................',
  '................',
  '................',
  '................',
  '................',
  '................',
])

/** Caster: a hooded thing that blinks about and throws magic through walls. */
const CASTER_A = S([
  '................',
  '......kkkk......',
  '.....kbbbbk.....',
  '....kbbbbbbk....',
  '....kbwbbwbk....',
  '....kbbbbbbk....',
  '...kbbbbbbbbk...',
  '...kbBBBBBBbk...',
  '..kbbBBccBBbbk..',
  '..kbbBBccBBbbk..',
  '..kbbBBBBBBbbk..',
  '...kbbbbbbbbk...',
  '...kkbbbbbbkk...',
  '.....kkkkkk.....',
  '................',
  '................',
])

const CASTER_B = S([
  '................',
  '......kkkk......',
  '.....kbbbbk.....',
  '....kbbbbbbk....',
  '....kbcbbcbk....',
  '....kbbbbbbk....',
  '...kbbbbbbbbk...',
  '..kbbBBBBBBbbk..',
  '..kbBBBccBBBbk..',
  '.kbbBBcwwcBBbbk.',
  '..kbBBBccBBBbk..',
  '..kbbBBBBBBbbk..',
  '...kkbbbbbbkk...',
  '.....kkkkkk.....',
  '................',
  '................',
])

const BOMB = S8([
  '...kk...',
  '..kddk..',
  '.kddddk.',
  'kdddddkk',
  'kdddddk.',
  'kdddddk.',
  '.kdddk..',
  '..kkk...',
])

const BOMB_LIT = S8([
  '...kr...',
  '..kokk..',
  '.kwwwwk.',
  'kwwwwwkk',
  'kwwwwwk.',
  'kdddddk.',
  '.kdddk..',
  '..kkk...',
])

const EXPLOSION = S([
  '................',
  '...k..kwwk..k...',
  '..kok.kwwk.kok..',
  '.kowk.kyyk.kwok.',
  '..kok.koook.ok..',
  'k..k.kowwok.k..k',
  'wkkkkowwwwokkkkw',
  'wwooowwwwwwooo ww',
  'wwooowwwwwwooo ww',
  'wkkkkowwwwokkkkw',
  'k..k.kowwok.k..k',
  '..kok.koook.ok..',
  '.kowk.kyyk.kwok.',
  '..kok.kwwk.kok..',
  '...k..kwwk..k...',
  '................',
])

const FLAME = S8([
  '...kk...',
  '..kyyk..',
  '.kyoyk..',
  'kyoowyk.',
  'kyoowyk.',
  'kyooryk.',
  '.kyrrk..',
  '..kkk...',
])

/** Boss: a horned guardian, twice the size of anything else. */
const BOSS_A = defineSprite(32, 32, [
  '................................',
  '....kk......................kk..',
  '...kRRk....kkkkkkkkkk......kRRk.',
  '...kRRRk..kRRRRRRRRRRk....kRRRk.',
  '....kRRRkkRRRRRRRRRRRRkkkRRRk...',
  '.....kRRRRRRRRRRRRRRRRRRRRRk....',
  '......kRRRRRRRRRRRRRRRRRRRk.....',
  '.....kRRRRwwwkRRRRkwwwRRRRRk....',
  '.....kRRRRwykkRRRRkkywRRRRRk....',
  '.....kRRRRwwwkRRRRkwwwRRRRRk....',
  '.....kRRRRRRRRRRRRRRRRRRRRRk....',
  '.....kRRRRkkkkkkkkkkkkRRRRRk....',
  '......kRRRkwwwwwwwwwwkRRRRk.....',
  '......kRRRRkkkkkkkkkkRRRRk......',
  '.......kRRRRRRRRRRRRRRRRk.......',
  '......kRRRRRRRRRRRRRRRRRRk......',
  '.....kRRRRRRRRRRRRRRRRRRRRk.....',
  '....kRRRRRRRRRRRRRRRRRRRRRRk....',
  '...kRRRRRRRRRRRRRRRRRRRRRRRRk...',
  '...kRRRRkkRRRRRRRRRRRRkkRRRRk...',
  '...kRRRk..kRRRRRRRRRRk..kRRRk...',
  '...kRRk....kRRRRRRRRk....kRRk...',
  '...kRk......kRRRRRRk......kRk...',
  '...kk.......kRRRRRRk.......kk...',
  '............kRRRRRRk............',
  '...........kRRRRRRRRk...........',
  '..........kRRRRkkRRRRk..........',
  '.........kRRRRk..kRRRRk.........',
  '.........kRRRk....kRRRk.........',
  '.........kkkk......kkkk.........',
  '................................',
  '................................',
])

// --- pickups and props ----------------------------------------------------

const RUPEE = S8([
  '..kkkk..',
  '.kcccck.',
  'kcggggck',
  'kcggggck',
  'kcggggck',
  '.kcggck.',
  '..kggk..',
  '...kk...',
])

const RUPEE_BLUE = S8([
  '..kkkk..',
  '.kcccck.',
  'kcbbbbck',
  'kcbbbbck',
  'kcbbbbck',
  '.kcbbck.',
  '..kbbk..',
  '...kk...',
])

const HEART = S8([
  '.kk..kk.',
  'krrkkrrk',
  'krrrrrrk',
  'krrrrrrk',
  '.krrrrk.',
  '..krrk..',
  '...kk...',
  '........',
])

const CHEST_CLOSED = S([
  '................',
  '................',
  '..kkkkkkkkkkkk..',
  '..knnnnnnnnnnk..',
  '..knyyyyyyyynk..',
  '..knnnnnnnnnnk..',
  '..kkkkkkkkkkkk..',
  '..kddddddddddk..',
  '..kdddkyykdddk..',
  '..kdddkyykdddk..',
  '..kddddddddddk..',
  '..kddddddddddk..',
  '..kkkkkkkkkkkk..',
  '................',
  '................',
  '................',
])

const CHEST_OPEN = S([
  '................',
  '..kkkkkkkkkkkk..',
  '..knnnnnnnnnnk..',
  '..kzzzzzzzzzzk..',
  '..kzzzzzzzzzzk..',
  '..kkkkkkkkkkkk..',
  '................',
  '..kdddddddddk...',
  '..kdyyyyyyydk...',
  '..kdyyyyyyydk...',
  '..kddddddddddk..',
  '..kkkkkkkkkkkk..',
  '................',
  '................',
  '................',
  '................',
])

/** The shopkeeper, and the old scribe who guards the seals. */
const SHOPKEEPER = S([
  '................',
  '......kkkk......',
  '.....kwwwwk.....',
  '....kwwwwwwk....',
  '....kssssssk....',
  '....kskssksk....',
  '....ksssssssk...',
  '.....kxxxxk.....',
  '....kbbbbbbk....',
  '...kbbBBBBbbk...',
  '...sbbbbbbbbs...',
  '...kbbbbbbbbk...',
  '....kbbbbbbk....',
  '.....kkkkkk.....',
  '.....kd..dk.....',
  '.....kk..kk.....',
])

const SCRIBE = S([
  '................',
  '......kkkk......',
  '.....kxxxxk.....',
  '....kxxxxxxk....',
  '....kssssssk....',
  '....kskssksk....',
  '....ksssssssk...',
  '.....kxxxxk.....',
  '....kppppppk....',
  '...kppyyyyppk...',
  '...xppppppppx...',
  '...kppppppppk...',
  '....kppppppk....',
  '.....kkkkkk.....',
  '.....kd..dk.....',
  '.....kk..kk.....',
])

/** A stone slab carved with runes: the sealed gate the child must open. */
const SEAL = S([
  '.kkkkkkkkkkkkkk.',
  'kMMMMMMMMMMMMMMk',
  'kMcccMMMMcccMMMk',
  'kMcMcMMMMcMMMMMk',
  'kMcccMMMMcccMMMk',
  'kMMMMMMMMMMMMMMk',
  'kMMcccMMcccMMMMk',
  'kMMcMMMMcMcMMMMk',
  'kMMcccMMcccMMMMk',
  'kMMMMMMMMMMMMMMk',
  'kMcccMMcccMMMMMk',
  'kMcMMMMcMcMMMMMk',
  'kMcccMMcccMMMMMk',
  'kMMMMMMMMMMMMMMk',
  'kMMMMMMMMMMMMMMk',
  '.kkkkkkkkkkkkkk.',
])

/**
 * The sword, pointing away from the hero: grip, crossguard, tapering blade.
 * It used to be drawn as a plain white rectangle, which read as a fridge.
 */
const SWORD_RIGHT = defineSprite(16, 8, [
  '...k............',
  '...k............',
  '.kykkkkkkkkkkk..',
  'kyykkmmmmmmmmwk.',
  'kyykkmmmmmmmmmwk',
  '.kykkkkkkkkkkk..',
  '...k............',
  '...k............',
])

const SWORD_DOWN = defineSprite(8, 16, [
  '..kyyk..',
  '..kyyk..',
  'kkkkkkkk',
  '.kmmmmk.',
  '.kmmmmk.',
  '.kmmmmk.',
  '.kmmmmk.',
  '.kmwwmk.',
  '.kmwwmk.',
  '.kmwwmk.',
  '.kmwwmk.',
  '.kmwwmk.',
  '..kwwk..',
  '..kwwk..',
  '...kk...',
  '........',
])

const PROJECTILE = S8([
  '..kkkk..',
  '.kMMMMk.',
  'kMMwwMMk',
  'kMwwwwMk',
  'kMwwwwMk',
  'kMMwwMMk',
  '.kMMMMk.',
  '..kkkk..',
])

const MAGIC_BOLT = S8([
  '...kk...',
  '..kcck..',
  '.kccwck.',
  'kccwwcck',
  'kccwwcck',
  '.kccwck.',
  '..kcck..',
  '...kk...',
])

// --- things the shops sell ------------------------------------------------
//
// Drawn in steel so `recolour` can make each one wood, bronze, gold or magic,
// the same way the swords are done. The shop draws these beside every line so
// a nine-year-old can tell a shield from a candle without reading first.

/**
 * The sword as an item rather than as a swing. The in-world blade is eight
 * pixels across so it fits a tile, which on a shelf reads as a stick; held
 * diagonally it reads as a sword.
 */
const SWORD_ICON = S([
  '.............kk.',
  '............kwk.',
  '...........kwmk.',
  '..........kwmk..',
  '.........kwmk...',
  '........kwmk....',
  '.......kwmk.....',
  '..k...kwmk......',
  '.kyk.kwmk.......',
  'kyyykwmk........',
  '.kyykmk.........',
  '..kykk..........',
  '.kykk...........',
  'kyk.............',
  'kk..............',
  '................',
])

const SHIELD = S([
  '..kkkkkkkkkkkk..',
  '.kMMMMMMMMMMMMk.',
  'kMwwwwwwwwwwwwMk',
  'kMwmmmmmmmmmmwMk',
  'kMwmmmmyymmmmwMk',
  'kMwmmmyyyymmmwMk',
  'kMwmmyyYYyymmwMk',
  'kMwmmyyYYyymmwMk',
  'kMwmmmyyyymmmwMk',
  'kMwmmmmyymmmmwMk',
  'kMwmmmmmmmmmmwMk',
  '.kMwmmmmmmmmwMk.',
  '.kMMwmmmmmmwMMk.',
  '..kMMwwmmwwMMk..',
  '...kkMMwwMMkk...',
  '.....kkkkkk.....',
])

const CANDLE = S([
  '................',
  '.......k........',
  '......kyk.......',
  '.....kywyk......',
  '.....kywyk......',
  '......kyk.......',
  '.......k........',
  '....kkkkkk......',
  '....kbbbbk......',
  '....kbwwbk......',
  '....kbbbbk......',
  '....kbwwbk......',
  '....kbbbbk......',
  '...kkBBBBkk.....',
  '...kBBBBBBk.....',
  '...kkkkkkkk.....',
])

const BAIT = S([
  '................',
  '......kkkk......',
  '....kkrrrrkk....',
  '...krrrrrrrrk...',
  '..krrrrrrrrrrk..',
  '..krrRRrrrrrrk..',
  '..krrRRrrrrrrk..',
  '..krrrrrrrrrrk..',
  '..kRRrrrrrrRRk..',
  '...kRRRRRRRRk...',
  '....kkxxxxkk....',
  '......kxxk......',
  '......kxxk......',
  '.....kkxxkk.....',
  '.....kxxxxk.....',
  '......kkkk......',
])

const BOW = S([
  '.....kkkk.......',
  '....knnnnk......',
  '...knnkkwk......',
  '...knk..w.......',
  '..knk...w.......',
  '..knk...w.......',
  '..knk...w.......',
  '..knk...w.......',
  '..knk...w.......',
  '..knk...w.......',
  '..knk...w.......',
  '..knk...w.......',
  '...knk..w.......',
  '...knnkkwk......',
  '....knnnnk......',
  '.....kkkk.......',
])

const ARROW = S([
  '.......kk.......',
  '......kwwk......',
  '.....kwwwwk.....',
  '....kwwkkwwk....',
  '...kwwk..kwwk...',
  '...kkk.kk.kkk...',
  '.......nn.......',
  '.......nn.......',
  '.......nn.......',
  '.......nn.......',
  '.......nn.......',
  '.....k.nn.k.....',
  '....kw.nn.wk....',
  '...kww.nn.wwk...',
  '...kw..nn..wk...',
  '.......kk.......',
])

/**
 * An arrow in flight, and the blaster's bolt.
 *
 * Drawn pointing right and down; the other two directions are the mirror and
 * the flip, the way the sword is done. The icon on the shop shelf is a
 * different drawing: a bundle standing on end reads as ammunition, and an
 * arrow crossing the screen has to read as one thing moving fast.
 */
const ARROW_FLY_RIGHT = defineSprite(16, 8, [
  '................',
  '..w.........k...',
  '.ww.........kw..',
  'wwwnnnnnnnnnnwwk',
  '.ww.........kw..',
  '..w.........k...',
  '................',
  '................',
])

const ARROW_FLY_DOWN = defineSprite(8, 16, [
  '..w..w..',
  '..w..w..',
  '..wnnw..',
  '...nn...',
  '...nn...',
  '...nn...',
  '...nn...',
  '...nn...',
  '...nn...',
  '...nn...',
  '..knnk..',
  '.kwwwwk.',
  '..kwwk..',
  '...kk...',
  '........',
  '........',
])

const BOLT_RIGHT = defineSprite(16, 8, [
  '................',
  '................',
  '.....ccccccc....',
  '..cccwwwwwwwcc..',
  '..cccwwwwwwwcc..',
  '.....ccccccc....',
  '................',
  '................',
])

const BOLT_DOWN = defineSprite(8, 16, [
  '........',
  '........',
  '..cccc..',
  '.cwwwwc.',
  '.cwwwwc.',
  '.cwwwwc.',
  '.cwwwwc.',
  '.cwwwwc.',
  '.cwwwwc.',
  '.cwwwwc.',
  '.cwwwwc.',
  '..cccc..',
  '........',
  '........',
  '........',
  '........',
])

const WINGS = S([
  '................',
  '...kk......kk...',
  '..kwwk....kwwk..',
  '.kwwwwk..kwwwwk.',
  'kwwwwwwkkwwwwwwk',
  'kwwwwwwkkwwwwwwk',
  'kwwwwwwkkwwwwwwk',
  'kwwwwwwkkwwwwwwk',
  'kMwwwwwkkwwwwwMk',
  '.kMwwwwkkwwwwMk.',
  '..kMwwwkkwwwMk..',
  '...kMwwkkwwMk...',
  '....kMwkkwMk....',
  '.....kMkkMk.....',
  '......kkkk......',
  '................',
])

/**
 * The animals from the pet cave, and the food that makes one fierce.
 *
 * Six of them, drawn to be told apart at a glance from three feet away rather
 * than admired up close: the silhouette does the work — the rabbit's ears, the
 * roo standing up, the goat's horns, the wombat low and wide — and the colour
 * confirms it. All face right, and the world flips them to face left.
 */
const DOG_A = S([
  '................',
  '................',
  '................',
  '..kk............',
  '..knk.....k..k..',
  '..knk....knkknk.',
  '..knkkkkknnnnnk.',
  '..knnnnnnnnwwnk.',
  '.knnnnnnnnnnnnk.',
  '.knnnnnnnnnnnk..',
  '..kknnnnnnnnkk..',
  '...kkkkkkkkkk...',
  '...k.kn.kn.k....',
  '...k.kk.kk.k....',
  '................',
  '................',
])

const DOG_B = S([
  '................',
  '................',
  '................',
  '...kk...........',
  '..knk.....k..k..',
  '..knk....knkknk.',
  '..knkkkkknnnnnk.',
  '..knnnnnnnnwwnk.',
  '.knnnnnnnnnnnnk.',
  '.knnnnnnnnnnnk..',
  '..kknnnnnnnnkk..',
  '...kkkkkkkkkk...',
  '...kn.kk.kn.k...',
  '...kk.kk.kk.k...',
  '................',
  '................',
])

const CAT_A = S([
  '................',
  '...kkk..........',
  '..kokk..........',
  '..kok....k..k...',
  '..kok...kokokok.',
  '..kok..kooooook.',
  '..kokkkkoowwook.',
  '..koooooooowook.',
  '..kyoyoyooooook.',
  '..koooooooooook.',
  '..kkooooooookk..',
  '...kkkkkkkkkk...',
  '...k.ko.ko.k....',
  '...k.kk.kk.k....',
  '................',
  '................',
])

const CAT_B = S([
  '..kkk...........',
  '..kok...........',
  '..kok...........',
  '..kok....k..k...',
  '..kok...kokokok.',
  '..kok..kooooook.',
  '..kokkkkoowwook.',
  '..koooooooowook.',
  '..kyoyoyooooook.',
  '..koooooooooook.',
  '..kkooooooookk..',
  '...kkkkkkkkkk...',
  '...ko.kk.ko.k...',
  '...kk.kk.kk.k...',
  '................',
  '................',
])

const RABBIT_A = S([
  '........kkk.kkk.',
  '........kwk.kwk.',
  '........kwk.kwk.',
  '........kwkkkwk.',
  '..kk.....kwwwwk.',
  '.kwwk...kwwwwwwk',
  '.kwwkkkkwwwwkwwk',
  '..kwwwwwwwwwwwk.',
  '..kwwwwwwwwwwk..',
  '..kwwwwwwwwwwk..',
  '..kkwwwwwwwwkk..',
  '...kkkkkkkkkk...',
  '...k.kw.kw.k....',
  '...k.kk.kk.k....',
  '................',
  '................',
])

/**
 * Mid-hop: ears laid back, legs tucked under. Drawn in the same box as the
 * frame above it — the height comes from the world lifting it off the ground,
 * not from the art, so the shadow can stay behind on the grass.
 */
const RABBIT_B = S([
  '........kkk.kkk.',
  '........kwk.kwk.',
  '........kwk.kwk.',
  '........kwkkkwk.',
  '...kk....kwwwwk.',
  '..kwwk..kwwwwwwk',
  '..kwwkkkwwwwkwwk',
  '..kwwwwwwwwwwwk.',
  '..kwwwwwwwwwwk..',
  '..kwwwwwwwwwwk..',
  '..kkwwwwwwwwkk..',
  '...kkkkkkkkkk...',
  '....kwwkkwwk....',
  '.....kkkkkk.....',
  '................',
  '................',
])

const WOMBAT_A = S([
  '................',
  '................',
  '................',
  '..........k..k..',
  '.........kdkkdk.',
  '....kkkkkddddddk',
  '..kkdddddddwddk.',
  '.kddddddddddddk.',
  '.kddddddddddddk.',
  '.kdddddddddddk..',
  '..kkddddddddkk..',
  '...kkkkkkkkkk...',
  '...k.kd.kd.k....',
  '...k.kk.kk.k....',
  '................',
  '................',
])

const WOMBAT_B = S([
  '................',
  '................',
  '................',
  '..........k..k..',
  '.........kdkkdk.',
  '....kkkkkddddddk',
  '..kkdddddddwddk.',
  '.kddddddddddddk.',
  '.kddddddddddddk.',
  '.kdddddddddddk..',
  '..kkddddddddkk..',
  '...kkkkkkkkkk...',
  '...kd.kk.kd.k...',
  '...kk.kk.kk.k...',
  '................',
  '................',
])

const KANGAROO_A = S([
  '.........k..k...',
  '.........khkhk..',
  '.........khhhk..',
  '.........khwhk..',
  '.........khhhk..',
  '..........khk...',
  '.......kkhhhk...',
  '.kk..khhhhhhk...',
  '.khkkhssshhk....',
  '..khhhssshk.....',
  '...khhhhhk......',
  '....khhhk.......',
  '....khhhkk......',
  '....kkkhhk......',
  '......kkkk......',
  '................',
])

/** Mid-bound: tail out straight behind, feet folded up under it. */
const KANGAROO_B = S([
  '.........k..k...',
  '.........khkhk..',
  '.........khhhk..',
  '.........khwhk..',
  '.........khhhk..',
  '..........khk...',
  '.......kkhhhk...',
  'kkk..khhhhhhk...',
  'khhkkhssshhk....',
  '.kkhhhssshk.....',
  '...khhhhhk......',
  '....khhhkk......',
  '....kkhhhk......',
  '.....kkkkk......',
  '................',
  '................',
])

const GOAT_A = S([
  '................',
  '..........k.k...',
  '.........k.k....',
  '........kxkkxk..',
  '.........kxxxk..',
  '..kk.....kxxxxk.',
  '.kxxkkkkkxxkxxk.',
  '.kxxxxxxxxxxxxk.',
  '..kxxxxxxxxxxk..',
  '..kxxxxxxxxxxk..',
  '..kkxxxxxxxxkk..',
  '...kkkkkkkkkk...',
  '...k.kx.kx.k....',
  '...k.kk.kk.k....',
  '................',
  '................',
])

const GOAT_B = S([
  '................',
  '..........k.k...',
  '.........k.k....',
  '........kxkkxk..',
  '.........kxxxk..',
  '...kk....kxxxxk.',
  '..kxxkkkkxxkxxk.',
  '.kxxxxxxxxxxxxk.',
  '..kxxxxxxxxxxk..',
  '..kxxxxxxxxxxk..',
  '..kkxxxxxxxxkk..',
  '...kkkkkkkkkk...',
  '...kx.kk.kx.k...',
  '...kk.kk.kk.k...',
  '................',
  '................',
])

/** The vanishing potion: a round flask of something purple, corked. */
const POTION = S([
  '................',
  '.....kkkk.......',
  '.....kcck.......',
  '.....kcck.......',
  '....kkcckk......',
  '....kcccck......',
  '...kcppppck.....',
  '...kppppppk.....',
  '..kcpppppppk....',
  '..kppppppppk....',
  '..kppwppppwk....',
  '..kpppppppppk...',
  '..kppppppppk....',
  '...kkkkkkkk.....',
  '................',
  '................',
])

/** A sack of feed, tied at the neck, with a bone stamped on the side. */
const ANIMAL_FOOD = S([
  '................',
  '................',
  '.....kkkkkk.....',
  '....knnkknnk....',
  '...knnnnnnnnk...',
  '..knnnnnnnnnnk..',
  '..knwwwwwwwwnk..',
  '..knwkwwwwkwnk..',
  '..knwkkkkkkwnk..',
  '..knwkwwwwkwnk..',
  '..knwwwwwwwwnk..',
  '..knnnnnnnnnnk..',
  '..knnnnnnnnnnk..',
  '..kkkkkkkkkkkk..',
  '................',
  '................',
])

/** The map: a sheet of parchment with a coastline and a marked spot on it. */
const MAP = S([
  '................',
  '..kkkkkkkkkkkk..',
  '.kxxxxxxxxxxxxk.',
  '.kxwwwwwwwwwwxk.',
  '.kxwwnnwwwwwwxk.',
  '.kxwnnnnnwwwwxk.',
  '.kxwwnnnnnnwwxk.',
  '.kxwwwnnnnnwwxk.',
  '.kxwwwnnnnwwwxk.',
  '.kxwwwwnnwwrwxk.',
  '.kxwwwwwwwwwwxk.',
  '.kxwwwwwwwwwwxk.',
  '.kxxxxxxxxxxxxk.',
  '..kkkkkkkkkkkk..',
  '................',
  '................',
])

const RING = S([
  '................',
  '.......kk.......',
  '......kbbk......',
  '.....kbwwbk.....',
  '......kbbk......',
  '....kkyyyykk....',
  '...kyyYYYYyyk...',
  '..kyyk....kyyk..',
  '..kyk......kyk..',
  '..kyk......kyk..',
  '..kyyk....kyyk..',
  '...kyyYYYYyyk...',
  '....kkyyyykk....',
  '................',
  '................',
  '................',
])

const TUNIC = S([
  '..kkk......kkk..',
  '.kgggk....kgggk.',
  '.kggggkkkkggggk.',
  '.kggggggggggggk.',
  '.kggggggggggggk.',
  '.kgGggggggggGgk.',
  '.kgGggggggggGgk.',
  '.kggggggggggggk.',
  '.kddddddddddddk.',
  '.kddyyddddyyddk.',
  '.kddddddddddddk.',
  '.kggggggggggggk.',
  '.kggggggggggggk.',
  '.kggggggggggggk.',
  '..kkkkkkkkkkkk..',
  '................',
])

// --- the future -----------------------------------------------------------
//
// Level 2 is the same game in a sky-ship a thousand years on, and everything
// he meets there is drawn in the same sixteen-pixel language as the land:
// same outlines, same palette, same proportions. The robots stand where the
// monsters stood; the animals are half chrome; the hero keeps his face.

/** Turret drone: the shooter, hovering on a ring of light. */
const DRONE_A = S([
  '................',
  '......kkkk......',
  '.....kmmmmk.....',
  '....kmmrrmmk....',
  '...kmmmrrmmmk...',
  '..kMmmmmmmmMk...',
  '..kMMMMMMMMMk...',
  '...kkkkkkkkk....',
  '....kcccccck....',
  '.....kkkkkk.....',
  '................',
  '................',
  '................',
  '................',
  '................',
  '................',
])

const DRONE_B = S([
  '................',
  '................',
  '......kkkk......',
  '.....kmmmmk.....',
  '....kmmrrmmk....',
  '...kmmmrrmmmk...',
  '..kMmmmmmmmMk...',
  '..kMMMMMMMMMk...',
  '...kkkkkkkkk....',
  '.....kcccck.....',
  '......kkkk......',
  '................',
  '................',
  '................',
  '................',
  '................',
])

/** Crusher: the chaser, a boxy heavy with hazard stripes and a piston arm. */
const CRUSHER_A = S([
  '................',
  '....kkkkkkkk....',
  '...kMMMMMMMMk...',
  '...kMrrMMrrMk...',
  '...kMMMMMMMMk...',
  '..kkMMMMMMMMkk..',
  '.kMkoMoMoMoMkMk.',
  '.kMkMoMoMoMokMk.',
  '.kMkMMMMMMMMkMk.',
  '.kkkMMMMMMMMkkk.',
  '...kMMMkkMMMk...',
  '...kMMMk.kMMk...',
  '...kkkk..kkkk...',
  '................',
  '................',
  '................',
])

const CRUSHER_B = S([
  '................',
  '....kkkkkkkk....',
  '...kMMMMMMMMk...',
  '...kMrrMMrrMk...',
  '...kMMMMMMMMk...',
  '..kkMMMMMMMMkk..',
  '.kMkMoMoMoMokMk.',
  '.kMkoMoMoMoMkMk.',
  '.kMkMMMMMMMMkMk.',
  '.kkkMMMMMMMMkkk.',
  '...kMMkMMkMMk...',
  '....kMk..kMk....',
  '....kkk..kkk....',
  '................',
  '................',
  '................',
])

/** Hover disc: the flyer, a saucer that drifts over anything. */
const DISC_A = S([
  '................',
  '................',
  '......kkkk......',
  '.....kcccck.....',
  '..kkkkmmmmkkkk..',
  '.kmmmmmmmmmmmmk.',
  'kmmmmmmrrmmmmmmk',
  '.kMMMMMMMMMMMMk.',
  '..kkkkkkkkkkkk..',
  '....kc....ck....',
  '................',
  '................',
  '................',
  '................',
  '................',
  '................',
])

const DISC_B = S([
  '................',
  '................',
  '................',
  '......kkkk......',
  '.....kcccck.....',
  '..kkkkmmmmkkkk..',
  '.kmmmmmmmmmmmmk.',
  'kmmmmmmrrmmmmmmk',
  '.kMMMMMMMMMMMMk.',
  '..kkkkkkkkkkkk..',
  '.....kc..ck.....',
  '................',
  '................',
  '................',
  '................',
  '................',
])

/** Glitch unit: the caster, a floating core that blinks about and throws lightning. */
const GLITCH_A = S([
  '................',
  '......kkkk......',
  '.....kBBBBk.....',
  '....kBbbbbBk....',
  '....kBbccbBk....',
  '...kBbbccbbBk...',
  '...kBbcwwcbBk...',
  '...kBbcwwcbBk...',
  '...kBbbccbbBk...',
  '....kBbccbBk....',
  '....kBbbbbBk....',
  '.....kBBBBk.....',
  '......kkkk......',
  '.......c.c......',
  '................',
  '................',
])

const GLITCH_B = S([
  '................',
  '......kkkk......',
  '.....kBBBBk.....',
  '....kBbbbbBk....',
  '..c.kBbccbBk.c..',
  '...kBbbccbbBk...',
  '...kBbcwwcbBk...',
  '...kBbcwwcbBk...',
  '...kBbbccbbBk...',
  '....kBbccbBk....',
  '....kBbbbbBk....',
  '.....kBBBBk.....',
  '......kkkk......',
  '................',
  '................',
  '................',
])

/** The mech: a walking guardian of the rocks, twice the size of anything else. */
const MECH_A = defineSprite(32, 32, [
  '................................',
  '...kk......................kk...',
  '..kmmk....kkkkkkkkkkkk....kmmk..',
  '..kmmmk..kMMMMMMMMMMMMk..kmmmk..',
  '...kmmmkkMMMMMMMMMMMMMMkkmmmk...',
  '....kmmmMMMMrrrrrrrrMMMMmmmk....',
  '.....kMMMMMMrkkkkkkrMMMMMMk.....',
  '.....kMMMMMMrkccccKrMMMMMMk.....',
  '.....kMMMMMMrkccccKrMMMMMMk.....',
  '.....kMMMMMMrkkkkkkrMMMMMMk.....',
  '.....kMMMMMMrrrrrrrrMMMMMMk.....',
  '.....kMMkkkkkkkkkkkkkkkkMMk.....',
  '......kMkoMoMoMoMoMoMokMk.......',
  '......kMkMoMoMoMoMoMoMkMk.......',
  '.......kkkkkkkkkkkkkkkkk........',
  '......kMMMMMMMMMMMMMMMMMk.......',
  '.....kMMMMMMMMMMMMMMMMMMMk......',
  '....kMMMMMMMMMMMMMMMMMMMMMk.....',
  '...kMMMMMMMMMMMMMMMMMMMMMMMk....',
  '...kMMMMkkMMMMMMMMMMMMkkMMMMk...',
  '...kMMMk..kMMMMMMMMMMk..kMMMk...',
  '...kMMk....kMMMMMMMMk....kMMk...',
  '...kMk......kMMMMMMk......kMk...',
  '...kk.......kMMMMMMk.......kk...',
  '............kMMMMMMk............',
  '...........kMMMMMMMMk...........',
  '..........kMMMMkkMMMMk..........',
  '.........kMMMMk..kMMMMk.........',
  '.........kMMMk....kMMMk.........',
  '.........kkkk......kkkk.........',
  '................................',
  '................................',
])

/**
 * The mech's second frame: it takes a step.
 *
 * The arms drop a row and the legs pull in under the body, so the thing rocks
 * from side to side as it comes at you. The first frame was the only one there
 * was, which meant four bosses that stood perfectly still while walking.
 */
const MECH_B = defineSprite(32, 32, [
  '................................',
  '................................',
  '...kk......................kk...',
  '..kmmk....kkkkkkkkkkkk....kmmk..',
  '..kmmmk..kMMMMMMMMMMMMk..kmmmk..',
  '...kmmmkkMMMMMMMMMMMMMMkkmmmk...',
  '....kmmmMMMMrrrrrrrrMMMMmmmk....',
  '.....kMMMMMMrkkkkkkrMMMMMMk.....',
  '.....kMMMMMMrkccccKrMMMMMMk.....',
  '.....kMMMMMMrkccccKrMMMMMMk.....',
  '.....kMMMMMMrkkkkkkrMMMMMMk.....',
  '.....kMMMMMMrrrrrrrrMMMMMMk.....',
  '.....kMMkkkkkkkkkkkkkkkkMMk.....',
  '......kMkMoMoMoMoMoMoMkMk.......',
  '......kMkoMoMoMoMoMoMokMk.......',
  '.......kkkkkkkkkkkkkkkkk........',
  '......kMMMMMMMMMMMMMMMMMk.......',
  '.....kMMMMMMMMMMMMMMMMMMMk......',
  '....kMMMMMMMMMMMMMMMMMMMMMk.....',
  '...kMMMMMMMMMMMMMMMMMMMMMMMk....',
  '...kMMMMkkMMMMMMMMMMMMkkMMMMk...',
  '...kMMMk..kMMMMMMMMMMk..kMMMk...',
  '...kMMk....kMMMMMMMMk....kMMk...',
  '...kk.......kMMMMMMk.......kk...',
  '............kMMMMMMk............',
  '...........kMMMMMMMMk...........',
  '...........kMMMkkMMMk...........',
  '..........kMMMk..kMMMk..........',
  '..........kMMk....kMMk..........',
  '..........kkk......kkk..........',
  '................................',
  '................................',
])

/**
 * The four mechs, one per rock, in the colour of the rock it guards.
 *
 * One drawing, four palettes: the Grey is the steel it was drawn in, and the
 * rest swap the two metal tones for red, ice and near-black. Before this they
 * were the same sprite four times over, so a child who had beaten one had no
 * way of telling he was looking at a different machine.
 */
const mechColours = (swap: Record<string, string>): [Sprite, Sprite] => [
  mapColours(MECH_A, swap),
  mapColours(MECH_B, swap),
]
const [MECH_RED_A, MECH_RED_B] = mechColours({ M: 'R', m: 'r' })
const [MECH_ICE_A, MECH_ICE_B] = mechColours({ M: 'B', m: 'c', r: 'b' })
const [MECH_BLACK_A, MECH_BLACK_B] = mechColours({ M: 'z', m: 'M' })

/**
 * Half animal, half machine.
 *
 * The animals all face right, head first, so everything from the middle of
 * the sprite rightward — the head, the shoulders, the front legs — is plated
 * over in chrome and given a red lens for an eye. The back half stays fur.
 * One rule, six cyborgs, and the silhouette that told the six apart is intact.
 */
export function cyborg(sprite: Sprite): Sprite {
  const fur = new Set(['n', 'o', 'w', 'd', 'h', 'x', 's', 'y'])
  const whites = sprite.rows.join('').split('').filter((ch) => ch === 'w').length
  const furs = sprite.rows.join('').split('').filter((ch) => fur.has(ch)).length
  const whiteAnimal = whites > furs / 2
  return {
    width: sprite.width,
    height: sprite.height,
    rows: sprite.rows.map((row, y) =>
      row
        .split('')
        .map((ch, x) => {
          if (x < sprite.width / 2) return ch
          // The eye: a white pixel on an animal that is not itself white
          // becomes a red lens. The rabbit's black eye on white stays black.
          if (ch === 'w' && y < 9 && !whiteAnimal) return 'r'
          if (fur.has(ch)) return (x + y) % 5 === 0 ? 'M' : 'm'
          return ch
        })
        .join(''),
    ),
  }
}

/**
 * The space suit: the hero as he is, in white with a visor. Applied after the
 * shield tier has been coloured in, so the suit does not repaint his shield.
 */
function suited(sprite: Sprite): Sprite {
  return mapColours(sprite, { g: 'w', G: 'M', h: 'c', s: 'c' })
}

/**
 * The Scythe: a long steel snath with a wooden peg for a grip, and a dark
 * hooked blade with the light catching its edge.
 *
 * Drawn from the real thing rather than from a wizard's staff, which is what
 * this used to be — a rod with a glowing orb on the end. The ring of lightning
 * it throws is still the ring of lightning; it is the sweep of the blade now
 * rather than something the orb does.
 */
const SCYTHE_RIGHT = defineSprite(16, 8, [
  '..........kkkkk.',
  '........kkzzzzzk',
  '......kkzzzzzzzk',
  '.....kzzzzzzzzk.',
  '.....kwwwwwwwk..',
  'kkkkkkkkkkkk....',
  'kmmmmmmmmmmk....',
  'kkknnkkkkkkk....',
])

const SCYTHE_DOWN = defineSprite(8, 16, [
  '..kmmk..',
  '..kmmk..',
  '..kmmk..',
  'knnkmmk.',
  '.kkkmmk.',
  '..kmmk..',
  '..kmmk..',
  '..kmmk..',
  '..kmmk..',
  '..kmmk..',
  '..kmmkk.',
  '.kzzzzzk',
  'kzzzzzzk',
  'kwwwwwk.',
  '.kkkkk..',
  '........',
])

/**
 * The one on the shop shelf and in the slot: the whole tool, snath and all.
 *
 * Bottom-left to top-right in a long shallow curve, the wooden peg about a
 * third of the way up, and the blade laid across the top — the shape of the
 * real thing rather than a sword standing on end.
 */
const SCYTHE_ICON = S([
  '...kkkkkkkk.....',
  '..kzzzzzzzzk....',
  '..kzzzzzzzzzk...',
  '..kwwwwwwwwwk...',
  '.........kmmk...',
  '.........kmmk...',
  '........kmmk....',
  '........kmmk....',
  '.......kmmk.....',
  '.....knnmmk.....',
  '.....kkkmmk.....',
  '......kmmk......',
  '......kmmk......',
  '.....kmmk.......',
  '.....kmmk.......',
  '.....kkk........',
])

/** A ship computer: a screen on a stand, always lit. */
const TERMINAL = S([
  '..kkkkkkkkkkkk..',
  '.kMMMMMMMMMMMMk.',
  '.kMkkkkkkkkkkMk.',
  '.kMkccccccccckMk',
  '.kMkcwwwcccckMk.',
  '.kMkcccccwwckMk.',
  '.kMkcwwwwccckMk.',
  '.kMkccccccccckMk',
  '.kMkkkkkkkkkkMk.',
  '.kMMMMMMMMMMMMk.',
  '..kkkkkMMkkkkk..',
  '......kMMk......',
  '......kMMk......',
  '....kkkMMkkk....',
  '...kMMMMMMMMk...',
  '...kkkkkkkkkk...',
])

/** The suit locker in an airlock: a tall cabinet with the suit hanging in it. */
const LOCKER = S([
  '..kkkkkkkkkkkk..',
  '.kMMMMMMMMMMMMk.',
  '.kMkkkkkkkkkkMk.',
  '.kMkzzzzzzzzkMk.',
  '.kMkzzzkkzzzkMk.',
  '.kMkzzkcckzzkMk.',
  '.kMkzkwwwwkzkMk.',
  '.kMkzkwwwwkzkMk.',
  '.kMkkwwwwwwkkMk.',
  '.kMkzkwwwwkzkMk.',
  '.kMkzkwwwwkzkMk.',
  '.kMkzzkwwkzzkMk.',
  '.kMkzzzkkzzzkMk.',
  '.kMkkkkkkkkkkMk.',
  '.kMMMMMMMMMMMMk.',
  '..kkkkkkkkkkkk..',
])

/** A space suit standing ready in an airlock: white, black visor, a red patch. */
const SPACESUIT = S([
  '......kkkk......',
  '.....kwwwwk.....',
  '....kwkkkkwk....',
  '....kwkzzkwk....',
  '....kwkzzkwk....',
  '....kwwkkwwk....',
  '...kkwwwwwwkk...',
  '..kwkwwrwwwkwk..',
  '..kwkwwwwwwkwk..',
  '..kwkwwwwwwkwk..',
  '..kkkwwwwwwkkk..',
  '....kwwkkwwk....',
  '....kwwk.kwwk...',
  '....kwwk.kwwk...',
  '....kkkk.kkkk...',
  '................',
])

/** A canister: a grey drum with a yellow band. Furniture. */
const CANISTER = S([
  '................',
  '....kkkkkkkk....',
  '...kMMmmmmMMk...',
  '...kMMMMMMMMk...',
  '...kMmmmmmmMk...',
  '...kMmmmmmmMk...',
  '...kMmmmmmmMk...',
  '...kMmmmmmmMk...',
  '...kyyyyyyyyk...',
  '...kMmmmmmmMk...',
  '...kMmmmmmmMk...',
  '...kMmmmmmmMk...',
  '...kMMMMMMMMk...',
  '....kkkkkkkk....',
  '................',
  '................',
])

/** A helper droid: the one who talks, where a villager or a scribe would. */
const DROID = S([
  '.......kk.......',
  '......kcck......',
  '.....kkkkkk.....',
  '....kwwwwwwk....',
  '...kwwwwwwwwk...',
  '...kwkccccckwk..',
  '...kwkcwccckwk..',
  '...kwkccccckwk..',
  '...kwwkkkkkwwk..',
  '....kwwwwwwk....',
  '...kkMMMMMMkk...',
  '..kMkMMMMMMkMk..',
  '..kkkMMMMMMkkk..',
  '....kkkkkkkk....',
  '.....kc..ck.....',
  '................',
])

/** The rocket, nose up, as it sits on the launch pad and in the pack. */
const ROCKET = S([
  '.......kk.......',
  '......kwwk......',
  '.....kwwwwk.....',
  '.....kwwwwk.....',
  '....kwwccwwk....',
  '....kwwccwwk....',
  '....kwwwwwwk....',
  '....kwwwwwwk....',
  '...kkwwwwwwkk...',
  '..krkwwwwwwkrk..',
  '.krrkwwwwwwkrrk.',
  '.krrkkkkkkkkrrk.',
  '.kkkkoyyyyokkkk.',
  '.....koyyok.....',
  '......kook......',
  '.......kk.......',
])

/** A force field: the sealed barrier of the future, hatched light. */
const FIELD = S([
  '.kkkkkkkkkkkkkk.',
  'kcccccccccccccck',
  'kcwcccwcccwcccck',
  'kccwcccwcccwccck',
  'kcccwcccwcccwcck',
  'kccccwcccwcccwck',
  'kcwcccwcccwcccck',
  'kccwcccwcccwccck',
  'kcccwcccwcccwcck',
  'kccccwcccwcccwck',
  'kcwcccwcccwcccck',
  'kccwcccwcccwccck',
  'kcccwcccwcccwcck',
  'kccccwcccwcccwck',
  'kcccccccccccccck',
  '.kkkkkkkkkkkkkk.',
])

/** A battery pack: the animal food of the future. */
const BATTERY = S([
  '................',
  '.....kkkkkk.....',
  '.....kMMMMk.....',
  '..kkkkkkkkkkkk..',
  '..kyyyyyyyyyyk..',
  '..kyyyyywyyyyk..',
  '..kyyyywwyyyyk..',
  '..kyyywwwwwyyk..',
  '..kyyyyywwyyyk..',
  '..kyyyyywyyyyk..',
  '..kyyyyyyyyyyk..',
  '..kYYYYYYYYYYk..',
  '..kYYYYYYYYYYk..',
  '..kkkkkkkkkkkk..',
  '................',
  '................',
])

/** Cloaking serum: a slim vial of something that is barely there. */
const SERUM = S([
  '................',
  '.....kkkk.......',
  '.....kMMk.......',
  '.....kMMk.......',
  '....kkcckk......',
  '....kcccck......',
  '...kccccccck....',
  '...kcwcccccck...',
  '..kccwcccccck...',
  '..kcccwcccccck..',
  '..kccccwcccck...',
  '..kcccccwwcck...',
  '..kcccccccck....',
  '...kkkkkkkk.....',
  '................',
  '................',
])

/** The ship schematic: a blueprint, white lines on blue. */
const SCHEMATIC = S([
  '................',
  '..kkkkkkkkkkkk..',
  '.kbbbbbbbbbbbbk.',
  '.kbwwwwwwwwwwbk.',
  '.kbwbbbbbbbbwbk.',
  '.kbwbwwwwwwbwbk.',
  '.kbwbwbbbbwbwbk.',
  '.kbwbwbwwbwbwbk.',
  '.kbwbwbbbbwbwbk.',
  '.kbwbwwwrwwbwbk.',
  '.kbwbbbbbbbbwbk.',
  '.kbwwwwwwwwwwbk.',
  '.kbbbbbbbbbbbbk.',
  '..kkkkkkkkkkkk..',
  '................',
  '................',
])

/** The laser screwdriver: red grip, steel shaft, a spark at the tip. */
const SCREWDRIVER = S([
  '................',
  '.......k........',
  '......kck.......',
  '.....kcwck......',
  '......kck.......',
  '......kmk.......',
  '......kmk.......',
  '......kmk.......',
  '.....kkmkk......',
  '.....krrrk......',
  '.....krrrk......',
  '.....krRrk......',
  '.....krrrk......',
  '.....kRRRk......',
  '.....kkkkk......',
  '................',
])

/** The blaster: a pistol with a glowing muzzle. */
const BLASTER = S([
  '................',
  '................',
  '..kkkkkkkkkkk...',
  '.kMMMMMMMMMMMkk.',
  '.kMmmmmmmmmMMcck',
  '.kMMMMMMMMMMMkk.',
  '..kkkkkkMMMk....',
  '.......kMMk.....',
  '.......kMMk.....',
  '......kMMMk.....',
  '......kMMk......',
  '......kMMk......',
  '......kkkk......',
  '................',
  '................',
  '................',
])

/** A power cell: what the blaster fires. */
const CELL = S([
  '................',
  '......kkkk......',
  '.....kMMMMk.....',
  '.....kcccck.....',
  '.....kcwwck.....',
  '.....kcwwck.....',
  '.....kcccck.....',
  '.....kcwwck.....',
  '.....kcwwck.....',
  '.....kcccck.....',
  '.....kcwwck.....',
  '.....kcccck.....',
  '.....kMMMMk.....',
  '......kkkk......',
  '................',
  '................',
])

/** Scrap metal: a heap of it, rusted at the edges. Robots love it. */
const SCRAP = S([
  '................',
  '................',
  '......kkk.......',
  '.....kmmmk..kk..',
  '..kkkkmMmkkkMMk.',
  '.kMMMkmmmkMMMMk.',
  '.kMoMMkkkMoMMMk.',
  '.kMMMMMMMMMMMMk.',
  '..kMoMMMMMMoMk..',
  '..kMMMMMMMMMMk..',
  '...kkkkkkkkkk...',
  '................',
  '................',
  '................',
  '................',
  '................',
])

const CHARGE = S8([
  '...kk...',
  '..kbbk..',
  '.kbbbbk.',
  'kbbcbbkk',
  'kbbbbbk.',
  'kBbbbBk.',
  '.kBBBk..',
  '..kkk...',
])

const CHARGE_LIT = S8([
  '...kc...',
  '..kckk..',
  '.kwwwwk.',
  'kwwwwwkk',
  'kwwwwwk.',
  'kBbbbBk.',
  '.kBBBk..',
  '..kkk...',
])

/**
 * Lightsabers.
 *
 * A short metal hilt and a blade of pure light: a white core with a coloured
 * glow down each side, and no outline on the blade, because light has no
 * edge. Drawn once with 'C' for the glow, then coloured per tier — a dim
 * yellow training saber, then blue, then green. The staff is its own thing.
 */
const SABER_RIGHT = defineSprite(16, 8, [
  '................',
  '................',
  '.kkkk.CCCCCCCCC.',
  'kMmMMkCwwwwwwwwC',
  'kMmMMkCwwwwwwwwC',
  '.kkkk.CCCCCCCCC.',
  '................',
  '................',
])

const SABER_DOWN = defineSprite(8, 16, [
  '.kkkkkk.',
  '.kMmMMk.',
  '.kMmMMk.',
  '.kkkkkk.',
  '..CwwC..',
  '..CwwC..',
  '..CwwC..',
  '..CwwC..',
  '..CwwC..',
  '..CwwC..',
  '..CwwC..',
  '..CwwC..',
  '..CwwC..',
  '..CwwC..',
  '..CwwC..',
  '...CC...',
])

const SABER_ICON = S([
  '.............CC.',
  '............CwwC',
  '...........CwwC.',
  '..........CwwC..',
  '.........CwwC...',
  '........CwwC....',
  '.......CwwC.....',
  '......CwwC......',
  '.....CwwC.......',
  '....kkwC........',
  '...kMMkC........',
  '..kMmMk.........',
  '.kMmMk..........',
  'kMMMk...........',
  'kkkk............',
  '................',
])

/** The glow of each tier's blade. Gold is the staff; magic is only ever a shield. */
const SABER_GLOW: Record<Tier, string> = {
  wooden: 'y',
  metal: 'b',
  bronze: 'e',
  golden: 'c',
  magical: 'p',
}

function saber(sprite: Sprite, tier: Tier): Sprite {
  return mapColours(sprite, { C: SABER_GLOW[tier] })
}

/**
 * The future's shields, coloured like the sabers rather than like metal: the
 * deflector plate is dull steel, and the better ones glow.
 */
const FUTURE_SHIELD_COLOURS: Record<Tier, { body: string; edge: string; grip: string }> = {
  wooden: { body: 'M', edge: 'm', grip: 'k' },
  metal: { body: 'b', edge: 'c', grip: 'w' },
  bronze: { body: 'e', edge: 'w', grip: 'y' },
  golden: { body: 'c', edge: 'w', grip: 'M' },
  magical: { body: 'c', edge: 'w', grip: 'p' },
}

function recolourFutureShield(sprite: Sprite, tier: Tier): Sprite {
  const { body, edge, grip } = FUTURE_SHIELD_COLOURS[tier]
  return mapColours(sprite, { m: body, M: body, w: edge, y: grip })
}

const SWORD_BASE = {
  Right: SWORD_RIGHT,
  Left: mirror(SWORD_RIGHT),
  Down: SWORD_DOWN,
  Up: flipVertical(SWORD_DOWN),
} as const

const HERO_BASE = {
  DownA: HERO_DOWN_A,
  DownB: HERO_DOWN_B,
  UpA: HERO_UP_A,
  UpB: HERO_UP_B,
  RightA: HERO_RIGHT_A,
  RightB: HERO_RIGHT_B,
  LeftA: mirror(HERO_RIGHT_A),
  LeftB: mirror(HERO_RIGHT_B),
} as const

const TIERS: Tier[] = ['wooden', 'metal', 'bronze', 'golden', 'magical']

type Cap<T extends string> = Capitalize<T>
type SwordVariants = {
  [T in Tier as `sword${Cap<T>}${keyof typeof SWORD_BASE & string}`]: Sprite
}
type HeroVariants = {
  [T in Tier as `hero${Cap<T>}${keyof typeof HERO_BASE & string}`]: Sprite
}
type ShieldVariants = { [T in Tier as `shield${Cap<T>}`]: Sprite }
type IconVariants = { [T in Tier as `swordIcon${Cap<T>}`]: Sprite }
/** The same hero in his space suit, one per shield tier and frame. */
type SuitVariants = {
  [T in Tier as `heroSuit${Cap<T>}${keyof typeof HERO_BASE & string}`]: Sprite
}
/** The future's weapons: the same swings and icons in the colours of light. */
type FutureSwordVariants = {
  [T in Tier as `swordFuture${Cap<T>}${keyof typeof SWORD_BASE & string}`]: Sprite
}
type FutureShieldVariants = { [T in Tier as `shieldFuture${Cap<T>}`]: Sprite }
type FutureIconVariants = { [T in Tier as `swordIconFuture${Cap<T>}`]: Sprite }

type Variants = SwordVariants &
  HeroVariants &
  ShieldVariants &
  IconVariants &
  SuitVariants &
  FutureSwordVariants &
  FutureShieldVariants &
  FutureIconVariants

const SABER_BASE = {
  Right: SABER_RIGHT,
  Left: mirror(SABER_RIGHT),
  Down: SABER_DOWN,
  Up: flipVertical(SABER_DOWN),
} as const

const SCYTHE_BASE = {
  Right: SCYTHE_RIGHT,
  Left: mirror(SCYTHE_RIGHT),
  Down: SCYTHE_DOWN,
  Up: flipVertical(SCYTHE_DOWN),
} as const

function buildVariants(): Variants {
  const out: Record<string, Sprite> = {}
  for (const tier of TIERS) {
    const name = tier[0]!.toUpperCase() + tier.slice(1)
    for (const [facing, sprite] of Object.entries(SWORD_BASE)) {
      out[`sword${name}${facing}`] = recolour(sprite, tier)
      // The golden tier's future is the Scythe, which is its own drawing.
      out[`swordFuture${name}${facing}`] =
        tier === 'golden'
          ? SCYTHE_BASE[facing as keyof typeof SCYTHE_BASE]
          : saber(SABER_BASE[facing as keyof typeof SABER_BASE], tier)
    }
    for (const [frame, sprite] of Object.entries(HERO_BASE)) {
      const coloured = recolour(sprite, tier)
      out[`hero${name}${frame}`] = coloured
      out[`heroSuit${name}${frame}`] = suited(coloured)
    }
    out[`shield${name}`] = recolour(SHIELD, tier)
    out[`shieldFuture${name}`] = recolourFutureShield(SHIELD, tier)
    out[`swordIcon${name}`] = recolour(SWORD_ICON, tier)
    out[`swordIconFuture${name}`] = tier === 'golden' ? SCYTHE_ICON : saber(SABER_ICON, tier)
  }
  return out as Variants
}


// --- the city ---------------------------------------------------------------

/**
 * A yellow cab from above, nose to the right. Two tiles long and one tall —
 * a car the size of its lane is a box, and a box with a dot on it is not a
 * taxi from across the screen. Wheels at the corners, the checker stripe
 * down both flanks, the roof light in the middle.
 */
const CAR_ROWS = (body: string, trim: string) =>
  [
    '....kkkk........kkkk....',
    '..kkkkkkkkkkkkkkkkkkkk..',
    `.k${body.repeat(20)}k.`,
    `k${body}${trim}${body}${trim}${body}${trim}${body}${trim}${body}${trim}${body}${trim}${body}${trim}${body}${trim}${body}${trim}${body}${trim}${body}${body}k`,
    `k${body.repeat(21)}wk`,
    `k${body}${body}kkkkkkkkkkkkkkkkk${body}${body}k`,
    `k${body}${body}kzzzzzzzzzzzzzzzk${body}${body}k`,
    `k${body}${body}kzzzzzzzyyzzzzzzk${body}${body}k`,
    `k${body}${body}kzzzzzzzyyzzzzzzk${body}${body}k`,
    `k${body}${body}kzzzzzzzzzzzzzzzk${body}${body}k`,
    `k${body}${body}kkkkkkkkkkkkkkkkk${body}${body}k`,
    `k${body.repeat(21)}wk`,
    `k${body}${trim}${body}${trim}${body}${trim}${body}${trim}${body}${trim}${body}${trim}${body}${trim}${body}${trim}${body}${trim}${body}${trim}${body}${body}k`,
    `.k${body.repeat(20)}k.`,
    '..kkkkkkkkkkkkkkkkkkkk..',
    '....kkkk........kkkk....',
  ] as const

const TAXI = defineSprite(24, 16, CAR_ROWS('y', 'k'))

/** The one purple car. Walk into it when it stops, and it drives you somewhere. */
const PURPLE_CAR = defineSprite(24, 16, CAR_ROWS('p', 'P'))

const PIGEON_A = S([
  '................',
  '................',
  '................',
  '................',
  '......kk........',
  '.....kMMk.......',
  '....kMMMMkk.....',
  '...kMmmMMMMk....',
  '..kMmmmMMMMMk...',
  '..kMMMMMMMkkk...',
  '...kkMMMMk......',
  '.....kkkk.......',
  '.....k..k.......',
  '....ok..ok......',
  '................',
  '................',
])

const PIGEON_B = S([
  '................',
  '................',
  '................',
  '......kk........',
  '.....kMMk.......',
  '....kMMMMkk.....',
  '...kMmmMMMMk....',
  '..kMmmmMMMMMk...',
  '..kMMMMMMMkkk...',
  '...kkMMMMk......',
  '.....kkkk.......',
  '....k....k......',
  '...ok....ok.....',
  '................',
  '................',
  '................',
])


/**
 * The box hammer, held out in front of the hero the way the sword is. A
 * short wooden handle and a head the size of his own; every hit shakes the
 * screen, so it has to look like it could.
 */
const HAMMER_RIGHT = defineSprite(16, 10, [
  '..........kkkkkk',
  '.........kmmmmMk',
  '.........kmwmmMk',
  'kkkkkkkkkkmmmmMk',
  'knvvvvvvvkmmmmMk',
  'kkkkkkkkkkmmmmMk',
  '.........kmmmmMk',
  '.........kMMMMMk',
  '..........kkkkkk',
  '................',
])

const HAMMER_DOWN = defineSprite(8, 16, [
  '..kkkk..',
  '..knnk..',
  '..kvnk..',
  '..kvnk..',
  '..kvnk..',
  '..kvnk..',
  '..kvnk..',
  '..kvnk..',
  '..kvnk..',
  'kkkkkkkk',
  'kmmmmmmk',
  'kmwmmmmk',
  'kmmmmmmk',
  'kMMMMMMk',
  'kkkkkkkk',
  '........',
])

/** The box hammer as it sits in the HUD and on a shop shelf. */
const BOX_HAMMER_ICON = S([
  '................',
  '......kkkkkkk...',
  '.....kmmmmmmMk..',
  '.....kmwmmmmMk..',
  '.....kmmmmmmMk..',
  '.....kMMMMMMMk..',
  '......kkkknkk...',
  '.........knk....',
  '........kvnk....',
  '........kvnk....',
  '.......kvnk.....',
  '.......kvnk.....',
  '......kvnk......',
  '......kkk.......',
  '................',
  '................',
])

/**
 * The people. This level's monsters are not monsters: they are people in
 * black and grey, who want him out of the way. A hood, a suit, a cap and a
 * tracksuit — each one plain enough that he is the only colour on the
 * screen, which is the point.
 */
const HOODIE_A = S([
  '................',
  '.....kkkkkk.....',
  '....kzzzzzzk....',
  '...kzzsssszzk...',
  '...kzsksskszk...',
  '...kzsssssszk...',
  '....kzzssszk....',
  '....kzzzzzzk....',
  '...kzzzzzzzzk...',
  '..kzkzzzzzzkzk..',
  '..kzkzzzzzzkzk..',
  '...kkzzzzzzkk...',
  '....kzzzzzzk....',
  '....kkkkkkkk....',
  '....kzzkkzzk....',
  '....kkk..kkk....',
])

const HOODIE_B = S([
  '................',
  '.....kkkkkk.....',
  '....kzzzzzzk....',
  '...kzzsssszzk...',
  '...kzsksskszk...',
  '...kzsssssszk...',
  '....kzzssszk....',
  '....kzzzzzzk....',
  '...kzzzzzzzzk...',
  '..kzkzzzzzzkzk..',
  '..kzkzzzzzzkzk..',
  '...kkzzzzzzkk...',
  '....kzzzzzzk....',
  '....kkkkkkkk....',
  '...kzzk..kzzk...',
  '...kkk....kkk...',
])

const SUIT_A = S([
  '................',
  '.....kkkkkk.....',
  '....khhhhhhk....',
  '....kssssssk....',
  '....kskssksk....',
  '....kssssssk....',
  '.....kssssk.....',
  '....kMMwwMMk....',
  '...kMMMwkMMMk...',
  '..kMkMMkkMMkMk..',
  '..kMkMMwwMMkMk..',
  '...kkMMMMMMkk...',
  '....kMMMMMMk....',
  '....kkkkkkkk....',
  '....kMMkkMMk....',
  '....kkk..kkk....',
])

const SUIT_B = S([
  '................',
  '.....kkkkkk.....',
  '....khhhhhhk....',
  '....kssssssk....',
  '....kskssksk....',
  '....kssssssk....',
  '.....kssssk.....',
  '....kMMwwMMk....',
  '...kMMMwkMMMk...',
  '..kMkMMkkMMkMk..',
  '..kMkMMwwMMkMk..',
  '...kkMMMMMMkk...',
  '....kMMMMMMk....',
  '....kkkkkkkk....',
  '...kMMk..kMMk...',
  '...kkk....kkk...',
])

const CAP_A = S([
  '................',
  '.....kkkkkkk....',
  '....kkkkkkkkkk..',
  '....kssssssk....',
  '....kskssksk....',
  '....kssssssk....',
  '.....kssssk.....',
  '....kMMMMMMk....',
  '...kMkMMMMkMk...',
  '..kMkkMMMMkkMk..',
  '..kMkkMMMMkkMk..',
  '...kkkMMMMkkk...',
  '....kMMMMMMk....',
  '....kkkkkkkk....',
  '....kMMkkMMk....',
  '....kkk..kkk....',
])

const CAP_B = S([
  '................',
  '.....kkkkkkk....',
  '....kkkkkkkkkk..',
  '....kssssssk....',
  '....kskssksk....',
  '....kssssssk....',
  '.....kssssk.....',
  '....kMMMMMMk....',
  '...kMkMMMMkMk...',
  '..kMkkMMMMkkMk..',
  '..kMkkMMMMkkMk..',
  '...kkkMMMMkkk...',
  '....kMMMMMMk....',
  '....kkkkkkkk....',
  '...kMMk..kMMk...',
  '...kkk....kkk...',
])

/** A hydrant with its cap blown off: the column of water, in two frames. */
const SPRAY_A = S([
  '.......c........',
  '......cwc.......',
  '.....cwwwc..c...',
  '....cwwwwwc.w...',
  '...bcwwwwwcb....',
  '..b.cwwwwwc..c..',
  '....cwwwwwc.....',
  '.c...cwwwc......',
  '.....cwwwc...b..',
  '.....cwwwc......',
  '..c..cwwwc.c....',
  '.....cwwwc......',
  '.....cwwwc......',
  '....bcwwwcb.....',
  '.....cwwwc......',
  '................',
])

const SPRAY_B = S([
  '......c.........',
  '.....cwc....c...',
  '....cwwwc.......',
  '...cwwwwwc..b...',
  '..bcwwwwwcb.....',
  '....cwwwwwc.c...',
  '.c..cwwwwwc.....',
  '....cwwwwwc.....',
  '.....cwwwc..c...',
  '..b..cwwwc......',
  '.....cwwwc.b....',
  '.....cwwwc......',
  '.c...cwwwc......',
  '....bcwwwcb.....',
  '.....cwwwc......',
  '................',
])


/**
 * The three guardians of the city. Drawn as caricatures — the hair, the tie,
 * the suit, the mouth — and beaten by nothing sharp: only love bombs touch
 * them, and enough of it turns them pink, hugging, and gone. A knife,
 * a hammer or a bullet bounces off with "not like that".
 */
const GUARDIAN_GOLD = defineSprite(32, 32, [
  '................................',
  '...................kyyyyyyk.....',
  '.......kkkkkkkkkkkkyywwwyyk.....',
  '.......kyyyyyyyyyyyyyyyyYk......',
  '.....kyyywwwwwwyyyyyyyyyk.......',
  '....kyyyyyyyyyyyyyyyyyyyk.......',
  '....kyyyyyYYYYyyyyYYYYyyk.......',
  '.....kyyysssssssssssssssk.......',
  '.......kssskwsssssskwsssk.......',
  '.......kssskksssssskksssk.......',
  '.......ksoossssssssssoosk.......',
  '.......ksoossRssssRssoosk.......',
  '.......kssssssRRRRssssssk.......',
  '.......kssssssssssssssssk.......',
  '.......kssssssssssssssssk.......',
  '.......kkkkkksssssskkkkkk.......',
  '............kssssssk............',
  '.....kkkkkkkkkkkkkkkkkkkkkk.....',
  '.....kBBBBBkwwwwwwwwkBBBBBk.....',
  '..kkkkBBBBBkBwwrrwwBkBBBBBkkkk..',
  '..kBBkBBBBBkBBwrrwBBkBBBBBkBBk..',
  '..kBBkBBBBBkBBrrrrBBkBBBBBkBBk..',
  '..kBBkBBBBBkBBrrrrBBkBBBBBkBBk..',
  '..kBBkBBBBBBBBrrrrBBBBBBBBkBBk..',
  '..kBBkBBBBBBBBrrrrBBBBBBBBkBBk..',
  '..kBBkBBBBBBBBrrrrBBBBBBBBkBBk..',
  '..kBBkBBBBBBBBrrrrBBBBBBBBkBBk..',
  '..ksskBBBBBBBBrrrrBBBBBBBBkssk..',
  '...sskBBBBBBBBrrrrBBBBBBBBkss...',
  '.....kkkkkkkkkkrrkkkkkkkkkk.....',
  '........kzzzzzkrrkzzzzzk........',
  '................................',
])

const GUARDIAN_GREY = defineSprite(32, 32, [
  '................................',
  '................................',
  '.......kkkkkkkkkkkkkkkkkk.......',
  '.......kxxssssssssssssxxk.......',
  '.......kxxxxxxxxxxxxxxxxk.......',
  '.......kxxssssssssssssxxk.......',
  '.......kxxkkkksssskkkkxxk.......',
  '.......kxxssskssssksssxxk.......',
  '.......kssskwsssssskwsssk.......',
  '.......kssskksssssskksssk.......',
  '.......kssssssssssssssssk.......',
  '.......kssssssssssssssssk.......',
  '.......ksssssRRRRRRsssssk.......',
  '.......kssssssssssssssssk.......',
  '.......kssssssssssssssssk.......',
  '.......kkkkkksssssskkkkkk.......',
  '............kssssssk............',
  '.....kkkkkkkkkkkkkkkkkkkkkk.....',
  '.....kzzzzzkwwwwwwwwkzzzzzk.....',
  '..kkkkzzzzzkzwwbbwwzkzzzzzkkkk..',
  '..kzzkzzzzzkzzwbbwzzkzzzzzkzzk..',
  '..kzzkzzzzzkzzbbbbzzkzzzzzkzzk..',
  '..kzzkzzzzzkzzbbbbzzkzzzzzkzzk..',
  '..kzzkzzzzzzzzbbbbzzzzzzzzkzzk..',
  '..kzzkzzzzzzzzbbbbzzzzzzzzkzzk..',
  '..kzzkzzzzzzzzbbbbzzzzzzzzkzzk..',
  '..kzzkzzzzzzzzbbbbzzzzzzzzkzzk..',
  '..ksskzzzzzzzzbbbbzzzzzzzzkssk..',
  '...sskzzzzzzzzzbbzzzzzzzzzkss...',
  '.....kkkkkkkkkkkkkkkkkkkkkk.....',
  '........kzzzzzk..kzzzzzk........',
  '................................',
])

const GUARDIAN_DARK = defineSprite(32, 32, [
  '................................',
  '................................',
  '.......kkkkkkkkkkkkkkkkkk.......',
  '.......kzzzzzzzkzzzzzzzzk.......',
  '.......kzzMMMMzkzzzzzzzzk.......',
  '.......kzzzzzzzkzzzzzzzzk.......',
  '.......kzzzzzzzkzzzzzzzzk.......',
  '.......kzsssssssssssssszk.......',
  '.......kzsskwsssssskwsszk.......',
  '.......kssskksssssskksssk.......',
  '.......kssssssssssssssssk.......',
  '.......kssssRssssssRssssk.......',
  '.......ksssssRRRRRRsssssk.......',
  '.......kssssssssssssssssk.......',
  '.......kssssssssssssssssk.......',
  '.......kkkkkksssssskkkkkk.......',
  '............kssssssk............',
  '.....kkkkkkkkkkkkkkkkkkkkkk.....',
  '.....kzzzzzkwwwwwwwwkzzzzzk.....',
  '..kkkkzzzzzkzwwrrwwzkzzzzzkkkk..',
  '..kzzkzzzzzkzzwrrwzzkzzzzzkzzk..',
  '..kzzkzzzzzkzzrrrrzzkzzzzzkzzk..',
  '..kzzkzzzzzkzzrrrrzzkzzzzzkzzk..',
  '..kzzkzzzzzzzzrrrrzzzzzzzzkzzk..',
  '..kzzkzzzzzzzzrrrrzzzzzzzzkzzk..',
  '..kzzkzzzzzzzzrrrrzzzzzzzzkzzk..',
  '..kzzkzzzzzzzzrrrrzzzzzzzzkzzk..',
  '..ksskzzzzzzzzrrrrzzzzzzzzkssk..',
  '...sskzzzzzzzzzrrzzzzzzzzzkss...',
  '.....kkkkkkkkkkkkkkkkkkkkkk.....',
  '........kzzzzzk..kzzzzzk........',
  '................................',
])


/** A love bomb: a heart with a fuse, bought by the dozen at the florist. */
const LOVE_BOMB = S([
  '.........k......',
  '........kyk.....',
  '.........k......',
  '...kkkk..kkkk...',
  '..kiiiikkiiiik..',
  '.kiwiiiiiiiiiik.',
  '.kiiiiiiiiiiiik.',
  '.kIiiiiiiiiiiIk.',
  '..kIiiiiiiiiIk..',
  '...kIiiiiiiIk...',
  '....kIiiiiIk....',
  '.....kIiiIk.....',
  '......kIIk......',
  '.......kk.......',
  '................',
  '................',
])

/** What comes off a guardian who is being loved: little hearts, two sizes. */
const HEART_BIG = S8([
  '.kk.kk..',
  'kiikiik.',
  'kiiiiik.',
  '.kiiik..',
  '..kik...',
  '...k....',
  '........',
  '........',
])

const HEART_SMALL = S8([
  '........',
  '.k.k....',
  'kikik...',
  '.kik....',
  '..k.....',
  '........',
  '........',
  '........',
])

export const SPRITES = {
  ...buildVariants(),
  shooterA: SHOOTER_A,
  shooterB: SHOOTER_B,
  chaserA: CHASER_A,
  chaserB: CHASER_B,
  flyerA: FLYER_A,
  flyerB: FLYER_B,
  casterA: CASTER_A,
  casterB: CASTER_B,
  bossA: BOSS_A,
  rupee: RUPEE,
  rupeeBlue: RUPEE_BLUE,
  heart: HEART,
  chestClosed: CHEST_CLOSED,
  chestOpen: CHEST_OPEN,
  shopkeeper: SHOPKEEPER,
  scribe: SCRIBE,
  seal: SEAL,
  projectile: PROJECTILE,
  magicBolt: MAGIC_BOLT,
  bomb: BOMB,
  bombLit: BOMB_LIT,
  explosion: EXPLOSION,
  flame: FLAME,
  candle: CANDLE,
  bait: BAIT,
  bow: BOW,
  arrow: ARROW,
  wings: WINGS,
  worldMap: MAP,
  arrowFlyRight: ARROW_FLY_RIGHT,
  arrowFlyLeft: mirror(ARROW_FLY_RIGHT),
  arrowFlyDown: ARROW_FLY_DOWN,
  arrowFlyUp: flipVertical(ARROW_FLY_DOWN),
  boltRight: BOLT_RIGHT,
  boltLeft: mirror(BOLT_RIGHT),
  boltDown: BOLT_DOWN,
  boltUp: flipVertical(BOLT_DOWN),
  dogA: DOG_A,
  dogB: DOG_B,
  catA: CAT_A,
  catB: CAT_B,
  rabbitA: RABBIT_A,
  rabbitB: RABBIT_B,
  wombatA: WOMBAT_A,
  wombatB: WOMBAT_B,
  kangarooA: KANGAROO_A,
  kangarooB: KANGAROO_B,
  goatA: GOAT_A,
  goatB: GOAT_B,
  animalFood: ANIMAL_FOOD,
  potion: POTION,
  ring: RING,
  tunicBlue: mapColours(TUNIC, { g: 'b', G: 'B' }),
  tunicRed: mapColours(TUNIC, { g: 'r', G: 'R' }),

  // --- the future ---------------------------------------------------------
  droneA: DRONE_A,
  droneB: DRONE_B,
  crusherA: CRUSHER_A,
  crusherB: CRUSHER_B,
  discA: DISC_A,
  discB: DISC_B,
  glitchA: GLITCH_A,
  glitchB: GLITCH_B,
  mechGreyA: MECH_A,
  mechGreyB: MECH_B,
  mechRedA: MECH_RED_A,
  mechRedB: MECH_RED_B,
  mechIceA: MECH_ICE_A,
  mechIceB: MECH_ICE_B,
  mechBlackA: MECH_BLACK_A,
  mechBlackB: MECH_BLACK_B,
  cyborgDogA: cyborg(DOG_A),
  cyborgDogB: cyborg(DOG_B),
  cyborgCatA: cyborg(CAT_A),
  cyborgCatB: cyborg(CAT_B),
  cyborgRabbitA: cyborg(RABBIT_A),
  cyborgRabbitB: cyborg(RABBIT_B),
  cyborgWombatA: cyborg(WOMBAT_A),
  cyborgWombatB: cyborg(WOMBAT_B),
  cyborgKangarooA: cyborg(KANGAROO_A),
  cyborgKangarooB: cyborg(KANGAROO_B),
  cyborgGoatA: cyborg(GOAT_A),
  cyborgGoatB: cyborg(GOAT_B),
  terminal: TERMINAL,
  locker: LOCKER,
  spacesuit: SPACESUIT,
  canister: CANISTER,
  droid: DROID,
  rocket: ROCKET,
  field: FIELD,
  battery: BATTERY,
  serum: SERUM,
  schematic: SCHEMATIC,
  screwdriver: SCREWDRIVER,
  blaster: BLASTER,
  cell: CELL,
  scrap: SCRAP,
  charge: CHARGE,
  chargeLit: CHARGE_LIT,
  circuitRing: mapColours(RING, { y: 'm', Y: 'M', b: 'c', B: 'c' }),
  nanoBlue: mapColours(TUNIC, { g: 'b', G: 'B', d: 'M', y: 'c' }),
  nanoRed: mapColours(TUNIC, { g: 'r', G: 'R', d: 'M', y: 'c' }),
  // The staff as it is drawn beside the hero, so the atlas has it by name.
  scytheRight: SCYTHE_RIGHT,
  scytheDown: SCYTHE_DOWN,

  // --- the city -----------------------------------------------------------
  taxi: TAXI,
  taxiLeft: mirror(TAXI),
  purpleCar: PURPLE_CAR,
  purpleCarLeft: mirror(PURPLE_CAR),
  pigeonA: PIGEON_A,
  pigeonB: PIGEON_B,
  hammerRight: HAMMER_RIGHT,
  hammerLeft: mirror(HAMMER_RIGHT),
  hammerDown: HAMMER_DOWN,
  hammerUp: flipVertical(HAMMER_DOWN),
  boxHammer: BOX_HAMMER_ICON,
  hoodieA: HOODIE_A,
  hoodieB: HOODIE_B,
  suitA: SUIT_A,
  suitB: SUIT_B,
  capA: CAP_A,
  capB: CAP_B,
  sprayA: SPRAY_A,
  sprayB: SPRAY_B,
  guardianGold: GUARDIAN_GOLD,
  guardianGrey: GUARDIAN_GREY,
  guardianDark: GUARDIAN_DARK,
  loveBomb: LOVE_BOMB,
  heartBig: HEART_BIG,
  heartSmall: HEART_SMALL,
} as const

export type SpriteName = keyof typeof SPRITES
