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
  | 'wings'
  | 'bossFanfare'
  | 'itemGet'
  | 'bark'

interface Tone {
  kind?: 'tone'
  freq: number
  /** Seconds from the start of the effect. */
  at: number
  duration: number
  type?: OscillatorType
  gain?: number
  /** Slide to this frequency over the tone's duration. */
  slideTo?: number
}

/**
 * Filtered noise, for sounds that are air rather than pitch. A blade through
 * the air is a band of noise sweeping downward — an oscillator can only ever
 * make it a blip.
 */
interface Noise {
  kind: 'noise'
  at: number
  duration: number
  /** Bandpass centre at the start and at the end, in hertz. */
  from: number
  to: number
  gain?: number
  /** Higher is a narrower, more whistling sweep. */
  q?: number
}

type Sound = Tone | Noise

const PATCHES: Record<SfxName, Sound[]> = {
  // A swoosh: a narrow band of noise falling away, with a touch of body under
  // it so it carries on small speakers.
  swordSwing: [
    { kind: 'noise', at: 0, duration: 0.14, from: 2200, to: 420, gain: 0.16, q: 6 },
    { freq: 380, at: 0.01, duration: 0.07, type: 'triangle', slideTo: 180, gain: 0.05 },
  ],
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

  // Three heavy beats of air, a glide, and the thump of landing. Noise rather
  // than oscillators, because a wingbeat is air being moved and a tone on its
  // own is just a bleep. The beats fall at 0.00 / 0.36 / 0.72 s, which is the
  // same rhythm the wings are drawn flapping at.
  wings: [
    { kind: 'noise', at: 0, duration: 0.2, from: 900, to: 240, gain: 0.17, q: 2 },
    { freq: 150, at: 0.02, duration: 0.12, type: 'triangle', slideTo: 90, gain: 0.09 },
    { kind: 'noise', at: 0.36, duration: 0.2, from: 980, to: 260, gain: 0.15, q: 2 },
    { freq: 165, at: 0.38, duration: 0.12, type: 'triangle', slideTo: 95, gain: 0.08 },
    { kind: 'noise', at: 0.72, duration: 0.2, from: 1060, to: 280, gain: 0.13, q: 2 },
    { freq: 180, at: 0.74, duration: 0.12, type: 'triangle', slideTo: 100, gain: 0.07 },
    // The glide down: a thin band of air rising as the ground comes up.
    { kind: 'noise', at: 0.95, duration: 0.26, from: 320, to: 1400, gain: 0.08, q: 8 },
    // Touchdown.
    { kind: 'noise', at: 1.21, duration: 0.1, from: 600, to: 120, gain: 0.14, q: 1.5 },
    { freq: 120, at: 1.21, duration: 0.14, type: 'triangle', slideTo: 60, gain: 0.1 },
  ],

  // A small dog. Two short yaps: a band of noise for the breath and a quick
  // falling tone for the voice, pitched high because he is little.
  bark: [
    { kind: 'noise', at: 0, duration: 0.05, from: 1800, to: 600, gain: 0.1, q: 3 },
    { freq: 620, at: 0, duration: 0.07, type: 'square', slideTo: 380, gain: 0.09 },
    { kind: 'noise', at: 0.11, duration: 0.05, from: 1900, to: 640, gain: 0.09, q: 3 },
    { freq: 680, at: 0.11, duration: 0.07, type: 'square', slideTo: 420, gain: 0.08 },
  ],

  // Holding something up over your head deserves its own tune. Shorter and
  // brighter than the boss fanfare — a rising run that lands on a held octave,
  // with the bass climbing under it and a little sparkle off the top. Two and a
  // bit seconds, matched to how long he holds it up.
  itemGet: [
    { freq: 523, at: 0, duration: 0.09, type: 'square', gain: 0.13 },
    { freq: 659, at: 0.09, duration: 0.09, type: 'square', gain: 0.13 },
    { freq: 784, at: 0.18, duration: 0.09, type: 'square', gain: 0.13 },
    { freq: 1047, at: 0.27, duration: 0.2, type: 'square', gain: 0.14 },
    { freq: 131, at: 0, duration: 0.46, type: 'triangle', gain: 0.09 },
    // Up a step and hold, the way the moment holds.
    { freq: 988, at: 0.47, duration: 0.1, type: 'square', gain: 0.13 },
    { freq: 1047, at: 0.57, duration: 0.1, type: 'square', gain: 0.13 },
    { freq: 1175, at: 0.67, duration: 0.1, type: 'square', gain: 0.13 },
    { freq: 165, at: 0.47, duration: 0.3, type: 'triangle', gain: 0.09 },
    { kind: 'noise', at: 0.77, duration: 0.3, from: 6000, to: 1400, gain: 0.09, q: 1 },
    { freq: 1319, at: 0.77, duration: 0.62, type: 'square', gain: 0.14 },
    { freq: 1047, at: 0.77, duration: 0.62, type: 'triangle', gain: 0.07 },
    { freq: 196, at: 0.77, duration: 0.62, type: 'triangle', gain: 0.09 },
    // The sparkle, as the light comes off it.
    { freq: 1568, at: 1.42, duration: 0.08, type: 'square', gain: 0.07 },
    { freq: 2093, at: 1.5, duration: 0.08, type: 'square', gain: 0.07 },
    { freq: 2637, at: 1.58, duration: 0.24, type: 'square', gain: 0.07 },
  ],

  // The big one. `fanfare` is four notes for a chest; a dungeon guardian gets a
  // pickup, a climb, a held top note over its own harmony, and a crash under
  // each landing. Two seconds, which is what a sign this size is worth.
  bossFanfare: [
    { kind: 'noise', at: 0, duration: 0.28, from: 6000, to: 1200, gain: 0.12, q: 1 },
    { freq: 131, at: 0, duration: 0.3, type: 'triangle', gain: 0.1 },
    { freq: 392, at: 0, duration: 0.1, type: 'square', gain: 0.12 },
    { freq: 523, at: 0.1, duration: 0.1, type: 'square', gain: 0.12 },
    { freq: 659, at: 0.2, duration: 0.1, type: 'square', gain: 0.12 },
    { freq: 784, at: 0.3, duration: 0.22, type: 'square', gain: 0.13 },
    { freq: 196, at: 0.3, duration: 0.22, type: 'triangle', gain: 0.1 },
    { freq: 659, at: 0.52, duration: 0.11, type: 'square', gain: 0.12 },
    { freq: 784, at: 0.63, duration: 0.11, type: 'square', gain: 0.12 },
    { freq: 131, at: 0.52, duration: 0.22, type: 'triangle', gain: 0.1 },
    { kind: 'noise', at: 0.74, duration: 0.22, from: 5000, to: 900, gain: 0.1, q: 1 },
    { freq: 1047, at: 0.74, duration: 0.34, type: 'square', gain: 0.14 },
    { freq: 175, at: 0.74, duration: 0.34, type: 'triangle', gain: 0.1 },
    { freq: 988, at: 1.08, duration: 0.11, type: 'square', gain: 0.12 },
    { freq: 1047, at: 1.19, duration: 0.11, type: 'square', gain: 0.12 },
    { freq: 1175, at: 1.3, duration: 0.11, type: 'square', gain: 0.12 },
    { freq: 196, at: 1.08, duration: 0.33, type: 'triangle', gain: 0.1 },
    // The note the whole thing has been climbing towards, with its own chord
    // under it. Peak simultaneous gain here is 0.52 — the effects share no
    // master gain, so anything much above that clips.
    { kind: 'noise', at: 1.41, duration: 0.55, from: 7000, to: 800, gain: 0.14, q: 0.8 },
    { freq: 1319, at: 1.41, duration: 0.62, type: 'square', gain: 0.14 },
    { freq: 1047, at: 1.41, duration: 0.62, type: 'triangle', gain: 0.07 },
    { freq: 784, at: 1.41, duration: 0.62, type: 'triangle', gain: 0.07 },
    { freq: 131, at: 1.41, duration: 0.66, type: 'triangle', gain: 0.1 },
    // Three sparks off the top, as the sign appears.
    { freq: 1319, at: 1.75, duration: 0.07, type: 'square', gain: 0.06 },
    { freq: 1568, at: 1.82, duration: 0.07, type: 'square', gain: 0.06 },
    { freq: 2093, at: 1.89, duration: 0.18, type: 'square', gain: 0.06 },
  ],
}

