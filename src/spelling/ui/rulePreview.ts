/**
 * The rule, before the questions.
 *
 * The opposite way round from `ruleReveal`, and on purpose. A spelling pattern
 * is something a child can notice for himself, so that one withholds the rule
 * until the end. A grammar convention is not there to be noticed — nobody works
 * out from first principles that the apostrophe goes where the letters were —
 * so it is explained first, and then four questions ask whether it landed.
 */
import { button, el } from './dom'

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
): void {
  const start = button('I am ready →', () => {
    panel.remove()
    onStart()
  }, { class: 'btn btn-primary btn-large' })

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
      el('div', { class: 'gate-actions' }, [start]),
    ]),
  ])

  root.append(panel)
  window.setTimeout(() => start.focus(), 80)
}
