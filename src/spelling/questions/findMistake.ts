import type { FindMistakeQuestion, Response } from '../types'
import { answerInput, el, onEnter } from '../ui/dom'
import type { QuestionView, RenderContext } from './index'

/**
 * "I am realy happy today." Two steps, both of which matter: notice which word
 * is wrong, then write it correctly.
 */
export function renderFindMistake(ctx: RenderContext): QuestionView {
  const question = ctx.question as FindMistakeQuestion
  let picked = ''

  const fixInput = answerInput('Now spell it correctly')
  fixInput.addEventListener('input', ctx.changed)
  onEnter(fixInput, ctx.submit)

  const fixRow = el('div', { class: 'fix-row', hidden: true }, [
    el('span', { class: 'fix-label' }, ['Fix it:']),
    fixInput,
  ])

  const tokens = question.sentence.split(/(\s+)/)
  const wordButtons: HTMLElement[] = []

  const sentence = el(
    'p',
    { class: 'sentence-frame clickable' },
    tokens.map((token) => {
      if (/^\s+$/.test(token)) return document.createTextNode(token)
      const node = el('button', { type: 'button', class: 'word-token' }, [token])
      node.addEventListener('click', () => {
        picked = stripPunctuation(token)
        for (const other of wordButtons) other.classList.toggle('picked', other === node)
        fixRow.hidden = false
        fixInput.focus()
        ctx.changed()
      })
      wordButtons.push(node)
      return node
    }),
  )

  const element = el('div', { class: 'q q-mistake' }, [
    el('p', { class: 'q-hint-line' }, ['Click the word that is spelled wrongly.']),
    sentence,
    fixRow,
  ])

  return {
    element,
    focus: () => wordButtons[0]?.focus(),
    read: (): Response => ({ kind: 'texts', values: [picked, fixInput.value] }),
    showResult: (result) => {
      element.classList.toggle('wrong', !result.correct)
      element.classList.toggle('picked-wrong', result.parts?.[0] === false)
      if (result.parts?.[0] === false) {
        // They pointed at the wrong word, so the correction does not apply yet.
        fixRow.hidden = true
        fixInput.value = ''
        for (const node of wordButtons) node.classList.remove('picked')
      }
    },
    reset: () => {
      element.classList.remove('wrong', 'picked-wrong')
    },
  }
}

/**
 * Trims the punctuation around a clicked word while keeping the characters
 * that are part of its spelling. Curly apostrophes count: a child clicking
 * "it's" must submit the apostrophe, or they can never match the answer.
 */
function stripPunctuation(token: string): string {
  return token.replace(/^[^A-Za-z'’-]+|[^A-Za-z'’-]+$/g, '')
}
