import type { Response, SentenceDictationQuestion } from '../types'
import { answerInput, el, onEnter } from '../ui/dom'
import type { QuestionView, RenderContext } from './index'

/**
 * The computer reads a sentence. Early on the child types one target word;
 * later they write the whole sentence. Only spelling is assessed.
 */
export function renderSentenceDictation(ctx: RenderContext): QuestionView {
  const question = ctx.question as SentenceDictationQuestion
  const wholeSentence = !question.targetWord

  const input = wholeSentence
    ? el('textarea', {
        class: 'answer answer-sentence',
        rows: 2,
        placeholder: 'Write the sentence',
        autocomplete: 'off',
        autocorrect: 'off',
        autocapitalize: 'off',
        spellcheck: 'false',
      })
    : answerInput('Type the missing word')

  input.addEventListener('input', ctx.changed)
  if (!wholeSentence) onEnter(input, ctx.submit)
  else {
    // In a textarea, Enter should submit but Shift+Enter should not.
    input.addEventListener('keydown', (event) => {
      const key = event as KeyboardEvent
      if (key.key === 'Enter' && !key.shiftKey) {
        key.preventDefault()
        ctx.submit()
      }
    })
  }

  const element = el('div', { class: 'q q-dictation' }, [
    el('p', { class: 'q-hint-line' }, [
      wholeSentence
        ? 'Listen to the whole sentence, then write it down. Spelling is what counts.'
        : `Listen, then type the word you hear in place of the gap.`,
    ]),
    ...(wholeSentence
      ? []
      : [el('p', { class: 'sentence-frame' }, [question.sentence.replace(question.targetWord as string, '_____')])]),
    input,
  ])

  return {
    element,
    focus: () => input.focus(),
    read: (): Response => ({ kind: 'text', value: (input as HTMLInputElement).value }),
    showResult: (result) => {
      element.classList.toggle('wrong', !result.correct)
    },
    reset: () => {
      element.classList.remove('wrong')
      ;(input as HTMLInputElement).focus()
    },
    replay: (slow: boolean) => ctx.speech.speak(question.sentence, { rate: slow ? 0.6 : 0.95 }),
  }
}
