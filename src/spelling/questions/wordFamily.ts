import type { Response, WordFamilyQuestion } from '../types'
import { answerInput, el, onEnter } from '../ui/dom'
import type { QuestionView, RenderContext } from './index'

/**
 * From one base word, build the family. Each target has a meaning clue so this
 * stays a spelling task rather than a guessing game.
 */
export function renderWordFamily(ctx: RenderContext): QuestionView {
  const question = ctx.question as WordFamilyQuestion
  const inputs: HTMLInputElement[] = []

  const rows = question.targets.map((target, index) => {
    const input = answerInput('')
    input.addEventListener('input', ctx.changed)
    onEnter(input, () => {
      const next = inputs[index + 1]
      if (next) next.focus()
      else ctx.submit()
    })
    inputs.push(input)
    return el('div', { class: 'family-row' }, [
      el('span', { class: 'family-clue' }, [target.clue]),
      input,
    ])
  })

  const element = el('div', { class: 'q q-family' }, [
    el('p', { class: 'family-base' }, ['Base word: ', el('strong', {}, [question.base])]),
    ...rows,
  ])

  return {
    element,
    focus: () => inputs[0]?.focus(),
    read: (): Response => ({ kind: 'texts', values: inputs.map((i) => i.value) }),
    showResult: (result) => {
      element.classList.toggle('wrong', !result.correct)
      inputs.forEach((input, i) => {
        input.classList.toggle('field-wrong', result.parts?.[i] === false)
        input.classList.toggle('field-right', result.parts?.[i] === true)
      })
      // Send the child straight to the first one that still needs work.
      const firstWrong = result.parts?.findIndex((p) => !p) ?? -1
      if (firstWrong >= 0) inputs[firstWrong]?.focus()
    },
    reset: () => {
      element.classList.remove('wrong')
    },
  }
}
