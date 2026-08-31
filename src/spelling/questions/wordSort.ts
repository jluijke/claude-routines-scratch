import type { Response, WordSortQuestion } from '../types'
import { el } from '../ui/dom'
import type { QuestionView, RenderContext } from './index'

/**
 * Sort words into columns. Works three ways so it never depends on a mouse:
 * drag a word, or click a word then click a column, or use the arrow keys.
 */
export function renderWordSort(ctx: RenderContext): QuestionView {
  const question = ctx.question as WordSortQuestion
  const labels = question.groups.map((g) => g.label)
  const allWords = question.groups.flatMap((g) => g.words)

  const placement: Record<string, string> = {}
  let selected: string | undefined

  const chips = new Map<string, HTMLElement>()
  const columnBodies = new Map<string, HTMLElement>()

  const pool = el('div', { class: 'sort-pool' })

  function moveTo(word: string, label: string | undefined): void {
    const chip = chips.get(word)
    if (!chip) return
    if (label) {
      placement[word] = label
      columnBodies.get(label)?.append(chip)
    } else {
      delete placement[word]
      pool.append(chip)
    }
    chip.classList.remove('selected')
    selected = undefined
    ctx.changed()
  }

  for (const word of allWords) {
    const chip = el('button', { type: 'button', class: 'chip', draggable: 'true', 'data-word': word }, [word])
    chip.addEventListener('click', () => {
      if (selected === word) {
        chip.classList.remove('selected')
        selected = undefined
        return
      }
      for (const other of chips.values()) other.classList.remove('selected')
      selected = word
      chip.classList.add('selected')
    })
    chip.addEventListener('dragstart', (event) => {
      ;(event as DragEvent).dataTransfer?.setData('text/plain', word)
      selected = word
    })
    // Keyboard: pick a chip, then press 1-4 to drop it into a column.
    chip.addEventListener('keydown', (event) => {
      const key = (event as KeyboardEvent).key
      const index = Number.parseInt(key, 10)
      if (!Number.isNaN(index) && index >= 1 && index <= labels.length) {
        event.preventDefault()
        moveTo(word, labels[index - 1])
      } else if (key === 'Backspace' || key === 'Delete') {
        event.preventDefault()
        moveTo(word, undefined)
      }
    })
    chips.set(word, chip)
    pool.append(chip)
  }

  const columns = question.groups.map((group, index) => {
    const body = el('div', { class: 'sort-drop' })
    columnBodies.set(group.label, body)

    const column = el('div', { class: 'sort-column', 'data-label': group.label }, [
      el('div', { class: 'sort-heading' }, [
        el('span', { class: 'sort-key' }, [String(index + 1)]),
        group.label,
      ]),
      body,
    ])

    column.addEventListener('click', () => {
      if (selected) moveTo(selected, group.label)
    })
    column.addEventListener('dragover', (event) => {
      event.preventDefault()
      column.classList.add('over')
    })
    column.addEventListener('dragleave', () => column.classList.remove('over'))
    column.addEventListener('drop', (event) => {
      event.preventDefault()
      column.classList.remove('over')
      const word = (event as DragEvent).dataTransfer?.getData('text/plain')
      if (word) moveTo(word, group.label)
    })
    return column
  })

  const element = el('div', { class: 'q q-sort' }, [
    el('div', { class: 'sort-columns' }, columns),
    el('p', { class: 'q-hint-line' }, [
      'Drag a word, or click a word then click its group. On a keyboard: Tab to a word and press its group number.',
    ]),
    pool,
  ])

  return {
    element,
    focus: () => chips.values().next().value?.focus(),
    read: (): Response => ({ kind: 'assign', value: { ...placement } }),
    showResult: (result) => {
      element.classList.toggle('wrong', !result.correct)
      if (!result.parts) return
      const entries = question.groups.flatMap((g) => g.words.map((w) => w))
      entries.forEach((word, i) => {
        const chip = chips.get(word)
        if (!chip) return
        // Only mark a word wrong once the child has actually placed it.
        const placed = placement[word] !== undefined
        chip.classList.toggle('chip-wrong', placed && result.parts?.[i] === false)
      })
    },
    reset: () => {
      element.classList.remove('wrong')
      for (const chip of chips.values()) chip.classList.remove('chip-wrong')
    },
  }
}
