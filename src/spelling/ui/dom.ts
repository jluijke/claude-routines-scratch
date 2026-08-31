/**
 * Small DOM helpers. The exercise UI is plain DOM rather than canvas so the
 * child gets real text inputs, real focus handling and real keyboard support.
 */

type Attrs = Record<string, string | number | boolean | undefined>

export function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  attrs: Attrs = {},
  children: (Node | string)[] = [],
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag)
  for (const [key, value] of Object.entries(attrs)) {
    if (value === undefined || value === false) continue
    if (key === 'class') node.className = String(value)
    else if (key === 'text') node.textContent = String(value)
    else if (value === true) node.setAttribute(key, '')
    else node.setAttribute(key, String(value))
  }
  for (const child of children) {
    node.append(typeof child === 'string' ? document.createTextNode(child) : child)
  }
  return node
}

export function button(label: string, onClick: () => void, attrs: Attrs = {}): HTMLButtonElement {
  const node = el('button', { type: 'button', ...attrs }, [label])
  node.addEventListener('click', onClick)
  return node
}

/**
 * A spelling input. Autocorrect and spellcheck are off — the browser must not
 * do the child's work for them.
 */
export function answerInput(placeholder = 'Type the word', attrs: Attrs = {}): HTMLInputElement {
  return el('input', {
    type: 'text',
    class: 'answer',
    placeholder,
    autocomplete: 'off',
    autocorrect: 'off',
    autocapitalize: 'off',
    spellcheck: 'false',
    ...attrs,
  })
}

/** Submits on Enter, which is how a child expects a typing task to work. */
export function onEnter(input: HTMLElement, handler: () => void): void {
  input.addEventListener('keydown', (event) => {
    if ((event as KeyboardEvent).key === 'Enter') {
      event.preventDefault()
      handler()
    }
  })
}

export function clear(node: HTMLElement): void {
  while (node.firstChild) node.firstChild.remove()
}

export function setClass(node: Element, name: string, on: boolean): void {
  node.classList.toggle(name, on)
}

/** Renders a word with some letters replaced by blanks: b _ _ t */
export function maskedWord(word: string, hidden: (index: number) => boolean): HTMLElement {
  return el(
    'span',
    { class: 'masked-word' },
    word.split('').map((letter, i) =>
      el('span', { class: hidden(i) ? 'letter blank' : 'letter' }, [hidden(i) ? '_' : letter]),
    ),
  )
}
