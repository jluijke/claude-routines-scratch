/**
 * Level 3: New York. The Village, above ground.
 *
 * The same letters as everywhere else. On a street, 'B' is the road (walkable,
 * and where the cars will be), 'S' on a road is a crosswalk, 'T' and '#' are
 * buildings, ',' is a heap of trash bags, 'p' a padlocked dumpster, '*' a
 * hydrant, '^' subway stairs, 'H' a shop door, 'X' a boarded-up door.
 *
 * The blocks are laid out on a grid and built from two templates, so a
 * street always meets an avenue where the sidewalk and the road line up and
 * every exit is reciprocal by construction: a screen's exits are whichever
 * neighbours exist on the grid, and nothing else. Streets run across the
 * screen; avenues run up it; where the two meet there is a crossroads. The
 * two parks and every interior are drawn by hand.
 *
 * Nine columns by three rows: Sheridan Square in the west, Avenue B in the
 * east, Washington Square in the middle, Tompkins Square at the far end.
 */
import type { Prop, Screen, Portal, Spawn, GatePlacement } from './screens'

const STREET = { level: 3, setting: 'street', tidy: true } as const
const PARK = { level: 3, setting: 'park', tidy: true } as const
const BODEGA = { level: 3, setting: 'bodega', tidy: true } as const

// ---------------------------------------------------------------- the grid

/** Where each block sits. x runs east, y runs south; the square is 0,0. */
const GRID: Record<string, [number, number]> = {
  'nyc-w10th': [-3, -1],
  'nyc-sixth-ave-north': [-2, -1],
  'nyc-w8th': [-1, -1],
  'nyc-fifth-ave': [0, -1],
  'nyc-astor-place': [1, -1],
  'nyc-st-marks': [2, -1],
  'nyc-second-ave-north': [3, -1],
  'nyc-tompkins-square': [4, -1],
  'nyc-tompkins-east': [5, -1],

  'nyc-sheridan-square': [-3, 0],
  'nyc-sixth-ave': [-2, 0],
  'nyc-w4th': [-1, 0],
  'nyc-washington-square': [0, 0],
  'nyc-broadway': [1, 0],
  'nyc-cooper-square': [2, 0],
  'nyc-second-ave': [3, 0],
  'nyc-avenue-a': [4, 0],
  'nyc-avenue-b': [5, 0],

  'nyc-christopher-st': [-3, 1],
  'nyc-sixth-ave-south': [-2, 1],
  'nyc-bleecker': [-1, 1],
  'nyc-washington-south': [0, 1],
  'nyc-broadway-south': [1, 1],
  'nyc-bowery': [2, 1],
  'nyc-second-ave-south': [3, 1],
  'nyc-avenue-a-south': [4, 1],
  'nyc-avenue-b-south': [5, 1],
}

type Exits = Screen['exits']

/** The exits a block has: whichever neighbours exist on the grid. */
function exitsOf(id: string): Exits {
  const [x, y] = GRID[id] as [number, number]
  const find = (dx: number, dy: number): string | undefined =>
    Object.entries(GRID).find(([, [gx, gy]]) => gx === x + dx && gy === y + dy)?.[0]
  const exits: Exits = {}
  const up = find(0, -1)
  const down = find(0, 1)
  const left = find(-1, 0)
  const right = find(1, 0)
  if (up) exits.up = up
  if (down) exits.down = down
  if (left) exits.left = left
  if (right) exits.right = right
  return exits
}

// ------------------------------------------------------------ templates

interface Block {
  id: string
  name: string
  region: string
  /** Tiles to set over the template, as "col,row=char" — the decoration. */
  set?: string[]
  props?: Prop[]
  portals?: Portal[]
  spawns?: Spawn[]
  gates?: GatePlacement[]
  pickup?: Screen['pickup']
}

function apply(rows: string[], set: string[] = []): string[] {
  const grid = rows.map((r) => r.split(''))
  for (const entry of set) {
    // Split at the first '=' only: "8,7==" sets a sealed tile.
    const eq = entry.indexOf('=')
    const at = entry.slice(0, eq)
    const char = entry.slice(eq + 1)
    const [c, r] = at.split(',').map(Number) as [number, number]
    ;(grid[r] as string[])[c] = char
  }
  return grid.map((r) => r.join(''))
}

