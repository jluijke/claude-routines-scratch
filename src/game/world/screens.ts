/**
 * The world: 29 fixed screens, cut to rather than scrolled between.
 *
 * Each screen is 11 rows of 16 tiles. See world/tiles.ts for the characters.
 * Barriers are placed by id from game/gates.ts; the same barrier never appears
 * on two screens.
 */
import type { SpriteName } from '../render/sprites'

export type EnemyKind = 'shooter' | 'chaser' | 'flyer' | 'boss1' | 'boss2'

export interface Spawn {
  kind: EnemyKind
  col: number
  row: number
}

export interface GatePlacement {
  gateId: string
  col: number
  row: number
  /** Tiles that become walkable once this barrier opens. */
  opens?: { col: number; row: number }[]
}

export interface Prop {
  sprite: SpriteName
  col: number
  row: number
  /** Shown when the player stands next to it and presses the item key. */
  talk?: string
}

export interface Portal {
  col: number
  row: number
  to: string
  spawnCol: number
  spawnRow: number
}

export interface Screen {
  id: string
  name: string
  region: string
  rows: string[]
  exits: { up?: string; down?: string; left?: string; right?: string }
  spawns?: Spawn[]
  gates?: GatePlacement[]
  props?: Prop[]
  portals?: Portal[]
  /** Pitch dark without the Blue Candle. */
  dark?: boolean
  /** Opens the shop interface on entry. */
  shop?: 'village' | 'secret' | 'smith'
}

const OPEN_ROW = '................'

/** Builds a plain outdoor screen with walls only where there are no exits. */
function field(exits: Screen['exits'], interior: string[]): string[] {
  const rows: string[] = []
  const top = exits.up ? 'TTTTTTT..TTTTTTT' : 'TTTTTTTTTTTTTTTT'
  rows.push(top)
  for (let i = 0; i < 9; i++) {
    const line = interior[i] ?? OPEN_ROW
    const left = exits.left && i >= 3 && i <= 5 ? '.' : 'T'
    const right = exits.right && i >= 3 && i <= 5 ? '.' : 'T'
    rows.push(left + line.slice(1, 15).padEnd(14, '.') + right)
  }
  rows.push(exits.down ? 'TTTTTTT..TTTTTTT' : 'TTTTTTTTTTTTTTTT')
  return rows
}

