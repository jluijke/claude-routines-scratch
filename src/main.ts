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
import { ExerciseEngine } from './spelling/engine'
import { expectedAnswer } from './spelling/grading'
import { mountExerciseScreen } from './spelling/ui/exerciseScreen'
import { masteredCount } from './spelling/mastery'
import { button, clear, el } from './spelling/ui/dom'
import { World } from './game/world'
import { showGatePrompt, showNotice } from './game/ui/prompt'
import { showShop, type ShopKind } from './game/ui/shop'
import { showHelp } from './game/ui/help'
import type { Gate } from './game/gates'
import { ITEMS } from './game/items'
import type { Exercise } from './spelling/types'
import { mountParentDashboard } from './parent/dashboard'
import { describe as describePacing } from './game/pacing'

const root = document.getElementById('app') as HTMLElement
const speech = new WebSpeechEngine()

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
        `${completed} of ${TOTAL_EXERCISES} exercises complete · ${masteredCount(state.spelling.mastery)} patterns mastered · ${state.player.rupees} rupees`,
      ]),
      el('div', { class: 'controls' }, [start]),
      el('p', { class: 'q-hint-line controls-help' }, [
        'Move: arrow keys, WASD or the number pad · Sword: Z or Space · Item: X · Swap item: C · ' +
          'Music on and off: M · Or click where you want to go, and click a monster to attack.',
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

function enterWorld(): void {
  teardownWorld()
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
  const isReview = gate.optional === true || up === undefined

  world?.setPaused(true)

  showGatePrompt(root, {
    gate,
    isReview,
    ...(up && !isReview ? { exerciseTitle: up.title, exerciseNumber: up.id } : {}),
    onAccept: () => {
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
  mountExerciseScreen(root, {
    engine,
    bank: WORD_BANK,
    speech,
    onConceptProved: () => {
      // Rupees arrive as concepts are proved, so the payoff starts immediately.
      state.player.rupees += 10
      sfx.play('rupee')
      persistSave(state)
    },
    onComplete: (finished) => {
      if (!state.spelling.completedExercises.includes(finished.id)) {
        state.spelling.completedExercises.push(finished.id)
      }
      state.spelling.inProgress = undefined
      state.pacing.exerciseSeconds += engine.elapsedSeconds()
      activeEngine = undefined
      finishGate()
    },
    onExit: () => {
      state.pacing.exerciseSeconds += engine.elapsedSeconds()
      activeEngine = undefined
      gateInProgress = undefined
      persist()
      enterWorld()
    },
  })
}

/**
 * A short challenge built from patterns the child has already mastered. Used on
 * optional barriers so side content never consumes a curriculum exercise.
 */
function startReviewChallenge(gate: Gate): void {
  music.stop()
  const learned = EXERCISES.filter((e) => state.spelling.completedExercises.includes(e.id))
  if (learned.length === 0) {
    showNotice(root, 'You have not learned any patterns yet. Come back once you have finished an exercise.', () => {
      world?.declineGate()
      world?.setPaused(false)
    })
    return
  }

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

  primeAudio()
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
  mountExerciseScreen(root, {
    engine,
    bank: WORD_BANK,
    speech,
    onComplete: () => {
      state.pacing.exerciseSeconds += engine.elapsedSeconds()
      activeEngine = undefined
      finishGate()
    },
    onExit: () => {
      state.pacing.exerciseSeconds += engine.elapsedSeconds()
      activeEngine = undefined
      gateInProgress = undefined
      persist()
      enterWorld()
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

function openShop(kind: ShopKind): void {
  world?.setPaused(true)
  showShop(root, {
    kind,
    save: state,
    onGateRequest: (gate) => handleGate(gate),
    onPurchase: () => {
      world?.equipBest()
      persist()
    },
    onClose: () => {
      world?.equipBest()
      world?.setPaused(false)
      persist()
    },
  })
}

function openHelp(): void {
  world?.setPaused(true)
  showHelp(root, () => world?.setPaused(false))
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
  // M mutes the music, anywhere, except while typing an answer.
  if (
    (event.key === 'm' || event.key === 'M') &&
    !event.ctrlKey &&
    !event.metaKey &&
    !(event.target instanceof HTMLInputElement) &&
    !(event.target instanceof HTMLTextAreaElement)
  ) {
    toggleMusic()
    return
  }

  // Ctrl+Shift+P opens the parent dashboard from anywhere.
  if (event.ctrlKey && event.shiftKey && (event.key === 'P' || event.key === 'p')) {
    event.preventDefault()
    world?.setPaused(true)
    const closeDashboard = mountParentDashboard(root, {
      save: state,
      voiceName: speech.voiceName(),
      onImport: (imported) => {
        closeDashboard()
        state = imported
        persistSave(state)
        showTitle()
      },
      onReset: () => {
        closeDashboard()
        startNewQuest()
      },
      onClose: () => world?.setPaused(false),
    })
  }
})

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
    pacing: () => describePacing(state.pacing),
    music,
    toggleMusic,
    reset: startNewQuest,
    openHelp,
  },
})