/**
 * A street: buildings above and below, a two-lane road across the middle.
 * A neighbour above or below means a side street comes in through the
 * buildings, with a crosswalk over the main road where it meets it.
 */
function street(block: Block): Screen {
  const exits = exitsOf(block.id)
  const rows = [
    'TTTTTTTTTTTTTTTT',
    'TTTTTTTTTTTTTTTT',
    'TTTTTTTTTTTTTTTT',
    '................',
    'BBBBBBBBBBBBBBBB',
    'BBBBBBBBBBBBBBBB',
    '................',
    '################',
    '################',
    '################',
    '################',
  ]
  const set: string[] = []
  const side = (top: boolean): void => {
    const rs = top ? [0, 1, 2] : [7, 8, 9, 10]
    for (const r of rs) {
      set.push(`6,${r}=.`, `7,${r}=B`, `8,${r}=B`, `9,${r}=.`)
    }
    // The crosswalk across the main road, and across the side street.
    for (const r of [4, 5]) set.push(`6,${r}=S`, `9,${r}=S`)
    set.push(`7,${top ? 3 : 6}=S`, `8,${top ? 3 : 6}=S`)
  }
  if (exits.up) side(true)
  if (exits.down) side(false)
  // A closed end is a closed end: barriers across the road.
  if (!exits.left) set.push('0,4=R', '0,5=R')
  if (!exits.right) set.push('15,4=R', '15,5=R')
  return finish(block, exits, apply(rows, [...set, ...(block.set ?? [])]))
}

/**
 * An avenue: buildings either side, a road up the middle — four lanes, or
 * two for the lettered avenues. A neighbour left or right means a cross
 * street, with the crosswalks either side of it.
 */
function avenue(block: Block, lanes: 2 | 4 = 4, oneWay?: 'up' | 'down'): Screen {
  const exits = exitsOf(block.id)
  const roadL = lanes === 4 ? 6 : 7
  const roadR = lanes === 4 ? 9 : 8
  const line = (): string =>
    Array.from({ length: 16 }, (_, c) =>
      c < roadL - 1 ? 'T' : c === roadL - 1 ? '.' : c <= roadR ? 'B' : c === roadR + 1 ? '.' : '#',
    ).join('')
  const rows = Array.from({ length: 11 }, line)
  const set: string[] = []
  const cross = (left: boolean): void => {
    const cs = left ? [0, 1, 2, 3, 4, 5].filter((c) => c < roadL - 1) : [10, 11, 12, 13, 14, 15].filter((c) => c > roadR + 1)
    for (const c of cs) set.push(`${c},3=.`, `${c},4=B`, `${c},5=B`, `${c},6=.`)
    // The crosswalk over the avenue, and over the cross street.
    for (const c of [roadL - 1, roadR + 1]) set.push(`${c},4=S`, `${c},5=S`)
    for (let c = roadL; c <= roadR; c++) set.push(`${c},${left ? 3 : 6}=S`)
  }
  if (exits.left) cross(true)
  if (exits.right) cross(false)
  if (!exits.left && !exits.right) for (let c = roadL; c <= roadR; c++) set.push(`${c},5=S`)
  if (!exits.up) for (let c = roadL; c <= roadR; c++) set.push(`${c},0=R`)
  if (!exits.down) for (let c = roadL; c <= roadR; c++) set.push(`${c},10=R`)
  // The block's own decorations and rats are written for a sidewalk at
  // column 5 and 10 — the four-lane avenue's — and a door in the building
  // beside it at 4 and 11. A two-lane avenue's sidewalks are a tile closer
  // in, so everything slides with them.
  const shift = lanes === 4 ? 0 : 1
  const move = (c: number): number => (c <= 5 ? c + shift : c >= 10 ? c - shift : c)
  const own = (block.set ?? []).map((entry) => {
    const eq = entry.indexOf('=')
    const [c, r] = entry.slice(0, eq).split(',').map(Number) as [number, number]
    return `${move(c)},${r}${entry.slice(eq)}`
  })
  const spawns = (block.spawns ?? []).map((s) => ({ ...s, col: move(s.col) }))
  const portals = (block.portals ?? []).map((d) => ({ ...d, col: move(d.col) }))
  const props = (block.props ?? []).map((d) => ({ ...d, col: move(d.col) }))
  const gates = (block.gates ?? []).map((g) => ({
    ...g,
    col: move(g.col),
    ...(g.opens ? { opens: g.opens.map((o) => ({ ...o, col: move(o.col) })) } : {}),
  }))
  const screen = finish(
    { ...block, spawns, portals, props, gates, set: [] },
    exits,
    apply(rows, [...set, ...own]),
  )
  return oneWay ? { ...screen, traffic: { oneWay } } : screen
}

