import { describe, expect, it } from 'vitest'
import {
  creditSeconds,
  describe as summarise,
  dropMultiplier,
  MAX_SITTING_SECONDS,
  opensFreely,
  ratio,
  verdict,
} from '../src/game/pacing'

describe('pacing governor', () => {
  it('holds off judging until there is enough play to judge', () => {
    expect(verdict({ playSeconds: 100, exerciseSeconds: 0 })).toBe('balanced')
  })

  it('spots play running ahead of spelling', () => {
    expect(verdict({ playSeconds: 900, exerciseSeconds: 300 })).toBe('play-ahead')
  })

  it('spots spelling running ahead of play', () => {
    expect(verdict({ playSeconds: 300, exerciseSeconds: 900 })).toBe('spelling-ahead')
  })

  it('treats a genuine 50/50 split as balanced', () => {
    expect(verdict({ playSeconds: 600, exerciseSeconds: 600 })).toBe('balanced')
    expect(ratio({ playSeconds: 600, exerciseSeconds: 600 })).toBe(0.5)
  })

  it('thins rupees when play is ahead and is generous when spelling is', () => {
    expect(dropMultiplier({ playSeconds: 900, exerciseSeconds: 300 })).toBeLessThan(1)
    expect(dropMultiplier({ playSeconds: 300, exerciseSeconds: 900 })).toBeGreaterThan(1)
    expect(dropMultiplier({ playSeconds: 600, exerciseSeconds: 600 })).toBe(1)
  })

  it('opens optional barriers free only when spelling is ahead', () => {
    expect(opensFreely({ playSeconds: 300, exerciseSeconds: 900 })).toBe(true)
    expect(opensFreely({ playSeconds: 900, exerciseSeconds: 300 })).toBe(false)
  })

  it('summarises the split in minutes for the parent view', () => {
    expect(summarise({ playSeconds: 600, exerciseSeconds: 600 })).toContain('50% play')
  })

  it('credits a normal sitting in full', () => {
    expect(creditSeconds(480)).toBe(480)
    expect(creditSeconds(MAX_SITTING_SECONDS)).toBe(MAX_SITTING_SECONDS)
  })

  it('refuses to credit a tab left open over lunch', () => {
    expect(creditSeconds(3600)).toBe(MAX_SITTING_SECONDS)

    // The whole point of the clamp: fifteen minutes of play against an hour of
    // "spelling" reads as spelling-ahead, which opens optional barriers for
    // free. Against the credited twenty minutes it is simply balanced.
    expect(opensFreely({ playSeconds: 900, exerciseSeconds: 3600 })).toBe(true)
    expect(opensFreely({ playSeconds: 900, exerciseSeconds: creditSeconds(3600) })).toBe(false)
  })

  it('ignores nonsense clocks', () => {
    expect(creditSeconds(-5)).toBe(0)
    expect(creditSeconds(Number.NaN)).toBe(0)
  })
})
