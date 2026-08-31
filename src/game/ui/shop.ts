/**
 * The shop.
 *
 * Rupees from monsters cover consumables. The gear that changes how the game
 * plays costs more than wandering can earn, and the best pieces need a spelling
 * challenge before the shopkeeper will sell at all.
 */
import { button, clear, el } from '../../spelling/ui/dom'
import { ITEMS, SECRET_SHOP, VILLAGE_SHOP, type ItemDef, type ItemId } from '../items'
import { gateById, type Gate } from '../gates'
import type { SaveData } from '../../core/save'
import { sfx } from '../../core/audio/sfx'

export type ShopKind = 'village' | 'secret' | 'smith'

const SMITH_STOCK: ItemId[] = ['metalSword', 'bronzeSword', 'goldenSword']

const TITLES: Record<ShopKind, string> = {
  village: 'The Village Shop',
  secret: 'A Hidden Trader',
  smith: 'The Smithy',
}

const GREETINGS: Record<ShopKind, string> = {
  village: '"Come in, come in. Rupees on the counter."',
  secret: 'The hooded figure says nothing, and gestures at the shelf.',
  smith: '"I forge blades. Bring me rupees and a steady mind."',
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
  const stock = kind === 'village' ? VILLAGE_SHOP : kind === 'secret' ? SECRET_SHOP : SMITH_STOCK

  const rupeeLine = el('p', { class: 'shop-rupees' })
  const list = el('div', { class: 'shop-list' })
  const note = el('p', { class: 'shop-note', role: 'status', 'aria-live': 'polite' })

  const closeButton = button('Leave the shop', () => {
    close()
    options.onClose()
  }, { class: 'btn btn-quiet' })

  const panel = el('div', { class: 'overlay' }, [
    el('section', { class: 'shop' }, [
      el('h2', { class: 'shop-title' }, [TITLES[kind]]),
      el('p', { class: 'shop-greeting' }, [GREETINGS[kind]]),
      rupeeLine,
      list,
      note,
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
    rupeeLine.textContent = `You have ${save.player.rupees} rupees.`

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
            : `${price} rupees`

    const action = button(
      alreadyHave ? 'Owned' : !gateOpen ? 'Prove it' : 'Buy',
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

    return el('div', { class: 'shop-row' }, [
      el('div', { class: 'shop-item' }, [
        el('strong', {}, [item.name + (isStackable && already > 0 ? ` (${already})` : '')]),
        el('span', { class: 'shop-desc' }, [item.description]),
      ]),
      el('span', { class: 'shop-price' }, [status]),
      action,
    ])
  }

  function buy(item: ItemDef): void {
    const price = item.price ?? 0
    if (save.player.rupees < price) return

    save.player.rupees -= price
    // Arrows and bait come in bundles; everything else you either have or not.
    const bundle = item.id === 'arrows' ? 30 : 1
    save.inventory[item.id] = (save.inventory[item.id] ?? 0) + bundle

    sfx.play('rupee')
    note.textContent = `"${item.name}. Good choice."`
    options.onPurchase()
    render()
  }

  function close(): void {
    panel.remove()
  }

  return { close, refresh: render }
}
