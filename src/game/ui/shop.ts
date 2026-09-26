/**
 * The shop.
 *
 * Rupees from monsters cover consumables. The gear that changes how the game
 * plays costs more than wandering can earn, and the best pieces need a spelling
 * challenge before the shopkeeper will sell at all.
 */
import { button, clear, el } from '../../spelling/ui/dom'
import {
  CASTAWAY_SHOP,
  ITEMS,
  SECRET_SHOP,
  VILLAGE_SHOP,
  itemDescription,
  itemGate,
  itemName,
  type ItemDef,
  type ItemId,
  NEWSSTAND,
  FLORIST,
  itemPrice,
} from '../items'
import { gateById, type Gate } from '../gates'
import { flavourFor } from '../flavour'
import type { Level, SaveData } from '../../core/save'
import { sfx } from '../../core/audio/sfx'
import { itemIcon, spriteCanvas } from '../render/icons'

export type { ShopKind } from '../world/screens'
import type { ShopKind } from '../world/screens'

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
function patter(item: ItemDef, save: SaveData, level: Level): string {
  if (item.id === 'bomb' && (save.inventory.map ?? 0) === 0) {
    return level === 2
      ? '"PLASMA CHARGES. MIND YOUR TOES. NOTE: A CRACKED BULKHEAD IN THE OBSERVATORY. SOMETHING IS BEHIND IT."'
      : level === 3
        ? '"Firecrackers. Mind your fingers. And the newsstand on Sheridan Square sells a map, if you have not got one."'
        : '"Bombs. Mind your toes. And if you are going north — there is a cracked ' +
          'boulder in the rocks on the forest path. Something is behind it."'
  }
  // The bow is the one thing on the shelf that needs a word of instruction:
  // it is the only weapon that lives in the item slot rather than in his hand.
  if (item.id === 'bow') return flavourFor(level).bowPatter
  if (item.id === 'loveBomb') return '"Aim for the heart. They all have one, somewhere. Press C until it is in your hand, then X."'
  return level === 2 ? `"${itemName(item.id, level).toUpperCase()}. GOOD CHOICE."` : `"${itemName(item.id, level)}. Good choice."`
}

const TITLES: Record<Level, Record<ShopKind, string>> = {
  1: {
    village: 'The Village Shop',
    secret: 'A Hidden Trader',
    smith: 'The Smithy',
    castaway: 'The Castaway',
    pets: 'The Pet Cave',
    florist: 'The Flower Cart',
  },
  2: {
    village: 'Ship Computer — Stores',
    secret: 'Hidden Terminal',
    smith: 'Forge Console',
    castaway: 'Outpost Terminal',
    pets: 'Cyborg Bay Console',
    florist: 'Hydroponics Console',
  },
  3: {
    village: "Ray's Deli & Grocery",
    secret: 'We Buy Gold',
    smith: 'Sheridan Hardware',
    castaway: 'The Newsstand',
    pets: 'The Pet Shop',
    florist: 'Flowers by Rosa',
  },
}

const GREETINGS: Record<Level, Record<ShopKind, string>> = {
  1: {
    village: '"Come in, come in. Rupees on the counter."',
    secret: 'The hooded figure says nothing, and gestures at the shelf.',
    smith: '"I forge blades. Bring me rupees and a steady mind."',
    castaway:
      'He does not look up. "Everyone who comes here needs the same thing, and I am the only one selling it. Three hundred. I am not sorry."',
    // Unused: the pet cave has its own panel, because choosing a friend is not
    // shopping. Here so the tables stay complete rather than optional.
    pets: '"They all want to come with you. Pick the one you like the look of."',
    florist: '"Flowers. Nothing but flowers."',
  },
  2: {
    village: 'SHIP STORES ONLINE. RUPEES ACCEPTED. NO REFUNDS.',
    secret: 'The terminal shows no name, only a list, and waits.',
    smith: 'FORGE CONSOLE ONLINE. WEAPONS PRINTED FOR RUPEES AND A STEADY MIND.',
    castaway:
      'The pilot\'s voice comes out of the speaker. "Everyone who lands here needs the same thing, and I am the only one selling it. Three hundred. I am not sorry."',
    pets: 'SIX CYBORG COMPANIONS ONLINE.',
    florist: 'HYDROPONICS ONLINE. NOTHING FOR SALE.',
  },
  3: {
    village: '"What can I get you? Sandwiches are in the back, and the cat is not for sale."',
    secret: 'The man behind the grille says nothing, and taps the glass twice.',
    smith: '"Hammers, cutters, and things that go bang. Dollars, and a steady mind."',
    castaway: '"Map of the Village, forty dollars. Hot dogs are from the cart, not from me, but I keep a few."',
    pets: '"You again? Same six as ever."',
    florist:
      '"Roses, tulips, and these." Rosa taps a box of pink hearts. "Twelve dollars each. Throw them at the three of them. It is the only thing that works, and I should know — I have thrown a few."',
  },
}

