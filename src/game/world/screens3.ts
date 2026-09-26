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
import { TRAIN_CAR } from './subway'

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

/**
 * Pairs of neighbours with no street between them: a building runs the
 * whole block instead. These make the two police tapes real. Sixth Avenue
 * and Broadway each cross three streets, and a tape on one crossing is only
 * a tape if the other two are closed — otherwise he walks a block round it
 * and the spelling was for nothing. So the square and the four blocks round
 * it are a pocket, and the only ways out of it west and east are the two
 * taped crossings.
 */
const CLOSED: [string, string][] = [
  ['nyc-w8th', 'nyc-sixth-ave-north'],
  ['nyc-bleecker', 'nyc-sixth-ave-south'],
  ['nyc-fifth-ave', 'nyc-astor-place'],
  ['nyc-washington-south', 'nyc-broadway-south'],
]

/** The exits a block has: whichever neighbours exist on the grid, and are not closed off. */
function exitsOf(id: string): Exits {
  const [x, y] = GRID[id] as [number, number]
  const closed = (other: string): boolean => CLOSED.some(([a, b]) => (a === id && b === other) || (a === other && b === id))
  const find = (dx: number, dy: number): string | undefined => {
    const found = Object.entries(GRID).find(([, [gx, gy]]) => gx === x + dx && gy === y + dy)?.[0]
    return found && !closed(found) ? found : undefined
  }
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
/** Subway stairs on the street, down to a station's mezzanine. */
function stairsDown(col: number, row: number, station: string): Portal {
  return { col, row, to: `nyc-sub-${station}-mezz`, spawnCol: 7, spawnRow: 3 }
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
    portals: [door(4, 2, 'nyc-newsstand'), stairsDown(2, 6, 'christopher')],
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
    portals: [stairsDown(10, 1, 'w4')],
    props: [
      { sprite: 'scribe', col: 10, row: 8, talk: 'Sixth Avenue. Four lanes and nobody slows down. Wait for the little man.' },
    ],
    spawns: rats([5, 8], [10, 7]),
    // Police tape across the cross street, sidewalk to sidewalk, on the
    // square's side: the West Village is on the far side of it.
    gates: [
      {
        gateId: 'nyc-sixth-ave-tape',
        col: 11,
        row: 4,
        opens: [3, 4, 5, 6].map((row) => ({ col: 11, row })),
        guards: 'right',
      },
    ],
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
    set: ['5,8=,', '10,8=*'],
    // The purple car, parked half on the sidewalk with its back door open.
    // Step in and it takes him somewhere. It never says where.
    portals: [{ col: 5, row: 1, to: 'nyc-times-square', spawnCol: 7, spawnRow: 5, car: true }],
    props: [
      { sprite: 'purpleCar', col: 5, row: 1 },
      { sprite: 'scribe', col: 10, row: 2, talk: 'Fifth Avenue runs all the way up the island. Not today, though — see the barriers. That purple car? Get in. Or don\'t. It goes where it likes.' },
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
    portals: [stairsDown(5, 8, 'astor')],
    props: [
      { sprite: 'scribe', col: 5, row: 2, talk: 'The cube used to turn if you pushed it. The subway is down those stairs. Three words at the turnstile and you ride.' },
    ],
    spawns: rats([5, 3], [10, 1]),
  }, 4, 'down'),
  avenue({
    id: 'nyc-broadway',
    name: 'Broadway & 4th',
    region: EAST,
    set: ['5,8=,', '10,8=,', '5,1=*'],
    spawns: rats([5, 2], [10, 8]),
    // Police tape across the cross street, sidewalk to sidewalk, on the
    // square's side: the East Village is on the far side of it.
    gates: [
      {
        gateId: 'nyc-broadway-tape',
        col: 4,
        row: 4,
        opens: [3, 4, 5, 6].map((row) => ({ col: 4, row })),
        guards: 'left',
      },
    ],
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
    set: ['11,2=H', '5,8=,', '10,8=*', '5,9=,'],
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
    set: ['5,2=,', '10,9=,', '5,7=*', '5,9=^'],
    portals: [stairsDown(5, 9, '2av')],
    props: [{ sprite: 'scribe', col: 10, row: 2, talk: 'Second Avenue station. The F used to stop here. Now it is the V, and it goes where it likes.' }],
    spawns: rats([5, 3], [10, 1]),
  }, 4, 'down'),

  // --- Alphabet City ---------------------------------------------------------
  avenue(
    {
      id: 'nyc-avenue-a',
      name: 'Avenue A & 7th',
      region: EAST,
      set: ['5,2=,', '10,1=*', '5,9=,', '10,8=,'],
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
    shop: 'florist',
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

// ---------------------------------------------------------------- the subway

/**
 * Every station is three screens deep: the mezzanine at the foot of the
 * street stairs, with the booth and the turnstiles; a tiled passage; and the
 * platform, with the train standing at it. The turnstiles are a barrier that
 * asks three words every time he comes down — the spelling is the fare — and
 * the platform is a whole screen further on, so the fare is paid well before
 * the train. Union Square has no stairs to the Village: it is the end of the
 * line, and the only way to it is to ride.
 */
const PLATFORM = { level: 3, setting: 'platform', tidy: true } as const
const TRAIN = { level: 3, setting: 'train', tidy: true } as const
const SUBWAY_REGION = 'The Subway'

interface Station {
  key: string
  name: string
  /** What fits in the mosaic band. */
  short: string
  /** Where the stairs come out, and where he stands when they do. */
  street: string
  streetSpawn: [number, number]
  /** What the attendant in the booth says. */
  booth: string
  passage?: { set?: string[]; props?: Prop[]; spawns?: Spawn[] }
  pickup?: Screen['pickup']
}

const MEZZ_ROWS = [
  '################',
  '################',
  '#......^.......#',
  '#..............#',
  '#..............#',
  '#..............#',
  '#####====#######',
  '#..............#',
  '#..............#',
  '#..............#',
  '######....######',
]

const PASSAGE_ROWS = [
  '######....######',
  '######....######',
  '######....######',
  '###..........###',
  '###..........###',
  '###..........###',
  '###..........###',
  '######....######',
  '######....######',
  '######....######',
  '######....######',
]

/**
 * The platform. The local stands at it with its doors open; it is shorter
 * than the platform, so at either end the pit shows — and the pit can be
 * climbed down into. The far track is where the express comes through
 * without stopping, and the third rail is live the whole length of both.
 */
const PLATFORM_ROWS = [
  '######....######',
  '######....######',
  '................',
  '..R....R....R...',
  '................',
  'SSSSSSSSSSSSSSSS',
  '~~BBBBBBBBBBBB~~',
  '~~BBBBBBBBBBBB~~',
  '~~~~~~~~~~~~~~~~',
  'D~~~~~~~~~~~~~~D',
  '################',
]

function station(s: Station): Screen[] {
  const mezz = `nyc-sub-${s.key}-mezz`
  const passage = `nyc-sub-${s.key}-passage`
  const platform = `nyc-sub-${s.key}-platform`
  return [
    {
      id: mezz,
      name: `${s.name} Station`,
      region: SUBWAY_REGION,
      ...PLATFORM,
      mosaic: s.short,
      rows: MEZZ_ROWS,
      exits: { down: passage },
      portals: [{ col: 7, row: 2, to: s.street, spawnCol: s.streetSpawn[0], spawnRow: s.streetSpawn[1] }],
      gates: [
        {
          gateId: `nyc-turnstile-${s.key}`,
          col: 5,
          row: 6,
          opens: [5, 6, 7, 8].map((col) => ({ col, row: 6 })),
          guards: 'down',
        },
      ],
      props: [{ sprite: 'scribe', col: 2, row: 3, talk: s.booth }],
      ...(s.pickup ? { pickup: s.pickup } : {}),
    },
    {
      id: passage,
      name: `${s.name} Passage`,
      region: SUBWAY_REGION,
      ...PLATFORM,
      mosaic: s.short,
      rows: apply(PASSAGE_ROWS, s.passage?.set ?? []),
      exits: { up: mezz, down: platform },
      ...(s.passage?.props ? { props: s.passage.props } : {}),
      spawns: s.passage?.spawns ?? [{ kind: 'chaser', col: 4, row: 4 }],
    },
    {
      id: platform,
      name: `${s.name} Platform`,
      region: SUBWAY_REGION,
      ...PLATFORM,
      mosaic: s.short,
      rows: PLATFORM_ROWS,
      exits: { up: passage },
      spawns: rats([1, 4], [14, 4]),
    },
  ]
}

const SUBWAY: Screen[] = [
  ...station({
    key: 'christopher',
    name: 'Christopher Street',
    short: 'CHRISTOPHER ST',
    street: 'nyc-sheridan-square',
    streetSpawn: [3, 6],
    booth: 'No card, no swipe. Three words at the turnstile and you are through. That is the fare now.',
    passage: {
      set: ['3,3=,', '12,6=,'],
      props: [{ sprite: 'pigeonA', col: 8, row: 5 }],
    },
  }),
  ...station({
    key: 'w4',
    name: 'West 4th Street',
    short: 'W 4 ST',
    street: 'nyc-sixth-ave',
    streetSpawn: [10, 2],
    booth: 'Take a map, they are free. The line is the V. Uptown to Union Square, downtown to Christopher Street.',
    pickup: {
      id: 'nyc-w4-subway-map',
      col: 3,
      row: 4,
      item: 'subwayMap',
      message: 'A subway map, folded eight times. Every stop on the V, and you will know which one you are at. Press M underground.',
    },
    passage: {
      set: ['3,6=,'],
      props: [
        { sprite: 'scribe', col: 12, row: 4, talk: 'SHOWTIME! What time is it? SHOWTIME. Mind your head, mind the poles, and enjoy the show.' },
      ],
      spawns: [{ kind: 'chaser', col: 5, row: 5 }],
    },
  }),
  ...station({
    key: 'astor',
    name: 'Astor Place',
    short: 'ASTOR PL',
    street: 'nyc-astor-place',
    streetSpawn: [5, 7],
    booth: 'Beavers on the wall. Astor made his money in beaver fur. Three words and go on through.',
    passage: {
      set: ['12,3=,'],
      props: [{ sprite: 'pigeonB', col: 4, row: 6 }],
      spawns: [{ kind: 'chaser', col: 10, row: 5 }, { kind: 'chaser', col: 5, row: 4 }],
    },
  }),
  ...station({
    key: '2av',
    name: 'Second Avenue',
    short: '2 AV',
    street: 'nyc-second-ave-south',
    streetSpawn: [5, 8],
    booth: 'Last stop in Manhattan on this line, one day. Today it is just a stop. Three words.',
    passage: {
      set: ['3,4=,', '12,4=,'],
    },
  }),
  // The uptown end of the line, and the first guardian.
  ...station({
    key: '59st',
    name: '59th Street',
    short: '5 AV-59 ST',
    street: 'nyc-trump-green',
    streetSpawn: [7, 8],
    booth: 'Top of the line. The green is up the stairs, and so is he. Take a love bomb or twelve.',
    passage: {
      set: ['3,3=,', '12,6=,'],
      props: [{ sprite: 'scribe', col: 12, row: 4, talk: 'He bought the park. He says. Nobody has seen the receipt.' }],
      spawns: [{ kind: 'shooter', col: 5, row: 5 }],
    },
  }),
  ...station({
    key: 'union',
    name: 'Union Square',
    short: '14 ST-UNION SQ',
    street: 'nyc-union-square',
    streetSpawn: [7, 8],
    booth: 'End of the line, kid. The square is up the stairs. Coming back down costs the same three words.',
    passage: {
      set: ['3,3=,', '12,3=,', '3,6=,', '12,6=,'],
      props: [
        { sprite: 'scribe', col: 8, row: 5, talk: 'Busiest station in the city, and you found it on a quiet day.' },
        { sprite: 'busker', col: 4, row: 3, busker: true, talk: 'He plays the saxophone with his eyes shut. There is a hat by his feet with three dollars and a button in it.' },
      ],
      spawns: [{ kind: 'chaser', col: 4, row: 5 }, { kind: 'flyer', col: 11, row: 4 }],
    },
  }),
  // Downtown past the Village: Chinatown, Brooklyn, and the other two.
  ...station({
    key: 'canal',
    name: 'Canal Street',
    short: 'CANAL ST',
    street: 'nyc-columbus-park',
    streetSpawn: [7, 8],
    booth: 'Canal Street. Columbus Park is up the stairs. So is he, and he does not like pigeons.',
    passage: {
      set: ['3,4=,', '12,4=,'],
      spawns: [{ kind: 'caster', col: 8, row: 5 }],
    },
  }),
  ...station({
    key: 'atlantic',
    name: 'Atlantic Avenue',
    short: 'ATLANTIC AV',
    street: 'nyc-atlantic-terminal',
    streetSpawn: [7, 8],
    booth: 'Brooklyn. Yes, you crossed the river. No, you did not feel it. Three words.',
    passage: {
      set: ['3,3=,', '12,6=,'],
      props: [
        { sprite: 'pigeonA', col: 9, row: 4 },
        { sprite: 'busker', col: 11, row: 6, busker: true, talk: 'A different saxophone, the same eyes shut. Brooklyn has its own buskers, he says, and they are better.' },
      ],
      spawns: [{ kind: 'chaser', col: 4, row: 5 }, { kind: 'shooter', col: 11, row: 3 }],
    },
  }),
  ...station({
    key: 'brighton',
    name: 'Brighton Beach',
    short: 'BRIGHTON BEACH',
    street: 'nyc-boardwalk',
    streetSpawn: [7, 8],
    booth: 'End of the line, the other end. The boardwalk is up the stairs. He is on it. Bring love.',
    passage: {
      set: ['3,3=,', '12,3=,', '3,6=,', '12,6=,'],
      spawns: [{ kind: 'flyer', col: 5, row: 4 }, { kind: 'flyer', col: 10, row: 5 }],
    },
  }),
  // The end of the line, the far end: Coney Island.
  ...station({
    key: 'coney',
    name: 'Coney Island',
    short: 'CONEY ISLAND',
    street: 'nyc-coney-island',
    streetSpawn: [7, 8],
    booth: 'Coney Island, Stillwell Avenue. End of the line, and the best one. The Wonder Wheel is up the stairs.',
    passage: {
      set: ['3,3=,', '12,6=,'],
      props: [{ sprite: 'pigeonB', col: 10, row: 4 }],
      spawns: [{ kind: 'flyer', col: 5, row: 5 }],
    },
  }),
  // Up the stairs at the end of the line. The Wonder Wheel turns over the
  // beach; once all three of them have been loved, they are here, riding it,
  // pink, and very sorry.
  {
    id: 'nyc-coney-island',
    name: 'Coney Island',
    region: 'Coney Island',
    ...PARK,
    rows: [
      '~~~~~~~~~~~~~~~~',
      '~~~~~~~~~~~~~~~~',
      'SSSSSSSSSSSSSSSS',
      'T.........###..T',
      'T.........###..T',
      'T.........###..T',
      'T..............T',
      'T..............T',
      'T..............T',
      'TTTTTTT^TTTTTTTT',
      'TTTTTTTTTTTTTTTT',
    ],
    exits: {},
    portals: [{ col: 7, row: 9, to: 'nyc-sub-coney-mezz', spawnCol: 7, spawnRow: 3 }],
    treasure: {
      id: 'nyc-coney-chest',
      col: 14,
      row: 8,
      rupees: 120,
      message: 'A box under the hot dog stand, with a note: FOR WHOEVER GETS TO THE END OF THE LINE.',
    },
    props: [
      { sprite: 'wonderWheel', col: 10, row: 3 },
      { sprite: 'scribe', col: 13, row: 7, talk: 'The Wonder Wheel. A hundred years old and still going round. If you loved all three of them, they would come here. Everybody does.' },
      { sprite: 'guardianGold', col: 1, row: 5, pink: true, after: ['nyc-trump-green', 'nyc-columbus-park', 'nyc-boardwalk'],
        talk: 'Trump, pink to the ears: "Eleven times on the Wonder Wheel. Best wheel. Tremendous. Thank you for all the love. Really."' },
      { sprite: 'guardianGrey', col: 4, row: 5, pink: true, after: ['nyc-trump-green', 'nyc-columbus-park', 'nyc-boardwalk'],
        talk: 'Putin, holding a paper plate: "I am sorry about the boardwalk. Would you like a pierogi? They are very good. I bought extra."' },
      { sprite: 'guardianDark', col: 7, row: 5, pink: true, after: ['nyc-trump-green', 'nyc-columbus-park', 'nyc-boardwalk'],
        talk: 'Xi, feeding a pigeon: "The pigeons and I have made peace. Also, you spell very well. Keep going."' },
    ],
    spawns: [{ kind: 'flyer', col: 3, row: 7 }],
  },
  // The three lairs, and a plaza. Each is up its station's stairs, and the
  // stairs are the only way in or out.
  {
    id: 'nyc-trump-green',
    name: 'The Fifth Avenue Green',
    region: 'Midtown',
    ...PARK,
    rows: [
      'TTTTTTTTTTTTTTTT',
      'T*............*T',
      'T..............T',
      'T....SSSSSS....T',
      'T....S....S....T',
      'T....S....S....T',
      'T....SSSSSS....T',
      'T..,........,..T',
      'T..............T',
      'TTTTTTT^TTTTTTTT',
      'TTTTTTTTTTTTTTTT',
    ],
    exits: {},
    portals: [{ col: 7, row: 9, to: 'nyc-sub-59st-mezz', spawnCol: 7, spawnRow: 3 }],
    props: [{ sprite: 'scribe', col: 2, row: 8, talk: 'A putting green, on Fifth Avenue, with a gold fence. He says it is the best green. It is the only green.' }],
    spawns: [{ kind: 'boss1', col: 7, row: 3 }, { kind: 'flyer', col: 3, row: 5 }],
  },
  {
    id: 'nyc-columbus-park',
    name: 'Columbus Park, Chinatown',
    region: 'Chinatown',
    ...PARK,
    rows: [
      'TTTTTTTTTTTTTTTT',
      'T,............,T',
      'T..SSSSSSSSSS..T',
      'T..S........S..T',
      'T..S..*..*..S..T',
      'T..S........S..T',
      'T..S........S..T',
      'T..SSSSSSSSSS..T',
      'T..............T',
      'TTTTTTT^TTTTTTTT',
      'TTTTTTTTTTTTTTTT',
    ],
    exits: {},
    portals: [{ col: 7, row: 9, to: 'nyc-sub-canal-mezz', spawnCol: 7, spawnRow: 3 }],
    props: [
      { sprite: 'scribe', col: 13, row: 8, talk: 'Mahjong tables, usually. Everybody went home when he arrived. Xiangqi is chess; he is not good at either.' },
      { sprite: 'pigeonB', col: 2, row: 8 },
    ],
    spawns: [{ kind: 'boss3', col: 7, row: 3 }, { kind: 'caster', col: 12, row: 6 }],
  },
  {
    id: 'nyc-atlantic-terminal',
    name: 'Atlantic Terminal Plaza',
    region: 'Brooklyn',
    ...PARK,
    rows: [
      'TTTTTTTTTTTTTTTT',
      'T..*........*..T',
      'T..............T',
      'T.SSSSSSSSSSSS.T',
      'T.S..........S.T',
      'T.S..........S.T',
      'T.SSSSSSSSSSSS.T',
      'T,............,T',
      'T..............T',
      'TTTTTTT^TTTTTTTT',
      'TTTTTTTTTTTTTTTT',
    ],
    exits: {},
    portals: [{ col: 7, row: 9, to: 'nyc-sub-atlantic-mezz', spawnCol: 7, spawnRow: 3 }],
    treasure: {
      id: 'nyc-atlantic-chest',
      col: 7,
      row: 4,
      rupees: 100,
      message: 'A box in the middle of the plaza that ten thousand people a day walked past.',
    },
    props: [
      { sprite: 'scribe', col: 3, row: 8, talk: 'Brooklyn. The arena is that way, the bagels are the other way, and the bagels are better.' },
      { sprite: 'dogA', col: 12, row: 8 },
    ],
    spawns: [{ kind: 'chaser', col: 3, row: 2 }, { kind: 'chaser', col: 12, row: 2 }],
  },
  {
    id: 'nyc-boardwalk',
    name: 'The Brighton Beach Boardwalk',
    region: 'Brighton Beach',
    ...PARK,
    rows: [
      '~~~~~~~~~~~~~~~~',
      '~~~~~~~~~~~~~~~~',
      '~~~~~~~~~~~~~~~~',
      'SSSSSSSSSSSSSSSS',
      'SSSSSSSSSSSSSSSS',
      'SSSSSSSSSSSSSSSS',
      'SSSSSSSSSSSSSSSS',
      'T..*........*..T',
      'T..............T',
      'TTTTTTT^TTTTTTTT',
      'TTTTTTTTTTTTTTTT',
    ],
    exits: {},
    portals: [{ col: 7, row: 9, to: 'nyc-sub-brighton-mezz', spawnCol: 7, spawnRow: 3 }],
    props: [
      { sprite: 'scribe', col: 13, row: 8, talk: 'Little Odessa. He came for the pierogi and stayed for the boardwalk. Nobody asked him to.' },
      { sprite: 'pigeonA', col: 2, row: 8 },
    ],
    spawns: [{ kind: 'boss2', col: 7, row: 4 }, { kind: 'flyer', col: 2, row: 5 }, { kind: 'flyer', col: 13, row: 5 }],
  },
  // City Hall: the station the trains go through and nobody gets off at.
  // Closed since 1945, and the best tiles in the city. A haven, the way the
  // old square on the ship was: hearts laid out fresh every time, a chest
  // that pays once, and the rabbit.
  {
    id: 'nyc-sub-cityhall-platform',
    name: 'City Hall Platform',
    region: SUBWAY_REGION,
    ...PLATFORM,
    mosaic: 'CITY HALL',
    rows: PLATFORM_ROWS,
    exits: { up: 'nyc-sub-cityhall-hall' },
  },
  {
    id: 'nyc-sub-cityhall-hall',
    name: 'City Hall Station',
    region: 'City Hall',
    ...PLATFORM,
    mosaic: 'CITY HALL',
    rows: [
      '################',
      '################',
      '#..............#',
      '#..............#',
      '#..*........*..#',
      '#..............#',
      '#..............#',
      '#..*........*..#',
      '#..............#',
      '#..............#',
      '######....######',
    ],
    exits: { down: 'nyc-sub-cityhall-platform' },
    treasure: {
      id: 'nyc-cityhall-cache',
      col: 7,
      row: 2,
      rupees: 120,
      message: 'A strongbox left under the vault in 1945, when they turned the lights off. Nobody came back for it.',
    },
    props: [
      { sprite: 'scribe', col: 13, row: 8, talk: 'City Hall station. Closed since 1945. Best tiles in the city and nobody sees them but you and me and the rabbit.' },
    ],
  },
  // Times Square. The purple car goes here, among other places, and it is
  // the only way to get here. Lit up, loud, and somebody has dropped a
  // wallet in the middle of it.
  {
    id: 'nyc-times-square',
    name: 'Times Square',
    region: 'Midtown',
    ...STREET,
    rows: [
      'TTTTTTTTTTTTTTTT',
      'TTTTTTTTTTTTTTTT',
      '##............##',
      '#..............#',
      '#..............#',
      '#..............#',
      '#..............#',
      '#..............#',
      '##............##',
      'TTTTTTTTTTTTTTTT',
      'TTTTTTTTTTTTTTTT',
    ],
    exits: {},
    portals: [{ col: 12, row: 7, to: 'nyc-fifth-ave', spawnCol: 5, spawnRow: 3, car: true }],
    treasure: {
      id: 'nyc-times-square-wallet',
      col: 3,
      row: 3,
      rupees: 150,
      message: 'A wallet, dropped in the middle of Times Square. Nobody noticed. Nobody ever does.',
    },
    props: [
      { sprite: 'purpleCar', col: 12, row: 7 },
      { sprite: 'scribe', col: 8, row: 4, talk: 'A man in a red furry suit wants five dollars for a photo. He is not who he says he is. Nobody here is.' },
      { sprite: 'pigeonA', col: 4, row: 6 },
      { sprite: 'pigeonB', col: 10, row: 3 },
      { sprite: 'pigeonA', col: 6, row: 7 },
    ],
    spawns: [{ kind: 'flyer', col: 11, row: 5 }, { kind: 'flyer', col: 3, row: 6 }],
  },
  // Up the stairs at the end of the line: a square he cannot walk to, with
  // a chest that opens for having got there.
  {
    id: 'nyc-union-square',
    name: '14th Street & Union Square',
    region: 'Union Square',
    ...PARK,
    rows: [
      'TTTTTTTTTTTTTTTT',
      'T,............,T',
      'T....SSSSSS....T',
      'T....S~~~~S....T',
      'T....S~~~~S....T',
      'T....SSSSSS....T',
      'T..*........*..T',
      'T,............,T',
      'T......SS......T',
      'TTTTTTT^TTTTTTTT',
      'TTTTTTTTTTTTTTTT',
    ],
    exits: {},
    portals: [{ col: 7, row: 9, to: 'nyc-sub-union-mezz', spawnCol: 7, spawnRow: 3 }],
    treasure: {
      id: 'nyc-union-chest',
      col: 3,
      row: 8,
      rupees: 80,
      message: 'A box under the bench by the market stalls. Nobody has looked in it for years.',
    },
    props: [
      { sprite: 'scribe', col: 10, row: 7, talk: 'Union Square. Market on Saturdays, chess every day, and the only way back to the Village is the train.' },
      { sprite: 'pigeonA', col: 12, row: 2 },
      { sprite: 'pigeonB', col: 4, row: 6 },
      { sprite: 'dogB', col: 9, row: 1 },
    ],
    spawns: [{ kind: 'flyer', col: 12, row: 8 }],
  },
  // The train. He stands in it while the tunnel goes past; the doors along
  // the bottom open at every stop, and stepping through them gets him off.
  {
    id: TRAIN_CAR,
    name: 'On the V Train',
    region: SUBWAY_REGION,
    ...TRAIN,
    rows: [
      '~~~~~~~~~~~~~~~~',
      '################',
      '#R.R..R..R..R.R#',
      '#..............#',
      '#....*.....*...#',
      '#..............#',
      '#..............#',
      '#....*.....*...#',
      '#R.R..R..R..R.R#',
      '####HH####HH####',
      '~~~~~~~~~~~~~~~~',
    ],
    exits: {},
    props: [{ sprite: 'scribe', col: 2, row: 5, talk: 'Stand clear of the closing doors, please.' }],
    spawns: [{ kind: 'chaser', col: 12, row: 5 }],
  },
]

export const AUTHORED_CITY: Screen[] = [...BLOCKS, ...PARKS, ...INTERIORS, ...SUBWAY]

/** The sample screens the design page was drawn from, kept for the previews. */
export const SAMPLE_CITY: Screen[] = [
  ...PARKS.filter((s) => s.id === 'nyc-washington-square'),
  ...BLOCKS.filter((s) => s.id === 'nyc-avenue-a' || s.id === 'nyc-bleecker'),
  ...INTERIORS.filter((s) => s.id === 'nyc-bodega'),
]
