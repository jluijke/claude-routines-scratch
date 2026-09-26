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
  | 'food' // a sack of animal food lying in the open
  | 'turnstile' // the subway turnstiles: three words is the fare, every time

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
  /**
   * Runs something other than the next curriculum exercise.
   *
   *  'intro' — the shopkeeper's two questions, before his first candle.
   *  'half'  — half the length of a real exercise, for side content that
   *            should cost something without costing a whole lesson.
   *  'grammar' — a grammar rule explained first, then four questions on it.
   *            What a sack of animal food costs.
   *  'five'  — exactly five questions, and no rule to read first. The price of
   *            the chest in the quiet square, which is meant to be a small
   *            kindness rather than a lesson.
   *  'turnstile' — three questions, and the barrier does not stay open: it is
   *            the subway fare, paid every time he comes down the stairs.
   */
  challenge?: 'intro' | 'half' | 'grammar' | 'five' | 'turnstile'
}

const GATE_LIST: Gate[] = [
  // --- village -----------------------------------------------------------
  {
    id: 'village-north-seal',
    kind: 'seal',
    message: 'A carved stone blocks the path north. The runes shift as you look at them.',
    openMessage: 'The runes settle into words you can read. The stone slides aside.',
    reward: { rupees: 40, unlock: 'village-chest' },
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
    id: 'shop-candle',
    kind: 'shop',
    message:
      'The shopkeeper reaches for the Blue Candle, then stops. "A candle in the wrong hands burns a village down. Two words first, and it is yours to buy."',
    openMessage: '"Good. Mind how you carry it."',
    reward: { rupees: 70 },
    challenge: 'intro',
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

  // --- the lagoon --------------------------------------------------------
  {
    id: 'lagoon-passage',
    kind: 'seal',
    message:
      'Someone has driven a line of carved stakes across the sand. The water beyond them is very wide, and something stands on the far side.',
    openMessage: 'The stakes sink into the sand as if they had never been there.',
    reward: { rupees: 60 },
    challenge: 'half',
  },
  {
    id: 'castaway-toll',
    kind: 'npc',
    message:
      'A voice drifts up from the dark below. "Lovely island, isn\'t it? Wide water, though. Did you give any thought to how you were getting home?" Something down there laughs. "Come down. Answer me one thing and we will talk."',
    openMessage: '"Down you come, then. Mind the step."',
    // The rupees are the fare home, so nobody can be stranded here; and the
    // castaway does not care whether the village shop vouched for you.
    reward: { rupees: 300, unlock: 'shop-wings' },
    challenge: 'half',
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
    id: 'haven-chest',
    kind: 'chest',
    message:
      'A chest on the step of a house that has not been built yet, and will be rubble ' +
      'long before you were born. It is not locked. It is only shut.',
    openMessage: 'A hundred rupees, and a smell of woodsmoke that is a thousand years old.',
    reward: { rupees: 100 },
    optional: true,
    challenge: 'five',
  },
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

  // =========================================================================
  // Level 2: the sky-ship. The same kinds of barrier, in the future's words:
  // force fields for seals, keypad hatches for doors, gantries for bridges,
  // droids for gatekeepers, locked crates for chests, and a computer that
  // wants proof before it sells.
  // =========================================================================

  // --- the ship's computers ------------------------------------------------
  {
    id: 'ship-candle',
    kind: 'shop',
    message:
      'The computer pauses over the Laser Screwdriver. "A screwdriver in the wrong hands takes a ship apart. Two words first, and it is yours to buy."',
    openMessage: '"ACCEPTED. Mind how you carry it."',
    reward: { rupees: 70 },
    challenge: 'intro',
  },
  {
    id: 'ship-rocket',
    kind: 'shop',
    message: 'The computer flags the Rocketship. "HAZARDOUS ITEM. Show me a careful mind first."',
    openMessage: '"Careful and clever. It is yours to buy."',
    reward: { rupees: 30 },
  },
  {
    id: 'ship-blaster',
    kind: 'shop',
    message: '"A blaster needs a steady hand and a steady head. Prove the second and it is yours."',
    openMessage: '"Steady enough. Blaster unlocked."',
    reward: { rupees: 30 },
  },
  {
    id: 'ship-photon-shield',
    kind: 'shop',
    message: '"The Photon Shield answers only to a sharp mind."',
    openMessage: 'The shield hums quietly. It will answer to you now.',
    reward: { rupees: 40 },
  },
  {
    id: 'ship-red-nanosuit',
    kind: 'shop',
    message: '"Reactor plating is precious. Earn the right to wear it."',
    openMessage: '"Earned. Wear it well."',
    reward: { rupees: 40 },
  },
  {
    id: 'forge-green',
    kind: 'smith',
    message: 'The forge console blinks. "A green blade needs a name spelled true into its crystal. Can you manage that?"',
    openMessage: 'The name burns into the crystal. The Green Lightsaber is ready.',
    reward: { rupees: 50 },
  },
  {
    id: 'forge-scythe',
    kind: 'smith',
    message: '"The Scythe is the last thing this forge will ever print. Show me you deserve it."',
    openMessage: 'The Scythe comes out of the forge, its edge still glowing from the print head.',
    reward: { rupees: 80, heartContainer: true },
  },
  {
    id: 'ship-circuit-ring',
    kind: 'shop',
    message: 'The hidden terminal highlights the Circuit Ring. "This one has a price beyond rupees."',
    openMessage: '"Then it is yours to buy."',
    reward: { rupees: 60 },
  },
  {
    id: 'ship-smugglers',
    kind: 'shop',
    message: 'The smugglers\' terminal shows a locked screen. "Prove it, and I will deal."',
    openMessage: '"Good enough. Have a look at the shelf."',
    reward: { rupees: 50 },
  },

  // --- the bridge and the decks -------------------------------------------
  {
    id: 'ship-obs-seal',
    kind: 'seal',
    message: 'A force field hums across the corridor to the observatory. Letters scroll along its edge.',
    openMessage: 'The letters settle into a word you can read, and the field drops.',
    reward: { rupees: 40, unlock: 'ship-obs-chest' },
  },
  {
    id: 'ship-obs-chest',
    kind: 'chest',
    message: 'A crate locked with a spelling code.',
    openMessage: 'The code takes. Inside is a purse of rupees.',
    reward: { rupees: 60 },
    optional: true,
  },
  {
    id: 'ship-lab-seal',
    kind: 'seal',
    message: 'A force field seals the way to the laboratories. It wants a word.',
    openMessage: 'The field flickers out.',
    reward: { rupees: 45 },
  },
  {
    id: 'ship-mess-guard',
    kind: 'npc',
    message: 'A kitchen droid rolls into your way. "NOBODY PASSES THE MESS WITHOUT SHOWING ME THEY CAN SPELL."',
    openMessage: '"WELL DONE. THE MESS IS YOURS."',
    reward: { rupees: 45, hearts: 3 },
  },

  // --- the cargo bays ------------------------------------------------------
  {
    id: 'ship-cargo-seal',
    kind: 'seal',
    message: 'A force field blocks the way to Cargo Bay Two.',
    openMessage: 'The field drops with a sigh.',
    reward: { rupees: 40 },
  },
  {
    id: 'ship-hangar-seal',
    kind: 'seal',
    message: 'The hangar hatch is sealed by a field of blue light. Letters drift in it.',
    openMessage: 'The blue light parts. The hangar is open.',
    reward: { rupees: 50 },
  },
  {
    id: 'ship-vault-chest',
    kind: 'chest',
    message: "The vault's strongbox, still locked after a thousand years.",
    openMessage: 'The strongbox opens on a life core.',
    reward: { rupees: 40, heartContainer: true },
  },
  {
    id: 'ship-cargo-guard',
    kind: 'npc',
    message: 'A loader droid bars the way. "ONE QUESTION, TRAVELLER."',
    openMessage: '"GO ON THROUGH, THEN."',
    reward: { rupees: 40, hearts: 2 },
  },
  {
    id: 'ship-cargo-chest',
    kind: 'chest',
    message: 'A crate wedged between two containers, locked with a code.',
    openMessage: 'The lid springs open.',
    reward: { rupees: 70 },
    optional: true,
  },
  {
    id: 'ship-launch-passage',
    kind: 'seal',
    message:
      'A line of force posts runs across the hangar floor. The bay doors beyond them are open on the black, and something stands on the far side of it.',
    openMessage: 'The force posts power down, one after another.',
    reward: { rupees: 60 },
    challenge: 'half',
  },
  {
    id: 'outpost-toll',
    kind: 'npc',
    message:
      'A voice comes up from the dark below. "Lovely outpost, isn\'t it? Long way home, though. Did you give any thought to how you were getting back?" Something down there laughs. "Come down. Answer me one thing and we will talk."',
    openMessage: '"Down you come, then. Mind the step."',
    // The rupees are the fare home, so nobody can be stranded here.
    reward: { rupees: 300, unlock: 'ship-rocket' },
    challenge: 'half',
  },

  // --- engineering ---------------------------------------------------------
  {
    id: 'ship-engine-seal',
    kind: 'seal',
    message: 'A force field seals the way down to the coolant deck.',
    openMessage: 'The field drops.',
    reward: { rupees: 55 },
  },
  {
    id: 'ship-reactor-seal',
    kind: 'seal',
    message: 'The reactor door is sealed with a field brighter than the rest.',
    openMessage: 'The bright field goes out. The reactor is open.',
    reward: { rupees: 55 },
  },
  {
    id: 'ship-reactor-keeper',
    kind: 'npc',
    message: 'The keeper droid stands over the reactor hatch. "ANSWER, AND GO DOWN."',
    openMessage: '"DOWN YOU GO."',
    reward: { rupees: 45, heartContainer: true },
  },
  {
    id: 'ship-lower-chest',
    kind: 'chest',
    message: 'A crate half-buried in cabling.',
    openMessage: 'It opens with a hiss of cold air.',
    reward: { rupees: 75 },
    optional: true,
  },
  {
    id: 'ship-lower-guard',
    kind: 'npc',
    message: 'A patrol droid blocks the lower deck. "STATE THE WORD."',
    openMessage: '"WORD ACCEPTED."',
    reward: { rupees: 55 },
  },

  // --- the labs ------------------------------------------------------------
  {
    id: 'ship-lab-seal-2',
    kind: 'seal',
    message: 'Deeper in, a second force field, thicker than the first.',
    openMessage: 'The field thins and vanishes.',
    reward: { rupees: 50 },
  },
  {
    id: 'ship-lab-chest',
    kind: 'chest',
    message: 'A sample crate, locked.',
    openMessage: 'The lock clicks open.',
    reward: { rupees: 65 },
    optional: true,
  },
  {
    id: 'ship-lab-seal-3',
    kind: 'seal',
    message: 'The specimen room is sealed off. The lock scrolls a word with a letter missing.',
    openMessage: 'The missing letter drops into place, and the door slides open.',
    reward: { rupees: 60, hearts: 4 },
  },
  {
    id: 'ship-lab-guard',
    kind: 'npc',
    message: 'A lab droid turns its lenses on you. "SPELL IT, OR GO BACK."',
    openMessage: '"CORRECT. PROCEED."',
    reward: { rupees: 55, hearts: 3 },
  },
  {
    id: 'ship-specimen-chest',
    kind: 'chest',
    message: 'A specimen crate at the far end of the labs.',
    openMessage: 'The specimen crate opens on a life core.',
    reward: { rupees: 90, heartContainer: true },
  },
  {
    id: 'ship-maintenance-chest',
    kind: 'chest',
    message: 'A crate under the cabling, locked with a code.',
    openMessage: 'The code takes.',
    reward: { rupees: 70 },
    optional: true,
  },

  // --- rock one: the Grey Rock --------------------------------------------
  {
    id: 'rock-1-door-1',
    kind: 'seal',
    message: 'A force field hums across the gantry to the next rock. Letters scroll along its edge.',
    openMessage: 'The letters settle into a word you can read, and the field drops.',
    reward: { rupees: 45 },
  },
  {
    id: 'rock-1-door-2',
    kind: 'seal',
    message: 'A second field across the causeway, its letters scratched and worn.',
    openMessage: 'The worn letters still read true. The field goes out.',
    reward: { rupees: 55, hearts: 3 },
  },
  {
    id: 'rock-1-hatch',
    kind: 'door',
    message: 'A hatch into the rock itself. A word is stencilled on it.',
    openMessage: 'The stencil glows, and the hatch lifts.',
    reward: { rupees: 50 },
  },
  {
    id: 'rock-1-vein-door',
    kind: 'bridge',
    message: 'The floor of the vein has fallen away. A gantry lies folded against the wall.',
    openMessage: 'Piece by piece, the gantry unfolds across the gap.',
    reward: { rupees: 50 },
  },
  {
    id: 'rock-1-chest',
    kind: 'chest',
    message: "The Grey Rock's strongbox, still sealed.",
    openMessage: 'The strongbox opens on a life core.',
    reward: { rupees: 40, heartContainer: true },
  },

  // --- rock two: the Red Rock ---------------------------------------------
  {
    id: 'rock-2-door-1',
    kind: 'seal',
    message: 'A force field across the gantry, warm to the touch. Its lock is a ring of letters that has to be read right around.',
    openMessage: 'The ring turns full circle and the field drops.',
    reward: { rupees: 55 },
  },
  {
    id: 'rock-2-door-2',
    kind: 'seal',
    message: 'Seven codes cover the causeway field and only one of them is real writing.',
    openMessage: 'You pick out the true one. The six false codes go dark, and the field with them.',
    reward: { rupees: 65, hearts: 4 },
  },
  {
    id: 'rock-2-hatch',
    kind: 'door',
    message: 'A hatch into the crater floor. The lock wants a word spelled true.',
    openMessage: 'The lock takes it, and the hatch lifts.',
    reward: { rupees: 60 },
  },
  {
    id: 'rock-2-vein-door',
    kind: 'door',
    message: 'A blast door, sealed. Someone has chipped one word out of the sign on it.',
    openMessage: 'The missing word settles back into the sign, and the door opens.',
    reward: { rupees: 65 },
  },
  {
    id: 'rock-2-chest',
    kind: 'chest',
    message: "The Red Rock's strongbox.",
    openMessage: 'The strongbox opens.',
    reward: { rupees: 90, heartContainer: true },
  },
  {
    id: 'rock-2-cache-chest',
    kind: 'chest',
    message: 'A crate hidden behind the cracked boulder, locked.',
    openMessage: 'The lock gives way.',
    reward: { rupees: 90 },
    optional: true,
  },

  // --- rock three: the Ice Rock -------------------------------------------
  {
    id: 'rock-3-door-1',
    kind: 'seal',
    message: 'The gantry is iced over and a field hums behind the ice. The lock only wakes for a careful hand.',
    openMessage: 'The frost cracks off the lock, and the field goes out.',
    reward: { rupees: 60 },
  },
  {
    id: 'rock-3-door-2',
    kind: 'seal',
    message: 'The causeway is iced to the rail. A heater stands beside it with a word painted on the switch.',
    openMessage: 'The heater shudders, the ice drops away, and the field with it.',
    reward: { rupees: 70 },
  },
  {
    id: 'rock-3-hatch',
    kind: 'door',
    message: 'A hatch under the ice. Letters are cut into it.',
    openMessage: 'The letters glow through the ice, and it lifts.',
    reward: { rupees: 65 },
  },
  {
    id: 'rock-3-vein-door',
    kind: 'bridge',
    message: 'A collapsed walkway. The fallen sections each carry a letter, and they only fit together one way.',
    openMessage: 'The sections rise and lock into a walkway.',
    reward: { rupees: 70, hearts: 4 },
  },
  {
    id: 'rock-3-chest',
    kind: 'chest',
    message: "The Ice Rock's strongbox, frozen shut.",
    openMessage: 'The ice cracks and the strongbox opens.',
    reward: { rupees: 85, heartContainer: true },
  },

  // --- rock four: the Black Rock ------------------------------------------
  {
    id: 'rock-4-door-1',
    kind: 'seal',
    message: 'The field across the black gantry has no keypad at all, only a line of writing where one should be.',
    openMessage: 'The writing fades and the field drops.',
    reward: { rupees: 70 },
  },
  {
    id: 'rock-4-door-2',
    kind: 'seal',
    message: 'The last causeway is barred by a wheel of black stone, its rim worn almost smooth.',
    openMessage: 'The wheel turns for the first time in a very long while, and the field goes out.',
    reward: { rupees: 80, hearts: 5 },
  },
  {
    id: 'rock-4-hatch',
    kind: 'door',
    message: 'A cage of iron letters covers the hatch, rearranging itself as you watch.',
    openMessage: 'The letters stop moving, agree on an order, and unlock.',
    reward: { rupees: 75 },
  },
  {
    id: 'rock-4-vein-door',
    kind: 'door',
    message: 'The vein is blocked by a blast door with the neatest writing you have ever seen. It expects the same back.',
    openMessage: 'The neat writing comes apart, letter by letter.',
    reward: { rupees: 75, hearts: 4 },
  },
  {
    id: 'rock-4-chest',
    kind: 'chest',
    message: 'A strongbox at the heart of the Black Rock, waiting.',
    openMessage: 'The strongbox opens on a life core.',
    reward: { rupees: 95, heartContainer: true },
  },

  // =========================================================================
  // Level 3: New York. The same kinds of barrier, in the city's words: police
  // tape for seals, padlocked chests, a gardener at a gate, and a hardware
  // store that wants proof before it sells anything heavy.
  // =========================================================================
  {
    id: 'nyc-broadway-tape',
    kind: 'seal',
    message: 'Police tape across the crosswalk. DO NOT CROSS, it says, over and over, in letters you can read.',
    openMessage: 'The tape comes down. Nobody stops you.',
    reward: { rupees: 40, unlock: 'nyc-square-chest' },
  },
  {
    id: 'nyc-sixth-ave-tape',
    kind: 'seal',
    message: 'Police tape across the way west. A cop leans on a car and does not look up. "Spell your way past, kid."',
    openMessage: 'He lifts the tape without looking up. "Go on."',
    reward: { rupees: 40 },
  },
  {
    id: 'nyc-square-chest',
    kind: 'chest',
    message: 'A padlocked box behind the fountain, with a word scratched on the lid.',
    openMessage: 'The padlock springs. Dollars, folded small.',
    reward: { rupees: 60 },
    optional: true,
  },
  {
    id: 'nyc-w8th-chest',
    kind: 'chest',
    message: 'A locked strongbox in the doorway of an empty shop.',
    openMessage: 'The lock gives.',
    reward: { rupees: 50 },
    optional: true,
  },
  {
    id: 'nyc-tompkins-chest',
    kind: 'chest',
    message: 'A locked box under the bench by the dog run. Every dog in the run is watching you.',
    openMessage: 'It opens. The dogs lose interest at once.',
    reward: { rupees: 60 },
    optional: true,
  },
  {
    id: 'nyc-garden-gate',
    kind: 'npc',
    message: 'A woman with a watering can stands in the garden gate. "Members only. Or — can you spell? Members can spell."',
    openMessage: '"Well then. Mind the tomatoes."',
    reward: { hearts: 3, unlock: 'nyc-garden-chest' },
  },
  {
    id: 'nyc-garden-chest',
    kind: 'chest',
    message: 'A locked box in the tool shed at the back of the garden.',
    openMessage: 'It opens. Somebody has been saving.',
    reward: { rupees: 90 },
    optional: true,
  },
  {
    id: 'nyc-hammer',
    kind: 'shop',
    message: 'The man at the hardware counter puts a hand on the box hammer. "This thing shakes the street. Show me you are careful first."',
    openMessage: '"Careful enough. It is yours to buy. Mind the windows."',
    reward: { rupees: 30 },
  },

  {
    id: 'nyc-pistol',
    kind: 'shop',
    message: 'The man at the hardware counter keeps a hand on the pistol. "Six shots and a reload. Show me a steady head first."',
    openMessage: '"Steady enough. Mind where you point it."',
    reward: { rupees: 50 },
  },
  {
    id: 'nyc-rifle',
    kind: 'shop',
    message: '"The rifle reaches the far end of the block. Prove you have earned that kind of reach."',
    openMessage: '"Earned. Three shots, and make them count."',
    reward: { rupees: 80, heartContainer: true },
  },

  // --- the subway: the fare is three words, every time ----------------------
  ...[
    ['christopher', 'The turnstile at Christopher Street. No card, no coins. A screen above it says: SPELL THREE WORDS.'],
    ['w4', 'The turnstiles at West 4th. The reader wants three words, not a card, and the man in the booth is watching.'],
    ['astor', 'The Astor Place turnstile. A little beaver on the wall tile seems to be waiting for you to spell something.'],
    ['2av', 'The turnstile at Second Avenue clicks once. THREE WORDS, says the screen. PLEASE.'],
    ['union', 'The turnstile at Union Square. Busiest station in the city, and it still wants its three words.'],
  ].map(([key, message]) => ({
    id: `nyc-turnstile-${key}`,
    kind: 'turnstile' as const,
    message: message as string,
    openMessage: 'The turnstile clunks round and lets you through. Mind the gap.',
    reward: {},
    challenge: 'turnstile' as const,
  })),
]


export const GATES: ReadonlyMap<string, Gate> = new Map(GATE_LIST.map((g) => [g.id, g]))

export function gateById(id: string): Gate | undefined {
  return GATES.get(id)
}

/** Barriers that consume a curriculum exercise, as opposed to side content. */
/** Barriers that spend a curriculum exercise. The intro spends its own. */
export function majorGateCount(): number {
  return GATE_LIST.filter((g) => !g.optional && !g.challenge).length
}

export function totalGateCount(): number {
  return GATE_LIST.length
}

export function allGates(): readonly Gate[] {
  return GATE_LIST
}
