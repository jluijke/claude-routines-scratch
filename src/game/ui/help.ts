/**
 * The controls, on one screen.
 *
 * A nine-year-old should not have to be told which key swings the sword, or
 * remember it from a title screen he saw ten minutes ago. Tapping Control (or
 * Escape) pauses the game and shows the lot.
 */
import { button, el } from '../../spelling/ui/dom'
import { BINDINGS } from '../../core/input'
import { spriteCanvas } from '../render/icons'

const GROUPS = ['Moving', 'Doing', 'The rest'] as const

export function showHelp(root: HTMLElement, onClose: () => void): () => void {
  const done = button('Back to the quest', () => {
    close()
    onClose()
  }, { class: 'btn btn-primary' })

  const columns = el('div', { class: 'help-columns' })
  for (const group of GROUPS) {
    const grid = el('div', { class: 'help-grid' })
    for (const binding of BINDINGS.filter((b) => b.group === group)) {
      grid.append(
        el('span', { class: 'help-keys' }, binding.keys.map((key) => el('kbd', { class: 'key' }, [key]))),
        el('span', { class: 'help-what' }, [binding.what]),
      )
    }
    columns.append(el('div', {}, [el('p', { class: 'help-section' }, [group]), grid]))
  }

  const panel = el('div', { class: 'overlay' }, [
    el('section', { class: 'panel-game help-panel' }, [
      el('h2', { class: 'panel-title' }, [spriteCanvas('swordIconWooden', 1), 'Controls']),
      columns,
      el('p', { class: 'help-footnote' }, [
        'You can also click where you want to go, and right-click to swing. ' +
          'The B slot in the corner shows what X will use — press C to change it.',
      ]),
      el('div', { class: 'gate-actions' }, [done]),
    ]),
  ])

  root.append(panel)
  window.setTimeout(() => done.focus(), 60)

  // Escape and Control close it again, the same keys that opened it. The world
  // is paused while this is up, so its own handler is not listening.
  function onKey(event: KeyboardEvent): void {
    if (event.key === 'Escape' || event.key === 'Control' || event.key === '?') {
      event.preventDefault()
      close()
      onClose()
    }
  }
  window.addEventListener('keydown', onKey)

  function close(): void {
    window.removeEventListener('keydown', onKey)
    panel.remove()
  }
  return close
}
