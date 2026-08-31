import type { MissingPatternQuestion, Response } from '../types'
import { answerInput, el, onEnter } from '../ui/dom'
import { patternSpanOf } from '../wordbank'
import type { QuestionView, RenderContext } from './index'

/**
 * sn__ — early exercises offer choices, later ones make the child type the
 * whole word. That shift from choosing to recalling is the difficulty ramp
 * described in spec §10.
 */
export function renderMissingPattern(ctx: RenderContext): QuestionView {
  const question = ctx.question as MissingPatternQuestion
  const [start, end] = question.span ?? patternSpanOf(question.word, ctx.bank)
  const before = question.word.slice(0, start)
  const after = question.word.slice(end)
  const selecting = question.inputMode === 'select' && (question.choices?.length ?? 0) > 0

  let chosen = ''
  const input = answerInput('Type the whole word')

  const frame = el('p', { class: 'pattern-frame' }, [
    el('span', { class: 'known' }, [before]),
    el('span', { class: 'gap' }, ['__']),
    el('span', { class: 'known' }, [after]),
  ])

  const element = el('div', { class: 'q q-pattern' }, [frame])

  if (selecting) {
    const buttons = (question.choices ?? []).map((choice) =>
      el('button', { type: 'button', class: 'choice', 'data-choice': choice }, [choice]),
    )
    for (const node of buttons) {
      node.addEventListener('click', () => {
        chosen = node.dataset['choice'] ?? ''
        for (const other of buttons) other.classList.toggle('picked', other === node)
        ctx.changed()
        ctx.submit()
      })
    }
    element.append(el('div', { class: 'choices' }, buttons))
    return {
      element,
      focus: () => buttons[0]?.focus(),
      read: (): Response => ({ kind: 'text', value: chosen }),
      showResult: (result) => element.classList.toggle('wrong', !result.correct),
      reset: () => {
        element.classList.remove('wrong')
        for (const node of buttons) node.classList.remove('picked')
        chosen = ''
        buttons[0]?.focus()
      },
    }
  }

  input.addEventListener('input', ctx.changed)
  onEnter(input, ctx.submit)
  element.append(
    el('p', { class: 'q-hint-line' }, ['Work out the missing part, then write the whole word.']),
    input,
  )

  return {
    element,
    focus: () => input.focus(),
    read: (): Response => ({ kind: 'text', value: input.value }),
    showResult: (result) => element.classList.toggle('wrong', !result.correct),
    reset: () => {
      element.classList.remove('wrong')
      input.select()
    },
  }
}
