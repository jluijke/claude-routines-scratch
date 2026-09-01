import { describe, expect, it } from 'vitest'
import {
  bestVoice,
  isNoveltyVoice,
  scoreVoice,
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


/**
 * What Chrome on macOS actually hands you, in roughly the order it hands it
 * over: Apple's novelty voices come first, in every English locale including
 * Australian, and the clear Google network voices are further down and British.
 *
 * The old rule was "first voice tagged en-AU", which picked Grandma.
 */
const CHROME_ON_MAC = [
  { name: 'Eddy (Australian English)', lang: 'en-AU', localService: true },
  { name: 'Flo (Australian English)', lang: 'en-AU', localService: true },
  { name: 'Grandma (Australian English)', lang: 'en-AU', localService: true },
  { name: 'Grandpa (Australian English)', lang: 'en-AU', localService: true },
  { name: 'Rocko (Australian English)', lang: 'en-AU', localService: true },
  { name: 'Karen', lang: 'en-AU', localService: true },
  { name: 'Daniel', lang: 'en-GB', localService: true },
  { name: 'Samantha', lang: 'en-US', localService: true },
  { name: 'Zarvox', lang: 'en-US', localService: true },
  { name: 'Google UK English Female', lang: 'en-GB', localService: false },
  { name: 'Google UK English Male', lang: 'en-GB', localService: false },
  { name: 'Google US English', lang: 'en-US', localService: false },
  { name: 'Google Deutsch', lang: 'de-DE', localService: false },
]

describe('choosing a voice', () => {
  it('never picks a joke voice, whatever its accent', () => {
    for (const voice of CHROME_ON_MAC.filter((v) => isNoveltyVoice(v.name))) {
      expect(scoreVoice(voice)).toBeLessThan(0)
    }
    expect(isNoveltyVoice('Grandma (Australian English)')).toBe(true)
    expect(isNoveltyVoice('Karen')).toBe(false)
    // A real name that merely contains a joke word is still a real voice.
    expect(isNoveltyVoice('Alexandra')).toBe(false)
  })

  it('picks the clearest voice on Chrome for Mac, not the first Australian one', () => {
    const picked = bestVoice(CHROME_ON_MAC)
    expect(picked?.name).toBe('Google UK English Female')
  })

  it('prefers a clear British voice over a robotic Australian one', () => {
    const google = CHROME_ON_MAC.find((v) => v.name === 'Google UK English Female')!
    const karen = CHROME_ON_MAC.find((v) => v.name === 'Karen')!
    expect(scoreVoice(google)).toBeGreaterThan(scoreVoice(karen))
  })

  it('still prefers Australian between two otherwise equal voices', () => {
    const au = { name: 'Nicky', lang: 'en-AU', localService: true }
    const us = { name: 'Nicky', lang: 'en-US', localService: true }
    expect(scoreVoice(au)).toBeGreaterThan(scoreVoice(us))
  })

  it('refuses a voice that is not English at all', () => {
    expect(scoreVoice({ name: 'Google Deutsch', lang: 'de-DE', localService: false })).toBeLessThan(0)
    // The old code fell back to voices[0] and would have read English in it.
    expect(bestVoice([{ name: 'Anna', lang: 'de-DE' }])).toBeUndefined()
  })

  it('copes with a machine that only has one plain voice', () => {
    expect(bestVoice([{ name: 'Microsoft David', lang: 'en-US' }])?.name).toBe('Microsoft David')
    expect(bestVoice([])).toBeUndefined()
  })

  it('takes underscore language tags, which some browsers use', () => {
    expect(scoreVoice({ name: 'Karen', lang: 'en_AU' })).toBeGreaterThan(0)
  })
})
