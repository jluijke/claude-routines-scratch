/**
 * The rule, before the questions.
 *
 * The opposite way round from `ruleReveal`, and on purpose. A spelling pattern
 * is something a child can notice for himself, so that one withholds the rule
 * until the end. A grammar convention is not there to be noticed — nobody works
 * out from first principles that the apostrophe goes where the letters were —
 * so it is explained first, and then four questions ask whether it landed.
 */
import type { SpeechEngine } from '../../core/audio/speech'
import { SLOW_SENTENCE_RATE } from '../../core/audio/speech'
import { button, el } from './dom'
import { spokenParts } from './spokenRule'

/** The pause between the title, the rule and each example, in milliseconds. */
const RULE_GAP_MS = 450

export interface RulePreview {
  title: string
  text: string
  examples: string[]
  /** How many questions are coming, said plainly so it feels short. */
  questions: number
}

export function showRulePreview(
  root: HTMLElement,
  rule: RulePreview,
  onStart: () => void,
  speech?: SpeechEngine,
): void {
  const start = button('I am ready →', () => {
    speech?.cancel()
    panel.remove()
    onStart()
  }, { class: 'btn btn-primary btn-large' })

  // Read to him as it appears — the whole point of telling the rule first is
  // lost on a child who skips the paragraph — and again on the button.
  const say = (slow: boolean): void =>
    speech?.speakSequence(spokenParts(rule), { rate: slow ? SLOW_SENTENCE_RATE : 0.92, gapMs: RULE_GAP_MS })

  // Inside the same paper panel the exercise screen uses. The reveal at the end
  // of an exercise is drawn into that panel rather than onto the page, and its
  // cream example chips are invisible anywhere else.
  const panel = el('section', { class: 'exercise-screen' }, [
    el('div', { class: 'rule-reveal rule-preview' }, [
      el('p', { class: 'reveal-banner' }, ['A rule worth knowing']),
      el('h2', { class: 'reveal-title' }, [rule.title]),
      el('p', { class: 'reveal-text' }, [rule.text]),
      el('ul', { class: 'reveal-examples' }, rule.examples.map((example) => el('li', {}, [example]))),
      el('p', { class: 'reveal-after' }, [
        `Then ${rule.questions} questions — that is all — and the food is yours.`,
      ]),
      el('div', { class: 'gate-actions' }, [
        ...(speech
          ? [
              button('🔊 Hear the rule', () => say(false), { class: 'btn btn-audio' }),
              button('🐢 Slower', () => say(true), { class: 'btn btn-audio' }),
            ]
          : []),
        start,
      ]),
    ]),
  ])

  root.append(panel)
  window.setTimeout(() => start.focus(), 80)
  window.setTimeout(() => say(false), 350)
}
