/**
 * Entry point.
 *
 * Two subsystems joined by a thin bridge: the world raises a barrier, the
 * exercise engine answers it, and rewards flow back. Neither knows anything
 * about how the other works.
 */
import { clear as clearSave, load, newSave, save as persistSave, type SaveData } from './core/save'
import { WebSpeechEngine } from './core/audio/speech'
import { sfx } from './core/audio/sfx'
import { music } from './core/audio/music'
import { WORD_BANK } from './content/words'
import { CONCEPTS } from './content/concepts'
import { EXERCISES, exerciseById, nextExercise, TOTAL_EXERCISES } from './content/exercises'
import { INTRO_CANDLE } from './content/exercises/intro-candle'
import { ExerciseEngine } from './spelling/engine'
import { expectedAnswer } from './spelling/grading'
import { mountExerciseScreen } from './spelling/ui/exerciseScreen'
import { masteredCount } from './spelling/mastery'
import { button, clear, el } from './spelling/ui/dom'
import { World } from './game/world'
import { SCREENS } from './game/world/screens'
import { showGatePrompt, showNotice } from './game/ui/prompt'
import { showBossVictory } from './game/ui/victory'
import { mapLayout } from './game/render/map'
import { showShop, type ShopKind } from './game/ui/shop'
import { showHelp } from './game/ui/help'
import { gateById, type Gate } from './game/gates'
import { ITEMS } from './game/items'
import type { Exercise } from './spelling/types'
import { mountParentDashboard } from './parent/dashboard'
import { creditSeconds, describe as describePacing } from './game/pacing'

const root = document.getElementById('app') as HTMLElement
/**
 * The reading voice, chosen by ear in the parent dashboard. Per device, like
 * the music setting: which voices exist depends on the machine, so a choice
 * made on one is meaningless on another and must not travel in the save file.
 */
const VOICE_KEY = 'zsq.voice'

function storedVoice(): string | undefined {
  try {
    return localStorage.getItem(VOICE_KEY) ?? undefined
  } catch {
    return undefined
  }
}

function rememberVoice(name: string | undefined): void {
  try {
    if (name) localStorage.setItem(VOICE_KEY, name)
    else localStorage.removeItem(VOICE_KEY)
  } catch {
    // Storage unavailable; the choice just will not be remembered.
  }
}

const speech = new WebSpeechEngine(storedVoice())

let state: SaveData = load()
let world: World | undefined
let activeEngine: ExerciseEngine | undefined
/** The barrier waiting on the exercise currently being played. */
let gateInProgress: Gate | undefined

function persist(): void {
  world?.syncSave()
  persistSave(state)
}

const MUSIC_KEY = 'zsq.music'

/** Browsers refuse to speak or play sound before the child interacts. */
function primeAudio(): void {
  speech.prime()
  sfx.prime()
  music.prime()
  // A per-device preference rather than part of his progress, so it is kept
  // outside the save file and does not travel when he moves machines.
  try {
    music.setMuted(localStorage.getItem(MUSIC_KEY) === 'off')
  } catch {
    // Storage unavailable; music simply stays on.
  }
}

function toggleMusic(): void {
  primeAudio()
  const muted = !music.isMuted()
  music.setMuted(muted)
  try {
    localStorage.setItem(MUSIC_KEY, muted ? 'off' : 'on')
  } catch {
    // Nothing to do; the choice just will not be remembered.
  }
}

// --------------------------------------------------------------- title screen

