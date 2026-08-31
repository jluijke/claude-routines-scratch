import type { MissingLettersQuestion, Response } from '../types'
import { answerInput, el, maskedWord, onEnter } from '../ui/dom'
import { patternSpanOf } from '../wordbank'
import { speakWord, speakWordSlowly } from '../../core/audio/speech'
import type { QuestionView, RenderContext } from './index'

/**
 * b _ _ t, with the audio saying "boat". The child types the whole word rather
 * than just the gap — writing it out is the part that teaches.
 */
export function renderMissingLetters(ctx: RenderContext): QuestionView {
  const question = ctx.question as MissingLettersQuestion
  const [start, end] = patternSpanOf(question.word, ctx.bank)
  const blanks = new Set(question.blanks ?? range(start, end))

  const input = answerInput('Type the whole word')
  input.addEventListener('input', ctx.changed)
  onEnter(input, ctx.submit)

  const element = el('div', { class: 'q q-letters' }, [
    maskedWord(question.word, (i) => blanks.has(i)),
    el('p', { class: 'q-hint-line' }, ['Listen to the word, then write the whole thing.']),
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
    replay: (slow) =>
      slow ? speakWordSlowly(ctx.speech, question.word) : speakWord(ctx.speech, question.word),
  }
}

function range(start: number, end: number): number[] {
  const out: number[] = []
  for (let i = start; i < end; i++) out.push(i)
  return out
}
