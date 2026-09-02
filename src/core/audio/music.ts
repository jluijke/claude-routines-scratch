/**
 * Background music, synthesised at runtime.
 *
 * These are original tunes written for this game, in the idiom of the era:
 * two pulse voices carrying melody and harmony, a triangle bass underneath,
 * and a whisper of noise for percussion — the voice layout of the NES sound
 * chip. Nothing here is transcribed from anyone else's music.
 *
 * The notation is one token per step, a step being an eighth note:
 *   'C4'  start this note      '-'  hold the previous one      '.'  silence
 *
 * Written that way so the music stays legible as source, and so a tune can be
 * adjusted without a tracker.
 */

export type TrackName = 'title' | 'overworld' | 'dungeon' | 'cave' | 'boss' | 'shop'

interface Voice {
  steps: string[]
  type: OscillatorType
  gain: number
  /** Slight detune in cents, which thickens two pulses playing together. */
  detune?: number
}

interface Track {
  /** Quarter-note beats per minute. A step is half a beat. */
  tempo: number
  voices: Voice[]
  /** Percussion: 'x' is a soft tick, '.' is silence. */
  drums?: string[]
}

// --- the tunes ------------------------------------------------------------

/** Bright and marching, for the overworld. Eight bars, then it comes round. */
const OVERWORLD: Track = {
  tempo: 132,
  voices: [
    {
      type: 'square',
      gain: 0.045,
      steps: [
        'G4', '.', 'B4', 'D5', 'G5', '-', 'D5', 'B4',
        'C5', '.', 'E5', 'G5', 'F#5', '-', 'D5', 'A4',
        'B4', '.', 'D5', 'G5', 'A5', '-', 'G5', 'E5',
        'D5', '.', 'B4', 'G4', 'A4', '-', '-', '.',
        'E5', '.', 'G5', 'B5', 'A5', '-', 'F#5', 'D5',
        'G5', '.', 'B5', 'D6', 'C6', '-', 'A5', 'F#5',
        'G5', '-', 'E5', '-', 'D5', '-', 'B4', '-',
        'A4', '-', 'G4', '-', 'G4', '-', '-', '.',
      ],
    },
    {
      type: 'square',
      gain: 0.026,
      detune: 6,
      steps: [
        '.', '.', 'G4', 'B4', '.', '.', 'B4', 'G4',
        '.', '.', 'C5', 'E5', '.', '.', 'A4', 'F#4',
        '.', '.', 'B4', 'D5', '.', '.', 'E5', 'C5',
        '.', '.', 'G4', 'D4', '.', '.', '.', '.',
        '.', '.', 'E5', 'G5', '.', '.', 'D5', 'A4',
        '.', '.', 'G5', 'B5', '.', '.', 'F#5', 'D5',
        '.', '.', 'B4', '.', 'G4', '.', 'D4', '.',
        '.', '.', 'B3', '.', 'B3', '.', '.', '.',
      ],
    },
    {
      type: 'triangle',
      gain: 0.06,
      steps: [
        'G2', '-', 'G2', '-', 'D3', '-', 'D3', '-',
        'C3', '-', 'C3', '-', 'D3', '-', 'D3', '-',
        'G2', '-', 'G2', '-', 'B2', '-', 'B2', '-',
        'D3', '-', 'D3', '-', 'G2', '-', '-', '-',
        'E3', '-', 'E3', '-', 'A2', '-', 'A2', '-',
        'G2', '-', 'G2', '-', 'D3', '-', 'D3', '-',
        'E3', '-', 'E3', '-', 'G2', '-', 'G2', '-',
        'D3', '-', 'D3', '-', 'G2', '-', '-', '-',
      ],
    },
  ],
  drums: [
    'x', '.', '.', '.', 'x', '.', '.', 'x',
    'x', '.', '.', '.', 'x', '.', '.', 'x',
    'x', '.', '.', '.', 'x', '.', '.', 'x',
    'x', '.', '.', '.', 'x', '.', 'x', '.',
    'x', '.', '.', '.', 'x', '.', '.', 'x',
    'x', '.', '.', '.', 'x', '.', '.', 'x',
    'x', '.', '.', '.', 'x', '.', '.', 'x',
    'x', '.', '.', '.', 'x', '.', 'x', '.',
  ],
}

