/**
 * Barriers — the point where the curriculum and the game meet.
 *
 * There are more barriers than exercises on purpose. A major barrier spends
 * "the next exercise you have not finished" rather than a fixed number, so the
 * world stays open: whichever sealed door he walks up to first is the one his
 * next exercise opens. Optional barriers run a short review challenge instead,
 * and the pacing governor can open them for free when spelling is running
 * ahead of play.
 */
import type { ItemId } from './items'

export type GateKind =
  | 'door' // a rune-sealed dungeon door
  | 'seal' // a spell of passage between regions
  | 'bridge' // planks appear across the river
  | 'boss' // the boss chamber
  | 'npc' // a gatekeeper who asks before letting you by
  | 'chest' // a sealed treasure chest
  | 'shop' // the shopkeeper wants proof of skill
  | 'wall' // a cracked wall hiding something
  | 'smith' // forging the next sword

export interface Reward {
  rupees?: number
  hearts?: number
  heartContainer?: boolean
  item?: ItemId
  /** Another gate that swings open at the same time. */
  unlock?: string
}

export interface Gate {
  id: string
  kind: GateKind
  /** Shown when the child walks into it. */
  message: string
  /** Shown once it opens. */
  openMessage: string
  reward: Reward
  /**
   * Optional barriers are side content: they run a short review challenge
   * rather than consuming a curriculum exercise, and can be opened free by the
   * pacing governor when the child is ahead on spelling.
   */
  optional?: boolean
  /** Pins this barrier to one exercise. Used only where the story needs it. */
  exerciseId?: number
}