export interface ShopOptions {
  kind: ShopKind
  /** Which world's names and prices to show — the same items either way. */
  level: Level
  save: SaveData
  /** Ask for the barrier challenge that unlocks a gated item. */
  onGateRequest: (gate: Gate) => void
  /** Something was bought; re-equip and save. */
  onPurchase: () => void
  onClose: () => void
}

export function showShop(root: HTMLElement, options: ShopOptions): { close: () => void; refresh: () => void } {
  const { kind, save, level } = options
  const stock =
    kind === 'village' ? VILLAGE_SHOP
    : kind === 'secret' ? SECRET_SHOP
    : kind === 'castaway' ? (level === 3 ? NEWSSTAND : CASTAWAY_SHOP)
    : kind === 'florist' ? FLORIST
    : SMITH_STOCK

  const rupeeLine = el('span', { class: 'shop-rupees' })
  const list = el('div', { class: 'shop-list' })
  const note = el('p', { class: 'shop-note', role: 'status', 'aria-live': 'polite' })

  const closeButton = button(level === 2 ? 'Log off' : 'Leave the shop', () => {
    close()
    options.onClose()
  }, { class: 'btn btn-quiet' })

  const panel = el('div', { class: 'overlay' }, [
    // On the ship it is a computer screen, and it looks like one: the same
    // panel with a monitor bezel and a scanline over it.
    el('section', { class: `shop panel-game${level === 2 ? ' computer' : ''}` }, [
      el('h2', { class: 'panel-title' }, [TITLES[level][kind]]),
      el('p', { class: 'shop-greeting' }, [GREETINGS[level][kind]]),
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
      if (!itemPrice(id, level)) continue
      list.append(renderRow(item))
    }
  }

  function renderRow(item: ItemDef): HTMLElement {
    const already = owned(item.id)
    const isStackable = item.stackable === true
    const alreadyHave = already > 0 && !isStackable

    const gateId = itemGate(item.id, level)
    const gate = gateId ? gateById(gateId) : undefined
    const gateOpen = !gate || save.world.openedGates.includes(gate.id)
    const missingRequirement = item.requires && owned(item.requires) === 0
    const price = itemPrice(item.id, level) ?? 0
    const affordable = save.player.rupees >= price

    const status = alreadyHave
      ? 'Owned'
      : missingRequirement
        ? `Needs the ${itemName(item.requires as ItemId, level)}`
        : !gateOpen
          ? level === 2
            ? 'The computer wants to see you spell first'
            : 'The shopkeeper wants to see you spell first'
          : !affordable
            ? `${price - save.player.rupees} ${flavourFor(level).currency} short`
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
      el('div', { class: 'shop-icon' }, [itemIcon(item.id, 2, level)]),
      el('div', { class: 'shop-item' }, [
        el('span', { class: 'shop-name' }, [
          itemName(item.id, level) + (isStackable && already > 0 ? ` x${already}` : ''),
        ]),
        el('span', { class: 'shop-desc' }, [itemDescription(item.id, level)]),
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
    const price = itemPrice(item.id, level) ?? 0
    if (save.player.rupees < price) return

    save.player.rupees -= price
    // Arrows and bait come in bundles; everything else you either have or not.
    const bundle = item.id === 'arrows' ? 30 : 1
    save.inventory[item.id] = (save.inventory[item.id] ?? 0) + bundle

    sfx.play('rupee')
    note.textContent = patter(item, save, level)
    options.onPurchase()
    render()
  }

  function close(): void {
    panel.remove()
  }

  return { close, refresh: render }
}