/** Slow and unfriendly, for the dungeons. Deliberately sparse. */
const DUNGEON: Track = {
  tempo: 92,
  voices: [
    {
      type: 'square',
      gain: 0.035,
      steps: [
        'A3', '-', '-', '-', 'A#3', '-', 'A3', '-',
        'F3', '-', '-', '-', 'E3', '-', '-', '-',
        'A3', '-', '-', '-', 'C4', '-', 'A#3', '-',
        'A3', '-', '-', '-', '-', '-', '.', '.',
        'D4', '-', '-', '-', 'C4', '-', 'A#3', '-',
        'A3', '-', '-', '-', 'G3', '-', '-', '-',
        'F3', '-', 'G3', '-', 'A3', '-', 'C4', '-',
        'A3', '-', '-', '-', '-', '-', '.', '.',
      ],
    },
    {
      type: 'triangle',
      gain: 0.055,
      steps: [
        'A1', '-', '-', '-', '-', '-', '-', '-',
        'F1', '-', '-', '-', 'E1', '-', '-', '-',
        'A1', '-', '-', '-', '-', '-', '-', '-',
        'D2', '-', '-', '-', 'E1', '-', '-', '-',
        'D2', '-', '-', '-', '-', '-', '-', '-',
        'A1', '-', '-', '-', 'G1', '-', '-', '-',
        'F1', '-', '-', '-', 'A1', '-', '-', '-',
        'E1', '-', '-', '-', '-', '-', '-', '-',
      ],
    },
  ],
}

/** Small, close and echoing, for caves and grottos. */
const CAVE: Track = {
  tempo: 80,
  voices: [
    {
      type: 'triangle',
      gain: 0.04,
      steps: [
        'D4', '.', 'F4', '.', 'A4', '.', 'F4', '.',
        'D4', '.', 'F4', '.', 'A4', '.', 'D5', '.',
        'C4', '.', 'E4', '.', 'G4', '.', 'E4', '.',
        'C4', '.', 'E4', '.', 'G4', '.', '.', '.',
      ],
    },
    {
      type: 'triangle',
      gain: 0.05,
      steps: [
        'D2', '-', '-', '-', '-', '-', '-', '-',
        'D2', '-', '-', '-', '-', '-', '-', '-',
        'C2', '-', '-', '-', '-', '-', '-', '-',
        'C2', '-', '-', '-', '-', '-', '-', '-',
      ],
    },
  ],
}

/** Fast and pressing, for a boss chamber. */
const BOSS: Track = {
  tempo: 160,
  voices: [
    {
      type: 'square',
      gain: 0.042,
      steps: [
        'D4', 'D4', '.', 'D4', '.', 'D4', 'D#4', 'E4',
        'F4', 'F4', '.', 'F4', '.', 'F4', 'F#4', 'G4',
        'A4', '.', 'G4', '.', 'F4', '.', 'E4', '.',
        'D4', '.', '.', '.', 'D4', '.', '.', '.',
        'A4', 'A4', '.', 'A4', '.', 'A4', 'A#4', 'B4',
        'C5', '.', 'A#4', '.', 'A4', '.', 'G4', '.',
        'F4', '.', 'E4', '.', 'D4', '.', 'C#4', '.',
        'D4', '-', '-', '-', '.', '.', '.', '.',
      ],
    },
    {
      type: 'triangle',
      gain: 0.06,
      steps: [
        'D1', '.', 'D1', '.', 'D1', '.', 'D1', '.',
        'D1', '.', 'D1', '.', 'D1', '.', 'D1', '.',
        'F1', '.', 'F1', '.', 'E1', '.', 'E1', '.',
        'D1', '.', 'D1', '.', 'D1', '.', 'D1', '.',
        'A1', '.', 'A1', '.', 'A1', '.', 'A1', '.',
        'F1', '.', 'F1', '.', 'E1', '.', 'E1', '.',
        'D1', '.', 'D1', '.', 'A1', '.', 'A1', '.',
        'D1', '-', '-', '-', '.', '.', '.', '.',
      ],
    },
  ],
  drums: [
    'x', '.', 'x', '.', 'x', '.', 'x', 'x',
    'x', '.', 'x', '.', 'x', '.', 'x', 'x',
    'x', '.', 'x', '.', 'x', '.', 'x', 'x',
    'x', '.', 'x', '.', 'x', 'x', 'x', 'x',
    'x', '.', 'x', '.', 'x', '.', 'x', 'x',
    'x', '.', 'x', '.', 'x', '.', 'x', 'x',
    'x', '.', 'x', '.', 'x', '.', 'x', 'x',
    'x', '.', '.', '.', '.', '.', '.', '.',
  ],
}

