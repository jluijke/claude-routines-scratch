/**
 * The sign that goes up when he finds something on the ground.
 *
 * The canvas has already done the wordless half — he holds the thing over his
 * head with light coming off it — and holds that pose underneath this. There
 * are only three of these in the whole game: the sword he starts with, the
 * candle on the island, and the map behind the boulder. Each one is a small
 * turning point, and each used to go by as a line in the message bar.
 */
import { button, el } from '../../spelling/ui/dom'
import { ITEMS, type ItemId } from '../items'
import { itemIcon } from '../render/icons'

export interface DiscoveryOptions {
  item: ItemId
  /** What the world said about finding it, in its own words. */
  message: string
  onContinue: () => void
}

export function showDiscovery(root: HTMLElement, options: DiscoveryOptions): () => void {
  const item = ITEMS[options.item]

  const onward = button('Take it →', () => {
    close()
    options.onContinue()
  }, { class: 'btn btn-primary btn-large' })

  const panel = el('div', { class: 'overlay overlay-found' }, [
    el('section', { class: 'panel-game found-panel' }, [
      el('p', { class: 'found-banner' }, ['You found']),
      el('div', { class: 'found-icon' }, [itemIcon(options.item, 5)]),
      el('h2', { class: 'found-title' }, [item.name]),
      el('p', { class: 'found-story' }, [options.message]),
      el('p', { class: 'found-what' }, [item.description]),
      el('div', { class: 'gate-actions' }, [onward]),
    ]),
  ])

  root.append(panel)
  window.setTimeout(() => onward.focus(), 60)

  function close(): void {
    panel.remove()
  }
  return close
}
