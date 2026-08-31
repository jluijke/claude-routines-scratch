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

const HERO_DOWN_A = S([
  '................',
  '......kkkk......',
  '.....khhhhk.....',
  '....khhhhhhk....',
  '....ksssssssk...',
  '....kskssksk....',
  '....ksssssssk...',
  '.....kssssk.....',
  '....kkggggkk....',
  '...kgGgggggGk...',
  '...sggggggggs...',
  '...skgggggggks..',
  '....kgggggggk...',
  '.....kkkkkkk....',
  '.....kM...Mk....',
  '.....kk...kk....',
])

const HERO_DOWN_B = S([
  '................',
  '......kkkk......',
  '.....khhhhk.....',
  '....khhhhhhk....',
  '....ksssssssk...',
  '....kskssksk....',
  '....ksssssssk...',
  '.....kssssk.....',
  '....kkggggkk....',
  '...kgGgggggGk...',
  '...sggggggggs...',
  '...skgggggggks..',
  '....kgggggggk...',
  '.....kkkkkkk....',
  '......kM.Mk.....',
  '......kk.kk.....',
])

const HERO_UP_A = S([
  '................',
  '......kkkk......',
  '.....khhhhk.....',
  '....khhhhhhk....',
  '....khhhhhhhk...',
  '....khhhhhhhk...',
  '....khhhhhhhk...',
  '.....khhhhk.....',
  '....kkggggkk....',
  '...kgGgggggGk...',
  '...sggggggggs...',
  '...skgggggggks..',
  '....kgggggggk...',
  '.....kkkkkkk....',
  '.....kM...Mk....',
  '.....kk...kk....',
])

const HERO_UP_B = S([
  '................',
  '......kkkk......',
  '.....khhhhk.....',
  '....khhhhhhk....',
  '....khhhhhhhk...',
  '....khhhhhhhk...',
  '....khhhhhhhk...',
  '.....khhhhk.....',
  '....kkggggkk....',
  '...kgGgggggGk...',
  '...sggggggggs...',
  '...skgggggggks..',
  '....kgggggggk...',
  '.....kkkkkkk....',
  '......kM.Mk.....',
  '......kk.kk.....',
])

const HERO_RIGHT_A = S([
  '................',
  '.....kkkk.......',
  '....khhhhk......',
  '...khhhhhhk.....',
  '...khhssssk.....',
  '...khsskssk.....',
  '...khssssssk....',
  '....kssssk......',
  '....kkgggkk.....',
  '...kgGggggGk....',
  '...kgggggggs....',
  '...kggggggks....',
  '....kgggggk.....',
  '.....kkkkk......',
  '.....kM.Mk......',
  '.....kk.kk......',
])

const HERO_RIGHT_B = S([
  '................',
  '.....kkkk.......',
  '....khhhhk......',
  '...khhhhhhk.....',
  '...khhssssk.....',
  '...khsskssk.....',
  '...khssssssk....',
  '....kssssk......',
  '....kkgggkk.....',
  '...kgGggggGk....',
  '...kgggggggs....',
  '...kggggggks....',
  '....kgggggk.....',
  '.....kkkkk......',
  '......kMMk......',
  '......kkkk......',
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

export const SPRITES = {
  heroDownA: HERO_DOWN_A,
  heroDownB: HERO_DOWN_B,
  heroUpA: HERO_UP_A,
  heroUpB: HERO_UP_B,
  heroRightA: HERO_RIGHT_A,
  heroRightB: HERO_RIGHT_B,
  heroLeftA: mirror(HERO_RIGHT_A),
  heroLeftB: mirror(HERO_RIGHT_B),
  shooterA: SHOOTER_A,
  shooterB: SHOOTER_B,
  chaserA: CHASER_A,
  chaserB: CHASER_B,
  flyerA: FLYER_A,
  flyerB: FLYER_B,
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
} as const

export type SpriteName = keyof typeof SPRITES
