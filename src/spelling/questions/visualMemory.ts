import type { Response, VisualMemoryQuestion } from '../types'
import { answerInput, el, onEnter } from '../ui/dom'
import type { QuestionView, RenderContext } from './index'

/**
 * Flash the word, hide it, ask for it. Used sparingly — memorising is not the
 * learning mechanism here, just an occasional change of pace (spec §6).
 */
export function renderVisualMemory(ctx: RenderContext): QuestionView {
  const question = ctx.question as VisualMemoryQuestion
  const showMs = question.showMs ?? 2500

  const display = el('p', { class: 'memory-word' }, [question.word])
  const input = answerInput('Type the word you saw')
  input.addEventListener('input', ctx.changed)
  onEnter(input, ctx.submit)

  const inputRow = el('div', { class: 'memory-input', hidden: true }, [input])
  const element = el('div', { class: 'q q-memory' }, [
    el('p', { class: 'q-hint-line' }, ['Look carefully…']),
    display,
    inputRow,
  ])

  let timer = 0
  function startReveal(): void {
    window.clearTimeout(timer)
    display.hidden = false
    inputRow.hidden = true
    timer = window.setTimeout(() => {
      display.hidden = true
      inputRow.hidden = false
      input.focus()
    }, showMs)
  }

  startReveal()

  return {
    element,
    focus: () => (inputRow.hidden ? undefined : input.focus()),
    read: (): Response => ({ kind: 'text', value: input.value }),
    showResult: (result) => element.classList.toggle('wrong', !result.correct),
    reset: () => {
      element.classList.remove('wrong')
      input.value = ''
      // A second look is fair: this is a spelling exercise, not a memory test.
      startReveal()
    },
    replay: () => startReveal(),
  }
}
