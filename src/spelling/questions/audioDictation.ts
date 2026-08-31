import type { AudioDictationQuestion, Response } from '../types'
import { answerInput, el, onEnter } from '../ui/dom'
import { sentenceOf } from '../wordbank'
import { speakWord, speakWordSlowly, SLOW_SENTENCE_RATE } from '../../core/audio/speech'
import type { QuestionView, RenderContext } from './index'

/** The computer says a word; the child types it. Replays are unlimited. */
export function renderAudioDictation(ctx: RenderContext): QuestionView {
  const question = ctx.question as AudioDictationQuestion
  const input = answerInput()
  input.addEventListener('input', ctx.changed)
  onEnter(input, ctx.submit)

  const element = el('div', { class: 'q q-audio' }, [
    el('p', { class: 'q-hint-line' }, ['Press the speaker to hear it again as many times as you like.']),
    input,
  ])

  const sentence = question.withSentence ? sentenceOf(question.word, ctx.bank) : undefined

  const replay = (slow: boolean): void => {
    if (slow) {
      speakWordSlowly(ctx.speech, question.word)
      if (sentence) {
        window.setTimeout(() => ctx.speech.speak(sentence, { rate: SLOW_SENTENCE_RATE }), 2600)
      }
      return
    }
    speakWord(ctx.speech, question.word, {
      onEnd: sentence ? () => window.setTimeout(() => ctx.speech.speak(sentence), 320) : undefined,
    })
  }

  return {
    element,
    focus: () => input.focus(),
    read: (): Response => ({ kind: 'text', value: input.value }),
    showResult: (result) => element.classList.toggle('wrong', !result.correct),
    reset: () => {
      element.classList.remove('wrong')
      input.select()
    },
    replay,
  }
}