function finish(block: Block, exits: Exits, rows: string[]): Screen {
  return {
    id: block.id,
    name: block.name,
    region: block.region,
    ...STREET,
    rows,
    exits,
    ...(block.props ? { props: block.props } : {}),
    ...(block.portals ? { portals: block.portals } : {}),
    ...(block.spawns ? { spawns: block.spawns } : {}),
    ...(block.gates ? { gates: block.gates } : {}),
    ...(block.pickup ? { pickup: block.pickup } : {}),
  }
}

/** Two rats on the sidewalk, which is what a block has on it by default. */
const rats = (a: [number, number], b: [number, number]): Spawn[] => [
  { kind: 'chaser', col: a[0], row: a[1] },
  { kind: 'chaser', col: b[0], row: b[1] },
]

/** A shop door on the street, and the way back out of its interior. */
function door(col: number, row: number, to: string): Portal {
  return { col, row, to, spawnCol: 7, spawnRow: 8 }
}
function wayOut(to: string, spawnCol: number, spawnRow: number): Portal {
  return { col: 7, row: 9, to, spawnCol, spawnRow }
}

// ---------------------------------------------------------------- the blocks

const WEST = 'West Village'
const EAST = 'East Village'
const SQUARE = 'Washington Square'

const BLOCKS: Screen[] = [
  // --- the western end -----------------------------------------------------
  street({
    id: 'nyc-w10th',
    name: 'West 10th Street',
    region: WEST,
    set: ['2,3=,', '12,6=*', '5,7=H', '10,2=X'],
    props: [{ sprite: 'scribe', col: 3, row: 6, talk: 'Quiet street. Brownstones, mostly. Somebody boarded that door up years ago.' }],
    spawns: rats([13, 3], [3, 6]),
  }),
  street({
    id: 'nyc-sheridan-square',
    name: 'Sheridan Square',
    region: WEST,
    set: ['4,2=H', '2,6=^', '11,3=,', '13,6=*', '9,3=p'],
    portals: [door(4, 2, 'nyc-newsstand')],
    props: [
      { sprite: 'scribe', col: 12, row: 3, talk: 'The newsstand sells a map of the Village. Forty dollars. Worth it, the first week.' },
      { sprite: 'pigeonA', col: 6, row: 6 },
    ],
    spawns: rats([1, 3], [14, 6]),
  }),
  street({
    id: 'nyc-christopher-st',
    name: 'Christopher Street',
    region: WEST,
    set: ['10,2=H', '3,3=,', '5,6=*', '13,6=,'],
    portals: [door(10, 2, 'nyc-hardware')],
    props: [{ sprite: 'pigeonB', col: 2, row: 6 }],
    spawns: rats([2, 3], [12, 6]),
  }),

  // --- Sixth Avenue --------------------------------------------------------
  avenue({
    id: 'nyc-sixth-ave-north',
    name: 'Sixth Avenue & 8th',
    region: WEST,
    set: ['5,8=,', '10,1=*', '5,3=p'],
    spawns: rats([5, 1], [10, 9]),
  }, 4, 'up'),
  avenue({
    id: 'nyc-sixth-ave',
    name: 'Sixth Avenue & 4th',
    region: WEST,
    set: ['10,8=,', '5,1=*', '10,1=^'],
    props: [
      { sprite: 'scribe', col: 10, row: 8, talk: 'Sixth Avenue. Four lanes and nobody slows down. Wait for the little man.' },
    ],
    spawns: rats([5, 8], [10, 2]),
    // Police tape across the cross street, on the square's side.
    gates: [{ gateId: 'nyc-sixth-ave-tape', col: 11, row: 4, opens: [{ col: 11, row: 4 }, { col: 11, row: 5 }] }],
  }, 4, 'up'),
  avenue({
    id: 'nyc-sixth-ave-south',
    name: 'Sixth Avenue & Bleecker',
    region: WEST,
    set: ['5,9=,', '10,2=*', '5,8=,'],
    spawns: rats([5, 2], [10, 9]),
  }, 4, 'up'),

  // --- the blocks beside the square ----------------------------------------
  street({
    id: 'nyc-w8th',
    name: 'West 8th Street',
    region: WEST,
    set: ['3,2=X', '11,2=H', '2,3=,', '13,6=*', '8,7=='],
    portals: [door(11, 2, 'nyc-pizza')],
    gates: [{ gateId: 'nyc-w8th-chest', col: 8, row: 7 }],
    props: [{ sprite: 'pigeonA', col: 5, row: 6 }],
    spawns: rats([1, 3], [14, 3]),
  }),
  street({
    id: 'nyc-w4th',
    name: 'West 4th & MacDougal',
    region: WEST,
    set: ['2,3=,', '13,3=*', '3,6=p', '12,7=H'],
    portals: [door(12, 7, 'nyc-florist')],
    props: [{ sprite: 'scribe', col: 4, row: 3, talk: 'Flowers by Rosa, down on the corner. She sells the only thing that works on the three of them. Love.' }],
    spawns: rats([1, 6], [14, 6]),
  }),
  street({
    id: 'nyc-bleecker',
    name: 'Bleecker Street',
    region: WEST,
    set: ['4,2=H', '11,2=H', '2,3=*', '13,6=,', '7,6=,'],
    portals: [door(4, 2, 'nyc-pet-shop'), door(11, 2, 'nyc-bodega-bleecker')],
    props: [
      { sprite: 'dogA', col: 6, row: 3 },
      { sprite: 'scribe', col: 9, row: 6, talk: 'The pet shop is the one with the green awning. Same six as ever, he says.' },
    ],
    spawns: rats([1, 6], [14, 3]),
  }),

  // --- Fifth Avenue, and the arch ------------------------------------------
  avenue({
    id: 'nyc-fifth-ave',
    name: 'Fifth Avenue',
    region: SQUARE,
    set: ['5,8=,', '10,8=*', '5,2=^'],
    props: [
      { sprite: 'purpleCar', col: 6, row: 1, solid: true },
      { sprite: 'scribe', col: 10, row: 2, talk: 'Fifth Avenue runs all the way up the island. Not today, though — see the barriers.' },
    ],
    spawns: rats([5, 8], [10, 9]),
  }, 4, 'down'),
  street({
    id: 'nyc-washington-south',
    name: 'Washington Square South',
    region: SQUARE,
    set: ['3,7=H', '12,7=H', '2,3=,', '13,3=*', '11,6=,'],
    portals: [door(3, 7, 'nyc-bodega'), door(12, 7, 'nyc-pawn')],
    props: [
      { sprite: 'scribe', col: 5, row: 3, talk: 'Hot dog, a dollar. Mustard, no ketchup. That is not a suggestion, that is the law.' },
      { sprite: 'pigeonB', col: 9, row: 3 },
    ],
    spawns: rats([1, 6], [14, 6]),
  }),

  // --- Broadway --------------------------------------------------------------
  avenue({
    id: 'nyc-astor-place',
    name: 'Astor Place',
    region: EAST,
    set: ['5,8=^', '10,2=,', '10,8=*', '5,9=p'],
    props: [
      { sprite: 'scribe', col: 5, row: 2, talk: 'The cube used to turn if you pushed it. The subway is down those stairs — when they open it.' },
    ],
    spawns: rats([5, 8], [10, 1]),
  }, 4, 'down'),
  avenue({
    id: 'nyc-broadway',
    name: 'Broadway & 4th',
    region: EAST,
    set: ['5,8=,', '10,8=,', '5,1=*'],
    spawns: rats([5, 2], [10, 8]),
    // Police tape across the cross street, on the square's side.
    gates: [{ gateId: 'nyc-broadway-tape', col: 4, row: 4, opens: [{ col: 4, row: 4 }, { col: 4, row: 5 }] }],
  }, 4, 'down'),
  avenue({
    id: 'nyc-broadway-south',
    name: 'Broadway & Bleecker',
    region: EAST,
    set: ['5,2=,', '10,9=*', '5,8=p'],
    spawns: rats([5, 9], [10, 2]),
  }, 4, 'down'),

  // --- the East Village ----------------------------------------------------
  street({
    id: 'nyc-st-marks',
    name: 'St Marks Place',
    region: EAST,
    set: ['2,3=,', '4,3=,', '12,3=,', '13,6=,', '3,6=*', '10,2=X', '5,2=H'],
    portals: [door(5, 2, 'nyc-record-shop')],
    props: [
      { sprite: 'scribe', col: 8, row: 6, talk: 'St Marks. Everything on this block is either for sale or trash, and it is hard to tell which.' },
      { sprite: 'pigeonA', col: 14, row: 3 },
    ],
    spawns: [...rats([1, 3], [14, 6]), { kind: 'flyer', col: 8, row: 3 }],
  }),
  street({
    id: 'nyc-cooper-square',
    name: 'Cooper Square',
    region: EAST,
    set: ['2,3=*', '13,3=,', '3,6=,', '12,6=p'],
    props: [{ sprite: 'pigeonB', col: 11, row: 3 }],
    spawns: [...rats([1, 6], [14, 6]), { kind: 'flyer', col: 12, row: 3 }],
  }),
  street({
    id: 'nyc-bowery',
    name: 'The Bowery',
    region: EAST,
    set: ['2,3=,', '4,3=,', '12,6=,', '13,3=*', '10,7=X'],
    props: [{ sprite: 'scribe', col: 6, row: 6, talk: 'Somebody boarded that shop up. Firecrackers would have it open. Not that I said so.' }],
    spawns: rats([1, 3], [14, 6]),
  }),

  // --- Second Avenue ---------------------------------------------------------
  avenue({
    id: 'nyc-second-ave-north',
    name: 'Second Avenue & 7th',
    region: EAST,
    set: ['5,8=,', '10,1=*', '5,1=p'],
    spawns: rats([5, 2], [10, 9]),
  }, 4, 'down'),
  avenue({
    id: 'nyc-second-ave',
    name: 'Second Avenue & 4th',
    region: EAST,
    set: ['11,2=H', '5,8=,', '10,8=*', '5,9=^'],
    portals: [door(11, 2, 'nyc-bodega')],
    props: [
      { sprite: 'scribe', col: 5, row: 8, talk: "Ray's is the one with the cat in the window. Best sandwich in the Village, and the cat agrees." },
    ],
    spawns: rats([5, 1], [10, 9]),
  }, 4, 'down'),
  avenue({
    id: 'nyc-second-ave-south',
    name: 'Second Avenue & Houston',
    region: EAST,
    set: ['5,2=,', '10,9=,', '5,7=*'],
    spawns: rats([5, 9], [10, 1]),
  }, 4, 'down'),

  // --- Alphabet City ---------------------------------------------------------
  avenue(
    {
      id: 'nyc-avenue-a',
      name: 'Avenue A & 7th',
      region: EAST,
      set: ['5,2=,', '10,1=*', '5,9=^', '10,8=,'],
      props: [
        { sprite: 'pigeonA', col: 10, row: 2 },
      ],
      spawns: rats([5, 8], [10, 2]),
    },
    2,
    'up',
  ),
  avenue(
    {
      id: 'nyc-avenue-a-south',
      name: 'Avenue A & 4th',
      region: EAST,
      set: ['5,8=,', '10,2=*', '10,9=p'],
      spawns: rats([5, 2], [10, 8]),
    },
    2,
    'up',
  ),
  avenue(
    {
      id: 'nyc-tompkins-east',
      name: 'Avenue B & 9th',
      region: EAST,
      set: ['5,8=,', '10,2=*', '10,9=,'],
      props: [{ sprite: 'scribe', col: 10, row: 3, talk: 'Avenue B. Past here is the river, and past that is Brooklyn, and that is a different story.' }],
      spawns: rats([5, 9], [10, 8]),
    },
    2,
    'down',
  ),
  avenue(
    {
      id: 'nyc-avenue-b',
      name: 'Avenue B & 7th',
      region: EAST,
      set: ['11,2=H', '5,8=,', '10,7=*', '5,2=,'],
      portals: [{ col: 11, row: 2, to: 'nyc-garden', spawnCol: 7, spawnRow: 9 }],
      props: [{ sprite: 'scribe', col: 5, row: 9, talk: 'The community garden. Members only, she says. She says it to everybody.' }],
      spawns: rats([5, 2], [10, 8]),
    },
    2,
    'down',
  ),
  avenue(
    {
      id: 'nyc-avenue-b-south',
      name: 'Avenue B & 4th',
      region: EAST,
      set: ['5,2=,', '10,9=,', '5,9=*', '10,1=p'],
      props: [{ sprite: 'pigeonB', col: 5, row: 8 }],
      spawns: rats([5, 8], [10, 2]),
    },
    2,
    'down',
  ),
]

