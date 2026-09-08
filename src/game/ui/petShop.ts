/**
 * The pet cave.
 *
 * Not a shop: nothing here costs anything, and there is no wrong answer. Six
 * animals, one of them comes with him, and he can walk back in and swap
 * whenever he likes. The only thing this screen has to do well is make the
 * choice feel like his.
 */
import { button, clear, el } from '../../spelling/ui/dom'
import { PETS, type PetDef, type PetKind } from '../pets'
import { spriteCanvas } from '../render/icons'
import { sfx } from '../../core/audio/sfx'

export interface PetShopOptions {
  /** The animal he already has, if he has been in before. */
  chosen: PetKind | undefined
  /** He picked one. Save it and put it at his heel. */
  onChoose: (kind: PetKind) => void
  onClose: () => void
}

export function showPetShop(
  root: HTMLElement,
  options: PetShopOptions,
): { close: () => void; refresh: () => void } {
  let chosen = options.chosen

  const list = el('div', { class: 'pet-list' })
  const note = el('p', { class: 'shop-note', role: 'status', 'aria-live': 'polite' })

  const closeButton = button(
    'Back outside',
    () => {
      close()
      options.onClose()
    },
    { class: 'btn btn-quiet' },
  )

  const panel = el('div', { class: 'overlay' }, [
    el('section', { class: 'shop panel-game pet-shop' }, [
      el('h2', { class: 'panel-title' }, ['The Pet Cave']),
      el('p', { class: 'shop-greeting' }, [
        '"They all want to come with you. Pick the one you like the look of — ' +
          'and if you change your mind, come back and pick another."',
      ]),
      note,
      list,
      el('div', { class: 'gate-actions' }, [closeButton]),
    ]),
  ])

  root.append(panel)
  render()
  window.setTimeout(() => (list.querySelector('button:not(:disabled)') as HTMLElement | null)?.focus(), 60)

  function render(): void {
    clear(list)
    for (const pet of PETS) list.append(row(pet))
  }

  function row(pet: PetDef): HTMLElement {
    const mine = chosen === pet.kind
    const action = button(mine ? 'Yours' : 'Choose', () => choose(pet), {
      class: mine ? 'btn btn-quiet' : 'btn btn-primary',
    })
    action.disabled = mine

    const card = el('div', { class: 'pet-row' }, [
      el('div', { class: 'pet-icon' }, [spriteCanvas(pet.frames[0], 3)]),
      el('div', { class: 'shop-item' }, [
        el('span', { class: 'shop-name' }, [pet.name]),
        el('span', { class: 'shop-desc' }, [pet.blurb]),
      ]),
      action,
    ])
    if (mine) card.classList.add('is-owned')
    return card
  }

  function choose(pet: PetDef): void {
    chosen = pet.kind
    sfx.play('bark')
    note.textContent = `"The ${pet.name.toLowerCase()} it is. Off you go, then."`
    options.onChoose(pet.kind)
    render()
  }

  function close(): void {
    panel.remove()
  }

  return { close, refresh: render }
}
