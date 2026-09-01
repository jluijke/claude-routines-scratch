/**
 * The barrier prompt: what the child sees when they walk into a sealed door.
 *
 * It always offers a way out. Being told "you must do an exercise now" with no
 * alternative would turn the spelling into a punishment, which is exactly what
 * the brief warns against.
 */
import { button, el } from '../../spelling/ui/dom'
import type { Gate, GateKind } from '../gates'

/**
 * What the child is being asked to do, in words. "DOOR" told them nothing;
 * naming the task makes each barrier read as its own small quest.
 */
const KIND_LABEL: Record<GateKind, string> = {
  door: 'A way is blocked',
  seal: 'A spell of passage',
  bridge: 'Something needs building',
  boss: 'The chamber beyond',
  npc: 'Someone is in your way',
  chest: 'A sealed chest',
  shop: 'The shopkeeper wants proof',
  wall: 'Something is hidden behind here',
  smith: 'At the forge',
}

export interface PromptOptions {
  gate: Gate
  /** Title of the exercise this barrier will spend, if any. */
  exerciseTitle?: string
  exerciseNumber?: number
  /** Undefined when there is no exercise left to spend — a review challenge. */
  isReview: boolean
  onAccept: () => void
  onDecline: () => void
}

export function showGatePrompt(root: HTMLElement, options: PromptOptions): () => void {
  const { gate } = options

  const heading = options.isReview
    ? options.gate.intro
      ? 'Two quick words'
      : 'A quick challenge'
    : `Exercise ${options.exerciseNumber}: ${options.exerciseTitle}`

  const accept = button(options.isReview ? 'Take the challenge' : 'Open it', () => {
    close()
    options.onAccept()
  }, { class: 'btn btn-primary btn-large' })

  const decline = button('Not right now', () => {
    close()
    options.onDecline()
  }, { class: 'btn btn-quiet' })

  const panel = el('div', { class: 'overlay' }, [
    el('section', { class: 'gate-prompt panel-game' }, [
      el('p', { class: 'gate-kind' }, [KIND_LABEL[gate.kind]]),
      el('p', { class: 'gate-message' }, [gate.message]),
      el('p', { class: 'gate-exercise' }, [heading]),
      ...(rewardLine(gate) ? [el('p', { class: 'gate-reward' }, [rewardLine(gate) as string])] : []),
      el('div', { class: 'gate-actions' }, [decline, accept]),
    ]),
  ])

  root.append(panel)
  window.setTimeout(() => accept.focus(), 60)

  function close(): void {
    panel.remove()
  }
  return close
}

function rewardLine(gate: Gate): string | undefined {
  const parts: string[] = []
  if (gate.reward.rupees) parts.push(`${gate.reward.rupees} rupees`)
  if (gate.reward.hearts) parts.push(`${gate.reward.hearts} hearts restored`)
  if (gate.reward.heartContainer) parts.push('a heart container')
  if (gate.reward.item) parts.push('an item')
  if (parts.length === 0) return undefined
  return `Reward: ${parts.join(' · ')}`
}

/** A plain message box for anything that is not a barrier. */
export function showNotice(root: HTMLElement, text: string, onClose?: () => void): () => void {
  const ok = button('OK', () => {
    close()
    onClose?.()
  }, { class: 'btn btn-primary' })

  const panel = el('div', { class: 'overlay' }, [
    el('section', { class: 'gate-prompt panel-game' }, [
      el('p', { class: 'gate-message' }, [text]),
      el('div', { class: 'gate-actions' }, [ok]),
    ]),
  ])
  root.append(panel)
  window.setTimeout(() => ok.focus(), 50)

  function close(): void {
    panel.remove()
  }
  return close
}