/** Warm and unhurried, for the title screen. */
const TITLE: Track = {
  tempo: 100,
  voices: [
    {
      type: 'square',
      gain: 0.04,
      steps: [
        'D4', '.', 'G4', '.', 'B4', '.', 'D5', '.',
        'C5', '-', '-', '.', 'B4', '-', '-', '.',
        'A4', '.', 'C5', '.', 'E5', '.', 'G5', '.',
        'F#5', '-', '-', '-', '-', '-', '.', '.',
        'B4', '.', 'D5', '.', 'G5', '.', 'B5', '.',
        'A5', '-', '-', '.', 'F#5', '-', '-', '.',
        'G5', '-', 'D5', '-', 'B4', '-', 'G4', '-',
        'A4', '-', '-', '-', '-', '-', '.', '.',
      ],
    },
    {
      type: 'triangle',
      gain: 0.05,
      steps: [
        'G2', '-', '-', '-', 'G2', '-', '-', '-',
        'C3', '-', '-', '-', 'D3', '-', '-', '-',
        'A2', '-', '-', '-', 'A2', '-', '-', '-',
        'D3', '-', '-', '-', '-', '-', '-', '-',
        'G2', '-', '-', '-', 'G2', '-', '-', '-',
        'D3', '-', '-', '-', 'D3', '-', '-', '-',
        'G2', '-', '-', '-', 'B2', '-', '-', '-',
        'D3', '-', '-', '-', 'G2', '-', '-', '-',
      ],
    },
  ],
}

/** A short lilt for the shop. */
const SHOP: Track = {
  tempo: 120,
  voices: [
    {
      type: 'square',
      gain: 0.038,
      steps: [
        'C5', '.', 'E5', '.', 'G5', '.', 'E5', '.',
        'F5', '.', 'A5', '.', 'G5', '-', '-', '.',
      ],
    },
    {
      type: 'triangle',
      gain: 0.05,
      steps: [
        'C3', '-', '-', '-', 'G2', '-', '-', '-',
        'F2', '-', '-', '-', 'G2', '-', '-', '-',
      ],
    },
  ],
}

const TRACKS: Record<TrackName, Track> = {
  title: TITLE,
  overworld: OVERWORLD,
  dungeon: DUNGEON,
  cave: CAVE,
  boss: BOSS,
  shop: SHOP,
}

// --- playback -------------------------------------------------------------

const SEMITONES: Record<string, number> = {
  C: 0, 'C#': 1, D: 2, 'D#': 3, E: 4, F: 5, 'F#': 6, G: 7, 'G#': 8, A: 9, 'A#': 10, B: 11,
}

