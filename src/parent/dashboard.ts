/**
 * The parent view — hidden behind Ctrl+Shift+P.
 *
 * Everything here stays in this browser. Nothing is uploaded anywhere. It
 * answers the questions a parent actually has: which patterns have stuck, which
 * are shaky, which words keep going wrong, and whether the play-versus-spelling
 * balance is anywhere near the 50/50 it is meant to be.
 */
import { answerInput, button, el } from '../spelling/ui/dom'
import { speakWord, type SpeechEngine } from '../core/audio/speech'
import { CONCEPTS } from '../content/concepts'
import { masteredCount } from '../spelling/mastery'
import { EXERCISES, TOTAL_EXERCISES } from '../content/exercises'
import { deserialise, serialise, type SaveData } from '../core/save'
import { describe as describePacing, ratio } from '../game/pacing'
import type { MasteryStatus } from '../spelling/mastery'

const STATUS_LABEL: Record<MasteryStatus, string> = {
  unseen: 'not met yet',
  learning: 'still learning',
  shaky: 'needs practice',
  mastered: 'mastered',
}

export interface DashboardOptions {
  save: SaveData
  /** The live engine: the picker has to list voices and speak through them. */
  speech: SpeechEngine
  /** Remember a voice chosen by ear, per device. */
  onVoiceChosen: (name: string | undefined) => void
  onImport: (save: SaveData) => void
  /** Wipe everything and start the quest again. */
  onReset: () => void
  onClose: () => void
}

