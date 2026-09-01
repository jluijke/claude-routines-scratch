/**
 * The world: 29 fixed screens, cut to rather than scrolled between.
 *
 * Each screen is 11 rows of 16 tiles. See world/tiles.ts for the characters.
 * Barriers are placed by id from game/gates.ts; the same barrier never appears
 * on two screens.
 */
import type { SpriteName } from '../render/sprites'
import type { ItemId } from '../items'

export type EnemyKind = 'shooter' | 'chaser' | 'flyer' | 'caster' | 'boss1' | 'boss2' | 'boss3' | 'boss4'

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
  /**
   * The direction this barrier is meant to gate. Set it and the content
   * validator will prove the barrier cannot be walked around — which several
   * of them could be, until it was checked.
   *
   * Leave it off for barriers that are one-directional by nature: dungeon
   * doors you walk straight into, and chests.
   */
  guards?: 'up' | 'down' | 'left' | 'right'
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
  /** This door should only be reachable once the named barrier is open. */
  guardedBy?: string
}

/**
 * A chest that opens simply for being found. Every other chest in the game is
 * sealed behind an exercise; this one is the reward for exploring, which is
 * what makes a cave worth walking into in the first place.
 */
export interface Treasure {
  /** Remembered in the save, so it pays once. */
  id: string
  col: number
  row: number
  rupees: number
  message: string
}

/**
 * Something lying on the ground that he picks up by walking over it. No chest,
 * no barrier, no button — the sword is the first thing in the game and it
 * should not need explaining.
 */
export interface Pickup {
  /** Remembered in the save, so it is found once. */
  id: string
  col: number
  row: number
  item: ItemId
  message: string
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
  /** An unsealed chest, opened by walking into it. */
  treasure?: Treasure
  /** An item lying on the ground, picked up by walking over it. */
  pickup?: Pickup
  /** Opens the shop interface on entry. */
  shop?: 'village' | 'secret' | 'smith'
}

