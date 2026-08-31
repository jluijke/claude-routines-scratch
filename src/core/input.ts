/**
 * One input state, three ways to produce it: keyboard, mouse/trackpad, and
 * touch. The brief asks for keypad *or* mouse, so neither is a second-class
 * citizen — every action is reachable both ways.
 */

export interface InputState {
  /** Movement direction, already normalised. */
  dx: number
  dy: number
  attack: boolean
  useItem: boolean
  /** Step to the next item in the B slot. */
  cycleItem: boolean
  confirm: boolean
  /** Show the controls, and pause while they are up. */
  help: boolean
  /** Where the player last clicked, in world pixels, or undefined. */
  moveTarget?: { x: number; y: number }
}

const MOVE_KEYS: Record<string, [number, number]> = {
  ArrowUp: [0, -1], ArrowDown: [0, 1], ArrowLeft: [-1, 0], ArrowRight: [1, 0],
  w: [0, -1], s: [0, 1], a: [-1, 0], d: [1, 0],
  W: [0, -1], S: [0, 1], A: [-1, 0], D: [1, 0],
  // Numeric keypad, including the diagonals.
  '8': [0, -1], '2': [0, 1], '4': [-1, 0], '6': [1, 0],
  '7': [-1, -1], '9': [1, -1], '1': [-1, 1], '3': [1, 1],
}

// Control used to swing the sword, which made it useless as a "what are the
// controls?" key. Space, Z, Enter and the keypad zero still do.
const ATTACK_KEYS = new Set([' ', 'z', 'Z', 'Enter', '0'])
const ITEM_KEYS = new Set(['x', 'X', 'Shift', '5'])
const CYCLE_KEYS = new Set(['c', 'C', 'Tab', '.'])
const HELP_KEYS = new Set(['Escape', 'p', 'P', 'h', 'H', '?'])

/**
 * The bindings, in the order they are worth learning. The help panel reads
 * this, so the list a child sees cannot drift away from what the keys do.
 */
export const BINDINGS: { keys: string[]; what: string; group: 'Moving' | 'Doing' | 'The rest' }[] = [
  { group: 'Moving', keys: ['↑', '↓', '←', '→'], what: 'Walk' },
  { group: 'Moving', keys: ['W', 'A', 'S', 'D'], what: 'Walk, the other way round' },
  { group: 'Moving', keys: ['8', '4', '2', '6'], what: 'Walk with the number pad — 7 9 1 3 go diagonally' },
  { group: 'Doing', keys: ['Space', 'Z'], what: 'Swing your sword' },
  { group: 'Doing', keys: ['X'], what: 'Use the item in the B slot' },
  { group: 'Doing', keys: ['C', 'Tab'], what: 'Swap to your next item' },
  { group: 'The rest', keys: ['Ctrl', 'Esc'], what: 'This list, and pause the game' },
  { group: 'The rest', keys: ['M'], what: 'Music on and off' },
  { group: 'The rest', keys: ['Esc'], what: 'In an exercise: leave it for now' },
]

export class Input {
  private readonly held = new Set<string>()
  private attackEdge = false
  private itemEdge = false
  private helpEdge = false
  private cycleEdge = false
  private target: { x: number; y: number } | undefined
  private pointerHeld = false
  /**
   * Control opens the help panel, but only when it is *tapped*. Held down as a
   * modifier it belongs to whatever it is modifying — Ctrl+Shift+P opens the
   * parent dashboard, and should not flash the controls list on the way.
   */
  private controlTainted = false

  /** Set while an exercise or menu owns the keyboard. */
  private suspended = false

  constructor(
    private readonly canvas: HTMLCanvasElement,
    /** Converts a client point into world pixels. */
    private readonly toWorld: (clientX: number, clientY: number) => { x: number; y: number },
  ) {
    window.addEventListener('keydown', this.onKeyDown)
    window.addEventListener('keyup', this.onKeyUp)
    window.addEventListener('blur', this.onBlur)

    canvas.addEventListener('pointerdown', this.onPointerDown)
    canvas.addEventListener('pointermove', this.onPointerMove)
    window.addEventListener('pointerup', this.onPointerUp)
    canvas.addEventListener('contextmenu', this.onContextMenu)
  }

  /**
   * Every exercise destroys the world and builds a new one. Without this, each
   * round trip left another set of window listeners behind.
   */
  destroy(): void {
    window.removeEventListener('keydown', this.onKeyDown)
    window.removeEventListener('keyup', this.onKeyUp)
    window.removeEventListener('blur', this.onBlur)
    window.removeEventListener('pointerup', this.onPointerUp)
    this.canvas.removeEventListener('pointerdown', this.onPointerDown)
    this.canvas.removeEventListener('pointermove', this.onPointerMove)
    this.canvas.removeEventListener('contextmenu', this.onContextMenu)
  }

  private onBlur = (): void => {
    this.held.clear()
  }

  private onContextMenu = (event: Event): void => {
    event.preventDefault()
  }

  suspend(): void {
    this.suspended = true
    this.held.clear()
    this.target = undefined
    this.pointerHeld = false
  }