/** Returns a function that closes the panel. */
export function mountParentDashboard(root: HTMLElement, options: DashboardOptions): () => void {
  const { save } = options

  const conceptRows = [...CONCEPTS.values()].map((concept) => {
    const record = save.spelling.mastery.concepts[concept.id]
    const status = record?.status ?? 'unseen'
    const attempts = record?.attempted ?? 0
    const independent = record?.independentCorrect ?? 0
    const hints = record?.hintsUsed ?? 0
    const missed = record?.missedWords ?? []

    return el('tr', { class: `mastery-${status}` }, [
      el('td', {}, [concept.label]),
      el('td', {}, [STATUS_LABEL[status]]),
      el('td', {}, [`${independent} of ${attempts}`]),
      el('td', {}, [String(hints)]),
      el('td', { class: 'missed' }, [missed.length > 0 ? [...new Set(missed)].slice(-6).join(', ') : '—']),
    ])
  })

  const shaky = [...CONCEPTS.values()].filter(
    (c) => save.spelling.mastery.concepts[c.id]?.status === 'shaky',
  )

  const split = ratio(save.pacing)
  const balanceNote =
    save.pacing.playSeconds + save.pacing.exerciseSeconds < 240
      ? 'Not enough time recorded yet to judge the balance.'
      : split > 0.62
        ? 'Play is running ahead. Rupee drops have thinned out and optional doors are staying shut, which nudges him toward the next sealed door.'
        : split < 0.38
          ? 'Spelling is running ahead. Optional doors are opening for free and rupees are falling generously, so he gets a longer stretch of play.'
          : 'The balance is close to 50/50.'

  const exportButton = button('Download progress file', () => {
    const blob = new Blob([serialise(save)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = el('a', { href: url, download: `spelling-quest-${new Date().toISOString().slice(0, 10)}.json` })
    link.click()
    URL.revokeObjectURL(url)
  }, { class: 'btn btn-quiet' })

  const fileInput = el('input', { type: 'file', accept: 'application/json', class: 'file-input' })
  fileInput.addEventListener('change', async () => {
    const file = fileInput.files?.[0]
    if (!file) return
    try {
      options.onImport(deserialise(await file.text()))
    } catch {
      importNote.textContent = 'That file could not be read as a progress file.'
    }
  })
  const importNote = el('p', { class: 'q-hint-line' }, ['Load a progress file from another device.'])

  // Starting over throws away every mastery record, and there is no undo, so
  // it asks for a word rather than a click.
  const resetField = answerInput('Type NEW', { class: 'answer reset-field' })
  const resetButton = button('Start a new quest', () => {
    if (resetField.value.trim().toUpperCase() !== 'NEW') {
      resetNote.textContent = 'Type NEW in the box first. This cannot be undone.'
      resetField.focus()
      return
    }
    options.onReset()
  }, { class: 'btn btn-quiet' })
  const resetNote = el('p', { class: 'q-hint-line' }, [
    'Wipes all progress, gear and rupees, and starts from the title screen. ' +
      'Download the progress file first if you might want it back.',
  ])

  // --- the voice ---------------------------------------------------------
  //
  // Which voices exist differs on every machine, and how good they sound cannot
  // be judged from code — so the real answer is to let a parent hear a few and
  // choose. The default is a best guess at quality; this overrides it.
  const available = options.speech.voices()
  const voiceNote = el('p', { class: 'q-hint-line' })

  const voiceSelect = el('select', { class: 'voice-select' },
    available.map((voice) =>
      el('option', { value: voice.name, ...(voice.name === options.speech.chosenVoiceName() ? { selected: 'true' } : {}) },
        [`${voice.name} — ${voice.lang}`]),
    ),
  )
  voiceSelect.addEventListener('change', () => {
    options.speech.useVoice(voiceSelect.value)
    options.onVoiceChosen(voiceSelect.value)
    voiceNote.textContent = `Now speaking with ${voiceSelect.value}.`
  })

  const hearIt = button('Hear it', () => {
    options.speech.useVoice(voiceSelect.value || undefined)
    // Three beats and a soft ending: a bad voice gives itself away at once.
    speakWord(options.speech, 'fantastic')
  }, { class: 'btn btn-audio' })

  const voiceRow = available.length > 0
    ? el('div', { class: 'dash-actions' }, [voiceSelect, hearIt])
    : el('p', { class: 'q-hint-line' }, [
        'This browser is offering no speech voices at all, so nothing can be read aloud. ' +
          'On a Mac, Chrome or Safari have them; check the system voice settings if not.',
      ])

  if (available.length > 0) {
    voiceNote.textContent =
      `Currently speaking with ${options.speech.chosenVoiceName() ?? 'the default voice'}. ` +
      'Press Hear it, and pick whichever is clearest.'
  }

  const close = button('Close', () => {
    panel.remove()
    options.onClose()
  }, { class: 'btn btn-primary' })

  const panel = el('div', { class: 'overlay' }, [
    el('section', { class: 'dashboard' }, [
      el('h2', {}, ['How the spelling is going']),
      el('p', { class: 'q-hint-line' }, [
        'This screen is for you, not for him. Everything below stays in this browser and is never sent anywhere.',
      ]),

      el('div', { class: 'dash-stats' }, [
        stat('Exercises complete', `${save.spelling.completedExercises.length} of ${TOTAL_EXERCISES}`),
        stat('Written so far', `${EXERCISES.length} exercises`),
        stat('Patterns mastered', String(countMastered(save))),
        stat('Needs practice', String(shaky.length)),
        stat('Rupees', String(save.player.rupees)),
        stat('Hearts', `${save.player.hearts} of ${save.player.maxHearts}`),
      ]),

      el('h3', {}, ['Play and spelling balance']),
      el('p', {}, [describePacing(save.pacing)]),
      el('p', { class: 'q-hint-line' }, [balanceNote]),

      el('h3', {}, ['Pattern by pattern']),
      el('table', { class: 'mastery-table' }, [
        el('thead', {}, [
          el('tr', {}, [
            el('th', {}, ['Pattern']),
            el('th', {}, ['Status']),
            el('th', {}, ['Right first time']),
            el('th', {}, ['Hints used']),
            el('th', {}, ['Words missed']),
          ]),
        ]),
        el('tbody', {}, conceptRows),
      ]),
      el('p', { class: 'q-hint-line' }, [
        '"Right first time" counts only answers given with no hints and no second attempt — the program treats nothing else as mastery.',
      ]),

      el('h3', {}, ['Progress file']),
      el('div', { class: 'dash-actions' }, [exportButton, fileInput]),
      importNote,

      el('h3', {}, ['Start again']),
      el('div', { class: 'dash-actions' }, [resetField, resetButton]),
      resetNote,

      el('h3', {}, ['The reading voice']),
      voiceRow,
      voiceNote,

      el('div', { class: 'gate-actions' }, [close]),
    ]),
  ])

  root.append(panel)
  window.setTimeout(() => close.focus(), 60)

  return () => panel.remove()
}

function stat(label: string, value: string): HTMLElement {
  return el('div', { class: 'dash-stat' }, [
    el('span', { class: 'dash-value' }, [value]),
    el('span', { class: 'dash-label' }, [label]),
  ])
}

function countMastered(save: SaveData): number {
  return masteredCount(save.spelling.mastery, CONCEPTS.keys())
}
