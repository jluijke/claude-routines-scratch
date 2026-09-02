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

function buildVariants(): SwordVariants & HeroVariants & ShieldVariants & IconVariants {
  const out: Record<string, Sprite> = {}
  for (const tier of TIERS) {
    const name = tier[0]!.toUpperCase() + tier.slice(1)
    for (const [facing, sprite] of Object.entries(SWORD_BASE)) {
      out[`sword${name}${facing}`] = recolour(sprite, tier)
    }
    for (const [frame, sprite] of Object.entries(HERO_BASE)) {
      out[`hero${name}${frame}`] = recolour(sprite, tier)
    }
    out[`shield${name}`] = recolour(SHIELD, tier)
    out[`swordIcon${name}`] = recolour(SWORD_ICON, tier)
  }
  return out as SwordVariants & HeroVariants & ShieldVariants & IconVariants
}

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
  ring: RING,
  tunicBlue: mapColours(TUNIC, { g: 'b', G: 'B' }),
  tunicRed: mapColours(TUNIC, { g: 'r', G: 'R' }),
} as const

export type SpriteName = keyof typeof SPRITES
