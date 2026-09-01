/**
 * Spoken words and sentences — spec §7.
 *
 * Everything goes through the SpeechEngine interface, so pre-generated
 * Australian audio files can replace the browser voice later without touching
 * a single exercise definition.
 */

export interface SpeakOptions {
  /** 1 is normal. The slow replay button uses SLOW_WORD_RATE. */
  rate?: number
  onEnd?: () => void
}

export interface SequenceOptions extends SpeakOptions {
  /** Silence between parts, in milliseconds. */
  gapMs?: number
}

/**
 * The Slower button. Half speed, and slow enough that the end of the word
 * survives — on a spelling program the difference between "cat" and "cap" is
 * the whole question.
 */
export const SLOW_WORD_RATE = 0.5
/** Sentences turn to mud below this, so they get their own floor. */
export const SLOW_SENTENCE_RATE = 0.55

export interface SpeechEngine {
  /** True once a voice is available and the browser will actually speak. */
  ready(): boolean
  speak(text: string, options?: SpeakOptions): void
  /** Speaks each part in turn with a gap, without one cutting off the next. */
  speakSequence(parts: string[], options?: SequenceOptions): void
  cancel(): void
  /** Human-readable name of the chosen voice, for the parent dashboard. */
  voiceName(): string
  /** Every usable English voice, best first. */
  voices(): SpeechSynthesisVoice[]
  /** Override the chosen voice by name; undefined restores the best guess. */
  useVoice(name: string | undefined): void
  /** Name of the voice in use, for remembering the choice. */
  chosenVoiceName(): string | undefined
  /**
   * Browsers refuse to speak before the user has interacted with the page.
   * Call this from the first click or keypress.
   */
  prime(): void
}

/** The parts of a voice this code cares about. Kept narrow so it is testable. */
export interface VoiceLike {
  name: string
  lang: string
  /** False for network voices, which are markedly clearer than local ones. */
  localService?: boolean
}

/**
 * Voices that exist to be funny.
 *
 * macOS ships these in every English locale, Australian included, and the old
 * rule took the *first* en-AU voice it found — so a child could have his
 * spelling words read to him by a cartoon grandmother. They are never a
 * reasonable choice for this, so they are refused outright rather than ranked
 * low.
 */
const NOVELTY_VOICES = [
  'albert', 'bad news', 'bahh', 'bells', 'boing', 'bubbles', 'cellos', 'deranged',
  'eddy', 'flo', 'good news', 'grandma', 'grandpa', 'hysterical', 'jester', 'junior',
  'kathy', 'organ', 'princess', 'ralph', 'reed', 'rocko', 'sandy', 'shelley',
  'superstar', 'trinoids', 'whisper', 'wobble', 'zarvox',
]

/** Voices known to be clear enough to spell along with, best first. */
const GOOD_VOICES = [
  'google uk english female',
  'google uk english',
  'google us english',
  'google',
  'natural', // Microsoft's Natural family, the best in any browser
  'karen',
  'daniel',
  'serena',
  'samantha',
  'alex',
  'premium',
  'enhanced',
]

/** Accent, as a tie-break only. Australian spelling, British is close enough. */
const LOCALE_RANK = ['en-au', 'en-gb', 'en-nz', 'en-ie', 'en-us']

export function isNoveltyVoice(name: string): boolean {
  const lower = name.toLowerCase()
  return NOVELTY_VOICES.some((joke) => lower === joke || lower.startsWith(`${joke} `) || lower.startsWith(`${joke}(`))
}

/**
 * How suitable a voice is for reading spelling words aloud. Higher is better;
 * a negative score means never use it.
 *
 * Quality comes first and accent second, which is the opposite of what this
 * used to do. A clear British voice teaches a word better than a robotic or
 * comic Australian one, and the spelling is the same either way.
 */
export function scoreVoice(voice: VoiceLike): number {
  const lang = voice.lang.replace('_', '-').toLowerCase()
  if (!lang.startsWith('en')) return -1
  if (isNoveltyVoice(voice.name)) return -1

  const name = voice.name.toLowerCase()
  const known = GOOD_VOICES.findIndex((good) => name.includes(good))
  // Known-good names dominate: the best of them outranks any accent match.
  let score = known >= 0 ? 1000 - known * 10 : 0

  // A network voice is nearly always the better of two otherwise equal ones.
  if (voice.localService === false) score += 40

  const locale = LOCALE_RANK.findIndex((tag) => lang.startsWith(tag))
  score += locale >= 0 ? 30 - locale * 5 : 0
  return score
}