  resume(): void {
    this.suspended = false
  }

  private onKeyDown = (event: KeyboardEvent): void => {
    if (this.suspended) return
    // Never swallow keys the browser or a form field needs.
    if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) return

    if (
      MOVE_KEYS[event.key] ||
      ATTACK_KEYS.has(event.key) ||
      ITEM_KEYS.has(event.key) ||
      CYCLE_KEYS.has(event.key) ||
      HELP_KEYS.has(event.key)
    ) {
      event.preventDefault()
    }

    // Anything pressed while Control is down makes it a modifier, not a tap.
    if (event.key !== 'Control' && this.held.has('Control')) this.controlTainted = true
    if (event.key === 'Control') this.controlTainted = event.shiftKey || event.altKey || event.metaKey

    if (this.held.has(event.key)) return
    this.held.add(event.key)

    if (ATTACK_KEYS.has(event.key)) this.attackEdge = true
    if (ITEM_KEYS.has(event.key)) this.itemEdge = true
    if (HELP_KEYS.has(event.key)) this.helpEdge = true
    if (CYCLE_KEYS.has(event.key)) this.cycleEdge = true
  }

  private onKeyUp = (event: KeyboardEvent): void => {
    this.held.delete(event.key)
    if (event.key === 'Control' && !this.controlTainted && !this.suspended) this.helpEdge = true
  }

  private onPointerDown = (event: PointerEvent): void => {
    if (this.suspended) return
    this.canvas.setPointerCapture?.(event.pointerId)
    this.pointerHeld = true
    if (event.button === 2) {
      this.attackEdge = true
      return
    }
    this.target = this.toWorld(event.clientX, event.clientY)
  }

  private onPointerMove = (event: PointerEvent): void => {
    if (this.suspended || !this.pointerHeld) return
    this.target = this.toWorld(event.clientX, event.clientY)
  }

  private onPointerUp = (): void => {
    this.pointerHeld = false
  }

  /** True while the pointer is down, so click-and-hold keeps walking. */
  isPointerHeld(): boolean {
    return this.pointerHeld
  }

  /** Reads and clears the one-shot actions. */
  read(): InputState {
    let dx = 0
    let dy = 0
    for (const key of this.held) {
      const move = MOVE_KEYS[key]
      if (!move) continue
      dx += move[0]
      dy += move[1]
    }
    const length = Math.hypot(dx, dy)
    if (length > 0) {
      dx /= length
      dy /= length
    }

    const state: InputState = {
      dx,
      dy,
      attack: this.attackEdge,
      useItem: this.itemEdge,
      cycleItem: this.cycleEdge,
      confirm: this.held.has('Enter'),
      help: this.helpEdge,
      ...(this.target ? { moveTarget: this.target } : {}),
    }

    this.attackEdge = false
    this.itemEdge = false
    this.helpEdge = false
    this.cycleEdge = false
    return state
  }

  clearTarget(): void {
    this.target = undefined
  }

  /** A virtual pad for touch devices, added to the DOM beside the canvas. */
  static buildTouchControls(
    container: HTMLElement,
    handlers: { press: (key: string) => void; release: (key: string) => void },
  ): HTMLElement {
    const pad = document.createElement('div')
    pad.className = 'touch-controls'

    const makeButton = (label: string, key: string, className: string): HTMLElement => {
      const node = document.createElement('button')
      node.type = 'button'
      node.className = className
      node.textContent = label
      node.addEventListener('pointerdown', (e) => {
        e.preventDefault()
        handlers.press(key)
      })
      node.addEventListener('pointerup', () => handlers.release(key))
      node.addEventListener('pointerleave', () => handlers.release(key))
      node.addEventListener('pointercancel', () => handlers.release(key))
      return node
    }

    const dpad = document.createElement('div')
    dpad.className = 'dpad'
    dpad.append(
      makeButton('▲', 'ArrowUp', 'pad up'),
      makeButton('◀', 'ArrowLeft', 'pad left'),
      makeButton('▶', 'ArrowRight', 'pad right'),
      makeButton('▼', 'ArrowDown', 'pad down'),
    )

    const actions = document.createElement('div')
    actions.className = 'action-buttons'
    actions.append(
      makeButton('?', 'Escape', 'pad help'),
      makeButton('↻', 'c', 'pad cycle'),
      makeButton('B', 'x', 'pad action item'),
      makeButton('A', 'z', 'pad action attack'),
    )

    pad.append(dpad, actions)
    container.append(pad)
    return pad
  }

  /** Lets the touch pad drive the same key set the keyboard uses. */
  pressVirtual(key: string): void {
    if (this.suspended) return
    if (!this.held.has(key)) {
      this.held.add(key)
      if (ATTACK_KEYS.has(key)) this.attackEdge = true
      if (ITEM_KEYS.has(key)) this.itemEdge = true
      if (CYCLE_KEYS.has(key)) this.cycleEdge = true
    }
  }

  releaseVirtual(key: string): void {
    this.held.delete(key)
  }
}
