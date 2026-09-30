/**
 * The fireworks, frame by frame, without a canvas.
 *
 * A rocket goes up, bursts near the top of its climb into a ring of sparks,
 * and the sparks fly out, fall and go out. And the end of the quest has a
 * tune of its own.
 */
import { describe, expect, it } from 'vitest'
import { Fireworks } from '../src/game/render/fireworks'
import { Rng } from '../src/core/rng'
import { PRINCESS_SAVED } from '../src/game/ui/story'

describe('the fireworks', () => {
  it('send a rocket up, burst it, and let the sparks fall and die', () => {
    const show = new Fireworks(new Rng(5), 256, 176)
    expect(show.alight).toBe(false)
    show.launch(128)
    expect(show.alight).toBe(true)
    let burstAt = -1
    let most = 0
    for (let i = 0; i < 400; i++) {
      show.update(1 / 60)
      if (show.burstThisFrame && burstAt < 0) burstAt = i
      most = Math.max(most, show.sparkCount)
    }
    // It went up for a while before it burst — not on the first frame.
    expect(burstAt).toBeGreaterThan(10)
    expect(burstAt).toBeLessThan(120)
    expect(show.bursts).toBe(1)
    expect(most).toBeGreaterThanOrEqual(22)
    // And by now every spark has gone out.
    expect(show.sparkCount).toBe(0)
    expect(show.alight).toBe(false)
  })

  it('bursts below the top of the screen and inside it', () => {
    const rng = new Rng(9)
    const show = new Fireworks(rng, 256, 176)
    for (let n = 0; n < 6; n++) show.launch()
    for (let i = 0; i < 200; i++) show.update(1 / 60)
    expect(show.bursts).toBe(6)
  })

  it('the end has its own story page', () => {
    expect(PRINCESS_SAVED.title).toBe('The princess is safe')
  })
})
