import type { Response, SyllableSplitQuestion } from '../types'
import { answerInput, el, onEnter } from '../ui/dom'
import { syllablesOf } from '../wordbank'
import { speakWord, SLOW_WORD_RATE } from '../../core/audio/speech'
import type { QuestionView, RenderContext } from './index'

/**
 * Two stages: chop the word into beats by clicking the gaps between letters,
 * then spell the whole word. Spec §6 — the chopping is the discovery, the
 * spelling is the proof.
 */
export function renderSyllableSplit(ctx: RenderContext): QuestionView {
  const question = ctx.question as SyllableSplitQuestion
  const word = question.word
  const thenSpell = question.thenSpell !== false
  const cuts = new Set<number>()

  const lettersRow = el('div', { class: 'syllable-word' })
  const gaps: HTMLElement[] = []

  for (let i = 0; i < word.length; i++) {
    lettersRow.append(el('span', { class: 'letter' }, [word[i] as string]))
    if (i < word.length - 1) {
      const gap = el('button', { type: 'button', class: 'cut', 'aria-label': `split after ${word[i]}` })
      gap.addEventListener('click', () => {
        const index = i + 1
        if (cuts.has(index)) cuts.delete(index)
        else cuts.add(index)
        gap.classList.toggle('cut-on', cuts.has(index))
        ctx.changed()
      })
      gaps.push(gap)
      lettersRow.append(gap)
    }
  }

  const spellInput = answerInput('Now type the whole word')
  spellInput.addEventListener('input', ctx.changed)
  onEnter(spellInput, ctx.submit)

  const element = el('div', { class: 'q q-syllable' }, [
    el('p', { class: 'q-hint-line' }, ['Click between the letters to chop the word into beats.']),
    lettersRow,
    ...(thenSpell ? [spellInput] : []),
  ])

  function currentSegments(): string[] {
    const ordered = [...cuts].sort((a, b) => a - b)
    const segments: string[] = []
    let cursor = 0
    for (const cut of ordered) {
      segments.push(word.slice(cursor, cut))
      cursor = cut
    }
    segments.push(word.slice(cursor))
    return segments.filter((s) => s.length > 0)
  }

  return {
    element,
    focus: () => (thenSpell ? gaps[0]?.focus() : gaps[0]?.focus()),
    read: (): Response => {
      const split = currentSegments().join('|')
      return thenSpell
        ? { kind: 'texts', values: [split, spellInput.value] }
        : { kind: 'texts', values: [split] }
    },
    showResult: (result) => {
      element.classList.toggle('wrong', !result.correct)
      element.classList.toggle('split-wrong', result.parts?.[0] === false)
      element.classList.toggle('spell-wrong', result.parts?.[1] === false)
      // Only nudge toward the beats once the split itself is right.
      if (result.parts?.[0] === true && result.parts?.[1] === false) spellInput.select()
    },
    reset: () => {
      element.classList.remove('wrong', 'split-wrong', 'spell-wrong')
    },
    replay: (slow) => {
      if (slow) {
        // Slow replay says the word one beat at a time, which is the point.
        // Chained rather than fired off on timers, so a slow beat is never cut
        // short by the next one starting.
        const beats = syllablesOf(word, ctx.bank).map((beat) => `${beat}.`)
        ctx.speech.speakSequence(beats, { rate: SLOW_WORD_RATE, gapMs: 500 })
        return
      }
      speakWord(ctx.speech, word)
    },
  }
}