export class Sfx {
  private context: AudioContext | undefined
  private muted = false

  /**
   * Must be called from a user gesture before any sound will play.
   *
   * Also revives a context that was built too early: one made without a gesture
   * starts suspended, and returning early because "a context exists" leaves it
   * that way for the life of the page. That is what silenced the music.
   */
  prime(): void {
    if (typeof window === 'undefined') return
    if (!this.context) {
      const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
      if (!Ctor) return
      this.context = new Ctor()
    }
    if (this.context.state === 'suspended') void this.context.resume()
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
    for (const sound of PATCHES[name]) {
      if (sound.kind === 'noise') {
        this.playNoise(context, sound, start)
        continue
      }
      const tone = sound
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

  /** White noise through a bandpass that sweeps, which is what a swoosh is. */
  private playNoise(context: AudioContext, noise: Noise, start: number): void {
    const at = start + noise.at
    const frames = Math.max(1, Math.floor(context.sampleRate * noise.duration))
    const buffer = context.createBuffer(1, frames, context.sampleRate)
    const data = buffer.getChannelData(0)
    for (let i = 0; i < frames; i++) data[i] = Math.random() * 2 - 1

    const source = context.createBufferSource()
    source.buffer = buffer

    const filter = context.createBiquadFilter()
    filter.type = 'bandpass'
    filter.Q.value = noise.q ?? 4
    filter.frequency.setValueAtTime(noise.from, at)
    filter.frequency.exponentialRampToValueAtTime(Math.max(20, noise.to), at + noise.duration)

    const gain = context.createGain()
    const peak = noise.gain ?? 0.14
    // Quick in, slow out: the swing is fastest at the start.
    gain.gain.setValueAtTime(0.0001, at)
    gain.gain.exponentialRampToValueAtTime(peak, at + 0.015)
    gain.gain.exponentialRampToValueAtTime(0.0001, at + noise.duration)

    source.connect(filter).connect(gain).connect(context.destination)
    source.start(at)
    source.stop(at + noise.duration + 0.02)
  }
}

export const sfx = new Sfx()
