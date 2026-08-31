/**
 * Entry point. Switches between the game world and the spelling exercises;
 * neither knows anything about the other's internals.
 */
import { load, save, type SaveData } from './core/save'
import { WebSpeechEngine } from './core/audio/speech'
import { sfx } from './core/audio/sfx'
import { WORD_BANK } from './content/words'
import { CONCEPTS } from './content/concepts'
import { EXERCISES, exerciseById, isUnlocked, nextExercise, TOTAL_EXERCISES } from './content/exercises'
import { ExerciseEngine } from './spelling/engine'
import { mountExerciseScreen } from './spelling/ui/exerciseScreen'
import { masteredCount } from './spelling/mastery'
import { button, clear, el } from './spelling/ui/dom'

const root = document.getElementById('app') as HTMLElement
let activeEngine: ExerciseEngine | undefined
const speech = new WebSpeechEngine()
let state: SaveData = load()

function persist(): void {
  save(state)
}

/** Browsers will not speak or play sound until the child has interacted. */
function primeAudio(): void {
  speech.prime()
  sfx.prime()
}

function showTitle(): void {
  clear(root)
  const completed = state.spelling.completedExercises.length
  const start = button(completed > 0 ? 'Continue your quest' : 'Begin your quest', () => {
    primeAudio()
    showMenu()
  }, { class: 'btn btn-primary btn-large' })

  root.append(
    el('section', { class: 'exercise-screen' }, [
      el('h1', { class: 'exercise-title' }, ['Zelda Spelling Quest']),
      el('p', { class: 'prompt' }, [
        'Explore, fight monsters and collect rupees — but the sealed doors of this land open only for someone who can spell.',
      ]),
      el('p', { class: 'q-hint-line' }, [`${completed} of ${TOTAL_EXERCISES} exercises complete.`]),
      el('div', { class: 'controls' }, [start]),
    ]),
  )
  start.focus()
}

function showMenu(): void {
  clear(root)
  const up = nextExercise(state.spelling.completedExercises)

  const rows = EXERCISES.map((exercise) => {
    const done = state.spelling.completedExercises.includes(exercise.id)
    const unlocked = isUnlocked(exercise.id, state.spelling.completedExercises)
    const label = `${exercise.id}. ${exercise.title}${done ? ' ✓' : ''}`
    const node = button(label, () => startExercise(exercise.id), {
      class: done ? 'btn btn-quiet' : 'btn btn-primary',
    })
    node.disabled = !unlocked
    return el('div', { class: 'family-row' }, [node])
  })

  root.append(
    el('section', { class: 'exercise-screen' }, [
      el('h1', { class: 'exercise-title' }, ['Your quest so far']),
      el('p', { class: 'prompt' }, [
        `${state.spelling.completedExercises.length} of ${TOTAL_EXERCISES} exercises complete · ` +
          `${masteredCount(state.spelling.mastery)} patterns mastered · ${state.player.rupees} rupees`,
      ]),
      ...rows,
      ...(up ? [] : [el('p', { class: 'q-hint-line' }, ['More exercises are on the way.'])]),
    ]),
  )
}

function startExercise(id: number): void {
  const exercise = exerciseById(id)
  if (!exercise) return
  primeAudio()
  clear(root)

  const engine = new ExerciseEngine({
    exercise,
    concepts: CONCEPTS,
    bank: WORD_BANK,
    mastery: state.spelling.mastery,
    seed: `${exercise.id}-${state.createdAt}`,
  })

  state.spelling.inProgress = exercise.id
  persist()
  // Dev hook: lets the end-to-end check (and the browser console) see what is
  // being asked without reaching into the UI.
  activeEngine = engine

  mountExerciseScreen(root, {
    engine,
    bank: WORD_BANK,
    speech,
    onConceptProved: () => {
      // Rupees drip in as concepts are proved, so progress feels immediate.
      state.player.rupees += 10
      sfx.play('rupee')
      persist()
    },
    onComplete: (finished) => {
      if (!state.spelling.completedExercises.includes(finished.id)) {
        state.spelling.completedExercises.push(finished.id)
      }
      state.spelling.inProgress = undefined
      state.pacing.exerciseSeconds += engine.elapsedSeconds()
      state.player.rupees += 50
      persist()
      showMenu()
    },
    onExit: () => {
      state.pacing.exerciseSeconds += engine.elapsedSeconds()
      persist()
      showMenu()
    },
  })
}

showTitle()

// Expose a little state for the dev console and for end-to-end checks.
Object.assign(window as unknown as Record<string, unknown>, {
  zsq: {
    get state() {
      return state
    },
    reset() {
      localStorage.removeItem('zsq.save')
      state = load()
      showTitle()
    },
    startExercise,
    get engine() {
      return activeEngine
    },
    currentQuestion() {
      return activeEngine?.current()
    },
  },
})
