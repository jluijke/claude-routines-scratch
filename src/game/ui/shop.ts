/**
 * The shop.
 *
 * Rupees from monsters cover consumables. The gear that changes how the game
 * plays costs more than wandering can earn, and the best pieces need a spelling
 * challenge before the shopkeeper will sell at all.
 */
import { button, clear, el } from '../../spelling/ui/dom'
import { CASTAWAY_SHOP, ITEMS, SECRET_SHOP, VILLAGE_SHOP, type ItemDef, type ItemId } from '../items'
import { gateById, type Gate } from '../gates'
import type { SaveData } from '../../core/save'
import { sfx } from '../../core/audio/sfx'
import { itemIcon, spriteCanvas } from '../render/icons'

export type ShopKind = 'village' | 'secret' | 'smith' | 'castaway'

const SMITH_STOCK: ItemId[] = ['metalSword', 'bronzeSword', 'goldenSword']

/**
 * What the shopkeeper says as he hands it over.
 *
 * Pleasantries, except for the first bombs. Everything else in the world can
 * be found by walking into it; the cracked boulder on the forest path cannot,
 * and the map behind it is the one thing that would have told him where to
 * look. So the man selling the bombs mentions it, once, and stops as soon as
 * the map is in the pack.
 */
function patter(item: ItemDef, save: SaveData): string {
  if (item.id === 'bomb' && (save.inventory.map ?? 0) === 0) {
    return (
      '"Bombs. Mind your toes. And if you are going north — there is a cracked ' +
      'boulder in the rocks on the forest path. Something is behind it."'
    )
  }
  return `"${item.name}. Good choice."`
}

const TITLES: Record<ShopKind, string> = {
  village: 'The Village Shop',
  secret: 'A Hidden Trader',
  smith: 'The Smithy',
  castaway: 'The Castaway',
}

const GREETINGS: Record<ShopKind, string> = {
  village: '"Come in, come in. Rupees on the counter."',
  secret: 'The hooded figure says nothing, and gestures at the shelf.',
  smith: '"I forge blades. Bring me rupees and a steady mind."',
  castaway:
    'He does not look up. "Everyone who comes here needs the same thing, and I am the only one selling it. Three hundred. I am not sorry."',
}

export interface ShopOptions {
  kind: ShopKind
  save: SaveData
  /** Ask for the barrier challenge that unlocks a gated item. */
  onGateRequest: (gate: Gate) => void
  /** Something was bought; re-equip and save. */
  onPurchase: () => void
  onClose: () => void
}

export function showShop(root: HTMLElement, options: ShopOptions): { close: () => void; refresh: () => void } {
  const { kind, save } = options
  const stock =
    kind === 'village' ? VILLAGE_SHOP
    : kind === 'secret' ? SECRET_SHOP
    : kind === 'castaway' ? CASTAWAY_SHOP
    : SMITH_STOCK

  const rupeeLine = el('span', { class: 'shop-rupees' })
  const list = el('div', { class: 'shop-list' })
  const note = el('p', { class: 'shop-note', role: 'status', 'aria-live': 'polite' })

  const closeButton = button('Leave the shop', () => {
    close()
    options.onClose()
  }, { class: 'btn btn-quiet' })

  const panel = el('div', { class: 'overlay' }, [
    el('section', { class: 'shop panel-game' }, [
      el('h2', { class: 'panel-title' }, [TITLES[kind]]),
      el('p', { class: 'shop-greeting' }, [GREETINGS[kind]]),
      // Up here with the greeting, not under the list. The village shelf is
      // long enough that a reply printed at the bottom lands well off the
      // screen from the button that caused it.
      note,
      el('div', { class: 'shop-purse' }, [spriteCanvas('rupee', 3), rupeeLine]),
      list,
      el('div', { class: 'gate-actions' }, [closeButton]),
    ]),
  ])

  root.append(panel)
  render()
  window.setTimeout(() => (list.querySelector('button:not(:disabled)') as HTMLElement | null)?.focus(), 60)

  function owned(id: ItemId): number {
    return save.inventory[id] ?? 0
  }

  function render(): void {
    clear(list)
    rupeeLine.textContent = String(save.player.rupees).padStart(4, '0')

    for (const id of stock) {
      const item = ITEMS[id]
      if (!item?.price) continue
      list.append(renderRow(item))
    }
  }

  function renderRow(item: ItemDef): HTMLElement {
    const already = owned(item.id)
    const isStackable = item.stackable === true
    const alreadyHave = already > 0 && !isStackable

    const gate = item.gate ? gateById(item.gate) : undefined
    const gateOpen = !gate || save.world.openedGates.includes(gate.id)
    const missingRequirement = item.requires && owned(item.requires) === 0
    const price = item.price ?? 0
    const affordable = save.player.rupees >= price

    const status = alreadyHave
      ? 'Owned'
      : missingRequirement
        ? `Needs the ${ITEMS[item.requires as ItemId].name}`
        : !gateOpen
          ? 'The shopkeeper wants to see you spell first'
          : !affordable
            ? `${price - save.player.rupees} rupees short`
            : ''

    // A missing prerequisite is a different kind of "no" from a spelling
    // challenge, and the button should not promise one when it means the other.
    const label = alreadyHave
      ? 'Owned'
      : missingRequirement
        ? 'Locked'
        : !gateOpen
          ? 'Prove it'
          : 'Buy'

    const action = button(
      label,
      () => {
        if (alreadyHave) return
        if (!gateOpen && gate) {
          close()
          options.onGateRequest(gate)
          return
        }
        buy(item)
      },
      { class: alreadyHave ? 'btn btn-quiet' : 'btn btn-primary' },
    )
    action.disabled = alreadyHave || Boolean(missingRequirement) || (gateOpen && !affordable)

    const row = el('div', { class: 'shop-row' }, [
      el('div', { class: 'shop-icon' }, [itemIcon(item.id, 2)]),
      el('div', { class: 'shop-item' }, [
        el('span', { class: 'shop-name' }, [
          item.name + (isStackable && already > 0 ? ` x${already}` : ''),
        ]),
        el('span', { class: 'shop-desc' }, [item.description]),
        ...(status ? [el('span', { class: 'shop-status' }, [status])] : []),
      ]),
      el('span', { class: 'shop-price' }, [
        ...(alreadyHave ? [] : [spriteCanvas('rupee', 2)]),
        alreadyHave ? 'OWNED' : String(price).padStart(3, '0'),
      ]),
      action,
    ])
    if (alreadyHave) row.classList.add('is-owned')
    else if (!gateOpen) row.classList.add('is-locked')
    else if (!affordable || missingRequirement) row.classList.add('is-dear')
    return row
  }

  function buy(item: ItemDef): void {
    const price = item.price ?? 0
    if (save.player.rupees < price) return

    save.player.rupees -= price
    // Arrows and bait come in bundles; everything else you either have or not.
    const bundle = item.id === 'arrows' ? 30 : 1
    save.inventory[item.id] = (save.inventory[item.id] ?? 0) + bundle

    sfx.play('rupee')
    note.textContent = patter(item, save)
    options.onPurchase()
    render()
  }

  function close(): void {
    panel.remove()
  }

  return { close, refresh: render }
}
