/**
 * The celebration at the end of an exercise — spec §5 and §16.
 *
 * The rule is deliberately withheld until now: the child works the pattern out
 * by doing the exercise, and only then gets it named and explained.
 */
import type { Exercise } from '../types'
import { button, el } from './dom'

export function showRuleReveal(root: HTMLElement, exercise: Exercise, onContinue: () => void): void {
  const { ruleReveal } = exercise

  const panel = el('section', { class: 'rule-reveal' }, [
    el('p', { class: 'reveal-banner' }, ['You discovered a spelling pattern!']),
    el('h2', { class: 'reveal-title' }, [ruleReveal.title]),
    el('p', { class: 'reveal-text' }, [ruleReveal.text]),
    el(
      'ul',
      { class: 'reveal-examples' },
      ruleReveal.examples.map((example) => el('li', {}, [example])),
    ),
    button('Back to the quest →', onContinue, { class: 'btn btn-primary btn-large' }),
  ])

  root.append(panel)
  window.setTimeout(() => panel.querySelector('button')?.focus(), 80)
}