export const SCREENS: Screen[] = [
  // ---------------------------------------------------------------- village
  {
    id: 'village-square',
    name: 'Village Square',
    region: 'Village',
    rows: [
      'TTTTTTT..TTTTTTT',
      'T.#####.....C..T',
      'T.##H##........T',
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
    portals: [
      { col: 4, row: 2, to: 'shop-interior', spawnCol: 7, spawnRow: 8 },
      { col: 12, row: 1, to: 'hollow-cave', spawnCol: 7, spawnRow: 8 },
    ],
    props: [
      {
        sprite: 'scribe',
        col: 3,
        row: 5,
        talk:
          "Welcome stranger! I saw monsters carrying treasure into the cave! " +
          "But it's dark there! Good luck on your quests. Please save our princess!",
      },
    ],
    pickup: {
      id: 'village-sword',
      col: 12,
      row: 9,
      item: 'woodenSword',
      message: 'A wooden sword, left in the grass. It fits your hand well enough.',
    },
  },
  {
    id: 'hollow-cave',
    name: 'The Hollow',
    region: 'Village',
    rows: [
      '################',
      '#..............#',
      '#..RR......RR..#',
      '#..............#',
      '#.......^......#',
      '#..............#',
      '#..RR......RR..#',
      '#..............#',
      '#..............#',
      '#######..#######',
      '#######..#######',
    ],
    exits: {},
    dark: true,
    spawns: [{ kind: 'chaser', col: 4, row: 5 }],
    portals: [
      { col: 7, row: 10, to: 'village-square', spawnCol: 12, spawnRow: 2 },
      { col: 8, row: 4, to: 'hollow-cave-deep', spawnCol: 7, spawnRow: 8 },
    ],
  },
  {
    id: 'hollow-cave-deep',
    name: 'Deep in the Hollow',
    region: 'Village',
    rows: [
      '################',
      '#..............#',
      '#..RR......RR..#',
      '#..............#',
      '#..............#',
      '#..............#',
      '#..RR......RR..#',
      '#..............#',
      '#..............#',
      '#######..#######',
      '#######..#######',
    ],
    exits: {},
    dark: true,
    spawns: [{ kind: 'chaser', col: 11, row: 4 }],
    treasure: {
      id: 'hollow-hoard',
      col: 7,
      row: 1,
      rupees: 100,
      message: 'A hoard of rupees, left here a very long time ago.',
    },
    portals: [{ col: 7, row: 10, to: 'hollow-cave', spawnCol: 7, spawnRow: 5 }],
  },
  {
    id: 'village-west',
    name: 'West Road',
    region: 'Village',
    rows: [
      'TTTTTTT..TTTTTTT',
      'TTTTTTT..TTTTTTT',
      'TTTTTTT==TTTTTTT',
      'T......,,......T',
      'T....RR.......,.',
      'T....RR........T',
      'T....,,........T',
      'T....,,........T',
      'T.............,T',
      'T..............T',
      'TTTTTTTTTTTTTTTT',
    ],
    exits: { right: 'village-square', up: 'river-south' },
    gates: [
      { gateId: 'scribe-west', col: 7, row: 2, guards: 'up', opens: [{ col: 7, row: 2 }, { col: 8, row: 2 }] },
    ],
    props: [{
        sprite: 'scribe',
        col: 6,
        row: 3,
        talk: 'Careful on the west road. The stones there only move for a careful speller.',
      }],
    spawns: [{ kind: 'shooter', col: 8, row: 7 }],
  },
  {
    id: 'village-east',
    name: 'East Road',
    region: 'Village',
    rows: [
      'TTTTTTTTTTTTTTTT',
      'T.,..........,.T',
      'T......RRR.....T',
      'T......RRR..TTTT',
      '............==..',
      'T...........TTTT',
      'T....,,,.......T',
      'T..........X...T',
      'T....H.........T',
      'T..............T',
      'TTTTTTTTTTTTTTTT',
    ],
    exits: { left: 'village-square', right: 'forest-1' },
    gates: [
      { gateId: 'village-east-seal', col: 12, row: 4, guards: 'right', opens: [{ col: 12, row: 4 }, { col: 13, row: 4 }] },
    ],
    portals: [
      { col: 5, row: 8, to: 'smith-interior', spawnCol: 7, spawnRow: 8 },
      { col: 11, row: 7, to: 'bomb-shop', spawnCol: 7, spawnRow: 7 },
    ],
    spawns: [{ kind: 'shooter', col: 9, row: 6 }],
  },
  {
    id: 'village-north',
    name: 'North Gate',
    region: 'Village',
    rows: [
      'TTTTTTT..TTTTTTT',
      'TTTTTTT..TTTTTTT',
      'TTTTTTT==TTTTTTT',
      'T......,,......T',
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
        row: 2,
        guards: 'up',
        opens: [
          { col: 7, row: 2 },
          { col: 8, row: 2 },
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
    props: [
      {
        sprite: 'shopkeeper',
        col: 7,
        row: 3,
        talk: 'Rupees on the counter, and no haggling. The good gear needs more than money.',
      },
    ],
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
    props: [
      {
        sprite: 'shopkeeper',
        col: 7,
        row: 4,
        talk: 'I forge blades, not favours. Bring me rupees and a steady mind.',
      },
    ],
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
    props: [{
        sprite: 'scribe',
        col: 7,
        row: 3,
        talk: 'You found me. Few do. Spend what you like — nobody up there knows this place exists.',
      }],
    gates: [{ gateId: 'secret-blue-ring', col: 7, row: 4 }],
  },

  // ----------------------------------------------------------------- forest
  {
    id: 'forest-1',
    name: 'Forest Edge',
    region: 'Forest',
    rows: [
      'TTTTTTTTTTTTTTTT',
      'T.,,..........,T',
      'T..T...T..T....T',
      'T..............T',
      '................',
      'T..T.......T...T',
      'T..............T',
      'T..,...........T',
      'T.......,......T',
      'T..............T',
      'TTTTTTTTTTTTTTTT',
    ],
    exits: { left: 'village-east', right: 'forest-2' },
    // Nothing marks this bush out. Burning bushes is the point of the candle,
    // and finding this by trying is a better moment than being told.
    portals: [{ col: 8, row: 8, to: 'forest-grotto', spawnCol: 7, spawnRow: 8 }],
    spawns: [
      { kind: 'shooter', col: 5, row: 4 },
      { kind: 'flyer', col: 10, row: 6 },
    ],
  },
  {
    id: 'forest-grotto',
    name: 'A Hidden Grotto',
    region: 'Forest',
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
    dark: true,
    props: [
      { sprite: 'scribe', col: 7, row: 3, talk: 'Not many find this place. Take what you like.' },
    ],
    gates: [{ gateId: 'forest-chest', col: 5, row: 3 }],
    portals: [{ col: 7, row: 10, to: 'forest-1', spawnCol: 8, spawnRow: 7 }],
  },
  {
    id: 'forest-2',
    name: 'Deep Forest',
    region: 'Forest',
    rows: [
      'TTTTTTTTTTTTTTTT',
      'T..T....T....,.T',
      'T.....,......T.T',
      'T..T........T..T',
      '...............T',
      'T..T........T..T',
      'T....,.....T...T',
      'TTTTTTT==TTTTTTT',
      'T.....,........T',
      'T..........,...T',
      'TTTTTTT..TTTTTTT',
    ],
    exits: { left: 'forest-1', down: 'forest-4' },
    gates: [
      { gateId: 'forest-seal', col: 7, row: 7, guards: 'down', opens: [{ col: 7, row: 7 }, { col: 8, row: 7 }] },
      { gateId: 'forest-wall', col: 11, row: 9 },
    ],
    spawns: [
      { kind: 'chaser', col: 11, row: 3 },
      { kind: 'flyer', col: 4, row: 5 },
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
      'T..............T',
      'T......,.......T',
      'T...T.......T..T',
      'T..............T',
      '.....,....,....T',
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
      'T....RR..RR....T',
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
      { gateId: 'village-chest', col: 7, row: 2 },
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
      'TTTTTTT==TTTTTTT',
      'T..............T',
      'T..TT.....TT...T',
      'T..............T',
      'T..T........T..T',
      'T..............T',
      'T.............,T',
      'T..............T',
      'TTTTTTT..TTTTTTT',
    ],
    exits: { up: 'forest-6', down: 'forest-3' },
    gates: [
      { gateId: 'forest-seal-3', col: 13, row: 8 },
      { gateId: 'forest-seal-2', col: 7, row: 2, guards: 'up', opens: [{ col: 7, row: 2 }, { col: 8, row: 2 }] },
    ],
    spawns: [
      { kind: 'chaser', col: 5, row: 6 },
      { kind: 'chaser', col: 10, row: 6 },
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
    props: [{
        sprite: 'scribe',
        col: 5,
        row: 6,
        talk: 'The shrine keeper guards those steps. Answer him and the first dungeon opens. Mind the dark inside.',
      }],
    spawns: [{ kind: 'flyer', col: 11, row: 3 }],
  },

  // ------------------------------------------------------------------ river
  {
    id: 'river-south',
    name: 'South Bank',
    region: 'River',
    rows: [
      'TTTTTTT..TTTTTTT',
      'T~~~~~~..~~~~~~T',
      'T~~~~~~..~~~~~~T',
      'T~~~~~~,,~~~~~~T',
      'TTTTTTT==TTTTTTT',
      'T..............T',
      'T..,...........T',
      'T..........,...T',
      'T....,....,....T',
      'T..............T',
      'TTTTTTT..TTTTTTT',
    ],
    exits: { up: 'river-bridge', down: 'village-west' },
    gates: [
      { gateId: 'river-seal', col: 7, row: 4, guards: 'up', opens: [{ col: 7, row: 4 }, { col: 8, row: 4 }] },
      { gateId: 'ferryman', col: 11, row: 7 },
    ],
    props: [{
        sprite: 'scribe',
        col: 11,
        row: 8,
        talk: 'The ferryman will row you over, but he asks a word for the crossing. Everyone pays something.',
      }],
    spawns: [{ kind: 'shooter', col: 5, row: 6 }],
  },
  {
    id: 'river-bridge',
    name: 'The Crossing',
    region: 'River',
    rows: [
      'TTTTTTT..TTTTTTT',
      'T~~~~~~..~~~~~~T',
      'T~~~~~~..~~~~~~T',
      'T~~~~~~==~~~~~~T',
      'T~~~~~~..~~~~~~T',
      'T~~~~~~..~~~~~~T',
      'T......,,......T',
      'T...............',
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
        guards: 'up',
        opens: [
          { col: 7, row: 3 },
          { col: 8, row: 3 },
        ],
      },
    ],
    props: [
      { sprite: 'scribe', col: 5, row: 8, talk: 'The planks are all there. They only need a careful word to lay themselves.' },
    ],
    spawns: [{ kind: 'flyer', col: 3, row: 9 }],
  },
  {
    id: 'river-north',
    name: 'North Bank',
    region: 'River',
    rows: [
      'TTTTTTT..TTTTTTT',
      'T.....,,,......T',
      'T..............T',
      'TTT..RR...RR...T',
      '..=............T',
      'TTT............T',
      'T....,.........T',
      'T..............T',
      'T~~~~~~..~~~~~~T',
      'T~~~~~~BB~~~~~~T',
      'TTTTTTT..TTTTTTT',
    ],
    exits: { up: 'waterfall', down: 'river-bridge', left: 'graveyard-1' },
    gates: [
      { gateId: 'river-north-seal', col: 2, row: 4, guards: 'left', opens: [{ col: 2, row: 4 }] },
    ],
    spawns: [
      { kind: 'chaser', col: 9, row: 6 },
      { kind: 'shooter', col: 5, row: 2 },
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
      'T.X............T',
      'T....,....,....T',
      'T..............T',
      'T..............T',
      'TTTTTTT..TTTTTTT',
    ],
    exits: { down: 'river-north' },
    portals: [{ col: 2, row: 6, to: 'd3-entrance', spawnCol: 7, spawnRow: 8 }],
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
      'T.C.........X..T',
      'T..*..*..*..*..T',
      'T..............T',
      'TTTTTTT==TTTTTTT',
      'T......,,......T',
      'TTTTTTT..TTTTTTT',
    ],
    exits: { right: 'river-north', down: 'graveyard-2' },
    gates: [
      { gateId: 'graveyard-wall', col: 2, row: 5, opens: [{ col: 2, row: 5 }] },
      {
        gateId: 'graveyard-seal',
        col: 7,
        row: 8,
        guards: 'down',
        opens: [
          { col: 7, row: 8 },
          { col: 8, row: 8 },
        ],
      },
    ],
    portals: [
      { col: 2, row: 5, to: 'secret-shop', spawnCol: 7, spawnRow: 8 },
      { col: 12, row: 5, to: 'd4-entrance', spawnCol: 7, spawnRow: 8 },
    ],
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
      'TRRRRRR==RRRRRRT',
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
        guards: 'up',
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
      'TRRRRRR==RRRRRRT',
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
        guards: 'up',
        opens: [
          { col: 7, row: 3 },
          { col: 8, row: 3 },
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
      'T.R....D.....R.T',
      'TRRRRRR==RRRRRRT',
      'T.R...,,,,...R.T',
      'T.R..........R.T',
      'T.RR..RRRR..RR.T',
      'T.....X........T',
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
          { col: 7, row: 3 },
          { col: 8, row: 3 },
        ],
      },
      { gateId: 'mountain-wall', col: 6, row: 7, opens: [{ col: 6, row: 7 }] },
      { gateId: 'keep-gate', col: 7, row: 2 },
    ],
    portals: [{ col: 7, row: 2, to: 'd2-entrance', spawnCol: 7, spawnRow: 8, guardedBy: 'mountain-summit-seal' }],
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
  // ------------------------------------------- dungeon three: the Ember Vault
  {
    id: 'd3-entrance',
    name: 'The Ember Vault',
    region: 'Ember Vault',
    rows: [
      '#######DD#######',
      '#..............#',
      '#..RR......RR..#',
      '#..RR......RR..#',
      '#......==......#',
      '#......,,......#',
      '#..............#',
      '#..XX......XX..#',
      '#..............#',
      '#######..#######',
      '#######..#######',
    ],
    exits: {},
    gates: [{ gateId: 'd3-door-1', col: 7, row: 4, opens: [{ col: 7, row: 4 }, { col: 8, row: 4 }] }],
    portals: [
      { col: 7, row: 10, to: 'waterfall', spawnCol: 7, spawnRow: 6 },
      { col: 7, row: 0, to: 'd3-hall', spawnCol: 7, spawnRow: 9 },
      { col: 3, row: 7, to: 'd3-cache', spawnCol: 7, spawnRow: 9 },
    ],
    spawns: [
      { kind: 'caster', col: 6, row: 2 },
      { kind: 'shooter', col: 11, row: 8 },
    ],
  },
  {
    id: 'd3-cache',
    name: 'A Blasted Alcove',
    region: 'Ember Vault',
    rows: [
      '################',
      '#..............#',
      '#..............#',
      '#....######....#',
      '#....#....#....#',
      '#....#....#....#',
      '#....######....#',
      '#..............#',
      '#..............#',
      '#######..#######',
      '#######..#######',
    ],
    exits: {},
    dark: true,
    gates: [{ gateId: 'ember-chest', col: 7, row: 4 }],
    portals: [{ col: 7, row: 10, to: 'd3-entrance', spawnCol: 3, spawnRow: 8 }],
    spawns: [{ kind: 'flyer', col: 3, row: 8 }],
  },
  {
    id: 'd3-hall',
    name: 'The Ember Gallery',
    region: 'Ember Vault',
    rows: [
      '####DD#####DD###',
      '#..............#',
      '#.RRR......RRR.#',
      '#.RRR......RRR.#',
      '#......==......#',
      '#......,,......#',
      '#.RRR......RRR.#',
      '#.RRR......RRR.#',
      '#..............#',
      '#######..#######',
      '#######..#######',
    ],
    exits: {},
    gates: [{ gateId: 'd3-door-2', col: 7, row: 4, opens: [{ col: 7, row: 4 }, { col: 8, row: 4 }] }],
    portals: [
      { col: 7, row: 10, to: 'd3-entrance', spawnCol: 7, spawnRow: 1 },
      { col: 4, row: 0, to: 'd3-treasury', spawnCol: 7, spawnRow: 9 },
      { col: 11, row: 0, to: 'd3-approach', spawnCol: 7, spawnRow: 9 },
    ],
    spawns: [
      { kind: 'caster', col: 5, row: 5 },
      { kind: 'caster', col: 10, row: 5 },
    ],
  },
  {
    id: 'd3-treasury',
    name: 'The Ember Treasury',
    region: 'Ember Vault',
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
    gates: [
      { gateId: 'd3-door-3', col: 7, row: 6, opens: [{ col: 7, row: 6 }, { col: 8, row: 6 }] },
      { gateId: 'd3-chest', col: 7, row: 3 },
    ],
    portals: [{ col: 7, row: 10, to: 'd3-hall', spawnCol: 4, spawnRow: 1 }],
    spawns: [{ kind: 'chaser', col: 3, row: 8 }],
  },
  {
    id: 'd3-approach',
    name: 'Before the Ember',
    region: 'Ember Vault',
    rows: [
      '#######DD#######',
      '#......==......#',
      '#......,,......#',
      '#..............#',
      '#.RR........RR.#',
      '#..............#',
      '#.RR........RR.#',
      '#..............#',
      '#..............#',
      '#######..#######',
      '#######..#######',
    ],
    exits: {},
    gates: [{ gateId: 'd3-boss', col: 7, row: 1, opens: [{ col: 7, row: 1 }, { col: 8, row: 1 }] }],
    portals: [
      { col: 7, row: 10, to: 'd3-hall', spawnCol: 11, spawnRow: 1 },
      { col: 7, row: 0, to: 'd3-boss-room', spawnCol: 7, spawnRow: 9 },
    ],
    spawns: [
      { kind: 'caster', col: 4, row: 5 },
      { kind: 'chaser', col: 11, row: 5 },
    ],
  },
  {
    id: 'd3-boss-room',
    name: 'The Ember Heart',
    region: 'Ember Vault',
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
    portals: [{ col: 7, row: 10, to: 'd3-approach', spawnCol: 7, spawnRow: 3 }],
    spawns: [{ kind: 'boss3', col: 7, row: 3 }],
  },

  // ----------------------------------------- dungeon four: the Sunless Spire
  {
    id: 'd4-entrance',
    name: 'The Sunless Spire',
    region: 'Sunless Spire',
    rows: [
      '#######DD#######',
      '#..............#',
      '#..####..####..#',
      '#..#........#..#',
      '#......==......#',
      '#......,,......#',
      '#..#........#..#',
      '#..####..####..#',
      '#..............#',
      '#######..#######',
      '#######..#######',
    ],
    exits: {},
    gates: [{ gateId: 'd4-door-1', col: 7, row: 4, opens: [{ col: 7, row: 4 }, { col: 8, row: 4 }] }],
    portals: [
      { col: 7, row: 10, to: 'graveyard-1', spawnCol: 11, spawnRow: 5 },
      { col: 7, row: 0, to: 'd4-hall', spawnCol: 7, spawnRow: 9 },
    ],
    spawns: [
      { kind: 'caster', col: 4, row: 8 },
      { kind: 'chaser', col: 11, row: 8 },
    ],
  },
  {
    id: 'd4-hall',
    name: 'The Spiral Stair',
    region: 'Sunless Spire',
    rows: [
      '####DD#####DD###',
      '#......==......#',
      '#......,,......#',
      '#.RRRR....RRRR.#',
      '#..............#',
      '#....RRRRRR....#',
      '#..............#',
      '#.RRRR....RRRR.#',
      '#..............#',
      '#######..#######',
      '#######..#######',
    ],
    exits: {},
    gates: [{ gateId: 'd4-door-2', col: 7, row: 1, opens: [{ col: 7, row: 1 }, { col: 8, row: 1 }] }],
    portals: [
      { col: 7, row: 10, to: 'd4-entrance', spawnCol: 7, spawnRow: 1 },
      { col: 4, row: 0, to: 'd4-treasury', spawnCol: 7, spawnRow: 9 },
      { col: 11, row: 0, to: 'd4-approach', spawnCol: 7, spawnRow: 9 },
    ],
    spawns: [
      { kind: 'caster', col: 3, row: 4 },
      { kind: 'flyer', col: 12, row: 6 },
      { kind: 'chaser', col: 7, row: 8 },
    ],
  },
  {
    id: 'd4-treasury',
    name: 'The Spire Treasury',
    region: 'Sunless Spire',
    rows: [
      '################',
      '#..............#',
      '#..##########..#',
      '#..#........#..#',
      '#..#........#..#',
      '#..####..####..#',
      '#..............#',
      '#..............#',
      '#..............#',
      '#######..#######',
      '#######..#######',
    ],
    exits: {},
    dark: true,
    gates: [{ gateId: 'd4-chest', col: 7, row: 3 }],
    portals: [{ col: 7, row: 10, to: 'd4-hall', spawnCol: 4, spawnRow: 1 }],
    spawns: [{ kind: 'caster', col: 3, row: 7 }],
  },
  {
    id: 'd4-approach',
    name: 'The Spire Landing',
    region: 'Sunless Spire',
    rows: [
      '#######DD#######',
      '#......==......#',
      '#......,,......#',
      '#..............#',
      '#.RR........RR.#',
      '#......==......#',
      '#......,,......#',
      '#.RR........RR.#',
      '#..............#',
      '#######..#######',
      '#######..#######',
    ],
    exits: {},
    gates: [
      { gateId: 'd4-door-3', col: 7, row: 5, opens: [{ col: 7, row: 5 }, { col: 8, row: 5 }] },
      { gateId: 'd4-boss', col: 7, row: 1, opens: [{ col: 7, row: 1 }, { col: 8, row: 1 }] },
    ],
    portals: [
      { col: 7, row: 10, to: 'd4-hall', spawnCol: 11, spawnRow: 1 },
      { col: 7, row: 0, to: 'd4-boss-room', spawnCol: 7, spawnRow: 9 },
    ],
    spawns: [
      { kind: 'caster', col: 4, row: 3 },
      { kind: 'caster', col: 11, row: 3 },
      { kind: 'chaser', col: 7, row: 8 },
    ],
  },
  {
    id: 'd4-boss-room',
    name: 'The Sunless Peak',
    region: 'Sunless Spire',
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
    portals: [{ col: 7, row: 10, to: 'd4-approach', spawnCol: 7, spawnRow: 3 }],
    spawns: [{ kind: 'boss4', col: 7, row: 3 }],
  },

  // ------------------------------------------- caves opened with a bomb
  {
    id: 'bomb-shop',
    name: 'A Blasted-Open Cave',
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
    shop: 'secret',
    dark: true,
    portals: [{ col: 7, row: 10, to: 'village-east', spawnCol: 11, spawnRow: 8 }],
    props: [
      {
        sprite: 'shopkeeper',
        col: 7,
        row: 3,
        talk: 'You blew the wall in, so you have earned a look. Bombs and hearts, nothing fancy.',
      },
    ],
    gates: [{ gateId: 'bomb-shop', col: 7, row: 4 }],
  },
]

export const SCREENS_BY_ID: ReadonlyMap<string, Screen> = new Map(SCREENS.map((s) => [s.id, s]))

export function screenById(id: string): Screen | undefined {
  return SCREENS_BY_ID.get(id)
}

export const START_SCREEN = 'village-square'
