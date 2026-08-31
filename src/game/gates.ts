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
    kind: 'bridge',
    message:
      'The floor of the hall has fallen away. Planks lie stacked against the wall, waiting to be laid.',
    openMessage:
      'Plank by plank, a walkway lays itself across the gap.',
    reward: { rupees: 45 },
  },
  {
    id: 'd1-door-2',
    kind: 'door',
    message:
      'A sluice gate holds back the water. The wheel that opens it has letters cut around the rim.',
    openMessage:
      'The wheel turns, the sluice lifts, and the water drains away.',
    reward: { rupees: 50 },
  },
  {
    id: 'd1-door-3',
    kind: 'door',
    message:
      'Three stone faces guard the passage, and each has an empty mouth waiting for a word.',
    openMessage:
      'One after another, the three faces speak and step aside.',
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
    message:
      "The keep's inner door has a word carved across it in letters older than the village.",
    openMessage:
      'The old carving loosens and the door swings inward.',
    reward: { rupees: 55 },
  },
  {
    id: 'd2-door-2',
    kind: 'bridge',
    message:
      'A chasm splits the gallery. A rope bridge lies coiled on this side, its knots undone.',
    openMessage:
      'The knots pull themselves tight and the rope bridge stretches across.',
    reward: { rupees: 60 },
  },
  {
    id: 'd2-door-3',
    kind: 'door',
    message:
      'Seven seals cover the door and only one of them is real writing. The rest are nonsense.',
    openMessage:
      'You pick out the true one. The six false seals crumble.',
    reward: { rupees: 65, hearts: 4 },
  },
  {
    id: 'd2-door-4',
    kind: 'door',
    message:
      'A mural covers this wall, and someone has chipped one word out of the middle of it.',
    openMessage:
      'The missing word settles back into the mural, and the wall opens.',
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
    message:
      'A lantern hangs unlit above the stair. The wick will not catch for a careless hand.',
    openMessage:
      'The lantern flares, and the stair beyond comes into view.',
    reward: { rupees: 55 },
  },
  {
    id: 'd1-door-5',
    kind: 'door',
    message:
      'The treasury lock has five dials, each one a letter deep.',
    openMessage:
      'Five dials click into place and the lock falls open.',
    reward: { rupees: 60 },
  },
  {
    id: 'd2-door-5',
    kind: 'door',
    message:
      'The stair is blocked by a portcullis. Its counterweight chain hangs slack, waiting.',
    openMessage:
      'The chain snaps taut and the portcullis grinds upward.',
    reward: { rupees: 70 },
  },
  {
    id: 'd2-door-6',
    kind: 'door',
    message:
      'The antechamber seal is the neatest writing you have ever seen. It expects the same back.',
    openMessage:
      'The neat writing comes apart, letter by letter.',
    reward: { rupees: 75, hearts: 4 },
  },
  // --- dungeon three: the Ember Vault -------------------------------------
  {
    id: 'd3-door-1',
    kind: 'door',
    message:
      'A vault door, warm to the touch. Its lock is a ring of letters that has to be read right around.',
    openMessage:
      'The ring turns full circle and the vault door swings in.',
    reward: { rupees: 60 },
  },
  {
    id: 'd3-door-2',
    kind: 'door',
    message:
      'The way is flooded to the ceiling. A pump stands beside it with a word painted on the handle.',
    openMessage:
      'The pump shudders, and the water drops away below your knees.',
    reward: { rupees: 65 },
  },
  {
    id: 'd3-door-3',
    kind: 'bridge',
    message:
      'A collapsed stairway. The fallen blocks each carry a letter, and they will only stack one way.',
    openMessage:
      'The blocks rise and settle into a stair.',
    reward: { rupees: 70, hearts: 4 },
  },
  {
    id: 'd3-chest',
    kind: 'chest',
    message: 'The vault\'s own chest, still sealed after all this time.',
    openMessage: 'The vault chest opens.',
    reward: { rupees: 85, heartContainer: true },
  },
  {
    id: 'd3-boss',
    kind: 'boss',
    message: 'Something enormous is breathing on the other side of this seal.',
    openMessage: 'The seal breaks. Whatever is in there has noticed you.',
    reward: { rupees: 90 },
  },

  // --- dungeon four: the Sunless Spire -------------------------------------
  {
    id: 'd4-door-1',
    kind: 'door',
    message:
      'The spire door has no handle at all, only a line of writing where one should be.',
    openMessage:
      'The writing fades and the door opens inward.',
    reward: { rupees: 70 },
  },
  {
    id: 'd4-door-2',
    kind: 'door',
    message:
      'A cage of iron letters blocks the spiral stair, rearranging itself as you watch.',
    openMessage:
      'The letters stop moving, agree on an order, and unlock.',
    reward: { rupees: 75 },
  },
  {
    id: 'd4-door-3',
    kind: 'door',
    message:
      'The last landing is barred by a wheel of stone, its rim worn almost smooth.',
    openMessage:
      'The wheel turns for the first time in a very long while.',
    reward: { rupees: 80, hearts: 5 },
  },
  {
    id: 'd4-chest',
    kind: 'chest',
    message: 'A chest at the very top of the spire, waiting.',
    openMessage: 'The spire chest opens on a heart container.',
    reward: { rupees: 95, heartContainer: true },
  },
  {
    id: 'd4-boss',
    kind: 'boss',
    message: 'The Sunless Spire\'s keeper is sealed behind the brightest writing you have seen.',
    openMessage: 'The light parts. The keeper turns to face you.',
    reward: { rupees: 120, heartContainer: true },
  },

  // --- reached by blowing a wall open --------------------------------------
  {
    id: 'bomb-shop',
    kind: 'shop',
    message: 'The trader in the blasted-open cave folds his arms. "Prove it, and I will deal."',
    openMessage: '"Good enough. Have a look at the shelf."',
    reward: { rupees: 50 },
  },
  {
    id: 'ember-chest',
    kind: 'chest',
    message: 'A chest hidden behind the cracked rock, sealed with a charm.',
    openMessage: 'The charm gives way.',
    reward: { rupees: 90 },
    optional: true,
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