// ---------------------------------------------------------------- the parks

const PARKS: Screen[] = [
  {
    id: 'nyc-washington-square',
    name: 'Washington Square',
    region: SQUARE,
    ...PARK,
    // The arch stands in the north gap: pillars either side, the span
    // overhead, and he walks under it to Fifth Avenue.
    rows: [
      'TTTTTT*AA*TTTTTT',
      'T,.....SS.....,T',
      'T....SSSSSSS...T',
      '#....S~~~~~S...#',
      '.....S~~~~~S....',
      '.....S~~~~~S....',
      '#....SSSSSSS...#',
      'T,.....SSS.=...T',
      'T^.....SSS.....T',
      'T......SSS.....T',
      'TTTTTT.SSS.TTTTT',
    ],
    exits: exitsOf('nyc-washington-square'),
    pickup: {
      id: 'nyc-square-knife',
      col: 3,
      row: 8,
      item: 'woodenSword',
      message:
        'A kitchen knife, left on a bench with half a sandwich. Better than bare hands. Swing it with Z or Space.',
    },
    gates: [{ gateId: 'nyc-square-chest', col: 11, row: 7 }],
    props: [
      { sprite: 'scribe', col: 3, row: 4, talk: 'Chess? Sit down. Loser buys the pretzels. The knife on the bench is nobody\'s, if you want it.' },
      { sprite: 'pigeonA', col: 11, row: 2 },
      { sprite: 'pigeonB', col: 12, row: 8 },
      { sprite: 'pigeonA', col: 4, row: 9 },
    ],
  },
  {
    id: 'nyc-tompkins-square',
    name: 'Tompkins Square Park',
    region: EAST,
    ...PARK,
    // The dog run is the fenced yard at the top, with its own gate in the
    // railings; the chest is under the bench beside it.
    rows: [
      'TTTTTTTTTTTTTTTT',
      'T#############.T',
      'T#...........#.T',
      '.#....,......#..',
      '.####.....####..',
      '......SSS.......',
      '#..,..S=S..,...#',
      'T.....SSS......T',
      'T.SSSSSSSSSSSS.T',
      'T.S..,......S..T',
      'TTTTTT.SSS.TTTTT',
    ],
    exits: exitsOf('nyc-tompkins-square'),
    gates: [{ gateId: 'nyc-tompkins-chest', col: 7, row: 6 }],
    props: [
      { sprite: 'dogA', col: 4, row: 2 },
      { sprite: 'dogB', col: 9, row: 3 },
      { sprite: 'dogA', col: 11, row: 2 },
      { sprite: 'scribe', col: 3, row: 7, talk: 'The dog run. Every dog in the Village, and every one of them is watching that box.' },
      { sprite: 'pigeonB', col: 13, row: 9 },
    ],
    spawns: [{ kind: 'flyer', col: 12, row: 7 }],
  },
]

