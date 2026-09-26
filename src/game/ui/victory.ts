/**
 * The sign that goes up when a dungeon guardian falls.
 *
 * The canvas has already done the wordless half — the room flashing white, the
 * sword going up, the light turning off the blade — and it holds that pose
 * underneath this. So everything here is words, big enough to read from across
 * the room, over a gold wash rather than the usual near-black one: winning
 * should not look like another dialog box.
 */
import type { Level } from '../../core/save'
import { button, el } from '../../spelling/ui/dom'

export interface VictoryOptions {
  /** Which dungeon this was, 1 upwards. */
  level: number
  /** The dungeon's name — "Sunken Hall", and so on. */
  dungeonName: string
  /** How many guardians are down now, and out of how many. */
  defeated: number
  total: number
  /** Which world this happened in. The last guardian of each means something different. */
  world: Level
  onContinue: () => void
}

export function showBossVictory(root: HTMLElement, options: VictoryOptions): () => void {
  const { level, dungeonName, defeated, total, world } = options
  const allDone = defeated >= total
  const left = total - defeated
  const guardian = world === 2 ? 'mech' : 'dungeon boss'

  const onward = button(
    allDone ? (world === 2 ? 'Finish the quest →' : 'On to the next world →') : 'Onward →',
    () => {
      close()
      options.onContinue()
    },
    { class: 'btn btn-primary btn-large' },
  )

  // One marker per dungeon, so "two of four" is something he can see rather
  // than something he has to read.
  const crests = el(
    'ul',
    { class: 'victory-crowns' },
    Array.from({ length: total }, (_, i) =>
      el(
        'li',
        {
          class: [i < defeated ? 'won' : '', i === defeated - 1 ? 'just-won' : '']
            .filter(Boolean)
            .join(' '),
        },
        [String(i + 1)],
      ),
    ),
  )

  const panel = el('div', { class: 'overlay overlay-victory' }, [
    el('section', { class: `panel-game victory-panel${allDone ? ' final' : ''}` }, [
      el('p', { class: 'victory-banner' }, [allDone ? (world === 2 ? 'The future is saved' : world === 3 ? 'The city is saved' : 'Level 1 complete') : 'Victory']),
      el('h2', { class: 'victory-title' }, [
        world === 2 ? `Rock ${level} Cleared` : world === 3 ? `Guardian ${level} Loved` : `Quest Level ${level} Completed`,
      ]),
      el('p', { class: 'victory-room' }, [`${dungeonName} cleared`]),
      crests,
      el('p', { class: 'victory-progress' }, [
        allDone
          ? world === 2
            ? `You have defeated all ${total} mechs. The ship is yours, and the future is safe!`
            : `You have defeated all ${total} dungeon bosses. The way to the next world is open!`
          : `You defeated the ${guardian}. Defeat all ${total} to ${world === 2 ? 'free the ship' : 'reach the next world'} — ` +
            `${left} to go!`,
      ]),
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
