import type { Response, WordBuildQuestion } from '../types'
import { answerInput, el, onEnter } from '../ui/dom'
import type { QuestionView, RenderContext } from './index'

/** help + ful = helpful. The parts are shown; the child writes the result. */
export function renderWordBuild(ctx: RenderContext): QuestionView {
  const question = ctx.question as WordBuildQuestion
  const input = answerInput('Type the finished word')
  input.addEventListener('input', ctx.changed)
  onEnter(input, ctx.submit)

  const sum: (Node | string)[] = []
  question.parts.forEach((part, i) => {
    if (i > 0) sum.push(el('span', { class: 'plus' }, ['+']))
    sum.push(el('span', { class: 'part' }, [part]))
  })
  sum.push(el('span', { class: 'plus' }, ['=']))
  sum.push(el('span', { class: 'part unknown' }, ['?']))

  const element = el('div', { class: 'q q-build' }, [
    el('p', { class: 'build-sum' }, sum),
    input,
  ])

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
