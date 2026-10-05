import type { AudioDictationQuestion, Response } from '../types'
import { answerInput, el, maskedWord, onEnter } from '../ui/dom'
import { sentenceOf } from '../wordbank'
import { speakWord, speakWordSlowly, SLOW_SENTENCE_RATE } from '../../core/audio/speech'
import type { QuestionView, RenderContext } from './index'

/** The computer says a word; the child types it. Replays are unlimited. */
export function renderAudioDictation(ctx: RenderContext): QuestionView {
  const question = ctx.question as AudioDictationQuestion
  const input = answerInput()
  input.addEventListener('input', ctx.changed)
  onEnter(input, ctx.submit)

  // While the pattern is new, the start of the word is written in and he
  // finishes it: "mit _ _ _ _" asks for less conjuring than a blank line.
  const stem = ctx.support?.stem
  const element = el('div', { class: `q q-audio${stem ? ' q-finish' : ''}` }, [
    ...(stem
      ? [
          maskedWord(question.word, (i) => i >= stem.length),
          el('p', { class: 'q-hint-line' }, ['The start is done for you. Listen, then type the whole word.']),
        ]
      : [el('p', { class: 'q-hint-line' }, ['Press the speaker to hear it again as many times as you like.'])]),
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
