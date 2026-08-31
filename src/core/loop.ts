/**
 * Fixed-timestep game loop.
 *
 * Update runs at a steady 60 steps a second whatever the display does, so
 * movement and combat feel identical on every machine; rendering happens once
 * per animation frame.
 */

export const STEP_MS = 1000 / 60

export interface LoopHandlers {
  update: (stepSeconds: number) => void
  render: (alpha: number) => void
}

export class GameLoop {
  private running = false
  private raf = 0
  private lastTime = 0
  private accumulator = 0

  constructor(private readonly handlers: LoopHandlers) {}

  start(): void {
    if (this.running) return
    this.running = true
    this.lastTime = performance.now()
    this.accumulator = 0
    this.raf = requestAnimationFrame(this.frame)
  }

  stop(): void {
    this.running = false
    cancelAnimationFrame(this.raf)
  }

  isRunning(): boolean {
    return this.running
  }

  private frame = (now: number): void => {
    if (!this.running) return
    this.raf = requestAnimationFrame(this.frame)

    // A long pause — an exercise, or a backgrounded tab — must not produce a
    // huge catch-up burst that teleports the player through walls.
    const delta = Math.min(now - this.lastTime, 250)
    this.lastTime = now
    this.accumulator += delta

    let steps = 0
    while (this.accumulator >= STEP_MS && steps < 5) {
      this.handlers.update(STEP_MS / 1000)
      this.accumulator -= STEP_MS
      steps++
    }

    this.handlers.render(this.accumulator / STEP_MS)
  }
}