const GATE_LIST: Gate[] = [
  // --- village -----------------------------------------------------------
  {
    id: 'village-north-seal',
    kind: 'seal',
    message: 'A carved stone blocks the path north. The runes shift as you look at them.',
    openMessage: 'The runes settle into words you can read. The stone slides aside.',
    reward: { rupees: 40, unlock: 'village-chest' },
    exerciseId: 1,
  },
  {
    id: 'village-chest',
    kind: 'chest',
    message: 'A chest bound with a spelling charm.',
    openMessage: 'The charm unwinds. Inside is a purse of rupees.',
    reward: { rupees: 60 },
    optional: true,
  },
  {
    id: 'scribe-west',
    kind: 'npc',
    message: '"Nobody passes west without showing me they can spell," says the old scribe.',
    openMessage: '"Well done. The west road is yours."',
    reward: { rupees: 45, hearts: 3 },
  },
  {
    id: 'shop-wings',
    kind: 'shop',
    message: 'The shopkeeper eyes the Wings. "These are dangerous. Show me you have a careful mind first."',
    openMessage: '"Careful and clever. They are yours to buy."',
    reward: { rupees: 30 },
  },
  {
    id: 'shop-bow',
    kind: 'shop',
    message: '"A bow needs a steady hand and a steady head. Prove the second and I will sell you one."',
    openMessage: '"Steady enough. Take your pick of the bows."',
    reward: { rupees: 30 },
  },
  {
    id: 'shop-magical-shield',
    kind: 'shop',
    message: '"The Magical Shield answers only to a sharp mind."',
    openMessage: 'The shield hums quietly. It will answer to you now.',
    reward: { rupees: 40 },
  },
  {
    id: 'shop-red-tunic',
    kind: 'shop',
    message: '"Fire-flower dye is precious. Earn the right to wear it."',
    openMessage: '"Earned. Wear it well."',
    reward: { rupees: 40 },
  },
  {
    id: 'smith-bronze',
    kind: 'smith',
    message: 'The smith looks up. "Bronze needs a name spelled true on the blade. Can you manage that?"',
    openMessage: 'She strikes the name into the steel. The Bronze Sword is ready.',
    reward: { rupees: 50 },
  },
  {
    id: 'smith-golden',
    kind: 'smith',
    message: '"Gold is the last blade I will ever make. Show me you deserve it."',
    openMessage: 'The Golden Sword leaves the anvil glowing.',
    reward: { rupees: 80, heartContainer: true },
  },

  // --- forest ------------------------------------------------------------
  {
    id: 'forest-seal',
    kind: 'seal',
    message: 'Thorns grow across the forest path, spelling a word you almost recognise.',
    openMessage: 'The thorns unknot themselves and pull back.',
    reward: { rupees: 45 },
  },
  {
    id: 'forest-chest',
    kind: 'chest',
    message: 'A chest wedged between two roots, sealed with a charm.',
    openMessage: 'The lid springs open.',
    reward: { rupees: 70 },
    optional: true,
  },
  {
    id: 'forest-wall',
    kind: 'wall',
    message: 'A cracked rock face. Something is hollow behind it.',
    openMessage: 'The rock splits open, revealing a narrow cave.',
    reward: { rupees: 50 },
    optional: true,
  },
  {
    id: 'forest-hermit',
    kind: 'npc',
    message: 'A hermit bars the way. "One question, traveller."',
    openMessage: '"Go on through, then."',
    reward: { rupees: 40, hearts: 2 },
  },

  // --- the river ---------------------------------------------------------
  {
    id: 'river-bridge',
    kind: 'bridge',
    message: 'The river runs fast and there is no bridge. Planks lie stacked on the bank.',
    openMessage: 'Plank by plank, the bridge lays itself across the water.',
    reward: { rupees: 60, heartContainer: true },
  },
  {
    id: 'river-seal',
    kind: 'seal',
    message: 'A waterlogged stone marker blocks the north bank.',
    openMessage: 'The marker sinks away into the mud.',
    reward: { rupees: 50 },
  },
  {
    id: 'river-chest',
    kind: 'chest',
    message: 'A chest caught in the reeds, still locked.',
    openMessage: 'The lock falls away.',
    reward: { rupees: 65 },
    optional: true,
  },
  {
    id: 'ferryman',
    kind: 'npc',
    message: '"I row nobody across who cannot spell the river\'s name," says the ferryman.',
    openMessage: '"Climb in, then."',
    reward: { rupees: 55 },
  },

  // --- graveyard ---------------------------------------------------------
  {
    id: 'graveyard-seal',
    kind: 'seal',
    message: 'The graveyard gate is bound with old, careful writing.',
    openMessage: 'The writing fades and the gate creaks open.',
    reward: { rupees: 55 },
  },
  {
    id: 'graveyard-wall',
    kind: 'wall',
    message: 'One headstone sounds hollow when you tap it.',
    openMessage: 'The stone swings inward. Someone has been trading down here.',
    reward: { rupees: 40, unlock: 'secret-blue-ring' },
  },
  {
    id: 'secret-blue-ring',
    kind: 'shop',
    message: 'The hooded trader taps the Blue Ring. "This one has a price beyond rupees."',
    openMessage: '"Then it is yours to buy."',
    reward: { rupees: 60 },
  },
  {
    id: 'graveyard-chest',
    kind: 'chest',
    message: 'A chest half-buried in the earth.',
    openMessage: 'It opens with a sigh of cold air.',
    reward: { rupees: 75 },
    optional: true,
  },

  // --- mountain ----------------------------------------------------------
  {
    id: 'mountain-seal',
    kind: 'seal',
    message: 'A rockfall blocks the mountain track. Words are scratched into the largest boulder.',
    openMessage: 'The boulder rolls aside.',
    reward: { rupees: 60 },
  },
  {
    id: 'mountain-chest',
    kind: 'chest',
    message: 'A chest left on the ledge by someone in a hurry.',
    openMessage: 'Inside: rupees, and a note you cannot read.',
    reward: { rupees: 80 },
    optional: true,
  },
  {
    id: 'mountain-wall',
    kind: 'wall',
    message: 'A crack in the cliff, just wide enough.',
    openMessage: 'The crack widens into a passage.',
    reward: { rupees: 55, heartContainer: true },
    optional: true,
  },

  // --- dungeon one: the Sunken Hall --------------------------------------
  {
    id: 'd1-door-1',
    kind: 'door',
    message: 'A rune-sealed door. The runes are letters, jumbled.',
    openMessage: 'The letters settle. The door grinds open.',
    reward: { rupees: 45 },
  },
  {
    id: 'd1-door-2',
    kind: 'door',
    message: 'Another sealed door, the runes deeper cut than the last.',
    openMessage: 'The seal breaks.',
    reward: { rupees: 50 },
  },
  {
    id: 'd1-door-3',
    kind: 'door',
    message: 'This door has three seals, one above the other.',
    openMessage: 'All three seals fall at once.',
    reward: { rupees: 55, hearts: 3 },
  },
  {
    id: 'd1-chest',
    kind: 'chest',
    message: 'The hall\'s great chest, still sealed.',
    openMessage: 'The chest opens on a heart container.',
    reward: { rupees: 40, heartContainer: true },
  },
  {
    id: 'd1-boss',
    kind: 'boss',
    message: 'The boss chamber will not open. Something wants to know if you have been paying attention.',
    openMessage: 'The chamber doors swing wide. Something very large is waiting.',
    reward: { rupees: 70 },
  },

  // --- dungeon two: the Hollow Keep --------------------------------------
  {
    id: 'd2-door-1',
    kind: 'door',
    message: 'A keep door, sealed with writing far older than the last dungeon.',
    openMessage: 'The old writing gives way.',
    reward: { rupees: 55 },
  },
  {
    id: 'd2-door-2',
    kind: 'door',
    message: 'The seal on this door rewrites itself as you watch.',
    openMessage: 'It stops rewriting, and opens.',
    reward: { rupees: 60 },
  },
  {
    id: 'd2-door-3',
    kind: 'door',
    message: 'A door of seven seals. Only one of them is real.',
    openMessage: 'The true seal breaks and the rest fade.',
    reward: { rupees: 65, hearts: 4 },
  },
  {
    id: 'd2-door-4',
    kind: 'door',
    message: 'The last sealed door before the keep\'s heart.',
    openMessage: 'The way to the heart of the keep is open.',
    reward: { rupees: 70 },
  },
  {
    id: 'd2-chest',
    kind: 'chest',
    message: 'The keep\'s treasury chest.',
    openMessage: 'The treasury opens.',
    reward: { rupees: 90, heartContainer: true },
  },
  {
    id: 'd2-boss',
    kind: 'boss',
    message: 'The Hollow Keep\'s guardian waits behind a seal of pure light.',
    openMessage: 'The light parts. The guardian rises.',
    reward: { rupees: 100, heartContainer: true },
  },
  // --- further barriers, so every exercise has a door of its own ----------
  {
    id: 'village-east-seal',
    kind: 'seal',
    message: 'A toll-stone marks the east road. It will not move for coins.',
    openMessage: 'The toll-stone rolls out of the way.',
    reward: { rupees: 40 },
  },
  {
    id: 'forest-seal-2',
    kind: 'seal',
    message: 'Deeper in, the trees have grown together into a wall of letters.',
    openMessage: 'The trees lean apart to let you through.',
    reward: { rupees: 50 },
  },
  {
    id: 'forest-seal-3',
    kind: 'seal',
    message: 'The last of the forest wardens has left one final word across the path.',
    openMessage: 'The word unravels into ordinary bramble.',
    reward: { rupees: 55, hearts: 3 },
  },
  {
    id: 'forest-shrine',
    kind: 'npc',
    message: 'A shrine keeper blocks the shrine steps. "Answer, and go up."',
    openMessage: '"Up you go."',
    reward: { rupees: 45, heartContainer: true },
  },
  {
    id: 'river-north-seal',
    kind: 'seal',
    message: 'A boundary stone stands where the north bank begins.',
    openMessage: 'The boundary stone sinks into the bank.',
    reward: { rupees: 55 },
  },
  {
    id: 'waterfall-seal',
    kind: 'seal',
    message: 'Behind the waterfall, letters are cut into the wet rock.',
    openMessage: 'The rock face opens behind the falling water.',
    reward: { rupees: 60, hearts: 4 },
  },
  {
    id: 'graveyard-seal-2',
    kind: 'seal',
    message: 'The inner graveyard is walled off by a line of standing stones.',
    openMessage: 'The stones step aside, one after another.',
    reward: { rupees: 60 },
  },
  {
    id: 'graveyard-crypt',
    kind: 'door',
    message: 'The crypt door has a single word carved across it.',
    openMessage: 'The crypt door swings inward.',
    reward: { rupees: 65 },
  },
  {
    id: 'mountain-seal-2',
    kind: 'seal',
    message: 'Higher up, the track ends at a wall of frost-covered runes.',
    openMessage: 'The frost melts off the runes and the wall crumbles.',
    reward: { rupees: 65 },
  },
  {
    id: 'mountain-summit-seal',
    kind: 'seal',
    message: 'The summit gate. The wind carries words you almost catch.',
    openMessage: 'The wind drops. The summit gate opens.',
    reward: { rupees: 70, heartContainer: true },
  },
  {
    id: 'keep-gate',
    kind: 'seal',
    message: 'The Hollow Keep\'s outer gate, sealed since before the village was built.',
    openMessage: 'The outer gate grinds open for the first time in a very long while.',
    reward: { rupees: 75 },
  },
  {
    id: 'd1-door-4',
    kind: 'door',
    message: 'A flooded doorway, its seal half-worn away.',
    openMessage: 'The worn seal gives up entirely.',
    reward: { rupees: 55 },
  },
  {
    id: 'd1-door-5',
    kind: 'door',
    message: 'The last door before the Sunken Hall\'s treasury.',
    openMessage: 'The treasury door opens.',
    reward: { rupees: 60 },
  },
  {
    id: 'd2-door-5',
    kind: 'door',
    message: 'A door that has been sealed twice, by two different hands.',
    openMessage: 'Both seals break together.',
    reward: { rupees: 70 },
  },
  {
    id: 'd2-door-6',
    kind: 'door',
    message: 'The guardian\'s antechamber. The seal here is the neatest writing you have ever seen.',
    openMessage: 'The neat writing comes apart, letter by letter.',
    reward: { rupees: 75, hearts: 4 },
  },
]


export const GATES: ReadonlyMap<string, Gate> = new Map(GATE_LIST.map((g) => [g.id, g]))

export function gateById(id: string): Gate | undefined {
  return GATES.get(id)
}

/** Barriers that consume a curriculum exercise, as opposed to side content. */
export function majorGateCount(): number {
  return GATE_LIST.filter((g) => !g.optional).length
}

export function totalGateCount(): number {
  return GATE_LIST.length
}

export function allGates(): readonly Gate[] {
  return GATE_LIST
}