function showTitle(): void {
  teardownWorld()
  teardownExerciseScreen()
  clear(root)
  // The title tune needs a gesture first; if audio is not primed yet this is
  // a no-op and the music starts when he presses the button.

  const completed = state.spelling.completedExercises.length
  const start = button(
    completed > 0 || state.world.visitedScreens.length > 0 ? 'Continue your quest' : 'Begin your quest',
    () => {
      primeAudio()
      enterWorld()
    },
    { class: 'btn btn-primary btn-large' },
  )

  music.play('title')

  root.append(
    el('section', { class: 'panel-game title-screen' }, [
      el('h1', { class: 'exercise-title' }, ['Zelda Spelling Quest']),
      el('p', { class: 'prompt' }, [
        'Explore the land, fight monsters and gather rupees — but every sealed door, ' +
          'every bridge and every good sword in the shop opens only for someone who can spell.',
      ]),
      el('p', { class: 'q-hint-line' }, [
        `${completed} of ${TOTAL_EXERCISES} exercises complete · ${masteredCount(state.spelling.mastery, CONCEPTS.keys())} patterns mastered · ${state.player.rupees} rupees`,
      ]),
      el('div', { class: 'controls' }, [start]),
      el('p', { class: 'q-hint-line controls-help' }, [
        'Move: arrow keys, WASD or the number pad · Sword: Z or Space · Item: X · Swap item: C · ' +
          'Control shows every key · Map: M · Music on and off: N · Or click where you want to go.',
      ]),
      // Firefox takes Cmd/Ctrl+Shift+P for its own private window before the
      // page ever sees it, so the shortcut cannot be the only way in.
      el('p', { class: 'q-hint-line grown-ups' }, [
        button('For grown-ups: progress and settings', () => openParentDashboard(), {
          class: 'link-button',
        }),
      ]),
    ]),
  )
  start.focus()
}

// ---------------------------------------------------------------- the world

function teardownWorld(): void {
  world?.destroy()
  world = undefined
}

/**
 * The exercise screen keeps a window key listener. Clearing the root took its
 * nodes away but left that listener behind, so every exercise played added
 * another one — and each still believed it owned the door it started at.
 */
let activeScreen: { destroy: () => void } | undefined

function teardownExerciseScreen(): void {
  activeScreen?.destroy()
  activeScreen = undefined
}

function enterWorld(): void {
  teardownWorld()
  teardownExerciseScreen()
  clear(root)

  const stage = el('div', { class: 'stage' })
  root.append(stage)

  world = new World(stage, state, {
    onGate: (gate) => handleGate(gate),
    onShop: (kind) => openShop(kind),
    onChange: () => persist(),
    onDefeat: () => handleDefeat(),
    onMessage: () => {},
    onHelp: () => openHelp(),
    onBossDefeated: (win) => {
      world?.setPaused(true)
      // The win is already on disk by way of onChange; this only makes sure of
      // it before a child wanders off with the sign still up.
      persist()
      showBossVictory(root, {
        ...win,
        onContinue: () => {
          world?.clearVictory()
          world?.setPaused(false)
        },
      })
    },
  })
  world.start()
  fitStage()
}

/** Scales the canvas by a whole number so the pixels stay crisp. */
function fitStage(): void {
  const canvas = document.querySelector('.game-canvas') as HTMLCanvasElement | null
  if (!canvas) return
  const available = Math.min(window.innerWidth - 16, (window.innerHeight - 16) * (canvas.width / canvas.height))
  const scale = Math.max(1, Math.floor(available / canvas.width))
  canvas.style.width = `${canvas.width * scale}px`
  canvas.style.height = `${canvas.height * scale}px`
}

window.addEventListener('resize', fitStage)

// -------------------------------------------------------------- the bridge

/**
 * A barrier was touched. Major barriers spend the next unfinished exercise;
 * optional ones run a short review challenge from patterns already learned.
 */
function handleGate(gate: Gate): void {
  const up = nextExercise(state.spelling.completedExercises)
  const isReview = gate.challenge !== undefined || gate.optional === true || up === undefined

  world?.setPaused(true)

  showGatePrompt(root, {
    gate,
    isReview,
    ...(up && !isReview ? { exerciseTitle: up.title, exerciseNumber: up.id } : {}),
    onAccept: () => {
      if (gate.challenge === 'intro') return startShortChallenge(gate, INTRO_CANDLE)
      if (gate.challenge === 'half') return startHalfChallenge(gate)
      if (isReview) return startReviewChallenge(gate)
      if (!up) {
        showNotice(root, 'You have finished every exercise there is. This door opens for you anyway.', () => {
          grantReward(gate)
          world?.setPaused(false)
        })
        return
      }
      startExercise(up, gate)
    },
    onDecline: () => {
      world?.declineGate()
      world?.setPaused(false)
    },
  })
}

