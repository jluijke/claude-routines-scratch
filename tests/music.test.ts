import { describe, expect, it } from 'vitest'
import { noteLengths, noteToFrequency } from '../src/core/audio/music'

describe('note names', () => {
  it('puts concert A where it belongs', () => {
    expect(noteToFrequency('A4')).toBeCloseTo(440, 5)
  })

  it('doubles an octave up and halves an octave down', () => {
    expect(noteToFrequency('A5')).toBeCloseTo(880, 5)
    expect(noteToFrequency('A3')).toBeCloseTo(220, 5)
  })

  it('reads sharps', () => {
    expect(noteToFrequency('C#4')).toBeCloseTo(277.18, 1)
    expect(noteToFrequency('F#5')).toBeCloseTo(739.99, 1)
  })

  it('ignores anything it cannot read rather than making a noise', () => {
    expect(noteToFrequency('H4')).toBe(0)
    expect(noteToFrequency('')).toBe(0)
  })
})

describe('note lengths', () => {
  it('holds a note across every following dash', () => {
    expect(noteLengths(['C4', '-', '-', '.', 'E4'])).toEqual([
      { at: 0, note: 'C4', steps: 3 },
      { at: 4, note: 'E4', steps: 1 },
    ])
  })

  it('treats a lone note as one step', () => {
    expect(noteLengths(['C4', 'D4'])).toEqual([
      { at: 0, note: 'C4', steps: 1 },
      { at: 1, note: 'D4', steps: 1 },
    ])
  })

  it('produces nothing from silence', () => {
    expect(noteLengths(['.', '.', '.'])).toEqual([])
  })
})
