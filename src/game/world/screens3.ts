/**
 * Level 3: New York — sample screens.
 *
 * Not yet part of the world. These exist to be looked at: five places drawn
 * through the real renderer so the look can be judged before a hundred more
 * are authored. Nothing imports this except the screenshot tool.
 *
 * Same letters as everywhere else. On a street, 'B' is the road (walkable,
 * and where the cars are), 'S' on a road is a crosswalk, 'T' and '#' are
 * buildings, ',' is a heap of trash bags, '*' a hydrant, '^' subway stairs.
 * On a platform, '~' is the track pit and 'B' a train standing at it.
 */
import type { Screen } from './screens'

const STREET = { setting: 'street' } as const
const PARK = { setting: 'park' } as const
const PLATFORM = { setting: 'platform' } as const
const TRAIN = { setting: 'train' } as const
const BODEGA = { setting: 'bodega' } as const

export const SAMPLE_CITY: Screen[] = [
  {
    id: 'nyc-washington-square',
    name: 'Washington Square',
    region: 'Greenwich Village',
    ...PARK,
    tidy: true,
    rows: [
      'TT.............T',
      'T,.....*A*.....,',
      'T....SSSSSSS...T',
      '#....S~~~~~S...#',
      '.....S~~~~~S....',
      '#....S~~~~~S...#',
      'T....SSSSSSS...T',
      'T,.....SSS.....,',
      'T......SSS......',
      'T^.....SSS.....T',
      'TTTTTTTSSSTTTTTT',
    ],
    exits: {},
    props: [
      { sprite: 'scribe', col: 3, row: 4, talk: 'Chess? Sit down. Loser buys the pretzels.' },
      { sprite: 'pigeonA', col: 11, row: 2 },
      { sprite: 'pigeonB', col: 12, row: 8 },
      { sprite: 'pigeonA', col: 4, row: 8 },
    ],
  },
  {
    id: 'nyc-avenue-a',
    name: 'Avenue A & 7th',
    region: 'East Village',
    ...STREET,
    tidy: true,
    rows: [
      'TTTTTTTTHTTTTTTT',
      'TTTTTTTTTTTTTTTT',
      '.....,....*.....',
      '......^.........',
      'BBBBBBBSSBBBBBBB',
      'BBBBBBBSSBBBBBBB',
      'BBBBBBBSSBBBBBBB',
      'BBBBBBBSSBBBBBBB',
      '..........,.....',
      '#####H###X######',
      '################',
    ],
    exits: {},
    props: [
      { sprite: 'taxi', col: 2, row: 6 },
      { sprite: 'taxiLeft', col: 12, row: 4 },
      { sprite: 'purpleCar', col: 10, row: 7 },
      { sprite: 'taxiLeft', col: 4, row: 5 },
      { sprite: 'pigeonA', col: 13, row: 2 },
    ],
  },
  {
    id: 'nyc-bleecker',
    name: 'Bleecker Street',
    region: 'West Village',
    ...STREET,
    tidy: true,
    rows: [
      '################',
      '###H####H###H###',
      '................',
      '...*......,.....',
      '..BBBBBBBBBBBBBB',
      '..BBBBBBBBBBBBBB',
      '..B.............',
      '..B.....,...*...',
      '..BTTTTHTTTTTTTT',
      '..BTTTTTTTTTTTTT',
      '..BTTTTTTTTTTTTT',
    ],
    exits: {},
    props: [
      { sprite: 'taxi', col: 6, row: 5 },
      { sprite: 'dogA', col: 13, row: 3 },
      { sprite: 'scribe', col: 9, row: 2, talk: 'The pet shop is the one with the green awning. Same six as ever.' },
    ],
  },
  {
    id: 'nyc-west-4th',
    name: 'West 4th Street',
    mosaic: 'W 4 ST',
    region: 'Subway',
    ...PLATFORM,
    tidy: true,
    rows: [
      '################',
      '^..R.......R...H',
      '...R.......R...,',
      'SSSSSSSSSSSSSSSS',
      'C~~~~~~~~~~~~~~C',
      'CBBBBBBBBBBBBBBC',
      'CBBBBBBBBBBBBBBC',
      'C~~~~~~~~~~~~~~C',
      'C~~~~~~~~~~~~~~C',
      '################',
      '################',
    ],
    exits: {},
    props: [
      { sprite: 'scribe', col: 6, row: 3, talk: 'Downtown A on this side. Stand clear of the closing doors.' },
      { sprite: 'pigeonB', col: 13, row: 4 },
    ],
  },
  {
    id: 'nyc-a-train',
    name: 'Downtown A Train',
    region: 'Subway',
    ...TRAIN,
    tidy: true,
    rows: [
      '###H###H###H####',
      'RRR.RRRR.RRRRRRR',
      '................',
      '.......*........',
      'D..............D',
      '.......*........',
      '................',
      'RRRR.RRRR.RRRRRR',
      '###H###H###H####',
      '~~~~~~~~~~~~~~~~',
      '~~~~~~~~~~~~~~~~',
    ],
    exits: {},
    props: [
      { sprite: 'scribe', col: 12, row: 4, talk: 'Showtime! What time is it? SHOWTIME.' },
      { sprite: 'catA', col: 2, row: 2 },
    ],
  },
  {
    id: 'nyc-bodega',
    name: 'Ray\'s Deli & Grocery',
    region: 'East Village',
    ...BODEGA,
    tidy: true,
    rows: [
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
    ],
    exits: {},
    props: [
      { sprite: 'scribe', col: 13, row: 4, talk: 'Bandages, firecrackers, sandwiches. Cat is not for sale.' },
      { sprite: 'catA', col: 12, row: 5 },
    ],
  },
]
