import { describe, expect, it } from 'vitest'
import {
  SilentSpeechEngine,
  SLOW_SENTENCE_RATE,
  SLOW_WORD_RATE,
  speakWord,
  speakWordSlowly,
} from '../src/core/audio/speech'

describe('speaking a word', () => {
  it('ends the word with a stop so the last sound is not clipped', () => {
    const engine = new SilentSpeechEngine()
    speakWord(engine, 'cat')
    // "cat" and "cap" differ only in the sound a voice tends to swallow.
    expect(engine.spoken).toEqual(['cat.'])
  })

  it('applies the pronunciation fixes', () => {
    const engine = new SilentSpeechEngine()
    speakWord(engine, 'read')
    expect(engine.spoken).toEqual(['reed.'])
  })

  it('says a word twice on the slow replay, the way a teacher would', () => {
    const engine = new SilentSpeechEngine()
    speakWordSlowly(engine, 'rabbit')
    expect(engine.spoken).toEqual(['rabbit.', 'rabbit.'])
  })

  it('keeps the slow rates well below normal speech', () => {
    expect(SLOW_WORD_RATE).toBeLessThan(0.6)
    // Sentences are given a little more speed; below this they turn to mud.
    expect(SLOW_SENTENCE_RATE).toBeGreaterThan(SLOW_WORD_RATE)
    expect(SLOW_SENTENCE_RATE).toBeLessThan(0.7)
  })

  it('speaks a sequence in order, and reports when it is done', () => {
    const engine = new SilentSpeechEngine()
    let finished = false
    engine.speakSequence(['rab.', 'bit.'], { onEnd: () => (finished = true) })
    expect(engine.spoken).toEqual(['rab.', 'bit.'])
    expect(finished).toBe(true)
  })
})
