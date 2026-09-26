/**
 * The celebration at the end of an exercise — spec §5 and §16.
 *
 * The rule is deliberately withheld until now: the child works the pattern out
 * by doing the exercise, and only then gets it named and explained.
 */
import type { Exercise } from '../types'
import type { SpeechEngine } from '../../core/audio/speech'
import { SLOW_SENTENCE_RATE } from '../../core/audio/speech'
import { button, el } from './dom'
import { spokenParts } from './spokenRule'

/** The pause between the title, the rule and each example, in milliseconds. */
const RULE_GAP_MS = 450

export function showRuleReveal(
  root: HTMLElement,
  exercise: Exercise,
  onContinue: () => void,
  speech?: SpeechEngine,
): void {
  const { ruleReveal } = exercise

  // Said aloud as it appears, and again on the button. He does not always
  // read the panel; he does listen.
  const say = (slow: boolean): void =>
    speech?.speakSequence(spokenParts(ruleReveal), { rate: slow ? SLOW_SENTENCE_RATE : 0.92, gapMs: RULE_GAP_MS })

  const panel = el('section', { class: 'rule-reveal' }, [
    el('p', { class: 'reveal-banner' }, ['You discovered a spelling pattern!']),
    el('h2', { class: 'reveal-title' }, [ruleReveal.title]),
    el('p', { class: 'reveal-text' }, [ruleReveal.text]),
    el(
      'ul',
      { class: 'reveal-examples' },
      ruleReveal.examples.map((example) => el('li', {}, [example])),
    ),
    el('div', { class: 'gate-actions' }, [
      ...(speech
        ? [
            button('🔊 Hear the rule', () => say(false), { class: 'btn btn-audio' }),
            button('🐢 Slower', () => say(true), { class: 'btn btn-audio' }),
          ]
        : []),
      button('Back to the quest →', () => {
        speech?.cancel()
        onContinue()
      }, { class: 'btn btn-primary btn-large' }),
    ]),
  ])

  root.append(panel)
  window.setTimeout(() => (panel.querySelector('.btn-primary') as HTMLElement | null)?.focus(), 80)
  window.setTimeout(() => say(false), 350)
}
