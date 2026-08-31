/**
 * Sound effects, synthesised with WebAudio oscillators.
 *
 * No audio files: the whole game stays as text in git, and there is nothing to
 * download before it can be played.
 */

export type SfxName =
  | 'swordSwing'
  | 'enemyHit'
  | 'playerHurt'
  | 'rupee'
  | 'heart'
  | 'secret'
  | 'gateOpen'
  | 'correct'
  | 'wrong'
  | 'select'
  | 'fanfare'

interface Tone {
  freq: number
  /** Seconds from the start of the effect. */
  at: number
  duration: number
  type?: OscillatorType
  gain?: number
  /** Slide to this frequency over the tone's duration. */
  slideTo?: number
}

const PATCHES: Record<SfxName, Tone[]> = {
  swordSwing: [{ freq: 720, at: 0, duration: 0.07, type: 'square', slideTo: 320, gain: 0.14 }],
  enemyHit: [{ freq: 180, at: 0, duration: 0.1, type: 'sawtooth', slideTo: 70, gain: 0.18 }],
  playerHurt: [
    { freq: 320, at: 0, duration: 0.09, type: 'square', slideTo: 160, gain: 0.2 },
    { freq: 160, at: 0.09, duration: 0.16, type: 'square', slideTo: 80, gain: 0.18 },
  ],
  rupee: [
    { freq: 1180, at: 0, duration: 0.05, type: 'square', gain: 0.1 },
    { freq: 1560, at: 0.05, duration: 0.09, type: 'square', gain: 0.1 },
  ],
  heart: [
    { freq: 880, at: 0, duration: 0.06, type: 'triangle', gain: 0.14 },
    { freq: 1320, at: 0.06, duration: 0.12, type: 'triangle', gain: 0.14 },
  ],
  secret: [
    { freq: 659, at: 0, duration: 0.09, type: 'square', gain: 0.12 },
    { freq: 784, at: 0.09, duration: 0.09, type: 'square', gain: 0.12 },
    { freq: 988, at: 0.18, duration: 0.09, type: 'square', gain: 0.12 },
    { freq: 1319, at: 0.27, duration: 0.22, type: 'square', gain: 0.12 },
  ],
  gateOpen: [
    { freq: 220, at: 0, duration: 0.14, type: 'sawtooth', slideTo: 440, gain: 0.13 },
    { freq: 440, at: 0.14, duration: 0.22, type: 'triangle', slideTo: 880, gain: 0.13 },
  ],
  correct: [
    { freq: 784, at: 0, duration: 0.07, type: 'triangle', gain: 0.12 },
    { freq: 1047, at: 0.07, duration: 0.13, type: 'triangle', gain: 0.12 },
  ],
  wrong: [{ freq: 260, at: 0, duration: 0.18, type: 'triangle', slideTo: 200, gain: 0.1 }],
  select: [{ freq: 620, at: 0, duration: 0.04, type: 'square', gain: 0.08 }],
  fanfare: [
    { freq: 523, at: 0, duration: 0.12, type: 'square', gain: 0.12 },
    { freq: 659, at: 0.12, duration: 0.12, type: 'square', gain: 0.12 },
    { freq: 784, at: 0.24, duration: 0.12, type: 'square', gain: 0.12 },
    { freq: 1047, at: 0.36, duration: 0.3, type: 'square', gain: 0.14 },
  ],
}

export class Sfx {
  private context: AudioContext | undefined
  private muted = false

  /** Must be called from a user gesture before any sound will play. */
  prime(): void {
    if (this.context || typeof window === 'undefined') return
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!Ctor) return
    this.context = new Ctor()
  }

  setMuted(muted: boolean): void {
    this.muted = muted
  }

  isMuted(): boolean {
    return this.muted
  }

  play(name: SfxName): void {
    if (this.muted) return
    this.prime()
    const context = this.context
    if (!context) return
    if (context.state === 'suspended') void context.resume()

    const start = context.currentTime
    for (const tone of PATCHES[name]) {
      const osc = context.createOscillator()
      const gain = context.createGain()
      osc.type = tone.type ?? 'square'
      osc.frequency.setValueAtTime(tone.freq, start + tone.at)
      if (tone.slideTo !== undefined) {
        osc.frequency.exponentialRampToValueAtTime(
          Math.max(1, tone.slideTo),
          start + tone.at + tone.duration,
        )
      }
      const peak = tone.gain ?? 0.12
      gain.gain.setValueAtTime(0.0001, start + tone.at)
      gain.gain.exponentialRampToValueAtTime(peak, start + tone.at + 0.01)
      gain.gain.exponentialRampToValueAtTime(0.0001, start + tone.at + tone.duration)
      osc.connect(gain).connect(context.destination)
      osc.start(start + tone.at)
      osc.stop(start + tone.at + tone.duration + 0.02)
    }
  }
}

export const sfx = new Sfx()