function startExercise(exercise: Exercise, gate?: Gate): void {
  primeAudio()
  // Silence during exercises. He has to hear the word being read out, and a
  // tune underneath it makes that harder for exactly the child who needs it
  // clearest.
  music.stop()
  gateInProgress = gate
  teardownWorldCanvasOnly()

  const engine = new ExerciseEngine({
    exercise,
    concepts: CONCEPTS,
    bank: WORD_BANK,
    mastery: state.spelling.mastery,
    seed: `${exercise.id}-${state.createdAt}`,
  })
  activeEngine = engine

  state.spelling.inProgress = exercise.id
  persist()

  clear(root)
  teardownExerciseScreen()
  activeScreen = mountExerciseScreen(root, {
    engine,
    bank: WORD_BANK,
    speech,
    onConceptProved: (concept) => {
      // Rupees arrive as concepts are proved, so the payoff starts immediately
      // — but each pattern pays once, ever. Paying per attempt turned leaving
      // and restarting an exercise into a rupee printer.
      if (state.spelling.paidConcepts.includes(concept)) return
      state.spelling.paidConcepts.push(concept)
      state.player.rupees += 10
      sfx.play('rupee')
      persistSave(state)
    },
    onComplete: (finished) => {
      if (!state.spelling.completedExercises.includes(finished.id)) {
        state.spelling.completedExercises.push(finished.id)
      }
      state.spelling.inProgress = undefined
      state.pacing.exerciseSeconds += creditSeconds(engine.elapsedSeconds())
      activeEngine = undefined
      finishGate()
    },
    onExit: () => {
      const abandoned = gateInProgress
      state.pacing.exerciseSeconds += creditSeconds(engine.elapsedSeconds())
      state.spelling.inProgress = undefined
      activeEngine = undefined
      gateInProgress = undefined
      persist()
      enterWorld()
      // Otherwise the world rebuilds him against the door, facing an arbitrary
      // way, and the prompt fires again on the first frame with no input —
      // which is the opposite of letting him go and explore somewhere else.
      if (abandoned) world?.suppressGate(abandoned.id)
    },
  })
}

/**
 * Half a real exercise.
 *
 * For side content that should cost something without costing a whole lesson —
 * the crossing to the island, and the ride home from it. Built from the last
 * exercise finished, so the words are ones he has met, and it never records a
 * completion: the forty are the forty.
 */
function startHalfChallenge(gate: Gate): void {
  const learned = EXERCISES.filter((e) => state.spelling.completedExercises.includes(e.id))
  const source = learned[learned.length - 1] ?? EXERCISES[0]
  if (!source) return
  const half = Math.max(2, Math.ceil(source.activities.length / 2))

  startShortChallenge(gate, {
    ...source,
    title: 'A short challenge',
    targetMinutes: Math.max(2, Math.round(source.targetMinutes / 2)),
    // No concepts to prove: the engine would otherwise top the queue back up
    // with a mastery question for each one, and half an exercise would quietly
    // become most of an exercise. Mastery is the curriculum's job, not the
    // island's — every answer is still recorded either way.
    concepts: [],
    // Take the questions that prove something, then fill from the front.
    activities: [
      ...source.activities.filter((q) => q.novel || q.masteryRequired),
      ...source.activities.filter((q) => !q.novel && !q.masteryRequired),
    ].slice(0, half),
    ruleReveal: {
      title: source.ruleReveal.title,
      text: source.ruleReveal.text,
      examples: source.ruleReveal.examples.slice(0, 2),
    },
  })
}

/**
 * A short challenge built from patterns the child has already mastered. Used on
 * optional barriers so side content never consumes a curriculum exercise.
 */
function startReviewChallenge(gate: Gate): void {
  const learned = EXERCISES.filter((e) => state.spelling.completedExercises.includes(e.id))
  if (learned.length === 0) {
    showNotice(root, 'You have not learned any patterns yet. Come back once you have finished an exercise.', () => {
      world?.declineGate()
      world?.setPaused(false)
    })
    return
  }

  // Below the check, not above it. Stopping the music first meant that touching
  // an optional barrier before finishing any exercise killed the tune with
  // nothing on this path to ever start it again.
  music.stop()

  // Reuse the last finished exercise, but ask only for a short mastery check:
  // the engine already refuses to finish until each concept is proved unaided.
  const source = learned[learned.length - 1] as Exercise
  const challenge: Exercise = {
    ...source,
    id: source.id,
    title: 'A quick challenge',
    targetMinutes: 3,
    activities: source.activities.filter((q) => q.novel || q.masteryRequired).slice(0, 4),
    ruleReveal: {
      title: 'Still sharp',
      text: 'You still have that pattern. The way is open.',
      examples: source.ruleReveal.examples.slice(0, 2),
    },
  }

  startShortChallenge(gate, challenge)
}