/** "F#5" -> frequency in hertz. */
export function noteToFrequency(note: string): number {
  const match = /^([A-G]#?)(-?\d)$/.exec(note)
  if (!match) return 0
  const semitone = SEMITONES[match[1] as string]
  if (semitone === undefined) return 0
  const midi = (Number(match[2]) + 1) * 12 + semitone
  return 440 * 2 ** ((midi - 69) / 12)
}

/** How long each note actually sounds, in steps. */
export function noteLengths(steps: readonly string[]): { at: number; note: string; steps: number }[] {
  const notes: { at: number; note: string; steps: number }[] = []
  for (let i = 0; i < steps.length; i++) {
    const token = steps[i] as string
    if (token === '.' || token === '-') continue
    let length = 1
    while (i + length < steps.length && steps[i + length] === '-') length++
    notes.push({ at: i, note: token, steps: length })
  }
  return notes
}

const LOOKAHEAD_SECONDS = 0.15
const TICK_MS = 30

export class Music {
  private context: AudioContext | undefined
  private master: GainNode | undefined
  private timer = 0
  private current: TrackName | undefined
  /**
   * The track the game has asked for, whether or not a note has been heard yet.
   *
   * These are two different questions and conflating them is what made the game
   * silent for so long: the title tune was requested before the child had
   * touched anything, the browser refused, and the field that said "playing"
   * was set anyway. Now `wanted` remembers the request and `current` means
   * sound is actually coming out.
   */
  private wanted: TrackName | undefined
  private step = 0
  private nextStepTime = 0
  private muted = false
  private volume = 1

  /**
   * Must be called from a user gesture; browsers block audio before one.
   *
   * A context built outside a gesture is born suspended and stays that way, so
   * this both builds one and revives one that was built too early — and then
   * starts whatever track was asked for while nothing could be heard.
   */
  prime(): void {
    if (typeof window === 'undefined') return
    if (!this.context) {
      const Ctor =
        window.AudioContext ??
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
      if (!Ctor) return
      this.context = new Ctor()
      this.master = this.context.createGain()
      this.master.gain.value = this.muted ? 0 : this.volume
      this.master.connect(this.context.destination)
    }
    // resume() is a promise, and until it settles the context clock is still
    // frozen — starting the scheduler off that clock would schedule a burst of
    // past-dated notes rather than a tune. So wait for it.
    if (this.context.state === 'suspended') {
      void this.context.resume().then(() => this.startWanted())
      return
    }
    this.startWanted()
  }

  private startWanted(): void {
    if (this.wanted && this.wanted !== this.current) this.begin(this.wanted)
  }

  isMuted(): boolean {
    return this.muted
  }

  setMuted(muted: boolean): void {
    this.muted = muted
    if (this.master && this.context) {
      this.master.gain.setTargetAtTime(muted ? 0 : this.volume, this.context.currentTime, 0.05)
    }
  }

  /** 0 to 1. Used to duck the music rather than stop it. */
  setVolume(volume: number): void {
    this.volume = Math.max(0, Math.min(1, volume))
    if (this.master && this.context && !this.muted) {
      this.master.gain.setTargetAtTime(this.volume, this.context.currentTime, 0.08)
    }
  }

  /** The track being heard, which before the first gesture is none. */
  playing(): TrackName | undefined {
    return this.current
  }

  /** The track asked for, heard or not. */
  requested(): TrackName | undefined {
    return this.wanted
  }

  /**
   * What is really happening, for anything that needs to know rather than hope
   * — the checks especially. A suspended context's clock is frozen, so a clock
   * that advances is the one piece of evidence that cannot be faked by a field.
   */
  status(): { state: AudioContextState | 'none'; track: TrackName | undefined; clock: number } {
    return {
      state: this.context?.state ?? 'none',
      track: this.current,
      clock: this.context?.currentTime ?? 0,
    }
  }

  /**
   * Switches tracks. Playing the track already on is a no-op.
   *
   * Deliberately does *not* build an audio context. Called before the child has
   * clicked anything it only records the wish; `prime()`, which runs inside a
   * real gesture, is what makes it audible. That is what the title screen has
   * always claimed to do.
   */
  play(name: TrackName): void {
    if (this.wanted === name && this.current === name) return
    this.wanted = name
    if (!this.context || this.context.state !== 'running') return
    this.begin(name)
  }

  /** Actually starts the scheduler. Only ever called with a live context. */
  private begin(name: TrackName): void {
    const context = this.context
    if (!context) return
    this.stopScheduler()
    this.current = name
    this.step = 0
    this.nextStepTime = context.currentTime + 0.05
    this.timer = window.setInterval(() => this.schedule(), TICK_MS)
  }

  stop(): void {
    this.wanted = undefined
    this.stopScheduler()
  }

  private stopScheduler(): void {
    if (this.timer) window.clearInterval(this.timer)
    this.timer = 0
    this.current = undefined
  }

  private schedule(): void {
    const context = this.context
    const track = this.current ? TRACKS[this.current] : undefined
    if (!context || !track || !this.master) return

    const stepSeconds = 30 / track.tempo
    const length = Math.max(...track.voices.map((v) => v.steps.length), track.drums?.length ?? 0)

    while (this.nextStepTime < context.currentTime + LOOKAHEAD_SECONDS) {
      const index = this.step % length
      for (const voice of track.voices) {
        const token = voice.steps[index % voice.steps.length]
        if (!token || token === '.' || token === '-') continue
        // How long to hold it: until the next non-hold token.
        let held = 1
        while (voice.steps[(index + held) % voice.steps.length] === '-') held++
        this.playNote(voice, token, this.nextStepTime, held * stepSeconds)
      }
      if (track.drums && track.drums[index % track.drums.length] === 'x') {
        this.playTick(this.nextStepTime)
      }
      this.nextStepTime += stepSeconds
      this.step += 1
    }
  }

  private playNote(voice: Voice, note: string, at: number, duration: number): void {
    const context = this.context
    if (!context || !this.master) return
    const frequency = noteToFrequency(note)
    if (frequency <= 0) return

    const osc = context.createOscillator()
    const gain = context.createGain()
    osc.type = voice.type
    osc.frequency.setValueAtTime(frequency, at)
    if (voice.detune) osc.detune.setValueAtTime(voice.detune, at)

    // A short attack and a gentle decay, so notes do not click.
    const sustain = Math.max(0.05, duration * 0.85)
    gain.gain.setValueAtTime(0.0001, at)
    gain.gain.exponentialRampToValueAtTime(voice.gain, at + 0.012)
    gain.gain.exponentialRampToValueAtTime(0.0001, at + sustain)

    osc.connect(gain).connect(this.master)
    osc.start(at)
    osc.stop(at + sustain + 0.02)
  }

  /** A very soft noise tick, standing in for the NES noise channel. */
  private playTick(at: number): void {
    const context = this.context
    if (!context || !this.master) return
    const frames = Math.floor(context.sampleRate * 0.03)
    const buffer = context.createBuffer(1, frames, context.sampleRate)
    const data = buffer.getChannelData(0)
    for (let i = 0; i < frames; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / frames)

    const source = context.createBufferSource()
    source.buffer = buffer
    const gain = context.createGain()
    gain.gain.setValueAtTime(0.018, at)
    gain.gain.exponentialRampToValueAtTime(0.0001, at + 0.03)
    source.connect(gain).connect(this.master)
    source.start(at)
  }
}

export const music = new Music()