// ----------------------------------------------------------- the interiors

/** The shape every shop has inside: shelves, a counter, the door at the bottom. */
const SHOP_ROWS = [
  '################',
  '#RRRR..RRRR..~~#',
  '#..............#',
  '#RRRR..RRRR....#',
  '#..............#',
  '#RRRR..RRRR.***#',
  '#..............#',
  '#,.............#',
  '#..............#',
  '#######H########',
  '################',
]

const INTERIORS: Screen[] = [
  {
    id: 'nyc-bodega',
    name: "Ray's Deli & Grocery",
    region: EAST,
    ...BODEGA,
    rows: SHOP_ROWS,
    exits: {},
    shop: 'village',
    portals: [wayOut('nyc-second-ave', 10, 3)],
    props: [
      { sprite: 'scribe', col: 13, row: 4, talk: 'Bandages, firecrackers, sandwiches. Cat is not for sale.' },
      { sprite: 'catA', col: 12, row: 5 },
    ],
  },
  {
    id: 'nyc-bodega-bleecker',
    name: 'Bleecker Street Deli',
    region: WEST,
    ...BODEGA,
    rows: SHOP_ROWS,
    exits: {},
    shop: 'village',
    portals: [wayOut('nyc-bleecker', 11, 3)],
    props: [{ sprite: 'scribe', col: 13, row: 4, talk: 'Same as Ray\'s, only closer. He will tell you different.' }],
  },
  {
    id: 'nyc-newsstand',
    name: 'The Newsstand',
    region: WEST,
    ...BODEGA,
    rows: [
      '################',
      '#RRRRRRRRRRRRRR#',
      '#..............#',
      '#,............,#',
      '#..............#',
      '#.....*****....#',
      '#..............#',
      '#,.............#',
      '#..............#',
      '#######H########',
      '################',
    ],
    exits: {},
    shop: 'castaway',
    portals: [wayOut('nyc-sheridan-square', 4, 3)],
    props: [{ sprite: 'scribe', col: 8, row: 4, talk: 'Map of the Village. Forty. You will want it.' }],
  },
  {
    id: 'nyc-hardware',
    name: 'Sheridan Hardware',
    region: WEST,
    ...BODEGA,
    rows: SHOP_ROWS,
    exits: {},
    shop: 'smith',
    portals: [wayOut('nyc-christopher-st', 10, 3)],
    props: [{ sprite: 'scribe', col: 13, row: 4, talk: 'Hammers, cutters, things that go bang. Prove you are careful and the hammer is yours.' }],
  },
  {
    id: 'nyc-pawn',
    name: 'We Buy Gold',
    region: SQUARE,
    ...BODEGA,
    rows: [
      '################',
      '#RRRRRRRRRRRRRR#',
      '#..............#',
      '#..............#',
      '#....*******...#',
      '#..............#',
      '#..............#',
      '#,............,#',
      '#..............#',
      '#######H########',
      '################',
    ],
    exits: {},
    shop: 'secret',
    portals: [wayOut('nyc-washington-south', 12, 6)],
    props: [{ sprite: 'scribe', col: 8, row: 3, talk: '...' }],
  },
  {
    id: 'nyc-pet-shop',
    name: 'The Pet Shop',
    region: WEST,
    ...BODEGA,
    rows: [
      '################',
      '#RR..RR..RR..RR#',
      '#..............#',
      '#..............#',
      '#RR..RR..RR..RR#',
      '#..............#',
      '#......***.....#',
      '#..............#',
      '#..............#',
      '#######H########',
      '################',
    ],
    exits: {},
    shop: 'pets',
    portals: [wayOut('nyc-bleecker', 4, 3)],
    props: [
      { sprite: 'scribe', col: 8, row: 5, talk: 'You again? A thousand years each way and you still haven\'t decided.' },
      { sprite: 'catA', col: 2, row: 2 },
      { sprite: 'dogB', col: 12, row: 2 },
      { sprite: 'rabbitA', col: 6, row: 5 },
    ],
  },
  {
    id: 'nyc-florist',
    name: 'Flowers by Rosa',
    region: WEST,
    ...BODEGA,
    rows: [
      '################',
      '#,,,,......,,,,#',
      '#..............#',
      '#,,..........,,#',
      '#..............#',
      '#.....*****....#',
      '#..............#',
      '#,,..........,,#',
      '#..............#',
      '#######H########',
      '################',
    ],
    exits: {},
    portals: [wayOut('nyc-w4th', 12, 6)],
    props: [
      {
        sprite: 'scribe',
        col: 8,
        row: 4,
        talk: 'Love bombs. Not yet, sweetheart — the delivery has not come. Come back when the three of them are in town.',
      },
    ],
  },
  {
    id: 'nyc-pizza',
    name: "Joe's Pizza",
    region: WEST,
    ...BODEGA,
    rows: [
      '################',
      '#RRRRRRRRRRRRRR#',
      '#..............#',
      '#.....*****....#',
      '#..............#',
      '#..............#',
      '#..RR....RR....#',
      '#..............#',
      '#..............#',
      '#######H########',
      '################',
    ],
    exits: {},
    portals: [wayOut('nyc-w8th', 11, 3)],
    props: [{ sprite: 'scribe', col: 8, row: 2, talk: 'Slice is three dollars. Fold it. If you do not fold it, we cannot serve you.' }],
  },
  {
    id: 'nyc-record-shop',
    name: 'Rockit Records',
    region: EAST,
    ...BODEGA,
    rows: [
      '################',
      '#RRRRRRRRRRRRRR#',
      '#..............#',
      '#.RRRR....RRRR.#',
      '#..............#',
      '#.RRRR....RRRR.#',
      '#..............#',
      '#.....*****....#',
      '#..............#',
      '#######H########',
      '################',
    ],
    exits: {},
    portals: [wayOut('nyc-st-marks', 5, 3)],
    props: [{ sprite: 'scribe', col: 8, row: 8, talk: 'No, we do not have it. Yes, I can order it. No, I do not know when.' }],
  },
  {
    id: 'nyc-garden',
    name: 'The Community Garden',
    region: EAST,
    ...PARK,
    rows: [
      'TTTTTTTTTTTTTTTT',
      'T,,,,,.....,,,,T',
      'T..............T',
      'T,,,,,..,,,,,,,T',
      'T..............T',
      'T,,,,,..,,,,,,,T',
      'T........R=R...T',
      'T,,,,,...RRR...T',
      'TTTTTTT=TTTTTTTT',
      'TTTTTTT.TTTTTTTT',
      'TTTTTTTHTTTTTTTT',
    ],
    exits: {},
    portals: [{ col: 7, row: 10, to: 'nyc-avenue-b', spawnCol: 9, spawnRow: 3 }],
    gates: [
      { gateId: 'nyc-garden-gate', col: 7, row: 8 },
      { gateId: 'nyc-garden-chest', col: 10, row: 6 },
    ],
    props: [{ sprite: 'scribe', col: 4, row: 8, talk: 'Mind the tomatoes. The shed at the back is mine, and so is what is in it.' }],
  },
]

export const AUTHORED_CITY: Screen[] = [...BLOCKS, ...PARKS, ...INTERIORS]

/** The sample screens the design page was drawn from, kept for the previews. */
export const SAMPLE_CITY: Screen[] = [
  ...PARKS.filter((s) => s.id === 'nyc-washington-square'),
  ...BLOCKS.filter((s) => s.id === 'nyc-avenue-a' || s.id === 'nyc-bleecker'),
  ...INTERIORS.filter((s) => s.id === 'nyc-bodega'),
]
