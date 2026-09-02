/**
 * The exercise shell: prompt, activity, hint ladder, feedback, and the buttons.
 *
 * Feedback is short and encouraging (spec §14), there is never a visible timer
 * (spec §1), and audio can be replayed as often as the child likes with no
 * penalty (spec §7).
 */
import type { Exercise, GradeResult, Question, WordBank } from '../types'
import { ExerciseEngine } from '../engine'
import type { Hint } from '../hints'
import { promptFor, renderQuestion, type QuestionView } from '../questions'
import { button, clear, el } from './dom'
import { showRuleReveal } from './ruleReveal'
import type { SpeechEngine } from '../../core/audio/speech'
import { sfx } from '../../core/audio/sfx'

const CORRECT_NOTES = ['Correct!', 'Nice!', 'You got it.', 'Exactly.', 'Yes — that is it.']

export interface ExerciseScreenOptions {
  engine: ExerciseEngine
  bank: WordBank
  speech: SpeechEngine
  /** Rupees paid the moment a concept is proved, so progress feels immediate. */
  onConceptProved?: (concept: string) => void
  onComplete: (exercise: Exercise) => void
  /**
   * Lets the child walk away. The barrier stays shut and the exercise starts
   * again from the beginning next time — an abandoned run proves nothing — but
   * he is never stuck in front of a door he cannot face today.
   */
  onExit?: () => void
}