/**
 * Runs an exercise that does not belong to the curriculum — a review challenge
 * or the shopkeeper's two questions. Deliberately unlike `startExercise`: it
 * never records a completed exercise, never sets `inProgress`, and never pays
 * the per-pattern rupees, so side content cannot inflate the 40-exercise count
 * or the parent dashboard.
 */
function startShortChallenge(gate: Gate, challenge: Exercise): void {
  primeAudio()
  music.stop()
  gateInProgress = gate
  teardownWorldCanvasOnly()

  const engine = new ExerciseEngine({
    exercise: challenge,
    concepts: CONCEPTS,
    bank: WORD_BANK,
    mastery: state.spelling.mastery,
    seed: `${gate.id}-${Date.now()}`,
  })
  activeEngine = engine

  clear(root)
  teardownExerciseScreen()
  activeScreen = mountExerciseScreen(root, {
    engine,
    bank: WORD_BANK,
    speech,
    onComplete: () => {
      state.pacing.exerciseSeconds += creditSeconds(engine.elapsedSeconds())
      activeEngine = undefined
      finishGate()
    },
    onExit: () => {
      const abandoned = gateInProgress
      state.pacing.exerciseSeconds += creditSeconds(engine.elapsedSeconds())
      state.spelling.inProgress = undefined
      activeEngine = undefined
      gateInProgress = undefined
      persist()
      enterWorld()
      // Otherwise the world rebuilds him against the door, facing an arbitrary
      // way, and the prompt fires again on the first frame with no input —
      // which is the opposite of letting him go and explore somewhere else.
      if (abandoned) world?.suppressGate(abandoned.id)
    },
  })
}

/** The exercise is done: open the barrier and hand over the reward. */
function finishGate(): void {
  const gate = gateInProgress
  gateInProgress = undefined
  enterWorld()

  if (!gate) {
    persist()
    return
  }
  grantReward(gate)
}

function grantReward(gate: Gate): void {
  const reward = gate.reward
  if (reward.rupees) state.player.rupees += reward.rupees
  if (reward.hearts) world?.heal(reward.hearts)
  if (reward.heartContainer) world?.grantHeartContainer()
  if (reward.item) state.inventory[reward.item] = (state.inventory[reward.item] ?? 0) + 1

  world?.openGate(gate)
  world?.equipBest()
  persist()
  openShopPanel?.refresh()

  const lines: string[] = [gate.openMessage]
  if (reward.rupees) lines.push(`+${reward.rupees} rupees.`)
  if (reward.heartContainer) lines.push('Your maximum life has grown by one heart.')
  if (reward.item) lines.push(`You received the ${ITEMS[reward.item].name}.`)
  world?.showMessage(lines.join(' '))
}

/** Removes the canvas but leaves the save state intact. */
function teardownWorldCanvasOnly(): void {
  world?.stop()
  teardownWorld()
}

// ----------------------------------------------------------------- the shop

/**
 * The shop panel currently on screen, if any. Proving a shop barrier puts him
 * back at the counter, and the panel is built before the reward is granted —
 * so without this it still reads "Prove it" and no rupees until he walks out
 * and in again.
 */
let openShopPanel: { close: () => void; refresh: () => void } | undefined

function openShop(kind: ShopKind): void {
  world?.setPaused(true)
  openShopPanel = showShop(root, {
    kind,
    save: state,
    onGateRequest: (gate) => {
      openShopPanel = undefined
      handleGate(gate)
    },
    onPurchase: () => {
      world?.equipBest()
      persist()
    },
    onClose: () => {
      openShopPanel = undefined
      world?.equipBest()
      world?.setPaused(false)
      persist()
    },
  })
}

function openHelp(): void {
  world?.setPaused(true)
  showHelp(root, () => world?.setPaused(false), { onToggleMusic: toggleMusic })
}

/**
 * Wipes the save and starts again. The world is torn down *first*: it holds a
 * reference to the old save and writes the hero's hearts and position back on
 * the way out, which would otherwise land on top of the fresh one.
 */
function startNewQuest(): void {
  teardownWorld()
  activeEngine = undefined
  gateInProgress = undefined
  clearSave()
  // A new createdAt matters — it seeds the question order, so reusing the old
  // one would replay the same exercises in the same sequence.
  state = newSave()
  persistSave(state)
  showTitle()
}

