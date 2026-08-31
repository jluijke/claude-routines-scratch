import type { ProofreadQuestion, Response } from '../types'
import { answerInput, el } from '../ui/dom'
import { normalise } from '../normalise'
import type { QuestionView, RenderContext } from './index'

/**
 * A paragraph with several mistakes. The child clicks each wrong word and
 * types the fix. The question is not finished until every one is corrected.
 */
export function renderProofread(ctx: RenderContext): QuestionView {
  const question = ctx.question as ProofreadQuestion
  const corrections = new Map<string, string>()

  const fixList = el('div', { class: 'fix-list' })
  const inputs = new Map<string, HTMLInputElement>()

  const tokens = question.text.split(/(\s+)/)
  const nodes = tokens.map((token) => {
    if (/^\s+$/.test(token)) return document.createTextNode(token)
    const node = el('button', { type: 'button', class: 'word-token' }, [token])
    node.addEventListener('click', () => addFix(stripPunctuation(token), node))
    return node
  })

  function addFix(word: string, token: HTMLElement): void {
    if (inputs.has(word)) {
      inputs.get(word)?.focus()
      return
    }
    const input = answerInput('correct spelling')
    input.addEventListener('input', () => {
      corrections.set(word, input.value)
      ctx.changed()
    })
    inputs.set(word, input)
    token.classList.add('flagged')

    const remove = el('button', { type: 'button', class: 'drop-fix', 'aria-label': 'not this word' }, ['×'])
    const row = el('div', { class: 'fix-row' }, [
      el('span', { class: 'fix-label' }, [word, ' →']),
      input,
      remove,
    ])
    remove.addEventListener('click', () => {
      inputs.delete(word)
      corrections.delete(word)
      token.classList.remove('flagged')
      row.remove()
      ctx.changed()
    })

    fixList.append(row)
    input.focus()
  }

  const element = el('div', { class: 'q q-proofread' }, [
    el('p', { class: 'q-hint-line' }, [
      `There ${question.errors.length === 1 ? 'is 1 mistake' : `are ${question.errors.length} mistakes`}. Click each wrong word, then type it correctly.`,
    ]),
    el('p', { class: 'sentence-frame clickable paragraph' }, nodes),
    fixList,
  ])

  return {
    element,
    focus: () => (nodes.find((n) => n instanceof HTMLElement) as HTMLElement | undefined)?.focus(),
    read: (): Response => {
      // Answers are matched to the errors the content declared, in order, so
      // the child can fix them in whatever order they spot them.
      return {
        kind: 'texts',
        values: question.errors.map((error) => {
          for (const [flagged, fix] of corrections) {
            if (normalise(flagged) === normalise(error.wrong)) return fix
          }
          return ''
        }),
      }
    },
    showResult: (result) => {
      element.classList.toggle('wrong', !result.correct)
      question.errors.forEach((error, i) => {
        const input = inputs.get(error.wrong) ?? findInput(inputs, error.wrong)
        if (!input) return
        input.classList.toggle('field-right', result.parts?.[i] === true)
        input.classList.toggle('field-wrong', result.parts?.[i] === false)
      })
    },
    reset: () => {
      element.classList.remove('wrong')
    },
  }
}

function findInput(inputs: Map<string, HTMLInputElement>, word: string): HTMLInputElement | undefined {
  for (const [key, input] of inputs) {
    if (normalise(key) === normalise(word)) return input
  }
  return undefined
}

function stripPunctuation(token: string): string {
  return token.replace(/^[^A-Za-z']+|[^A-Za-z']+$/g, '')
}