export function mountExerciseScreen(
  root: HTMLElement,
  options: ExerciseScreenOptions,
): { destroy: () => void } {
  const { engine, bank, speech } = options

  let view: QuestionView | undefined
  let noteIndex = 0
  /**
   * True between accepting an answer and drawing the next question. Choice
   * buttons submit on click, so without this a second click — or an impatient
   * double-tap on Check — would submit an empty answer against the *next*
   * question and record a mistake the child never made. Mistakes block mastery
   * here, so this matters.
   */
  let locked = false

  const title = el('h1', { class: 'exercise-title' }, [engine.exercise.title])
  const progressDots = el('div', { class: 'progress-dots' })
  const promptLine = el('p', { class: 'prompt' })
  const activity = el('div', { class: 'activity' })
  const hintBox = el('div', { class: 'hint-box', hidden: true })
  const feedback = el('p', { class: 'feedback', role: 'status', 'aria-live': 'polite' })

  const replayButton = button('🔊 Hear it', () => view?.replay?.(false), { class: 'btn btn-audio' })
  const slowButton = button('🐢 Slower', () => view?.replay?.(true), { class: 'btn btn-audio' })
  const hintButton = button('Need a hint?', takeHint, { class: 'btn btn-hint' })
  const checkButton = button('Check', check, { class: 'btn btn-primary' })

  // Leaving lives beside Check, not hidden in the header corner, and says what
  // it does. It asks first, because one stray click used to bin the lot.
  const leaveButton = button('Leave for now', askToLeave, { class: 'btn btn-leave' })
  const confirmLeave = button('Yes, leave', () => options.onExit?.(), { class: 'btn btn-leave' })
  const keepGoing = button('Keep going', hideLeavePrompt, { class: 'btn btn-primary' })
  const leavePrompt = el('div', { class: 'leave-prompt', hidden: true }, [
    el('p', { class: 'leave-question' }, [
      'Leave this exercise? The door stays shut, and you start this one again ' +
        'from the beginning next time.',
    ]),
    el('div', { class: 'leave-actions' }, [confirmLeave, keepGoing]),
  ])

  const controls = el('div', { class: 'controls' }, [
    replayButton,
    slowButton,
    hintButton,
    ...(options.onExit ? [leaveButton] : []),
    checkButton,
  ])

  function askToLeave(): void {
    // Never while an answer is being graded: the last question's 500 ms pause
    // is exactly when a finished exercise would be thrown away unrecorded.
    if (locked) return
    leavePrompt.hidden = false
    controls.hidden = true
    window.setTimeout(() => keepGoing.focus(), 40)
  }

  function hideLeavePrompt(): void {
    leavePrompt.hidden = true
    controls.hidden = false
    window.setTimeout(() => view?.focus(), 40)
  }

  /**
   * True once this screen has been taken down. The listener below lives on the
   * window, and a stale one that still answered the skip chord would finish an
   * exercise that ended minutes ago, against whichever door was open then.
   */
  let dead = false

  /**
   * The grown-up's skip: Ctrl+Shift+X, or Cmd+Shift+X on a Mac.
   *
   * For checking the game works, not for playing it. It records nothing — no
   * attempts, no proved patterns, no rupees — so the mastery table stays an
   * honest account of what the child actually did. All it does is finish the
   * exercise, which opens the door behind it.
   */
  function skipChord(event: KeyboardEvent): boolean {
    return (event.ctrlKey || event.metaKey) && event.shiftKey && (event.key === 'x' || event.key === 'X')
  }

  // Escape asks the same question, matching the world, where it opens the
  // pause panel.
  function onKey(event: KeyboardEvent): void {
    if (dead) return
    if (skipChord(event)) {
      event.preventDefault()
      // Nothing else may fire afterwards: the callback tears this screen down
      // and builds the world, and a pending 500 ms timer landing on top of it
      // would complete the exercise a second time.
      locked = true
      dead = true
      options.onComplete(engine.exercise)
      return
    }
    if (event.key !== 'Escape' || !options.onExit) return
    event.preventDefault()
    if (leavePrompt.hidden) askToLeave()
    else hideLeavePrompt()
  }
  window.addEventListener('keydown', onKey)

  const screen = el('section', { class: 'exercise-screen' }, [
    el('header', { class: 'exercise-header' }, [
      title,
      progressDots,
    ]),
    promptLine,
    activity,
    hintBox,
    feedback,
    controls,
    leavePrompt,
  ])

  root.append(screen)
  showQuestion()

  function showQuestion(): void {
    const question = engine.current()
    if (!question) return finish()

    locked = false
    clear(activity)
    clear(hintBox)
    hintBox.hidden = true
    feedback.textContent = ''
    feedback.className = 'feedback'

    promptLine.textContent = promptFor(question)

    // Publish what is actually on screen. The engine's pointer moves as soon as
    // an answer is accepted, but the child still sees the previous question for
    // half a second while the feedback shows — so anything reading the UI needs
    // the rendered question, not the engine's.
    activity.dataset['questionId'] = question.id
    activity.dataset['questionType'] = question.type

    view = renderQuestion({
      question,
      bank,
      speech,
      submit: check,
      changed: () => {
        feedback.textContent = ''
        feedback.className = 'feedback'
      },
    })
    activity.append(view.element)

    const hasAudio = view.replay !== undefined
    replayButton.hidden = !hasAudio
    slowButton.hidden = !hasAudio
    hintButton.hidden = false
    hintButton.textContent = 'Need a hint?'
    hintButton.disabled = !engine.canHint()
    checkButton.disabled = false

    renderDots()

    // Audio questions play once on arrival; the child can replay endlessly.
    if (hasAudio) window.setTimeout(() => view?.replay?.(false), 250)
    // Focus goes to the answer field so a child can keep typing (spec §8).
    window.setTimeout(() => view?.focus(), 60)
  }

  function renderDots(): void {
    clear(progressDots)
    const { answered, total } = engine.progress()
    for (let i = 0; i < total; i++) {
      progressDots.append(
        el('span', { class: i < answered ? 'dot done' : i === answered ? 'dot current' : 'dot' }),
      )
    }
  }

  function takeHint(): void {
    if (locked) return
    const hint = engine.nextHint()
    if (!hint) return
    renderHint(hint)
    hintButton.disabled = !engine.canHint()
    hintButton.textContent = engine.canHint() ? 'Another hint' : 'That is all the hints'
    view?.focus()
  }

  function renderHint(hint: Hint): void {
    hintBox.hidden = false
    const body: (Node | string)[] = [el('p', { class: 'hint-text' }, [hint.text])]

    if (hint.kind === 'replay') {
      body.push(button('🔊 Play it again', () => view?.replay?.(false), { class: 'btn btn-audio' }))
      body.push(button('🐢 Slower', () => view?.replay?.(true), { class: 'btn btn-audio' }))
    }
    if (hint.kind === 'mask' && hint.mask) {
      body.push(el('p', { class: 'hint-mask' }, [hint.mask.split('').join(' ')]))
    }
    if (hint.kind === 'choices' && hint.choices) {
      body.push(
        el(
          'div',
          { class: 'hint-choices' },
          hint.choices.map((choice) => el('span', { class: 'hint-choice' }, [choice])),
        ),
      )
    }
    hintBox.append(el('div', { class: `hint hint-${hint.level}` }, body))
  }

  function check(): void {
    if (!view || locked) return
    const result = engine.submit(view.read())
    view.showResult(result.grade)

    if (!result.grade.correct) return showWrong(result.grade)

    locked = true
    checkButton.disabled = true
    hintButton.disabled = true

    sfx.play('correct')
    feedback.textContent = CORRECT_NOTES[noteIndex++ % CORRECT_NOTES.length] as string
    feedback.className = 'feedback right'

    if (result.provedConcept) options.onConceptProved?.(result.provedConcept)

    if (result.exerciseComplete) {
      window.setTimeout(finish, 500)
      return
    }
    window.setTimeout(showQuestion, 500)
  }

  function showWrong(result: GradeResult): void {
    sfx.play('wrong')
    feedback.textContent = result.note ?? 'Not quite. Try again.'
    feedback.className = 'feedback not-yet'
    view?.reset()

    // Offer the next rung of the ladder rather than making them ask twice.
    hintButton.disabled = !engine.canHint()
    if (engine.currentHintLevel() === 0) hintButton.textContent = 'Show me a hint'
    window.setTimeout(() => view?.focus(), 40)
  }

  function finish(): void {
    sfx.play('fanfare')
    clear(screen)
    showRuleReveal(screen, engine.exercise, () => options.onComplete(engine.exercise))
  }

  return {
    destroy: () => {
      dead = true
      window.removeEventListener('keydown', onKey)
      screen.remove()
    },
  }
}

/** The word "question" is never shown to the child, only to us. */
export function describeQuestion(q: Question): string {
  return `${q.type}:${q.concept}`
}
