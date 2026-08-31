import type { ClozeQuestion, Response } from '../types'
import { answerInput, el, onEnter } from '../ui/dom'
import type { QuestionView, RenderContext } from './index'

/** There are ___ dogs in the park. Choices while teaching, typing later. */
export function renderCloze(ctx: RenderContext): QuestionView {
  const question = ctx.question as ClozeQuestion
  const selecting = question.inputMode === 'select' && (question.choices?.length ?? 0) > 0
  const [before, after] = splitOnBlank(question.sentence)

  let chosen = ''
  const input = answerInput('Type the missing word')

  const sentence = el('p', { class: 'sentence-frame' }, [
    before,
    el('span', { class: 'gap' }, [selecting ? '?' : '_____']),
    after,
  ])

  const element = el('div', { class: 'q q-cloze' }, [sentence])

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
      },
      ...(question.speakSentence
        ? { replay: (slow: boolean) => ctx.speech.speak(spoken(question.sentence), { rate: slow ? 0.6 : 0.95 }) }
        : {}),
    }
  }

  input.addEventListener('input', ctx.changed)
  onEnter(input, ctx.submit)
  element.append(input)

  return {
    element,
    focus: () => input.focus(),
    read: (): Response => ({ kind: 'text', value: input.value }),
    showResult: (result) => element.classList.toggle('wrong', !result.correct),
    reset: () => {
      element.classList.remove('wrong')
      input.select()
    },
    ...(question.speakSentence
      ? { replay: (slow: boolean) => ctx.speech.speak(spoken(question.sentence), { rate: slow ? 0.6 : 0.95 }) }
      : {}),
  }
}

function splitOnBlank(sentence: string): [string, string] {
  const index = sentence.indexOf('___')
  if (index < 0) return [sentence, '']
  return [sentence.slice(0, index), sentence.slice(index + 3)]
}

/** Reads the gap aloud as "blank" so the sentence still makes sense. */
function spoken(sentence: string): string {
  return sentence.replace(/_{2,}/g, ' blank ')
}