export const SCREENS: Screen[] = [
  // ---------------------------------------------------------------- village
  {
    id: 'village-square',
    name: 'Village Square',
    region: 'Village',
    rows: [
      'TTTTTTT..TTTTTTT',
      'T.##H##........T',
      'T.#####........T',
      '......,...,.....',
      '.......SS.......',
      '......SSSS......',
      '.......SS.......',
      'T.....,...,....T',
      'T..............T',
      'T..............T',
      'TTTTTTTTTTTTTTTT',
    ],
    exits: { up: 'village-north', left: 'village-west', right: 'village-east' },
    gates: [{ gateId: 'village-chest', col: 12, row: 8 }],
    portals: [{ col: 4, row: 1, to: 'shop-interior', spawnCol: 7, spawnRow: 8 }],
    props: [
      { sprite: 'scribe', col: 3, row: 5, talk: 'Welcome, traveller. The sealed stones open only for a careful speller.' },
    ],
  },
  {
    id: 'village-west',
    name: 'West Road',
    region: 'Village',
    rows: [
      'TTTTTTTTTTTTTTTT',
      'T,,...........,T',
      'T....RR........T',
      '.....RR.......,.',
      '..............=.',
      '..............,.',
      'T....,,........T',
      'T....,,........T',
      'T.............,T',
      'T..............T',
      'TTTTTTTTTTTTTTTT',
    ],
    exits: { right: 'village-square', left: 'river-south' },
    gates: [{ gateId: 'scribe-west', col: 14, row: 4, opens: [{ col: 14, row: 4 }] }],
    props: [{ sprite: 'scribe', col: 13, row: 4 }],
    spawns: [{ kind: 'shooter', col: 8, row: 6 }],
  },
  {
    id: 'village-east',
    name: 'East Road',
    region: 'Village',
    rows: [
      'TTTTTTTTTTTTTTTT',
      'T.,..........,.T',
      'T......RRR.....T',
      '.......RRR......',
      '.=..............',
      '.,..............',
      'T....,,,.......T',
      'T..............T',
      'T....H.........T',
      'T..............T',
      'TTTTTTTTTTTTTTTT',
    ],
    exits: { left: 'village-square', right: 'forest-1' },
    gates: [{ gateId: 'village-east-seal', col: 1, row: 4, opens: [{ col: 1, row: 4 }] }],
    portals: [{ col: 5, row: 8, to: 'smith-interior', spawnCol: 7, spawnRow: 8 }],
    spawns: [{ kind: 'shooter', col: 9, row: 6 }],
  },
  {
    id: 'village-north',
    name: 'North Gate',
    region: 'Village',
    rows: [
      'TTTTTTT..TTTTTTT',
      'T......==......T',
      'T......,,......T',
      'T,.....,,.....,T',
      'T..RR.....RR...T',
      'T..RR.....RR...T',
      'T..............T',
      'T....,....,....T',
      'T..............T',
      'T..............T',
      'TTTTTTT..TTTTTTT',
    ],
    exits: { up: 'forest-3', down: 'village-square' },
    gates: [
      {
        gateId: 'village-north-seal',
        col: 7,
        row: 1,
        opens: [
          { col: 7, row: 1 },
          { col: 8, row: 1 },
        ],
      },
    ],
    spawns: [{ kind: 'shooter', col: 4, row: 7 }],
  },

  // ------------------------------------------------------------- interiors
  {
    id: 'shop-interior',
    name: 'The Village Shop',
    region: 'Village',
    rows: [
      '################',
      '#..............#',
      '#..............#',
      '#..............#',
      '#..............#',
      '#..............#',
      '#..............#',
      '#..............#',
      '#######..#######',
      '#######..#######',
      '#######..#######',
    ],
    exits: {},
    shop: 'village',
    portals: [{ col: 7, row: 10, to: 'village-square', spawnCol: 4, spawnRow: 3 }],
    props: [{ sprite: 'shopkeeper', col: 7, row: 3 }],
  },
  {
    id: 'smith-interior',
    name: 'The Smithy',
    region: 'Village',
    rows: [
      '################',
      '#..............#',
      '#....RRRR......#',
      '#....RRRR......#',
      '#..............#',
      '#..............#',
      '#..............#',
      '#..............#',
      '#######..#######',
      '#######..#######',
      '#######..#######',
    ],
    exits: {},
    shop: 'smith',
    portals: [{ col: 7, row: 10, to: 'village-east', spawnCol: 5, spawnRow: 9 }],
    props: [{ sprite: 'shopkeeper', col: 7, row: 4 }],
  },
  {
    id: 'secret-shop',
    name: 'A Hidden Cave',
    region: 'Graveyard',
    rows: [
      '################',
      '#..............#',
      '#..............#',
      '#..............#',
      '#..............#',
      '#..............#',
      '#..............#',
      '#..............#',
      '#######..#######',
      '#######..#######',
      '#######..#######',
    ],
    exits: {},
    shop: 'secret',
    dark: true,
    portals: [{ col: 7, row: 10, to: 'graveyard-1', spawnCol: 3, spawnRow: 5 }],
    props: [{ sprite: 'scribe', col: 7, row: 3 }],
    gates: [{ gateId: 'secret-blue-ring', col: 7, row: 4 }],
  },

  // ----------------------------------------------------------------- forest
  {
    id: 'forest-1',
    name: 'Forest Edge',
    region: 'Forest',
    rows: field({ left: 'village-east', right: 'forest-2', up: 'forest-3' }, [
      '.,,..........',
      '..T...T..T...',
      '.............',
      '.....,.......',
      '..T.......T..',
      '.............',
      '..,....,.....',
      '.............',
      '.............',
    ]),
    exits: { left: 'village-east', right: 'forest-2', up: 'forest-3' },
    spawns: [
      { kind: 'shooter', col: 5, row: 4 },
      { kind: 'flyer', col: 10, row: 6 },
    ],
  },
  {
    id: 'forest-2',
    name: 'Deep Forest',
    region: 'Forest',
    rows: [
      'TTTTTTTTTTTTTTTT',
      'T..T....T....,.T',
      'T.....,......T.T',
      '..T.........T..T',
      '.......=.......T',
      '..T....,....T..T',
      'T....,.....T...T',
      'T..T.....T.....T',
      'T.....,........T',
      'T..............T',
      'TTTTTTT..TTTTTTT',
    ],
    exits: { left: 'forest-1', down: 'forest-4' },
    gates: [
      { gateId: 'forest-seal', col: 7, row: 4, opens: [{ col: 7, row: 4 }] },
      { gateId: 'forest-wall', col: 12, row: 6 },
    ],
    spawns: [
      { kind: 'chaser', col: 11, row: 3 },
      { kind: 'flyer', col: 4, row: 7 },
    ],
  },
  {
    id: 'forest-3',
    name: 'Forest Path',
    region: 'Forest',
    rows: [
      'TTTTTTT..TTTTTTT',
      'T....,.......,.T',
      'T..T......T....T',
      '...............T',
      'T......,.......T',
      'T...T.......T..T',
      'T..............T',
      'T....,....,....T',
      'T..............T',
      'T..............T',
      'TTTTTTT..TTTTTTT',
    ],
    exits: { up: 'forest-5', down: 'village-north', left: 'river-bridge' },
    spawns: [
      { kind: 'shooter', col: 6, row: 5 },
      { kind: 'shooter', col: 11, row: 8 },
    ],
  },
  {
    id: 'forest-4',
    name: 'Forest Hollow',
    region: 'Forest',
    rows: [
      'TTTTTTT..TTTTTTT',
      'T....RRRRRR....T',
      'T....R....R....T',
      'T....R....R....T',
      'T....RR..RR....T',
      'T.....,,,,.....T',
      'T..T........T..T',
      'T..............T',
      'T.....,,,......T',
      'T..............T',
      'TTTTTTTTTTTTTTTT',
    ],
    exits: { up: 'forest-2' },
    gates: [
      { gateId: 'forest-chest', col: 7, row: 2 },
      { gateId: 'forest-hermit', col: 4, row: 5 },
    ],
    spawns: [
      { kind: 'chaser', col: 4, row: 7 },
      { kind: 'flyer', col: 12, row: 4 },
    ],
  },
  {
    id: 'forest-5',
    name: 'The Warden Trees',
    region: 'Forest',
    rows: [
      'TTTTTTT..TTTTTTT',
      'T......,,......T',
      'T..TT.....TT...T',
      'T..............T',
      'T.....====.....T',
      'T.....,,,,.....T',
      'T..T........T..T',
      'T..............T',
      'T..............T',
      'T..............T',
      'TTTTTTT..TTTTTTT',
    ],
    exits: { up: 'forest-6', down: 'forest-3' },
    gates: [
      { gateId: 'forest-seal-3', col: 12, row: 8 },
      {
        gateId: 'forest-seal-2',
        col: 7,
        row: 4,
        opens: [
          { col: 6, row: 4 },
          { col: 7, row: 4 },
          { col: 8, row: 4 },
          { col: 9, row: 4 },
        ],
      },
    ],
    spawns: [
      { kind: 'chaser', col: 5, row: 7 },
      { kind: 'chaser', col: 10, row: 7 },
    ],
  },
  {
    id: 'forest-6',
    name: 'The Shrine Steps',
    region: 'Forest',
    rows: [
      'TTTTTTTTTTTTTTTT',
      'T....*....*....T',
      'T..............T',
      'T....RRRRRR....T',
      'T....R.DD.R....T',
      'T....RRRRRR....T',
      'T......,,......T',
      'T..............T',
      'T....,....,....T',
      'T..............T',
      'TTTTTTT..TTTTTTT',
    ],
    exits: { down: 'forest-5' },
    gates: [{ gateId: 'forest-shrine', col: 7, row: 4, opens: [{ col: 7, row: 4 }, { col: 8, row: 4 }] }],
    portals: [{ col: 7, row: 4, to: 'd1-entrance', spawnCol: 7, spawnRow: 9 }],
    props: [{ sprite: 'scribe', col: 5, row: 6 }],
    spawns: [{ kind: 'flyer', col: 11, row: 3 }],
  },

  // ------------------------------------------------------------------ river
  {
    id: 'river-south',
    name: 'South Bank',
    region: 'River',
    rows: [
      'TTTTTTTTTTTTTTTT',
      'T~~~~~~~~~~~~~~T',
      'T~~~~~~~~~~~~~~T',
      '.~~~~~~~~~~~~~~T',
      '...............T',
      '...........,...T',
      'T..,...........T',
      'T..............T',
      'T....,....,....T',
      'T..............T',
      'TTTTTTTTTTTTTTTT',
    ],
    exits: { right: 'village-west', left: 'river-bridge' },
    gates: [
      { gateId: 'river-seal', col: 4, row: 8 },
      { gateId: 'ferryman', col: 11, row: 5 },
    ],
    props: [{ sprite: 'scribe', col: 11, row: 6 }],
    spawns: [{ kind: 'shooter', col: 8, row: 6 }],
  },
  {
    id: 'river-bridge',
    name: 'The Crossing',
    region: 'River',
    rows: [
      'TTTTTTT..TTTTTTT',
      'T~~~~~~..~~~~~~T',
      'T~~~~~~..~~~~~~T',
      '.~~~~~~==~~~~~~.',
      'T~~~~~~..~~~~~~T',
      'T~~~~~~..~~~~~~T',
      'T......,,......T',
      'T..............T',
      'T....,....,....T',
      'T..............T',
      'TTTTTTT..TTTTTTT',
    ],
    exits: { up: 'river-north', down: 'river-south', right: 'forest-3' },
    gates: [
      {
        gateId: 'river-bridge',
        col: 7,
        row: 3,
        opens: [
          { col: 6, row: 3 },
          { col: 7, row: 3 },
          { col: 8, row: 3 },
          { col: 9, row: 3 },
        ],
      },
    ],
    props: [{ sprite: 'scribe', col: 6, row: 7, talk: 'The planks are all there. They only need a careful word to lay themselves.' }],
    spawns: [{ kind: 'flyer', col: 3, row: 8 }],
  },
  {
    id: 'river-north',
    name: 'North Bank',
    region: 'River',
    rows: [
      'TTTTTTT..TTTTTTT',
      'T.....,,,......T',
      'T..............T',
      'T....RR...RR...T',
      '.=.............T',
      '.,.............T',
      'T....,.........T',
      'T..............T',
      'T~~~~~~..~~~~~~T',
      'T~~~~~~BB~~~~~~T',
      'TTTTTTT..TTTTTTT',
    ],
    exits: { up: 'waterfall', down: 'river-bridge', left: 'graveyard-1' },
    gates: [{ gateId: 'river-north-seal', col: 1, row: 4, opens: [{ col: 1, row: 4 }] }],
    spawns: [
      { kind: 'chaser', col: 9, row: 5 },
      { kind: 'shooter', col: 4, row: 2 },
    ],
  },
  {
    id: 'waterfall',
    name: 'The Waterfall',
    region: 'River',
    rows: [
      'TTTT~~~~~~~~TTTT',
      'T...~~~~~~~~...T',
      'T...~~~~~~~~...T',
      'T....~~~~~~....T',
      'T.....====.....T',
      'T......,,......T',
      'T..............T',
      'T....,....,....T',
      'T..............T',
      'T..............T',
      'TTTTTTT..TTTTTTT',
    ],
    exits: { down: 'river-north' },
    gates: [
      {
        gateId: 'waterfall-seal',
        col: 7,
        row: 4,
        opens: [
          { col: 6, row: 4 },
          { col: 7, row: 4 },
          { col: 8, row: 4 },
          { col: 9, row: 4 },
        ],
      },
      { gateId: 'river-chest', col: 12, row: 7 },
    ],
    spawns: [{ kind: 'flyer', col: 4, row: 6 }],
  },

  // -------------------------------------------------------------- graveyard
  {
    id: 'graveyard-1',
    name: 'The Old Graves',
    region: 'Graveyard',
    rows: [
      'TTTTTTTTTTTTTTTT',
      'T..*..*..*..*..T',
      'T..............T',
      'T..*..*..*..*..T',
      'T...............',
      'T.C.............',
      'T..*..*..*..*..T',
      'T..............T',
      'T....=====.....T',
      'T....,,,,,.....T',
      'TTTTTTTTTTTTTTTT',
    ],
    exits: { right: 'river-north', down: 'graveyard-2' },
    gates: [
      { gateId: 'graveyard-wall', col: 2, row: 5, opens: [{ col: 2, row: 5 }] },
      {
        gateId: 'graveyard-seal',
        col: 7,
        row: 8,
        opens: [
          { col: 5, row: 8 },
          { col: 6, row: 8 },
          { col: 7, row: 8 },
          { col: 8, row: 8 },
          { col: 9, row: 8 },
        ],
      },
    ],
    portals: [{ col: 2, row: 5, to: 'secret-shop', spawnCol: 7, spawnRow: 8 }],
    spawns: [
      { kind: 'flyer', col: 5, row: 2 },
      { kind: 'flyer', col: 11, row: 7 },
    ],
  },
  {
    id: 'graveyard-2',
    name: 'The Inner Yard',
    region: 'Graveyard',
    rows: [
      'TTTTTTT..TTTTTTT',
      'T..*.......*...T',
      'T..............T',
      'T..#####D####..T',
      'T..#.........#.T',
      'T..#.........#.T',
      'T..###########.T',
      'T....*....*....T',
      'T......===.....T',
      'T..............T',
      'TTTTTTTTTTTTTTTT',
    ],
    exits: { up: 'graveyard-1' },
    gates: [
      { gateId: 'graveyard-crypt', col: 8, row: 3, opens: [{ col: 8, row: 3 }] },
      {
        gateId: 'graveyard-seal-2',
        col: 7,
        row: 8,
        opens: [
          { col: 7, row: 8 },
          { col: 8, row: 8 },
          { col: 9, row: 8 },
        ],
      },
      { gateId: 'graveyard-chest', col: 4, row: 7 },
    ],
    portals: [{ col: 8, row: 3, to: 'mountain-path', spawnCol: 7, spawnRow: 9 }],
    spawns: [
      { kind: 'chaser', col: 5, row: 9 },
      { kind: 'flyer', col: 12, row: 2 },
    ],
  },

  // --------------------------------------------------------------- mountain
  {
    id: 'mountain-path',
    name: 'Mountain Track',
    region: 'Mountain',
    rows: [
      'TTTTTTT..TTTTTTT',
      'T..RR.....RR...T',
      'T..RR.....RR...T',
      'T......==......T',
      'T......,,......T',
      'T..RR.....RR...T',
      'T..RR.....RR...T',
      'T..............T',
      'T....,....,....T',
      'T..............T',
      'TTTTTTT..TTTTTTT',
    ],
    exits: { up: 'mountain-1', down: 'graveyard-2' },
    gates: [
      {
        gateId: 'mountain-seal',
        col: 7,
        row: 3,
        opens: [
          { col: 7, row: 3 },
          { col: 8, row: 3 },
        ],
      },
    ],
    spawns: [
      { kind: 'shooter', col: 4, row: 8 },
      { kind: 'chaser', col: 11, row: 8 },
    ],
  },
  {
    id: 'mountain-1',
    name: 'The Ledges',
    region: 'Mountain',
    rows: [
      'TTTTTTT..TTTTTTT',
      'T.RRRR....RRRR.T',
      'T.R..........R.T',
      'T.R...====...R.T',
      'T.R...,,,,...R.T',
      'T.RR.......RRR.T',
      'T..R.......R...T',
      'T..............T',
      'T..R.......R...T',
      'T..............T',
      'TTTTTTT..TTTTTTT',
    ],
    exits: { up: 'mountain-2', down: 'mountain-path' },
    gates: [
      {
        gateId: 'mountain-seal-2',
        col: 7,
        row: 3,
        opens: [
          { col: 6, row: 3 },
          { col: 7, row: 3 },
          { col: 8, row: 3 },
          { col: 9, row: 3 },
        ],
      },
      { gateId: 'mountain-chest', col: 12, row: 7 },
    ],
    spawns: [
      { kind: 'flyer', col: 5, row: 8 },
      { kind: 'chaser', col: 10, row: 6 },
    ],
  },
  {
    id: 'mountain-2',
    name: 'The Summit Gate',
    region: 'Mountain',
    rows: [
      'TTTTTTTTTTTTTTTT',
      'T.RRRRRRRRRRRR.T',
      'T.R..........R.T',
      'T.R...====...R.T',
      'T.R...,,,,...R.T',
      'T.R..........R.T',
      'T.RR..RRRR..RR.T',
      'T.....=........T',
      'T..............T',
      'T..............T',
      'TTTTTTT..TTTTTTT',
    ],
    exits: { down: 'mountain-1' },
    gates: [
      {
        gateId: 'mountain-summit-seal',
        col: 7,
        row: 3,
        opens: [
          { col: 6, row: 3 },
          { col: 7, row: 3 },
          { col: 8, row: 3 },
          { col: 9, row: 3 },
        ],
      },
      { gateId: 'mountain-wall', col: 6, row: 7, opens: [{ col: 6, row: 7 }] },
      { gateId: 'keep-gate', col: 7, row: 2 },
    ],
    portals: [{ col: 7, row: 2, to: 'd2-entrance', spawnCol: 7, spawnRow: 9 }],
    spawns: [
      { kind: 'chaser', col: 4, row: 8 },
      { kind: 'chaser', col: 11, row: 8 },
    ],
  },

  // -------------------------------------------- dungeon one: the Sunken Hall
  {
    id: 'd1-entrance',
    name: 'The Sunken Hall',
    region: 'Sunken Hall',
    rows: [
      '#######DD#######',
      '#..............#',
      '#..~~~....~~~..#',
      '#..~~~....~~~..#',
      '#..............#',
      '#......==......#',
      '#......,,......#',
      '#..............#',
      '#..............#',
      '#######..#######',
      '#######..#######',
    ],
    exits: {},
    dark: true,
    gates: [{ gateId: 'd1-door-1', col: 7, row: 5, opens: [{ col: 7, row: 5 }, { col: 8, row: 5 }] }],
    portals: [
      { col: 7, row: 10, to: 'forest-6', spawnCol: 7, spawnRow: 6 },
      { col: 7, row: 0, to: 'd1-hall', spawnCol: 7, spawnRow: 9 },
    ],
    spawns: [{ kind: 'shooter', col: 4, row: 7 }],
  },
  {
    id: 'd1-hall',
    name: 'The Flooded Gallery',
    region: 'Sunken Hall',
    rows: [
      '####DD#####DD###',
      '#..............#',
      '#.~~~~~..~~~~~.#',
      '#.~~~~~..~~~~~.#',
      '#......==......#',
      '#......,,......#',
      '#.~~~~~..~~~~~.#',
      '#.~~~~~..~~~~~.#',
      '#..............#',
      '#######..#######',
      '#######..#######',
    ],
    exits: {},
    dark: true,
    gates: [{ gateId: 'd1-door-2', col: 7, row: 4, opens: [{ col: 7, row: 4 }, { col: 8, row: 4 }] }],
    portals: [
      { col: 7, row: 10, to: 'd1-entrance', spawnCol: 7, spawnRow: 1 },
      { col: 4, row: 0, to: 'd1-treasury', spawnCol: 7, spawnRow: 9 },
      { col: 11, row: 0, to: 'd1-approach', spawnCol: 7, spawnRow: 9 },
    ],
    spawns: [
      { kind: 'flyer', col: 3, row: 5 },
      { kind: 'flyer', col: 12, row: 5 },
    ],
  },
  {
    id: 'd1-treasury',
    name: 'The Sunken Treasury',
    region: 'Sunken Hall',
    rows: [
      '################',
      '#..............#',
      '#....######....#',
      '#....#....#....#',
      '#....#....#....#',
      '#....##..##....#',
      '#......==......#',
      '#......,,......#',
      '#..............#',
      '#######..#######',
      '#######..#######',
    ],
    exits: {},
    dark: true,
    gates: [
      { gateId: 'd1-door-5', col: 7, row: 6, opens: [{ col: 7, row: 6 }, { col: 8, row: 6 }] },
      { gateId: 'd1-chest', col: 7, row: 3 },
    ],
    portals: [{ col: 7, row: 10, to: 'd1-hall', spawnCol: 4, spawnRow: 1 }],
    spawns: [{ kind: 'chaser', col: 3, row: 8 }],
  },
  {
    id: 'd1-approach',
    name: 'Before the Chamber',
    region: 'Sunken Hall',
    rows: [
      '#######DD#######',
      '#......==......#',
      '#......,,......#',
      '#..............#',
      '#.RR........RR.#',
      '#.RR........RR.#',
      '#..............#',
      '#......==......#',
      '#......,,......#',
      '#######..#######',
      '#######..#######',
    ],
    exits: {},
    dark: true,
    gates: [
      { gateId: 'd1-door-3', col: 7, row: 7, opens: [{ col: 7, row: 7 }, { col: 8, row: 7 }] },
      { gateId: 'd1-boss', col: 7, row: 1, opens: [{ col: 7, row: 1 }, { col: 8, row: 1 }] },
    ],
    portals: [
      { col: 7, row: 10, to: 'd1-hall', spawnCol: 11, spawnRow: 1 },
      { col: 7, row: 0, to: 'd1-boss-room', spawnCol: 7, spawnRow: 9 },
    ],
    spawns: [
      { kind: 'chaser', col: 4, row: 5 },
      { kind: 'shooter', col: 11, row: 5 },
    ],
  },
  {
    id: 'd1-boss-room',
    name: 'The Drowned Chamber',
    region: 'Sunken Hall',
    rows: [
      '################',
      '#..............#',
      '#..............#',
      '#..............#',
      '#..............#',
      '#..............#',
      '#..............#',
      '#..............#',
      '#..............#',
      '#######..#######',
      '#######..#######',
    ],
    exits: {},
    gates: [{ gateId: 'd1-door-4', col: 3, row: 8 }],
    portals: [{ col: 7, row: 10, to: 'd1-approach', spawnCol: 7, spawnRow: 3 }],
    spawns: [{ kind: 'boss1', col: 7, row: 3 }],
  },

  // -------------------------------------------- dungeon two: the Hollow Keep
  {
    id: 'd2-entrance',
    name: 'The Hollow Keep',
    region: 'Hollow Keep',
    rows: [
      '#######DD#######',
      '#..............#',
      '#..####..####..#',
      '#..#........#..#',
      '#..#........#..#',
      '#......==......#',
      '#......,,......#',
      '#..............#',
      '#..............#',
      '#######..#######',
      '#######..#######',
    ],
    exits: {},
    dark: true,
    gates: [{ gateId: 'd2-door-1', col: 7, row: 5, opens: [{ col: 7, row: 5 }, { col: 8, row: 5 }] }],
    portals: [
      { col: 7, row: 10, to: 'mountain-2', spawnCol: 7, spawnRow: 4 },
      { col: 7, row: 0, to: 'd2-hall', spawnCol: 7, spawnRow: 9 },
    ],
    spawns: [
      { kind: 'shooter', col: 4, row: 8 },
      { kind: 'chaser', col: 11, row: 8 },
    ],
  },
  {
    id: 'd2-hall',
    name: 'The Long Gallery',
    region: 'Hollow Keep',
    rows: [
      '####DD#####DD###',
      '#......==......#',
      '#......,,......#',
      '#.RRR......RRR.#',
      '#.RRR......RRR.#',
      '#..............#',
      '#.RRR......RRR.#',
      '#.RRR......RRR.#',
      '#......==......#',
      '#######,,#######',
      '#######..#######',
    ],
    exits: {},
    dark: true,
    gates: [
      { gateId: 'd2-door-2', col: 7, row: 8, opens: [{ col: 7, row: 8 }, { col: 8, row: 8 }] },
      { gateId: 'd2-door-3', col: 7, row: 1, opens: [{ col: 7, row: 1 }, { col: 8, row: 1 }] },
    ],
    portals: [
      { col: 7, row: 10, to: 'd2-entrance', spawnCol: 7, spawnRow: 1 },
      { col: 4, row: 0, to: 'd2-treasury', spawnCol: 7, spawnRow: 9 },
      { col: 11, row: 0, to: 'd2-approach', spawnCol: 7, spawnRow: 9 },
    ],
    spawns: [
      { kind: 'flyer', col: 5, row: 5 },
      { kind: 'flyer', col: 10, row: 5 },
      { kind: 'chaser', col: 7, row: 6 },
    ],
  },
  {
    id: 'd2-treasury',
    name: 'The Keep Treasury',
    region: 'Hollow Keep',
    rows: [
      '################',
      '#..............#',
      '#...########...#',
      '#...#......#...#',
      '#...#......#...#',
      '#...###..###...#',
      '#......==......#',
      '#......,,......#',
      '#..............#',
      '#######..#######',
      '#######..#######',
    ],
    exits: {},
    dark: true,
    gates: [
      { gateId: 'd2-door-5', col: 7, row: 6, opens: [{ col: 7, row: 6 }, { col: 8, row: 6 }] },
      { gateId: 'd2-chest', col: 7, row: 3 },
    ],
    portals: [{ col: 7, row: 10, to: 'd2-hall', spawnCol: 4, spawnRow: 1 }],
    spawns: [{ kind: 'chaser', col: 3, row: 8 }],
  },
  {
    id: 'd2-approach',
    name: 'The Antechamber',
    region: 'Hollow Keep',
    rows: [
      '#######DD#######',
      '#......==......#',
      '#......,,......#',
      '#..............#',
      '#.RR........RR.#',
      '#..............#',
      '#.RR........RR.#',
      '#......==......#',
      '#......,,......#',
      '#######..#######',
      '#######..#######',
    ],
    exits: {},
    dark: true,
    gates: [
      { gateId: 'd2-door-6', col: 7, row: 7, opens: [{ col: 7, row: 7 }, { col: 8, row: 7 }] },
      { gateId: 'd2-boss', col: 7, row: 1, opens: [{ col: 7, row: 1 }, { col: 8, row: 1 }] },
    ],
    portals: [
      { col: 7, row: 10, to: 'd2-hall', spawnCol: 11, spawnRow: 1 },
      { col: 7, row: 0, to: 'd2-boss-room', spawnCol: 7, spawnRow: 9 },
    ],
    spawns: [
      { kind: 'chaser', col: 4, row: 5 },
      { kind: 'chaser', col: 11, row: 5 },
      { kind: 'shooter', col: 7, row: 4 },
    ],
  },
  {
    id: 'd2-boss-room',
    name: 'The Hollow Heart',
    region: 'Hollow Keep',
    rows: [
      '################',
      '#..............#',
      '#..............#',
      '#..............#',
      '#..............#',
      '#..............#',
      '#..............#',
      '#..............#',
      '#..............#',
      '#######..#######',
      '#######..#######',
    ],
    exits: {},
    gates: [{ gateId: 'd2-door-4', col: 3, row: 8 }],
    portals: [{ col: 7, row: 10, to: 'd2-approach', spawnCol: 7, spawnRow: 3 }],
    spawns: [{ kind: 'boss2', col: 7, row: 3 }],
  },
]

export const SCREENS_BY_ID: ReadonlyMap<string, Screen> = new Map(SCREENS.map((s) => [s.id, s]))

export function screenById(id: string): Screen | undefined {
  return SCREENS_BY_ID.get(id)
}

export const START_SCREEN = 'village-square'
