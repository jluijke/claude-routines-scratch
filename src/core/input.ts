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
  confirm: boolean
  pause: boolean
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

const ATTACK_KEYS = new Set([' ', 'z', 'Z', 'Enter', '0', 'Control'])
const ITEM_KEYS = new Set(['x', 'X', 'Shift', '5'])
const PAUSE_KEYS = new Set(['Escape', 'p', 'P'])

export class Input {
  private readonly held = new Set<string>()
  private attackEdge = false
  private itemEdge = false
  private pauseEdge = false
  private target: { x: number; y: number } | undefined
  private pointerHeld = false

  /** Set while an exercise or menu owns the keyboard. */
  private suspended = false

  constructor(
    private readonly canvas: HTMLCanvasElement,
    /** Converts a client point into world pixels. */
    private readonly toWorld: (clientX: number, clientY: number) => { x: number; y: number },
  ) {
    window.addEventListener('keydown', this.onKeyDown)
    window.addEventListener('keyup', this.onKeyUp)
    window.addEventListener('blur', () => this.held.clear())

    canvas.addEventListener('pointerdown', this.onPointerDown)
    canvas.addEventListener('pointermove', this.onPointerMove)
    window.addEventListener('pointerup', this.onPointerUp)
    canvas.addEventListener('contextmenu', (e) => e.preventDefault())
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

    if (MOVE_KEYS[event.key] || ATTACK_KEYS.has(event.key) || ITEM_KEYS.has(event.key) || PAUSE_KEYS.has(event.key)) {
      event.preventDefault()
    }
    if (this.held.has(event.key)) return
    this.held.add(event.key)

    if (ATTACK_KEYS.has(event.key)) this.attackEdge = true
    if (ITEM_KEYS.has(event.key)) this.itemEdge = true
    if (PAUSE_KEYS.has(event.key)) this.pauseEdge = true
  }

  private onKeyUp = (event: KeyboardEvent): void => {
    this.held.delete(event.key)
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
      confirm: this.held.has('Enter'),
      pause: this.pauseEdge,
      ...(this.target ? { moveTarget: this.target } : {}),
    }

    this.attackEdge = false
    this.itemEdge = false
    this.pauseEdge = false
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
    actions.append(makeButton('B', 'x', 'pad action item'), makeButton('A', 'z', 'pad action attack'))

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
    }
  }

  releaseVirtual(key: string): void {
    this.held.delete(key)
  }
}