/** The best voice available, or undefined if none is usable. */
export function bestVoice<T extends VoiceLike>(voices: readonly T[]): T | undefined {
  let best: { voice: T; score: number } | undefined
  for (const voice of voices) {
    const score = scoreVoice(voice)
    if (score < 0) continue
    if (!best || score > best.score) best = { voice, score }
  }
  return best?.voice
}

export class WebSpeechEngine implements SpeechEngine {
  private voice: SpeechSynthesisVoice | undefined
  /** Chosen by ear in the parent dashboard, and remembered per device. */
  private preferred: string | undefined
  private primed = false
  /** Bumped by every new request, so an old sequence stops chaining. */
  private turn = 0
  private readonly synth: SpeechSynthesis | undefined

  constructor(preferredVoice?: string) {
    this.preferred = preferredVoice
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

    // A voice chosen by ear in the parent dashboard beats any guess made here.
    if (this.preferred) {
      const chosen = voices.find((v) => v.name === this.preferred)
      if (chosen) {
        this.voice = chosen
        return
      }
    }
    // Never fall back to voices[0]: on a machine with no English voice at all
    // that used to pick, say, a German one and read English words in it.
    this.voice = bestVoice(voices)
  }

  /** Every English voice this browser offers, best first. For the picker. */
  voices(): SpeechSynthesisVoice[] {
    if (!this.synth) return []
    return this.synth
      .getVoices()
      .filter((v) => scoreVoice(v) >= 0)
      .sort((a, b) => scoreVoice(b) - scoreVoice(a))
  }

  /** Use this voice from now on. Pass undefined to go back to the best guess. */
  useVoice(name: string | undefined): void {
    this.preferred = name
    this.pickVoice()
  }

  /** The voice actually in use, by name, or undefined if there is none. */
  chosenVoiceName(): string | undefined {
    return this.voice?.name
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
    this.turn += 1
    this.utter(text, options.rate ?? 1, options.onEnd)
  }

  /**
   * Says each part in turn, waiting for one to finish before starting the next.
   * Chaining on the 'end' event rather than guessing with timers means a slow
   * word is never clipped by the one behind it.
   */
  speakSequence(parts: string[], options: SequenceOptions = {}): void {
    if (!this.synth || parts.length === 0) {
      options.onEnd?.()
      return
    }
    this.synth.cancel()
    const mine = ++this.turn
    const gap = options.gapMs ?? 450

    const sayFrom = (index: number): void => {
      // A newer request has taken over; abandon this one quietly.
      if (mine !== this.turn) return
      const part = parts[index]
      if (part === undefined) {
        options.onEnd?.()
        return
      }
      this.utter(part, options.rate ?? 1, () => {
        if (mine !== this.turn) return
        window.setTimeout(() => sayFrom(index + 1), gap)
      })
    }
    sayFrom(0)
  }

  private utter(text: string, rate: number, onEnd?: () => void): void {
    if (!this.synth) return
    const utterance = new SpeechSynthesisUtterance(text)
    if (this.voice) utterance.voice = this.voice
    utterance.lang = this.voice?.lang ?? 'en-AU'
    utterance.rate = rate
    utterance.pitch = 1
    utterance.volume = 1
    if (onEnd) utterance.addEventListener('end', onEnd)
    this.synth.speak(utterance)
  }

  cancel(): void {
    this.turn += 1
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
  speakSequence(parts: string[], options?: SequenceOptions): void {
    this.spoken.push(...parts)
    options?.onEnd?.()
  }
  cancel(): void {}
  voiceName(): string {
    return 'silent'
  }
  voices(): SpeechSynthesisVoice[] {
    return []
  }
  useVoice(): void {}
  chosenVoiceName(): string | undefined {
    return undefined
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

function sayable(word: string): string {
  // The full stop matters: without it voices clip the final consonant, and
  // hearing the end of the word is most of the task.
  return `${PRONUNCIATION_FIXES[word.toLowerCase()] ?? word}.`
}

/** Speak a single word clearly, applying any pronunciation fix it needs. */
export function speakWord(engine: SpeechEngine, word: string, options?: SpeakOptions): void {
  engine.speak(sayable(word), options)
}

/**
 * The Slower button on a single word: half speed, and said twice with a beat
 * between, the way a teacher repeats a spelling word.
 */
export function speakWordSlowly(engine: SpeechEngine, word: string): void {
  const said = sayable(word)
  engine.speakSequence([said, said], { rate: SLOW_WORD_RATE, gapMs: 650 })
}
