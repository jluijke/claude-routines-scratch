/**
 * Spoken words and sentences — spec §7.
 *
 * Everything goes through the SpeechEngine interface, so pre-generated
 * Australian audio files can replace the browser voice later without touching
 * a single exercise definition.
 */

export interface SpeakOptions {
  /** 1 is normal. The slow replay button uses 0.6. */
  rate?: number
  onEnd?: () => void
}

export interface SpeechEngine {
  /** True once a voice is available and the browser will actually speak. */
  ready(): boolean
  speak(text: string, options?: SpeakOptions): void
  cancel(): void
  /** Human-readable name of the chosen voice, for the parent dashboard. */
  voiceName(): string
  /**
   * Browsers refuse to speak before the user has interacted with the page.
   * Call this from the first click or keypress.
   */
  prime(): void
}

/** Voice preference: Australian first, then British, then anything English. */
const VOICE_PREFERENCE = [
  (v: SpeechSynthesisVoice) => v.lang === 'en-AU',
  (v: SpeechSynthesisVoice) => v.lang.replace('_', '-').startsWith('en-AU'),
  (v: SpeechSynthesisVoice) => v.lang.replace('_', '-').startsWith('en-GB'),
  (v: SpeechSynthesisVoice) => v.lang.replace('_', '-').startsWith('en-NZ'),
  (v: SpeechSynthesisVoice) => v.lang.toLowerCase().startsWith('en'),
]

export class WebSpeechEngine implements SpeechEngine {
  private voice: SpeechSynthesisVoice | undefined
  private primed = false
  private readonly synth: SpeechSynthesis | undefined

  constructor() {
    this.synth = typeof window !== 'undefined' ? window.speechSynthesis : undefined
    if (!this.synth) return
    this.pickVoice()
    // Voices load asynchronously in Chrome; re-pick when the list arrives.
    this.synth.addEventListener?.('voiceschanged', () => this.pickVoice())
  }

  private pickVoice(): void {
    if (!this.synth) return
    const voices = this.synth.getVoices()
    if (voices.length === 0) return
    for (const test of VOICE_PREFERENCE) {
      const found = voices.find(test)
      if (found) {
        this.voice = found
        return
      }
    }
    this.voice = voices[0]
  }

  ready(): boolean {
    return this.synth !== undefined
  }

  voiceName(): string {
    if (!this.synth) return 'no voice available'
    return this.voice ? `${this.voice.name} (${this.voice.lang})` : 'default voice'
  }

  prime(): void {
    if (this.primed || !this.synth) return
    this.primed = true
    // An empty utterance unlocks speech on Safari and iOS.
    const warmup = new SpeechSynthesisUtterance(' ')
    warmup.volume = 0
    this.synth.speak(warmup)
    this.pickVoice()
  }

  speak(text: string, options: SpeakOptions = {}): void {
    if (!this.synth) {
      options.onEnd?.()
      return
    }
    this.synth.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    if (this.voice) utterance.voice = this.voice
    utterance.lang = this.voice?.lang ?? 'en-AU'
    utterance.rate = options.rate ?? 1
    utterance.pitch = 1
    if (options.onEnd) utterance.addEventListener('end', () => options.onEnd?.())
    this.synth.speak(utterance)
  }

  cancel(): void {
    this.synth?.cancel()
  }
}

/** Used by tests and by the content validator, where there is no browser. */
export class SilentSpeechEngine implements SpeechEngine {
  readonly spoken: string[] = []
  ready(): boolean {
    return true
  }
  speak(text: string, options?: SpeakOptions): void {
    this.spoken.push(text)
    options?.onEnd?.()
  }
  cancel(): void {}
  voiceName(): string {
    return 'silent'
  }
  prime(): void {}
}

/**
 * Words a speech synthesiser reads as a letter sequence or the wrong way
 * round. Spelling them phonetically keeps dictation honest.
 */
const PRONUNCIATION_FIXES: Record<string, string> = {
  read: 'reed',
  live: 'liv',
  wind: 'wind',
  bow: 'boh',
  row: 'roh',
  tear: 'teer',
  lead: 'leed',
  close: 'klohz',
}

/** Speak a single word clearly, applying any pronunciation fix it needs. */
export function speakWord(engine: SpeechEngine, word: string, options?: SpeakOptions): void {
  const fixed = PRONUNCIATION_FIXES[word.toLowerCase()]
  engine.speak(fixed ?? word, options)
}