function handleDefeat(): void {
  world?.setPaused(true)
  showNotice(root, 'You have run out of hearts. A villager carries you back to the square.', () => {
    world?.respawn()
    world?.setPaused(false)
    persist()
  })
}

// --------------------------------------------------- parent view and dev keys

window.addEventListener('keydown', (event) => {
  // N mutes the music, anywhere, except while typing an answer. It was M, but
  // M now opens the map — a thing he goes looking for, against a toggle he
  // presses once. The controls panel carries a button for it too, so nobody has
  // to remember which letter it moved to.
  if (
    (event.key === 'n' || event.key === 'N') &&
    !event.ctrlKey &&
    !event.metaKey &&
    !(event.target instanceof HTMLInputElement) &&
    !(event.target instanceof HTMLTextAreaElement)
  ) {
    toggleMusic()
    return
  }

  // Ctrl+Shift+P — or Cmd+Shift+P, which is what a Mac keyboard actually has.
  const parentChord = (event.ctrlKey || event.metaKey) && event.shiftKey
  if (parentChord && (event.key === 'P' || event.key === 'p')) {
    event.preventDefault()
    openParentDashboard()
  }
})

/**
 * One panel at a time. Asked of the page rather than remembered: a flag that
 * fell out of step with the DOM disabled the shortcut altogether, silently.
 */
function dashboardIsOpen(): boolean {
  return root.querySelector('.dashboard') !== null
}

function openParentDashboard(): void {
  if (dashboardIsOpen()) return
  world?.setPaused(true)
  const closeDashboard = mountParentDashboard(root, {
    save: state,
    speech,
    onVoiceChosen: rememberVoice,
    onImport: (imported) => {
      closeDashboard()
      // An import can land mid-exercise, and the engine and barrier it leaves
      // behind belong to a save that no longer exists.
      activeEngine = undefined
      gateInProgress = undefined
      state = imported
      persistSave(state)
      showTitle()
    },
    onReset: () => {
      closeDashboard()
      startNewQuest()
    },
    onGrant: (items) => {
      for (const id of items) {
        state.inventory[id] = (state.inventory[id] ?? 0) + (ITEMS[id].stackable ? 10 : 1)
        // A shopkeeper's barrier is about proving yourself before buying; the
        // point of this panel is to skip exactly that.
        const gate = ITEMS[id].gate
        if (gate && !state.world.openedGates.includes(gate)) state.world.openedGates.push(gate)
      }
      if (items.length > 1) state.player.rupees = Math.max(state.player.rupees, 999)
      world?.refreshFromSave()
      world?.equipBest()
      persist()
    },
    onClose: () => {
      world?.setPaused(false)
    },
  })
}

showTitle()

// Dev hooks: used by the end-to-end checks and handy in the browser console.
Object.assign(window as unknown as Record<string, unknown>, {
  zsq: {
    get state() {
      return state
    },
    get world() {
      return world
    },
    get engine() {
      return activeEngine
    },
    currentQuestion: () => activeEngine?.current(),
    /**
     * The expected answer for whatever is on screen. Used by the end-to-end
     * checks, which drive the real UI rather than re-implementing the content.
     */
    expected: () => {
      const shown = document.querySelector('.activity') as HTMLElement | null
      const id = shown?.dataset['questionId']
      if (!id) return undefined
      const base = id.split(/[@#]/)[0]
      const pool = [
        ...INTRO_CANDLE.activities,
        ...EXERCISES.flatMap((e) => e.activities),
        ...[...CONCEPTS.values()].flatMap((c) => c.reviewPool),
      ]
      const question = pool.find((q) => q.id === base)
      if (!question) return undefined
      return { question, answer: expectedAnswer(question, WORD_BANK), shownId: id }
    },
    startExercise: (id: number) => {
      const exercise = exerciseById(id)
      if (exercise) startExercise(exercise)
    },
    enterWorld,
    showTitle,
    goTo: (screenId: string, col = 7, row = 5) => world?.teleport(screenId, col, row),
    /** Where each square on the map sits, for the end-to-end checks. */
    mapLayout,
    screens: SCREENS,
    gateById,
    pacing: () => describePacing(state.pacing),
    music,
    speech,
    toggleMusic,
    reset: startNewQuest,
    openHelp,
  },
})
